import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { InfoCollectionService } from '@/src/lib/services/infoCollection'

// 管理者権限のSupabaseクライアント（RLS回避用）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * POST /api/info-updates/collect/test
 * テスト用情報収集（認証不要）
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 テスト用情報収集開始')

    // テスト用ユーザーID（固定）
    const testUserId = '046c23ee-903c-4983-b605-bfab8ede9919'

    // テスト用クエリ
    const testQuery = {
      cancerType: 'colorectal_cancer', // 大腸がん
      stage: 'stage_2',
      concernAreas: [
        'treatment_options',
        'doctors',
        'side_effects',
        'support_resources'
      ],
      userLocation: 'tokyo',
      treatmentStatus: 'ongoing',
      informationDepth: 'detailed',
      communicationStyle: 'empathetic',
      priorityAreas: ['treatment_options', 'side_effects'],
      ageRange: '50-60',
      employment: 'employed',
      familySupport: 'available',
      technologyComfort: 'comfortable'
    }

    console.log('テストクエリ:', testQuery)

    // 情報収集サービスを実行
    const service = new InfoCollectionService()
    const result = await service.collectInformation(testUserId, testQuery)

    console.log('✅ テスト情報収集完了')
    console.log('  - 総取得件数:', result.totalFound)
    console.log('  - 実データ件数:', result.realDataCount)
    console.log('  - 生成データ件数:', result.syntheticDataCount)
    console.log('  - ソース内訳:', result.sourceBreakdown)

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: 'テスト情報収集が完了しました',
      stats: {
        total: result.totalFound,
        realDataCount: result.realDataCount,
        generatedDataCount: result.syntheticDataCount,
        sourceBreakdown: result.sourceBreakdown
      },
      sampleItems: result.items.slice(0, 3), // 最初の3件をサンプルとして返す
      queryUsed: testQuery
    })

  } catch (error) {
    console.error('❌ テスト情報収集エラー:', error)
    return NextResponse.json({
      success: false,
      error: 'テスト情報収集でエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/info-updates/collect/test
 * テスト用情報収集の状況確認
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 テスト情報収集状況確認')

    // raw_content_poolの件数を確認
    const { count: rawContentCount, error: rawError } = await supabaseAdmin
      .from('raw_content_pool')
      .select('*', { count: 'exact', head: true })

    if (rawError) {
      console.error('raw_content_pool確認エラー:', rawError)
      return NextResponse.json({ error: 'Failed to check raw_content_pool' }, { status: 500 })
    }

    // structured_content_poolの件数を確認
    const { count: structuredContentCount, error: structuredError } = await supabaseAdmin
      .from('structured_content_pool')
      .select('*', { count: 'exact', head: true })

    if (structuredError) {
      console.error('structured_content_pool確認エラー:', structuredError)
      return NextResponse.json({ error: 'Failed to check structured_content_pool' }, { status: 500 })
    }

    // 最新のraw_content_poolのサンプルを取得
    const { data: latestRawContent, error: latestError } = await supabaseAdmin
      .from('raw_content_pool')
      .select('id, source_url, source_name, content_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (latestError) {
      console.error('最新raw_content取得エラー:', latestError)
    }

    console.log('📊 現在の状況:')
    console.log('  - raw_content_pool:', rawContentCount, '件')
    console.log('  - structured_content_pool:', structuredContentCount, '件')

    return NextResponse.json({
      success: true,
      currentStatus: {
        rawContentPool: rawContentCount,
        structuredContentPool: structuredContentCount,
        latestRawContent: latestRawContent || []
      },
      message: 'テスト情報収集の状況を確認しました'
    })

  } catch (error) {
    console.error('❌ 状況確認エラー:', error)
    return NextResponse.json({
      success: false,
      error: '状況確認でエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 