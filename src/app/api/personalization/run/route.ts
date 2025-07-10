// 個別化エンジン実行API
// Phase 1: 基盤構築 - 基本的な関連度計算実行

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runPersonalizationEngine } from '@/lib/services/personalizationEngine'

// サービスロールキーを使用したSupabaseクライアント
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // "Bearer " を除去

    // トークンからユーザー情報を取得
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // リクエストボディから情報を取得（user_idはトークンから取得したものを使用）
    const { user_id: requestUserId } = await request.json()
    
    // リクエストのuser_idとトークンのuser_idが一致することを確認
    if (requestUserId && requestUserId !== user.id) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      )
    }

    // 個別化エンジン実行
    const result = await runPersonalizationEngine(user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Personalization engine failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user_segment: result.segment,
        processed_items: result.processed_items,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Personalization API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ヘルスチェック用GET
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return NextResponse.json(
      { error: 'user_id parameter is required' },
      { status: 400 }
    )
  }

  try {
    // ユーザーの個別化状況確認
    const { data: segment } = await supabaseAdmin
      .from('user_segments')
      .select('*')
      .eq('user_id', user_id)
      .single()

    const { data: scores, count } = await supabaseAdmin
      .from('info_relevance_scores')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)

    return NextResponse.json({
      success: true,
      data: {
        user_id,
        current_segment: segment?.segment_type || null,
        segment_confidence: segment?.confidence_score || 0,
        calculated_scores: count || 0,
        last_processed: segment?.assigned_at || null
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Personalization status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check personalization status' },
      { status: 500 }
    )
  }
} 