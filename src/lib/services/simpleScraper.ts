/**
 * シンプルなスクレイピング機能
 * 
 * 基本的なHTML取得・パース機能に特化したシンプルな実装
 * 詳細なログ出力とエラーハンドリングを含む
 */

const { JSDOM } = require('jsdom')

export interface ScrapedData {
  url: string
  title: string
  content: string
  summary?: string
  sourceName: string
  sourceType: 'official' | 'medical' | 'academic' | 'community'
  contentType: 'html' | 'pdf' | 'api_response' | 'rss'
  contentLength: number
  paragraphCount: number
  headingCount: number
  extractedMetadata: any
  collectedAt: Date
  isValid: boolean
  errorMessage?: string
}

export interface ScrapingResult {
  success: ScrapedData[]
  failed: { url: string; error: string }[]
  skipped: { url: string; reason: string }[]
  totalProcessed: number
  totalSuccess: number
  totalFailed: number
  totalSkipped: number
}

export class SimpleScraper {
  private cache: Map<string, ScrapedData> = new Map()
  private readonly CACHE_DURATION_HOURS = 24
  private readonly REQUEST_TIMEOUT_MS = 10000
  private readonly SLEEP_MS = 1000 // 1秒間隔

  /**
   * 単一URLのスクレイピング
   */
  async scrapeUrl(url: string): Promise<ScrapedData> {
    console.log(`🔍 スクレイピング開始: ${url}`)
    
    try {
      // キャッシュチェック
      const cached = this.getFromCache(url)
      if (cached) {
        console.log(`✅ キャッシュヒット: ${url}`)
        return cached
      }

      // 無効URLチェック
      if (this.isInvalidUrl(url)) {
        console.log(`❌ 無効URL（スキップ）: ${url}`)
        return this.createInvalidResult(url, '無効なURL')
      }

      // HTTP取得
      console.log(`📡 HTTP取得中: ${url}`)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SottoriBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: AbortSignal.timeout(this.REQUEST_TIMEOUT_MS)
      })

