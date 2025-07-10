-- ユーザー訪問履歴管理テーブル
-- このファイルをSupabaseのSQL Editorで実行してください

-- =============================================================================
-- 1. ユーザー訪問履歴テーブル
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 訪問情報
  page text NOT NULL, -- 'dashboard', 'roadmap-detail', 'info-updates' など
  visit_count integer DEFAULT 1,
  
  -- 時間情報
  first_visit_at timestamp with time zone DEFAULT now(),
  last_visit_at timestamp with time zone DEFAULT now(),
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, page)
);

-- =============================================================================
-- 2. インデックス作成
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_visits_user_id ON user_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_visits_page ON user_visits(page);
CREATE INDEX IF NOT EXISTS idx_user_visits_last_visit_at ON user_visits(last_visit_at DESC);

-- =============================================================================
-- 3. トリガー設定
-- =============================================================================

-- updated_at自動更新関数（既存のものを使用）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
CREATE TRIGGER update_user_visits_updated_at 
    BEFORE UPDATE ON user_visits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. RLS (Row Level Security) 設定
-- =============================================================================

ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の訪問履歴のみアクセス可能
CREATE POLICY "Users can access their own visit history" ON user_visits
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 5. ヘルパー関数
-- =============================================================================

-- ユーザーの初回訪問日を取得
CREATE OR REPLACE FUNCTION get_user_first_visit_date(p_user_id uuid)
RETURNS timestamp with time zone AS $$
BEGIN
  RETURN (
    SELECT MIN(first_visit_at)
    FROM user_visits
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- ユーザーの総訪問回数を取得
CREATE OR REPLACE FUNCTION get_user_total_visits(p_user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(visit_count), 0)
    FROM user_visits
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- ユーザーの最も訪問頻度の高いページを取得
CREATE OR REPLACE FUNCTION get_user_most_visited_page(p_user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT page
    FROM user_visits
    WHERE user_id = p_user_id
    ORDER BY visit_count DESC, last_visit_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. コメント
-- =============================================================================

COMMENT ON TABLE user_visits IS 'ユーザーのページ訪問履歴';
COMMENT ON COLUMN user_visits.page IS '訪問したページ名';
COMMENT ON COLUMN user_visits.visit_count IS 'そのページへの訪問回数';
COMMENT ON COLUMN user_visits.first_visit_at IS '初回訪問日時';
COMMENT ON COLUMN user_visits.last_visit_at IS '最終訪問日時';

COMMENT ON FUNCTION get_user_first_visit_date(uuid) IS 'ユーザーの初回訪問日を取得';
COMMENT ON FUNCTION get_user_total_visits(uuid) IS 'ユーザーの総訪問回数を取得';
COMMENT ON FUNCTION get_user_most_visited_page(uuid) IS 'ユーザーの最も訪問頻度の高いページを取得'; 