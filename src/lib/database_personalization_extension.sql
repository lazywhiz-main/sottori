-- 個別化システム データベース拡張
-- Phase 1: 基盤構築 - 個別化インプットテーブル設計
-- このファイルをSupabaseのSQL Editorで実行してください

-- =============================================================================
-- 1. ユーザープロフィール拡張テーブル（個別化インプット）
-- =============================================================================

-- ユーザーの医療詳細情報
CREATE TABLE IF NOT EXISTS user_medical_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 医療情報
  cancer_type text,
  stage text,
  diagnosis_date date,
  
  -- 治療情報
  current_treatment_types text[] DEFAULT '{}',
  treatment_status text CHECK (treatment_status IN ('planning', 'ongoing', 'completed', 'paused')),
  treatment_start_date date,
  treatment_end_date date,
  
  -- 治療履歴（JSONB）
  treatment_history jsonb DEFAULT '[]'::jsonb,
  
  -- 副作用経験
  side_effects_experienced text[] DEFAULT '{}',
  
  -- 医療チーム
  primary_doctor text,
  hospital text,
  hospital_location text,
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- ユーザーのコンテキスト情報（地理・社会）
CREATE TABLE IF NOT EXISTS user_context_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 地理的情報
  prefecture text,
  city text,
  region text CHECK (region IN ('urban', 'suburban', 'rural')),
  
  -- 人口統計情報
  age_range text CHECK (age_range IN ('20-29', '30-39', '40-49', '50-59', '60-69', '70+')),
  employment text CHECK (employment IN ('working', 'retired', 'student', 'homemaker', 'unemployed')),
  family_support text CHECK (family_support IN ('high', 'medium', 'low')),
  
  -- アクセシビリティ
  mobility_limitations text[] DEFAULT '{}',
  language_preference text CHECK (language_preference IN ('japanese', 'english', 'both')) DEFAULT 'japanese',
  technology_comfort text CHECK (technology_comfort IN ('high', 'medium', 'low')) DEFAULT 'medium',
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- ユーザーの情報需要特性
CREATE TABLE IF NOT EXISTS user_preference_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 情報需要
  information_depth text CHECK (information_depth IN ('basic', 'detailed', 'comprehensive')) DEFAULT 'standard',
  update_frequency text CHECK (update_frequency IN ('immediate', 'daily', 'weekly')) DEFAULT 'daily',
  priority_areas text[] DEFAULT '{}', -- InfoCategory配列
  communication_style text CHECK (communication_style IN ('formal', 'casual', 'empathetic')) DEFAULT 'empathetic',
  content_formats text[] DEFAULT '{text}', -- ('text', 'visual', 'video', 'audio')
  
  -- 通知設定
  notification_frequency text CHECK (notification_frequency IN ('minimal', 'standard', 'comprehensive')) DEFAULT 'standard',
  notification_channels text[] DEFAULT '{in_app}', -- ('in_app', 'push', 'email')
  notification_timing integer[] DEFAULT '{9,12,18}', -- 通知適切時間帯
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- =============================================================================
-- 2. 行動データ収集テーブル
-- =============================================================================

-- ユーザーアプリ使用パターン
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- アプリ使用パターン
  active_hours integer[] DEFAULT '{}', -- アクティブ時間帯
  average_session_duration integer DEFAULT 0, -- 平均セッション時間（分）
  frequent_features text[] DEFAULT '{}', -- よく使う機能
  
  -- 情報消費パターン
  reading_speed text CHECK (reading_speed IN ('fast', 'medium', 'slow')) DEFAULT 'medium',
  completion_rate decimal(3,2) DEFAULT 0.0 CHECK (completion_rate >= 0 AND completion_rate <= 1), -- 情報完読率
  save_rate decimal(3,2) DEFAULT 0.0 CHECK (save_rate >= 0 AND save_rate <= 1), -- 情報保存率
  
  -- 最終計算日時
  last_calculated timestamp with time zone DEFAULT now(),
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- カテゴリ別エンゲージメント履歴
CREATE TABLE IF NOT EXISTS user_category_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- カテゴリ情報
  category text NOT NULL CHECK (category IN ('treatment_options', 'doctors', 'side_effects', 'clinical_trials', 'support_resources', 'financial_assistance')),
  
  -- エンゲージメント指標
  engagement_score integer DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  click_count integer DEFAULT 0,
  read_count integer DEFAULT 0,
  save_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  
  -- 最終アクセス
  last_accessed timestamp with time zone,
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, category)
);

