-- RLS一時無効化SQL
-- 個別化エンジンのサービスロールキー使用時のRLS違反を解決するため

-- =============================================================================
-- 1. structured_content_relevance_scoresテーブルのRLS一時無効化
-- =============================================================================

-- RLSを一時的に無効化
ALTER TABLE structured_content_relevance_scores DISABLE ROW LEVEL SECURITY;

-- 既存のRLSポリシーを確認（無効化後も保持される）
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'structured_content_relevance_scores';

-- =============================================================================
-- 2. 個別化エンジン用の専用ポリシー作成（オプション）
-- =============================================================================

-- サービスロールキー使用時の専用ポリシー（必要に応じて）
-- CREATE POLICY "service_role_access" ON structured_content_relevance_scores
--     FOR ALL
--     TO service_role
--     USING (true)
--     WITH CHECK (true);

-- =============================================================================
-- 3. 確認クエリ
-- =============================================================================

-- RLS無効化確認
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'structured_content_relevance_scores';

-- テーブル構造確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'structured_content_relevance_scores'
ORDER BY ordinal_position;

-- =============================================================================
-- 4. 復旧用SQL（必要に応じて実行）
-- =============================================================================

-- RLSを再度有効化する場合（コメントアウト）
-- ALTER TABLE structured_content_relevance_scores ENABLE ROW LEVEL SECURITY;

-- ユーザーアクセス用ポリシーを再作成する場合（コメントアウト）
-- CREATE POLICY "user_access" ON structured_content_relevance_scores
--     FOR ALL
--     TO authenticated
--     USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 実行完了メッセージ
-- =============================================================================

SELECT 'RLS一時無効化が完了しました。個別化エンジンが正常に動作するはずです。' AS status; 