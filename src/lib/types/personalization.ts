// 個別化システム型定義
// Phase 1: 基盤構築 - 設計書の型定義を実装

// =============================================================================
// 1. 情報カテゴリとユーザーセグメント
// =============================================================================

export type InfoCategory = 
  | 'treatment_options'     // 治療選択肢
  | 'doctors'              // 医師・病院情報
  | 'side_effects'         // 副作用情報
  | 'clinical_trials'      // 臨床試験
  | 'support_resources'    // サポートリソース
  | 'financial_assistance' // 経済的支援

export type UserSegment = 
  | 'newly_diagnosed'      // 診断から3ヶ月以内
  | 'active_treatment'     // 治療中
  | 'post_treatment'       // 治療完了後
  | 'long_term_survivor'   // 5年以上経過
  | 'recurrence'          // 再発
  | 'palliative'          // 緩和ケア
  | 'caregiver'           // 介護者

export type TreatmentPhase = 'pre_treatment' | 'active_treatment' | 'post_treatment' | 'surveillance'
export type UrgencyLevel = 'immediate' | 'upcoming' | 'general'
export type ReadingSpeed = 'fast' | 'medium' | 'slow'
export type InformationDepth = 'basic' | 'detailed' | 'comprehensive'
export type UpdateFrequency = 'immediate' | 'daily' | 'weekly'
export type CommunicationStyle = 'formal' | 'casual' | 'empathetic'
export type ContentFormat = 'text' | 'visual' | 'video' | 'audio'
export type NotificationFrequency = 'minimal' | 'standard' | 'comprehensive'
export type NotificationChannel = 'in_app' | 'push' | 'email'

// =============================================================================
// 2. 個別化インプット（設計書 PersonalizationInput）
// =============================================================================

export interface PersonalizationInput {
  // 医療情報
  medical: {
    cancerType: string
    stage: string
    diagnosisDate: Date
    currentTreatment: {
      type: string[]
      status: 'planning' | 'ongoing' | 'completed' | 'paused'
      startDate?: Date
      expectedEndDate?: Date
    }
    treatmentHistory: {
      type: string
      period: { start: Date, end: Date }
      outcome: string
    }[]
    sideEffectsExperienced: string[]
  }

  // 地理的・社会的情報  
  context: {
    location: {
      prefecture: string
      city: string
      region: 'urban' | 'suburban' | 'rural'
    }
    demographics: {
      ageRange: '20-29' | '30-39' | '40-49' | '50-59' | '60-69' | '70+'
      employment: 'working' | 'retired' | 'student' | 'homemaker' | 'unemployed'
      familySupport: 'high' | 'medium' | 'low'
    }
    accessibility: {
      mobilityLimitations?: string[]
      languagePreference: 'japanese' | 'english' | 'both'
      technologyComfort: 'high' | 'medium' | 'low'
    }
  }

  // 情報需要特性
  preferences: {
    informationDepth: InformationDepth
    updateFrequency: UpdateFrequency
    priorityAreas: InfoCategory[]
    communicationStyle: CommunicationStyle
    contentFormat: ContentFormat[]
  }

  // 行動データ
  behavioral: {
    appUsagePattern: {
      activeHours: number[]
      sessionDuration: number
      frequentFeatures: string[]
    }
    informationConsumption: {
      readingSpeed: ReadingSpeed
      completionRate: number
      saveRate: number
      categories: Record<InfoCategory, {
        engagementScore: number
        lastAccessed: Date
      }>
    }
  }
}

// =============================================================================
// 3. リアルタイム状況データ（設計書 ContextualInput）
// =============================================================================

export interface ContextualInput {
  currentTreatmentPhase: {
    phase: TreatmentPhase
    daysInPhase: number
    nextMilestone?: {
      type: 'appointment' | 'test' | 'treatment_end'
      date: Date
    }
  }
  
  recentActivity: {
    lastVisit: Date
    recentSearches: string[]
    recentSavedItems: string[]
    reportedSymptoms?: string[]
  }

  currentConcerns: {
    immediate: string[]
    upcoming: string[]
    general: string[]
  }
}

// =============================================================================
// 4. 関連度計算（設計書 RelevanceCalculation）
// =============================================================================

export interface RelevanceCalculation {
  // 基本マッチング (40%)
  medicalMatch: {
    cancerTypeMatch: number      // がん種の一致度 (0-100)
    stageRelevance: number       // 病期の関連性 (0-100)
    treatmentRelevance: number   // 治療法の関連性 (0-100)
  }

