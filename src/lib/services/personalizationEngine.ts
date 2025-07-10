// 個別化エンジン - 関連度計算システム
// Phase 1: 基盤構築 - 基本的な関連度計算とユーザーセグメント分類

import { createClient } from '@supabase/supabase-js'

// サービスロールキーを使用したSupabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
import type {
  InfoCategory,
  UserSegment,
  RelevanceCalculation,
  PersonalizationInput,
  ContextualInput,
  PersonalizedOutput,
  InfoUpdate,
  UnifiedUserProfile,
  InfoRelevanceScore,
  PersonalizationSettings,
  UserMedicalProfile,
  UserContextProfile,
  UserPreferenceProfile,
  UserBehaviorPattern,
  UserTreatmentPhase,
  UserSegmentRecord,
  UserCategoryEngagement,
  UserCurrentConcern
} from '@/lib/types/personalization'

// =============================================================================
// 1. 設定とデフォルト値
// =============================================================================

const DEFAULT_PERSONALIZATION_SETTINGS: PersonalizationSettings = {
  enabled: true,
  algorithms: {
    relevance_calculation: 'v1',
    segment_classification: 'rule_based',
    content_adaptation: 'basic'
  },
  weights: {
    medical_match: 40,        // 基本マッチング 40%
    contextual_relevance: 30, // 状況的関連性 30%
    personal_interest: 20,    // 個人的関心 20%
    priority: 10             // 緊急度・重要度 10%
  },
  thresholds: {
    min_relevance_score: 30,  // 最低関連度スコア
    segment_confidence: 70    // セグメント分類の信頼度
  }
}

// =============================================================================
// 2. ユーザープロフィール統合取得
// =============================================================================

