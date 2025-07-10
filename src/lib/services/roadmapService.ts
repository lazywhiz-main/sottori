import { supabase } from '@/lib/supabase'
import {
  UserTreatmentRoadmap,
  RoadmapSectionDB,
  RoadmapActionDB,
  UserEmotionalState,
  UserProgressLog,
  UserRoadmapPreferences,
  RoadmapProgressResponse,
  EmotionalTrendResponse,
  UserResponses,
  PartialRoadmap,
  PartialSection,
  PartialAction,
  PartialPreferences
} from '@/lib/types/roadmap'

// =============================================================================
// 1. ロードマップ基本操作
// =============================================================================

export class RoadmapService {
  private supabase = supabase

  // ユーザーのロードマップを取得
  async getUserRoadmap(userId: string): Promise<UserTreatmentRoadmap | null> {
    const { data, error } = await this.supabase
      .from('user_treatment_roadmaps')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Failed to get user roadmap:', error)
      return null
    }

    return data
  }

  // ロードマップを作成
  async createRoadmap(userId: string, roadmapData: PartialRoadmap): Promise<UserTreatmentRoadmap | null> {
    const { data, error } = await this.supabase
      .from('user_treatment_roadmaps')
      .insert({
        user_id: userId,
        ...roadmapData
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create roadmap:', error)
      return null
    }

    return data
  }

  // ロードマップを更新
  async updateRoadmap(roadmapId: string, updates: PartialRoadmap): Promise<UserTreatmentRoadmap | null> {
    const { data, error } = await this.supabase
      .from('user_treatment_roadmaps')
      .update(updates)
      .eq('id', roadmapId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update roadmap:', error)
      return null
    }

    return data
  }

  // =============================================================================
  // 2. セクション操作
  // =============================================================================

  // ロードマップのセクションを取得
  async getRoadmapSections(roadmapId: string): Promise<RoadmapSectionDB[]> {
    const { data, error } = await this.supabase
      .from('roadmap_sections')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Failed to get roadmap sections:', error)
      return []
    }

    return data || []
  }

  // セクションを作成
  async createSection(roadmapId: string, sectionData: PartialSection): Promise<RoadmapSectionDB | null> {
    const { data, error } = await this.supabase
      .from('roadmap_sections')
      .insert({
        roadmap_id: roadmapId,
        ...sectionData
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create section:', error)
      return null
    }

    return data
  }

  // セクションを更新
  async updateSection(sectionId: string, updates: PartialSection): Promise<RoadmapSectionDB | null> {
    const { data, error } = await this.supabase
      .from('roadmap_sections')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update section:', error)
      return null
    }

    return data
  }

  // セクションの状態を更新
  async updateSectionStatus(sectionId: string, status: RoadmapSectionDB['status']): Promise<boolean> {
    const updates: PartialSection = { status }
    
    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const result = await this.updateSection(sectionId, updates)
    return result !== null
  }

  // =============================================================================
  // 3. アクション操作
  // =============================================================================

  // セクションのアクションを取得
  async getSectionActions(sectionId: string): Promise<RoadmapActionDB[]> {
    const { data, error } = await this.supabase
      .from('roadmap_actions')
      .select('*')
      .eq('section_id', sectionId)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Failed to get section actions:', error)
      return []
    }

    return data || []
  }

  // アクションを作成
  async createAction(sectionId: string, actionData: PartialAction): Promise<RoadmapActionDB | null> {
    const { data, error } = await this.supabase
      .from('roadmap_actions')
      .insert({
        section_id: sectionId,
        ...actionData
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create action:', error)
      return null
    }

    return data
  }

  // アクションを更新
  async updateAction(actionId: string, updates: PartialAction): Promise<RoadmapActionDB | null> {
    const { data, error } = await this.supabase
      .from('roadmap_actions')
      .update(updates)
      .eq('id', actionId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update action:', error)
      return null
    }

    return data
  }

  // アクションの状態を更新
  async updateActionStatus(actionId: string, status: RoadmapActionDB['status']): Promise<boolean> {
    const updates: PartialAction = { status }
    
    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const result = await this.updateAction(actionId, updates)
    return result !== null
  }

  // =============================================================================
  // 4. 感情状態と進捗追跡
  // =============================================================================

  // 感情状態を記録
  async recordEmotionalState(userId: string, emotionalData: Omit<UserEmotionalState, 'id' | 'user_id' | 'recorded_at'>): Promise<UserEmotionalState | null> {
    const { data, error } = await this.supabase
      .from('user_emotional_states')
      .insert({
        user_id: userId,
        ...emotionalData
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to record emotional state:', error)
      return null
    }

    return data
  }

  // 進捗を記録
  async recordProgress(userId: string, progressData: Omit<UserProgressLog, 'id' | 'user_id' | 'recorded_at'>): Promise<UserProgressLog | null> {
    const { data, error } = await this.supabase
      .from('user_progress_logs')
      .insert({
        user_id: userId,
        ...progressData
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to record progress:', error)
      return null
    }

    return data
  }

  // 感情状態の傾向を分析
  async analyzeEmotionalTrend(userId: string, days: number = 30): Promise<EmotionalTrendResponse | null> {
    const { data, error } = await this.supabase
      .rpc('analyze_emotional_trend', {
        p_user_id: userId,
        p_days: days
      })

    if (error) {
      console.error('Failed to analyze emotional trend:', error)
      return null
    }

    return data?.[0] || null
  }

  // =============================================================================
  // 5. 進捗計算
  // =============================================================================

  // ロードマップの進捗を計算
  async calculateRoadmapProgress(userId: string): Promise<RoadmapProgressResponse | null> {
    const { data, error } = await this.supabase
      .rpc('calculate_roadmap_progress', {
        p_user_id: userId
      })

    if (error) {
      console.error('Failed to calculate roadmap progress:', error)
      return null
    }

    return data?.[0] || null
  }

  // =============================================================================
  // 6. 設定管理
  // =============================================================================

  // ユーザーの設定を取得
  async getUserPreferences(userId: string): Promise<UserRoadmapPreferences | null> {
    const { data, error } = await this.supabase
      .from('user_roadmap_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Failed to get user preferences:', error)
      return null
    }

    return data
  }

  // 設定を作成または更新
  async upsertUserPreferences(userId: string, preferences: PartialPreferences): Promise<UserRoadmapPreferences | null> {
    const { data, error } = await this.supabase
      .from('user_roadmap_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to upsert user preferences:', error)
      return null
    }

    return data
  }

  // =============================================================================
  // 7. バッチ操作
  // =============================================================================

  // AI生成結果からロードマップを作成
  async createRoadmapFromAIResponse(
    userId: string, 
    responses: UserResponses, 
    sections: any[], 
    aiGenerated: boolean = true
  ): Promise<UserTreatmentRoadmap | null> {
    // トランザクション開始
    const { data: roadmap, error: roadmapError } = await this.supabase
      .from('user_treatment_roadmaps')
      .insert({
        user_id: userId,
        title: '私の治療ロードマップ',
        status: 'active',
        ai_generated: aiGenerated,
        generation_responses: responses
      })
      .select()
      .single()

    if (roadmapError) {
      console.error('Failed to create roadmap:', roadmapError)
      return null
    }

    // セクションを作成
    for (const section of sections) {
      const { error: sectionError } = await this.supabase
        .from('roadmap_sections')
        .insert({
          roadmap_id: roadmap.id,
          section_id: section.id,
          title: section.title,
          icon: section.icon,
          priority: section.priority,
          content: section.content,
          estimated_duration_days: section.estimated_duration_days
        })

      if (sectionError) {
        console.error('Failed to create section:', sectionError)
      }
    }

    return roadmap
  }

  // ユーザーの全ロードマップデータを取得
  async getUserRoadmapData(userId: string): Promise<{
    roadmap: UserTreatmentRoadmap | null
    sections: RoadmapSectionDB[]
    actions: RoadmapActionDB[]
    progress: RoadmapProgressResponse | null
    emotionalTrend: EmotionalTrendResponse | null
    preferences: UserRoadmapPreferences | null
  }> {
    const [
      roadmap,
      progress,
      emotionalTrend,
      preferences
    ] = await Promise.all([
      this.getUserRoadmap(userId),
      this.calculateRoadmapProgress(userId),
      this.analyzeEmotionalTrend(userId),
      this.getUserPreferences(userId)
    ])

    let sections: RoadmapSectionDB[] = []
    let actions: RoadmapActionDB[] = []

    if (roadmap) {
      sections = await this.getRoadmapSections(roadmap.id)
      
      // 各セクションのアクションを取得
      const actionPromises = sections.map(section => this.getSectionActions(section.id))
      const sectionActions = await Promise.all(actionPromises)
      actions = sectionActions.flat()
    }

    return {
      roadmap,
      sections,
      actions,
      progress,
      emotionalTrend,
      preferences
    }
  }
}

// シングルトンインスタンス
export const roadmapService = new RoadmapService() 