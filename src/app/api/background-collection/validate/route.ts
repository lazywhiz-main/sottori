import { NextRequest, NextResponse } from 'next/server'
import { BackgroundCollectionService } from '../../../../lib/services/backgroundCollectionService'
import { InformationPoolService } from '../../../../lib/services/informationPoolService'

/**
 * スクレイピング機能検証API
 * スクレイピング処理の各段階を検証し、問題点を特定する
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
    
    log('🔍 スクレイピング機能検証開始')
    
    const body = await request.json()
    const { 
      cancerType = 'breast_cancer',
      testMode = 'urls_only', // urls_only, single_url, full_collection
      targetUrl,
      maxUrls = 3
    } = body
    
    log(`🎯 検証設定: cancerType=${cancerType}, testMode=${testMode}`)
    
    const backgroundService = new BackgroundCollectionService()
    const poolService = new InformationPoolService()
    
    let results: any = {}
    
    switch (testMode) {
      case 'urls_only':
        // URLリストのみの検証
        log('📋 URLリスト検証モード')
        const { generateMHLWUrls: generateUrls, TEST_SCRAPING_URLS } = await import('@/const/scraping_urls')
        
        const mhlwUrls = generateUrls(cancerType)
        const testUrls = TEST_SCRAPING_URLS.slice(0, maxUrls)
        
        results = {
          mhlwUrls: {
            count: mhlwUrls.length,
            sample: mhlwUrls.slice(0, 5),
            cancerType
          },
          testUrls: {
            count: testUrls.length,
            urls: testUrls
          }
        }
        
        log(`📊 URLリスト生成完了: MHLW=${mhlwUrls.length}件, テスト=${testUrls.length}件`)
        break
        
      case 'single_url':
        // 単一URLのスクレイピングテスト
        if (!targetUrl) {
          throw new Error('targetUrl parameter is required for single_url mode')
        }
        
        log(`🌐 単一URLスクレイピングテスト: ${targetUrl}`)
        
        try {
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Sottori/1.0; +https://sottori.com)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'ja,en;q=0.5',
            },
            signal: AbortSignal.timeout(15000)
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const html = await response.text()
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
          const title = titleMatch ? titleMatch[1].trim() : 'タイトル未取得'
          
          const paragraphCount = (html.match(/<p[^>]*>/g) || []).length
          const headingCount = (html.match(/<h[1-6][^>]*>/g) || []).length
          
          results = {
            url: targetUrl,
            accessible: true,
            status: response.status,
            title,
            contentLength: html.length,
            paragraphCount,
            headingCount,
            contentType: response.headers.get('content-type'),
            lastModified: response.headers.get('last-modified')
          }
          
          log(`✅ 単一URLテスト成功: ${title} (${html.length}文字)`)
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '不明なエラー'
          log(`❌ 単一URLテスト失敗: ${errorMessage}`)
          
          results = {
            url: targetUrl,
            accessible: false,
            error: errorMessage
          }
        }
        break
        
      case 'full_collection':
        // 完全なスクレイピングテスト（制限付き）
        log('🚀 完全スクレイピングテスト開始')
        
        // テストサイトのみで実行
        const testQuery = {
          cancerType,
          stage: 'all',
          concernAreas: ['treatment_options', 'support_resources']
        }
        
        const { RealDataCollectionService } = await import('../../../../lib/services/realDataCollectors')
        const collectionService = new RealDataCollectionService()
        
        const collectedData = await collectionService.collectTestSiteData(testQuery)
        
        if (collectedData.length > 0) {
          // 情報プールに保存テスト
          log(`💾 情報プール保存テスト: ${collectedData.length}件`)
          const saveResult = await poolService.saveCollectedItems(collectedData)
          
          results = {
            collection: {
              totalCollected: collectedData.length,
              sampleItems: collectedData.slice(0, 2).map(item => ({
                title: item.title,
                category: item.category,
                contentLength: item.content?.length || 0
              }))
            },
            saveResult
          }
          
          log(`✅ 完全テスト成功: 収集${collectedData.length}件, 保存${saveResult.saved}件`)
        } else {
          results = {
            collection: {
              totalCollected: 0,
              error: 'データ収集に失敗'
            }
          }
          log(`❌ 完全テスト失敗: データ収集0件`)
        }
        break
        
      case 'real_data_collection':
        log('🏥 実データ収集テスト開始')

        const { generateMHLWUrls } = await import('../../../../const/scraping_urls')
        const urls = generateMHLWUrls(cancerType).slice(0, maxUrls || 10)
        const urlResults = []

        for (let i = 0; i < urls.length; i++) {
          const url = urls[i]
          log(`[${i + 1}/${urls.length}] アクセス: ${url}`)
          try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 10000)
            const response = await fetch(url, { signal: controller.signal })
            clearTimeout(timeout)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const html = await response.text()
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
            const title = titleMatch ? titleMatch[1].trim() : 'タイトル未取得'
            urlResults.push({ url, status: 'ok', httpStatus: response.status, title })
            log(`✅ OK: ${url} (${response.status})`)
          } catch (e: any) {
            urlResults.push({ url, status: e.name === 'AbortError' ? 'timeout' : 'error', error: e.message })
            log(`❌ ${e.name === 'AbortError' ? 'Timeout' : 'Error'}: ${url} (${e.message})`)
          }
          // サーバー負荷軽減
          await new Promise(r => setTimeout(r, 500))
        }

        results = {
          totalTested: urlResults.length,
          successCount: urlResults.filter(r => r.status === 'ok').length,
          errorCount: urlResults.filter(r => r.status !== 'ok').length,
          urlResults
        }
        log(`📊 実データURLテスト完了: 成功${results.successCount}件, エラー${results.errorCount}件`)
        break
        
      case 'url_batch_test':
        // 複数URLの一括テスト
        log('🔗 複数URL一括テスト開始')
        
        const { generateMHLWUrls: generateBatchUrls, MANUAL_ADDITIONAL_URLS } = await import('../../../../const/scraping_urls')
        const targetUrls = generateBatchUrls(cancerType).slice(0, maxUrls)
        
        log(`📋 テスト対象URL: ${targetUrls.length}件`)
        targetUrls.forEach((url, index) => {
          log(`  ${index + 1}. ${url}`)
        })
        
        const urlTestResults = []
        let successCount = 0
        let errorCount = 0
        
        for (let i = 0; i < targetUrls.length; i++) {
          const url = targetUrls[i]
          log(`[${i + 1}/${targetUrls.length}] テスト中: ${url}`)
          
          try {
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Sottori/1.0; +https://sottori.com)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ja,en;q=0.5',
              },
              signal: AbortSignal.timeout(15000)
            })
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            
            const html = await response.text()
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
            const title = titleMatch ? titleMatch[1].trim() : 'タイトル未取得'
            
            const paragraphCount = (html.match(/<p[^>]*>/g) || []).length
            const headingCount = (html.match(/<h[1-6][^>]*>/g) || []).length
            
            urlTestResults.push({
              url,
              accessible: true,
              status: response.status,
              title,
              contentLength: html.length,
              paragraphCount,
              headingCount,
              contentType: response.headers.get('content-type')
            })
            
            successCount++
            log(`✅ URLテスト成功: ${title} (${html.length}文字)`)
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '不明なエラー'
            urlTestResults.push({
              url,
              accessible: false,
              error: errorMessage
            })
            
            errorCount++
            log(`❌ URLテスト失敗: ${errorMessage}`)
          }
          
          // サーバー負荷軽減のため少し待機
          if (i < targetUrls.length - 1) {
            log(`⏳ 次のURLまで2秒待機...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
        
        results = {
          urlBatchTest: {
            totalUrls: targetUrls.length,
            successCount,
            errorCount,
            results: urlTestResults,
            summary: {
              accessible: successCount,
              errors: errorCount,
              averageContentLength: urlTestResults
                .filter(r => r.accessible)
                .reduce((sum, r) => sum + (r.contentLength || 0), 0) / successCount || 0
            }
          }
        }
        
        log(`📊 URL一括テスト完了: 成功${successCount}件, エラー${errorCount}件`)
        break
        
      default:
        throw new Error(`Unknown test mode: ${testMode}`)
    }
    
    const totalTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'スクレイピング機能検証が完了しました',
      data: results,
      executionTime: totalTime,
      logs,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー'
    console.error('❌ スクレイピング機能検証エラー:', error)
    
    logs.push(`❌ エラー発生: ${errorMessage}`)
    
    return NextResponse.json({
      success: false,
      message: 'スクレイピング機能検証に失敗しました',
      error: errorMessage,
      logs,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * 検証設定の取得
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'スクレイピング機能検証設定を取得しました',
      data: {
        testModes: [
          {
            mode: 'urls_only',
            description: 'URLリストのみを生成・表示',
            parameters: ['cancerType', 'maxUrls']
          },
          {
            mode: 'single_url',
            description: '単一URLのスクレイピングテスト',
            parameters: ['targetUrl']
          },
          {
            mode: 'full_collection',
            description: '完全なスクレイピングテスト（テストサイトのみ）',
            parameters: ['cancerType']
          },
          {
            mode: 'real_data_collection',
            description: '実データ収集テスト（厚労省URL等）',
            parameters: ['cancerType']
          },
          {
            mode: 'url_batch_test',
            description: '複数URLの一括テスト（厚労省URL等）',
            parameters: ['cancerType', 'maxUrls']
          }
        ],
        supportedCancerTypes: [
          'breast_cancer',
          'lung_cancer', 
          'stomach_cancer',
          'colorectal_cancer',
          'prostate_cancer',
          'liver_cancer',
          'pancreas_cancer',
          'esophagus_cancer',
          'ovary_cancer',
          'cervix_cancer',
          'bladder_cancer',
          'kidney_cancer'
        ]
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ 検証設定取得エラー:', error)
    
    return NextResponse.json({
      success: false,
      message: '検証設定の取得に失敗しました',
      error: error instanceof Error ? error.message : '不明なエラー',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 