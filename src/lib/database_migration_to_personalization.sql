-- Sottori データベース移行: cancer_profiles → user_medical_profiles
-- 個別化エンジン用テーブル構成への完全移行
-- このファイルをSupabaseのSQL Editorで実行してください

-- =============================================================================
-- STEP 1: 既存データのバックアップ
-- =============================================================================

-- 既存のcancer_profilesデータをバックアップテーブルに保存
CREATE TABLE IF NOT EXISTS cancer_profiles_backup AS 
SELECT * FROM cancer_profiles;

-- =============================================================================
-- STEP 2: user_medical_profilesテーブルの作成（個別化エンジン拡張版）
-- =============================================================================

-- ユーザーの医療詳細情報（メインプロフィール）
CREATE TABLE IF NOT EXISTS user_medical_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基本医療情報
  cancer_type text,
  stage text,
  diagnosis_date date,
  
  -- 治療情報
  current_treatment_types text[] DEFAULT '{}',
  treatment_status text CHECK (treatment_status IN ('planning', 'ongoing', 'completed', 'paused')),
  treatment_start_date date,
  treatment_end_date date,
  
  -- 治療履歴（JSONB - より柔軟）
  treatment_history jsonb DEFAULT '[]'::jsonb,
  
  -- 副作用経験
  side_effects_experienced text[] DEFAULT '{}',
  
  -- 医療チーム
  primary_doctor text,
  hospital text,
  hospital_location text,
  
  -- 関心領域（cancer_profilesから移行）
  concern_areas text[] DEFAULT '{}',
  priority_concerns text[] DEFAULT '{}',
  
  -- メモ
  notes text,
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- ユーザーのコンテキスト情報
CREATE TABLE IF NOT EXISTS user_context_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
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
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 情報需要
  information_depth text CHECK (information_depth IN ('basic', 'detailed', 'comprehensive')) DEFAULT 'detailed',
  update_frequency text CHECK (update_frequency IN ('immediate', 'daily', 'weekly')) DEFAULT 'daily',
  priority_areas text[] DEFAULT '{}',
  communication_style text CHECK (communication_style IN ('formal', 'casual', 'empathetic')) DEFAULT 'empathetic',
  content_formats text[] DEFAULT '{text}',
  
  -- 通知設定
  notification_frequency text CHECK (notification_frequency IN ('minimal', 'standard', 'comprehensive')) DEFAULT 'standard',
  notification_channels text[] DEFAULT '{in_app}',
  notification_timing integer[] DEFAULT '{9,12,18}',
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- =============================================================================
-- STEP 3: 既存データの移行
-- =============================================================================

-- cancer_profiles → user_medical_profiles へのデータ移行
INSERT INTO user_medical_profiles (
  user_id,
  cancer_type,
  stage,
  diagnosis_date,
  current_treatment_types,
  treatment_status,
  treatment_start_date,
  primary_doctor,
  hospital,
  concern_areas,
  priority_concerns,
  notes,
  created_at,
  updated_at
)
SELECT 
  user_id,
  cancer_type,
  stage,
  diagnosis_date,
  COALESCE(current_treatment, '{}'),  -- 配列型への変換
  treatment_status,
  treatment_start_date,
  primary_doctor,
  hospital,
  COALESCE(concern_areas, '{}'),      -- 配列型の確保
  COALESCE(priority_concerns, '{}'),  -- 配列型の確保
  notes,
  created_at,
  updated_at
FROM cancer_profiles
ON CONFLICT (user_id) DO UPDATE SET
  cancer_type = EXCLUDED.cancer_type,
  stage = EXCLUDED.stage,
  diagnosis_date = EXCLUDED.diagnosis_date,
  current_treatment_types = EXCLUDED.current_treatment_types,
  treatment_status = EXCLUDED.treatment_status,
  treatment_start_date = EXCLUDED.treatment_start_date,
  primary_doctor = EXCLUDED.primary_doctor,
  hospital = EXCLUDED.hospital,
  concern_areas = EXCLUDED.concern_areas,
  priority_concerns = EXCLUDED.priority_concerns,
  notes = EXCLUDED.notes,
  updated_at = now();

-- デフォルトのコンテキスト&設定プロフィールを作成
INSERT INTO user_context_profiles (user_id)
SELECT DISTINCT user_id FROM user_medical_profiles
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_preference_profiles (user_id, priority_areas)
SELECT DISTINCT user_id, concern_areas FROM user_medical_profiles
ON CONFLICT (user_id) DO UPDATE SET
  priority_areas = EXCLUDED.priority_areas;

-- =============================================================================
-- STEP 4: インデックスとセキュリティの設定
-- =============================================================================

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_user_id ON user_medical_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_cancer_type ON user_medical_profiles(cancer_type);
CREATE INDEX IF NOT EXISTS idx_user_medical_profiles_stage ON user_medical_profiles(stage);
CREATE INDEX IF NOT EXISTS idx_user_context_profiles_user_id ON user_context_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preference_profiles_user_id ON user_preference_profiles(user_id);

-- RLS有効化
ALTER TABLE user_medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_profiles ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
CREATE POLICY "Users can manage own medical profile" ON user_medical_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own context profile" ON user_context_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preference profile" ON user_preference_profiles
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- STEP 5: トリガー設定
-- =============================================================================

-- updated_atの自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_medical_profiles_updated_at BEFORE UPDATE ON user_medical_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_context_profiles_updated_at BEFORE UPDATE ON user_context_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preference_profiles_updated_at BEFORE UPDATE ON user_preference_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 6: 移行確認クエリ
-- =============================================================================

-- 移行状況の確認
-- SELECT 
--   'cancer_profiles' as table_name, 
--   count(*) as record_count 
-- FROM cancer_profiles
-- UNION ALL
-- SELECT 
--   'user_medical_profiles' as table_name, 
--   count(*) as record_count 
-- FROM user_medical_profiles
-- UNION ALL
-- SELECT 
--   'user_context_profiles' as table_name, 
--   count(*) as record_count 
-- FROM user_context_profiles
-- UNION ALL
-- SELECT 
--   'user_preference_profiles' as table_name, 
--   count(*) as record_count 
-- FROM user_preference_profiles;

-- 移行後のcancer_profilesテーブルの無効化（段階的に削除予定）
-- DROP TABLE IF EXISTS cancer_profiles; -- 確認後に実行 