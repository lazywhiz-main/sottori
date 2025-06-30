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