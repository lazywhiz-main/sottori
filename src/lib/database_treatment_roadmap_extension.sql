-- 治療ロードマップ機能 データベース拡張
-- このファイルをSupabaseのSQL Editorで実行してください

-- =============================================================================
-- 1. 治療ロードマップ基本テーブル
-- =============================================================================

-- ユーザーの治療ロードマップ
CREATE TABLE IF NOT EXISTS user_treatment_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- ロードマップ基本情報
  title text NOT NULL DEFAULT '私の治療ロードマップ',
  description text,
  status text CHECK (status IN ('draft', 'active', 'completed', 'paused')) DEFAULT 'draft',
  
  -- 生成情報
  generated_at timestamp with time zone DEFAULT now(),
  ai_generated boolean DEFAULT false,
  generation_responses jsonb, -- 生成時の回答データ
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- ロードマップのセクション（段階）
CREATE TABLE IF NOT EXISTS roadmap_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid REFERENCES user_treatment_roadmaps(id) ON DELETE CASCADE,
  
  -- セクション情報
  section_id text NOT NULL, -- 'treatment', 'money', 'hospital' など
  title text NOT NULL,
  icon text,
  priority integer DEFAULT 0,
  
  -- コンテンツ
  content jsonb NOT NULL, -- 段落の配列
  estimated_duration_days integer, -- 推定所要日数
  
  -- 状態管理
  status text CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- セクション内のアクション項目
CREATE TABLE IF NOT EXISTS roadmap_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES roadmap_sections(id) ON DELETE CASCADE,
  
  -- アクション情報
  title text NOT NULL,
  description text,
  action_type text CHECK (action_type IN ('task', 'appointment', 'research', 'consultation', 'decision')) NOT NULL,
  
  -- 優先度と期限
  priority integer DEFAULT 0,
  due_date date,
  estimated_hours integer, -- 推定所要時間（時間）
  
  -- 状態管理
  status text CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'postponed')) DEFAULT 'pending',
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  
  -- 関連情報
  related_url text,
  notes text,
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- 2. ユーザーの進捗と感情状態追跡
-- =============================================================================

-- ユーザーの感情状態ログ
CREATE TABLE IF NOT EXISTS user_emotional_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 感情状態
  emotional_state text CHECK (emotional_state IN ('anxious', 'hopeful', 'overwhelmed', 'calm', 'uncertain', 'confident')) NOT NULL,
  intensity integer CHECK (intensity >= 1 AND intensity <= 10) DEFAULT 5,
  
  -- コンテキスト
  trigger_event text, -- 何がきっかけだったか
  current_section_id text, -- 現在のセクション
  
  -- システム管理
  recorded_at timestamp with time zone DEFAULT now()
);

-- ユーザーの進捗ログ
CREATE TABLE IF NOT EXISTS user_progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 進捗情報
  action_id uuid REFERENCES roadmap_actions(id) ON DELETE CASCADE,
  section_id uuid REFERENCES roadmap_sections(id) ON DELETE CASCADE,
  
  -- 進捗状態
  progress_type text CHECK (progress_type IN ('started', 'completed', 'skipped', 'postponed', 'needs_help')) NOT NULL,
  
  -- 詳細情報
  notes text,
  difficulty_level integer CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  
  -- システム管理
  recorded_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- 3. パーソナライゼーション設定
-- =============================================================================

-- ユーザーのロードマップ設定
CREATE TABLE IF NOT EXISTS user_roadmap_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 表示設定
  show_emotional_support boolean DEFAULT true,
  show_estimated_times boolean DEFAULT true,
  show_progress_percentage boolean DEFAULT true,
  
  -- 通知設定
  notify_section_completion boolean DEFAULT true,
  notify_action_due boolean DEFAULT true,
  notify_emotional_check boolean DEFAULT true,
  
  -- カスタマイズ設定
  preferred_pace text CHECK (preferred_pace IN ('slow', 'moderate', 'fast')) DEFAULT 'moderate',
  detail_level text CHECK (detail_level IN ('basic', 'standard', 'detailed')) DEFAULT 'standard',
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- =============================================================================
-- 4. インデックス作成
-- =============================================================================

-- ユーザーロードマップ
CREATE INDEX IF NOT EXISTS idx_user_treatment_roadmaps_user_id ON user_treatment_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_treatment_roadmaps_status ON user_treatment_roadmaps(status);

