// 治療ロードマップ関連の型定義

// =============================================================================
// 1. 基本データ型
// =============================================================================

export interface UserResponses {
  step1?: { value: string; label: string }
  step2?: { value: string; label: string }
  step3?: { value: string; label: string }
  step4?: { value: string; label: string }[]
  step5?: { value: string; label: string }[]
}

export interface RoadmapSection {
  id: string
  title: string
  icon: string
  content: string[]
  priority: number
  estimated_duration_days?: number
}

export interface RoadmapAction {
  id: string
  title: string
  description?: string
  action_type: 'task' | 'appointment' | 'research' | 'consultation' | 'decision'
  priority: number
  due_date?: string
  estimated_hours?: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'postponed'
  related_url?: string
  notes?: string
}

// =============================================================================
// 2. データベース型定義
// =============================================================================

export interface UserTreatmentRoadmap {
  id: string
  user_id: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'completed' | 'paused'
  generated_at: string
  ai_generated: boolean
  generation_responses?: UserResponses
  created_at: string
  updated_at: string
}

export interface RoadmapSectionDB {
  id: string
  roadmap_id: string
  section_id: string
  title: string
  icon?: string
  priority: number
  content: string[]
  estimated_duration_days?: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface RoadmapActionDB {
  id: string
  section_id: string
  title: string
  description?: string
  action_type: 'task' | 'appointment' | 'research' | 'consultation' | 'decision'
  priority: number
  due_date?: string
  estimated_hours?: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'postponed'
  started_at?: string
  completed_at?: string
  related_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface UserEmotionalState {
  id: string
  user_id: string
  emotional_state: 'anxious' | 'hopeful' | 'overwhelmed' | 'calm' | 'uncertain' | 'confident'
  intensity: number
  trigger_event?: string
  current_section_id?: string
  recorded_at: string
}

export interface UserProgressLog {
  id: string
  user_id: string
  action_id?: string
  section_id?: string
  progress_type: 'started' | 'completed' | 'skipped' | 'postponed' | 'needs_help'
  notes?: string
  difficulty_level?: number
  recorded_at: string
}

export interface UserRoadmapPreferences {
  id: string
  user_id: string
  show_emotional_support: boolean
  show_estimated_times: boolean
  show_progress_percentage: boolean
  notify_section_completion: boolean
  notify_action_due: boolean
  notify_emotional_check: boolean
  preferred_pace: 'slow' | 'moderate' | 'fast'
  detail_level: 'basic' | 'standard' | 'detailed'
  created_at: string
  updated_at: string
}

// =============================================================================
// 3. API レスポンス型
// =============================================================================

export interface RoadmapGenerationResponse {
  success: boolean
  sections?: RoadmapSection[]
  generatedAt?: string
  aiGenerated?: boolean
  fallbackUsed?: boolean
  mode?: 'sync' | 'async'
  jobId?: string
  message?: string
  estimatedTime?: string
  isExisting?: boolean
  error?: string
}

export interface RoadmapStatusResponse {
  success: boolean
  status: 'processing' | 'completed'
  result?: RoadmapGenerationResponse
  message?: string
  error?: string
}

export interface RoadmapProgressResponse {
  roadmap_id: string
  total_sections: number
  completed_sections: number
  progress_percentage: number
  total_actions: number
  completed_actions: number
  action_progress_percentage: number
}

export interface EmotionalTrendResponse {
  dominant_emotion: string
  average_intensity: number
  trend_direction: 'improving' | 'stable'
  recent_emotions: Array<{
    emotion: string
    intensity: number
    date: string
  }>
}

// =============================================================================
// 4. UI 状態型
// =============================================================================

export interface RoadmapUIState {
  isLoading: boolean
  error: string | null
  currentSection: string | null
  emotionalState: UserEmotionalState | null
  progress: RoadmapProgressResponse | null
  preferences: UserRoadmapPreferences | null
}

export interface RoadmapContextType {
  roadmap: UserTreatmentRoadmap | null
  sections: RoadmapSectionDB[]
  actions: RoadmapActionDB[]
  progress: RoadmapProgressResponse | null
  emotionalTrend: EmotionalTrendResponse | null
  preferences: UserRoadmapPreferences | null
  isLoading: boolean
  error: string | null
  
  // アクション
  generateRoadmap: (responses: UserResponses) => Promise<void>
  updateSectionStatus: (sectionId: string, status: RoadmapSectionDB['status']) => Promise<void>
  updateActionStatus: (actionId: string, status: RoadmapActionDB['status']) => Promise<void>
  recordEmotionalState: (state: Omit<UserEmotionalState, 'id' | 'user_id' | 'recorded_at'>) => Promise<void>
  updatePreferences: (preferences: Partial<UserRoadmapPreferences>) => Promise<void>
  refreshProgress: () => Promise<void>
}

// =============================================================================
// 5. 設定・定数型
// =============================================================================

export interface RoadmapConfig {
  maxSections: number
  maxActionsPerSection: number
  defaultEstimatedDuration: number
  emotionalCheckInterval: number // 分
  progressUpdateInterval: number // 分
}

export interface EmotionalSupportMessage {
  emotion: 'anxious' | 'hopeful' | 'overwhelmed' | 'calm' | 'uncertain' | 'confident'
  intensity: number
  message: string
  action?: string
  icon: string
}

export interface ProgressMilestone {
  percentage: number
  message: string
  icon: string
  celebration?: boolean
}

// =============================================================================
// 6. ユーティリティ型
// =============================================================================

export type RoadmapStatus = UserTreatmentRoadmap['status']
export type SectionStatus = RoadmapSectionDB['status']
export type ActionStatus = RoadmapActionDB['status']
export type ActionType = RoadmapActionDB['action_type']
export type EmotionalState = UserEmotionalState['emotional_state']
export type ProgressType = UserProgressLog['progress_type']

// 部分更新用の型
export type PartialRoadmap = Partial<Omit<UserTreatmentRoadmap, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
export type PartialSection = Partial<Omit<RoadmapSectionDB, 'id' | 'roadmap_id' | 'created_at' | 'updated_at'>>
export type PartialAction = Partial<Omit<RoadmapActionDB, 'id' | 'section_id' | 'created_at' | 'updated_at'>>
export type PartialPreferences = Partial<Omit<UserRoadmapPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>> 