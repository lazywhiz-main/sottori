#!/usr/bin/env ts-node

/**
 * 包括的スクレイピングスクリプト
 * 
 * 使用方法:
 *   npx ts-node scripts/comprehensive_scraper.ts --cancerType=colon
 *   npx ts-node scripts/comprehensive_scraper.ts --cancerType=breast --maxUrls=10
 */

import 'dotenv/config'
import { SimpleScraper } from '../src/lib/services/simpleScraper'
import { generateMHLWUrls, MANUAL_ADDITIONAL_URLS } from '../src/const/scraping_urls'
import { InformationPoolService } from '../src/lib/services/informationPoolService'

// =============================================================================
// コマンドライン引数解析
// =============================================================================

interface Args {
  cancerType?: string
  allCancers?: boolean
  maxUrls?: number
  verbose?: boolean
  dryRun?: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const parsed: Args = {
    maxUrls: 50,
    verbose: false,
    dryRun: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg === '--cancer-type' && args[i + 1]) {
      parsed.cancerType = args[i + 1]
      i++
    } else if (arg === '--all-cancers') {
      parsed.allCancers = true
    } else if (arg === '--max-urls' && args[i + 1]) {
      parsed.maxUrls = parseInt(args[i + 1])
      i++
    } else if (arg === '--verbose') {
      parsed.verbose = true
    } else if (arg === '--dry-run') {
      parsed.dryRun = true
    }
  }

  return parsed
}

// =============================================================================
// がん種別定義
// =============================================================================

const ALL_CANCER_TYPES = [
  'breast_cancer',      // 乳がん
  'lung_cancer',        // 肺がん
  'stomach_cancer',     // 胃がん
  'colorectal_cancer',  // 大腸がん
  'prostate_cancer',    // 前立腺がん
  'liver_cancer',       // 肝臓がん
  'pancreas_cancer',    // 膵臓がん
  'esophagus_cancer',   // 食道がん
  'ovary_cancer',       // 卵巣がん
  'cervix_cancer',      // 子宮頸がん
  'bladder_cancer',     // 膀胱がん
  'kidney_cancer'       // 腎臓がん
]

// =============================================================================
// URL生成関数
// =============================================================================

function generateAllUrls(cancerTypes: string[]): string[] {
  const allUrls = new Set<string>()
  
  // 手動追加URLを追加
  MANUAL_ADDITIONAL_URLS.forEach(url => allUrls.add(url))
  
  // 各がん種別のURLを生成
  cancerTypes.forEach(cancerType => {
    try {
      const urls = generateMHLWUrls(cancerType)
      urls.forEach(url => allUrls.add(url))
      console.log(`✅ ${cancerType}: ${urls.length}件のURLを生成`)
    } catch (error) {
      console.error(`❌ ${cancerType}: URL生成エラー - ${error}`)
    }
  })
  
  return Array.from(allUrls)
}

// =============================================================================
// スクレイピング実行関数
// =============================================================================

async function scrapeUrls(urls: string[], maxUrls: number, dryRun: boolean = false) {
  const targetUrls = urls.slice(0, maxUrls)
  
  console.log(`\n🚀 スクレイピング開始: ${targetUrls.length}件`)
  console.log('='.repeat(80))
  
  if (dryRun) {
    console.log('🔍 ドライラン: 実際のスクレイピングは実行しません')
    targetUrls.forEach((url, index) => {
      console.log(`  [${index + 1}] ${url}`)
    })
    return { success: [], failed: [], totalProcessed: targetUrls.length, totalSuccess: 0 }
  }
  
  const scraper = new SimpleScraper()
  const result = await scraper.scrapeUrls(targetUrls)
  
  console.log('\n📊 スクレイピング結果:')
  console.log(`  - 総処理数: ${result.totalProcessed}件`)
  console.log(`  - 成功: ${result.totalSuccess}件`)
  console.log(`  - 失敗: ${result.failed.length}件`)
  console.log(`  - 成功率: ${((result.totalSuccess / result.totalProcessed) * 100).toFixed(1)}%`)
  
  return result
}

// =============================================================================
// データベース保存関数
// =============================================================================

