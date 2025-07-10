-- 情報更新機能のためのデータベース設定
-- このファイルをSupabaseのSQL Editorで実行してください

-- 情報更新テーブル（共有リソース）
CREATE TABLE IF NOT EXISTS info_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('treatment_options', 'doctors', 'side_effects', 'clinical_trials', 'support_resources', 'financial_assistance')),
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  source_url text,
  source_name text,
  source_reliability text DEFAULT 'medium' CHECK (source_reliability IN ('high', 'medium', 'low')),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  target_audience text[], -- 対象者（'patients', 'caregivers', 'doctors'など）
  tags text[], -- 検索用タグ
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ユーザー別情報更新状態テーブル（閲覧・保存状態）
CREATE TABLE IF NOT EXISTS user_info_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  info_update_id uuid REFERENCES info_updates(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  is_saved boolean DEFAULT false,
  view_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, info_update_id)
);

-- 情報関連度スコアテーブル
CREATE TABLE IF NOT EXISTS info_relevance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  info_update_id uuid REFERENCES info_updates(id) ON DELETE CASCADE,
  medical_match_score integer DEFAULT 0 CHECK (medical_match_score >= 0 AND medical_match_score <= 100),
  contextual_relevance_score integer DEFAULT 0 CHECK (contextual_relevance_score >= 0 AND contextual_relevance_score <= 100),
  personal_interest_score integer DEFAULT 0 CHECK (personal_interest_score >= 0 AND personal_interest_score <= 100),
  priority_score integer DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  overall_score integer DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  reasoning text, -- 関連度の根拠説明
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, info_update_id)
);

-- 情報収集進捗テーブル
CREATE TABLE IF NOT EXISTS info_collection_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'collecting', 'completed')),
  items_found integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_info_updates_category ON info_updates(category);
CREATE INDEX IF NOT EXISTS idx_info_updates_created_at ON info_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_info_updates_priority ON info_updates(priority);
CREATE INDEX IF NOT EXISTS idx_info_updates_tags ON info_updates USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_user_info_states_user_id ON user_info_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_info_states_info_update_id ON user_info_states(info_update_id);
CREATE INDEX IF NOT EXISTS idx_user_info_states_is_read ON user_info_states(is_read);
CREATE INDEX IF NOT EXISTS idx_user_info_states_is_saved ON user_info_states(is_saved);

