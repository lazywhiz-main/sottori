import { supabase } from '../supabase'

export interface UserVisit {
  id: string
  user_id: string
  page: string
  visit_count: number
  first_visit_at: string
  last_visit_at: string
  created_at: string
  updated_at: string
}

export class UserVisitService {
  private supabase = supabase

  // ユーザーの訪問記録を取得または作成
  async getOrCreateUserVisit(userId: string, page: string = 'dashboard'): Promise<UserVisit | null> {
    try {
      // 既存の訪問記録を確認
      const { data: existingVisit, error: fetchError } = await this.supabase
        .from('user_visits')
        .select('*')
        .eq('user_id', userId)
        .eq('page', page)
        .single()

      // テーブルが存在しない場合やその他のエラーの場合は、初回訪問として扱う
      if (fetchError) {
        console.warn('User visits table not available, treating as first visit:', fetchError.message)
        return null
      }

      if (existingVisit) {
        // 訪問回数を更新
        const { data: updatedVisit, error: updateError } = await this.supabase
          .from('user_visits')
          .update({
            visit_count: existingVisit.visit_count + 1,
            last_visit_at: new Date().toISOString()
          })
          .eq('id', existingVisit.id)
          .select()
          .single()

        if (updateError) {
          console.warn('Failed to update user visit, returning existing data:', updateError.message)
          return existingVisit
        }

        return updatedVisit
      } else {
        // 新規訪問記録を作成
        const { data: newVisit, error: createError } = await this.supabase
          .from('user_visits')
          .insert({
            user_id: userId,
            page,
            visit_count: 1,
            first_visit_at: new Date().toISOString(),
            last_visit_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.warn('Failed to create user visit:', createError.message)
          return null
        }

        return newVisit
      }
    } catch (error) {
      console.warn('Error in getOrCreateUserVisit:', error)
      return null
    }
  }

  // 初回訪問かどうかを判定
  async isFirstVisit(userId: string, page: string = 'dashboard'): Promise<boolean> {
    try {
      const visit = await this.getOrCreateUserVisit(userId, page)
      // テーブルが存在しない場合やエラーの場合は初回訪問として扱う
      return visit ? visit.visit_count === 1 : true
    } catch (error) {
      console.warn('Error checking first visit, treating as first visit:', error)
      return true
    }
  }

  // ユーザーの全訪問履歴を取得
  async getUserVisitHistory(userId: string): Promise<UserVisit[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_visits')
        .select('*')
        .eq('user_id', userId)
        .order('last_visit_at', { ascending: false })

      if (error) {
        console.warn('Failed to get user visit history:', error.message)
        return []
      }

      return data || []
    } catch (error) {
      console.warn('Error in getUserVisitHistory:', error)
      return []
    }
  }

  // 総訪問回数を取得
  async getTotalVisitCount(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('user_visits')
        .select('visit_count')
        .eq('user_id', userId)

      if (error) {
        console.warn('Failed to get total visit count:', error.message)
        return 0
      }

      return data?.reduce((total, visit) => total + visit.visit_count, 0) || 0
    } catch (error) {
      console.warn('Error in getTotalVisitCount:', error)
      return 0
    }
  }
}

// シングルトンインスタンス
export const userVisitService = new UserVisitService() 