-- サンプルデータ挿入用SQL
-- 注意: テーブルが作成された後に実行してください

-- サンプルデータの挿入（開発用）
DO $$
DECLARE
    sample_user_id uuid;
BEGIN
    -- 既存のユーザーIDを取得（存在する場合）
    SELECT id INTO sample_user_id FROM profiles LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        -- 既存のサンプルデータを削除（重複を避けるため）
        DELETE FROM info_updates WHERE title LIKE '%新しい標準治療法%' OR title LIKE '%新しいがん専門医%' OR title LIKE '%新しい臨床試験%';
        DELETE FROM info_collection_progress WHERE user_id = sample_user_id;
        
        -- サンプル情報更新データ
        INSERT INTO info_updates (user_id, category, title, summary, content, relevance_score, priority, created_at) VALUES
        (sample_user_id, 'treatment_options', '新しい標準治療法が承認されました', '○○がんの新しい治療法が厚生労働省により承認され、従来治療より副作用が30%軽減されることが確認されました。', '詳細な治療法の説明とメカニズム、対象患者、副作用情報などの完全な内容がここに入ります...', 95, 'high', now() - interval '2 hours'),
        (sample_user_id, 'doctors', 'お住まいの地域に新しいがん専門医が着任', '○○病院に経験豊富ながん専門医が新しく着任し、最新の治療法に対応可能になりました。', '専門医の経歴、専門分野、診療時間、予約方法などの詳細情報...', 82, 'medium', now() - interval '1 day'),
        (sample_user_id, 'clinical_trials', '新しい臨床試験の募集開始', 'あなたの条件に合致する臨床試験の募集が開始されました。参加により最新治療を受けられる可能性があります。', '臨床試験の詳細、参加条件、期間、場所、連絡先などの情報...', 75, 'medium', now() - interval '3 days');
        
        -- サンプル収集進捗データ
        INSERT INTO info_collection_progress (user_id, category, progress_percentage, status, items_found, last_updated) VALUES
        (sample_user_id, 'treatment_options', 100, 'completed', 12, now()),
        (sample_user_id, 'doctors', 65, 'collecting', 8, now() - interval '30 minutes'),
        (sample_user_id, 'side_effects', 0, 'waiting', 0, now()),
        (sample_user_id, 'clinical_trials', 30, 'collecting', 3, now() - interval '2 hours');
        
        RAISE NOTICE 'サンプルデータが正常に挿入されました。ユーザーID: %', sample_user_id;
    ELSE
        RAISE NOTICE 'profilesテーブルにユーザーが存在しません。まずユーザー登録を行ってください。';
    END IF;
END $$; 