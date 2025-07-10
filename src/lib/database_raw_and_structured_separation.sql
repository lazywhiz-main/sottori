-- =============================================================================
-- Sottori ローデータ・構造化データ分離設計
-- 作成日: 2025年1月3日
-- 持続可能なデータ処理パイプライン設計
-- =============================================================================

-- =============================================================================
-- 0. 日本語テキスト検索設定
-- =============================================================================

-- 日本語テキスト検索設定の作成（pg_trgm拡張が必要）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 日本語テキスト検索設定の作成
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'japanese') THEN
    -- 日本語設定が存在しない場合は、simple設定を使用
    CREATE TEXT SEARCH CONFIGURATION japanese (COPY = simple);
  END IF;
END
$$;

-- =============================================================================
-- 1. ローデータテーブル（スクレイピング結果の保存）
-- =============================================================================

CREATE TABLE IF NOT EXISTS raw_content_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 収集情報
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('official', 'medical', 'academic', 'community')),
  content_type TEXT NOT NULL CHECK (content_type IN ('html', 'pdf', 'api_response', 'rss')),
  
  -- ローデータ
  raw_content TEXT NOT NULL,                           -- HTML、PDF、API応答等の生データ
  content_hash TEXT NOT NULL,                          -- 重複検出用ハッシュ
  content_length INTEGER NOT NULL,                     -- コンテンツサイズ
  
  -- メタデータ
  extracted_title TEXT,                                -- HTMLから抽出したタイトル
  extracted_metadata JSONB,                            -- 抽出されたメタデータ
  paragraph_count INTEGER DEFAULT 0,                   -- 段落数（品質指標）
  heading_count INTEGER DEFAULT 0,                     -- 見出し数（品質指標）
  
  -- 処理状態
  processing_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  processing_attempts INTEGER DEFAULT 0,               -- 処理試行回数
  last_processing_error TEXT,                          -- 最後のエラーメッセージ
  
  -- キャッシュ管理
  is_cached BOOLEAN DEFAULT false,                     -- キャッシュフラグ
  cache_expires_at TIMESTAMP WITH TIME ZONE,           -- キャッシュ有効期限
  
  -- タイムスタンプ
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 制約
  UNIQUE(source_url, content_hash)
);

-- =============================================================================
-- 2. 構造化データテーブル（AI処理結果の保存）
-- =============================================================================

CREATE TABLE IF NOT EXISTS structured_content_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_content_id UUID NOT NULL REFERENCES raw_content_pool(id) ON DELETE CASCADE,
  
  -- 基本情報
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('treatment_options', 'diagnosis', 'support_resources', 'lifestyle', 'research_news')),
  
  -- 品質スコア
  reliability_score INTEGER NOT NULL CHECK (reliability_score BETWEEN 1 AND 5),
  relevance_score INTEGER NOT NULL CHECK (relevance_score BETWEEN 1 AND 100),
  quality_score INTEGER,
  
  -- 構造化メタデータ
  structured_data JSONB,                               -- AI構造化の詳細結果
  tags TEXT[],                                         -- タグ配列
  key_points TEXT[],                                   -- 重要ポイント
  evidence_level TEXT,                                 -- エビデンスレベル（医学会ガイドライン用）
  
  -- 検索最適化
  search_vector tsvector,
  
  -- 有効期限管理
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  
  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. 処理キュー管理テーブル
-- =============================================================================

