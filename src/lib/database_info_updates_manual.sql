-- 手動実行用: 情報更新機能のためのデータベース設定
-- このファイルをSupabaseのSQL Editorで実行してください

-- 1. 情報更新テーブル
CREATE TABLE IF NOT EXISTS info_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('treatment_options', 'doctors', 'side_effects', 'clinical_trials')),
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  source_url text,
  relevance_score integer DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  is_read boolean DEFAULT false,
  is_saved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. 情報収集進捗テーブル
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

-- 3. インデックス作成
CREATE INDEX IF NOT EXISTS idx_info_updates_user_id ON info_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_info_updates_category ON info_updates(category);
CREATE INDEX IF NOT EXISTS idx_info_updates_created_at ON info_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_info_updates_relevance ON info_updates(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_info_updates_is_read ON info_updates(is_read);

CREATE INDEX IF NOT EXISTS idx_info_collection_progress_user_id ON info_collection_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_info_collection_progress_category ON info_collection_progress(category);

-- 4. RLS (Row Level Security) 設定
ALTER TABLE info_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_collection_progress ENABLE ROW LEVEL SECURITY;

-- 5. ポリシー作成: ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view their own info updates" ON info_updates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own info updates" ON info_updates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own info updates" ON info_updates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own info updates" ON info_updates
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own progress" ON info_collection_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON info_collection_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON info_collection_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" ON info_collection_progress
  FOR DELETE USING (auth.uid() = user_id); 