import { NextRequest, NextResponse } from 'next/server'
import { BackgroundCollectionService } from '@/lib/services/backgroundCollectionService'
import { InformationPoolService } from '@/lib/services/informationPoolService'

/**
 * バックグラウンド収集のテスト実行API
 * 手動でバックグラウンド収集タスクを実行して動作確認する
 */
export async function POST(request: NextRequest) {
  const logs: string[] = []
  
  try {
    const startTime = Date.now()
    
    const log = (message: string) => {
      const timestamp = new Date().toISOString()
      const logMessage = `[${timestamp}] ${message}`
      console.log(logMessage)
      logs.push(logMessage)
    }
    
    log('🧪 バックグラウンド収集テスト実行開始')
    
    const backgroundService = new BackgroundCollectionService()
    
    // リクエストボディから実行するタスクIDを取得（オプション）
    const body = await request.json().catch(() => ({}))
    const { taskId } = body
    
    let result
    
    if (taskId) {
      // 特定タスクの実行
      log(`🎯 指定タスク実行開始: ${taskId}`)
      log(`⏰ 開始時刻: ${new Date().toISOString()}`)
      
      // タスクIDに応じた詳細ログ
      if (taskId === 'mhlw-monthly-guidelines') {
        log(`🏥 厚労省ガイドライン月次収集タスク実行`)
        log(`📋 実データURLからのスクレイピングを開始します`)
      } else if (taskId === 'medical-guidelines-monthly') {
        log(`🏥 医学会ガイドライン月次収集タスク実行`)
        log(`📋 医学会URLからのスクレイピングを開始します`)
      } else if (taskId === 'test-site-collection') {
        log(`🧪 テストサイト収集タスク実行`)
        log(`📋 安全なテストサイトからのスクレイピングを開始します`)
      }
      
      // 進行状況のログ出力
      const progressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        log(`⏳ タスク ${taskId} 実行中... (${elapsed}秒経過)`)
      }, 10000) // 10秒ごとにログ出力
      
      try {
        result = await backgroundService.executeTask(taskId)
        clearInterval(progressInterval)
        
        const totalTime = Math.floor((Date.now() - startTime) / 1000)
        log(`✅ タスク ${taskId} 完了: ${totalTime}秒`)
        log(`📊 収集結果: ${result.itemsCollected}件`)
        log(`💾 実行時間: ${result.executionTime}ms`)
        
        if (!result.success) {
          log(`❌ タスクエラー: ${result.error}`)
        }
        
      } catch (error) {
        clearInterval(progressInterval)
        throw error
      }
      
      // BackgroundCollectionServiceのログも取得
      const serviceLogs = backgroundService.getLogs()
      const allLogs = [...logs, ...serviceLogs]
      
      return NextResponse.json({
        success: true,
        message: `タスク ${taskId} の実行が完了しました`,
        result,
        totalExecutionTime: Date.now() - startTime,
        logs: allLogs, // 全ログをレスポンスに含める
        timestamp: new Date().toISOString()
      })
      
    } else {
      // 全タスクの実行
      log('🚀 全タスク実行開始')
      log(`⏰ 開始時刻: ${new Date().toISOString()}`)
      
      const progressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        log(`⏳ 全タスク実行中... (${elapsed}秒経過)`)
      }, 10000)
      
      let allResults
      try {
        allResults = await backgroundService.executeAllTasks()
        clearInterval(progressInterval)
        
        const totalTime = Math.floor((Date.now() - startTime) / 1000)
        log(`✅ 全タスク完了: ${totalTime}秒`)
        log(`📊 収集結果: ${allResults.totalItemsCollected}件`)
        log(`📈 成功タスク: ${allResults.successfulTasks}/${allResults.totalTasks}`)
        
      } catch (error) {
        clearInterval(progressInterval)
        throw error
      }
      
      // BackgroundCollectionServiceのログも取得
      const serviceLogs = backgroundService.getLogs()
      const allLogs = [...logs, ...serviceLogs]
      
      return NextResponse.json({
        success: true,
        message: 'バックグラウンド収集テストが完了しました',
        results: allResults,
        totalExecutionTime: Date.now() - startTime,
        logs: allLogs, // 全ログをレスポンスに含める
        timestamp: new Date().toISOString()
      })
    }
    

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー'
    console.error('❌ バックグラウンド収集テストエラー:', error)
    
    if (logs) {
      logs.push(`❌ エラー発生: ${errorMessage}`)
    }
    
    return NextResponse.json({
      success: false,
      message: 'バックグラウンド収集テストに失敗しました',
      error: errorMessage,
      logs: logs || [],
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * バックグラウンド収集の設定情報を取得
 */
export async function GET() {
  try {
    const backgroundService = new BackgroundCollectionService()
    const schedules = backgroundService.getTaskSchedules()
    
    return NextResponse.json({
      success: true,
      message: 'バックグラウンド収集設定を取得しました',
      schedules,
      totalTasks: schedules.length,
      enabledTasks: schedules.filter(s => s.schedule.enabled).length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ バックグラウンド収集設定取得エラー:', error)
    
    return NextResponse.json({
      success: false,
      message: 'バックグラウンド収集設定の取得に失敗しました',
      error: error instanceof Error ? error.message : '不明なエラー',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 