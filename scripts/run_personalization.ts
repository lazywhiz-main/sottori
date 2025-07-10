#!/usr/bin/env ts-node

/**
 * 個人化処理実行スクリプト
 * 
 * 既に収集・構造化された医療情報データを使って個人化処理を実行します。
 * 
 * 使用方法:
 *   npx ts-node scripts/run_personalization.ts
 *   npx ts-node scripts/run_personalization.ts --user-id=test-user-1
 *   npx ts-node scripts/run_personalization.ts --all-users
 */

// 環境変数の読み込み
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const { 
  runPersonalizationEngine, 
  initializePersonalizationForUser,
  getUnifiedUserProfile 
} = require('../src/lib/services/personalizationEngine')

// =============================================================================
// コマンドライン引数解析
// =============================================================================

interface Args {
  userId?: string
  allUsers?: boolean
  verbose?: boolean
  dryRun?: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const parsed: Args = {
    verbose: false,
    dryRun: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg === '--user-id' && args[i + 1]) {
      parsed.userId = args[i + 1]
      i++
    } else if (arg === '--all-users') {
      parsed.allUsers = true
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
// ユーザー取得関数
// =============================================================================

async function getUsers(): Promise<string[]> {
  console.log('\n👥 ユーザー取得中...')
  
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .limit(100)
  
  if (error) {
    console.error('❌ ユーザー取得エラー:', error)
    return []
  }
  
  const userIds = data?.map(user => user.id) || []
  console.log(`✅ ユーザー取得完了: ${userIds.length}件`)
  
  return userIds
}

// =============================================================================
// 構造化データ取得関数
// =============================================================================

async function getStructuredData(): Promise<any[]> {
  console.log('\n📊 構造化データ取得中...')
  
  const { data, error } = await supabase
    .from('structured_content_pool')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ 構造化データ取得エラー:', error)
    return []
  }
  
  console.log(`✅ 構造化データ取得完了: ${data?.length || 0}件`)
  return data || []
}

// =============================================================================
// 個人化処理実行関数
// =============================================================================

async function runPersonalizationForUser(userId: string, dryRun: boolean = false) {
  console.log(`\n🎯 ユーザー ${userId} の個人化処理開始`)
  
  if (dryRun) {
    console.log('🔍 ドライラン: 実際の処理は実行しません')
    return { success: true, segment: 'newly_diagnosed', processed_items: 0 }
  }
  
  try {
    // 個人化処理実行
    const result = await runPersonalizationEngine(userId)
    
    if (result.success) {
      console.log(`✅ 個人化処理成功: ${result.processed_items}件処理`)
      if (result.segment) {
        console.log(`   - セグメント: ${result.segment}`)
      }
    } else {
      console.error(`❌ 個人化処理失敗: ${result.error}`)
    }
    
    return result
  } catch (error) {
    console.error(`❌ 個人化処理エラー: ${error}`)
    return { success: false, error: error.message }
  }
}

// =============================================================================
// 個人化初期化関数
// =============================================================================

async function initializePersonalization(userId: string, dryRun: boolean = false) {
  console.log(`\n🔧 ユーザー ${userId} の個人化初期化`)
  
  if (dryRun) {
    console.log('🔍 ドライラン: 初期化は実行しません')
    return true
  }
  
  try {
    const success = await initializePersonalizationForUser(userId)
    if (success) {
      console.log(`✅ 個人化初期化成功`)
    } else {
      console.error(`❌ 個人化初期化失敗`)
    }
    return success
  } catch (error) {
    console.error(`❌ 個人化初期化エラー: ${error}`)
    return false
  }
}

// =============================================================================
// 統計情報表示関数
// =============================================================================

async function displayPersonalizationStats() {
  console.log('\n📈 個人化処理統計:')
  
  // 関連度スコア統計
  const { data: relevanceScores, error: relevanceError } = await supabase
    .from('info_relevance_scores')
    .select('*')
    .limit(1000)
  
  if (!relevanceError && relevanceScores) {
    console.log(`  - 関連度スコア: ${relevanceScores.length}件`)
    
    // スコア分布
    const scoreRanges = {
      '高 (80-100)': 0,
      '中 (50-79)': 0,
      '低 (0-49)': 0
    }
    
    relevanceScores.forEach(score => {
      if (score.final_score >= 80) scoreRanges['高 (80-100)']++
      else if (score.final_score >= 50) scoreRanges['中 (50-79)']++
      else scoreRanges['低 (0-49)']++
    })
    
    console.log('  - スコア分布:')
    Object.entries(scoreRanges).forEach(([range, count]) => {
      console.log(`    ${range}: ${count}件`)
    })
  }
  
  // ユーザーセグメント統計
  const { data: segments, error: segmentError } = await supabase
    .from('user_segments')
    .select('*')
  
  if (!segmentError && segments) {
    console.log(`  - ユーザーセグメント: ${segments.length}件`)
    
    const segmentStats: { [key: string]: number } = {}
    segments.forEach(segment => {
      const segmentType = segment.segment_type
      segmentStats[segmentType] = (segmentStats[segmentType] || 0) + 1
    })
    
    console.log('  - セグメント分布:')
    Object.entries(segmentStats).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}件`)
    })
  }
}

// =============================================================================
// メイン処理
// =============================================================================

async function main() {
  console.log('🎯 個人化処理実行開始')
  console.log('='.repeat(80))
  
  const args = parseArgs()
  
  console.log('📋 実行設定:')
  console.log(`  - 対象ユーザー: ${args.allUsers ? '全ユーザー' : (args.userId || 'test-user-1')}`)
  console.log(`  - 詳細出力: ${args.verbose ? 'はい' : 'いいえ'}`)
  console.log(`  - ドライラン: ${args.dryRun ? 'はい' : 'いいえ'}`)
  
  try {
    // 構造化データ確認
    const structuredData = await getStructuredData()
    if (structuredData.length === 0) {
      console.log('\n❌ 処理対象の構造化データが見つかりません')
      return
    }
    
    // 対象ユーザー決定
    let targetUsers: string[]
    if (args.allUsers) {
      targetUsers = await getUsers()
    } else {
      targetUsers = [args.userId || 'test-user-1']
    }
    
    if (targetUsers.length === 0) {
      console.log('\n❌ 処理対象のユーザーが見つかりません')
      return
    }
    
    console.log(`\n🎯 処理対象ユーザー: ${targetUsers.length}件`)
    
    // 個人化処理実行
    let successCount = 0
    let totalProcessed = 0
    
    for (const userId of targetUsers) {
      // 個人化初期化（初回のみ）
      await initializePersonalization(userId, args.dryRun)
      
      // 個人化処理実行
      const result = await runPersonalizationForUser(userId, args.dryRun)
      
      if (result.success) {
        successCount++
        totalProcessed += result.processed_items || 0
      }
    }
    
    // 結果表示
    console.log('\n📊 処理結果:')
    console.log(`  - 対象ユーザー: ${targetUsers.length}件`)
    console.log(`  - 成功: ${successCount}件`)
    console.log(`  - 失敗: ${targetUsers.length - successCount}件`)
    console.log(`  - 総処理件数: ${totalProcessed}件`)
    
    // 統計情報表示
    if (!args.dryRun) {
      await displayPersonalizationStats()
    }
    
    console.log('\n✅ 個人化処理完了')
    
  } catch (error) {
    console.error('\n❌ 処理実行エラー:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error)
} 