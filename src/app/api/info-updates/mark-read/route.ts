import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
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

    const { structured_content_id } = await request.json()

    if (!structured_content_id) {
      return NextResponse.json({ error: '情報IDが必要です' }, { status: 400 })
    }

    // 情報が存在するか確認
    const { data: content, error: contentError } = await supabase
      .from('structured_content_pool')
      .select('id')
      .eq('id', structured_content_id)
      .eq('is_active', true)
      .single()

    if (contentError || !content) {
      return NextResponse.json({ error: '情報が見つかりません' }, { status: 404 })
    }

    // 既読記録を追加
    const { error: insertError } = await supabase
      .from('user_content_consumption_history')
      .insert({
        user_id: user.id,
        structured_content_id: structured_content_id,
        action_type: 'read_complete',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('既読マーク作成エラー:', insertError)
      return NextResponse.json({ error: '既読マークの作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('既読マークエラー:', error)
    return NextResponse.json({ error: '既読マークの処理に失敗しました' }, { status: 500 })
  }
} 