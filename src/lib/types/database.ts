// Sottori データベース型定義
// 新しく追加されたテーブル用の型定義

// =============================================================================
// 1. がん治療プロフィール関連
// =============================================================================

export interface CancerProfile {
  id: string
  user_id: string
  
  // 基本がん情報
  cancer_type?: string
  stage?: string
  diagnosis_date?: string
  
  // 治療状況
  treatment_status?: string
  current_treatment?: string[]
  treatment_start_date?: string
  
  // 医療チーム（任意）
  primary_doctor?: string
  hospital?: string
  next_appointment?: string
  
  // 関心事・気になるポイント
  concern_areas?: string[]
  priority_concerns?: string[]
  
  // その他
  notes?: string
  
  // システム管理
  created_at: string
  updated_at: string
}

// がん治療プロフィールの挿入用型（IDやタイムスタンプなし）
export interface CancerProfileInsert {
  user_id: string
  cancer_type?: string
  stage?: string
  diagnosis_date?: string
  treatment_status?: string
  current_treatment?: string[]
  treatment_start_date?: string
  primary_doctor?: string
  hospital?: string
  next_appointment?: string
  concern_areas?: string[]
  priority_concerns?: string[]
  notes?: string
}

// がん治療プロフィールの更新用型（user_idとタイムスタンプなし）
export interface CancerProfileUpdate {
  cancer_type?: string
  stage?: string
  diagnosis_date?: string
  treatment_status?: string
  current_treatment?: string[]
  treatment_start_date?: string
  primary_doctor?: string
  hospital?: string
  next_appointment?: string
  concern_areas?: string[]
  priority_concerns?: string[]
  notes?: string
}

// =============================================================================
// 2. プロフィール完了管理関連
// =============================================================================

export interface ProfileCompletionItem {
  id: string
  user_id: string
  
  // 項目情報
  category: string
  title: string
  description?: string
  priority: number
  estimated_time?: string
  related_url?: string
  
  // 完了状況
  is_completed: boolean
  completed_at?: string
  
  // システム管理
  created_at: string
  updated_at: string
}

export interface ProfileCompletionInsert {
  user_id: string
  category: string
  title: string
  description?: string
  priority?: number
  estimated_time?: string
  related_url?: string
  is_completed?: boolean
}

export interface ProfileCompletionUpdate {
  category?: string
  title?: string
  description?: string
  priority?: number
  estimated_time?: string
  related_url?: string
  is_completed?: boolean
  completed_at?: string
}

// 完了統計
export interface CompletionStats {
  total: number
  completed: number
  percentage: number
}

// =============================================================================
// 3. 日次ステータス関連
// =============================================================================

export interface DailyStatus {
  id: string
  user_id: string
  
  // 日付
  status_date: string
  
  // ステータス情報
  mood_score?: number
  energy_level?: number
  notes?: string
  
  // システム管理
  created_at: string
  updated_at: string
}

export interface DailyStatusInsert {
  user_id: string
  status_date: string
  mood_score?: number
  energy_level?: number
  notes?: string
}

export interface DailyStatusUpdate {
  mood_score?: number
  energy_level?: number
  notes?: string
}

// =============================================================================
// 4. 情報収集進捗関連
// =============================================================================

export type CollectionStatus = 'pending' | 'collecting' | 'ready' | 'completed'

export interface InfoCollectionProgress {
  id: string
  user_id: string
  
  // 収集対象
  concern_type: string
  concern_label: string
  
  // 進捗情報
  status: CollectionStatus
  progress_percentage: number
  items_found: number
  
  // システム管理
  last_updated: string
  created_at: string
  updated_at: string
}

export interface InfoCollectionInsert {
  user_id: string
  concern_type: string
  concern_label: string
  status?: CollectionStatus
  progress_percentage?: number
  items_found?: number
}

export interface InfoCollectionUpdate {
  concern_label?: string
  status?: CollectionStatus
  progress_percentage?: number
  items_found?: number
}

// =============================================================================
// 5. 週次提案関連
// =============================================================================

export type SuggestionType = 'action' | 'information' | 'reminder' | 'opportunity'

export interface WeeklySuggestion {
  id: string
  user_id: string
  
  // 提案内容
  title: string
  description?: string
  type: SuggestionType
  priority: number
  estimated_time?: string
  related_url?: string
  due_date?: string
  
  // 完了状況
  is_completed: boolean
  completed_at?: string
  
