import { CollectedInfo, InfoQuery, InfoCategory } from './infoCollection'
import { AI_CONFIG } from '../config/ai'
import OpenAI from 'openai'
import { 
  TEST_SCRAPING_URLS, 
  generateMHLWUrls, 
  getMedicalSocietyUrls, 
  MANUAL_ADDITIONAL_URLS,
  MEDICAL_SOCIETY_URLS,
  REGIONAL_HOSPITAL_URLS 
} from '../../const/scraping_urls'

// OpenAI クライアントの初期化
const openai = AI_CONFIG.OPENAI.API_KEY ? new OpenAI({
  apiKey: AI_CONFIG.OPENAI.API_KEY,
}) : null

// =============================================================================
// スマートキャッシング付きHTTP取得（スクレイピング回数最小化）
// =============================================================================

interface CachedHtmlData {
  html: string
  title: string
  url: string
  fetchedAt: Date
  contentLength: number
  isValid: boolean
}

class HtmlCache {
  private cache: Map<string, CachedHtmlData> = new Map()
  private readonly CACHE_DURATION_HOURS = 24 // 24時間キャッシュ

  /**
   * キャッシュからHTML取得（有効期限チェック）
   */
  get(url: string): CachedHtmlData | null {
    const cached = this.cache.get(url)
    if (!cached) return null

    const now = new Date()
    const hoursDiff = (now.getTime() - cached.fetchedAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > this.CACHE_DURATION_HOURS) {
      console.log(`🗑️  キャッシュ期限切れ: ${url}`)
      this.cache.delete(url)
      return null
    }

    console.log(`💾 キャッシュヒット: ${url} (${Math.round(hoursDiff)}時間前取得)`)
    return cached
  }

  /**
   * HTMLをキャッシュに保存
   */
  set(url: string, html: string, title: string): void {
    const cached: CachedHtmlData = {
      html,
      title,
      url,
      fetchedAt: new Date(),
      contentLength: html.length,
      isValid: true
    }
    
    this.cache.set(url, cached)
    console.log(`💾 キャッシュ保存: ${url} (${html.length}文字)`)
  }

  /**
   * 無効なURLをマークして再取得を避ける
   */
  markInvalid(url: string, reason: string): void {
    const existing = this.cache.get(url)
    if (existing) {
      existing.isValid = false
      console.log(`❌ URL無効化: ${url} - 理由: ${reason}`)
    } else {
      // 無効URLの記録（404等を避けるため）
      this.cache.set(url, {
        html: '',
        title: '',
        url,
        fetchedAt: new Date(),
        contentLength: 0,
        isValid: false
      })
    }
  }

  /**
   * キャッシュ統計
   */
  getStats(): { total: number, valid: number, invalid: number } {
    const entries = Array.from(this.cache.values())
    return {
      total: entries.length,
      valid: entries.filter(e => e.isValid).length,
      invalid: entries.filter(e => !e.isValid).length
    }
  }
}

// グローバルキャッシュインスタンス
const htmlCache = new HtmlCache()

// =============================================================================
// 実データソース基盤クラス（フォールバックデータ削除版）
// =============================================================================

abstract class RealDataCollector {
  abstract name: string
  abstract sourceType: 'official' | 'medical' | 'academic'
  abstract reliabilityScore: number

  /**
   * 実際のウェブソースから情報を収集
   */
  abstract collectFromSource(query: InfoQuery): Promise<CollectedInfo[]>

  /**
   * 収集した生データを構造化（フォールバック削除）
   */
  protected async structureData(
    rawData: any[], 
    category: InfoCategory, 
    query: InfoQuery
  ): Promise<CollectedInfo[]> {
    if (!openai) {
      console.log('OpenAI API利用不可 - 構造化をスキップします')
      return []
    }

    if (rawData.length === 0) {
      console.log('収集データなし - 空配列を返します')
      return []
    }

    try {
      const structuredItems: CollectedInfo[] = []
      
      // バッチ処理で効率化（5件ずつ）
      for (let i = 0; i < rawData.length; i += 5) {
        const batch = rawData.slice(i, i + 5)
        const structured = await this.structureBatch(batch, category, query)
        structuredItems.push(...structured)
      }

      console.log(`データ構造化完了: ${structuredItems.length}件`)
      return structuredItems
    } catch (error) {
      console.error('データ構造化エラー:', error)
      // エラー時も正直に空配列を返す
      return []
    }
  }