  // 状況的関連性 (30%)
  contextualRelevance: {
    treatmentPhaseMatch: number  // 治療段階の一致度
    geographicRelevance: number  // 地理的関連性
    timelinessScore: number      // タイミングの適切さ
  }

  // 個人的関心 (20%)
  personalInterest: {
    categoryPreference: number   // カテゴリ嗜好
    pastEngagement: number       // 過去のエンゲージメント
    searchHistory: number        // 検索履歴との関連
  }

  // 緊急度・重要度 (10%)
  priority: {
    medicalUrgency: number       // 医学的緊急度
    userConcernMatch: number     // ユーザーの関心事との一致
    timeSpecificity: number      // 時期特有性
  }
}

// =============================================================================
// 5. パーソナライズドアウトプット（設計書 PersonalizedOutput）
// =============================================================================

export interface PersonalizedOutput {
  // 優先順位付き情報リスト
  prioritizedUpdates: {
    immediate: InfoUpdate[]      // 今すぐ見るべき情報
    upcoming: InfoUpdate[]       // 近日中に確認すべき情報
    background: InfoUpdate[]     // 時間があるときに読む情報
    archived: InfoUpdate[]       // 参考情報として保存
  }

  // カスタマイズされた表示
  presentation: {
    summaryLevel: 'brief' | 'standard' | 'detailed'
    highlightedSections: string[]
    hiddenComplexity: string[]
    adaptedLanguage: {
      medicalTerms: 'simplified' | 'standard' | 'technical'
      tone: 'supportive' | 'neutral' | 'clinical'
    }
  }

  // 行動推奨
  recommendations: {
    nextActions: {
      type: 'read' | 'save' | 'discuss_with_doctor' | 'contact_hospital'
      item: string
      priority: 'high' | 'medium' | 'low'
      timing: 'now' | 'this_week' | 'next_appointment'
    }[]
    
    informationGaps: {
      category: InfoCategory
      reason: string
      suggestedAction: string
    }[]
  }

  // 進捗・フィードバック
  personalizationInsights: {
    confidence: number           // パーソナライゼーションの信頼度 (0-100)
    dataCompleteness: number     // プロフィールデータの完全性 (0-100)
    adaptationSuggestions: string[]
  }
}

// =============================================================================
// 6. データベーステーブル型定義
// =============================================================================

// ユーザー医療プロフィール
export interface UserMedicalProfile {
  id: string
  user_id: string
  cancer_type?: string
  stage?: string
  diagnosis_date?: string
  current_treatment_types: string[]
  treatment_status?: 'planning' | 'ongoing' | 'completed' | 'paused'
  treatment_start_date?: string
  treatment_end_date?: string
  treatment_history: {
    type: string
    period: { start: string, end: string }
    outcome: string
  }[]
  side_effects_experienced: string[]
  primary_doctor?: string
  hospital?: string
  hospital_location?: string
  created_at: string
  updated_at: string
}

export interface UserMedicalProfileInsert {
  user_id: string
  cancer_type?: string
  stage?: string
  diagnosis_date?: string
  current_treatment_types?: string[]
  treatment_status?: 'planning' | 'ongoing' | 'completed' | 'paused'
  treatment_start_date?: string
  treatment_end_date?: string
  treatment_history?: {
    type: string
    period: { start: string, end: string }
    outcome: string
  }[]
  side_effects_experienced?: string[]
  primary_doctor?: string
  hospital?: string
  hospital_location?: string
}

// ユーザーコンテキストプロフィール
export interface UserContextProfile {
  id: string
  user_id: string
  prefecture?: string
  city?: string
  region?: 'urban' | 'suburban' | 'rural'
  age_range?: '20-29' | '30-39' | '40-49' | '50-59' | '60-69' | '70+'
  employment?: 'working' | 'retired' | 'student' | 'homemaker' | 'unemployed'
  family_support?: 'high' | 'medium' | 'low'
  mobility_limitations: string[]
  language_preference: 'japanese' | 'english' | 'both'
  technology_comfort: 'high' | 'medium' | 'low'
  created_at: string
  updated_at: string
}

export interface UserContextProfileInsert {
  user_id: string
  prefecture?: string
  city?: string
  region?: 'urban' | 'suburban' | 'rural'
  age_range?: '20-29' | '30-39' | '40-49' | '50-59' | '60-69' | '70+'
  employment?: 'working' | 'retired' | 'student' | 'homemaker' | 'unemployed'
  family_support?: 'high' | 'medium' | 'low'
  mobility_limitations?: string[]
  language_preference?: 'japanese' | 'english' | 'both'
  technology_comfort?: 'high' | 'medium' | 'low'
}