-- =============================================================================
-- 3. リアルタイム状況データテーブル
-- =============================================================================

-- 現在の治療段階とマイルストーン
CREATE TABLE IF NOT EXISTS user_treatment_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 治療段階
  current_phase text CHECK (current_phase IN ('pre_treatment', 'active_treatment', 'post_treatment', 'surveillance')) DEFAULT 'pre_treatment',
  days_in_phase integer DEFAULT 0,
  
  -- 次のマイルストーン
  next_milestone_type text CHECK (next_milestone_type IN ('appointment', 'test', 'treatment_end')),
  next_milestone_date date,
  next_milestone_description text,
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- ユーザーの現在の関心事
CREATE TABLE IF NOT EXISTS user_current_concerns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 関心事の分類
  urgency_level text CHECK (urgency_level IN ('immediate', 'upcoming', 'general')) NOT NULL,
  concern_text text NOT NULL,
  category text CHECK (category IN ('treatment_options', 'doctors', 'side_effects', 'clinical_trials', 'support_resources', 'financial_assistance')),
  
  -- 状態管理
  is_active boolean DEFAULT true,
  resolved_at timestamp with time zone,
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- 4. 関連度スコアリングテーブル
-- =============================================================================

-- 情報更新の関連度詳細スコア
CREATE TABLE IF NOT EXISTS info_relevance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  info_update_id uuid REFERENCES info_updates(id) ON DELETE CASCADE,
  
  -- 関連度計算要素（設計書の RelevanceCalculation に基づく）
  medical_match_score integer DEFAULT 0 CHECK (medical_match_score >= 0 AND medical_match_score <= 100),
  contextual_relevance_score integer DEFAULT 0 CHECK (contextual_relevance_score >= 0 AND contextual_relevance_score <= 100),
  personal_interest_score integer DEFAULT 0 CHECK (personal_interest_score >= 0 AND personal_interest_score <= 100),
  priority_score integer DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  
  -- 最終スコア
  final_relevance_score integer DEFAULT 0 CHECK (final_relevance_score >= 0 AND final_relevance_score <= 100),
  
  -- 計算詳細（デバッグ用）
  calculation_details jsonb DEFAULT '{}'::jsonb,
  
  -- システム管理
  calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, info_update_id)
);

-- ユーザーセグメント分類
CREATE TABLE IF NOT EXISTS user_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- セグメント情報
  segment_type text CHECK (segment_type IN ('newly_diagnosed', 'active_treatment', 'post_treatment', 'long_term_survivor', 'recurrence', 'palliative', 'caregiver')) NOT NULL,
  confidence_score integer DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- セグメント特性
  segment_characteristics jsonb DEFAULT '{}'::jsonb,
  
  -- システム管理
  assigned_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- =============================================================================
-- 5. インデックス作成
-- =============================================================================

-- 医療プロフィール
CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_user_id ON user_medical_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_cancer_type ON user_medical_profiles(cancer_type);
CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_stage ON user_medical_profiles(stage);

-- コンテキストプロフィール
CREATE INDEX IF NOT EXISTS idx_user_context_profiles_user_id ON user_context_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_profiles_prefecture ON user_context_profiles(prefecture);
CREATE INDEX IF NOT EXISTS idx_user_context_profiles_age_range ON user_context_profiles(age_range);

-- 設定プロフィール
CREATE INDEX IF NOT EXISTS idx_user_preference_profiles_user_id ON user_preference_profiles(user_id);

-- 行動パターン
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_user_id ON user_behavior_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_engagement_user_id ON user_category_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_engagement_category ON user_category_engagement(category);

-- 治療段階
CREATE INDEX IF NOT EXISTS idx_user_treatment_phases_user_id ON user_treatment_phases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_treatment_phases_current_phase ON user_treatment_phases(current_phase);

-- 関心事
CREATE INDEX IF NOT EXISTS idx_user_current_concerns_user_id ON user_current_concerns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_current_concerns_urgency ON user_current_concerns(urgency_level);
CREATE INDEX IF NOT EXISTS idx_user_current_concerns_active ON user_current_concerns(is_active);

-- 関連度スコア
CREATE INDEX IF NOT EXISTS idx_info_relevance_scores_user_id ON info_relevance_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_info_relevance_scores_info_update_id ON info_relevance_scores(info_update_id);
CREATE INDEX IF NOT EXISTS idx_info_relevance_scores_final_score ON info_relevance_scores(final_relevance_score DESC);

