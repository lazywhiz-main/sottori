import { RealDataCollectionService } from './realDataCollectors'
import { InfoQuery } from './infoCollection'

interface CollectionSchedule {
  cron: string
  frequency: 'daily' | 'weekly' | 'twice_daily' | 'monthly'
  lastRun?: Date
  nextRun?: Date
  enabled: boolean
}

interface CollectionTask {
  id: string
  name: string
  description: string
  collector: () => Promise<any[]>
  schedule: CollectionSchedule
  category: 'official' | 'medical' | 'academic' | 'support'
  targetCancerTypes: string[]
  targetRegions: string[]
}

export class BackgroundCollectionService {
  private collectionService: RealDataCollectionService
  private tasks: CollectionTask[] = []
  private logs: string[] = []

  constructor() {
    this.collectionService = new RealDataCollectionService()
    this.initializeTasks()
  }

  // ログをキャプチャするメソッド
  private log(message: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    this.logs.push(logMessage)
  }

  // ログを取得するメソッド
  getLogs(): string[] {
    return this.logs
  }

  // ログをクリアするメソッド
  clearLogs() {
    this.logs = []
  }

  private initializeTasks(): void {
    this.tasks = [
      {
        id: 'mhlw-monthly-guidelines',
        name: '厚労省ガイドライン月次収集',
        description: '厚生労働省がん情報サービスからの月次ガイドライン収集',
        collector: () => this.collectMHLWGuidelines(),
        schedule: {
          cron: '0 2 1 * *', // 毎月1日の午前2時
          frequency: 'monthly',
          enabled: true
        },
        category: 'official',
        targetCancerTypes: ['breast_cancer', 'lung_cancer', 'stomach_cancer', 'colorectal_cancer'],
        targetRegions: ['all']
      },
      {
        id: 'medical-guidelines-monthly',
        name: '医学会ガイドライン月次収集',
        description: '各医学会からの月次ガイドライン収集',
        collector: () => this.collectMedicalSocietyGuidelines(),
        schedule: {
          cron: '0 3 1 * *', // 毎月1日の午前3時
          frequency: 'monthly',
          enabled: true
        },
        category: 'medical',
        targetCancerTypes: ['breast_cancer', 'lung_cancer', 'stomach_cancer', 'colorectal_cancer'],
        targetRegions: ['all']
      },
      {
        id: 'test-site-collection',
        name: 'テストサイト収集（開発用）',
        description: '安全なテストサイトからのデータ収集（開発・テスト用）',
        collector: () => this.collectTestSiteData(),
        schedule: {
          cron: '0 */6 * * *', // 6時間ごと
          frequency: 'daily',
          enabled: true
        },
        category: 'support',
        targetCancerTypes: ['all'],
        targetRegions: ['all']
      },
      {
        id: 'retry-structured-processing',
        name: '構造化リトライ処理',
        description: '構造化失敗したローデータのみを再処理（スクレイピングなし）',
        collector: () => this.retryStructuredProcessing(),
        schedule: {
          cron: '0 */2 * * *', // 2時間ごと
          frequency: 'daily',
          enabled: true
        },
        category: 'support',
        targetCancerTypes: ['all'],
        targetRegions: ['all']
      }
    ]
  }

  /**
   * 厚労省ガイドライン月次収集（新戦略）
   */
  private async collectMHLWGuidelines(): Promise<any[]> {
    console.log('📋 [月次] 厚労省ガイドライン収集開始')
    console.log('🎯 対象がん種: breast_cancer, lung_cancer, stomach_cancer, colorectal_cancer')
    
    // URLリストを事前に出力
    const { generateMHLWUrls } = await import('../../const/scraping_urls')
    const cancerTypes = ['breast_cancer', 'lung_cancer', 'stomach_cancer', 'colorectal_cancer']
    
    console.log('📋 収集対象URLリスト（事前確認）:')
    cancerTypes.forEach(cancerType => {
      const urls = generateMHLWUrls(cancerType)
      console.log(`  ${cancerType}: ${urls.length}件`)
      urls.slice(0, 3).forEach((url, index) => {
        console.log(`    ${index + 1}. ${url}`)
      })
      if (urls.length > 3) {
        console.log(`    ... 他${urls.length - 3}件`)
      }
    })
    
    const allResults: any[] = []
    let totalCollected = 0
    
    for (const cancerType of cancerTypes) {
      try {
        console.log(`📋 ${cancerType}のガイドライン収集開始...`)
        
        const query: InfoQuery = {
          cancerType,
          stage: 'all',
          concernAreas: ['treatment_options', 'diagnosis', 'support_resources']
        }
        
        console.log(`🔍 クエリ実行: ${cancerType} (${query.concernAreas.join(', ')})`)
        
        // 直接MHLWGuidelineCollectorを使用して詳細ログを取得
        const mhlwCollector = new (await import('./realDataCollectors')).MHLWGuidelineCollector()
        const results = await mhlwCollector.collectFromSource(query)
        
        console.log(`✅ ${cancerType}: ${results.length}件収集完了`)
        if (results.length > 0) {
          console.log(`📊 ${cancerType}収集内容プレビュー:`)
          results.slice(0, 2).forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.title || 'タイトル未設定'} (${item.content?.length || 0}文字)`)
          })
        }
        
        allResults.push(...results)
        totalCollected += results.length
        
        // API制限回避のため少し待機
        console.log(`⏳ ${cancerType}完了、次のがん種まで2秒待機...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.error(`❌ ${cancerType}収集エラー:`, error)
        console.error(`❌ エラー詳細: ${error instanceof Error ? error.message : '不明なエラー'}`)
      }
    }
    
    console.log(`📋 厚労省ガイドライン月次収集完了`)
    console.log(`📈 収集結果サマリー: 総計${allResults.length}件 (${totalCollected}件成功)`)
    console.log(`🎯 対象がん種: ${cancerTypes.join(', ')}`)
    
    return allResults
  }