// ユーザー設定プロフィール
export interface UserPreferenceProfile {
  id: string
  user_id: string
  information_depth: InformationDepth
  update_frequency: UpdateFrequency
  priority_areas: string[]
  communication_style: CommunicationStyle
  content_formats: string[]
  notification_frequency: NotificationFrequency
  notification_channels: string[]
  notification_timing: number[]
  created_at: string
  updated_at: string
}

export interface UserPreferenceProfileInsert {
  user_id: string
  information_depth?: InformationDepth
  update_frequency?: UpdateFrequency
  priority_areas?: string[]
  communication_style?: CommunicationStyle
  content_formats?: string[]
  notification_frequency?: NotificationFrequency
  notification_channels?: string[]
  notification_timing?: number[]
}

// ユーザー行動パターン
export interface UserBehaviorPattern {
  id: string
  user_id: string
  active_hours: number[]
  average_session_duration: number
  frequent_features: string[]
  reading_speed: ReadingSpeed
  completion_rate: number
  save_rate: number
  last_calculated: string
  created_at: string
  updated_at: string
}

// カテゴリ別エンゲージメント
export interface UserCategoryEngagement {
  id: string
  user_id: string
  category: InfoCategory
  engagement_score: number
  click_count: number
  read_count: number
  save_count: number
  share_count: number
  last_accessed?: string
  created_at: string
  updated_at: string
}

// 治療段階
export interface UserTreatmentPhase {
  id: string
  user_id: string
  current_phase: TreatmentPhase
  days_in_phase: number
  next_milestone_type?: 'appointment' | 'test' | 'treatment_end'
  next_milestone_date?: string
  next_milestone_description?: string
  created_at: string
  updated_at: string
}

// 現在の関心事
export interface UserCurrentConcern {
  id: string
  user_id: string
  urgency_level: UrgencyLevel
  concern_text: string
  category?: InfoCategory
  is_active: boolean
  resolved_at?: string
  created_at: string
  updated_at: string
}

// 関連度スコア
export interface InfoRelevanceScore {
  id: string
  user_id: string
  info_update_id: string
  medical_match_score: number
  contextual_relevance_score: number
  personal_interest_score: number
  priority_score: number
  final_relevance_score: number
  calculation_details: Record<string, any>
  calculated_at: string
  created_at: string
}

// ユーザーセグメント
export interface UserSegmentRecord {
  id: string
  user_id: string
  segment_type: UserSegment
  confidence_score: number
  segment_characteristics: Record<string, any>
  assigned_at: string
  created_at: string
  updated_at: string
}

// =============================================================================
// 7. InfoUpdate拡張（既存のinfo_updatesテーブルとの統合）
// =============================================================================

export interface InfoUpdate {
  id: string
  user_id: string
  category: InfoCategory
  title: string
  summary: string
  content: string
  source_url?: string
  relevance_score: number
  priority: 'high' | 'medium' | 'low'
  is_read: boolean
  is_saved: boolean
  created_at: string
  expires_at?: string
  metadata: Record<string, any>
  
  // 個別化システムで追加される関連度詳細（join結果）
  relevance_details?: InfoRelevanceScore
}

// =============================================================================
// 8. 統合データ型（API用）
// =============================================================================

export interface UnifiedUserProfile {
  user_id: string
  medical: UserMedicalProfile | null
  context: UserContextProfile | null
  preferences: UserPreferenceProfile | null
  behavior: UserBehaviorPattern | null
  treatment_phase: UserTreatmentPhase | null
  segment: UserSegmentRecord | null
  category_engagement: UserCategoryEngagement[]
  current_concerns: UserCurrentConcern[]
}

export interface ScoredInformation {
  info_update: InfoUpdate
  relevance_score: InfoRelevanceScore
  segment_match: boolean
  priority_boost: number
}

// =============================================================================
// 9. API レスポンス型
// =============================================================================

export interface PersonalizationApiResponse {
  success: boolean
  data?: PersonalizedOutput
  error?: string
  metadata?: {
    calculation_time_ms: number
    user_segment: UserSegment
    confidence_score: number
  }
}

export interface ProfileUpdateResponse {
  success: boolean
  updated_fields: string[]
  personalization_impact: {
    score_change: number
    segment_change?: UserSegment
  }
  error?: string
}

// =============================================================================
// 10. 設定・管理用型
// =============================================================================

