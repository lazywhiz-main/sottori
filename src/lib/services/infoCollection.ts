import { AI_CONFIG } from '../config/ai'
import { supabase } from '../supabase'
import OpenAI from 'openai'
import { RealDataCollectionService } from './realDataCollectors'
import { InformationPoolService } from './informationPoolService'

// OpenAI クライアントの初期化
const openai = AI_CONFIG.OPENAI.API_KEY ? new OpenAI({
  apiKey: AI_CONFIG.OPENAI.API_KEY,
}) : null

// =============================================================================
// 型定義
// =============================================================================

export interface CollectedInfo {
  id: string
  title: string
  summary: string
  content: string
  rawContent?: string // ローデータとして保存する元のコンテンツ
  category: InfoCategory
  sourceUrl?: string
  sourceType: 'official' | 'medical' | 'academic' | 'community'
  reliabilityScore: number // 1-5
  relevanceScore: number // 0-100
  lastUpdated: Date
  expiresAt?: Date
}

export interface InfoQuery {
  cancerType: string
  stage?: string
  concernAreas: string[]
  userLocation?: string
  treatmentStatus?: string
}

export interface CollectionResult {
  success: boolean
  totalFound: number
  items: CollectedInfo[]
  errors: string[]
  completedAt: Date
  // 実データ統計
  realDataCount: number
  syntheticDataCount: number
  sourceBreakdown: Record<string, number>
}

export type InfoCategory = 
  | 'treatment_options' 
  | 'doctors' 
  | 'side_effects' 
  | 'clinical_trials'
  | 'support_resources'
  | 'financial_assistance'

// =============================================================================
// メイン情報収集サービス（実データ統合版）
// =============================================================================

export class InfoCollectionService {
  private collectors: InfoCollector[]
  private realDataService: RealDataCollectionService

  constructor() {
    // 従来のAI生成コレクター（フォールバック用）
    this.collectors = [
      new TreatmentInfoCollector(),
      new DoctorInfoCollector(),
      new TrialInfoCollector(),
      new SupportInfoCollector(),
      new SideEffectsInfoCollector(),
      new FinancialAssistanceInfoCollector()
    ]
    
    // 実データ収集サービス
    this.realDataService = new RealDataCollectionService()
  }