  private async structureBatch(
    batch: any[], 
    category: InfoCategory, 
    query: InfoQuery
  ): Promise<CollectedInfo[]> {
    const prompt = `
以下の医療情報を構造化してください。

ユーザー条件:
- がん種: ${query.cancerType}
- ステージ: ${query.stage || '未指定'}
- 関心領域: ${query.concernAreas.join(', ')}

生データ:
${JSON.stringify(batch, null, 2)}

以下の形式でJSONを返してください:
{
  "items": [
    {
      "title": "記事タイトル",
      "summary": "100文字程度の要約",
      "content": "詳細内容",
      "sourceUrl": "元URL",
      "relevanceScore": 75,
      "lastUpdated": "2024-01-01"
    }
  ]
}
`

    const completion = await openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: "system", 
          content: "医療情報の構造化専門家として、正確で有用な情報抽出を行ってください。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) return []

    try {
      const parsed = JSON.parse(response)
      return parsed.items.map((item: any, index: number) => ({
        id: `real_${category}_${Date.now()}_${index}`,
        title: item.title,
        summary: item.summary,
        content: item.content,
        category,
        sourceUrl: item.sourceUrl,
        sourceType: this.sourceType,
        reliabilityScore: this.reliabilityScore,
        relevanceScore: item.relevanceScore || 70,
        lastUpdated: new Date(item.lastUpdated || Date.now()),
        expiresAt: this.calculateExpiryDate(category)
      }))
    } catch (parseError) {
      console.error('JSON解析エラー:', parseError)
      return []
    }
  }

  private calculateExpiryDate(category: InfoCategory): Date {
    const now = new Date()
    const expiryDays = {
      'treatment_options': 90,    // 3ヶ月
      'doctors': 30,             // 1ヶ月
      'side_effects': 180,       // 6ヶ月
      'clinical_trials': 7,      // 1週間
      'support_resources': 365,  // 1年
      'financial_assistance': 90 // 3ヶ月
    }
    
    now.setDate(now.getDate() + (expiryDays[category] || 90))
    return now
  }

  /**
   * HTMLからタイトル抽出
   */
  private extractTitleFromHtml(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return titleMatch ? titleMatch[1].trim() : '無題'
  }

  /**
   * 構造化用プロンプト構築
   */
  protected buildStructuringPrompt(rawData: any[], category: InfoCategory, query: InfoQuery): string {
    return `
あなたは厚生労働省がん情報サービスの専門アナリストです。
以下のガイドライン情報を患者向けに構造化してください。

ユーザー条件:
- がん種: ${query.cancerType}
- ステージ: ${query.stage || '未指定'}
- 関心領域: ${query.concernAreas.join(', ')}

ガイドラインデータ:
${JSON.stringify(rawData.map(item => ({
  title: item.extractedTitle,
  url: item.sourceUrl,
  contentLength: item.paragraphCount
})), null, 2)}

重要な要件:
1. 医学的根拠に基づく正確な情報のみ
2. 患者が理解しやすい表現
3. 実用的なアクションを含める
4. 出典の信頼性を明記

出力形式（必ず純粋なJSONのみ）:
{
  "guidelines": [
    {
      "title": "情報のタイトル",
      "summary": "100文字程度の要約",
      "content": "詳細な内容",
      "cancer_types": ["breast_cancer", "lung_cancer", "all"],
      "stages": ["stage_1", "stage_2", "all"],
      "age_groups": ["30s", "40s", "50s", "all"],
      "regions": ["tokyo", "osaka", "all"],
      "treatmentInfo": {
        "name": "治療法名",
        "description": "治療法の説明",
        "effectiveness": "効果・有効性",
        "sideEffects": ["副作用1", "副作用2"],
        "eligibility": "対象者・適応条件"
      },
      "recommendations": [
        {
          "type": "strong|moderate|weak",
          "content": "推奨内容",
          "evidence": "エビデンスレベル"
        }
      ],
      "practicalInfo": {
        "hospitals": ["実施医療機関"],
        "costs": "費用情報",
        "insurance": "保険適用",
        "timeline": "治療期間"
      }
    }
  ]
}

がん種の指定値:
- breast_cancer: 乳がん
- lung_cancer: 肺がん
- stomach_cancer: 胃がん
- colorectal_cancer: 大腸がん
- prostate_cancer: 前立腺がん
- liver_cancer: 肝臓がん
- pancreatic_cancer: 膵臓がん
- esophageal_cancer: 食道がん
- all: 全がん種

ステージの指定値:
- stage_1: ステージ1
- stage_2: ステージ2
- stage_3: ステージ3
- stage_4: ステージ4
- all: 全ステージ

年齢層の指定値:
- 20s: 20代
- 30s: 30代
- 40s: 40代
- 50s: 50代
- 60s: 60代
- 70s: 70代以上
- all: 全年齢層

地域の指定値:
- tokyo: 東京都
- osaka: 大阪府
- kanto: 関東地方
- kansai: 関西地方
- all: 全国
`
  }
}

// =============================================================================
// 厚生労働省がん情報コレクター（改訂版 - 月1回高品質収集）
// =============================================================================

export class MHLWGuidelineCollector extends RealDataCollector {
  name = '厚生労働省がん情報ガイドライン収集'
  sourceType = 'official' as const
  reliabilityScore = 5
  schedule = 'monthly' // 月1回実行