CREATE INDEX IF NOT EXISTS idx_info_relevance_scores_user_id ON info_relevance_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_info_relevance_scores_info_update_id ON info_relevance_scores(info_update_id);
CREATE INDEX IF NOT EXISTS idx_info_relevance_scores_overall_score ON info_relevance_scores(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_info_collection_progress_user_id ON info_collection_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_info_collection_progress_category ON info_collection_progress(category);

-- RLS (Row Level Security) 設定
ALTER TABLE info_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_info_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_relevance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_collection_progress ENABLE ROW LEVEL SECURITY;

-- ポリシー作成: 情報更新は全ユーザーが閲覧可能（共有リソース）
CREATE POLICY "All users can view info updates" ON info_updates
  FOR SELECT USING (true);

-- 管理者のみが情報更新を管理可能
CREATE POLICY "Only admins can manage info updates" ON info_updates
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ユーザー別状態のポリシー
CREATE POLICY "Users can view their own info states" ON user_info_states
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own info states" ON user_info_states
  FOR ALL USING (auth.uid() = user_id);

-- 関連度スコアのポリシー
CREATE POLICY "Users can view their own relevance scores" ON info_relevance_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own relevance scores" ON info_relevance_scores
  FOR ALL USING (auth.uid() = user_id);

-- 収集進捗のポリシー
CREATE POLICY "Users can view their own progress" ON info_collection_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress" ON info_collection_progress
  FOR ALL USING (auth.uid() = user_id);

-- サンプルデータの挿入（開発用）
-- 注意: 実際の本番環境では削除してください
DO $$
DECLARE
    sample_user_id uuid;
    info_update_1_id uuid;
    info_update_2_id uuid;
    info_update_3_id uuid;
BEGIN
    -- 既存のユーザーIDを取得（存在する場合）
    SELECT id INTO sample_user_id FROM profiles LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        -- サンプル情報更新データ（共有リソース）
        INSERT INTO info_updates (category, title, summary, content, source_url, source_name, source_reliability, priority, target_audience, tags, created_at) VALUES
        ('treatment_options', '新しい標準治療法が承認されました', '○○がんの新しい治療法が厚生労働省により承認され、従来治療より副作用が30%軽減されることが確認されました。', '詳細な治療法の説明とメカニズム、対象患者、副作用情報などの完全な内容がここに入ります...', 'https://example.com/treatment1', '厚生労働省', 'high', 'high', ARRAY['patients', 'caregivers'], ARRAY['がん治療', '新薬', '副作用軽減'], now() - interval '2 hours')
        RETURNING id INTO info_update_1_id;
        
        INSERT INTO info_updates (category, title, summary, content, source_url, source_name, source_reliability, priority, target_audience, tags, created_at) VALUES
        ('doctors', 'お住まいの地域に新しいがん専門医が着任', '○○病院に経験豊富ながん専門医が新しく着任し、最新の治療法に対応可能になりました。', '専門医の経歴、専門分野、診療時間、予約方法などの詳細情報...', 'https://example.com/doctor1', '○○病院', 'high', 'medium', ARRAY['patients'], ARRAY['専門医', '病院', '診療'], now() - interval '1 day')
        RETURNING id INTO info_update_2_id;
        
        INSERT INTO info_updates (category, title, summary, content, source_url, source_name, source_reliability, priority, target_audience, tags, created_at) VALUES
        ('clinical_trials', '新しい臨床試験の募集開始', 'あなたの条件に合致する臨床試験の募集が開始されました。参加により最新治療を受けられる可能性があります。', '臨床試験の詳細、参加条件、期間、場所、連絡先などの情報...', 'https://example.com/trial1', '国立がん研究センター', 'high', 'medium', ARRAY['patients'], ARRAY['臨床試験', '治験', '新治療'], now() - interval '3 days')
        RETURNING id INTO info_update_3_id;
        
        -- ユーザー別状態データ
        INSERT INTO user_info_states (user_id, info_update_id, is_read, is_saved, view_count, last_viewed_at) VALUES
        (sample_user_id, info_update_1_id, true, true, 3, now() - interval '1 hour'),
        (sample_user_id, info_update_2_id, false, false, 1, now() - interval '30 minutes'),
        (sample_user_id, info_update_3_id, false, true, 2, now() - interval '2 hours');
        
        -- 関連度スコアデータ
        INSERT INTO info_relevance_scores (user_id, info_update_id, medical_match_score, contextual_relevance_score, personal_interest_score, priority_score, overall_score, reasoning) VALUES
        (sample_user_id, info_update_1_id, 95, 88, 92, 90, 91, '医療状況と高い関連性があり、現在の治療段階に適した重要な情報です'),
        (sample_user_id, info_update_2_id, 75, 82, 68, 70, 74, '地域の医療資源として関連性があり、今後の治療選択肢として有用です'),
        (sample_user_id, info_update_3_id, 85, 78, 85, 80, 82, '現在の状況に適した臨床試験で、治療選択肢の拡大に寄与します');
        
        -- サンプル収集進捗データ
        INSERT INTO info_collection_progress (user_id, category, progress_percentage, status, items_found, last_updated) VALUES
        (sample_user_id, 'treatment_options', 100, 'completed', 12, now()),
        (sample_user_id, 'doctors', 65, 'collecting', 8, now() - interval '30 minutes'),
        (sample_user_id, 'side_effects', 0, 'waiting', 0, now()),
        (sample_user_id, 'clinical_trials', 30, 'collecting', 3, now() - interval '2 hours');
    END IF;
END $$; 