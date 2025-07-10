-- Week 6: 医療機関・医療従事者管理機能の追加フィールド
-- このファイルをSupabaseのSQL Editorで実行してください

-- 医療機関テーブルに新しいフィールドを追加
ALTER TABLE medical_institutions 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- 医療従事者テーブルのフィールドを更新
ALTER TABLE medical_professionals 
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS is_primary_doctor BOOLEAN DEFAULT FALSE;

-- 既存のspecialtyカラムをspecializationに統合（データが存在する場合）
UPDATE medical_professionals 
SET specialization = specialty 
WHERE specialty IS NOT NULL AND specialization IS NULL;

-- 古いspecialtyカラムを削除（オプション - データを確認してから実行）
-- ALTER TABLE medical_professionals DROP COLUMN IF EXISTS specialty;

-- インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_medical_institutions_user_id ON medical_institutions(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_institutions_is_primary ON medical_institutions(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_medical_professionals_user_id ON medical_professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_professionals_institution_id ON medical_professionals(institution_id);
CREATE INDEX IF NOT EXISTS idx_medical_professionals_is_primary ON medical_professionals(user_id, is_primary_doctor);
CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(user_id, record_date DESC);

-- Week 6: データ再利用機能のためのテーブル追加

-- チェック履歴テーブル
CREATE TABLE IF NOT EXISTS check_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ロードマップ履歴テーブル  
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

-- 既存のテーブルにuser_responsesカラムを追加（テーブルが既に存在する場合）
ALTER TABLE roadmap_histories 
ADD COLUMN IF NOT EXISTS user_responses jsonb;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_check_histories_user_id ON check_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_check_histories_completed_at ON check_histories(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_roadmap_histories_user_id ON roadmap_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_histories_check_history_id ON roadmap_histories(check_history_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_histories_created_at ON roadmap_histories(created_at DESC);

-- RLS (Row Level Security) 設定
ALTER TABLE check_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_histories ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own check histories" ON check_histories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check histories" ON check_histories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check histories" ON check_histories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own check histories" ON check_histories
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own roadmap histories" ON roadmap_histories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmap histories" ON roadmap_histories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmap histories" ON roadmap_histories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roadmap histories" ON roadmap_histories
  FOR DELETE USING (auth.uid() = user_id); 