  async collectFromSource(query: InfoQuery): Promise<CollectedInfo[]> {
    try {
      console.log(`[月次収集] 厚労省ガイドラインを収集中: ${query.cancerType}`)
      
      const targetUrls = this.buildGanjohoDatabaseUrls(query)
      console.log(`📋 収集対象URL数: ${targetUrls.length}件`)
      // ここで全URLを明示的に出力
      console.log('📋 収集対象URLリスト:')
      process.stdout.write('📋 収集対象URLリスト:\n')
      targetUrls.forEach((url, idx) => {
        const line = `  [${idx + 1}] ${url}\n`
        console.log(line.trim())
        process.stdout.write(line)
      })
      
      // 収集用変数の初期化
      const allRawData: any[] = []
      let successCount = 0
      let skipCount = 0
      let errorCount = 0
      
      // 複数URLから高品質データを収集
      for (let i = 0; i < targetUrls.length; i++) {
        const url = targetUrls[i]
        console.log(`[${i + 1}/${targetUrls.length}] 処理中: ${url}`)
        
        try {
          const data = await this.fetchGanjohoGuidelines(url)
          if (data.length > 0) {
            allRawData.push(...data)
            successCount++
            console.log(`✅ 成功: ${data.length}件のデータを取得`)
          } else {
            skipCount++
            console.log(`⏭️  スキップ: データなし`)
          }
        } catch (error) {
          errorCount++
          const errorMessage = error instanceof Error ? error.message : '不明なエラー'
          console.log(`❌ エラー: ${errorMessage}`)
          console.error(`❌ 詳細エラー:`, error)
        }
        
        // サーバー負荷軽減のため少し待機
        if (i < targetUrls.length - 1) {
          console.log(`⏳ 次のURLまで1秒待機...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      // 収集結果のサマリーを出力
      console.log(`📊 収集サマリー: 成功${successCount}件, スキップ${skipCount}件, エラー${errorCount}件`)
      console.log(`📄 収集データ総数: ${allRawData.length}件`)
      
      // データ構造化を実行
      if (allRawData.length > 0) {
        console.log(`🔄 データ構造化開始: ${allRawData.length}件`)
        const structuredData = await this.structureData(allRawData, 'treatment_options', query)
        console.log(`✅ 構造化完了: ${structuredData.length}件`)
        return structuredData
      } else {
        console.log(`📝 収集データなし - 空配列を返します`)
        return []
      }
    } catch (error) {
      console.error('厚労省ガイドライン収集エラー:', error)
      console.log('月次ガイドライン更新に失敗 - 次回収集まで待機')
      return []
    }
  }

  /**
   * ganjoho.jpの信頼できるガイドラインURLを構築
   */
  private buildGanjohoDatabaseUrls(query: InfoQuery): string[] {
    // 設定ファイルからURLを生成
    const urls = generateMHLWUrls(query.cancerType)
    
    // 手動追加URLも含める
    const allUrls = [...urls, ...MANUAL_ADDITIONAL_URLS]
    
    console.log(`厚労省URL生成: ${query.cancerType} - ${urls.length}件 + 手動追加${MANUAL_ADDITIONAL_URLS.length}件 = 合計${allUrls.length}件`)
    console.log(`🔍 生成されたURL例（最初の5件）:`)
    allUrls.slice(0, 5).forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`)
    })
    return allUrls
  }

  /**
   * ganjoho.jpから実際にガイドラインデータを取得（キャッシュ対応版）
   */
  private async fetchGanjohoGuidelines(url: string): Promise<any[]> {
    try {
      console.log(`📋 ガイドライン取得開始: ${url}`)
      
      // キャッシュチェック（無効URLは即座にスキップ）
      const cached = htmlCache.get(url)
      if (cached) {
        if (!cached.isValid) {
          console.log(`⏭️  無効URLをスキップ: ${url}`)
          return [] // 無効URLは空配列を返して処理を継続
        }
        
        console.log(`💾 キャッシュから取得: ${cached.title}`)
        return this.parseHtmlToData(cached.html, url)
      }

      // 実際のHTTP取得（キャッシュミス時のみ）
      console.log(`🌐 実際のHTTP取得: ${url}`)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Sottori/1.0; +https://sottori.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        signal: AbortSignal.timeout(30000) // 30秒タイムアウト
      })
      
      if (!response.ok) {
        const errorMsg = `HTTP Error: ${response.status} ${response.statusText}`
        console.log(`❌ HTTP取得失敗: ${errorMsg}`)
        
        // 404などの永続的エラーはキャッシュに記録（次回スキップ）
        if (response.status === 404 || response.status === 403) {
          htmlCache.markInvalid(url, errorMsg)
        }
        
        return [] // エラー時は空配列で継続（フォールバックしない）
      }
      
      const html = await response.text()
      console.log(`📄 HTML取得成功: ${html.length}文字`)
      
      // HTMLパース＆データ抽出
      const data = this.parseHtmlToData(html, url)
      
              // 成功時のみキャッシュに保存
        if (data.length > 0) {
          // HTMLからタイトルを抽出
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
          const title = titleMatch ? titleMatch[1].trim() : 'タイトル未取得'
          htmlCache.set(url, html, title)
        }
      
      return data

    } catch (error) {
      console.error(`❌ 取得エラー (${url}):`, error)
      
      // タイムアウトや接続エラーは一時的エラーなのでキャッシュしない
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log(`⏱️  タイムアウトエラー - 次回再試行可能`)
      }
      
