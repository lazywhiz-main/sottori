-- 既存ユーザー用の個別化テストデータ投入
-- 既にprofilesテーブルに存在するユーザーIDを使用

-- 注意：以下の'EXISTING_USER_ID'を実際のユーザーIDに置き換えてください

DO $$
DECLARE
    existing_user_id UUID := 'EXISTING_USER_ID'; -- ここを実際のIDに置き換え
BEGIN
    -- ユーザーが存在するかチェック
    IF NOT EXISTS(SELECT 1 FROM profiles WHERE id = existing_user_id) THEN
        RAISE EXCEPTION 'ユーザーID % がprofilesテーブルに存在しません', existing_user_id;
    END IF;

    -- 医療プロフィールの詳細設定（乳がんの治療例）
    UPDATE user_medical_profiles 
    SET 
        cancer_type = 'breast_cancer',
        cancer_stage = 'stage_2',
        diagnosis_date = '2024-03-15'::date,
        current_treatments = ARRAY['chemotherapy', 'hormone_therapy'],
        completed_treatments = ARRAY['surgery'],
        planned_treatments = ARRAY['radiation_therapy'],
        side_effects = ARRAY['fatigue', 'nausea'],
        allergies = ARRAY['なし'],
        medical_history = ARRAY['高血圧'],
        medications = ARRAY['タモキシフェン', 'ハーセプチン'],
        doctor_names = ARRAY['田中先生', '佐藤先生'],
        hospital_name = '都立病院',
        updated_at = NOW()
    WHERE user_id = existing_user_id;

    -- 文脈プロフィールの設定
    UPDATE user_context_profiles 
    SET 
        age_range = '40-49',
        location_prefecture = '東京都',
        location_city = '新宿区',
        family_situation = 'married_with_children',
        work_status = 'full_time',
        support_system = ARRAY['family', 'friends', 'medical_team'],
        updated_at = NOW()
    WHERE user_id = existing_user_id;

    -- 設定プロフィール
    UPDATE user_preference_profiles 
    SET 
        preferred_categories = ARRAY['treatment_options', 'side_effects', 'support_resources'],
        content_format_preferences = ARRAY['text', 'video'],
        notification_frequency = 'weekly',
        privacy_level = 'moderate',
        language = 'ja',
        updated_at = NOW()
    WHERE user_id = existing_user_id;

    -- 治療フェーズの設定
    UPDATE user_treatment_phases 
    SET 
        current_phase = 'active_treatment',
        phase_start_date = '2024-04-01'::date,
        phase_details = jsonb_build_object(
            'treatment_type', 'chemotherapy',
            'cycle_number', 4,
            'total_cycles', 8,
            'next_appointment', '2024-07-15'
        ),
        updated_at = NOW()
    WHERE user_id = existing_user_id;

    -- 現在の関心事
    INSERT INTO user_current_concerns (user_id, concern_category, concern_description, priority_level, created_at)
    VALUES 
    (existing_user_id, 'side_effects', '化学療法の副作用について', 'high', NOW()),
    (existing_user_id, 'treatment_options', '今後の治療選択肢', 'medium', NOW()),
    (existing_user_id, 'support_resources', '職場復帰について', 'medium', NOW()),
    (existing_user_id, 'lifestyle', '食事と運動', 'low', NOW());

    -- カテゴリエンゲージメント履歴
    INSERT INTO user_category_engagement (user_id, category, engagement_score, last_interaction, interaction_count, created_at)
    VALUES 
    (existing_user_id, 'side_effects', 85, NOW() - INTERVAL '2 days', 12, NOW() - INTERVAL '30 days'),
    (existing_user_id, 'treatment_options', 70, NOW() - INTERVAL '5 days', 8, NOW() - INTERVAL '30 days'),
    (existing_user_id, 'support_resources', 60, NOW() - INTERVAL '7 days', 5, NOW() - INTERVAL '30 days'),
    (existing_user_id, 'doctors', 40, NOW() - INTERVAL '10 days', 3, NOW() - INTERVAL '30 days'),
    (existing_user_id, 'clinical_trials', 20, NOW() - INTERVAL '15 days', 1, NOW() - INTERVAL '30 days');

    RAISE NOTICE '既存ユーザー % の個別化テストデータが投入されました', existing_user_id;