-- ロードマップセクション
CREATE INDEX IF NOT EXISTS idx_roadmap_sections_roadmap_id ON roadmap_sections(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_sections_status ON roadmap_sections(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_sections_priority ON roadmap_sections(priority);

-- ロードマップアクション
CREATE INDEX IF NOT EXISTS idx_roadmap_actions_section_id ON roadmap_actions(section_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_actions_status ON roadmap_actions(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_actions_due_date ON roadmap_actions(due_date);

-- 感情状態ログ
CREATE INDEX IF NOT EXISTS idx_user_emotional_states_user_id ON user_emotional_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_emotional_states_recorded_at ON user_emotional_states(recorded_at DESC);

-- 進捗ログ
CREATE INDEX IF NOT EXISTS idx_user_progress_logs_user_id ON user_progress_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_logs_action_id ON user_progress_logs(action_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_logs_recorded_at ON user_progress_logs(recorded_at DESC);

-- =============================================================================
-- 5. トリガーと関数
-- =============================================================================

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
CREATE TRIGGER update_user_treatment_roadmaps_updated_at 
    BEFORE UPDATE ON user_treatment_roadmaps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_sections_updated_at 
    BEFORE UPDATE ON roadmap_sections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_actions_updated_at 
    BEFORE UPDATE ON roadmap_actions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roadmap_preferences_updated_at 
    BEFORE UPDATE ON user_roadmap_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. RLS (Row Level Security) 設定
-- =============================================================================

-- ユーザーロードマップ
ALTER TABLE user_treatment_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own roadmaps" ON user_treatment_roadmaps
  FOR ALL USING (auth.uid() = user_id);

-- ロードマップセクション
ALTER TABLE roadmap_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own roadmap sections" ON roadmap_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_treatment_roadmaps 
      WHERE id = roadmap_sections.roadmap_id 
      AND user_id = auth.uid()
    )
  );

-- ロードマップアクション
ALTER TABLE roadmap_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own roadmap actions" ON roadmap_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM roadmap_sections rs
      JOIN user_treatment_roadmaps ur ON rs.roadmap_id = ur.id
      WHERE rs.id = roadmap_actions.section_id 
      AND ur.user_id = auth.uid()
    )
  );

-- 感情状態ログ
ALTER TABLE user_emotional_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own emotional states" ON user_emotional_states
  FOR ALL USING (auth.uid() = user_id);

-- 進捗ログ
ALTER TABLE user_progress_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own progress logs" ON user_progress_logs
  FOR ALL USING (auth.uid() = user_id);

-- ロードマップ設定
ALTER TABLE user_roadmap_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own roadmap preferences" ON user_roadmap_preferences
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 7. ヘルパー関数
-- =============================================================================

-- ユーザーのロードマップ進捗率を計算する関数
CREATE OR REPLACE FUNCTION calculate_roadmap_progress(p_user_id uuid)
RETURNS TABLE(
  roadmap_id uuid,
  total_sections integer,
  completed_sections integer,
  progress_percentage decimal(5,2),
  total_actions integer,
  completed_actions integer,
  action_progress_percentage decimal(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.id as roadmap_id,
    COUNT(rs.id)::integer as total_sections,
    COUNT(CASE WHEN rs.status = 'completed' THEN 1 END)::integer as completed_sections,
    CASE 
      WHEN COUNT(rs.id) > 0 THEN 
        (COUNT(CASE WHEN rs.status = 'completed' THEN 1 END)::decimal / COUNT(rs.id)::decimal * 100)
      ELSE 0 
    END as progress_percentage,
    COUNT(ra.id)::integer as total_actions,
    COUNT(CASE WHEN ra.status = 'completed' THEN 1 END)::integer as completed_actions,
    CASE 
      WHEN COUNT(ra.id) > 0 THEN 
        (COUNT(CASE WHEN ra.status = 'completed' THEN 1 END)::decimal / COUNT(ra.id)::decimal * 100)
      ELSE 0 
    END as action_progress_percentage
  FROM user_treatment_roadmaps ur
  LEFT JOIN roadmap_sections rs ON ur.id = rs.roadmap_id
  LEFT JOIN roadmap_actions ra ON rs.id = ra.section_id
  WHERE ur.user_id = p_user_id
  GROUP BY ur.id;
END;
$$ LANGUAGE plpgsql;

-- ユーザーの感情状態の傾向を分析する関数
CREATE OR REPLACE FUNCTION analyze_emotional_trend(p_user_id uuid, p_days integer DEFAULT 30)
RETURNS TABLE(
  dominant_emotion text,
  average_intensity decimal(3,2),
  trend_direction text,
  recent_emotions jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT emotional_state 
     FROM user_emotional_states 
     WHERE user_id = p_user_id 
     AND recorded_at >= NOW() - INTERVAL '1 day' * p_days
     GROUP BY emotional_state 
     ORDER BY COUNT(*) DESC 
     LIMIT 1) as dominant_emotion,
    
    AVG(intensity)::decimal(3,2) as average_intensity,
    
    CASE 
      WHEN AVG(CASE WHEN recorded_at >= NOW() - INTERVAL '1 day' * (p_days/2) THEN intensity END) >
           AVG(CASE WHEN recorded_at < NOW() - INTERVAL '1 day' * (p_days/2) THEN intensity END)
      THEN 'improving'
      ELSE 'stable'
    END as trend_direction,
    
    (SELECT jsonb_agg(
      jsonb_build_object(
        'emotion', emotional_state,
        'intensity', intensity,
        'date', recorded_at
      ) ORDER BY recorded_at DESC
    ) FROM user_emotional_states 
     WHERE user_id = p_user_id 
     AND recorded_at >= NOW() - INTERVAL '1 day' * p_days
     LIMIT 10) as recent_emotions
  FROM user_emotional_states 
  WHERE user_id = p_user_id 
  AND recorded_at >= NOW() - INTERVAL '1 day' * p_days;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. コメント
-- =============================================================================

COMMENT ON TABLE user_treatment_roadmaps IS 'ユーザーの治療ロードマップ基本情報';
COMMENT ON TABLE roadmap_sections IS 'ロードマップの各セクション（段階）';
COMMENT ON TABLE roadmap_actions IS 'セクション内の具体的なアクション項目';
COMMENT ON TABLE user_emotional_states IS 'ユーザーの感情状態の時系列ログ';
COMMENT ON TABLE user_progress_logs IS 'ユーザーの進捗状況ログ';
COMMENT ON TABLE user_roadmap_preferences IS 'ユーザーのロードマップ表示・通知設定';

COMMENT ON FUNCTION calculate_roadmap_progress(uuid) IS 'ユーザーのロードマップ進捗率を計算';
COMMENT ON FUNCTION analyze_emotional_trend(uuid, integer) IS 'ユーザーの感情状態の傾向を分析'; 