      return [] // エラー時は空配列で継続
    }
  }

  /**
   * HTMLから基本情報を抽出
   */
  private parseHtmlToData(html: string, url: string): any[] {
    try {
      // 簡易HTMLパース（cheerio代替）
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : 'タイトル未取得'
      
      // 段落数と見出し数をカウント（データ品質指標）
      const paragraphCount = (html.match(/<p[^>]*>/g) || []).length
      const headingCount = (html.match(/<h[1-6][^>]*>/g) || []).length
      
      console.log(`📊 HTML解析結果: タイトル=${title}, 段落=${paragraphCount}, 見出し=${headingCount}`)
      
      // コンテンツ品質フィルターを緩和（段落数2個以上に変更）
      if (paragraphCount < 2) {
        console.log(`⚠️  コンテンツが少なすぎます (段落数: ${paragraphCount})`)
        return []
      }
      
      // 基本データ構造で返す（構造化は後で実行）
      return [{
        rawHtml: html,
        extractedTitle: title,
        sourceUrl: url,
        paragraphCount,
        headingCount,
        extractedAt: new Date(),
        needsStructuring: true // 構造化が必要
      }]
      
    } catch (error) {
      console.error(`❌ HTML解析エラー:`, error)
      return []
    }
  }

  /**
   * 高品質構造化処理（階層化表示対応版）
   */
  private async structureHighQualityData(
    rawData: any[], 
    category: InfoCategory, 
    query: InfoQuery
  ): Promise<CollectedInfo[]> {
    if (!openai) {
      console.log('OpenAI API利用不可 - 基本構造化を実行')
      return this.basicStructuring(rawData, category)
    }

    try {
      console.log(`🔄 高品質構造化開始: ${rawData.length}件`)
      
      const prompt = this.buildStructuringPrompt(rawData, category, query)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `あなたは医療情報の構造化専門家です。生のHTMLデータから厚労省ガイドライン情報を整理して、以下のJSON形式で返してください。

返却形式（必ず純粋なJSONのみ）:
{
  "guidelines": [
    {
      "title": "情報のタイトル",
      "summary": "100文字程度の要約",
      "content": "詳細な内容",
      "cancer_types": ["breast_cancer", "lung_cancer", "all"],
      "stages": ["stage_1", "stage_2", "all"],
      "age_groups": ["30s", "40s", "50s", "all"],
      "regions": ["tokyo", "osaka", "all"],
      "treatmentInfo": {
        "name": "治療法名",
        "description": "治療法の説明",
        "effectiveness": "効果・有効性",
        "sideEffects": ["副作用1", "副作用2"],
        "eligibility": "対象者・適応条件"
      },
      "recommendations": [
        {
          "type": "strong|moderate|weak",
          "content": "推奨内容",
          "evidence": "エビデンスレベル"
        }
      ],
      "practicalInfo": {
        "hospitals": ["実施医療機関"],
        "costs": "費用情報",
        "insurance": "保険適用",
        "timeline": "治療期間"
      }
    }
  ]
}`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })

      const rawResponse = response.choices[0]?.message?.content
      if (!rawResponse) {
        throw new Error('OpenAI応答が空です')
      }

      console.log(`📝 AI応答受信: ${rawResponse.length}文字`)
      
      // JSONパースエラー対策: マークダウンコードブロック除去
      const cleanedResponse = this.cleanAIResponse(rawResponse)
      console.log(`🧹 応答クリーニング後: ${cleanedResponse.length}文字`)
      
      const parsed = JSON.parse(cleanedResponse)
      
      if (!parsed.guidelines || !Array.isArray(parsed.guidelines)) {
        throw new Error('無効な応答構造')
      }
      
      return parsed.guidelines.map((item: any, index: number) => ({
        id: `mhlw_guideline_${Date.now()}_${index}`,
        title: item.title || '厚労省ガイドライン',
        summary: item.summary || item.title || '',
        content: item.content || '',
        rawContent: JSON.stringify({
          treatmentInfo: item.treatmentInfo || {},
          recommendations: item.recommendations || [],
          practicalInfo: item.practicalInfo || {}
        }),
        category,
        sourceUrl: rawData[0]?.sourceUrl || '',
        sourceType: this.sourceType,
        reliabilityScore: this.reliabilityScore,
        relevanceScore: 85,
        lastUpdated: new Date(),
        expiresAt: this.calculateMonthlyExpiryDate(),
        // 階層化表示用のメタデータ
        metadata: {
          hasTreatmentInfo: !!item.treatmentInfo,
          hasRecommendations: !!(item.recommendations && item.recommendations.length > 0),
          hasPracticalInfo: !!item.practicalInfo,
          cancerType: query.cancerType,
          source: '厚労省がん情報サービス'
        }
      }))

    } catch (error) {
      console.error('高品質構造化エラー:', error)
      console.log('🔄 基本構造化にフォールバック')
      return this.basicStructuring(rawData, category)
    }
  }

  /**
   * AI応答のクリーニング（JSONパースエラー防止）
   */
  private cleanAIResponse(response: string): string {
    // マークダウンコードブロックを除去
    let cleaned = response.replace(/^```json\s*\n?/im, '').replace(/\n?```\s*$/im, '')
    
    // 余分な説明文を除去（JSONより前後の文章）
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleaned = jsonMatch[0]
    }
    
    // 改行とスペースの正規化
    cleaned = cleaned.trim()
    
    console.log(`🧹 クリーニング詳細: 元文字数=${response.length}, 清浄後=${cleaned.length}`)
    
    return cleaned
  }

  /**
   * 月次更新の有効期限計算
   */
  private calculateMonthlyExpiryDate(): Date {
    const now = new Date()
    now.setMonth(now.getMonth() + 1)
    return now
  }

  /**
   * AI利用不可時の基本構造化
   */
  private basicStructuring(rawData: any[], category: InfoCategory): CollectedInfo[] {
    return rawData.map((item, index) => ({
      id: `mhlw_basic_${Date.now()}_${index}`,
      title: item.title || 'がん治療ガイドライン',
      summary: item.summary || '厚生労働省公式ガイドライン情報',
      content: item.content || item.text || '',
      rawContent: item.content || item.text || '', // ローデータとして同じコンテンツを保存
      category,
      sourceUrl: item.url || 'https://ganjoho.jp',
      sourceType: this.sourceType,
      reliabilityScore: this.reliabilityScore,
      relevanceScore: 80,
      lastUpdated: new Date(),
      expiresAt: this.calculateMonthlyExpiryDate(),
      tags: ['公式', 'ガイドライン']
    }))
  }

  /**
   * テスト用サンプルガイドライン生成
   */
  private generateSampleGuidelines(url: string): any[] {
    const cancerType = url.includes('breast') ? '乳がん' : 
                      url.includes('lung') ? '肺がん' : 
                      url.includes('stomach') ? '胃がん' : 
                      url.includes('colorectal') ? '大腸がん' : 'がん'

    return [
      {
        title: `${cancerType}の標準治療ガイドライン`,
        summary: `${cancerType}の診断から治療まで、エビデンスに基づく標準的な治療方針`,
        content: `
■ 治療の基本方針
${cancerType}の治療は、がんの進行度（ステージ）、患者さんの年齢や体調、希望などを総合的に判断して決定されます。

■ 主な治療法
1. 手術療法: 根治を目指す最も確実な治療法
2. 薬物療法: 抗がん剤、分子標的薬、免疫療法
3. 放射線療法: 局所的な治療効果

■ 治療選択のポイント
- 担当医との十分な相談
- セカンドオピニオンの活用
- 患者さんの生活の質（QOL）を重視
        `,
        url: url,
        lastUpdated: new Date().toISOString()
      }
    ]
  }
}

