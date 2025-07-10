-- =============================================================================
-- Sottori 統合情報プール データベース実行用SQL（修正版）
-- 作成日: 2025年1月3日
-- PostgreSQL immutableエラー対応版
-- =============================================================================

-- =============================================================================
-- STEP 1: 前提条件の確認・準備
-- =============================================================================

-- 日本語全文検索の設定確認
SELECT * FROM pg_ts_config WHERE cfgname = 'japanese';

-- 必要な拡張機能の確認・有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 既存のenum型を確認
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'info_category'
);

-- =============================================================================
-- STEP 2: テーブル作成
-- =============================================================================

-- 情報カテゴリのenumを拡張（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'info_category') THEN
    CREATE TYPE info_category AS ENUM (
      'treatment_options',
      'side_effects', 
      'support_resources',
      'general_cancer_info',
      'hospital_reviews',
      'research_news'
    );
  ELSE
    -- 既存の型に新しい値を追加
    BEGIN
      ALTER TYPE info_category ADD VALUE IF NOT EXISTS 'general_cancer_info';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
      ALTER TYPE info_category ADD VALUE IF NOT EXISTS 'hospital_reviews';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
      ALTER TYPE info_category ADD VALUE IF NOT EXISTS 'research_news';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END
$$;

-- 統合情報プールテーブル作成
CREATE TABLE IF NOT EXISTS information_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本情報
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category info_category NOT NULL,
  
  -- ターゲット対象
  cancer_types TEXT[] NOT NULL DEFAULT '{"all"}',
  stages TEXT[] NOT NULL DEFAULT '{"all"}',
  regions TEXT[] NOT NULL DEFAULT '{"all"}',
  age_groups TEXT[] NOT NULL DEFAULT '{"all"}',
  
  -- ソース情報
  source_type TEXT NOT NULL CHECK (source_type IN ('official', 'medical', 'academic', 'community', 'ai_generated')),
  source_name TEXT NOT NULL,
  source_url TEXT,
  original_publish_date TIMESTAMP,
  
  -- 品質・信頼性
  reliability_score INTEGER NOT NULL CHECK (reliability_score BETWEEN 1 AND 5),
  evidence_level TEXT CHECK (evidence_level IN ('A', 'B', 'C', 'D', 'unknown')),
  peer_reviewed BOOLEAN DEFAULT FALSE,
  
  -- データライフサイクル
  collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_validated_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- メタデータ
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- 検索ベクトル（通常の列として作成）
  search_vector tsvector,
  
  -- 統計情報
  view_count INTEGER DEFAULT 0,
  usefulness_score DECIMAL(3,2) DEFAULT 0.0,
  usefulness_votes INTEGER DEFAULT 0
);

-- 収集タスク実行履歴テーブル
CREATE TABLE IF NOT EXISTS background_collection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- 実行結果
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  items_collected INTEGER DEFAULT 0,
  items_saved INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,
  
  -- エラー情報
  error_message TEXT,
  error_details JSONB,
  
  -- パフォーマンス
  execution_time_ms INTEGER,
  memory_usage_mb DECIMAL,
  
  -- メタデータ
  collection_metadata JSONB DEFAULT '{}'
);

-- =============================================================================
-- STEP 3: 検索ベクトル自動更新のためのトリガー関数
-- =============================================================================

-- 検索ベクトル更新関数
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.summary, '') || ' ' || 
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成（INSERT/UPDATEで自動的に検索ベクトルを更新）
DROP TRIGGER IF EXISTS trigger_update_search_vector ON information_pool;
CREATE TRIGGER trigger_update_search_vector
  BEFORE INSERT OR UPDATE ON information_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- 既存データの検索ベクトルを更新
