-- 個別化システム テストデータ作成
-- Phase 1: 基盤構築 - システム動作確認用データ

-- =============================================================================
-- サンプルユーザーの取得（既存プロフィールがある場合）
-- =============================================================================

DO $$
DECLARE
    sample_user_id uuid;
    test_info_update_id uuid;
BEGIN
    -- 既存のユーザーIDを取得
    SELECT id INTO sample_user_id FROM profiles LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        
        -- =============================================================================
        -- 1. 個別化プロフィール初期化
        -- =============================================================================
        
        -- 医療プロフィール（乳がん患者のサンプル）
        INSERT INTO user_medical_profiles (
            user_id, cancer_type, stage, diagnosis_date, 
            current_treatment_types, treatment_status, treatment_start_date,
            side_effects_experienced, primary_doctor, hospital, hospital_location
        ) VALUES (
            sample_user_id, 'breast_cancer', 'stage_2', '2024-10-01',
            ARRAY['chemotherapy', 'hormone_therapy'], 'ongoing', '2024-11-01',
            ARRAY['fatigue', 'nausea'], '田中先生', '○○病院', '東京都'
        ) ON CONFLICT (user_id) DO UPDATE SET
            cancer_type = EXCLUDED.cancer_type,
            stage = EXCLUDED.stage,
            diagnosis_date = EXCLUDED.diagnosis_date,
            current_treatment_types = EXCLUDED.current_treatment_types,
            treatment_status = EXCLUDED.treatment_status,
            treatment_start_date = EXCLUDED.treatment_start_date,
            side_effects_experienced = EXCLUDED.side_effects_experienced,
            primary_doctor = EXCLUDED.primary_doctor,
            hospital = EXCLUDED.hospital,
            hospital_location = EXCLUDED.hospital_location;
        
        -- コンテキストプロフィール
        INSERT INTO user_context_profiles (
            user_id, prefecture, city, region, age_range, employment, family_support,
            mobility_limitations, language_preference, technology_comfort
        ) VALUES (
            sample_user_id, '東京都', '新宿区', 'urban', '40-49', 'working', 'high',
            ARRAY[]::text[], 'japanese', 'medium'
        ) ON CONFLICT (user_id) DO UPDATE SET
            prefecture = EXCLUDED.prefecture,
            city = EXCLUDED.city,
            region = EXCLUDED.region,
            age_range = EXCLUDED.age_range,
            employment = EXCLUDED.employment,
            family_support = EXCLUDED.family_support,
            mobility_limitations = EXCLUDED.mobility_limitations,
            language_preference = EXCLUDED.language_preference,
            technology_comfort = EXCLUDED.technology_comfort;
        
        -- 設定プロフィール
        INSERT INTO user_preference_profiles (
            user_id, information_depth, update_frequency, priority_areas,
            communication_style, content_formats, notification_frequency,
            notification_channels, notification_timing
        ) VALUES (
            sample_user_id, 'detailed', 'daily', 
            ARRAY['treatment_options', 'side_effects', 'doctors'],
            'empathetic', ARRAY['text'], 'standard',
            ARRAY['in_app'], ARRAY[9, 12, 18]
        ) ON CONFLICT (user_id) DO UPDATE SET
            information_depth = EXCLUDED.information_depth,
            update_frequency = EXCLUDED.update_frequency,
            priority_areas = EXCLUDED.priority_areas,
            communication_style = EXCLUDED.communication_style,
            content_formats = EXCLUDED.content_formats,
            notification_frequency = EXCLUDED.notification_frequency,
            notification_channels = EXCLUDED.notification_channels,
            notification_timing = EXCLUDED.notification_timing;
        
        -- 行動パターン
        INSERT INTO user_behavior_patterns (
            user_id, active_hours, average_session_duration, frequent_features,
            reading_speed, completion_rate, save_rate
        ) VALUES (
            sample_user_id, ARRAY[9, 12, 15, 18, 21], 15, 
            ARRAY['dashboard', 'info-updates', 'roadmap'],
            'medium', 0.75, 0.30
        ) ON CONFLICT (user_id) DO UPDATE SET
            active_hours = EXCLUDED.active_hours,
            average_session_duration = EXCLUDED.average_session_duration,
            frequent_features = EXCLUDED.frequent_features,
            reading_speed = EXCLUDED.reading_speed,
            completion_rate = EXCLUDED.completion_rate,
            save_rate = EXCLUDED.save_rate;
        
        -- 治療段階
        INSERT INTO user_treatment_phases (
            user_id, current_phase, days_in_phase, 
            next_milestone_type, next_milestone_date, next_milestone_description
        ) VALUES (
            sample_user_id, 'active_treatment', 45,
            'appointment', '2025-01-15', '経過観察の診察'
        ) ON CONFLICT (user_id) DO UPDATE SET
            current_phase = EXCLUDED.current_phase,
            days_in_phase = EXCLUDED.days_in_phase,
            next_milestone_type = EXCLUDED.next_milestone_type,
            next_milestone_date = EXCLUDED.next_milestone_date,
            next_milestone_description = EXCLUDED.next_milestone_description;
        
        -- カテゴリエンゲージメント初期化
        INSERT INTO user_category_engagement (user_id, category) VALUES
        (sample_user_id, 'treatment_options'),
        (sample_user_id, 'doctors'),
        (sample_user_id, 'side_effects'),
        (sample_user_id, 'clinical_trials'),
        (sample_user_id, 'support_resources'),
        (sample_user_id, 'financial_assistance')
        ON CONFLICT (user_id, category) DO NOTHING;
        
        -- エンゲージメントスコア更新
        UPDATE user_category_engagement SET
            engagement_score = CASE 
                WHEN category = 'treatment_options' THEN 85
                WHEN category = 'side_effects' THEN 92
                WHEN category = 'doctors' THEN 78
                WHEN category = 'clinical_trials' THEN 45
                WHEN category = 'support_resources' THEN 60
                WHEN category = 'financial_assistance' THEN 35
                ELSE engagement_score
            END,
            click_count = CASE 
                WHEN category = 'treatment_options' THEN 12
                WHEN category = 'side_effects' THEN 18
                WHEN category = 'doctors' THEN 8
                WHEN category = 'clinical_trials' THEN 3
                WHEN category = 'support_resources' THEN 6
                WHEN category = 'financial_assistance' THEN 2
                ELSE click_count
            END,
            read_count = CASE 
                WHEN category = 'treatment_options' THEN 8
                WHEN category = 'side_effects' THEN 15
                WHEN category = 'doctors' THEN 5
                WHEN category = 'clinical_trials' THEN 2
                WHEN category = 'support_resources' THEN 4
                WHEN category = 'financial_assistance' THEN 1
                ELSE read_count
            END,
            save_count = CASE 
                WHEN category = 'treatment_options' THEN 3
                WHEN category = 'side_effects' THEN 6
                WHEN category = 'doctors' THEN 2
                WHEN category = 'clinical_trials' THEN 1
                WHEN category = 'support_resources' THEN 2
                WHEN category = 'financial_assistance' THEN 0
                ELSE save_count
            END,
            last_accessed = CASE 
                WHEN category IN ('treatment_options', 'side_effects') THEN now() - interval '2 hours'
                WHEN category = 'doctors' THEN now() - interval '1 day'
                WHEN category = 'clinical_trials' THEN now() - interval '3 days'
                WHEN category = 'support_resources' THEN now() - interval '1 week'
                WHEN category = 'financial_assistance' THEN now() - interval '2 weeks'
                ELSE last_accessed
            END
        WHERE user_id = sample_user_id;
        
        -- 現在の関心事
        INSERT INTO user_current_concerns (
            user_id, urgency_level, concern_text, category, is_active
        ) VALUES 
        (sample_user_id, 'immediate', '化学療法の副作用軽減方法', 'side_effects', true),
        (sample_user_id, 'upcoming', '治療後の職場復帰', 'support_resources', true),
        (sample_user_id, 'general', '新しい治療法の情報', 'treatment_options', true)
        ON CONFLICT DO NOTHING;
        
        -- ユーザーセグメント設定
        INSERT INTO user_segments (
            user_id, segment_type, confidence_score, segment_characteristics
        ) VALUES (
            sample_user_id, 'active_treatment', 88,
            jsonb_build_object(
                'classification_method', 'rule_based',
                'key_factors', jsonb_build_array('ongoing_treatment', 'recent_diagnosis'),
                'last_updated', now()
            )
        ) ON CONFLICT (user_id) DO UPDATE SET
            segment_type = EXCLUDED.segment_type,
            confidence_score = EXCLUDED.confidence_score,
            segment_characteristics = EXCLUDED.segment_characteristics;
        
        -- =============================================================================
        -- 2. テスト用情報更新データ（メタデータ付き）
        -- =============================================================================
        
        -- 高関連度情報（乳がん・化学療法・副作用関連）
        INSERT INTO info_updates (
            user_id, category, title, summary, content, source_url,
            priority, metadata
        ) VALUES 
        (
            sample_user_id, 'side_effects', 
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
            sample_user_id, 'treatment_options',
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
            sample_user_id, 'doctors',
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
            sample_user_id, 'clinical_trials',
            '新しい免疫療法の臨床試験が開始',
            '乳がん患者を対象とした新しい免疫療法薬の臨床試験の参加者を募集しています。',
            '臨床試験の詳細...',
            'https://example.com/immunotherapy-trial',
            'medium',
            jsonb_build_object(
                'target_cancer_types', jsonb_build_array('breast_cancer'),
                'target_stages', jsonb_build_array('stage_3', 'stage_4'),
                'related_treatments', jsonb_build_array('immunotherapy'),
                'target_phases', jsonb_build_array('active_treatment'),
                'target_regions', jsonb_build_array('東京都', '神奈川県', '埼玉県'),
                'time_sensitive', true
            )
        ),
        (
            sample_user_id, 'support_resources',
            '職場復帰支援プログラムの申し込み開始',
            'がん治療中・治療後の職場復帰を支援するプログラムの申し込みが開始されました。',
            'プログラムの詳細内容...',
            'https://example.com/workplace-support',
            'medium',
            jsonb_build_object(
                'target_cancer_types', jsonb_build_array('breast_cancer', 'lung_cancer', 'colorectal_cancer'),
                'target_stages', jsonb_build_array('stage_1', 'stage_2', 'stage_3'),
                'related_treatments', jsonb_build_array('chemotherapy', 'radiation', 'surgery'),
                'target_phases', jsonb_build_array('active_treatment', 'post_treatment'),
                'target_regions', jsonb_build_array('東京都'),
                'time_sensitive', false
            )
        );
        
        RAISE NOTICE 'テストデータの作成が完了しました。ユーザーID: %', sample_user_id;
        
    ELSE
        RAISE NOTICE 'テスト対象となるユーザーが見つかりませんでした。先にプロフィールを作成してください。';
    END IF;
END $$; 