  /**
   * ユーザーの条件に基づいて情報を収集（実データのみ、正直な報告）
   */
  async collectInformation(userId: string, query: InfoQuery): Promise<CollectionResult> {
    const startTime = Date.now()
    const allItems: CollectedInfo[] = []
    const errors: string[] = []

    // 進捗を更新
    await this.updateCollectionProgress(userId, 'collecting', 0)

    try {
      // 実データソースからのみ収集
      console.log('実データソースからの収集を開始...')
      
      try {
        // まずテストサイト収集を実行
        console.log('🧪 テストサイト収集を実行中...')
        const testDataItems = await this.realDataService.collectTestSiteData(query)
        console.log(`テストサイト収集完了: ${testDataItems.length}件`)
        allItems.push(...testDataItems)
        
        // 進捗更新（テストサイト収集完了: 40%）
        await this.updateCollectionProgress(userId, 'collecting', 40)
        
        // 次に通常の実データ収集を実行
        const realDataItems = await this.realDataService.collectAllRealData(query)
        console.log(`実データ収集完了: ${realDataItems.length}件`)
        allItems.push(...realDataItems)
        
        // 進捗更新（実データ収集完了: 80%）
        await this.updateCollectionProgress(userId, 'collecting', 80)
      } catch (error) {
        console.error('実データ収集エラー:', error)
        errors.push(`実データ収集: ${error instanceof Error ? error.message : String(error)}`)
      }

      // AI生成データによる補完は削除 - 正直に実データのみ提供
      if (allItems.length === 0) {
        console.log('⚠️  すべてのデータソースからの取得に失敗しました')
        errors.push('現在、信頼できる情報ソースからデータを取得できません。しばらく時間をおいて再度お試しください。')
      } else {
        console.log(`✅ 実データ${allItems.length}件を取得しました`)
      }

      // 進捗更新（データ収集完了: 90%）
      await this.updateCollectionProgress(userId, 'collecting', 90)

      // 重複除去・品質フィルタリング
      const processedItems = await this.processCollectedItems(allItems, query)
      
      // データベースに保存
      if (processedItems.length > 0) {
        await this.saveCollectedItems(userId, processedItems)
      }
      
      // 完了状態に更新
      await this.updateCollectionProgress(userId, 'completed', 100)

      // 統計情報の計算（実データのみ）
      const realDataCount = processedItems.length
      const syntheticDataCount = 0  // 合成データは提供しない
      
      const sourceBreakdown = processedItems.reduce((acc, item) => {
        acc[item.sourceType] = (acc[item.sourceType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const result: CollectionResult = {
        success: processedItems.length > 0,
        totalFound: processedItems.length,
        items: processedItems,
        errors,
        completedAt: new Date(),
        realDataCount,
        syntheticDataCount,
        sourceBreakdown
      }

      const statusMessage = processedItems.length > 0 
        ? `情報収集完了: 実データ${realDataCount}件取得` 
        : '情報収集失敗: 実データを取得できませんでした'
      
      console.log(`${statusMessage} (${Date.now() - startTime}ms)`)
      return result

    } catch (error) {
      console.error('Information collection failed:', error)
      await this.updateCollectionProgress(userId, 'pending', 0)
      
      return {
        success: false,
        totalFound: 0,
        items: [],
        errors: [error instanceof Error ? error.message : String(error)],
        completedAt: new Date(),
        realDataCount: 0,
        syntheticDataCount: 0,
        sourceBreakdown: {}
      }
    }
  }

  /**
   * 収集した情報を処理（重複除去・品質向上）
   */
  private async processCollectedItems(items: CollectedInfo[], query: InfoQuery): Promise<CollectedInfo[]> {
    // URL重複除去（実データを優先）
    const uniqueItems = new Map<string, CollectedInfo>()
    
    items.forEach(item => {
      const key = item.sourceUrl || item.title
      const existing = uniqueItems.get(key)
      
      if (!existing) {
        uniqueItems.set(key, item)
      } else {
        // 実データを優先、次に信頼度で判断
        const currentPriority = this.getSourcePriority(item.sourceType)
        const existingPriority = this.getSourcePriority(existing.sourceType)
        
        if (currentPriority > existingPriority || 
           (currentPriority === existingPriority && item.reliabilityScore > existing.reliabilityScore)) {
          uniqueItems.set(key, item)
        }
      }
    })

    let processedItems = Array.from(uniqueItems.values())

    // 関連度スコアを計算
    processedItems = await this.calculateRelevanceScores(processedItems, query)

    // 品質・関連度でソート（実データ優先）
    processedItems.sort((a, b) => {
      // まずソースタイプ優先度で比較
      const aPriority = this.getSourcePriority(a.sourceType)
      const bPriority = this.getSourcePriority(b.sourceType)
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      // 次に信頼度
      if (a.reliabilityScore !== b.reliabilityScore) {
        return b.reliabilityScore - a.reliabilityScore
      }
      
      // 最後に関連度
      return b.relevanceScore - a.relevanceScore
    })

    // 上位20件に制限（品質重視）
    return processedItems.slice(0, 20)
  }

  private getSourcePriority(sourceType: string): number {
    const priorities: Record<string, number> = {
      'official': 4,    // 公的機関（最優先）
      'medical': 3,     // 医療機関
      'academic': 2,    // 学術機関
      'community': 1    // AI生成・コミュニティ（最低優先）
    }
    return priorities[sourceType] || 0
  }

  /**
   * AI を使用して関連度スコアを計算
   */
  private async calculateRelevanceScores(items: CollectedInfo[], query: InfoQuery): Promise<CollectedInfo[]> {
    if (!openai) {
      console.warn('OpenAI not available, using default relevance scores')
      return items
    }

    try {
      const prompt = this.buildRelevancePrompt(items, query)
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: "system", 
            content: "医療情報の関連度を0-100で評価してください。ユーザーの状況により関連性が高い情報ほど高スコアを付けてください。" 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        try {
          // レスポンスのクリーニング
          const cleanedResponse = response
            .replace(/^```json\s*/, '')
            .replace(/```$/, '')
            .replace(/^```\s*/, '')
            .replace(/^`/, '')
            .replace(/`$/, '')
            .trim()

          const scores = JSON.parse(cleanedResponse)
          
          return items.map((item, index) => ({
            ...item,
            relevanceScore: scores[index]?.score || this.calculateBasicRelevance(item, query)
          }))
        } catch (parseError) {
          console.error('関連度スコア解析エラー:', parseError)
          return items.map(item => ({
            ...item,
            relevanceScore: this.calculateBasicRelevance(item, query)
          }))
        }
      }
    } catch (error) {
      console.error('関連度計算エラー:', error)
    }

    return items.map(item => ({
      ...item,
      relevanceScore: this.calculateBasicRelevance(item, query)
    }))
  }

  private buildRelevancePrompt(items: CollectedInfo[], query: InfoQuery): string {
    const itemsForPrompt = items.map((item, index) => ({
      index,
      title: item.title,
      summary: item.summary,
      category: item.category,
      sourceType: item.sourceType
    }))

    return `
ユーザー情報:
- がん種: ${query.cancerType}
- ステージ: ${query.stage || '未指定'}
- 関心領域: ${query.concernAreas.join(', ')}
- 居住地: ${query.userLocation || '未指定'}

情報リスト:
${JSON.stringify(itemsForPrompt, null, 2)}

各情報の関連度を0-100で評価し、以下の形式で返してください:
[
  {"index": 0, "score": 85},
  {"index": 1, "score": 72}
]
`
  }

  private calculateBasicRelevance(item: CollectedInfo, query: InfoQuery): number {
    let score = 50 // ベーススコア

    // がん種マッチング
    if (item.title.includes(query.cancerType) || item.content.includes(query.cancerType)) {
      score += 20
    }

    // カテゴリマッチング
    if (query.concernAreas.includes(item.category)) {
      score += 15
    }

    // ソースタイプボーナス
    if (item.sourceType === 'official') score += 10
    if (item.sourceType === 'medical') score += 5

    return Math.min(score, 100)
  }

  /**
   * 収集進捗を更新
   */
  private async updateCollectionProgress(
    userId: string, 
    status: 'pending' | 'collecting' | 'completed', 
    progress: number
  ): Promise<void> {
    try {
      await supabase
        .from('info_collection_progress')
        .upsert({
          user_id: userId,
          status,
          progress,
          last_updated: new Date().toISOString()
        })
    } catch (error) {
      console.error('進捗更新エラー:', error)
    }
  }

  /**
   * 収集した情報をデータベースに保存
   */
  private async saveCollectedItems(userId: string, items: CollectedInfo[]): Promise<void> {
    try {
      console.log(`💾 ユーザー情報収集データ保存開始: ${items.length}件`)
      
      // InformationPoolServiceを使用して新しいテーブル構造で保存
      const infoPoolService = new InformationPoolService()
      
      // データ形式を変換
      const convertedItems = items.map(item => ({
        title: item.title,
        summary: item.summary,
        content: item.content,
        rawContent: item.rawContent || item.content,
        sourceUrl: item.sourceUrl,
        sourceType: item.sourceType,
        category: item.category,
        reliabilityScore: item.reliabilityScore,
        relevanceScore: item.relevanceScore,
        lastUpdated: item.lastUpdated,
        expiresAt: item.expiresAt,
        // ユーザー固有の情報として保存
        userId: userId
      }))

      // 新しいテーブル構造で保存
      const result = await infoPoolService.saveCollectedItems(convertedItems)
      
      console.log(`💾 ユーザー情報収集保存完了: 成功${result.saved}件、スキップ${result.skipped}件、エラー${result.errors.length}件`)
      
      if (result.errors.length > 0) {
        console.error('保存エラー:', result.errors)
      }

    } catch (error) {
      console.error('情報保存エラー:', error)
      throw error
    }
  }

  private calculatePriorityLevel(item: CollectedInfo): 'high' | 'medium' | 'low' {
    if (item.sourceType === 'official' && item.relevanceScore >= 80) return 'high'
    if (item.reliabilityScore >= 4 && item.relevanceScore >= 70) return 'high'
    if (item.relevanceScore >= 60) return 'medium'
    return 'low'
  }
}

// =============================================================================
// 従来のコレクタークラス（フォールバック用）
// =============================================================================

abstract class InfoCollector {
  abstract name: string
  abstract collect(query: InfoQuery): Promise<CollectedInfo[]>
}

// =============================================================================
// 治療情報コレクター
// =============================================================================

class TreatmentInfoCollector extends InfoCollector {
  name = 'Treatment Information Collector'

  async collect(query: InfoQuery): Promise<CollectedInfo[]> {
    if (!openai) {
      return this.getFallbackTreatmentInfo(query)
    }

    try {
      const prompt = this.buildTreatmentPrompt(query)
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: "system", 
            content: "がん治療の専門家として、正確で最新の治療情報を提供してください。医療アドバイスではなく、一般的な情報として回答してください。" 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        return this.parseTreatmentResponse(response, query)
      }
    } catch (error) {
      console.error('Treatment info collection error:', error)
    }

    return this.getFallbackTreatmentInfo(query)
  }

  private buildTreatmentPrompt(query: InfoQuery): string {
    return `
${query.cancerType}の治療選択肢について、以下の形式で3つの情報を提供してください：

がん種: ${query.cancerType}
ステージ: ${query.stage || '未指定'}
関心事: ${query.concernAreas.join(', ')}

以下のJSON形式で回答してください：
{
  "treatments": [
    {
      "title": "治療法名",
      "summary": "治療法の概要（100文字以内）",
      "content": "詳細な説明",
      "applicableStages": ["適用可能なステージ"]
    }
  ]
}
`
  }

  private parseTreatmentResponse(response: string, query: InfoQuery): CollectedInfo[] {
    try {
      const cleanedResponse = response
        .replace(/^```json\s*/, '')
        .replace(/```$/, '')
        .replace(/^```\s*/, '')
        .replace(/^`/, '')
        .replace(/`$/, '')
        .trim()

      const parsed = JSON.parse(cleanedResponse)
      
      return parsed.treatments.map((treatment: any, index: number) => ({
        id: `treatment_${Date.now()}_${index}`,
        title: treatment.title,
        summary: treatment.summary,
        content: treatment.content,
        category: 'treatment_options' as InfoCategory,
        sourceUrl: undefined,
        sourceType: 'community' as const,
        reliabilityScore: 3,
        relevanceScore: 75,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }))
    } catch (error) {
      console.error('Treatment response parsing error:', error)
      return this.getFallbackTreatmentInfo(query)
    }
  }

  private getFallbackTreatmentInfo(query: InfoQuery): CollectedInfo[] {
    return [
      {
        id: `treatment_fallback_${Date.now()}`,
        title: `${query.cancerType}の標準治療について`,
        summary: '標準的な治療選択肢に関する基本情報',
        content: '医師と相談の上、最適な治療法を選択することが重要です。',
        category: 'treatment_options',
        sourceType: 'community',
        reliabilityScore: 2,
        relevanceScore: 50,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    ]
  }
}

// =============================================================================
// 専門医情報コレクター
// =============================================================================

class DoctorInfoCollector extends InfoCollector {
  name = 'Doctor Information Collector'

  async collect(query: InfoQuery): Promise<CollectedInfo[]> {
    // 簡略化されたフォールバック実装
    return [
      {
        id: `doctor_fallback_${Date.now()}`,
        title: `${query.userLocation || '地域'}の専門医情報`,
        summary: 'がん専門医の検索方法と選択基準',
        content: 'がん診療連携拠点病院で専門医を探すことをお勧めします。',
        category: 'doctors',
        sourceType: 'community',
        reliabilityScore: 2,
        relevanceScore: 60,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    ]
  }
}

// =============================================================================
// 治験情報コレクター
// =============================================================================

class TrialInfoCollector extends InfoCollector {
  name = 'Clinical Trial Information Collector'

  async collect(query: InfoQuery): Promise<CollectedInfo[]> {
    return [
      {
        id: `trial_fallback_${Date.now()}`,
        title: `${query.cancerType}の臨床試験情報`,
        summary: '臨床試験への参加検討に関する情報',
        content: '臨床試験は新しい治療法の可能性を探る重要な選択肢です。',
        category: 'clinical_trials',
        sourceType: 'community',
        reliabilityScore: 2,
        relevanceScore: 65,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ]
  }
}

// =============================================================================
// サポート情報コレクター
// =============================================================================

class SupportInfoCollector extends InfoCollector {
  name = 'Support Information Collector'

  async collect(query: InfoQuery): Promise<CollectedInfo[]> {
    return [
      {
        id: `support_fallback_${Date.now()}`,
        title: 'がん患者支援制度について',
        summary: '利用可能な支援制度とサービス',
        content: '医療費助成や心理的サポートなど、様々な支援制度があります。',
        category: 'support_resources',
        sourceType: 'community',
        reliabilityScore: 3,
        relevanceScore: 55,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ]
  }
}

// =============================================================================
// 副作用情報コレクター
// =============================================================================

class SideEffectsInfoCollector extends InfoCollector {
  name = 'SideEffects Information Collector'

  async collect(query: InfoQuery): Promise<CollectedInfo[]> {
    return [
      {
        id: `sideeffects_fallback_${Date.now()}`,
        title: `${query.cancerType}治療の副作用対策`,
        summary: '治療に伴う副作用への対処法と管理方法',
        content: '副作用の症状と対策について医師やケアチームと相談することが重要です。',
        category: 'side_effects',
        sourceType: 'community',
        reliabilityScore: 3,
        relevanceScore: 60,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      }
    ]
  }
}

// =============================================================================
// 経済的支援情報コレクター
// =============================================================================

class FinancialAssistanceInfoCollector extends InfoCollector {
  name = 'Financial Assistance Information Collector'

  async collect(query: InfoQuery): Promise<CollectedInfo[]> {
    return [
      {
        id: `financial_fallback_${Date.now()}`,
        title: 'がん治療の医療費支援制度',
        summary: '高額療養費制度や各種助成制度の情報',
        content: '医療費の負担を軽減する様々な制度があります。医療ソーシャルワーカーにご相談ください。',
        category: 'financial_assistance',
        sourceType: 'community',
        reliabilityScore: 3,
        relevanceScore: 65,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ]
  }
} 