import { NextRequest, NextResponse } from 'next/server'
import { 
  TEST_SCRAPING_URLS, 
  generateMHLWUrls, 
  getMedicalSocietyUrls, 
  MANUAL_ADDITIONAL_URLS,
  MEDICAL_SOCIETY_URLS,
  REGIONAL_HOSPITAL_URLS 
} from '@/const/scraping_urls'

/**
 * スクレイピング対象URLリスト取得API
 * スクレイピングを実行せずに、対象URLの一覧のみを取得する
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cancerType = searchParams.get('cancerType') || 'breast_cancer'
    const mode = searchParams.get('mode') || 'all' // all, test, mhlw, medical, manual
    
    console.log(`📋 URLリスト取得要求: cancerType=${cancerType}, mode=${mode}`)
    
    let urls: string[] = []
    let urlDetails: Array<{
      url: string
      source: string
      cancerType?: string
      description?: string
    }> = []
    
    // モードに応じてURLを取得
    switch (mode) {
      case 'test':
        urls = TEST_SCRAPING_URLS
        urlDetails = TEST_SCRAPING_URLS.map(url => ({
          url,
          source: 'test_site',
          description: 'テスト用サイト'
        }))
        break
        
      case 'mhlw':
        urls = generateMHLWUrls(cancerType)
        urlDetails = urls.map(url => ({
          url,
          source: 'mhlw_ganjoho',
          cancerType,
          description: '厚生労働省がん情報サービス'
        }))
        break
        
      case 'medical':
        const medicalSocieties = getMedicalSocietyUrls(cancerType)
        urls = medicalSocieties.map(society => society.baseUrl)
        urlDetails = medicalSocieties.map(society => ({
          url: society.baseUrl,
          source: 'medical_society',
          cancerType,
          description: `${society.name}ガイドライン`
        }))
        break
        
      case 'manual':
        urls = MANUAL_ADDITIONAL_URLS
        urlDetails = MANUAL_ADDITIONAL_URLS.map(url => ({
          url,
          source: 'manual_addition',
          description: '手動追加URL'
        }))
        break
        
      case 'regional':
        urls = REGIONAL_HOSPITAL_URLS
        urlDetails = REGIONAL_HOSPITAL_URLS.map(url => ({
          url,
          source: 'regional_hospital',
          description: '地域がん診療連携拠点病院'
        }))
        break
        
      case 'all':
      default:
        // 全URLを取得
        const mhlwUrls = generateMHLWUrls(cancerType)
        const allSocieties = getMedicalSocietyUrls(cancerType)
        const medicalUrls = allSocieties.map(society => society.baseUrl)
        
        urls = [
          ...TEST_SCRAPING_URLS,
          ...mhlwUrls,
          ...medicalUrls,
          ...MANUAL_ADDITIONAL_URLS,
          ...REGIONAL_HOSPITAL_URLS
        ]
        
        urlDetails = [
          ...TEST_SCRAPING_URLS.map(url => ({
            url,
            source: 'test_site',
            description: 'テスト用サイト'
          })),
          ...mhlwUrls.map(url => ({
            url,
            source: 'mhlw_ganjoho',
            cancerType,
            description: '厚生労働省がん情報サービス'
          })),
          ...medicalUrls.map((url, index) => ({
            url,
            source: 'medical_society',
            cancerType,
            description: `${allSocieties[index]?.name || '医学会'}ガイドライン`
          })),
          ...MANUAL_ADDITIONAL_URLS.map(url => ({
            url,
            source: 'manual_addition',
            description: '手動追加URL'
          })),
          ...REGIONAL_HOSPITAL_URLS.map(url => ({
            url,
            source: 'regional_hospital',
            description: '地域がん診療連携拠点病院'
          }))
        ]
        break
    }
    
    // 重複除去
    const uniqueUrls = [...new Set(urls)]
    const uniqueUrlDetails = urlDetails.filter((detail, index, self) => 
      index === self.findIndex(d => d.url === detail.url)
    )
    
    console.log(`📋 URLリスト生成完了: ${uniqueUrls.length}件 (重複除去後)`)
    
    return NextResponse.json({
      success: true,
      message: 'スクレイピング対象URLリストを取得しました',
      data: {
        totalUrls: uniqueUrls.length,
        cancerType,
        mode,
        urls: uniqueUrls,
        urlDetails: uniqueUrlDetails,
        summary: {
          test_sites: uniqueUrlDetails.filter(d => d.source === 'test_site').length,
          mhlw_sites: uniqueUrlDetails.filter(d => d.source === 'mhlw_ganjoho').length,
          medical_societies: uniqueUrlDetails.filter(d => d.source === 'medical_society').length,
          manual_additions: uniqueUrlDetails.filter(d => d.source === 'manual_addition').length,
          regional_hospitals: uniqueUrlDetails.filter(d => d.source === 'regional_hospital').length
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ URLリスト取得エラー:', error)
    
    return NextResponse.json({
      success: false,
      message: 'URLリストの取得に失敗しました',
      error: error instanceof Error ? error.message : '不明なエラー',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * URLリストの検証API
 * 指定されたURLがアクセス可能かどうかをチェックする
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls, maxConcurrent = 3 } = body
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({
        success: false,
        message: 'URLリストが指定されていません',
        error: 'urls parameter is required and must be an array'
      }, { status: 400 })
    }
    
    console.log(`🔍 URL検証開始: ${urls.length}件`)
    
    const results: Array<{
      url: string
      accessible: boolean
      status?: number
      error?: string
      responseTime?: number
    }> = []
    
    // 並行処理でURLを検証（負荷軽減のため制限）
    const batchSize = Math.min(maxConcurrent, 5)
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      const batchPromises = batch.map(async (url: string) => {
        const startTime = Date.now()
        try {
          const response = await fetch(url, {
            method: 'HEAD', // ヘッダーのみ取得（軽量）
            headers: {
              'User-Agent': 'Sottori-URL-Checker/1.0'
            },
            signal: AbortSignal.timeout(10000) // 10秒タイムアウト
          })
          
          const responseTime = Date.now() - startTime
          
          return {
            url,
            accessible: response.ok,
            status: response.status,
            responseTime
          }
        } catch (error) {
          const responseTime = Date.now() - startTime
          return {
            url,
            accessible: false,
            error: error instanceof Error ? error.message : '不明なエラー',
            responseTime
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // バッチ間で少し待機
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    const accessibleCount = results.filter(r => r.accessible).length
    const errorCount = results.filter(r => !r.accessible).length
    
    console.log(`🔍 URL検証完了: アクセス可能${accessibleCount}件, エラー${errorCount}件`)
    
    return NextResponse.json({
      success: true,
      message: 'URL検証が完了しました',
      data: {
        totalUrls: urls.length,
        accessibleCount,
        errorCount,
        results,
        summary: {
          accessible: accessibleCount,
          errors: errorCount,
          averageResponseTime: results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ URL検証エラー:', error)
    
    return NextResponse.json({
      success: false,
      message: 'URL検証に失敗しました',
      error: error instanceof Error ? error.message : '不明なエラー',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 