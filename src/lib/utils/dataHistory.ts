import { supabase } from '../supabase'

// チェック履歴を保存
export const saveCheckHistory = async (answers: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    const { data, error } = await supabase
      .from('check_histories')
      .insert([
        {
          user_id: user.id,
          answers: answers,
          completed_at: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        }
      ])
      .select()

    if (error) {
      throw error
    }

    return data[0]
  } catch (error) {
    console.error('チェック履歴の保存エラー:', error)
    throw error
  }
}

// ロードマップ履歴を保存
export const saveRoadmapHistory = async (content: any, title: string, checkHistoryId?: string, userResponses?: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    const { data, error } = await supabase
      .from('roadmap_histories')
      .insert([
        {
          user_id: user.id,
          check_history_id: checkHistoryId || null,
          content: content,
          title: title,
          user_responses: userResponses || null
        }
      ])
      .select()

    if (error) {
      throw error
    }

    return data[0]
  } catch (error) {
    console.error('ロードマップ履歴の保存エラー:', error)
    throw error
  }
}

// チェック履歴を取得
export const getCheckHistories = async (limit: number = 10) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    const { data, error } = await supabase
      .from('check_histories')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('チェック履歴の取得エラー:', error)
    throw error
  }
}

// ロードマップ履歴を取得
export const getRoadmapHistories = async (limit: number = 10) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    const { data, error } = await supabase
      .from('roadmap_histories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    // user_responsesは既にroadmap_historiesテーブルに保存されているのでそのまま返す
    return data || []
  } catch (error) {
    console.error('ロードマップ履歴の取得エラー:', error)
    throw error
  }
} 