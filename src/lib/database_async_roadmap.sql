-- 非同期ロードマップ処理用テーブル
CREATE TABLE IF NOT EXISTS roadmap_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_roadmap_jobs_job_id ON roadmap_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_jobs_user_id ON roadmap_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_jobs_expires_at ON roadmap_jobs(expires_at);

-- RLS (Row Level Security) 設定
ALTER TABLE roadmap_jobs ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のジョブ結果のみアクセス可能
CREATE POLICY "Users can access their own roadmap jobs" ON roadmap_jobs
  FOR ALL USING (auth.uid() = user_id);

-- 期限切れジョブの自動削除機能（オプション）
-- Supabase Functionとして実装する場合
CREATE OR REPLACE FUNCTION cleanup_expired_roadmap_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM roadmap_jobs WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Supabase Edge Functionでの定期実行推奨
-- cron設定: SELECT cron.schedule('cleanup-roadmap-jobs', '0 */6 * * *', 'SELECT cleanup_expired_roadmap_jobs();');

COMMENT ON TABLE roadmap_jobs IS '非同期ロードマップ生成の結果を一時保存するテーブル';
COMMENT ON COLUMN roadmap_jobs.job_id IS 'クライアントが追跡に使用するユニークなジョブID';
COMMENT ON COLUMN roadmap_jobs.result IS 'ロードマップ生成結果のJSON';
COMMENT ON COLUMN roadmap_jobs.expires_at IS 'ジョブ結果の有効期限（デフォルト24時間）'; 