export interface PersonalizationSettings {
  enabled: boolean
  algorithms: {
    relevance_calculation: 'v1' | 'v2'
    segment_classification: 'rule_based' | 'ml_enhanced'
    content_adaptation: 'basic' | 'advanced'
  }
  weights: {
    medical_match: number     // デフォルト: 40
    contextual_relevance: number  // デフォルト: 30
    personal_interest: number     // デフォルト: 20
    priority: number             // デフォルト: 10
  }
  thresholds: {
    min_relevance_score: number  // デフォルト: 30
    segment_confidence: number   // デフォルト: 70
  }
}

// =============================================================================
// 11. バリデーション関数
// =============================================================================

export function isValidInfoCategory(category: any): category is InfoCategory {
  return ['treatment_options', 'doctors', 'side_effects', 'clinical_trials', 'support_resources', 'financial_assistance'].includes(category)
}

export function isValidUserSegment(segment: any): segment is UserSegment {
  return ['newly_diagnosed', 'active_treatment', 'post_treatment', 'long_term_survivor', 'recurrence', 'palliative', 'caregiver'].includes(segment)
}

export function isValidTreatmentPhase(phase: any): phase is TreatmentPhase {
  return ['pre_treatment', 'active_treatment', 'post_treatment', 'surveillance'].includes(phase)
}

export function isValidUrgencyLevel(level: any): level is UrgencyLevel {
  return ['immediate', 'upcoming', 'general'].includes(level)
}

export function isValidReadingSpeed(speed: any): speed is ReadingSpeed {
  return ['fast', 'medium', 'slow'].includes(speed);
}

// =============================================================================
// アクティビティ機能の型定義
// =============================================================================

export type ActivityType = '診察' | '検査' | '準備' | '家族相談' | 'メモ';
export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type ActivityPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ActivitySource = 'user_created' | 'ai_recommended' | 'template';

export interface UserActivity {
  id: string;
  user_id: string;
  roadmap_step_id: number; // 1: 診断・検査, 2: 治療方針決定, 3: 手術・治療, 4: 術後ケア, 5: フォローアップ
  
  // アクティビティ基本情報
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

export interface UserActivityInsert {
  user_id: string;
  roadmap_step_id: number;
  type: ActivityType;
  content: string;
  description?: string;
  scheduled_date?: string;
  completed_date?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  is_ai_recommended?: boolean;
  source?: ActivitySource;
  tags?: string[];
}

export interface UserActivityUpdate {
  type?: ActivityType;
  content?: string;
  description?: string;
  scheduled_date?: string;
  completed_date?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  tags?: string[];
}

export interface ActivityTemplate {
  id: string;
  name: string;
  type: ActivityType;
  content: string;
  description?: string;
  roadmap_step_id: number;
  cancer_type: string[];
  stage: string[];
  age_group: string[];
  family_situation: string[];
  priority: number;
  is_ai_recommended: boolean;
  conditions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserActivityPreference {
  id: string;
  user_id: string;
  show_ai_recommendations: boolean;
  max_recommendations_per_step: number;
  preferred_activity_types: string[];
  excluded_tags: string[];
  priority_threshold: ActivityPriority;
  created_at: string;
  updated_at: string;
}

export interface UserActivityPreferenceInsert {
  user_id: string;
  show_ai_recommendations?: boolean;
  max_recommendations_per_step?: number;
  preferred_activity_types?: string[];
  excluded_tags?: string[];
  priority_threshold?: ActivityPriority;
}

export interface ActivityRecommendation {
  template: ActivityTemplate;
  relevance_score: number;
  reason: string;
  is_already_added: boolean;
}

export interface ActivityStepData {
  step_id: number;
  step_name: string;
  activities: UserActivity[];
  recommendations: ActivityRecommendation[];
}

export interface ActivityModalData {
  isOpen: boolean;
  mode: 'create' | 'edit';
  activity?: UserActivity;
  step_id?: number;
}

export interface ActivityStore {
  // 状態
  activities: UserActivity[];
  recommendations: ActivityRecommendation[];
  preferences: UserActivityPreference | null;
  modalData: ActivityModalData;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  fetchActivities: (userId: string) => Promise<void>;
  fetchRecommendations: (userId: string, stepId: number) => Promise<void>;
  fetchPreferences: (userId: string) => Promise<void>;
  addActivity: (activity: UserActivityInsert) => Promise<void>;
  updateActivity: (id: string, updates: UserActivityUpdate) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  addFromRecommendation: (templateId: string, userId: string, stepId: number) => Promise<void>;
  openModal: (mode: 'create' | 'edit', stepId?: number, activity?: UserActivity) => void;
  closeModal: () => void;
  setError: (error: string | null) => void;
} 