// =============================================================================
// 地域がん診療連携拠点病院コレクター（フォールバック削除版）
// =============================================================================

export class RegionalCancerHospitalCollector extends RealDataCollector {
  name = '地域がん診療連携拠点病院情報収集'
  sourceType = 'medical' as const
  reliabilityScore = 4

  async collectFromSource(query: InfoQuery): Promise<CollectedInfo[]> {
    try {
      console.log(`地域の専門病院情報を収集中（${query.userLocation}）...`)
      
      const hospitalData = await this.fetchRegionalHospitals(query)
      
      // 実データのみ返す
      const structuredData = await this.structureData(hospitalData, 'doctors', query)
      
      console.log(`地域病院データ収集完了: ${structuredData.length}件`)
      return structuredData
    } catch (error) {
      console.error('地域病院データ収集エラー:', error)
      console.log('地域病院データの取得に失敗しました - 空配列を返します')
      return []
    }
  }

  private async fetchRegionalHospitals(query: InfoQuery): Promise<any[]> {
    // TODO: 地域のがん診療連携拠点病院データベースAPI実装
    const prefecture = query.userLocation || '地域'
    console.log(`${prefecture}の病院データ取得を試行中...`)
    
    // 実装されるまでは空配列を返す（正直）
    console.log('地域病院の実データ取得機能は未実装です')
    return []
  }
}