      if (!response.ok) {
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`
        console.log(`❌ HTTPエラー: ${url} - ${errorMsg}`)
        this.markInvalidUrl(url, errorMsg)
        return this.createInvalidResult(url, errorMsg)
      }

      const contentType = response.headers.get('content-type') || ''
      if (!this.isSupportedContentType(contentType)) {
        const errorMsg = `サポートされていないコンテンツタイプ: ${contentType}`
        console.log(`❌ コンテンツタイプエラー: ${url} - ${errorMsg}`)
        return this.createInvalidResult(url, errorMsg)
      }

      const html = await response.text()
      console.log(`📄 HTML取得完了: ${url} (${html.length}文字)`)

      // HTMLパース
      const scrapedData = this.parseHtml(html, url)
      
      // キャッシュに保存
      this.saveToCache(url, scrapedData)
      
      console.log(`✅ スクレイピング成功: ${url}`)
      return scrapedData

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '不明なエラー'
      console.log(`❌ スクレイピング失敗: ${url} - ${errorMsg}`)
      this.markInvalidUrl(url, errorMsg)
      return this.createInvalidResult(url, errorMsg)
    }
  }

  /**
   * 複数URLの一括スクレイピング
   */
  async scrapeUrls(urls: string[]): Promise<ScrapingResult> {
    console.log(`🚀 一括スクレイピング開始: ${urls.length}件`)
    console.log('='.repeat(60))

    const result: ScrapingResult = {
      success: [],
      failed: [],
      skipped: [],
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 0,
      totalSkipped: 0
    }

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      result.totalProcessed++

      console.log(`\n📋 処理中 [${i + 1}/${urls.length}]: ${url}`)
      console.log('-'.repeat(40))

      try {
        const scrapedData = await this.scrapeUrl(url)

        if (scrapedData.isValid) {
          result.success.push(scrapedData)
          result.totalSuccess++
          console.log(`✅ 成功 [${i + 1}/${urls.length}]: ${scrapedData.title}`)
        } else {
          result.failed.push({ url, error: scrapedData.errorMessage || '不明なエラー' })
          result.totalFailed++
          console.log(`❌ 失敗 [${i + 1}/${urls.length}]: ${scrapedData.errorMessage}`)
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '不明なエラー'
        result.failed.push({ url, error: errorMsg })
        result.totalFailed++
        console.log(`❌ 例外発生 [${i + 1}/${urls.length}]: ${errorMsg}`)
      }

      // 最後のURL以外はスリープ
      if (i < urls.length - 1) {
        console.log(`⏳ ${this.SLEEP_MS}ms待機中...`)
        await this.sleep(this.SLEEP_MS)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`📊 スクレイピング完了サマリー:`)
    console.log(`  - 総処理数: ${result.totalProcessed}件`)
    console.log(`  - 成功: ${result.totalSuccess}件`)
    console.log(`  - 失敗: ${result.totalFailed}件`)
    console.log(`  - スキップ: ${result.totalSkipped}件`)
    console.log(`  - 成功率: ${((result.totalSuccess / result.totalProcessed) * 100).toFixed(1)}%`)
    console.log('='.repeat(60))

    return result
  }

  /**
   * HTMLパース処理
   */
  private parseHtml(html: string, url: string): ScrapedData {
    try {
      // jsdomを使ってHTMLパース
      const dom = new JSDOM(html)
      const doc = dom.window.document

      // タイトル抽出
      const title = this.extractTitle(doc, url)
      
      // 本文抽出
      const content = this.extractContent(doc)
      
      // メタデータ抽出
      const metadata = this.extractMetadata(doc)
      
      // 統計情報
      const paragraphCount = this.countParagraphs(content)
      const headingCount = this.countHeadings(doc)
      
      // サマリー生成
      const summary = this.generateSummary(content)

      return {
        url,
        title,
        content,
        summary,
        sourceName: this.extractSourceName(url),
        sourceType: this.determineSourceType(url),
        contentType: 'html',
        contentLength: html.length,
        paragraphCount,
        headingCount,
        extractedMetadata: metadata,
        collectedAt: new Date(),
        isValid: true
      }

    } catch (error) {
      console.log(`❌ HTMLパースエラー: ${url} - ${error}`)
      return this.createInvalidResult(url, `HTMLパースエラー: ${error}`)
    }
  }

  /**
   * タイトル抽出
   */
  private extractTitle(doc: Document, url: string): string {
    // 優先順位: title > h1 > h2 > URL
    const title = doc.querySelector('title')?.textContent?.trim()
    if (title && title.length > 0) return title

    const h1 = doc.querySelector('h1')?.textContent?.trim()
    if (h1 && h1.length > 0) return h1

    const h2 = doc.querySelector('h2')?.textContent?.trim()
    if (h2 && h2.length > 0) return h2

    // URLからドメイン名を抽出
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return 'タイトルなし'
    }
  }

  /**
   * 本文抽出
   */
  private extractContent(doc: Document): string {
    // 優先順位: main > article > .content > body
    const selectors = ['main', 'article', '.content', '.main-content', 'body']
    
    for (const selector of selectors) {
      const element = doc.querySelector(selector)
      if (element) {
        const text = element.textContent?.trim()
        if (text && text.length > 100) {
          return text
        }
      }
    }

    // フォールバック: body全体
    return doc.body?.textContent?.trim() || ''
  }

  /**
   * メタデータ抽出
   */
  private extractMetadata(doc: Document): any {
    const metadata: any = {}
    
    // metaタグから抽出
    const metaTags = doc.querySelectorAll('meta')
    metaTags.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property')
      const content = meta.getAttribute('content')
      if (name && content) {
        metadata[name] = content
      }
    })

    // 言語情報
    const lang = doc.documentElement.getAttribute('lang')
    if (lang) metadata.language = lang

    return metadata
  }

  /**
   * 段落数カウント
   */
  private countParagraphs(content: string): number {
    return content.split('\n\n').filter(p => p.trim().length > 0).length
  }

  /**
   * 見出し数カウント
   */
  private countHeadings(doc: Document): number {
    return doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length
  }

  /**
   * サマリー生成
   */
  private generateSummary(content: string): string {
    const maxLength = 200
    if (content.length <= maxLength) return content
    
    // 最初の200文字で切って、最後の完全な文で終わる
    const truncated = content.substring(0, maxLength)
    const lastPeriod = truncated.lastIndexOf('。')
    
    if (lastPeriod > maxLength * 0.7) {
      return truncated.substring(0, lastPeriod + 1)
    }
    
    return truncated + '...'
  }

  /**
   * ソース名抽出
   */
  private extractSourceName(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return 'unknown'
    }
  }

  /**
   * ソースタイプ判定
   */
  private determineSourceType(url: string): 'official' | 'medical' | 'academic' | 'community' {
    const hostname = this.extractSourceName(url).toLowerCase()
    
    if (hostname.includes('ganjoho.jp') || hostname.includes('mhlw.go.jp')) {
      return 'official'
    }
    
    if (hostname.includes('jca.gr.jp') || hostname.includes('jbcs.xsrv.jp')) {
      return 'medical'
    }
    
    if (hostname.includes('ac.jp') || hostname.includes('edu')) {
      return 'academic'
    }
    
    return 'community'
  }

  /**
   * キャッシュ関連
   */
  private getFromCache(url: string): ScrapedData | null {
    const cached = this.cache.get(url)
    if (!cached) return null

    const now = new Date()
    const hoursDiff = (now.getTime() - cached.collectedAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > this.CACHE_DURATION_HOURS) {
      this.cache.delete(url)
      return null
    }

    return cached
  }

  private saveToCache(url: string, data: ScrapedData): void {
    this.cache.set(url, data)
  }

  private invalidUrls: Set<string> = new Set()

  private isInvalidUrl(url: string): boolean {
    return this.invalidUrls.has(url)
  }

  private markInvalidUrl(url: string, reason: string): void {
    this.invalidUrls.add(url)
    console.log(`🚫 無効URLマーク: ${url} - ${reason}`)
  }

  /**
   * コンテンツタイプチェック
   */
  private isSupportedContentType(contentType: string): boolean {
    return contentType.includes('text/html') || 
           contentType.includes('application/xhtml+xml') ||
           contentType.includes('text/plain')
  }

  /**
   * 無効結果作成
   */
  private createInvalidResult(url: string, errorMessage: string): ScrapedData {
    return {
      url,
      title: 'エラー',
      content: '',
      sourceName: this.extractSourceName(url),
      sourceType: 'community',
      contentType: 'html',
      contentLength: 0,
      paragraphCount: 0,
      headingCount: 0,
      extractedMetadata: {},
      collectedAt: new Date(),
      isValid: false,
      errorMessage
    }
  }

  /**
   * スリープ関数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * キャッシュ統計
   */
  getCacheStats(): { total: number; invalid: number } {
    return {
      total: this.cache.size,
      invalid: this.invalidUrls.size
    }
  }

  /**
   * キャッシュクリア
   */
  clearCache(): void {
    this.cache.clear()
    this.invalidUrls.clear()
    console.log('🗑️ キャッシュをクリアしました')
  }
}

// グローバルインスタンス
export const simpleScraper = new SimpleScraper()

// CommonJS対応
module.exports = { SimpleScraper, simpleScraper } 