  /**
   * 医学会ガイドライン月次収集（実装完了）
   */
  private async collectMedicalSocietyGuidelines(): Promise<any[]> {
    console.log('🏥 [月次] 医学会ガイドライン収集開始')
    
    const cancerTypes = ['breast_cancer', 'lung_cancer', 'stomach_cancer', 'colorectal_cancer']
    const allResults: any[] = []
    
    for (const cancerType of cancerTypes) {
      try {
        console.log(`🏥 ${cancerType}の医学会ガイドライン収集中...`)
        
        const query: InfoQuery = {
          cancerType,
          stage: 'all',
          concernAreas: ['treatment_options', 'diagnosis', 'clinical_trials']
        }
        
        // MedicalSocietyGuidelineCollectorを使用して収集
        const results = await this.collectionService.collectAllRealData(query)
        const medicalResults = results.filter(item => item.sourceType === 'medical')
        allResults.push(...medicalResults)
        
        console.log(`✅ ${cancerType}医学会: ${medicalResults.length}件収集`)
        
        // 医学会サイトへの負荷軽減
        await new Promise(resolve => setTimeout(resolve, 3000))
        
      } catch (error) {
        console.error(`❌ ${cancerType}医学会収集エラー:`, error)
      }
    }
    
    console.log(`🏥 医学会ガイドライン月次収集完了: 総計${allResults.length}件`)
    return allResults
  }

