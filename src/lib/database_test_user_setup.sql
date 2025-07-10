-- テスト用ユーザープロフィール作成
-- この後に個別化テストデータを投入します

-- テスト用ユーザーID（実際のUUIDを生成）
-- 注意: この値は後でテストデータでも使用されます
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- プロフィールテーブルにテストユーザーを挿入
    INSERT INTO profiles (
        id,
        full_name,
        date_of_birth,
        phone,
        emergency_contact_name,
        emergency_contact_phone,
        medical_conditions,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        'テスト 花子',
        '1980-05-15',
        '090-1234-5678',
        '山田 太郎',
        '090-8765-4321',
        ARRAY['アレルギー：なし'],
        NOW(),
        NOW()
    );
    
    -- 作成されたユーザーIDを表示
    RAISE NOTICE 'テストユーザーが作成されました。ユーザーID: %', test_user_id;
    
    -- テスト用の基本的な個別化プロフィールも作成
    PERFORM create_personalization_profiles_for_user(test_user_id);
    
    RAISE NOTICE '個別化プロフィールが初期化されました。';
    
END $$; 