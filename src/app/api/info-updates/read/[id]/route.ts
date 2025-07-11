import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // トークンでユーザーを認証
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await params
    console.log('詳細取得API - updateId:', id)
    console.log('詳細取得API - user.id:', user.id)

    // structured_content_poolから情報を取得（raw_content_poolとの結合を外す）
    const { data: update, error: updateError } = await supabase
      .from('structured_content_pool')
      .select(`
        id,
        title,
        summary,
        content,
        category,
        reliability_score,
        relevance_score,
        quality_score,
        tags,
        key_points,
        evidence_level,
        structured_data,
        created_at,
        updated_at,
        raw_content_id
      `)
      .eq('id', id)
      .single()

    console.log('詳細取得API - update:', update)
    console.log('詳細取得API - updateError:', updateError)

    if (updateError) {
      console.error('情報詳細取得エラー:', updateError)
      return NextResponse.json({ error: '情報が見つかりません' }, { status: 404 })
    }

    if (!update) {
      return NextResponse.json({ error: '情報が見つかりません' }, { status: 404 })
    }

    // raw_content_poolからソース情報を取得（オプション）
    let sourceInfo = null
    if (update.raw_content_id) {
      const { data: rawContent } = await supabase
        .from('raw_content_pool')
        .select('source_url, source_name, source_type, content_type')
        .eq('id', update.raw_content_id)
        .single()
      
      sourceInfo = rawContent
    }

    // ユーザーの関連度スコアを取得（テーブルが存在しない場合はスキップ）
    let relevanceScore = null
    try {
      const { data: relevanceData } = await supabase
        .from('structured_content_relevance_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('structured_content_id', id)
        .single()
      
      relevanceScore = relevanceData
    } catch (error) {
      console.log('関連度スコアテーブルが存在しないか、データが見つかりません:', error)
    }

    // ユーザーの閲覧・保存状態を取得（user_content_consumption_historyから）
    let userState = null
    try {
      const { data: consumptionHistory } = await supabase
        .from('user_content_consumption_history')
        .select('action_type, created_at')
        .eq('user_id', user.id)
        .eq('structured_content_id', id)
        .order('created_at', { ascending: false })

      if (consumptionHistory && consumptionHistory.length > 0) {
        const readAction = consumptionHistory.find(h => h.action_type === 'read_complete')
        const savedAction = consumptionHistory.find(h => h.action_type === 'saved')
        
        userState = {
          is_read: !!readAction,
          is_saved: !!savedAction,
          read_at: readAction?.created_at || null,
          saved_at: savedAction?.created_at || null
        }
      }
    } catch (error) {
      console.log('ユーザー履歴テーブルが存在しないか、データが見つかりません:', error)
    }

    // レスポンス形式を統一
    const response = {
      id: update.id,
      title: update.title,
      summary: update.summary,
      content: update.content,
      category: update.category,
      source_url: sourceInfo?.source_url,
      source_name: sourceInfo?.source_name,
      source_type: sourceInfo?.source_type,
      content_type: sourceInfo?.content_type,
      reliability_score: update.reliability_score,
      relevance_score: update.relevance_score,
      quality_score: update.quality_score,
      tags: update.tags || [],
      key_points: update.key_points || [],
      evidence_level: update.evidence_level,
      structured_data: update.structured_data,
      created_at: update.created_at,
      updated_at: update.updated_at,
      // 個人化情報
      personalization: relevanceScore ? {
        final_relevance_score: relevanceScore.final_relevance_score,
        medical_match_score: relevanceScore.medical_match_score,
        situational_relevance_score: relevanceScore.situational_relevance_score,
        personal_interest_score: relevanceScore.personal_interest_score,
        urgency_importance_score: relevanceScore.urgency_importance_score,
        relevance_explanation: relevanceScore.relevance_explanation
      } : null,
      // ユーザー状態
      user_state: userState ? {
        is_read: userState.is_read,
        is_saved: userState.is_saved,
        read_at: userState.read_at,
        saved_at: userState.saved_at
      } : {
        is_read: false,
        is_saved: false,
        read_at: null,
        saved_at: null
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('情報詳細取得エラー:', error)
    return NextResponse.json({ error: '情報の取得に失敗しました' }, { status: 500 })
  }
} 