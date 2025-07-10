#!/usr/bin/env ts-node

/**
 * 管理者用一括収集バッチスクリプト
 * 
 * 使用方法:
 *   npx ts-node scripts/admin_collect_all.ts --mode=test
 *   npx ts-node scripts/admin_collect_all.ts --mode=mhlw --cancerType=colon
 *   npx ts-node scripts/admin_collect_all.ts --mode=all --cancerType=colon
 */

const { RealDataCollectionService } = require('../src/lib/services/realDataCollectors')
const { InformationPoolService } = require('../src/lib/services/informationPoolService')
const { TEST_SCRAPING_URLS, generateMHLWUrls, MANUAL_ADDITIONAL_URLS } = require('../src/const/scraping_urls')

// =============================================================================
// コマンドライン引数解析
// =============================================================================

interface Args {
  mode: 'test' | 'mhlw' | 'all'
  cancerType?: string
  dryRun?: boolean
  maxUrls?: number
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const parsed: Args = {
    mode: 'test', // デフォルトは安全なテストモード
    dryRun: false,
    maxUrls: 5 // デフォルトは5件まで（IPブロック防止）
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg === '--mode' && args[i + 1]) {
      parsed.mode = args[i + 1] as Args['mode']
      i++
    } else if (arg === '--cancerType' && args[i + 1]) {
      parsed.cancerType = args[i + 1]
      i++
    } else if (arg === '--dry-run') {
      parsed.dryRun = true
    } else if (arg === '--max-urls' && args[i + 1]) {
      parsed.maxUrls = parseInt(args[i + 1])
      i++
    }
  }

  return parsed
}

// =============================================================================
// メイン処理
// =============================================================================

async function main() {
  console.log('🚀 管理者用一括収集バッチ開始')
  console.log('='.repeat(60))
  
  const args = parseArgs()
  
  console.log('📋 実行設定:')
  console.log(`  - モード: ${args.mode}`)
  console.log(`  - がん種: ${args.cancerType || '未指定'}`)
  console.log(`  - ドライラン: ${args.dryRun ? 'はい' : 'いいえ'}`)
  console.log(`  - 最大URL数: ${args.maxUrls}件`)
  console.log('')

  try {
    const collectionService = new RealDataCollectionService()
    const poolService = new InformationPoolService()

    let targetUrls: string[] = []
    let collectionMode: string = ''

    // モード別のURL設定
    switch (args.mode) {
      case 'test':
        console.log('🧪 テストモード: 安全なテストサイトのみ')
        targetUrls = TEST_SCRAPING_URLS.slice(0, args.maxUrls)
        collectionMode = 'test_sites'
        break
        
      case 'mhlw':
        if (!args.cancerType) {
          console.error('❌ mhlwモードでは --cancerType が必須です')
          process.exit(1)
        }
        console.log(`🏥 厚労省モード: ${args.cancerType}関連URL`)
        targetUrls = generateMHLWUrls(args.cancerType).slice(0, args.maxUrls)
        collectionMode = 'mhlw_official'
        break
        
      case 'all':
        if (!args.cancerType) {
          console.error('❌ allモードでは --cancerType が必須です')
          process.exit(1)
        }
        console.log(`🌐 全収集モード: ${args.cancerType}関連URL + テストサイト`)
        const mhlwUrls = generateMHLWUrls(args.cancerType)
        const manualUrls = MANUAL_ADDITIONAL_URLS.filter((url: string) => 
          url.includes(args.cancerType!) || url.includes('ganjoho.jp')
        )
        targetUrls = [...mhlwUrls, ...manualUrls, ...TEST_SCRAPING_URLS.slice(0, 3)].slice(0, args.maxUrls)
        collectionMode = 'comprehensive'
        break
        
      default:
        console.error(`❌ 無効なモード: ${args.mode}`)
        console.log('有効なモード: test, mhlw, all')
        process.exit(1)
    }

    console.log('')
    console.log('📋 収集対象URLリスト:')
    console.log('='.repeat(60))
    targetUrls.forEach((url, index) => {
      console.log(`  [${index + 1}] ${url}`)
    })
    console.log('='.repeat(60))
    console.log(`📊 総URL数: ${targetUrls.length}件`)
    console.log('')

    if (args.dryRun) {
      console.log('🔍 ドライラン: URLリスト表示のみ（実際の収集は行いません）')
      return
    }

    // 収集実行
    console.log('🔄 データ収集開始...')
    console.log('')

    let collectedItems: any[] = []

    // モード別の収集処理
    switch (args.mode) {
      case 'test':
        collectedItems = await collectionService.collectTestSiteData({
          cancerType: args.cancerType || 'test',
          concernAreas: ['support_resources']
        })
        break
        
      case 'mhlw':
      case 'all':
        collectedItems = await collectionService.collectAllRealData({
          cancerType: args.cancerType!,
          concernAreas: ['treatment_options']
        })
        break
    }

    console.log('')
    console.log('📊 収集結果サマリー:')
    console.log(`  - 収集成功: ${collectedItems.length}件`)
    
    if (collectedItems.length > 0) {
      console.log('  - 収集データ詳細:')
      collectedItems.slice(0, 3).forEach((item, index) => {
        console.log(`    ${index + 1}. ${item.title} (${item.rawContent?.length || 0}文字)`)
      })
      if (collectedItems.length > 3) {
        console.log(`    ... 他${collectedItems.length - 3}件`)
      }
    }

    // DB保存
    if (collectedItems.length > 0) {
      console.log('')
      console.log('💾 データベース保存開始...')
      
      const saveResult = await poolService.saveCollectedItems(collectedItems)
      
      console.log('')
      console.log('💾 保存結果サマリー:')
      console.log(`  - 保存成功: ${saveResult.saved}件`)
      console.log(`  - 重複スキップ: ${saveResult.skipped}件`)
      console.log(`  - 保存エラー: ${saveResult.errors.length}件`)
      
      if (saveResult.errors.length > 0) {
        console.log('  - エラー詳細:')
        saveResult.errors.slice(0, 3).forEach((error: string) => {
          console.log(`    ❌ ${error}`)
        })
        if (saveResult.errors.length > 3) {
          console.log(`    ... 他${saveResult.errors.length - 3}件のエラー`)
        }
      }
    } else {
      console.log('📝 保存対象データなし')
    }

    console.log('')
    console.log('✅ 管理者用一括収集バッチ完了')

  } catch (error) {
    console.error('❌ バッチ実行エラー:', error)
    process.exit(1)
  }
}

// =============================================================================
// 実行
// =============================================================================

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 予期しないエラー:', error)
    process.exit(1)
  })
} 