-- ユーザーセグメント
CREATE INDEX IF NOT EXISTS idx_user_segments_user_id ON user_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_segments_type ON user_segments(segment_type);

-- =============================================================================
-- 6. RLS (Row Level Security) 設定
-- =============================================================================

-- すべてのテーブルでRLSを有効化
ALTER TABLE user_medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_treatment_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_current_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_relevance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;

-- ポリシー作成: ユーザーは自分のデータのみアクセス可能
-- 医療プロフィール
CREATE POLICY "Users can manage their medical profiles" ON user_medical_profiles FOR ALL USING (auth.uid() = user_id);

-- コンテキストプロフィール
CREATE POLICY "Users can manage their context profiles" ON user_context_profiles FOR ALL USING (auth.uid() = user_id);

-- 設定プロフィール
CREATE POLICY "Users can manage their preference profiles" ON user_preference_profiles FOR ALL USING (auth.uid() = user_id);

-- 行動パターン
CREATE POLICY "Users can view their behavior patterns" ON user_behavior_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their category engagement" ON user_category_engagement FOR ALL USING (auth.uid() = user_id);

-- 治療段階
CREATE POLICY "Users can manage their treatment phases" ON user_treatment_phases FOR ALL USING (auth.uid() = user_id);

-- 関心事
CREATE POLICY "Users can manage their current concerns" ON user_current_concerns FOR ALL USING (auth.uid() = user_id);

-- 関連度スコア
CREATE POLICY "Users can view their relevance scores" ON info_relevance_scores FOR SELECT USING (auth.uid() = user_id);

-- ユーザーセグメント
CREATE POLICY "Users can view their segments" ON user_segments FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- 7. 更新トリガー関数
-- =============================================================================

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにupdated_atトリガーを設定
CREATE TRIGGER update_user_medical_profiles_updated_at BEFORE UPDATE ON user_medical_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_context_profiles_updated_at BEFORE UPDATE ON user_context_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preference_profiles_updated_at BEFORE UPDATE ON user_preference_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_behavior_patterns_updated_at BEFORE UPDATE ON user_behavior_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_treatment_phases_updated_at BEFORE UPDATE ON user_treatment_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_segments_updated_at BEFORE UPDATE ON user_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. 初期データ作成関数
-- =============================================================================

-- ユーザー登録時に個別化プロフィールを自動作成する関数
CREATE OR REPLACE FUNCTION create_personalization_profiles_for_user(p_user_id uuid)
RETURNS void AS $$
BEGIN
    -- 医療プロフィール作成
    INSERT INTO user_medical_profiles (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- コンテキストプロフィール作成
    INSERT INTO user_context_profiles (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 設定プロフィール作成
    INSERT INTO user_preference_profiles (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 行動パターン作成
    INSERT INTO user_behavior_patterns (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 治療段階作成
    INSERT INTO user_treatment_phases (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 基本カテゴリエンゲージメント作成
    INSERT INTO user_category_engagement (user_id, category) VALUES
    (p_user_id, 'treatment_options'),
    (p_user_id, 'doctors'),
    (p_user_id, 'side_effects'),
    (p_user_id, 'clinical_trials'),
    (p_user_id, 'support_resources'),
    (p_user_id, 'financial_assistance')
    ON CONFLICT (user_id, category) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- コメント追加
-- =============================================================================

COMMENT ON TABLE user_medical_profiles IS '個別化システム - ユーザー医療詳細プロフィール';
COMMENT ON TABLE user_context_profiles IS '個別化システム - ユーザーコンテキスト情報（地理・社会）';
COMMENT ON TABLE user_preference_profiles IS '個別化システム - ユーザー情報需要特性';
COMMENT ON TABLE user_behavior_patterns IS '個別化システム - ユーザー行動パターン';
COMMENT ON TABLE user_category_engagement IS '個別化システム - カテゴリ別エンゲージメント履歴';
COMMENT ON TABLE user_treatment_phases IS '個別化システム - 現在の治療段階';
COMMENT ON TABLE user_current_concerns IS '個別化システム - ユーザーの現在の関心事';
COMMENT ON TABLE info_relevance_scores IS '個別化システム - 情報関連度スコア詳細';
COMMENT ON TABLE user_segments IS '個別化システム - ユーザーセグメント分類'; 