-- 不足しているuser_responsesカラムを追加するための差分SQL
-- このファイルをSupabaseのSQL Editorで実行してください

-- roadmap_historiesテーブルにuser_responsesカラムを追加
ALTER TABLE roadmap_histories 
ADD COLUMN IF NOT EXISTS user_responses jsonb;

-- テーブルが存在しない場合は作成（安全のため）
CREATE TABLE IF NOT EXISTS check_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ロードマップ履歴テーブル（user_responsesカラム含む）
CREATE TABLE IF NOT EXISTS roadmap_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  check_history_id uuid REFERENCES check_histories(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  title text,
  user_responses jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS設定（存在しない場合のみ）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'check_histories' 
    AND policyname = 'Users can view own check histories'
  ) THEN
    ALTER TABLE check_histories ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own check histories" ON check_histories
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own check histories" ON check_histories
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own check histories" ON check_histories
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own check histories" ON check_histories
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roadmap_histories' 
    AND policyname = 'Users can view own roadmap histories'
  ) THEN
    ALTER TABLE roadmap_histories ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own roadmap histories" ON roadmap_histories
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own roadmap histories" ON roadmap_histories
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own roadmap histories" ON roadmap_histories
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own roadmap histories" ON roadmap_histories
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- インデックス追加（存在しない場合のみ）
CREATE INDEX IF NOT EXISTS idx_check_histories_user_id ON check_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_check_histories_completed_at ON check_histories(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_roadmap_histories_user_id ON roadmap_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_histories_check_history_id ON roadmap_histories(check_history_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_histories_created_at ON roadmap_histories(created_at DESC);

-- info_updatesテーブルの不足カラム追加
-- このファイルをSupabaseのSQL Editorで実行してください

-- reliability_scoreカラムを追加（1-5の範囲、デフォルト値3）
ALTER TABLE info_updates 
ADD COLUMN IF NOT EXISTS reliability_score integer DEFAULT 3 
CHECK (reliability_score >= 1 AND reliability_score <= 5);

-- 既存のrelevance_scoreとは異なる意味で使用:
-- relevance_score: ユーザーの状況への関連度 (0-100)
-- reliability_score: 情報源の信頼性 (1-5, 5が最高)

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_info_updates_reliability ON info_updates(reliability_score DESC);

-- 既存データがある場合の更新（デフォルト値を設定）
UPDATE info_updates 
SET reliability_score = 3 
WHERE reliability_score IS NULL;

-- info_updatesテーブルのカテゴリ制約を拡張
-- support_resourcesカテゴリを追加

-- 既存の制約を削除
ALTER TABLE info_updates DROP CONSTRAINT IF EXISTS info_updates_category_check;

-- 新しい制約を追加（support_resourcesを含む）
ALTER TABLE info_updates ADD CONSTRAINT info_updates_category_check 
  CHECK (category IN ('treatment_options', 'doctors', 'side_effects', 'clinical_trials', 'support_resources'));

-- 確認用: 制約の状態をチェック
SELECT 
  conname as constraint_name,
  consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'info_updates'::regclass 
AND conname = 'info_updates_category_check'; 