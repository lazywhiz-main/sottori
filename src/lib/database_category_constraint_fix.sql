-- info_updatesテーブルのカテゴリ制約を拡張
-- support_resourcesカテゴリを追加

-- 既存の制約を削除
ALTER TABLE info_updates DROP CONSTRAINT IF EXISTS info_updates_category_check;

-- 新しい制約を追加（support_resourcesを含む）
ALTER TABLE info_updates ADD CONSTRAINT info_updates_category_check 
  CHECK (category IN ('treatment_options', 'doctors', 'side_effects', 'clinical_trials', 'support_resources'));

-- 確認用: 制約の状態をチェック（PostgreSQL 12以降対応）
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'info_updates'::regclass 
AND conname = 'info_updates_category_check'; 