END $$;

-- 情報更新のテストデータ（メタデータ付き）
INSERT INTO info_updates (
    user_id, category, title, summary, content, source_url,
    priority, metadata
) VALUES 
(
    'EXISTING_USER_ID', -- ここも同じIDに置き換え
    'side_effects', 
    '化学療法中の吐き気対策：最新ガイドライン2025年版',
    '乳がん化学療法における吐き気・嘔吐の予防と対処法について、2025年に更新されたガイドラインに基づく最新情報をお伝えします。',
    '詳細な対処法の内容がここに入ります...',
    'https://example.com/nausea-guide-2025',
    'high',
    jsonb_build_object(
        'target_cancer_types', jsonb_build_array('breast_cancer'),
        'target_stages', jsonb_build_array('stage_1', 'stage_2', 'stage_3'),
        'related_treatments', jsonb_build_array('chemotherapy'),
        'target_phases', jsonb_build_array('active_treatment'),
        'target_regions', jsonb_build_array('東京都'),
        'time_sensitive', true
    )
),
(
    'EXISTING_USER_ID', -- ここも同じIDに置き換え
    'treatment_options',
    '乳がんホルモン療法の新しい選択肢が承認されました',
    '従来の治療法に加え、副作用が少ない新しいホルモン療法薬が承認され、治療選択肢が広がりました。',
    '新薬の詳細情報...',
    'https://example.com/new-hormone-therapy',
    'high',
    jsonb_build_object(
        'target_cancer_types', jsonb_build_array('breast_cancer'),
        'target_stages', jsonb_build_array('stage_1', 'stage_2'),
        'related_treatments', jsonb_build_array('hormone_therapy'),
        'target_phases', jsonb_build_array('active_treatment', 'post_treatment'),
        'target_regions', jsonb_build_array('東京都', '神奈川県'),
        'time_sensitive', false
    )
),
(
    'EXISTING_USER_ID', -- ここも同じIDに置き換え
    'doctors',
    '新宿区に新しいがん専門クリニックが開院',
    '経験豊富な乳がん専門医が常駐する新しいクリニックが新宿区に開院しました。',
    'クリニックの詳細情報...',
    'https://example.com/new-clinic-shinjuku',
    'medium',
    jsonb_build_object(
        'target_cancer_types', jsonb_build_array('breast_cancer', 'lung_cancer'),
        'target_stages', jsonb_build_array('stage_1', 'stage_2', 'stage_3'),
        'related_treatments', jsonb_build_array('chemotherapy', 'hormone_therapy', 'surgery'),
        'target_phases', jsonb_build_array('pre_treatment', 'active_treatment', 'post_treatment'),
        'target_regions', jsonb_build_array('東京都'),
        'time_sensitive', false
    )
),
(
    'EXISTING_USER_ID', -- ここも同じIDに置き換え
    'clinical_trials',
    '乳がん新薬の臨床試験参加者募集中',
    'Stage2-3の乳がん患者を対象とした新しい分子標的薬の臨床試験が開始されます。',
    '臨床試験の詳細...',
    'https://example.com/clinical-trial-breast-cancer',
    'medium',
    jsonb_build_object(
        'target_cancer_types', jsonb_build_array('breast_cancer'),
        'target_stages', jsonb_build_array('stage_2', 'stage_3'),
        'related_treatments', jsonb_build_array('targeted_therapy'),
        'target_phases', jsonb_build_array('active_treatment'),
        'target_regions', jsonb_build_array('関東'),
        'time_sensitive', true
    )
),
(
    'EXISTING_USER_ID', -- ここも同じIDに置き換え
    'support_resources',
    '職場復帰支援プログラムの申し込み開始',
    'がん治療中・治療後の職場復帰を支援するプログラムの2024年度申し込みが開始されました。',
    'プログラムの詳細内容...',
    'https://example.com/workplace-support',
    'medium',
    jsonb_build_object(
        'target_phases', jsonb_build_array('active_treatment', 'post_treatment'),
        'target_regions', jsonb_build_array('全国'),
        'time_sensitive', false,
        'application_deadline', '2024-08-31'
    )
); 