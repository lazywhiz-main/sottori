-- サービスロール専用RLSポリシー作成
-- 個別化エンジンのサービスロールキー使用時のRLS違反を解決するため

-- =============================================================================
-- 1. 既存ポリシーの確認
-- =============================================================================

-- 現在のポリシーを確認
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
-- 2. サービスロール専用ポリシーの作成
-- =============================================================================

-- 既存のポリシーを削除（必要に応じて）
-- DROP POLICY IF EXISTS "Users can manage their relevance scores" ON structured_content_relevance_scores;

-- サービスロール専用ポリシーを作成
CREATE POLICY "service_role_manage_relevance_scores" ON structured_content_relevance_scores
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 認証済みユーザー用ポリシー（既存のポリシーと共存）
CREATE POLICY "authenticated_users_manage_relevance_scores" ON structured_content_relevance_scores
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. 他の関連テーブルにも同様のポリシーを適用
-- =============================================================================

-- user_segmentsテーブル
CREATE POLICY "service_role_manage_user_segments" ON user_segments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_users_manage_user_segments" ON user_segments
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_medical_profilesテーブル
CREATE POLICY "service_role_manage_medical_profiles" ON user_medical_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_users_manage_medical_profiles" ON user_medical_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_context_profilesテーブル
CREATE POLICY "service_role_manage_context_profiles" ON user_context_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_users_manage_context_profiles" ON user_context_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_preference_profilesテーブル
CREATE POLICY "service_role_manage_preference_profiles" ON user_preference_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_users_manage_preference_profiles" ON user_preference_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_behavior_patternsテーブル
CREATE POLICY "service_role_manage_behavior_patterns" ON user_behavior_patterns
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_users_manage_behavior_patterns" ON user_behavior_patterns
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_treatment_phasesテーブル
CREATE POLICY "service_role_manage_treatment_phases" ON user_treatment_phases
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_users_manage_treatment_phases" ON user_treatment_phases
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_category_engagementテーブル
CREATE POLICY "service_role_manage_category_engagement" ON user_category_engagement
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_users_manage_category_engagement" ON user_category_engagement
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_current_concernsテーブル
CREATE POLICY "service_role_manage_current_concerns" ON user_current_concerns
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_users_manage_current_concerns" ON user_current_concerns
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. ポリシー作成後の確認
-- =============================================================================

-- 作成されたポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN (
    'structured_content_relevance_scores',
    'user_segments',
    'user_medical_profiles',
    'user_context_profiles',
    'user_preference_profiles',
    'user_behavior_patterns',
    'user_treatment_phases',
    'user_category_engagement',
    'user_current_concerns'
)
ORDER BY tablename, policyname;

-- =============================================================================
-- 5. テスト用クエリ
-- =============================================================================

-- サービスロールでアクセス可能かテスト
-- 注意: このクエリはSupabaseのSQL Editorで実行してください
SELECT 
    'structured_content_relevance_scores' as table_name,
    COUNT(*) as record_count
FROM structured_content_relevance_scores
LIMIT 1;

-- =============================================================================
-- 完了メッセージ
-- =============================================================================

SELECT 'サービスロール専用RLSポリシーの作成が完了しました。個別化エンジンが正常に動作するはずです。' AS status; 