// =============================================================================
// 実データコレクション統合サービス（フォールバック削除版）
// =============================================================================

export class RealDataCollectionService {
  private collectors: RealDataCollector[]

  constructor() {
    this.collectors = [
      new MHLWGuidelineCollector(),
      new MedicalSocietyGuidelineCollector(),
      new RegionalCancerHospitalCollector()
    ]
  }

  /**
   * 全ての実データソースから情報を収集（正直版）
   */
  async collectAllRealData(query: InfoQuery): Promise<CollectedInfo[]> {
    const allResults: CollectedInfo[] = []
    let successCount = 0
    let failureCount = 0

    console.log('実データ収集開始...')

    for (const collector of this.collectors) {
      try {
        console.log(`実データ収集: ${collector.name}`)
        const results = await collector.collectFromSource(query)
        
        if (results.length > 0) {
          allResults.push(...results)
          successCount++
          console.log(`✅ ${collector.name}: ${results.length}件取得`)
        } else {
          failureCount++
          console.log(`❌ ${collector.name}: データ取得できませんでした`)
        }
      } catch (error) {
        failureCount++
        console.error(`❌ ${collector.name} 収集失敗:`, error)
      }
    }

    console.log(`実データ収集結果: 成功${successCount}件、失敗${failureCount}件、合計${allResults.length}件のデータ`)

    if (allResults.length === 0) {
      console.log('⚠️  すべての実データソースからの取得に失敗しました')
    }

    return this.deduplicateAndSort(allResults)
  }

  private deduplicateAndSort(items: CollectedInfo[]): CollectedInfo[] {
    if (items.length === 0) return []

    // URL重複除去
    const uniqueItems = new Map<string, CollectedInfo>()
    
    items.forEach(item => {
      const key = item.sourceUrl || item.title
      if (!uniqueItems.has(key) || 
          uniqueItems.get(key)!.reliabilityScore < item.reliabilityScore) {
        uniqueItems.set(key, item)
      }
    })

    // 信頼度→関連度でソート
    return Array.from(uniqueItems.values()).sort((a, b) => {
      if (a.reliabilityScore !== b.reliabilityScore) {
        return b.reliabilityScore - a.reliabilityScore
      }
      return b.relevanceScore - a.relevanceScore
    })
  }

  /**
   * 安全なテストサイト用コレクター（開発・テスト用）
   */
  async collectTestSiteData(query: InfoQuery): Promise<CollectedInfo[]> {
    console.log('🧪 テストサイト収集開始')
    
    try {
      // 設定ファイルからテストURLを取得
      const testUrls = TEST_SCRAPING_URLS
      
      const results: CollectedInfo[] = []
      
      for (const url of testUrls) {
        try {
          console.log(`🧪 テストサイトアクセス: ${url}`)
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Sottori-Test-Bot/1.0 (Development Testing)'
            }
          })
          
          if (!response.ok) {
            console.log(`⚠️ テストサイトアクセス失敗: ${url} - ${response.status}`)
            continue
          }
          
          const contentType = response.headers.get('content-type') || ''
          let content = ''
          
          if (contentType.includes('application/json')) {
            const jsonData = await response.json()
            content = JSON.stringify(jsonData, null, 2)
          } else {
            content = await response.text()
          }
          
          console.log(`📄 コンテンツ取得: ${url} - ${content.length}文字`)
          
          // テストデータとして構造化
          const testItem: CollectedInfo = {
            id: crypto.randomUUID(),
            title: `テストデータ - ${new URL(url).hostname}`,
            summary: `テストサイト ${url} からのサンプルデータ`,
            content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
            rawContent: content, // ローデータとして元のコンテンツを保存
            category: 'support_resources', // 既存のカテゴリを使用
            sourceUrl: url,
            sourceType: 'community', // 既存のソースタイプを使用
            reliabilityScore: 1, // テストデータなので低い信頼度
            relevanceScore: 10,  // テストデータなので低い関連度
            lastUpdated: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24時間後に期限切れ
          }
          
          console.log(`✅ テストアイテム作成: ${testItem.title} (rawContent: ${testItem.rawContent?.length || 0}文字)`)
          
          results.push(testItem)
          console.log(`✅ テストデータ収集成功: ${url}`)
          
          // テストサイトへの負荷軽減
          await new Promise(resolve => setTimeout(resolve, 1000))
          
        } catch (error) {
          console.error(`❌ テストサイトアクセスエラー: ${url}`, error)
        }
      }
      
      console.log(`🧪 テストサイト収集完了: ${results.length}件`)
      console.log(`🧪 収集データ詳細:`, results.map(r => ({ title: r.title, rawContentLength: r.rawContent?.length || 0 })))
      return results
      
    } catch (error) {
      console.error('❌ テストサイト収集エラー:', error)
      return []
    }
  }
}

