import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { InfoCollectionService } from '@/lib/services/infoCollection'

// 管理者権限のSupabaseクライアント（RLS回避用）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // サービスロールキー
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * POST /api/info-updates/collect
 * ユーザーの情報を自動収集（個別化エンジン版）
 */
export async function POST(request: NextRequest) {
  try {
    // テスト用：認証チェックを一時的に無効化
    let userId = 'test-user-id'
    
    // 本番環境では認証チェックを有効にする
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
      }

      const token = authHeader.split(' ')[1]
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        console.error('Auth error:', authError)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      userId = user.id
    }

    console.log('実データ優先情報収集開始 - ユーザーID:', userId)

    // 個別化エンジン用：複数プロフィールテーブルから情報を取得
    const { data: medicalProfile, error: medicalError } = await supabase
      .from('user_medical_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    const { data: contextProfile, error: contextError } = await supabase
      .from('user_context_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    const { data: preferenceProfile, error: preferenceError } = await supabase
      .from('user_preference_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (medicalError && medicalError.code === 'PGRST116') {
      console.log('医療プロフィールが存在しないため、デフォルト設定で情報収集を実行します')
      
      // デフォルトクエリで情報収集を実行
      const defaultQuery = {
        cancerType: 'general_cancer',
        stage: undefined,
        concernAreas: [
          'treatment_options',
          'doctors',
          'side_effects',
          'clinical_trials',
          'support_resources',
          'financial_assistance'
        ],
        userLocation: undefined,
        treatmentStatus: undefined,
        // 個別化エンジン用の追加パラメータ
        informationDepth: 'detailed',
        communicationStyle: 'empathetic',
        priorityAreas: []
      }

      const service = new InfoCollectionService()
      const result = await service.collectInformation(userId, defaultQuery)

      return NextResponse.json({
        message: '情報収集が完了しました（デフォルト設定）',
        results: result.items.slice(0, 5), // 最初の5件のみ返す（軽量化）
        stats: {
          total: result.totalFound,
          realDataCount: result.realDataCount,
          generatedDataCount: result.syntheticDataCount,
          sourceBreakdown: result.sourceBreakdown
        },
        profileStatus: 'not_configured',
        recommendation: 'より個別化された情報を受け取るには、プロフィール設定を完了してください。'
      })
    }

    if (medicalError) {
      console.error('医療プロフィール取得エラー:', medicalError)
      return NextResponse.json({ error: 'Failed to fetch medical profile' }, { status: 500 })
    }

    // 個別化クエリの構築（複数プロフィールテーブル統合）
    const personalizedQuery = {
      cancerType: medicalProfile?.cancer_type || 'general_cancer',
      stage: medicalProfile?.stage,
      concernAreas: preferenceProfile?.priority_areas?.length > 0 
        ? preferenceProfile.priority_areas 
        : medicalProfile?.concern_areas || [
            'treatment_options',
            'doctors',
            'side_effects',
            'clinical_trials',
            'support_resources',
            'financial_assistance'
          ],
      userLocation: contextProfile?.prefecture,
      treatmentStatus: medicalProfile?.treatment_status,
      
      // 個別化エンジン追加パラメータ
      informationDepth: preferenceProfile?.information_depth || 'detailed',
      communicationStyle: preferenceProfile?.communication_style || 'empathetic',
      priorityAreas: preferenceProfile?.priority_areas || [],
      
      // コンテキスト情報
      ageRange: contextProfile?.age_range,
      employment: contextProfile?.employment,
      familySupport: contextProfile?.family_support,
      technologyComfort: contextProfile?.technology_comfort,
      
      // 治療履歴（JSONB）
      treatmentHistory: medicalProfile?.treatment_history,
      sideEffectsExperienced: medicalProfile?.side_effects_experienced || []
    }

    console.log('個別化クエリ:', personalizedQuery)

    // 実データ優先の情報収集を実行
    const service = new InfoCollectionService()
    const result = await service.collectInformation(userId, personalizedQuery)

    // 成功レスポンス
    return NextResponse.json({
      message: '個別化された情報収集が完了しました',
      results: result.items.slice(0, 5), // 最初の5件のみ返す（軽量化）
      stats: {
        total: result.totalFound,
        realDataCount: result.realDataCount,
        generatedDataCount: result.syntheticDataCount,
        sourceBreakdown: result.sourceBreakdown
      },
      profileStatus: 'configured',
      personalizationLevel: {
        medical: medicalProfile ? 'complete' : 'missing',
        context: contextProfile ? 'complete' : 'basic',
        preferences: preferenceProfile ? 'complete' : 'basic'
      },
      queryUsed: personalizedQuery
    })

  } catch (error) {
    console.error('情報収集エラー:', error)
    return NextResponse.json({
      error: 'Internal server error during information collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/info-updates/collect/status
 * 情報収集の進捗状況を取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証トークンの取得
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 収集進捗を取得
    const { data: progress, error: progressError } = await supabase
      .from('info_collection_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('last_updated', { ascending: false })

    if (progressError) {
      throw progressError
    }

    // 最新の情報更新を取得
    const { data: latestUpdates, error: updatesError } = await supabase
      .from('info_updates')
      .select('category, created_at, is_read')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (updatesError) {
      throw updatesError
    }

    // カテゴリ別統計を計算
    const categoryStats = calculateCategoryStats(latestUpdates || [])

    return NextResponse.json({
      success: true,
      data: {
        progress: progress || [],
        categoryStats,
        lastCollectionTime: progress?.[0]?.last_updated || null,
        totalUnread: latestUpdates?.filter((item: any) => !item.is_read).length || 0
      }
    })

  } catch (error) {
    console.error('Collection status API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'ステータス取得中にエラーが発生しました',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// =============================================================================
// ヘルパー関数
// =============================================================================

interface CollectedItem {
  category: string
  [key: string]: any
}

function groupByCategory(items: CollectedItem[]) {
  const grouped: { [key: string]: number } = {}
  
  items.forEach(item => {
    grouped[item.category] = (grouped[item.category] || 0) + 1
  })
  
  return grouped
}

function calculateCategoryStats(updates: any[]) {
  const stats: { [key: string]: { total: number; unread: number } } = {}
  
  updates.forEach((update: any) => {
    if (!stats[update.category]) {
      stats[update.category] = { total: 0, unread: 0 }
    }
    
    stats[update.category].total++
    if (!update.is_read) {
      stats[update.category].unread++
    }
  })
  
  return stats
} 