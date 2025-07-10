-- =============================================================================
-- Sottori structured_content_pool テーブル拡張
-- cancer_types, stages, age_groups カラム追加
-- 作成日: 2025年1月3日
-- =============================================================================

-- =============================================================================
-- 1. structured_content_poolテーブルにカラム追加
-- =============================================================================

-- がん種カラム追加
ALTER TABLE structured_content_pool 
ADD COLUMN IF NOT EXISTS cancer_types TEXT[] NOT NULL DEFAULT '{"all"}';

-- ステージカラム追加
ALTER TABLE structured_content_pool 
ADD COLUMN IF NOT EXISTS stages TEXT[] NOT NULL DEFAULT '{"all"}';

-- 年齢層カラム追加
ALTER TABLE structured_content_pool 
ADD COLUMN IF NOT EXISTS age_groups TEXT[] NOT NULL DEFAULT '{"all"}';

-- 地域カラム追加（information_poolとの一貫性のため）
ALTER TABLE structured_content_pool 
ADD COLUMN IF NOT EXISTS regions TEXT[] NOT NULL DEFAULT '{"all"}';

-- =============================================================================
-- 2. インデックス作成（フィルタリング用）
-- =============================================================================

-- 複合インデックス（フィルタリング用）
CREATE INDEX IF NOT EXISTS idx_structured_content_filter ON structured_content_pool 
  USING GIN(cancer_types, stages, regions, age_groups);

-- 個別インデックス（単一条件検索用）
CREATE INDEX IF NOT EXISTS idx_structured_content_cancer_types ON structured_content_pool 
  USING GIN(cancer_types);

CREATE INDEX IF NOT EXISTS idx_structured_content_stages ON structured_content_pool 
  USING GIN(stages);

CREATE INDEX IF NOT EXISTS idx_structured_content_age_groups ON structured_content_pool 
  USING GIN(age_groups);

CREATE INDEX IF NOT EXISTS idx_structured_content_regions ON structured_content_pool 
  USING GIN(regions);

-- =============================================================================
-- 3. 既存データの更新（デフォルト値設定）
-- =============================================================================

-- 既存データにデフォルト値を設定
UPDATE structured_content_pool 
SET 
  cancer_types = '{"all"}'::TEXT[],
  stages = '{"all"}'::TEXT[],
  age_groups = '{"all"}'::TEXT[],
  regions = '{"all"}'::TEXT[]
WHERE cancer_types IS NULL 
   OR stages IS NULL 
   OR age_groups IS NULL 
   OR regions IS NULL;

-- =============================================================================
-- 4. 検索ベクトル更新関数の修正
-- =============================================================================

