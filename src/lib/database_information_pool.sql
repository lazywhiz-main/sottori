-- =============================================================================
-- Sottori 統合情報プール（information_pool）テーブル
-- Phase 2: データベース設計・実装
-- =============================================================================

-- 情報カテゴリのenumを拡張
ALTER TYPE info_category ADD VALUE IF NOT EXISTS 'general_cancer_info';
ALTER TYPE info_category ADD VALUE IF NOT EXISTS 'hospital_reviews';
ALTER TYPE info_category ADD VALUE IF NOT EXISTS 'research_news';

-- 統合情報プールテーブル
CREATE TABLE IF NOT EXISTS information_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本情報
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category info_category NOT NULL,
  
  -- ターゲット対象
  cancer_types TEXT[] NOT NULL DEFAULT '{"all"}',      -- がん種: 'breast', 'lung', 'stomach', 'all'
  stages TEXT[] NOT NULL DEFAULT '{"all"}',            -- ステージ: 'stage_1', 'stage_2', 'stage_3', 'stage_4', 'all'
  regions TEXT[] NOT NULL DEFAULT '{"all"}',           -- 地域: 'tokyo', 'osaka', 'kanto', 'all'
  age_groups TEXT[] NOT NULL DEFAULT '{"all"}',        -- 年齢層: '20s', '30s', '40s', '50s', '60s', 'all'
  
  -- ソース情報
  source_type TEXT NOT NULL CHECK (source_type IN ('official', 'medical', 'academic', 'community', 'ai_generated')),
  source_name TEXT NOT NULL,                           -- 'ganjoho.jp', 'ncc.go.jp', 'jco.ascopubs.org'
  source_url TEXT,
  original_publish_date TIMESTAMP,                     -- 元の公開日
  
  -- 品質・信頼性
  reliability_score INTEGER NOT NULL CHECK (reliability_score BETWEEN 1 AND 5), -- 1:低 - 5:高
  evidence_level TEXT CHECK (evidence_level IN ('A', 'B', 'C', 'D', 'unknown')), -- エビデンスレベル
  peer_reviewed BOOLEAN DEFAULT FALSE,                 -- 査読済みかどうか
  
  -- データライフサイクル
  collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_validated_at TIMESTAMP,                         -- 最後に検証された日時
  expires_at TIMESTAMP,                                -- 有効期限
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- メタデータ
  metadata JSONB DEFAULT '{}',                         -- 追加のメタデータ
  tags TEXT[] DEFAULT '{}',                            -- タグ
  
  -- 検索・パフォーマンス
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('japanese', 
      COALESCE(title, '') || ' ' || 
      COALESCE(summary, '') || ' ' || 
      COALESCE(content, '') || ' ' ||
      COALESCE(array_to_string(tags, ' '), '')
    )
  ) STORED,
  
  -- 統計情報
  view_count INTEGER DEFAULT 0,
  usefulness_score DECIMAL(3,2) DEFAULT 0.0,          -- ユーザー評価（0.0-5.0）
  usefulness_votes INTEGER DEFAULT 0
);

-- =============================================================================
-- インデックス（高速検索用）
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

-- =============================================================================
-- 収集タスク実行履歴テーブル
-- =============================================================================

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

-- 実行履歴のインデックス
CREATE INDEX IF NOT EXISTS idx_bg_log_task ON background_collection_log(task_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_bg_log_status ON background_collection_log(status, started_at DESC);

-- サンプルデータ
INSERT INTO information_pool (
  title, summary, content, category, 
  cancer_types, stages, regions,
  source_type, source_name, source_url,
  reliability_score, evidence_level
) VALUES 
(
  '乳がんの標準治療について',
  '乳がんの標準的な治療法についてまとめた厚生労働省の公式情報',
  '乳がんの治療は、がんの進行度（ステージ）、がん細胞の性質、患者さんの年齢や体調などを総合的に判断して決められます。主な治療法には手術療法、薬物療法、放射線療法があります。',
  'treatment_options',
  '{"breast_cancer", "all"}',
  '{"stage_1", "stage_2", "stage_3", "all"}',
  '{"all"}',
  'official',
  'がん情報サービス（厚生労働省）',
  'https://ganjoho.jp/public/cancer/breast/',
  5,
  'A'
) ON CONFLICT DO NOTHING;
