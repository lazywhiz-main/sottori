// ユーザー医療プロフィール管理サービス（個別化エンジン版）
import { supabase } from '../supabase'

export interface UserMedicalProfile {
  id?: string
  user_id: string
  cancer_type?: string
  stage?: string
  diagnosis_date?: string
  current_treatment_types?: string[]
  treatment_status?: 'planning' | 'ongoing' | 'completed' | 'paused'
  treatment_start_date?: string
  treatment_end_date?: string
  treatment_history?: any[]
  side_effects_experienced?: string[]
  primary_doctor?: string
  hospital?: string
  hospital_location?: string
  concern_areas?: string[]
  priority_concerns?: string[]
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface UserContextProfile {
  id?: string
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
  created_at?: string
  updated_at?: string
}

export interface UserPreferenceProfile {
  id?: string
  user_id: string
  information_depth?: 'basic' | 'detailed' | 'comprehensive'
  update_frequency?: 'immediate' | 'daily' | 'weekly'
  priority_areas?: string[]
  communication_style?: 'formal' | 'casual' | 'empathetic'
  content_formats?: string[]
  notification_frequency?: 'minimal' | 'standard' | 'comprehensive'
  notification_channels?: string[]
  notification_timing?: number[]
  created_at?: string
  updated_at?: string
}

export class UserMedicalProfileService {
  
  /**
   * 医療プロフィールを取得
   */
  async getMedicalProfile(userId: string): Promise<UserMedicalProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_medical_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('医療プロフィール取得エラー:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('医療プロフィール取得エラー:', error)
      return null
    }
  }

  /**
   * 医療プロフィールを保存・更新
   */
  async saveMedicalProfile(profile: UserMedicalProfile): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_medical_profiles')
        .upsert(profile)

      if (error) {
        console.error('医療プロフィール保存エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('医療プロフィール保存エラー:', error)
      return false
    }
  }

  /**
   * コンテキストプロフィールを取得
   */
  async getContextProfile(userId: string): Promise<UserContextProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_context_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('コンテキストプロフィール取得エラー:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('コンテキストプロフィール取得エラー:', error)
      return null
    }
  }

  /**
   * コンテキストプロフィールを保存・更新
   */
  async saveContextProfile(profile: UserContextProfile): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_context_profiles')
        .upsert(profile)

      if (error) {
        console.error('コンテキストプロフィール保存エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('コンテキストプロフィール保存エラー:', error)
      return false
    }
  }

  /**
   * 設定プロフィールを取得
   */
  async getPreferenceProfile(userId: string): Promise<UserPreferenceProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_preference_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('設定プロフィール取得エラー:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('設定プロフィール取得エラー:', error)
      return null
    }
  }

  /**
   * 設定プロフィールを保存・更新
   */
  async savePreferenceProfile(profile: UserPreferenceProfile): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_preference_profiles')
        .upsert(profile)

      if (error) {
        console.error('設定プロフィール保存エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('設定プロフィール保存エラー:', error)
      return false
    }
  }

  /**
   * 全プロフィールを取得
   */
  async getAllProfiles(userId: string): Promise<{
    medical: UserMedicalProfile | null
    context: UserContextProfile | null
    preferences: UserPreferenceProfile | null
  }> {
    const [medical, context, preferences] = await Promise.all([
      this.getMedicalProfile(userId),
      this.getContextProfile(userId),
      this.getPreferenceProfile(userId)
    ])

    return { medical, context, preferences }
  }

  /**
   * cancer_profilesからuser_medical_profilesへの移行
   */
  async migrateCancerProfile(userId: string): Promise<boolean> {
    try {
      // 既存のcancer_profilesデータを取得
      const { data: cancerProfile, error } = await supabase
        .from('cancer_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.log('移行対象のcancer_profilesが見つかりません:', error)
        return true // エラーではなく、移行不要として扱う
      }

      // user_medical_profilesに変換して保存
      const medicalProfile: UserMedicalProfile = {
        user_id: userId,
        cancer_type: cancerProfile.cancer_type,
        stage: cancerProfile.stage,
        diagnosis_date: cancerProfile.diagnosis_date,
        current_treatment_types: cancerProfile.current_treatment || [],
        treatment_status: cancerProfile.treatment_status || 'planning',
        treatment_start_date: cancerProfile.treatment_start_date,
        primary_doctor: cancerProfile.primary_doctor,
        hospital: cancerProfile.hospital,
        concern_areas: cancerProfile.concern_areas || [],
        priority_concerns: cancerProfile.priority_concerns || [],
        notes: cancerProfile.notes
      }

      const success = await this.saveMedicalProfile(medicalProfile)
      
      if (success) {
        console.log('cancer_profilesからuser_medical_profilesへの移行完了')
        
        // デフォルトのコンテキスト・設定プロフィールを作成
        await this.saveContextProfile({ user_id: userId })
        await this.savePreferenceProfile({ 
          user_id: userId,
          priority_areas: cancerProfile.concern_areas || []
        })
        
        return true
      }

      return false
    } catch (error) {
      console.error('プロフィール移行エラー:', error)
      return false
    }
  }
} 