async function saveToDatabase(scrapedList: any[], dryRun: boolean = false) {
  if (dryRun) {
    console.log('\n💾 ドライラン: データベース保存は実行しません')
    console.log(`  - 保存対象: ${scrapedList.length}件`)
    return { saved: 0, skipped: 0, errors: [] }
  }
  
  if (scrapedList.length === 0) {
    console.log('\n📝 保存対象データなし')
    return { saved: 0, skipped: 0, errors: [] }
  }
  
  const poolService = new InformationPoolService()
  const items = scrapedList.map(scraped => ({
    title: scraped.title,
    summary: scraped.summary,
    content: scraped.content,
    category: 'support_resources',
    cancer_types: ['all'],
    stages: ['all'],
    regions: ['all'],
    age_groups: ['all'],
    sourceType: scraped.sourceType,
    sourceName: scraped.sourceName,
    sourceUrl: scraped.url,
    reliabilityScore: 3,
    evidenceLevel: 'A',
    peerReviewed: false,
    collectedAt: scraped.collectedAt,
    isActive: true,
    metadata: scraped.extractedMetadata,
    tags: ['support_resources', 'official'],
    viewCount: 0,
    usefulnessScore: 0,
    usefulnessVotes: 0,
    rawContent: scraped.content,
    expiresAt: null,
    relevanceScore: 50
  }))
  
  console.log(`\n💾 データベース保存開始: ${items.length}件`)
  const result = await poolService.saveCollectedItems(items)
  
  console.log(`\n💾 保存結果:`)
  console.log(`  - 保存成功: ${result.saved}件`)
  console.log(`  - 重複スキップ: ${result.skipped}件`)
  console.log(`  - 保存エラー: ${result.errors.length}件`)
  
  if (result.errors.length > 0) {
    console.log('\n❌ エラー詳細:')
    result.errors.slice(0, 5).forEach((err: any, idx: number) => {
      console.log(`    ${idx + 1}. ${err}`)
    })
    if (result.errors.length > 5) {
      console.log(`    ... 他${result.errors.length - 5}件のエラー`)
    }
  }
  
  return result
}

// =============================================================================
// メイン処理
// =============================================================================

async function main() {
  console.log('🏥 包括的医療情報スクレイピング開始')
  console.log('='.repeat(80))
  
  const args = parseArgs()
  
  console.log('📋 実行設定:')
  console.log(`  - がん種別: ${args.allCancers ? '全がん種別' : (args.cancerType || 'colorectal_cancer')}`)
  console.log(`  - 最大URL数: ${args.maxUrls}件`)
  console.log(`  - 詳細出力: ${args.verbose ? 'はい' : 'いいえ'}`)
  console.log(`  - ドライラン: ${args.dryRun ? 'はい' : 'いいえ'}`)
  
  try {
    // 対象がん種別を決定
    let targetCancerTypes: string[]
    if (args.allCancers) {
      targetCancerTypes = ALL_CANCER_TYPES
      console.log(`\n🎯 全がん種別を対象: ${targetCancerTypes.length}種別`)
    } else {
      const cancerType = args.cancerType || 'colorectal_cancer'
      targetCancerTypes = [cancerType]
      console.log(`\n🎯 対象がん種別: ${cancerType}`)
    }
    
    // URL生成
    console.log('\n🔗 URL生成中...')
    const allUrls = generateAllUrls(targetCancerTypes)
    console.log(`✅ 総URL数: ${allUrls.length}件`)
    
    // スクレイピング実行
    const scrapeResult = await scrapeUrls(allUrls, args.maxUrls || 50, args.dryRun)
    
    // データベース保存
    if (scrapeResult.success.length > 0) {
      await saveToDatabase(scrapeResult.success, args.dryRun)
    }
    
    // 最終統計
    console.log('\n📈 最終統計:')
    console.log(`  - 生成URL数: ${allUrls.length}件`)
    console.log(`  - 処理URL数: ${scrapeResult.totalProcessed}件`)
    console.log(`  - スクレイピング成功: ${scrapeResult.totalSuccess}件`)
    console.log(`  - スクレイピング失敗: ${scrapeResult.failed.length}件`)
    
    console.log('\n✅ 包括的スクレイピング完了')
    
  } catch (error) {
    console.error('\n❌ スクレイピング実行エラー:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error)
} 