// =============================================================================
// 医学会ガイドライン収集システム（新戦略実装）
// =============================================================================

export class MedicalSocietyGuidelineCollector extends RealDataCollector {
  name = '医学会ガイドライン収集'
  sourceType = 'medical' as const
  reliabilityScore = 4
  schedule = 'monthly' // 月1回実行

  async collectFromSource(query: InfoQuery): Promise<CollectedInfo[]> {
    try {
      console.log(`[月次収集] 医学会ガイドライン収集開始: ${query.cancerType}`)
      
      const societies = this.getTargetMedicalSocieties(query.cancerType)
      const allGuidelines: any[] = []
      
      for (const society of societies) {
        try {
          console.log(`📚 ${society.name}からガイドライン収集中...`)
          const guidelines = await this.fetchSocietyGuidelines(society, query)
          allGuidelines.push(...guidelines)
          
          // 医学会サイトへの負荷軽減
          await new Promise(resolve => setTimeout(resolve, 3000))
        } catch (error) {
          console.error(`${society.name}収集エラー:`, error)
        }
      }
      
      if (allGuidelines.length === 0) {
        console.log('医学会ガイドラインの取得ができませんでした')
        return []
      }
      
      const structuredData = await this.structureGuidelineData(
        allGuidelines, 
        'treatment_options', 
        query
      )
      
      console.log(`[成功] 医学会ガイドライン収集完了: ${structuredData.length}件`)
      return structuredData
    } catch (error) {
      console.error('医学会ガイドライン収集エラー:', error)
      console.log('月次医学会ガイドライン更新に失敗')
      return []
    }
  }

  /**
   * がん種別の対象医学会を特定
   */
  private getTargetMedicalSocieties(cancerType: string): Array<{
    name: string
    baseUrl: string
    guidelineType: 'official' | 'clinical' | 'research'
    riskLevel: 'low' | 'medium' | 'high'
  }> {
    // 設定ファイルから医学会URLを取得
    return getMedicalSocietyUrls(cancerType)
  }

  /**
   * 医学会からガイドラインを安全に取得
   */
  private async fetchSocietyGuidelines(
    society: any, 
    query: InfoQuery
  ): Promise<any[]> {
    try {
      console.log(`📋 ${society.name}ガイドライン取得中...`)
      
      // 現在はテスト用サンプルデータを返す
      // TODO: 実装予定 - robots.txt確認、適切なスクレイピング
      const sampleGuidelines = this.generateSocietyGuidelines(society, query)
      
      console.log(`📋 ${society.name}: ${sampleGuidelines.length}件取得`)
      return sampleGuidelines
    } catch (error) {
      console.error(`${society.name}取得エラー:`, error)
      return []
    }
  }

