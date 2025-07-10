import { supabase } from '@/lib/supabase'
import type {
  CancerProfile,
  CancerProfileInsert,
  CancerProfileUpdate,
  ProfileCompletionItem,
  ProfileCompletionInsert,
  ProfileCompletionUpdate,
  CompletionStats,
  DailyStatus,
  DailyStatusInsert,
  DailyStatusUpdate,
  InfoCollectionProgress,
  InfoCollectionInsert,
  InfoCollectionUpdate,
  WeeklySuggestion,
  WeeklySuggestionInsert,
  WeeklySuggestionUpdate,
  DashboardData
} from '@/lib/types/database'

// =============================================================================
// 1. がん治療プロフィール関連
// =============================================================================

export class CancerProfileService {
  // プロフィールを取得
  static async getProfile(userId: string): Promise<CancerProfile | null> {
    const { data, error } = await supabase
      .from('cancer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // レコードが存在しない場合
        return null
      }
      throw error
    }

    return data
  }

  // プロフィールを作成
  static async createProfile(profile: CancerProfileInsert): Promise<CancerProfile> {
    const { data, error } = await supabase
      .from('cancer_profiles')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // プロフィールを更新
  static async updateProfile(userId: string, updates: CancerProfileUpdate): Promise<CancerProfile> {
    const { data, error } = await supabase
      .from('cancer_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // プロフィールをupsert（存在しない場合は作成、存在する場合は更新）
  static async upsertProfile(profile: CancerProfileInsert & CancerProfileUpdate): Promise<CancerProfile> {
    const { data, error } = await supabase
      .from('cancer_profiles')
      .upsert(profile, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// =============================================================================
// 2. プロフィール完了管理関連
// =============================================================================

export class ProfileCompletionService {
  // ユーザーの完了項目を取得
  static async getCompletionItems(userId: string): Promise<ProfileCompletionItem[]> {
    const { data, error } = await supabase
      .from('profile_completion_items')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true })

    if (error) throw error
    return data || []
  }

  // 完了統計を計算
  static async getCompletionStats(userId: string): Promise<CompletionStats> {
    const items = await this.getCompletionItems(userId)
    const completed = items.filter(item => item.is_completed).length
    const total = items.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, percentage }
  }

  // 項目を完了としてマーク
  static async completeItem(itemId: string): Promise<ProfileCompletionItem> {
    const { data, error } = await supabase
      .from('profile_completion_items')
      .update({ 
        is_completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 項目を更新
  static async updateItem(itemId: string, updates: ProfileCompletionUpdate): Promise<ProfileCompletionItem> {
    const { data, error } = await supabase
      .from('profile_completion_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 新しい項目を追加
  static async createItem(item: ProfileCompletionInsert): Promise<ProfileCompletionItem> {
    const { data, error } = await supabase
      .from('profile_completion_items')
      .insert(item)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// =============================================================================
// 3. 日次ステータス関連
// =============================================================================

export class DailyStatusService {
  // 今日のステータスを取得
  static async getTodaysStatus(userId: string): Promise<DailyStatus | null> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('daily_status')
      .select('*')
      .eq('user_id', userId)
      .eq('status_date', today)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  }

  // 指定日のステータスを取得
  static async getStatusByDate(userId: string, date: string): Promise<DailyStatus | null> {
    const { data, error } = await supabase
      .from('daily_status')
      .select('*')
      .eq('user_id', userId)
      .eq('status_date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  }

  // ステータスを記録
  static async recordStatus(status: DailyStatusInsert): Promise<DailyStatus> {
    const { data, error } = await supabase
      .from('daily_status')
      .upsert(status, { onConflict: 'user_id,status_date' })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 過去のステータス履歴を取得
  static async getStatusHistory(userId: string, days: number = 30): Promise<DailyStatus[]> {
    const { data, error } = await supabase
      .from('daily_status')
      .select('*')
      .eq('user_id', userId)
      .order('status_date', { ascending: false })
      .limit(days)

    if (error) throw error
    return data || []
  }
}

// =============================================================================
// 4. 情報収集進捗関連
// =============================================================================

export class InfoCollectionService {
  // ユーザーの収集進捗を取得
  static async getCollectionProgress(userId: string): Promise<InfoCollectionProgress[]> {
    const { data, error } = await supabase
      .from('info_collection_progress')
      .select('*')
      .eq('user_id', userId)
      .order('concern_type', { ascending: true })

    if (error) throw error
    return data || []
  }

  // 進捗を更新
  static async updateProgress(userId: string, concernType: string, updates: InfoCollectionUpdate): Promise<InfoCollectionProgress> {
    const { data, error } = await supabase
      .from('info_collection_progress')
      .update(updates)
      .eq('user_id', userId)
      .eq('concern_type', concernType)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 新しい収集項目を追加
  static async createProgress(progress: InfoCollectionInsert): Promise<InfoCollectionProgress> {
    const { data, error } = await supabase
      .from('info_collection_progress')
      .upsert(progress, { onConflict: 'user_id,concern_type' })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 全体の進捗率を計算
  static async getTotalProgress(userId: string): Promise<number> {
    const progress = await this.getCollectionProgress(userId)
    if (progress.length === 0) return 0

    const totalPercentage = progress.reduce((sum, item) => sum + item.progress_percentage, 0)
    return Math.round(totalPercentage / progress.length)
  }
}

// =============================================================================
// 5. 週次提案関連
// =============================================================================

export class WeeklySuggestionService {
  // 今週の提案を取得
  static async getWeeklySuggestions(userId: string): Promise<WeeklySuggestion[]> {
    const weekStart = this.getWeekStartDate()
    
    const { data, error } = await supabase
      .from('weekly_suggestions')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStart)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) throw error
    return data || []
  }

  // 提案を完了
  static async completeSuggestion(suggestionId: string): Promise<WeeklySuggestion> {
    const { data, error } = await supabase
      .from('weekly_suggestions')
      .update({ 
        is_completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', suggestionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 新しい提案を作成
  static async createSuggestion(suggestion: WeeklySuggestionInsert): Promise<WeeklySuggestion> {
    const { data, error } = await supabase
      .from('weekly_suggestions')
      .insert(suggestion)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 今日完了した提案の数を取得
  static async getTodayCompletedCount(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    
    const { count, error } = await supabase
      .from('weekly_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('completed_at', `${today}T00:00:00`)
      .lt('completed_at', `${today}T23:59:59`)

    if (error) throw error
    return count || 0
  }

  // 週の開始日を取得（月曜日）
  private static getWeekStartDate(): string {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 日曜日は6、その他は曜日-1
    const monday = new Date(now)
    monday.setDate(now.getDate() - daysToMonday)
    return monday.toISOString().split('T')[0]
  }
}

// =============================================================================
// 6. ダッシュボード統合サービス
// =============================================================================

export class DashboardService {
  // ダッシュボードの全データを取得
  static async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      // 並列でデータを取得
      const [
        profileItems,
        profileStats,
        todaysStatus,
        collectionProgress,
        totalProgress,
        weeklySuggestions,
        completedToday
      ] = await Promise.all([
        ProfileCompletionService.getCompletionItems(userId),
        ProfileCompletionService.getCompletionStats(userId),
        DailyStatusService.getTodaysStatus(userId),
        InfoCollectionService.getCollectionProgress(userId),
        InfoCollectionService.getTotalProgress(userId),
        WeeklySuggestionService.getWeeklySuggestions(userId),
        WeeklySuggestionService.getTodayCompletedCount(userId)
      ])

      // 最後のチェックからの日数を計算（仮実装）
      const lastCheckDays = await this.calculateLastCheckDays(userId)

      return {
        profileCompletion: {
          items: profileItems,
          stats: profileStats
        },
        todaysStatus,
        lastCheckDays,
        collectionProgress,
        totalProgress,
        weeklySuggestions,
        completedToday
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
      throw error
    }
  }

  // 最後のゆっくりチェックからの日数を計算
  private static async calculateLastCheckDays(userId: string): Promise<number | null> {
    try {
      // check_historiesテーブルから最新のチェックを取得
      const { data, error } = await supabase
        .from('check_histories')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      const lastCheck = new Date(data.completed_at)
      const today = new Date()
      const diffTime = today.getTime() - lastCheck.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      return diffDays
    } catch (error) {
      console.error('Error calculating last check days:', error)
      return null
    }
  }
}

// =============================================================================
// 7. エラーハンドリング用のユーティリティ
// =============================================================================

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Supabaseエラーを解析して適切なメッセージを返す
export function parseSupabaseError(error: any): string {
  if (error.code === 'PGRST116') {
    return 'データが見つかりません'
  }
  if (error.code === '23505') {
    return 'データが既に存在します'
  }
  if (error.code === '23503') {
    return '関連するデータが見つかりません'
  }
  return error.message || '予期しないエラーが発生しました'
} 