  /**
   * テストサイト収集（開発・テスト用）
   */
  private async collectTestSiteData(): Promise<any[]> {
    this.log('🧪 [テスト] テストサイト収集開始')
    
    try {
      const query: InfoQuery = {
        cancerType: 'general_cancer',
        stage: 'all',
        concernAreas: ['support_resources', 'test_data']
      }
      
      this.log('🔍 テストサイト収集クエリ実行...')
      
      // 直接RealDataCollectionServiceのcollectTestSiteDataを使用
      const results = await this.collectionService.collectTestSiteData(query)
      
      this.log(`🧪 テストサイト収集完了: ${results.length}件`)
      if (results.length > 0) {
        this.log('📊 テストサイト収集内容プレビュー:')
        results.slice(0, 3).forEach((item, index) => {
          this.log(`  ${index + 1}. ${item.title || 'タイトル未設定'} (${item.content?.length || 0}文字)`)
          this.log(`     URL: ${item.sourceUrl}`)
        })
      } else {
        this.log('⚠️ テストサイトからデータが取得できませんでした')
      }
      
      return results
      
    } catch (error) {
      this.log(`❌ テストサイト収集エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
      return []
    }
  }

  /**
   * 構造化リトライ処理（スクレイピングなし）
   */
  private async retryStructuredProcessing(): Promise<any[]> {
    console.log('🔄 [リトライ] 構造化専用リトライ開始')
    
    try {
      // InformationPoolServiceを動的にインポート（循環参照回避）
      const { InformationPoolService } = await import('./informationPoolService')
      const poolService = new InformationPoolService()
      
      const result = await poolService.retryStructuredProcessing()
      
      console.log(`🔄 構造化リトライ完了: 対象${result.retried}件, 成功${result.success}件, エラー${result.errors.length}件`)
      
      // 成功した件数を返す（実際のアイテムは返さない）
      return Array(result.success).fill({ retry_processed: true })
      
    } catch (error) {
      console.error('❌ 構造化リトライエラー:', error)
      return []
    }
  }

  async executeTask(taskId: string): Promise<{
    success: boolean
    itemsCollected: number
    error?: string
    executionTime: number
  }> {
    const startTime = Date.now()
    
    try {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task) {
        throw new Error(`タスクが見つかりません: ${taskId}`)
      }

      this.log(`🔄 バックグラウンド収集開始: ${task.name}`)
      this.log(`📋 タスク詳細: カテゴリ=${task.category}, 対象がん種=${task.targetCancerTypes.join(', ')}`)
      
      this.log(`🚀 コレクター実行開始...`)
      const collectedItems = await task.collector()
      this.log(`📦 収集完了: ${collectedItems.length}件のアイテムを取得`)
      
      if (collectedItems.length > 0) {
        this.log(`📊 収集内容プレビュー:`)
        collectedItems.slice(0, 3).forEach((item, index) => {
          this.log(`  ${index + 1}. ${item.title || 'タイトル未設定'} (${item.content?.length || 0}文字)`)
        })
      }
      
      this.log(`💾 情報プールへの保存開始...`)
      const savedCount = await this.saveToInformationPool(collectedItems, task)
      
      const executionTime = Date.now() - startTime
      
      this.log(`✅ バックグラウンド収集完了: ${task.name}`)
      this.log(`📈 実行結果: 収集${collectedItems.length}件 → 保存${savedCount}件 (${executionTime}ms)`)
      
      return {
        success: true,
        itemsCollected: savedCount,
        executionTime
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      
      this.log(`❌ バックグラウンド収集失敗: ${taskId}`)
      this.log(`❌ エラー詳細: ${errorMessage}`)
      this.log(`❌ 実行時間: ${executionTime}ms`)
      
      return {
        success: false,
        itemsCollected: 0,
        error: errorMessage,
        executionTime
      }
    }
  }

  async executeAllTasks(): Promise<{
    totalTasks: number
    successfulTasks: number
    totalItemsCollected: number
    results: any[]
  }> {
    console.log('🚀 全バックグラウンドタスク実行開始')
    
    const results = []
    let totalItemsCollected = 0
    let successfulTasks = 0

    for (const task of this.tasks) {
      if (task.schedule.enabled) {
        const result = await this.executeTask(task.id)
        results.push({
          taskId: task.id,
          taskName: task.name,
          ...result
        })
        
        if (result.success) {
          successfulTasks++
          totalItemsCollected += result.itemsCollected
        }
      }
    }

    console.log(`🏁 全バックグラウンドタスク実行完了: ${successfulTasks}/${this.tasks.length}成功`)
    
    return {
      totalTasks: this.tasks.length,
      successfulTasks,
      totalItemsCollected,
      results
    }
  }

  getTaskSchedules(): Array<{
    id: string
    name: string
    schedule: CollectionSchedule
    category: string
    lastRun?: Date
    nextRun?: Date
  }> {
    return this.tasks.map(task => ({
      id: task.id,
      name: task.name,
      schedule: task.schedule,
      category: task.category,
      lastRun: task.schedule.lastRun,
      nextRun: task.schedule.nextRun
    }))
  }

  private async saveToInformationPool(items: any[], task: CollectionTask): Promise<number> {
    this.log(`💾 データ保存開始: ${items.length}件 (タスク: ${task.name})`)
    
    if (items.length === 0) {
      this.log('📝 保存対象データなし')
      return 0
    }

    this.log(`📋 保存対象アイテム詳細:`)
    items.slice(0, 3).forEach((item, index) => {
      this.log(`  ${index + 1}. ${item.title} (raw: ${item.rawContent?.length || 0}文字, content: ${item.content?.length || 0}文字)`)
    })

    try {
      // InformationPoolServiceを動的にインポート（循環参照回避）
      const { InformationPoolService } = await import('./informationPoolService')
      const poolService = new InformationPoolService()
      
      this.log(`💾 情報プールに保存開始: ${items.length}件`)
      const result = await poolService.saveCollectedItems(items)
      
      this.log(`💾 情報プール保存結果: 成功${result.saved}件、スキップ${result.skipped}件、エラー${result.errors.length}件`)
      
      if (result.errors.length > 0) {
        this.log(`❌ 保存エラー詳細: ${result.errors.slice(0, 3).join(', ')}`)
      }
      
      return result.saved

    } catch (error) {
      this.log(`❌ 情報プール保存処理エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
      return 0
    }
  }
}
