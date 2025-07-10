// 情報更新機能の型定義（structured_content_poolベース）

export type InfoUpdateCategory = 
  | 'treatment_options' 
  | 'diagnosis'
  | 'support_resources' 
  | 'lifestyle'
  | 'research_news'

export type InfoUpdatePriority = 'high' | 'medium' | 'low'
export type CollectionStatus = 'waiting' | 'collecting' | 'completed'

// 関連度スコアの型定義
export interface RelevanceScore {
  final_relevance_score: number
  medical_match_score: number
  situational_relevance_score: number
  personal_interest_score: number
  urgency_importance_score: number
  relevance_explanation?: string
}

// ユーザー状態の型定義
export interface UserState {
  is_read: boolean
  is_saved: boolean
  read_at?: string
  saved_at?: string
}

// 構造化コンテンツの型定義
export interface StructuredContent {
  id: string
  title: string
  summary?: string
  content: string
  category: InfoUpdateCategory
  source_url?: string
  source_name?: string
  source_type?: string
  content_type?: string
  reliability_score: number
  relevance_score: number
  quality_score?: number
  tags?: string[]
  key_points?: string[]
  evidence_level?: string
  practical_advice?: string[]
  structured_data?: Record<string, any>
  cancer_types?: string[]
  stages?: string[]
  age_groups?: string[]
  regions?: string[]
  created_at: string
  updated_at: string
  // 個人化情報
  final_relevance_score?: number
  medical_match_score?: number
  situational_relevance_score?: number
  personal_interest_score?: number
  urgency_importance_score?: number
  relevance_explanation?: string
  // 個人化オブジェクト（APIレスポンス用）
  personalization?: RelevanceScore
  // ユーザー状態
  user_state?: UserState
}

// 後方互換性のためのInfoUpdate型（既存コード対応）
export interface InfoUpdate extends StructuredContent {
  user_id?: string
  priority: InfoUpdatePriority
  is_read: boolean
  is_saved: boolean
  expires_at?: string
  metadata: Record<string, any>
}

export interface InfoCollectionProgress {
  id: string
  user_id: string
  category: string
  progress_percentage: number
  status: CollectionStatus
  items_found: number
  last_updated: string
  metadata: Record<string, any>
}

export interface InfoUpdateStats {
  total: number
  unread: number
  by_category: Record<InfoUpdateCategory, number>
  by_priority: Record<InfoUpdatePriority, number>
}

export interface CategoryTabData {
  category: InfoUpdateCategory | 'all'
  label: string
  count: number
  icon: string
}

// APIレスポンス型
export interface InfoUpdatesResponse {
  updates: StructuredContent[]
  total: number
  hasMore: boolean
}

// API リクエスト型
export interface MarkAsReadRequest {
  structured_content_id: string
}

export interface SaveUpdateRequest {
  structured_content_id: string
}

export interface CollectInfoRequest {
  categories?: InfoUpdateCategory[]
  force?: boolean
} 