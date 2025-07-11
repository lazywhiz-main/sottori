#!/usr/bin/env ts-node

/**
 * 構造化データ処理スクリプト
 * 
 * 使用方法:
 *   npx ts-node scripts/structured_data_processor.ts
 *   npx ts-node scripts/structured_data_processor.ts --dry-run
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { InformationPoolService } from '../src/lib/services/informationPoolService'

// =============================================================================
// コマンドライン引数解析
// =============================================================================

interface Args {
  limit?: number
  cancerType?: string
  verbose?: boolean
  dryRun?: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const parsed: Args = {
    limit: 100,
    verbose: false,
    dryRun: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg === '--limit' && args[i + 1]) {
      parsed.limit = parseInt(args[i + 1])
      i++
    } else if (arg === '--cancer-type' && args[i + 1]) {
      parsed.cancerType = args[i + 1]
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
// データベース接続
// =============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================================================
// ローデータ取得関数
// =============================================================================

async function getRawData(limit: number = 100, cancerType?: string) {
  console.log(`\n📊 ローデータ取得中... (最大${limit}件)`)
  
  let query = supabase
    .from('raw_content_pool')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (cancerType) {
    // URLにがん種別が含まれているかチェック
    query = query.ilike('source_url', `%${cancerType}%`)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('❌ ローデータ取得エラー:', error)
    return []
  }
  
  console.log(`✅ ローデータ取得完了: ${data.length}件`)
  return data || []
}

// =============================================================================
// 構造化データ変換関数
// =============================================================================

function extractStructuredData(rawData: any) {
  const structuredData = {
    title: rawData.title || '無題',
    summary: rawData.summary || '',
    content: rawData.content || '',
    category: determineCategory(rawData.source_url, rawData.content),
    cancer_types: extractCancerTypes(rawData.source_url, rawData.content),
    stages: ['all'], // デフォルト
    regions: ['all'], // デフォルト
    age_groups: ['all'], // デフォルト
    sourceType: 'official',
    sourceName: '国立がん研究センター',
    sourceUrl: rawData.source_url,
    reliabilityScore: 5, // 最高信頼度（公式サイト）
    evidenceLevel: 'A',
    peerReviewed: true,
    collectedAt: rawData.created_at,
    isActive: true,
    metadata: {
      originalId: rawData.id,
      contentHash: rawData.content_hash,
      contentType: 'medical_information',
      source: 'ganjoho.jp'
    },
    tags: generateTags(rawData.source_url, rawData.content),
    viewCount: 0,
    usefulnessScore: 0,
    usefulnessVotes: 0,
    rawContent: rawData.content,
    expiresAt: null,
    relevanceScore: calculateRelevanceScore(rawData.source_url, rawData.content)
  }
  
  return structuredData
}

// =============================================================================
// ヘルパー関数
// =============================================================================

function determineCategory(sourceUrl: string, content: string): string {
  if (sourceUrl.includes('/diagnosis')) return 'diagnosis'
  if (sourceUrl.includes('/treatment')) return 'treatment'
  if (sourceUrl.includes('/prevention_screening')) return 'prevention_screening'
  if (sourceUrl.includes('/index.html')) return 'overview'
  return 'support_resources'
}

function extractCancerTypes(sourceUrl: string, content: string): string[] {
  const cancerTypeMap: { [key: string]: string } = {
    'colon': 'colorectal_cancer',
    'stomach': 'stomach_cancer',
    'lung': 'lung_cancer',
    'breast': 'breast_cancer',
    'prostate': 'prostate_cancer',
    'liver': 'liver_cancer',
    'pancreas': 'pancreas_cancer',
    'esophagus': 'esophagus_cancer',
    'ovary': 'ovary_cancer',
    'cervix_uteri': 'cervix_cancer',
    'bladder': 'bladder_cancer',
    'renal_cell': 'kidney_cancer'
  }
  
  for (const [key, value] of Object.entries(cancerTypeMap)) {
    if (sourceUrl.includes(key)) {
      return [value]
    }
  }
  
  return ['all']
}

function generateTags(sourceUrl: string, content: string): string[] {
  const tags = ['official', 'medical_information']
  
  // カテゴリベースのタグ
  if (sourceUrl.includes('/diagnosis')) tags.push('diagnosis')
  if (sourceUrl.includes('/treatment')) tags.push('treatment')
  if (sourceUrl.includes('/prevention_screening')) tags.push('prevention', 'screening')
  
  // がん種別ベースのタグ
  const cancerTypes = extractCancerTypes(sourceUrl, content)
  if (cancerTypes[0] !== 'all') {
    tags.push(cancerTypes[0])
  }
  
  return tags
}

function calculateRelevanceScore(sourceUrl: string, content: string): number {
  let score = 50 // ベーススコア
  
  // 公式サイトの場合は高スコア
  if (sourceUrl.includes('ganjoho.jp')) score += 30
  
  // 治療情報は高スコア
  if (sourceUrl.includes('/treatment')) score += 20
  
  // 診断情報は中スコア
  if (sourceUrl.includes('/diagnosis')) score += 15
  
  // 予防・検診は中スコア
  if (sourceUrl.includes('/prevention_screening')) score += 10
  
  return Math.min(score, 100)
}

// =============================================================================
// 構造化データ保存関数
// =============================================================================

async function saveStructuredData(structuredDataList: any[], dryRun: boolean = false) {
  if (dryRun) {
    console.log('\n💾 ドライラン: 構造化データ保存は実行しません')
    console.log(`  - 保存対象: ${structuredDataList.length}件`)
    return { saved: 0, skipped: 0, errors: [] }
  }
  
  if (structuredDataList.length === 0) {
    console.log('\n📝 保存対象データなし')
    return { saved: 0, skipped: 0, errors: [] }
  }
  
  const poolService = new InformationPoolService()
  
  console.log(`\n💾 構造化データ保存開始: ${structuredDataList.length}件`)
  const result = await poolService.saveCollectedItems(structuredDataList)
  
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
// 統計情報表示関数
// =============================================================================

function displayStatistics(rawDataList: any[], structuredDataList: any[]) {
  console.log('\n📈 処理統計:')
  console.log(`  - 処理対象ローデータ: ${rawDataList.length}件`)
  console.log(`  - 構造化データ生成: ${structuredDataList.length}件`)
  
  // カテゴリ別統計
  const categoryStats: { [key: string]: number } = {}
  structuredDataList.forEach(data => {
    const category = data.category
    categoryStats[category] = (categoryStats[category] || 0) + 1
  })
  
  console.log('\n📊 カテゴリ別統計:')
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`  - ${category}: ${count}件`)
  })
  
  // がん種別統計
  const cancerTypeStats: { [key: string]: number } = {}
  structuredDataList.forEach(data => {
    data.cancer_types.forEach((type: string) => {
      cancerTypeStats[type] = (cancerTypeStats[type] || 0) + 1
    })
  })
  
  console.log('\n🏥 がん種別統計:')
  Object.entries(cancerTypeStats).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}件`)
  })
}

// =============================================================================
// メイン処理
// =============================================================================

async function main() {
  console.log('🏗️ 構造化データ処理開始')
  console.log('='.repeat(80))
  
  const args = parseArgs()
  
  console.log('📋 実行設定:')
  console.log(`  - 処理件数: ${args.limit}件`)
  console.log(`  - がん種別: ${args.cancerType || '全種別'}`)
  console.log(`  - 詳細出力: ${args.verbose ? 'はい' : 'いいえ'}`)
  console.log(`  - ドライラン: ${args.dryRun ? 'はい' : 'いいえ'}`)
  
  try {
    // ローデータ取得
    const rawDataList = await getRawData(args.limit, args.cancerType)
    
    if (rawDataList.length === 0) {
      console.log('\n📝 処理対象のローデータが見つかりません')
      return
    }
    
    // 構造化データ変換
    console.log('\n🔄 構造化データ変換中...')
    const structuredDataList = rawDataList.map(rawData => {
      const structured = extractStructuredData(rawData)
      if (args.verbose) {
        console.log(`  ✅ ${structured.title} (${structured.category})`)
      }
      return structured
    })
    
    // 統計情報表示
    displayStatistics(rawDataList, structuredDataList)
    
    // 構造化データ保存
    await saveStructuredData(structuredDataList, args.dryRun)
    
    console.log('\n✅ 構造化データ処理完了')
    
  } catch (error) {
    console.error('\n❌ 処理実行エラー:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error)
} 