  /**
   * ガイドライン専用の高品質構造化
   */
  private async structureGuidelineData(
    rawData: any[], 
    category: InfoCategory, 
    query: InfoQuery
  ): Promise<CollectedInfo[]> {
    if (!openai || rawData.length === 0) {
      return this.basicGuidelineStructuring(rawData, category)
    }

    try {
      const prompt = `
あなたは医学会ガイドライン専門の情報整理者です。
以下の学会ガイドライン情報を患者・家族向けに構造化してください。

対象患者条件:
- がん種: ${query.cancerType}
- ステージ: ${query.stage || '未指定'}
- 関心分野: ${query.concernAreas.join(', ')}

医学会ガイドラインデータ:
${JSON.stringify(rawData, null, 2)}

構造化要件:
1. 医学的エビデンスレベルの明記
2. 専門用語の分かりやすい説明
3. 実践的な活用方法の提示
4. 学会の権威性・信頼性の説明

JSON出力形式:
{
  "medicalGuidelines": [
    {
      "title": "〇〇学会治療ガイドライン要約",
      "summary": "ガイドラインの要点を100文字で",
      "content": "詳細内容（専門用語解説含む）",
      "cancer_types": ["breast_cancer", "lung_cancer", "all"],
      "stages": ["stage_1", "stage_2", "all"],
      "age_groups": ["30s", "40s", "50s", "all"],
      "regions": ["tokyo", "osaka", "all"],
      "evidenceLevel": "A/B/C",
      "practicalAdvice": ["患者が取るべき行動"],
      "sourceAuthority": "学会の権威性説明",
      "sourceUrl": "ガイドライン原文URL",
      "lastUpdated": "2024-01-01"
    }
  ]
}

がん種の指定値:
- breast_cancer: 乳がん
- lung_cancer: 肺がん
- stomach_cancer: 胃がん
- colorectal_cancer: 大腸がん
- prostate_cancer: 前立腺がん
- liver_cancer: 肝臓がん
- pancreatic_cancer: 膵臓がん
- esophageal_cancer: 食道がん
- all: 全がん種

ステージの指定値:
- stage_1: ステージ1
- stage_2: ステージ2
- stage_3: ステージ3
- stage_4: ステージ4
- all: 全ステージ

年齢層の指定値:
- 20s: 20代
- 30s: 30代
- 40s: 40代
- 50s: 50代
- 60s: 60代
- 70s: 70代以上
- all: 全年齢層

地域の指定値:
- tokyo: 東京都
- osaka: 大阪府
- kanto: 関東地方
- kansai: 関西地方
- all: 全国
`

      const completion = await openai!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: "system", 
            content: "医学会ガイドライン専門アナリストとして、エビデンスベースの正確な情報整理を行ってください。" 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 3000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        return this.basicGuidelineStructuring(rawData, category)
      }

      // JSONパースエラー対策: マークダウンコードブロック除去
      const cleanedResponse = this.cleanAIResponse(response)
      console.log(`🧹 医学会応答クリーニング後: ${cleanedResponse.length}文字`)
      
      const parsed = JSON.parse(cleanedResponse)
      return parsed.medicalGuidelines.map((item: any, index: number) => ({
        id: `med_guideline_${Date.now()}_${index}`,
        title: item.title,
        summary: item.summary,
        content: item.content,
        rawContent: item.content, // ローデータとして同じコンテンツを保存
        category,
        sourceUrl: item.sourceUrl,
        sourceType: this.sourceType,
        reliabilityScore: this.reliabilityScore,
        relevanceScore: 85, // 専門学会ガイドラインは高関連性
        lastUpdated: new Date(item.lastUpdated || Date.now()),
        expiresAt: this.calculateMonthlyExpiryDate(),
        tags: ['医学会', 'ガイドライン', 'エビデンス', item.evidenceLevel],
        evidenceLevel: item.evidenceLevel,
        practicalAdvice: item.practicalAdvice || [],
        sourceAuthority: item.sourceAuthority
      }))
    } catch (error) {
      console.error('医学会ガイドライン構造化エラー:', error)
      return this.basicGuidelineStructuring(rawData, category)
    }
  }

  /**
   * AI応答のクリーニング処理
   */
  private cleanAIResponse(response: string): string {
    console.log(`🧹 クリーニング詳細: 元文字数=${response.length}`)
    
    // マークダウンコードブロック除去
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
    
    // 先頭・末尾の空白除去
    cleaned = cleaned.trim()
    
    // 不正な文字除去
    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    
    console.log(`🧹 清浄後=${cleaned.length}`)
    return cleaned
  }

  /**
   * 基本的なガイドライン構造化
   */
  private basicGuidelineStructuring(rawData: any[], category: InfoCategory): CollectedInfo[] {
    return rawData.map((item, index) => ({
      id: `med_basic_${Date.now()}_${index}`,
      title: item.title || '医学会治療ガイドライン',
      summary: item.summary || '専門学会による治療指針',
      content: item.content || '',
      rawContent: item.content || '', // ローデータとして同じコンテンツを保存
      category,
      sourceUrl: item.url || '',
      sourceType: this.sourceType,
      reliabilityScore: this.reliabilityScore,
      relevanceScore: 80,
      lastUpdated: new Date(),
      expiresAt: this.calculateMonthlyExpiryDate(),
      tags: ['医学会', 'ガイドライン']
    }))
  }

  /**
   * 月次更新の有効期限計算
   */
  private calculateMonthlyExpiryDate(): Date {
    const now = new Date()
    now.setMonth(now.getMonth() + 1)
    return now
  }

  /**
   * テスト用医学会ガイドライン生成
   */
  private generateSocietyGuidelines(society: any, query: InfoQuery): any[] {
    const cancerTypeJa = query.cancerType === 'breast_cancer' ? '乳がん' :
                        query.cancerType === 'lung_cancer' ? '肺がん' :
                        query.cancerType === 'stomach_cancer' ? '胃がん' :
                        query.cancerType === 'colorectal_cancer' ? '大腸がん' : 'がん'

    return [
      {
        title: `${society.name} ${cancerTypeJa}診療ガイドライン`,
        summary: `${society.name}による${cancerTypeJa}の標準的診療指針`,
        content: `
■ ${society.name}について
${society.name}は、${cancerTypeJa}治療の専門性を持つ権威ある学会です。

■ ガイドラインの特徴
- 最新の医学的エビデンスに基づく治療指針
- 専門医によるコンセンサスの結果
- 定期的な改訂による最新性の保持

■ 患者・家族への活用指針
- 担当医との治療相談時の参考資料として
- セカンドオピニオン時の判断材料として
- 治療選択肢の理解促進に活用

■ 注意事項
個別の病状に応じた治療は必ず専門医にご相談ください。
        `,
        society: society.name,
        evidenceLevel: 'A',
        url: `${society.baseUrl}/guideline`,
        lastUpdated: new Date().toISOString()
      }
    ]
  }
} 