-- 既存のトリガー関数を更新して新しいカラムを含める
CREATE OR REPLACE FUNCTION update_structured_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- 品質スコアの自動計算
  NEW.quality_score = NEW.reliability_score * NEW.relevance_score / 20;
  
  -- 検索ベクトルの自動更新（新しいカラムを含む）
  NEW.search_vector = 
    setweight(to_tsvector('japanese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('japanese', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('japanese', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('japanese', COALESCE(array_to_string(NEW.cancer_types, ' '), '')), 'D') ||
    setweight(to_tsvector('japanese', COALESCE(array_to_string(NEW.stages, ' '), '')), 'D') ||
    setweight(to_tsvector('japanese', COALESCE(array_to_string(NEW.age_groups, ' '), '')), 'D');
  
  -- アクティブ状態の自動更新
  NEW.is_active = (NEW.expires_at IS NULL OR NEW.expires_at > NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. ユーティリティ関数
-- =============================================================================

-- がん種・ステージ・年齢層によるフィルタリング関数
CREATE OR REPLACE FUNCTION filter_structured_content_by_criteria(
  p_cancer_types TEXT[] DEFAULT NULL,
  p_stages TEXT[] DEFAULT NULL,
  p_age_groups TEXT[] DEFAULT NULL,
  p_regions TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  content TEXT,
  category TEXT,
  cancer_types TEXT[],
  stages TEXT[],
  age_groups TEXT[],
  regions TEXT[],
  reliability_score INTEGER,
  relevance_score INTEGER,
  quality_score INTEGER,
  tags TEXT[],
  evidence_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    scp.id,
    scp.title,
    scp.summary,
    scp.content,
    scp.category,
    scp.cancer_types,
    scp.stages,
    scp.age_groups,
    scp.regions,
    scp.reliability_score,
    scp.relevance_score,
    scp.quality_score,
    scp.tags,
    scp.evidence_level,
    scp.created_at
  FROM structured_content_pool scp
  WHERE scp.is_active = true
    AND (p_cancer_types IS NULL OR 
         scp.cancer_types && p_cancer_types OR 
         'all' = ANY(scp.cancer_types))
    AND (p_stages IS NULL OR 
         scp.stages && p_stages OR 
         'all' = ANY(scp.stages))
    AND (p_age_groups IS NULL OR 
         scp.age_groups && p_age_groups OR 
         'all' = ANY(scp.age_groups))
    AND (p_regions IS NULL OR 
         scp.regions && p_regions OR 
         'all' = ANY(scp.regions))
  ORDER BY scp.quality_score DESC NULLS LAST, scp.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. サンプルデータ更新（既存データの改善）
-- =============================================================================

-- 既存のサンプルデータを新しいカラムで更新
UPDATE structured_content_pool 
SET 
  cancer_types = CASE 
    WHEN title ILIKE '%乳がん%' OR content ILIKE '%乳がん%' THEN '{"breast_cancer", "all"}'::TEXT[]
    WHEN title ILIKE '%肺がん%' OR content ILIKE '%肺がん%' THEN '{"lung_cancer", "all"}'::TEXT[]
    WHEN title ILIKE '%胃がん%' OR content ILIKE '%胃がん%' THEN '{"stomach_cancer", "all"}'::TEXT[]
    WHEN title ILIKE '%大腸がん%' OR content ILIKE '%大腸がん%' THEN '{"colorectal_cancer", "all"}'::TEXT[]
    ELSE '{"all"}'::TEXT[]
  END,
  stages = CASE 
    WHEN title ILIKE '%早期%' OR content ILIKE '%早期%' THEN '{"stage_1", "stage_2", "all"}'::TEXT[]
    WHEN title ILIKE '%進行%' OR content ILIKE '%進行%' THEN '{"stage_3", "stage_4", "all"}'::TEXT[]
    ELSE '{"all"}'::TEXT[]
  END,
  age_groups = '{"all"}'::TEXT[],
  regions = '{"all"}'::TEXT[]
WHERE cancer_types = '{"all"}'::TEXT[] 
  AND stages = '{"all"}'::TEXT[] 
  AND age_groups = '{"all"}'::TEXT[] 
  AND regions = '{"all"}'::TEXT[];

-- =============================================================================
-- 7. 完了メッセージ
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'structured_content_pool テーブル拡張完了';
  RAISE NOTICE '========================================';
  RAISE NOTICE '追加されたカラム:';
  RAISE NOTICE '- cancer_types (TEXT[])';
  RAISE NOTICE '- stages (TEXT[])';
  RAISE NOTICE '- age_groups (TEXT[])';
  RAISE NOTICE '- regions (TEXT[])';
  RAISE NOTICE '';
  RAISE NOTICE '作成されたインデックス:';
  RAISE NOTICE '- idx_structured_content_filter (複合GIN)';
  RAISE NOTICE '- idx_structured_content_cancer_types (GIN)';
  RAISE NOTICE '- idx_structured_content_stages (GIN)';
  RAISE NOTICE '- idx_structured_content_age_groups (GIN)';
  RAISE NOTICE '- idx_structured_content_regions (GIN)';
  RAISE NOTICE '';
  RAISE NOTICE '作成された関数:';
  RAISE NOTICE '- filter_structured_content_by_criteria()';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ:';
  RAISE NOTICE '1. AIプロンプトの更新';
  RAISE NOTICE '2. 型定義の更新';
  RAISE NOTICE '3. サービスクラスの更新';
  RAISE NOTICE '========================================';
END $$; 