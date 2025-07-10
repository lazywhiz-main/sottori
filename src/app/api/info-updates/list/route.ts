import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const personalized = searchParams.get('personalized') === 'true'
    const includeRelevance = searchParams.get('include_relevance') === 'true'
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 基本クエリ：structured_content_poolから情報を取得
    let query = supabase
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
        created_at,
        updated_at,
        raw_content_id
      `)
      .order('updated_at', { ascending: false })

    // カテゴリフィルター
    if (category) {
      query = query.eq('category', category)
    }

    // 個人化された情報を取得する場合
    if (personalized) {
      // ユーザーの関連度スコアを取得
      const { data: relevanceScores } = await supabase
        .from('structured_content_relevance_scores')
        .select('structured_content_id, final_relevance_score, calculation_details')
        .eq('user_id', user.id)

      // 関連度スコアでソート
      if (relevanceScores && relevanceScores.length > 0) {
        // 関連度スコアの高い順にソート
        const scoreMap = new Map(
          relevanceScores.map(score => [score.structured_content_id, score.final_relevance_score])
        )
        
        // クエリを実行してからソート
        const { data: allUpdates, error: fetchError } = await query
        
        if (fetchError) {
          console.error('情報一覧取得エラー:', fetchError)
          return NextResponse.json({ error: '情報の取得に失敗しました' }, { status: 500 })
        }

        // 関連度スコアでソート
        const sortedUpdates = (allUpdates || []).sort((a, b) => {
          const scoreA = scoreMap.get(a.id) || 0
          const scoreB = scoreMap.get(b.id) || 0
          return scoreB - scoreA // 高い順
        })

        // ページネーション適用
        const paginatedUpdates = sortedUpdates.slice(offset, offset + limit)

        // ソース情報を取得
        const updatesWithSource = await Promise.all(
          paginatedUpdates.map(async (update) => {
            let sourceInfo = null
            if (update.raw_content_id) {
              const { data: rawContent } = await supabase
                .from('raw_content_pool')
                .select('source_url, source_name, source_type')
                .eq('id', update.raw_content_id)
                .single()
              
              sourceInfo = rawContent
            }

            const relevanceScore = relevanceScores.find(score => score.structured_content_id === update.id)

            return {
              id: update.id,
              title: update.title,
              summary: update.summary,
              content: update.content,
              category: update.category,
              source_url: sourceInfo?.source_url,
              source_name: sourceInfo?.source_name,
              source_type: sourceInfo?.source_type,
              reliability_score: update.reliability_score,
              relevance_score: relevanceScore?.final_relevance_score || update.relevance_score,
              quality_score: update.quality_score,
              tags: update.tags || [],
              key_points: update.key_points || [],
              evidence_level: update.evidence_level,
              created_at: update.created_at,
              updated_at: update.updated_at,
              personalization: includeRelevance ? {
                relevance_score: relevanceScore?.final_relevance_score || 0,
                calculation_details: relevanceScore?.calculation_details || null
              } : undefined
            }
          })
        )

        return NextResponse.json({
          updates: updatesWithSource,
          total: sortedUpdates.length,
          hasMore: offset + limit < sortedUpdates.length,
          personalization: {
            enabled: true,
            user_id: user.id,
            scored_items: relevanceScores.length
          }
        })
      }
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1)

    const { data: updates, error } = await query

    if (error) {
      console.error('情報一覧取得エラー:', error)
      return NextResponse.json({ error: '情報の取得に失敗しました' }, { status: 500 })
    }

    // ソース情報を取得（オプション）
    const updatesWithSource = await Promise.all(
      (updates || []).map(async (update) => {
        let sourceInfo = null
        if (update.raw_content_id) {
          const { data: rawContent } = await supabase
            .from('raw_content_pool')
            .select('source_url, source_name, source_type')
            .eq('id', update.raw_content_id)
            .single()
          
          sourceInfo = rawContent
        }

        return {
          id: update.id,
          title: update.title,
          summary: update.summary,
          content: update.content,
          category: update.category,
          source_url: sourceInfo?.source_url,
          source_name: sourceInfo?.source_name,
          source_type: sourceInfo?.source_type,
          reliability_score: update.reliability_score,
          relevance_score: update.relevance_score,
          quality_score: update.quality_score,
          tags: update.tags || [],
          key_points: update.key_points || [],
          evidence_level: update.evidence_level,
          created_at: update.created_at,
          updated_at: update.updated_at
        }
      })
    )

    console.log('一覧API - 取得した情報更新のID:', updatesWithSource.map(u => u.id))
    console.log('一覧API - ユーザーID:', user.id)

    return NextResponse.json({
      updates: updatesWithSource,
      total: updatesWithSource.length,
      hasMore: updatesWithSource.length === limit
    })

  } catch (error) {
    console.error('情報一覧取得エラー:', error)
    return NextResponse.json({ error: '情報の取得に失敗しました' }, { status: 500 })
  }
} 