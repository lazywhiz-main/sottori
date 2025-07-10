// アクティビティ機能の型定義
// 既存のデザインを維持しながら、アクティビティ機能を追加

export type ActivityType = '診察' | '検査' | '準備' | '家族相談' | 'メモ';
export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type ActivityPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ActivitySource = 'user_created' | 'ai_recommended' | 'template';

// ユーザーアクティビティ
export interface UserActivity {
  id: string;
  user_id: string;
  roadmap_step_id: number;
  
  // 基本情報
  type: ActivityType;
  content: string;
  description?: string;
  
  // スケジュール情報
  scheduled_date?: string;
  completed_date?: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  
  // メタデータ
  is_ai_recommended: boolean;
  source: ActivitySource;
  tags: string[];
  
  // システム管理
  created_at: string;
  updated_at: string;
}

// アクティビティテンプレート
export interface ActivityTemplate {
  id: string;
  name: string;
  type: ActivityType;
  content: string;
  description?: string;
  
  // 適用条件
  roadmap_step_id: number;
  cancer_type: string[];
  stage: string[];
  age_group: string[];
  family_situation: string[];
  
  // 優先度・表示条件
  priority: number;
  is_ai_recommended: boolean;
  conditions: Record<string, any>;
  
  // システム管理
  created_at: string;
  updated_at: string;
}

// ユーザーアクティビティ設定
export interface UserActivityPreferences {
  id: string;
  user_id: string;
  
  // 表示設定
  show_ai_recommendations: boolean;
  max_recommendations_per_step: number;
  preferred_activity_types: ActivityType[];
  
  // フィルタ設定
  excluded_tags: string[];
  priority_threshold: ActivityPriority;
  
  // システム管理
  created_at: string;
  updated_at: string;
}

// AIお薦めアクティビティ
export interface ActivityRecommendation {
  id: string;
  type: ActivityType;
  content: string;
  description?: string;
  priority: ActivityPriority;
  reason: string; // お薦め理由
  confidence_score?: number; // AIの信頼度
  estimated_impact?: string; // 期待される効果
  template_id?: string; // 元になったテンプレートID
  tags?: string[]; // タグ
}

// アクティビティ作成リクエスト
export interface CreateActivityRequest {
  type: ActivityType;
  content: string;
  description?: string;
  roadmap_step_id: number;
  scheduled_date?: string;
  priority?: ActivityPriority;
  tags?: string[];
}

// アクティビティ更新リクエスト
export interface UpdateActivityRequest {
  status?: ActivityStatus;
  completed_date?: string;
  content?: string;
  scheduled_date?: string;
  priority?: ActivityPriority;
  description?: string;
  tags?: string[];
}

// アクティビティ取得リクエスト
export interface GetActivitiesRequest {
  step_id?: number;
  type?: ActivityType;
  status?: ActivityStatus;
  include_recommendations?: boolean;
  limit?: number;
  offset?: number;
}

// アクティビティ取得レスポンス
export interface GetActivitiesResponse {
  activities: UserActivity[];
  recommendations: ActivityRecommendation[];
  total_count: number;
  current_step: number;
}

// お薦め生成リクエスト
export interface GenerateRecommendationsRequest {
  step_id: number;
  user_context: {
    cancer_type: string;
    stage: string;
    age: number;
    family_situation: string;
    current_activities: string[]; // 既存アクティビティのID
    preferences: string[]; // ユーザー設定
  };
}

// お薦め生成レスポンス
export interface GenerateRecommendationsResponse {
  recommendations: ActivityRecommendation[];
  generated_at: string;
}

// ユーザーコンテキスト（AIお薦め用）
export interface UserContext {
  cancer_type: string;
  stage: string;
  age: number;
  family_situation: string;
  current_activities: UserActivity[];
  preferences: UserActivityPreferences;
}

// アクティビティ統計
export interface ActivityStats {
  total_activities: number;
  completed_activities: number;
  pending_activities: number;
  activities_by_type: Record<ActivityType, number>;
  activities_by_step: Record<number, number>;
}

// アクティビティフィルタ
export interface ActivityFilter {
  step_id?: number;
  type?: ActivityType;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  date_from?: string;
  date_to?: string;
  tags?: string[];
  include_ai_recommended?: boolean;
}

// アクティビティ検索結果
export interface ActivitySearchResult {
  activities: UserActivity[];
  recommendations: ActivityRecommendation[];
  total_count: number;
  has_more: boolean;
}

// アクティビティバッチ操作
export interface ActivityBatchOperation {
  activity_ids: string[];
  operation: 'complete' | 'cancel' | 'delete' | 'update_priority';
  data?: {
    priority?: ActivityPriority;
    scheduled_date?: string;
  };
}

// アクティビティインポート/エクスポート
export interface ActivityExport {
  activities: UserActivity[];
  export_date: string;
  version: string;
}

// アクティビティ通知設定
export interface ActivityNotificationSettings {
  enabled: boolean;
  reminder_days: number[]; // 何日前にリマインダーを送るか
  notification_types: ('email' | 'push' | 'sms')[];
  quiet_hours: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

// アクティビティ共有設定
export interface ActivitySharingSettings {
  share_with_family: boolean;
  share_with_medical_team: boolean;
  share_ai_recommendations: boolean;
  share_sensitive_info: boolean;
}

// アクティビティ分析データ
export interface ActivityAnalytics {
  completion_rate: number;
  average_completion_time: number;
  most_common_types: Array<{
    type: ActivityType;
    count: number;
  }>;
  step_progress: Array<{
    step_id: number;
    completed_count: number;
    total_count: number;
    progress_percentage: number;
  }>;
  ai_recommendation_acceptance_rate: number;
}

// アクティビティテンプレートカテゴリ
export interface ActivityTemplateCategory {
  id: string;
  name: string;
  description: string;
  templates: ActivityTemplate[];
  priority: number;
}

// アクティビティの重複チェック結果
export interface DuplicateCheckResult {
  is_duplicate: boolean;
  similar_activities: UserActivity[];
  similarity_score: number;
  suggested_merge?: boolean;
}

// アクティビティの依存関係
export interface ActivityDependency {
  activity_id: string;
  depends_on: string[]; // 依存するアクティビティのID
  required_for: string[]; // このアクティビティに依存するアクティビティのID
  estimated_duration: number; // 推定所要時間（分）
  prerequisites: string[]; // 前提条件
}

// アクティビティのコメント・メモ
export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

// アクティビティの添付ファイル
export interface ActivityAttachment {
  id: string;
  activity_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_at: string;
}

// アクティビティの履歴
export interface ActivityHistory {
  id: string;
  activity_id: string;
  action: 'created' | 'updated' | 'completed' | 'cancelled' | 'deleted';
  changes: Record<string, any>;
  user_id: string;
  timestamp: string;
}

// アクティビティの繰り返し設定
export interface ActivityRecurrence {
  id: string;
  activity_id: string;
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // 間隔
  end_date?: string;
  max_occurrences?: number;
  days_of_week?: number[]; // 0=日曜日, 1=月曜日, ...
  day_of_month?: number;
  month_of_year?: number;
}

// アクティビティの優先度計算結果
export interface ActivityPriorityScore {
  activity_id: string;
  base_priority: ActivityPriority;
  calculated_score: number;
  factors: {
    deadline_proximity: number;
    dependency_impact: number;
    user_preference: number;
    medical_importance: number;
    ai_recommendation: number;
  };
  final_priority: ActivityPriority;
} 