CREATE TABLE IF NOT EXISTS content_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_content_id UUID NOT NULL REFERENCES raw_content_pool(id) ON DELETE CASCADE,
  
  -- キュー情報
  queue_type TEXT NOT NULL CHECK (queue_type IN ('initial_processing', 'reprocessing', 'quality_improvement')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1=最高優先度
  
  -- 処理設定
  target_category TEXT,                                -- 対象カテゴリ
  processing_config JSONB,                             -- 処理設定
  
  -- キュー状態
  status TEXT NOT NULL DEFAULT 'queued' 
    CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,                          -- 試行回数
  max_attempts INTEGER DEFAULT 3,                      -- 最大試行回数
  
  -- スケジュール
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- エラー情報
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  
  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 4. 互換性ビュー（既存コード対応）
-- =============================================================================

-- 既存のinformation_poolテーブルがある場合は削除
DROP TABLE IF EXISTS information_pool CASCADE;

-- 互換性ビューの作成
CREATE OR REPLACE VIEW information_pool AS
SELECT 
  s.id,
  s.title,
  s.summary,
  s.content,
  s.category,
  r.source_url,
  r.source_name as source_type,
  s.reliability_score,
  s.relevance_score,
  s.quality_score,
  s.tags,
  s.last_updated,
  s.expires_at,
  s.is_active,
  s.created_at
FROM structured_content_pool s
JOIN raw_content_pool r ON s.raw_content_id = r.id
WHERE s.is_active = true;

-- =============================================================================
-- 5. 品質管理関数
-- =============================================================================

-- 処理失敗統計取得
CREATE OR REPLACE FUNCTION get_processing_failure_stats()
RETURNS TABLE (
  total_raw INTEGER,
  pending INTEGER,
  processing INTEGER,
  completed INTEGER,
  failed INTEGER,
  skipped INTEGER,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_raw,
    COUNT(*) FILTER (WHERE processing_status = 'pending')::INTEGER as pending,
    COUNT(*) FILTER (WHERE processing_status = 'processing')::INTEGER as processing,
    COUNT(*) FILTER (WHERE processing_status = 'completed')::INTEGER as completed,
    COUNT(*) FILTER (WHERE processing_status = 'failed')::INTEGER as failed,
    COUNT(*) FILTER (WHERE processing_status = 'skipped')::INTEGER as skipped,
    ROUND(
      (COUNT(*) FILTER (WHERE processing_status = 'completed')::NUMERIC / 
       COUNT(*) FILTER (WHERE processing_status IN ('completed', 'failed'))::NUMERIC) * 100, 2
    ) as success_rate
  FROM raw_content_pool;
END;
$$ LANGUAGE plpgsql;

-- 再処理キュー追加
CREATE OR REPLACE FUNCTION queue_for_reprocessing(raw_content_id UUID)
RETURNS UUID AS $$
DECLARE
  queue_id UUID;
BEGIN
  INSERT INTO content_processing_queue (
    raw_content_id, 
    queue_type, 
    priority, 
    status
  ) VALUES (
    raw_content_id, 
    'reprocessing', 
    8, -- 高優先度
    'queued'
  ) RETURNING id INTO queue_id;
  
  -- ローデータの状態をリセット
  UPDATE raw_content_pool 
  SET processing_status = 'pending', 
      processing_attempts = 0,
      last_processing_error = NULL,
      updated_at = NOW()
  WHERE id = raw_content_id;
  
  RETURN queue_id;
END;
$$ LANGUAGE plpgsql;

-- 品質スコア更新
CREATE OR REPLACE FUNCTION update_quality_scores()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE structured_content_pool 
  SET 
    quality_score = reliability_score * relevance_score / 20,
    updated_at = NOW()
  WHERE updated_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. トリガー関数
-- =============================================================================

-- ローデータ更新時のタイムスタンプ更新
CREATE OR REPLACE FUNCTION update_raw_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_raw_content_updated
  BEFORE UPDATE ON raw_content_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_raw_content_timestamp();

-- 構造化データ更新時のタイムスタンプ更新
CREATE OR REPLACE FUNCTION update_structured_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- 品質スコアの自動計算
  NEW.quality_score = NEW.reliability_score * NEW.relevance_score / 20;
  
  -- 検索ベクトルの自動更新
  NEW.search_vector = 
    setweight(to_tsvector('japanese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('japanese', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('japanese', COALESCE(NEW.content, '')), 'C');
  
  -- アクティブ状態の自動更新
  NEW.is_active = (NEW.expires_at IS NULL OR NEW.expires_at > NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_structured_content_updated
  BEFORE UPDATE ON structured_content_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_structured_content_timestamp();

CREATE TRIGGER trigger_structured_content_inserted
  BEFORE INSERT ON structured_content_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_structured_content_timestamp();

-- 処理キュー更新時のタイムスタンプ更新
CREATE OR REPLACE FUNCTION update_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_queue_updated
  BEFORE UPDATE ON content_processing_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_timestamp();

-- =============================================================================
-- 7. 初期データ移行（既存データがある場合）
-- =============================================================================

-- 既存のinformation_poolテーブルがある場合の移行
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'information_pool') THEN
    -- ローデータテーブルに移行
    INSERT INTO raw_content_pool (
      source_url, source_name, source_type, content_type,
      raw_content, content_hash, content_length,
      extracted_title, processing_status, collected_at
    )
    SELECT 
      source_url,
      COALESCE(source_type, 'unknown'),
      COALESCE(source_type, 'unknown'),
      'html',
      content,
      encode(sha256(content::bytea), 'hex'),
      length(content),
      title,
      'completed',
      COALESCE(created_at, NOW())
    FROM information_pool
    ON CONFLICT (source_url, content_hash) DO NOTHING;
    
    -- 構造化データテーブルに移行
    INSERT INTO structured_content_pool (
      raw_content_id, title, summary, content, category,
      reliability_score, relevance_score, tags, last_updated, expires_at
    )
    SELECT 
      r.id,
      i.title,
      i.summary,
      i.content,
      i.category,
      i.reliability_score,
      i.relevance_score,
      i.tags,
      i.last_updated,
      i.expires_at
    FROM information_pool i
    JOIN raw_content_pool r ON i.source_url = r.source_url
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '既存データの移行が完了しました';
  END IF;
END $$;

-- =============================================================================
-- 8. パフォーマンス最適化
-- =============================================================================

-- 検索パフォーマンス向上のためのインデックス
CREATE INDEX IF NOT EXISTS idx_structured_content_search_gin 
ON structured_content_pool USING gin(search_vector);

-- 品質スコアによる高速ソート
CREATE INDEX IF NOT EXISTS idx_structured_quality_desc 
ON structured_content_pool(quality_score DESC NULLS LAST);

-- 有効期限管理の最適化
CREATE INDEX IF NOT EXISTS idx_structured_expires_active 
ON structured_content_pool(expires_at) WHERE expires_at IS NOT NULL;

-- =============================================================================
-- 完了メッセージ
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sottori テーブル分離設計の実装が完了しました';
  RAISE NOTICE '========================================';
  RAISE NOTICE '実装されたテーブル:';
  RAISE NOTICE '- raw_content_pool (ローデータ)';
  RAISE NOTICE '- structured_content_pool (構造化データ)';
  RAISE NOTICE '- content_processing_queue (処理キュー)';
  RAISE NOTICE '- information_pool (互換性ビュー)';
  RAISE NOTICE '';
  RAISE NOTICE '品質管理機能:';
  RAISE NOTICE '- get_processing_failure_stats()';
  RAISE NOTICE '- queue_for_reprocessing()';
  RAISE NOTICE '- update_quality_scores()';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ:';
  RAISE NOTICE '1. サービスクラスの更新';
  RAISE NOTICE '2. データ移行の確認';
  RAISE NOTICE '3. 品質管理システムのテスト';
  RAISE NOTICE '========================================';
END $$; 