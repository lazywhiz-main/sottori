import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

export async function POST(
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

    const { id: structuredContentId } = await params

    // 情報が存在するか確認
    const { data: content, error: contentError } = await supabase
      .from('structured_content_pool')
      .select('id')
      .eq('id', structuredContentId)
      .single()

    if (contentError || !content) {
      return NextResponse.json({ error: '情報が見つかりません' }, { status: 404 })
    }

    // 保存記録を追加
    const { data, error } = await supabase
      .from('user_content_consumption_history')
      .insert({
        user_id: user.id,
        structured_content_id: structuredContentId,
        action_type: 'saved',
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('保存マーク作成エラー:', error)
      return NextResponse.json({ error: '保存マークの作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0],
      message: '保存しました'
    })

  } catch (error) {
    console.error('保存マークエラー:', error)
    return NextResponse.json({ error: '保存マークの処理に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(
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

    const { id: structuredContentId } = await params

    // 保存記録を削除（最新の保存記録を削除）
    const { error } = await supabase
      .from('user_content_consumption_history')
      .delete()
      .eq('user_id', user.id)
      .eq('structured_content_id', structuredContentId)
      .eq('action_type', 'saved')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('保存解除エラー:', error)
      return NextResponse.json({ error: '保存解除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: '保存を解除しました'
    })

  } catch (error) {
    console.error('保存解除エラー:', error)
    return NextResponse.json({ error: '保存解除の処理に失敗しました' }, { status: 500 })
  }
} 