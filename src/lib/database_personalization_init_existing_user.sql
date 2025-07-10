-- 既存ユーザーの個別化システム初期化SQL
-- 既存のprofilesとcancer_profilesデータを活用して自動移行

-- =============================================================================
-- 1. 全ての既存ユーザーを個別化システムに移行
-- =============================================================================

DO $$
DECLARE
    user_record RECORD;
    cancer_profile_record RECORD;
BEGIN
    -- 既存のprofilesテーブルのすべてのユーザーを処理
    FOR user_record IN SELECT id FROM profiles LOOP
        
        -- 既存のcancer_profilesデータを取得（存在する場合）
        SELECT * INTO cancer_profile_record 
        FROM cancer_profiles 
        WHERE user_id = user_record.id;
        
        -- user_medical_profilesに移行
        INSERT INTO user_medical_profiles (
            user_id, 
            cancer_type, 
            stage, 
            diagnosis_date,
            current_treatment_types,
            treatment_status,
            treatment_start_date,
            primary_doctor,
            hospital,
            concern_areas,
            priority_concerns,
            notes
        ) VALUES (
            user_record.id,
            COALESCE(cancer_profile_record.cancer_type, 'general_cancer'),
            COALESCE(cancer_profile_record.stage, 'stage_unknown'),
            cancer_profile_record.diagnosis_date,
            COALESCE(cancer_profile_record.current_treatment, ARRAY[]::text[]),
            COALESCE(cancer_profile_record.treatment_status, 'planning'),
            cancer_profile_record.treatment_start_date,
            cancer_profile_record.primary_doctor,
            cancer_profile_record.hospital,
            COALESCE(cancer_profile_record.concern_areas, ARRAY['treatment_options', 'doctors']::text[]),
            COALESCE(cancer_profile_record.priority_concerns, ARRAY['treatment_options']::text[]),
            cancer_profile_record.notes
        ) ON CONFLICT (user_id) DO UPDATE SET
            cancer_type = EXCLUDED.cancer_type,
            stage = EXCLUDED.stage,
            diagnosis_date = EXCLUDED.diagnosis_date,
            current_treatment_types = EXCLUDED.current_treatment_types,
            treatment_status = EXCLUDED.treatment_status,
            treatment_start_date = EXCLUDED.treatment_start_date,
            primary_doctor = EXCLUDED.primary_doctor,
            hospital = EXCLUDED.hospital,
            concern_areas = EXCLUDED.concern_areas,
            priority_concerns = EXCLUDED.priority_concerns,
            notes = EXCLUDED.notes,
            updated_at = NOW();
        
        -- user_context_profilesのデフォルト値を設定
        INSERT INTO user_context_profiles (
            user_id,
            prefecture,
            region,
            age_range,
            employment,
            family_support,
            technology_comfort
        ) VALUES (
            user_record.id,
            '東京都', -- デフォルト値
            'urban',
            '40-49', -- デフォルト値
            'working',
            'medium',
            'medium'
        ) ON CONFLICT (user_id) DO NOTHING;
        
        -- user_preference_profilesの設定
        INSERT INTO user_preference_profiles (
            user_id,
            information_depth,
            update_frequency,
            priority_areas,
            communication_style,
            content_formats
        ) VALUES (
            user_record.id,
            'detailed',
            'daily',
            COALESCE(cancer_profile_record.concern_areas, ARRAY['treatment_options', 'doctors']::text[]),
            'empathetic',
            ARRAY['text']::text[]
        ) ON CONFLICT (user_id) DO UPDATE SET
            priority_areas = EXCLUDED.priority_areas,
            updated_at = NOW();
        
        -- user_behavior_patternsの初期化
        INSERT INTO user_behavior_patterns (
            user_id,
            session_frequency,
            avg_session_duration,
            peak_usage_hours,
            preferred_content_length
        ) VALUES (
            user_record.id,
            3, -- 週3回
            15, -- 15分
            ARRAY[9, 12, 18]::integer[], -- 朝・昼・夕方
            'medium'
        ) ON CONFLICT (user_id) DO NOTHING;
        
        -- user_treatment_phasesの初期化
        INSERT INTO user_treatment_phases (
            user_id,
            current_phase,
            days_in_phase
        ) VALUES (
            user_record.id,
            CASE 
                WHEN cancer_profile_record.treatment_status = 'completed' THEN 'post_treatment'
                WHEN cancer_profile_record.treatment_status = 'ongoing' THEN 'active_treatment'
                ELSE 'pre_treatment'
            END,
            CASE 
                WHEN cancer_profile_record.treatment_start_date IS NOT NULL 
                THEN EXTRACT(days FROM NOW() - cancer_profile_record.treatment_start_date)::integer
                ELSE 0
            END
        ) ON CONFLICT (user_id) DO UPDATE SET
            current_phase = EXCLUDED.current_phase,
            days_in_phase = EXCLUDED.days_in_phase,
            updated_at = NOW();
        
        -- 基本的なカテゴリエンゲージメントの初期化
        INSERT INTO user_category_engagement (user_id, category, engagement_score, last_accessed)
        SELECT 
            user_record.id,
            category_name,
            CASE 
                WHEN category_name = ANY(COALESCE(cancer_profile_record.concern_areas, ARRAY[]::text[])) THEN 70
                ELSE 50
            END,
            NOW() - INTERVAL '7 days'
        FROM (
            VALUES 
                ('treatment_options'),
                ('doctors'),
                ('side_effects'),
                ('clinical_trials'),
                ('support_resources'),
                ('financial_assistance')
        ) AS categories(category_name)
        ON CONFLICT (user_id, category) DO UPDATE SET
            engagement_score = EXCLUDED.engagement_score,
            last_accessed = EXCLUDED.last_accessed;
        
        RAISE NOTICE 'ユーザー % の個別化プロフィール移行完了', user_record.id;
        
    END LOOP;
    
    RAISE NOTICE '全ユーザーの個別化システム移行が完了しました';
END $$;

-- =============================================================================
-- 2. 移行状況の確認
-- =============================================================================

-- 移行状況レポート
SELECT 
    'profiles' as table_name,
    count(*) as total_users
FROM profiles
UNION ALL
SELECT 
    'user_medical_profiles' as table_name,
    count(*) as migrated_users
FROM user_medical_profiles
UNION ALL
SELECT 
    'user_context_profiles' as table_name,
    count(*) as context_profiles
FROM user_context_profiles
UNION ALL
SELECT 
    'user_preference_profiles' as table_name,
    count(*) as preference_profiles
FROM user_preference_profiles
UNION ALL
SELECT 
    'user_behavior_patterns' as table_name,
    count(*) as behavior_patterns
FROM user_behavior_patterns
UNION ALL
SELECT 
    'user_treatment_phases' as table_name,
    count(*) as treatment_phases
FROM user_treatment_phases;

-- =============================================================================
-- 3. サンプルデータの確認
-- =============================================================================

-- 移行されたユーザーのサンプル確認（最初の1ユーザー）
SELECT 
    p.id as user_id,
    ump.cancer_type,
    ump.stage,
    ump.concern_areas,
    ucp.prefecture,
    upp.information_depth,
    utp.current_phase
FROM profiles p
LEFT JOIN user_medical_profiles ump ON p.id = ump.user_id
LEFT JOIN user_context_profiles ucp ON p.id = ucp.user_id  
LEFT JOIN user_preference_profiles upp ON p.id = upp.user_id
LEFT JOIN user_treatment_phases utp ON p.id = utp.user_id
LIMIT 1; 