#!/usr/bin/env ts-node

/**
 * シンプルスクレイピング機能テストスクリプト
 * 
 * 使用方法:
 *   npx ts-node scripts/test_simple_scraper.ts
 *   npx ts-node scripts/test_simple_scraper.ts --urls=3
 *   npx ts-node scripts/test_simple_scraper.ts --test-url=https://example.com
 */

// 環境変数の読み込み
require('dotenv').config({ path: '.env.local' })

const { simpleScraper } = require('../src/lib/services/simpleScraper')
const { TEST_SCRAPING_URLS, MANUAL_ADDITIONAL_URLS, generateMHLWUrls } = require('../src/const/scraping_urls')
const { InformationPoolService } = require('../src/lib/services/informationPoolService')

// =============================================================================
// コマンドライン引数解析
// =============================================================================

interface Args {
  maxUrls?: number
  testUrl?: string
  verbose?: boolean
  mode?: string
  cancerType?: string
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const parsed: Args = {
    maxUrls: 5,
    verbose: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg === '--urls' && args[i + 1]) {
      parsed.maxUrls = parseInt(args[i + 1])
      i++
    } else if (arg === '--test-url' && args[i + 1]) {
      parsed.testUrl = args[i + 1]
      i++
    } else if (arg === '--verbose') {
      parsed.verbose = true
    } else if (arg === '--cancer-type' && args[i + 1]) {
      parsed.cancerType = args[i + 1]
      i++
    }
  }

  return parsed
}

// =============================================================================
// テスト関数
// =============================================================================

async function testSingleUrl(url: string): Promise<void> {
  console.log(`🧪 単一URLテスト: ${url}`)
  console.log('='.repeat(60))

  try {
    const startTime = Date.now()
    const result = await simpleScraper.scrapeUrl(url)
    const endTime = Date.now()

    console.log('\n📊 テスト結果:')
    console.log(`  - URL: ${result.url}`)
    console.log(`  - タイトル: ${result.title}`)
    console.log(`  - 有効: ${result.isValid ? '✅' : '❌'}`)
    console.log(`  - コンテンツ長: ${result.contentLength}文字`)
    console.log(`  - 段落数: ${result.paragraphCount}`)
    console.log(`  - 見出し数: ${result.headingCount}`)
    console.log(`  - ソース名: ${result.sourceName}`)
    console.log(`  - ソースタイプ: ${result.sourceType}`)
    console.log(`  - 処理時間: ${endTime - startTime}ms`)

    if (result.errorMessage) {
      console.log(`  - エラー: ${result.errorMessage}`)
    }

    if (result.summary) {
      console.log(`  - サマリー: ${result.summary.substring(0, 100)}...`)
    }

    console.log('='.repeat(60))

  } catch (error) {
    console.error(`❌ テスト失敗: ${error}`)
  }
}

async function testMultipleUrls(urls: string[]): Promise<void> {
  console.log(`🧪 複数URLテスト: ${urls.length}件`)
  console.log('='.repeat(60))

  try {
    const startTime = Date.now()
    const result = await simpleScraper.scrapeUrls(urls)
    const endTime = Date.now()

    console.log('\n📊 テスト結果サマリー:')
    console.log(`  - 総処理時間: ${endTime - startTime}ms`)
    console.log(`  - 平均処理時間: ${Math.round((endTime - startTime) / urls.length)}ms/件`)
    console.log(`  - 成功率: ${((result.totalSuccess / result.totalProcessed) * 100).toFixed(1)}%`)

    if (result.success.length > 0) {
      console.log('\n✅ 成功したURL:')
      result.success.slice(0, 3).forEach((item: any, index: number) => {
        console.log(`  ${index + 1}. ${item.title} (${item.contentLength}文字)`)
      })
      if (result.success.length > 3) {
        console.log(`  ... 他${result.success.length - 3}件`)
      }
    }

    if (result.failed.length > 0) {
      console.log('\n❌ 失敗したURL:')
      result.failed.slice(0, 3).forEach((item: any, index: number) => {
        console.log(`  ${index + 1}. ${item.url} - ${item.error}`)
      })
      if (result.failed.length > 3) {
        console.log(`  ... 他${result.failed.length - 3}件`)
      }
    }

    // キャッシュ統計
    const cacheStats = simpleScraper.getCacheStats()
    console.log('\n💾 キャッシュ統計:')
    console.log(`  - キャッシュ数: ${cacheStats.total}`)
    console.log(`  - 無効URL数: ${cacheStats.invalid}`)

    console.log('='.repeat(60))

  } catch (error) {
    console.error(`❌ テスト失敗: ${error}`)
  }
}