UPDATE information_pool 
SET search_vector = to_tsvector('simple', 
  COALESCE(title, '') || ' ' || 
  COALESCE(summary, '') || ' ' || 
  COALESCE(content, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
)
WHERE search_vector IS NULL;

-- =============================================================================
-- STEP 4: インデックス作成
-- =============================================================================

-- 複合インデックス（フィルタリング用）
CREATE INDEX IF NOT EXISTS idx_info_pool_filter ON information_pool 
  USING GIN(cancer_types, stages, regions, age_groups);

-- 全文検索インデックス
CREATE INDEX IF NOT EXISTS idx_info_pool_search ON information_pool 
  USING GIN(search_vector);

-- カテゴリ別検索
CREATE INDEX IF NOT EXISTS idx_info_pool_category ON information_pool(category);

-- 信頼度・品質による検索
CREATE INDEX IF NOT EXISTS idx_info_pool_quality ON information_pool(reliability_score, evidence_level);

-- アクティブデータのみの検索
CREATE INDEX IF NOT EXISTS idx_info_pool_active ON information_pool(is_active, collected_at DESC) 
  WHERE is_active = TRUE;

-- ソースタイプ別検索
CREATE INDEX IF NOT EXISTS idx_info_pool_source ON information_pool(source_type, source_name);

-- 有効期限チェック用
CREATE INDEX IF NOT EXISTS idx_info_pool_expiry ON information_pool(expires_at) 
  WHERE expires_at IS NOT NULL;

-- 実行履歴のインデックス
CREATE INDEX IF NOT EXISTS idx_bg_log_task ON background_collection_log(task_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_bg_log_status ON background_collection_log(status, started_at DESC);

-- =============================================================================
-- STEP 5: サンプルデータ挿入
-- =============================================================================

-- サンプルデータ（重複を避けて挿入）
INSERT INTO information_pool (
  title, summary, content, category, 
  cancer_types, stages, regions,
  source_type, source_name, source_url,
  reliability_score, evidence_level
) 
SELECT 
  '乳がんの標準治療について',
  '乳がんの標準的な治療法についてまとめた厚生労働省の公式情報',
  '乳がんの治療は、がんの進行度（ステージ）、がん細胞の性質、患者さんの年齢や体調などを総合的に判断して決められます。主な治療法には手術療法、薬物療法、放射線療法があります。手術療法では、がんの大きさや位置に応じて、乳房温存手術や乳房切除術が選択されます。薬物療法には、化学療法、ホルモン療法、分子標的療法があり、がんの性質に応じて組み合わせて使用されます。',
  'treatment_options'::info_category,
  '{"breast_cancer", "all"}',
  '{"stage_1", "stage_2", "stage_3", "all"}',
  '{"all"}',
  'official',
  'がん情報サービス（厚生労働省）',
  'https://ganjoho.jp/public/cancer/breast/',
  5,
  'A'
WHERE NOT EXISTS (
  SELECT 1 FROM information_pool 
  WHERE title = '乳がんの標準治療について' 
  AND source_name = 'がん情報サービス（厚生労働省）'
);

-- 追加サンプルデータ
INSERT INTO information_pool (
  title, summary, content, category, 
  cancer_types, stages, regions,
  source_type, source_name, source_url,
  reliability_score, evidence_level
) 
SELECT 
  'がん治療の副作用と対処法',
  '抗がん剤治療における主な副作用とその対処方法について',
  '抗がん剤治療では、がん細胞を攻撃するとともに、正常な細胞にも影響を与えることがあります。主な副作用には、吐き気・嘔吐、脱毛、倦怠感、口内炎、下痢、便秘などがあります。これらの副作用は適切な対策により軽減することができます。吐き気には制吐薬の使用、口内炎には口腔ケアの徹底、倦怠感には適度な運動や十分な休息が効果的です。',
  'side_effects'::info_category,
  '{"all"}',
  '{"all"}',
  '{"all"}',
  'official',
  'がん情報サービス（厚生労働省）',
  'https://ganjoho.jp/public/support/side_effects/',
  5,
  'A'
WHERE NOT EXISTS (
  SELECT 1 FROM information_pool 
  WHERE title = 'がん治療の副作用と対処法' 
  AND source_name = 'がん情報サービス（厚生労働省）'
);

-- 肺がんサンプルデータ
INSERT INTO information_pool (
  title, summary, content, category, 
  cancer_types, stages, regions,
  source_type, source_name, source_url,
  reliability_score, evidence_level
) 
SELECT 
  '肺がんの早期発見と検査',
  '肺がんの検査方法と早期発見の重要性について',
  '肺がんは初期症状が少ないため、定期的な検査による早期発見が重要です。主な検査方法には胸部X線検査、CT検査、喀痰細胞診があります。特に50歳以上で喫煙歴のある方は年1回の検査を推奨します。早期に発見できれば治療選択肢が広がり、治療成績も向上します。',
  'treatment_options'::info_category,
  '{"lung_cancer", "all"}',
  '{"stage_1", "stage_2", "all"}',
  '{"all"}',
  'official',
  '国立がん研究センター',
  'https://www.ncc.go.jp/jp/about/cancer_control/screening/',
  5,
  'A'
WHERE NOT EXISTS (
  SELECT 1 FROM information_pool 
  WHERE title = '肺がんの早期発見と検査' 
  AND source_name = '国立がん研究センター'
);

-- =============================================================================
-- 実行完了の確認
-- =============================================================================

-- 作成されたテーブルの確認
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('information_pool', 'background_collection_log');

-- データ件数の確認
SELECT 
  'information_pool' as table_name,
  COUNT(*) as record_count
FROM information_pool
UNION ALL
SELECT 
  'background_collection_log' as table_name,
  COUNT(*) as record_count
FROM background_collection_log;

-- インデックスの確認
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('information_pool', 'background_collection_log')
ORDER BY tablename, indexname;

-- 検索ベクトルが正しく設定されているかの確認
SELECT 
  id, 
  title, 
  search_vector IS NOT NULL as has_search_vector
FROM information_pool 
LIMIT 5;

-- 検索テスト
SELECT 
  title,
  summary,
  ts_rank(search_vector, to_tsquery('simple', '乳がん')) as rank
FROM information_pool 
WHERE search_vector @@ to_tsquery('simple', '乳がん')
ORDER BY rank DESC;

-- 実行完了メッセージ
SELECT '✅ Sottori統合情報プール データベースセットアップ完了!' as setup_status; 