-- user_preference_profilesテーブルの制約修正
-- information_depthとnotification_frequencyの制約にstandardを追加

-- 既存の制約を削除
ALTER TABLE user_preference_profiles DROP CONSTRAINT IF EXISTS user_preference_profiles_information_depth_check;
ALTER TABLE user_preference_profiles DROP CONSTRAINT IF EXISTS user_preference_profiles_notification_frequency_check;

-- 修正された制約を追加（standardを含む）
ALTER TABLE user_preference_profiles ADD CONSTRAINT user_preference_profiles_information_depth_check 
  CHECK (information_depth IN ('basic', 'standard', 'detailed', 'comprehensive'));

ALTER TABLE user_preference_profiles ADD CONSTRAINT user_preference_profiles_notification_frequency_check 
  CHECK (notification_frequency IN ('minimal', 'standard', 'comprehensive'));

-- 確認用: 制約の状態をチェック
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'user_preference_profiles'::regclass 
AND conname IN ('user_preference_profiles_information_depth_check', 'user_preference_profiles_notification_frequency_check'); 