export async function getUnifiedUserProfile(userId: string): Promise<UnifiedUserProfile | null> {
  try {
    // 並列でプロフィールデータを取得
    const [
      { data: medical },
      { data: context }, 
      { data: preferences },
      { data: behavior },
      { data: treatmentPhase },
      { data: segment },
      { data: categoryEngagement },
      { data: currentConcerns }
    ] = await Promise.all([
      supabase.from('user_medical_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('user_context_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('user_preference_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('user_behavior_patterns').select('*').eq('user_id', userId).single(),
      supabase.from('user_treatment_phases').select('*').eq('user_id', userId).single(),
      supabase.from('user_segments').select('*').eq('user_id', userId).single(),
      supabase.from('user_category_engagement').select('*').eq('user_id', userId),
      supabase.from('user_current_concerns').select('*').eq('user_id', userId).eq('is_active', true)
    ])

    return {
      user_id: userId,
      medical: medical as UserMedicalProfile | null,
      context: context as UserContextProfile | null,
      preferences: preferences as UserPreferenceProfile | null,
      behavior: behavior as UserBehaviorPattern | null,
      treatment_phase: treatmentPhase as UserTreatmentPhase | null,
      segment: segment as UserSegmentRecord | null,
      category_engagement: (categoryEngagement as UserCategoryEngagement[]) || [],
      current_concerns: (currentConcerns as UserCurrentConcern[]) || []
    }
  } catch (error) {
    console.error('Failed to get unified user profile:', error)
    return null
  }
}

// =============================================================================
// 3. ユーザーセグメント分類
// =============================================================================

export async function classifyUserSegment(userProfile: UnifiedUserProfile): Promise<UserSegment> {
  const { medical, treatment_phase } = userProfile
  
  if (!medical) {
    return 'newly_diagnosed' // デフォルト
  }

  const diagnosisDate = medical.diagnosis_date ? new Date(medical.diagnosis_date) : null
  const now = new Date()
  const daysSinceDiagnosis = diagnosisDate ? 
    Math.floor((now.getTime() - diagnosisDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

  // ルールベース分類
  // 1. 診断から90日以内 → 新規診断
  if (daysSinceDiagnosis <= 90) {
    return 'newly_diagnosed'
  }

  // 2. 治療状況による分類
  const treatmentStatus = medical.treatment_status
  const currentPhase = treatment_phase?.current_phase

  // 3. 治療中
  if (treatmentStatus === 'ongoing' || currentPhase === 'active_treatment') {
    return 'active_treatment'
  }

  // 4. 治療完了後
  if (treatmentStatus === 'completed' || currentPhase === 'post_treatment') {
    // 5年以上経過していれば長期サバイバー
    if (daysSinceDiagnosis >= 1825) { // 5年 ≈ 1825日
      return 'long_term_survivor'
    }
    return 'post_treatment'
  }

  // 5. 経過観察
  if (currentPhase === 'surveillance') {
    return daysSinceDiagnosis >= 1825 ? 'long_term_survivor' : 'post_treatment'
  }

  // 6. 治療前
  if (treatmentStatus === 'planning' || currentPhase === 'pre_treatment') {
    return 'newly_diagnosed'
  }

  // デフォルト
  return 'newly_diagnosed'
}

// =============================================================================
// 4. 関連度計算エンジン
// =============================================================================

export function calculateRelevanceScore(
  infoUpdate: InfoUpdate,
  userProfile: UnifiedUserProfile,
  settings: PersonalizationSettings = DEFAULT_PERSONALIZATION_SETTINGS
): RelevanceCalculation {
  const calculation: RelevanceCalculation = {
    medicalMatch: calculateMedicalMatch(infoUpdate, userProfile),
    contextualRelevance: calculateContextualRelevance(infoUpdate, userProfile),
    personalInterest: calculatePersonalInterest(infoUpdate, userProfile),
    priority: calculatePriority(infoUpdate, userProfile)
  }

  return calculation
}

// 基本マッチング計算 (40%)
function calculateMedicalMatch(infoUpdate: InfoUpdate, userProfile: UnifiedUserProfile): {
  cancerTypeMatch: number
  stageRelevance: number  
  treatmentRelevance: number
} {
  const { medical } = userProfile
  
  if (!medical) {
    return { cancerTypeMatch: 50, stageRelevance: 50, treatmentRelevance: 50 }
  }

  // がん種マッチング
  let cancerTypeMatch = 50 // デフォルト
  if (medical.cancer_type && infoUpdate.metadata?.target_cancer_types) {
    const targetTypes = infoUpdate.metadata.target_cancer_types as string[]
    cancerTypeMatch = targetTypes.includes(medical.cancer_type) ? 100 : 20
  }

  // 病期関連性
  let stageRelevance = 50 // デフォルト
  if (medical.stage && infoUpdate.metadata?.target_stages) {
    const targetStages = infoUpdate.metadata.target_stages as string[]
    stageRelevance = targetStages.includes(medical.stage) ? 100 : 30
  }

  // 治療法関連性
  let treatmentRelevance = 50 // デフォルト
  if (medical.current_treatment_types?.length && infoUpdate.metadata?.related_treatments) {
    const relatedTreatments = infoUpdate.metadata.related_treatments as string[]
    const hasOverlap = medical.current_treatment_types.some(treatment => 
      relatedTreatments.includes(treatment)
    )
    treatmentRelevance = hasOverlap ? 100 : 25
  }

  return { cancerTypeMatch, stageRelevance, treatmentRelevance }
}

// 状況的関連性計算 (30%)
function calculateContextualRelevance(infoUpdate: InfoUpdate, userProfile: UnifiedUserProfile): {
  treatmentPhaseMatch: number
  geographicRelevance: number
  timelinessScore: number
} {
  const { treatment_phase, context } = userProfile

  // 治療段階マッチング
  let treatmentPhaseMatch = 50 // デフォルト
  if (treatment_phase?.current_phase && infoUpdate.metadata?.target_phases) {
    const targetPhases = infoUpdate.metadata.target_phases as string[]
    treatmentPhaseMatch = targetPhases.includes(treatment_phase.current_phase) ? 100 : 20
  }

  // 地理的関連性
  let geographicRelevance = 50 // デフォルト
  if (context?.prefecture && infoUpdate.metadata?.target_regions) {
    const targetRegions = infoUpdate.metadata.target_regions as string[]
    geographicRelevance = targetRegions.includes(context.prefecture) ? 100 : 30
  }

  // タイミング適切性
  let timelinessScore = 70 // デフォルト：やや良い
  const createdAt = new Date(infoUpdate.created_at)
  const now = new Date()
  const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
  
  if (hoursSinceCreated <= 24) {
    timelinessScore = 100 // 24時間以内は最高
  } else if (hoursSinceCreated <= 168) { // 1週間以内
    timelinessScore = 80
  } else if (hoursSinceCreated <= 720) { // 1ヶ月以内
    timelinessScore = 60
  } else {
    timelinessScore = 30 // 古い情報
  }

  return { treatmentPhaseMatch, geographicRelevance, timelinessScore }
}

// 個人的関心計算 (20%)
function calculatePersonalInterest(infoUpdate: InfoUpdate, userProfile: UnifiedUserProfile): {
  categoryPreference: number
  pastEngagement: number
  searchHistory: number
} {
  const { preferences, category_engagement } = userProfile

  // カテゴリ嗜好
  let categoryPreference = 50 // デフォルト
  if (preferences?.priority_areas?.includes(infoUpdate.category)) {
    categoryPreference = 100
  } else if (preferences?.priority_areas?.length) {
    categoryPreference = 20 // 優先外カテゴリ
  }

  // 過去のエンゲージメント
  let pastEngagement = 50 // デフォルト
  const categoryData = category_engagement.find(c => c.category === infoUpdate.category)
  if (categoryData) {
    pastEngagement = Math.min(100, categoryData.engagement_score + 10)
  }

  // 検索履歴（将来実装）
  const searchHistory = 50 // デフォルト

  return { categoryPreference, pastEngagement, searchHistory }
}

// 緊急度・重要度計算 (10%)
function calculatePriority(infoUpdate: InfoUpdate, userProfile: UnifiedUserProfile): {
  medicalUrgency: number
  userConcernMatch: number  
  timeSpecificity: number
} {
  const { current_concerns } = userProfile

  // 医学的緊急度
  const medicalUrgency = infoUpdate.priority === 'high' ? 100 : 
                        infoUpdate.priority === 'medium' ? 60 : 30

  // ユーザー関心事との一致
  let userConcernMatch = 50 // デフォルト
  const hasMatchingConcern = current_concerns.some(concern => 
    concern.category === infoUpdate.category || 
    infoUpdate.title.toLowerCase().includes(concern.concern_text.toLowerCase())
  )
  if (hasMatchingConcern) {
    userConcernMatch = 100
  }

  // 時期特有性
  let timeSpecificity = 50 // デフォルト
  if (infoUpdate.metadata?.time_sensitive === true) {
    timeSpecificity = 100
  } else if (infoUpdate.expires_at) {
    const expiresAt = new Date(infoUpdate.expires_at)
    const now = new Date()
    const hoursToExpire = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursToExpire <= 24) {
      timeSpecificity = 100 // 24時間以内に期限
    } else if (hoursToExpire <= 168) { // 1週間以内
      timeSpecificity = 80
    }
  }

  return { medicalUrgency, userConcernMatch, timeSpecificity }
}

// =============================================================================
// 5. 最終スコア計算
// =============================================================================

export function calculateFinalScore(
  calculation: RelevanceCalculation,
  settings: PersonalizationSettings = DEFAULT_PERSONALIZATION_SETTINGS
): number {
  const weights = settings.weights

  // 各要素の平均スコア計算
  const medicalMatchAvg = (
    calculation.medicalMatch.cancerTypeMatch +
    calculation.medicalMatch.stageRelevance +
    calculation.medicalMatch.treatmentRelevance
  ) / 3

  const contextualRelevanceAvg = (
    calculation.contextualRelevance.treatmentPhaseMatch +
    calculation.contextualRelevance.geographicRelevance +
    calculation.contextualRelevance.timelinessScore
  ) / 3

  const personalInterestAvg = (
    calculation.personalInterest.categoryPreference +
    calculation.personalInterest.pastEngagement +
    calculation.personalInterest.searchHistory
  ) / 3

  const priorityAvg = (
    calculation.priority.medicalUrgency +
    calculation.priority.userConcernMatch +
    calculation.priority.timeSpecificity
  ) / 3

  // 重み付き平均計算
  const finalScore = Math.round(
    (medicalMatchAvg * weights.medical_match +
     contextualRelevanceAvg * weights.contextual_relevance +
     personalInterestAvg * weights.personal_interest +
     priorityAvg * weights.priority) / 100
  )

  return Math.max(0, Math.min(100, finalScore))
}

// =============================================================================
// 6. 情報更新の関連度スコア保存
// =============================================================================

export async function saveRelevanceScore(
  userId: string,
  infoUpdateId: string,
  calculation: RelevanceCalculation,
  finalScore: number
): Promise<boolean> {
  try {
    const calculationDetails = {
      medical_match: calculation.medicalMatch,
      contextual_relevance: calculation.contextualRelevance,
      personal_interest: calculation.personalInterest,
      priority: calculation.priority,
      timestamp: new Date().toISOString()
    }

    // RLSを回避するため、サービスロールキーを使用
    // 認証コンテキストを明示的に設定
    const { error } = await supabase
      .from('structured_content_relevance_scores')
      .upsert({
        user_id: userId,
        structured_content_id: infoUpdateId,
        medical_match_score: Math.round(
          (calculation.medicalMatch.cancerTypeMatch + 
           calculation.medicalMatch.stageRelevance + 
           calculation.medicalMatch.treatmentRelevance) / 3
        ),
        situational_relevance_score: Math.round(
          (calculation.contextualRelevance.treatmentPhaseMatch +
           calculation.contextualRelevance.geographicRelevance +
           calculation.contextualRelevance.timelinessScore) / 3
        ),
        personal_interest_score: Math.round(
          (calculation.personalInterest.categoryPreference +
           calculation.personalInterest.pastEngagement +
           calculation.personalInterest.searchHistory) / 3
        ),
        urgency_importance_score: Math.round(
          (calculation.priority.medicalUrgency +
           calculation.priority.userConcernMatch +
           calculation.priority.timeSpecificity) / 3
        ),
        final_relevance_score: finalScore,
        relevance_explanation: generateRelevanceExplanation(calculation, finalScore),
        calculation_details: calculationDetails
      }, {
        onConflict: 'user_id,structured_content_id'
      })

    if (error) {
      console.error('❌ スコア保存エラー:', error)
      console.error('  - userId:', userId)
      console.error('  - infoUpdateId:', infoUpdateId)
      console.error('  - エラー詳細:', error.message)
    } else {
      console.log('✅ スコア保存成功:', infoUpdateId)
    }

    return !error
  } catch (error) {
    console.error('Failed to save relevance score:', error)
    return false
  }
}

// 関連度説明文を生成
function generateRelevanceExplanation(calculation: RelevanceCalculation, finalScore: number): string {
  const explanations: string[] = []
  
  if (calculation.medicalMatch.cancerTypeMatch > 70) {
    explanations.push('あなたのがん種に関連する情報です')
  }
  
  if (calculation.contextualRelevance.treatmentPhaseMatch > 70) {
    explanations.push('現在の治療段階に適した内容です')
  }
  
  if (calculation.personalInterest.categoryPreference > 70) {
    explanations.push('あなたの関心領域に合致します')
  }
  
  if (calculation.priority.medicalUrgency > 70) {
    explanations.push('医療的に重要な情報です')
  }
  
  if (explanations.length === 0) {
    return '一般的に有用な医療情報です'
  }
  
  return explanations.join('。') + '。'
}

// =============================================================================
// 7. ユーザーセグメント更新
// =============================================================================

export async function updateUserSegment(
  userId: string,
  segment: UserSegment,
  confidence: number,
  characteristics: Record<string, any> = {}
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_segments')
      .upsert({
        user_id: userId,
        segment_type: segment,
        confidence_score: confidence,
        segment_characteristics: characteristics
      }, {
        onConflict: 'user_id'
      })

    return !error
  } catch (error) {
    console.error('Failed to update user segment:', error)
    return false
  }
}

// =============================================================================
// 8. メイン処理：個別化エンジン実行
// =============================================================================

export async function runPersonalizationEngine(userId: string): Promise<{
  success: boolean
  segment?: UserSegment
  processed_items?: number
  error?: string
}> {
  try {
    // 1. ユーザープロフィール取得
    const userProfile = await getUnifiedUserProfile(userId)
    if (!userProfile) {
      return { success: false, error: 'User profile not found' }
    }

    // 2. ユーザーセグメント分類
    const segment = await classifyUserSegment(userProfile)
    const segmentUpdated = await updateUserSegment(userId, segment, 85, {
      classification_method: 'rule_based',
      processed_at: new Date().toISOString()
    })

    // 3. structured_content_poolから未処理のコンテンツを取得
    // まず既に処理済みのIDを取得
    const { data: processedIds } = await supabase
      .from('structured_content_relevance_scores')
      .select('structured_content_id')
      .eq('user_id', userId)

    const processedIdSet = new Set(processedIds?.map(p => p.structured_content_id) || [])
    
    // 全コンテンツを取得してから未処理のものをフィルタ
    const { data: allStructuredContents, error: fetchError } = await supabase
      .from('structured_content_pool')
      .select('*')
      .limit(100) // 一度に処理する件数を制限

    if (fetchError) {
      throw fetchError
    }

    if (!allStructuredContents || allStructuredContents.length === 0) {
      return { success: true, segment, processed_items: 0 }
    }

    // デバッグログ追加
    console.log('🔍 個別化エンジンデバッグ:')
    console.log('  - 全コンテンツ数:', allStructuredContents.length)
    console.log('  - 全コンテンツID:', allStructuredContents.map(c => c.id))
    console.log('  - 既に処理済みID数:', processedIdSet.size)
    console.log('  - 既に処理済みID:', Array.from(processedIdSet))

    // 未処理のコンテンツのみをフィルタ
    const structuredContents = allStructuredContents.filter(content => !processedIdSet.has(content.id))
    
    console.log('  - 未処理コンテンツ数:', structuredContents.length)
    console.log('  - 未処理コンテンツID:', structuredContents.map(c => c.id))

    // 4. 各コンテンツの関連度を計算・保存
    let processedCount = 0
    for (const content of structuredContents) {
      // InfoUpdate形式に変換
      const infoUpdate: InfoUpdate = {
        id: content.id,
        user_id: userId, // 必須プロパティ
        title: content.title,
        summary: content.summary || '',
        content: content.content,
        category: content.category as InfoCategory,
        source_url: content.source_url,
        relevance_score: content.relevance_score || 0,
        priority: 'medium', // デフォルト値
        is_read: false,
        is_saved: false,
        created_at: content.created_at,
        metadata: content.metadata || {}
      }

      const calculation = calculateRelevanceScore(infoUpdate, userProfile)
      const finalScore = calculateFinalScore(calculation)
      
      const saved = await saveRelevanceScore(userId, content.id, calculation, finalScore)
      console.log(`  - スコア保存結果 [${content.id}]:`, saved ? '成功' : '失敗')
      if (saved) {
        processedCount++
        
        // 個別化実行時にuser_content_consumption_historyにsavedタイプで保存
        // 既にsavedタイプで保存されているかチェック
        const { data: existingSaved } = await supabase
          .from('user_content_consumption_history')
          .select('id')
          .eq('user_id', userId)
          .eq('structured_content_id', content.id)
          .eq('action_type', 'saved')
          .single()
        
        // まだ保存されていない場合のみinsert
        if (!existingSaved) {
          await supabase
            .from('user_content_consumption_history')
            .insert({
              user_id: userId,
              structured_content_id: content.id,
              action_type: 'saved',
              created_at: new Date().toISOString()
            })
        }
      }
    }

    return {
      success: true,
      segment,
      processed_items: processedCount
    }

  } catch (error) {
    console.error('Personalization engine failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// =============================================================================
// 9. 初期化・ヘルパー関数
// =============================================================================

export async function initializePersonalizationForUser(userId: string): Promise<boolean> {
  try {
    // データベースの初期化関数を呼び出し
    const { error } = await supabase.rpc('create_personalization_profiles_for_user', {
      p_user_id: userId
    })

    return !error
  } catch (error) {
    console.error('Failed to initialize personalization:', error)
    return false
  }
} 