function scrapedDataToDbItem(scraped: any) {
  return {
    title: scraped.title,
    summary: scraped.summary,
    content: scraped.content,
    category: 'support_resources', // デフォルトカテゴリ
    cancer_types: ['all'],
    stages: ['all'],
    regions: ['all'],
    age_groups: ['all'],
    sourceType: scraped.sourceType,
    sourceName: scraped.sourceName,
    sourceUrl: scraped.url,
    reliabilityScore: 3, // デフォルト信頼度
    evidenceLevel: 'unknown',
    peerReviewed: false,
    collectedAt: scraped.collectedAt,
    isActive: true,
    metadata: scraped.extractedMetadata,
    tags: [],
    viewCount: 0,
    usefulnessScore: 0,
    usefulnessVotes: 0,
    rawContent: scraped.content,
    expiresAt: null,
    relevanceScore: 50
  }
}

async function saveToDb(scrapedList: any[]) {
  const poolService = new InformationPoolService()
  const items = scrapedList.map(scrapedDataToDbItem)
  console.log(`\n💾 DB保存処理開始: ${items.length}件`)
  const result = await poolService.saveCollectedItems(items)
  console.log(`\n💾 DB保存結果:`)
  console.log(`  - 保存成功: ${result.saved}件`)
  console.log(`  - 重複スキップ: ${result.skipped}件`)
  console.log(`  - 保存エラー: ${result.errors.length}件`)
  if (result.errors.length > 0) {
    result.errors.slice(0, 3).forEach((err: any, idx: any) => {
      console.log(`    ❌ ${err}`)
    })
    if (result.errors.length > 3) {
      console.log(`    ... 他${result.errors.length - 3}件のエラー`)
    }
  }
}

// =============================================================================
// メイン処理
// =============================================================================

async function main() {
  console.log('🚀 シンプルスクレイピング機能テスト開始')
  console.log('='.repeat(60))
  
  const args = parseArgs()
  
  console.log('📋 テスト設定:')
  console.log(`  - 最大URL数: ${args.maxUrls}件`)
  console.log(`  - テストURL: ${args.testUrl || 'テスト用URLリスト'}`)
  console.log(`  - 詳細出力: ${args.verbose ? 'はい' : 'いいえ'}`)
  console.log('')

  try {
    let scrapedList: any[] = []
    if (args.testUrl) {
      // 単一URLテスト
      await testSingleUrl(args.testUrl)
      // 単一保存テスト
      const result = await simpleScraper.scrapeUrl(args.testUrl)
      if (result.isValid) scrapedList.push(result)
    } else {
      // 全がん種別のURLを自動生成
      const allCancerTypes = [
        'breast_cancer', 'lung_cancer', 'stomach_cancer', 'colorectal_cancer',
        'prostate_cancer', 'liver_cancer', 'pancreas_cancer', 'esophagus_cancer',
        'ovary_cancer', 'cervix_cancer', 'bladder_cancer', 'kidney_cancer'
      ]
      
      // 指定されたがん種別のURLを生成（デフォルトは大腸がん）
      const cancerType = args.cancerType || 'colorectal_cancer'
      const generatedUrls = generateMHLWUrls(cancerType)
      
      // 手動追加URLと生成URLを結合
      const allUrls = [...MANUAL_ADDITIONAL_URLS, ...generatedUrls]
      const testUrls = allUrls.slice(0, args.maxUrls)
      console.log('📋 テスト対象URL:')
      testUrls.forEach((url: any, index: any) => {
        console.log(`  [${index + 1}] ${url}`)
      })
      console.log('')
      
      const result = await simpleScraper.scrapeUrls(testUrls)
      scrapedList = result.success
      await testMultipleUrls(testUrls)
    }
    if (scrapedList.length > 0) {
      await saveToDb(scrapedList)
    } else {
      console.log('📝 DB保存対象データなし')
    }
    console.log('✅ テスト完了')

  } catch (error) {
    console.error('❌ テスト実行エラー:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error)
} 