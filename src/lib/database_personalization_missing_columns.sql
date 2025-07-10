-- 既存個別化データベースの不足カラム・改善追加SQL
-- 既にuser_medical_profiles等の個別化テーブルが存在することを前提
-- このファイルをSupabaseのSQL Editorで実行してください

-- =============================================================================
-- 1. user_medical_profilesテーブルの拡張
-- =============================================================================

-- 次回予約情報の追加（cancer_profilesから移行漏れの可能性）
ALTER TABLE user_medical_profiles 
ADD COLUMN IF NOT EXISTS next_appointment_date date;

ALTER TABLE user_medical_profiles 
ADD COLUMN IF NOT EXISTS next_appointment_hospital text;

-- 治療の緊急度・優先度管理
ALTER TABLE user_medical_profiles 
ADD COLUMN IF NOT EXISTS treatment_urgency text CHECK (treatment_urgency IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium';

-- 年齢情報（より詳細な個別化のため）
ALTER TABLE user_medical_profiles 
ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 0 AND age <= 120);

-- がんの病期分類（より詳細）
ALTER TABLE user_medical_profiles 
ADD COLUMN IF NOT EXISTS tnm_staging text; -- TNM分類

-- 治療機関の種別
ALTER TABLE user_medical_profiles 
ADD COLUMN IF NOT EXISTS hospital_type text CHECK (hospital_type IN ('university_hospital', 'general_hospital', 'cancer_center', 'clinic'));

-- =============================================================================
-- 2. user_context_profilesテーブルの拡張
-- =============================================================================

-- 経済状況（治療費関連の情報個別化のため）
ALTER TABLE user_context_profiles 
ADD COLUMN IF NOT EXISTS economic_status text CHECK (economic_status IN ('low', 'middle', 'high')) DEFAULT 'middle';

-- 保険の種類
ALTER TABLE user_context_profiles 
ADD COLUMN IF NOT EXISTS insurance_type text[] DEFAULT '{}'; -- 国保、社保、共済、その他

-- 交通手段（アクセシビリティ向上）
ALTER TABLE user_context_profiles 
ADD COLUMN IF NOT EXISTS transportation_methods text[] DEFAULT '{}'; -- 車、電車、バス、徒歩、その他

-- 介護者の有無
ALTER TABLE user_context_profiles 
ADD COLUMN IF NOT EXISTS has_caregiver boolean DEFAULT false;

-- インターネット使用頻度
ALTER TABLE user_context_profiles 
ADD COLUMN IF NOT EXISTS internet_usage_frequency text CHECK (internet_usage_frequency IN ('daily', 'weekly', 'monthly', 'rarely')) DEFAULT 'daily';

-- =============================================================================
-- 3. user_preference_profilesテーブルの拡張
-- =============================================================================

-- 情報の詳細度設定をより柔軟に
ALTER TABLE user_preference_profiles 
DROP CONSTRAINT IF EXISTS user_preference_profiles_information_depth_check;

ALTER TABLE user_preference_profiles 
ADD CONSTRAINT user_preference_profiles_information_depth_check 
CHECK (information_depth IN ('basic', 'standard', 'detailed', 'comprehensive'));

-- 医療専門用語の使用レベル
ALTER TABLE user_preference_profiles 
ADD COLUMN IF NOT EXISTS medical_terminology_level text CHECK (medical_terminology_level IN ('simple', 'mixed', 'professional')) DEFAULT 'mixed';

-- 個人情報の共有レベル
ALTER TABLE user_preference_profiles 
ADD COLUMN IF NOT EXISTS privacy_sharing_level text CHECK (privacy_sharing_level IN ('private', 'limited', 'open')) DEFAULT 'limited';

-- ストレス感度（情報提供の配慮）
ALTER TABLE user_preference_profiles 
ADD COLUMN IF NOT EXISTS stress_sensitivity text CHECK (stress_sensitivity IN ('low', 'medium', 'high')) DEFAULT 'medium';

-- =============================================================================
-- 4. user_behavior_patternsテーブルの拡張
-- =============================================================================

-- 情報検索パターン
ALTER TABLE user_behavior_patterns 
ADD COLUMN IF NOT EXISTS search_patterns jsonb DEFAULT '{}'::jsonb; -- よく検索するキーワード、パターン等

