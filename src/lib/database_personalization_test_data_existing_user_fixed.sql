-- 既存ユーザー用の個別化テストデータ投入（修正版）
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
        stage = 'stage_2',
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
        prefecture = '東京都',
        city = '新宿区',
        family_situation = 'married_with_children',
        work_status = 'full_time',
        support_system = ARRAY['family', 'friends', 'medical_team'],
        updated_at = NOW()
    WHERE user_id = existing_user_id;

    -- 設定プロフィール
    UPDATE user_preference_profiles 
    SET 
        information_depth = 'standard',
        update_frequency = 'weekly',
        priority_areas = ARRAY['treatment_options', 'side_effects', 'support_resources'],
        communication_style = 'empathetic',
        content_formats = ARRAY['text'],
        notification_frequency = 'standard',
        notification_channels = ARRAY['in_app'],
        notification_timing = ARRAY[9,12,18],
        updated_at = NOW()
    WHERE user_id = existing_user_id;

    -- 治療フェーズの設定
    UPDATE user_treatment_phases 
    SET 
        current_phase = 'active_treatment',
        days_in_phase = 90,
        next_milestone_type = 'appointment',
        next_milestone_date = '2024-07-15'::date,
        next_milestone_description = '化学療法第5サイクル',
        updated_at = NOW()
    WHERE user_id = existing_user_id;

    -- 現在の関心事（修正されたフィールド名）
    INSERT INTO user_current_concerns (user_id, urgency_level, concern_text, category, created_at)
    VALUES 
    (existing_user_id, 'immediate', '化学療法の副作用について', 'side_effects', NOW()),
    (existing_user_id, 'upcoming', '今後の治療選択肢', 'treatment_options', NOW()),
    (existing_user_id, 'general', '職場復帰について', 'support_resources', NOW()),
    (existing_user_id, 'general', '食事と運動', 'support_resources', NOW());

    -- カテゴリエンゲージメント履歴
    UPDATE user_category_engagement 
    SET 
        engagement_score = CASE 
            WHEN category = 'side_effects' THEN 85
            WHEN category = 'treatment_options' THEN 70
            WHEN category = 'support_resources' THEN 60
            WHEN category = 'doctors' THEN 40
            WHEN category = 'clinical_trials' THEN 20
            ELSE 0
        END,
        click_count = CASE 
            WHEN category = 'side_effects' THEN 12
            WHEN category = 'treatment_options' THEN 8
            WHEN category = 'support_resources' THEN 5
            WHEN category = 'doctors' THEN 3
            WHEN category = 'clinical_trials' THEN 1
            ELSE 0
        END,
        read_count = CASE 
            WHEN category = 'side_effects' THEN 10
            WHEN category = 'treatment_options' THEN 6
            WHEN category = 'support_resources' THEN 4
            WHEN category = 'doctors' THEN 2
            WHEN category = 'clinical_trials' THEN 1
            ELSE 0
        END,
        last_accessed = CASE 
            WHEN category = 'side_effects' THEN NOW() - INTERVAL '2 days'
            WHEN category = 'treatment_options' THEN NOW() - INTERVAL '5 days'
            WHEN category = 'support_resources' THEN NOW() - INTERVAL '7 days'
            WHEN category = 'doctors' THEN NOW() - INTERVAL '10 days'
            WHEN category = 'clinical_trials' THEN NOW() - INTERVAL '15 days'
            ELSE NOW() - INTERVAL '30 days'
        END,
        updated_at = NOW()
    WHERE user_id = existing_user_id;

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