  // 表示制御
  is_active: boolean
  week_start_date: string
  
  // システム管理
  created_at: string
  updated_at: string
}

export interface WeeklySuggestionInsert {
  user_id: string
  title: string
  description?: string
  type?: SuggestionType
  priority?: number
  estimated_time?: string
  related_url?: string
  due_date?: string
  is_completed?: boolean
  is_active?: boolean
  week_start_date: string
}

export interface WeeklySuggestionUpdate {
  title?: string
  description?: string
  type?: SuggestionType
  priority?: number
  estimated_time?: string
  related_url?: string
  due_date?: string
  is_completed?: boolean
  completed_at?: string
  is_active?: boolean
  week_start_date?: string
}

// =============================================================================
// 5. 治療ロードマップ関連
// =============================================================================

export interface RoadmapStep {
  id: number
  title: string
  description: string
  order_index: number
  cancer_type: string[]
  stage: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RoadmapStepDetail {
  id: number
  step_id: number
  icon: string
  text: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserRoadmapProgress {
  id: string
  user_id: string
  step_id: number
  status: 'completed' | 'current' | 'upcoming'
  started_at?: string
  completed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface UserRoadmapProgressInsert {
  user_id: string
  step_id: number
  status?: 'completed' | 'current' | 'upcoming'
  started_at?: string
  completed_at?: string
  notes?: string
}

export interface UserRoadmapProgressUpdate {
  status?: 'completed' | 'current' | 'upcoming'
  started_at?: string
  completed_at?: string
  notes?: string
}

// フロントエンド用の統合型
export interface TreatmentStepWithProgress {
  id: number
  title: string
  description: string
  status: 'completed' | 'current' | 'upcoming'
  details: Array<{
    icon: string
    text: string
  }>
  progress?: UserRoadmapProgress
}

// =============================================================================
// 6. ダッシュボード用の統合型
// =============================================================================

export interface DashboardData {
  // 基本情報管理エリア
  profileCompletion: {
    items: ProfileCompletionItem[]
    stats: CompletionStats
  }
  
  // 今日の確認エリア  
  todaysStatus: DailyStatus | null
  lastCheckDays: number | null
  
  // 情報収集状況エリア
  collectionProgress: InfoCollectionProgress[]
  totalProgress: number
  
  // 今週の提案エリア
  weeklySuggestions: WeeklySuggestion[]
  completedToday: number
}

// =============================================================================
// 7. 便利な型ガード関数
// =============================================================================

export function isValidMoodScore(score: any): score is number {
  return typeof score === 'number' && score >= 1 && score <= 5
}

export function isValidEnergyLevel(level: any): level is number {
  return typeof level === 'number' && level >= 1 && level <= 5
}

export function isValidCollectionStatus(status: any): status is CollectionStatus {
  return ['pending', 'collecting', 'ready', 'completed'].includes(status)
}

export function isValidSuggestionType(type: any): type is SuggestionType {
  return ['action', 'information', 'reminder', 'opportunity'].includes(type)
}

// =============================================================================
// 8. Supabase統合用の型
// =============================================================================

export interface Database {
  public: {
    Tables: {
      cancer_profiles: {
        Row: CancerProfile
        Insert: CancerProfileInsert
        Update: CancerProfileUpdate
      }
      profile_completion_items: {
        Row: ProfileCompletionItem
        Insert: ProfileCompletionInsert
        Update: ProfileCompletionUpdate
      }
      daily_status: {
        Row: DailyStatus
        Insert: DailyStatusInsert
        Update: DailyStatusUpdate
      }
      info_collection_progress: {
        Row: InfoCollectionProgress
        Insert: InfoCollectionInsert
        Update: InfoCollectionUpdate
      }
      weekly_suggestions: {
        Row: WeeklySuggestion
        Insert: WeeklySuggestionInsert
        Update: WeeklySuggestionUpdate
      }
      roadmap_steps: {
        Row: RoadmapStep
        Insert: RoadmapStep
        Update: RoadmapStep
      }
      roadmap_step_details: {
        Row: RoadmapStepDetail
        Insert: RoadmapStepDetail
        Update: RoadmapStepDetail
      }
      user_roadmap_progress: {
        Row: UserRoadmapProgress
        Insert: UserRoadmapProgressInsert
        Update: UserRoadmapProgressUpdate
      }
    }
  }
} 