-- アプリ使用時間帯の詳細
ALTER TABLE user_behavior_patterns 
ADD COLUMN IF NOT EXISTS peak_usage_day text CHECK (peak_usage_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'));

-- 情報消費の深度
ALTER TABLE user_behavior_patterns 
ADD COLUMN IF NOT EXISTS average_reading_depth decimal(3,2) DEFAULT 0.5 CHECK (average_reading_depth >= 0 AND average_reading_depth <= 1);

-- エンゲージメントトレンド
ALTER TABLE user_behavior_patterns 
ADD COLUMN IF NOT EXISTS engagement_trend text CHECK (engagement_trend IN ('increasing', 'stable', 'decreasing')) DEFAULT 'stable';

-- =============================================================================
-- 5. user_treatment_phasesテーブルの拡張
-- =============================================================================

-- 治療段階の詳細状況
ALTER TABLE user_treatment_phases 
ADD COLUMN IF NOT EXISTS phase_details jsonb DEFAULT '{}'::jsonb; -- 段階の詳細情報

-- 前回の治療段階
ALTER TABLE user_treatment_phases 
ADD COLUMN IF NOT EXISTS previous_phase text CHECK (previous_phase IN ('pre_treatment', 'active_treatment', 'post_treatment', 'surveillance'));

-- 段階変更の理由
ALTER TABLE user_treatment_phases 
ADD COLUMN IF NOT EXISTS phase_change_reason text;

-- 予想される次の段階
ALTER TABLE user_treatment_phases 
ADD COLUMN IF NOT EXISTS expected_next_phase text CHECK (expected_next_phase IN ('pre_treatment', 'active_treatment', 'post_treatment', 'surveillance'));

-- =============================================================================
-- 6. user_current_concernsテーブルの拡張
-- =============================================================================

-- 関心事の優先度
ALTER TABLE user_current_concerns 
ADD COLUMN IF NOT EXISTS priority_level integer DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5);

-- 関心事の詳細タグ
ALTER TABLE user_current_concerns 
ADD COLUMN IF NOT EXISTS concern_tags text[] DEFAULT '{}';

-- 関心事の発生源
ALTER TABLE user_current_concerns 
ADD COLUMN IF NOT EXISTS concern_source text CHECK (concern_source IN ('self_identified', 'doctor_mentioned', 'family_suggested', 'research_finding'));

-- =============================================================================
-- 7. 新テーブル：ユーザーの情報消費履歴
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_content_consumption_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  structured_content_id uuid REFERENCES info_updates(id) ON DELETE CASCADE,
  
  -- 消費行動
  action_type text CHECK (action_type IN ('viewed', 'read_partial', 'read_complete', 'saved', 'shared', 'dismissed')) NOT NULL,
  reading_duration integer DEFAULT 0, -- 秒単位
  reading_percentage decimal(3,2) DEFAULT 0.0 CHECK (reading_percentage >= 0 AND reading_percentage <= 1),
  
  -- 評価・フィードバック
  user_rating integer CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback_text text,
  usefulness_score integer CHECK (usefulness_score >= 1 AND usefulness_score <= 5),
  
  -- タイムスタンプ
  created_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, structured_content_id, action_type, created_at)
);

-- =============================================================================
-- 8. 新テーブル：ユーザーの外部リソース利用履歴
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_external_resource_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- リソース情報
  resource_type text CHECK (resource_type IN ('website', 'app', 'book', 'video', 'podcast', 'support_group')) NOT NULL,
  resource_name text NOT NULL,
  resource_url text,
  
  -- 利用状況
  usage_frequency text CHECK (usage_frequency IN ('daily', 'weekly', 'monthly', 'rarely')) DEFAULT 'rarely',
  satisfaction_level integer CHECK (satisfaction_level >= 1 AND satisfaction_level <= 5),
  recommendation_source text, -- どこで知ったか
  
  -- タイムスタンプ
  first_used timestamp with time zone DEFAULT now(),
  last_used timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- 9. 新テーブル：個別化設定の履歴
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_personalization_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 設定変更内容
  setting_category text CHECK (setting_category IN ('preferences', 'privacy', 'notifications', 'content_format')) NOT NULL,
  old_value jsonb,
  new_value jsonb NOT NULL,
  change_reason text,
  
  -- 変更者
  changed_by text CHECK (changed_by IN ('user', 'system', 'algorithm')) DEFAULT 'user',
  
  -- タイムスタンプ
  changed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- 10. インデックス追加（パフォーマンス向上）
-- =============================================================================

-- user_medical_profiles関連
CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_treatment_urgency ON user_medical_profiles(treatment_urgency);
CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_next_appointment ON user_medical_profiles(next_appointment_date);
CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_age ON user_medical_profiles(age);
CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_hospital_type ON user_medical_profiles(hospital_type);

-- user_context_profiles関連
CREATE INDEX IF NOT EXISTS idx_user_context_profiles_economic_status ON user_context_profiles(economic_status);
CREATE INDEX IF NOT EXISTS idx_user_context_profiles_has_caregiver ON user_context_profiles(has_caregiver);
CREATE INDEX IF NOT EXISTS idx_user_context_profiles_internet_usage ON user_context_profiles(internet_usage_frequency);

-- user_preference_profiles関連
CREATE INDEX IF NOT EXISTS idx_user_preference_profiles_medical_terminology ON user_preference_profiles(medical_terminology_level);
CREATE INDEX IF NOT EXISTS idx_user_preference_profiles_privacy_sharing ON user_preference_profiles(privacy_sharing_level);
CREATE INDEX IF NOT EXISTS idx_user_preference_profiles_stress_sensitivity ON user_preference_profiles(stress_sensitivity);

-- user_behavior_patterns関連
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_peak_day ON user_behavior_patterns(peak_usage_day);
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_engagement_trend ON user_behavior_patterns(engagement_trend);

-- user_current_concerns関連
CREATE INDEX IF NOT EXISTS idx_user_current_concerns_priority ON user_current_concerns(priority_level DESC);
CREATE INDEX IF NOT EXISTS idx_user_current_concerns_source ON user_current_concerns(concern_source);

-- 新テーブル関連
CREATE INDEX IF NOT EXISTS idx_user_content_consumption_structured_content_id ON user_content_consumption_history(structured_content_id);
CREATE INDEX IF NOT EXISTS idx_user_content_consumption_action_type ON user_content_consumption_history(action_type);
CREATE INDEX IF NOT EXISTS idx_user_content_consumption_created_at ON user_content_consumption_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_external_resource_user_id ON user_external_resource_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_external_resource_type ON user_external_resource_usage(resource_type);
CREATE INDEX IF NOT EXISTS idx_user_external_resource_satisfaction ON user_external_resource_usage(satisfaction_level DESC);

CREATE INDEX IF NOT EXISTS idx_user_personalization_history_user_id ON user_personalization_settings_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personalization_history_category ON user_personalization_settings_history(setting_category);
CREATE INDEX IF NOT EXISTS idx_user_personalization_history_changed_at ON user_personalization_settings_history(changed_at DESC);

-- =============================================================================
-- 11. RLSポリシー設定（新テーブル用）
-- =============================================================================

-- user_content_consumption_history
ALTER TABLE user_content_consumption_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own content consumption history" ON user_content_consumption_history
  FOR ALL USING (auth.uid() = user_id);

-- user_external_resource_usage
ALTER TABLE user_external_resource_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own external resource usage" ON user_external_resource_usage
  FOR ALL USING (auth.uid() = user_id);

-- user_personalization_settings_history
ALTER TABLE user_personalization_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personalization settings history" ON user_personalization_settings_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert personalization settings history" ON user_personalization_settings_history
  FOR INSERT WITH CHECK (true); -- システムが自動記録

-- =============================================================================
-- 12. トリガー設定（新テーブル用）
-- =============================================================================

-- updated_at自動更新のトリガー
CREATE TRIGGER update_user_external_resource_usage_updated_at 
  BEFORE UPDATE ON user_external_resource_usage 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 13. 既存データの改善（デフォルト値設定）
-- =============================================================================

-- user_preference_profilesのinformation_depthをstandardに修正（'standard'が追加されたため）
UPDATE user_preference_profiles 
SET information_depth = 'standard' 
WHERE information_depth = 'detailed' OR information_depth IS NULL;

-- =============================================================================
-- 14. 個別化エンジン用の統計ビュー作成
-- =============================================================================

-- ユーザーのエンゲージメント概要ビュー
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
  u.user_id,
  u.engagement_score,
  u.category,
  u.click_count,
  u.read_count,
  u.save_count,
  u.share_count,
  u.last_accessed,
  bp.average_session_duration,
  bp.completion_rate,
  bp.save_rate,
  bp.engagement_trend
FROM user_category_engagement u
LEFT JOIN user_behavior_patterns bp ON u.user_id = bp.user_id;

-- ユーザーの総合プロフィールビュー（個別化クエリ用）
CREATE OR REPLACE VIEW unified_user_profiles AS
SELECT 
  mp.user_id,
  mp.cancer_type,
  mp.stage,
  mp.treatment_status,
  mp.treatment_urgency,
  mp.age,
  mp.diagnosis_date,
  cp.prefecture,
  cp.region,
  cp.age_range,
  cp.employment,
  cp.economic_status,
  cp.has_caregiver,
  pp.information_depth,
  pp.update_frequency,
  pp.communication_style,
  pp.medical_terminology_level,
  pp.stress_sensitivity,
  tp.current_phase,
  tp.days_in_phase,
  bp.engagement_trend,
  bp.average_session_duration
FROM user_medical_profiles mp
LEFT JOIN user_context_profiles cp ON mp.user_id = cp.user_id
LEFT JOIN user_preference_profiles pp ON mp.user_id = pp.user_id
LEFT JOIN user_treatment_phases tp ON mp.user_id = tp.user_id
LEFT JOIN user_behavior_patterns bp ON mp.user_id = bp.user_id;

-- =============================================================================
-- コメント追加
-- =============================================================================

COMMENT ON TABLE user_content_consumption_history IS '個別化システム - ユーザー情報消費履歴';
COMMENT ON TABLE user_external_resource_usage IS '個別化システム - 外部リソース利用履歴';
COMMENT ON TABLE user_personalization_settings_history IS '個別化システム - 個別化設定変更履歴';
COMMENT ON VIEW user_engagement_summary IS '個別化システム - ユーザーエンゲージメント概要ビュー';
COMMENT ON VIEW unified_user_profiles IS '個別化システム - 統合ユーザープロフィールビュー（個別化クエリ用）';

-- 実行完了メッセージ
SELECT 'データベース個別化拡張が正常に完了しました。新しいカラム、テーブル、ビューが追加されました。' AS status; 