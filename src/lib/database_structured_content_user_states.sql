-- =============================================================================
-- Sottori 構造化コンテンツ・ユーザー状態管理テーブル
-- 作成日: 2025年1月3日
-- structured_content_poolベースの新しい設計に対応
-- =============================================================================

-- =============================================================================
-- 1. ユーザー情報状態テーブル（structured_content_pool対応）
-- =============================================================================

-- 既存のuser_info_statesテーブルを新しい設計に合わせて更新
-- 注意: 既存データがある場合は、移行が必要です

-- 新しいテーブルを作成（既存テーブルとの競合を避けるため）
CREATE TABLE IF NOT EXISTS user_structured_content_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  structured_content_id uuid REFERENCES structured_content_pool(id) ON DELETE CASCADE,
  
  -- 閲覧・保存状態
  is_read boolean DEFAULT false,
  is_saved boolean DEFAULT false,
  read_at timestamp with time zone,
  saved_at timestamp with time zone,
  
  -- 閲覧統計
  view_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone,
  
  -- ユーザー評価
  user_rating integer CHECK (user_rating >= 1 AND user_rating <= 5),
  usefulness_score integer CHECK (usefulness_score >= 1 AND usefulness_score <= 5),
  feedback_text text,
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, structured_content_id)
);

-- =============================================================================
-- 2. 関連度スコアテーブル（structured_content_pool対応）
-- =============================================================================

-- 既存のinfo_relevance_scoresテーブルを新しい設計に合わせて更新
CREATE TABLE IF NOT EXISTS structured_content_relevance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  structured_content_id uuid REFERENCES structured_content_pool(id) ON DELETE CASCADE,
  
  -- 関連度計算要素
  medical_match_score integer DEFAULT 0 CHECK (medical_match_score >= 0 AND medical_match_score <= 100),
  situational_relevance_score integer DEFAULT 0 CHECK (situational_relevance_score >= 0 AND situational_relevance_score <= 100),
  personal_interest_score integer DEFAULT 0 CHECK (personal_interest_score >= 0 AND personal_interest_score <= 100),
  urgency_importance_score integer DEFAULT 0 CHECK (urgency_importance_score >= 0 AND urgency_importance_score <= 100),
  
  -- 最終スコア
  final_relevance_score integer DEFAULT 0 CHECK (final_relevance_score >= 0 AND final_relevance_score <= 100),
  
  -- 関連度の説明
  relevance_explanation text,
  
  -- 計算詳細（デバッグ用）
  calculation_details jsonb DEFAULT '{}'::jsonb,
  
  -- システム管理
  calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, structured_content_id)
);

-- =============================================================================
-- 3. 情報消費履歴テーブル（structured_content_pool対応）
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_content_consumption_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  structured_content_id uuid REFERENCES structured_content_pool(id) ON DELETE CASCADE,
  
  -- 消費行動
  action_type text CHECK (action_type IN ('viewed', 'read_partial', 'read_complete', 'saved', 'shared', 'dismissed')) NOT NULL,
  reading_duration integer DEFAULT 0, -- 秒単位
  reading_percentage decimal(3,2) DEFAULT 0.0 CHECK (reading_percentage >= 0 AND reading_percentage <= 1),
  
  -- 評価・フィードバック
  user_rating integer CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback_text text,
  usefulness_score integer CHECK (usefulness_score >= 1 AND usefulness_score <= 5),
  
  -- タイムスタンプ
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- 4. インデックス作成
-- =============================================================================

-- user_structured_content_states
CREATE INDEX IF NOT EXISTS idx_user_structured_content_states_user_id ON user_structured_content_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_structured_content_states_content_id ON user_structured_content_states(structured_content_id);
CREATE INDEX IF NOT EXISTS idx_user_structured_content_states_is_read ON user_structured_content_states(is_read);
CREATE INDEX IF NOT EXISTS idx_user_structured_content_states_is_saved ON user_structured_content_states(is_saved);
CREATE INDEX IF NOT EXISTS idx_user_structured_content_states_updated_at ON user_structured_content_states(updated_at DESC);

-- structured_content_relevance_scores
CREATE INDEX IF NOT EXISTS idx_structured_content_relevance_scores_user_id ON structured_content_relevance_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_structured_content_relevance_scores_content_id ON structured_content_relevance_scores(structured_content_id);
CREATE INDEX IF NOT EXISTS idx_structured_content_relevance_scores_final_score ON structured_content_relevance_scores(final_relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_structured_content_relevance_scores_calculated_at ON structured_content_relevance_scores(calculated_at DESC);

-- user_content_consumption_history
CREATE INDEX IF NOT EXISTS idx_user_content_consumption_history_user_id ON user_content_consumption_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_consumption_history_content_id ON user_content_consumption_history(structured_content_id);
CREATE INDEX IF NOT EXISTS idx_user_content_consumption_history_action_type ON user_content_consumption_history(action_type);
CREATE INDEX IF NOT EXISTS idx_user_content_consumption_history_timestamp ON user_content_consumption_history(created_at DESC);

-- =============================================================================
-- 5. RLS (Row Level Security) 設定
-- =============================================================================

-- すべてのテーブルでRLSを有効化
ALTER TABLE user_structured_content_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE structured_content_relevance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_consumption_history ENABLE ROW LEVEL SECURITY;

-- ポリシー作成: ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can manage their structured content states" ON user_structured_content_states
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their relevance scores" ON structured_content_relevance_scores
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their consumption history" ON user_content_consumption_history
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 6. トリガー関数
-- =============================================================================

-- 更新タイムスタンプ自動更新関数
CREATE OR REPLACE FUNCTION update_structured_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER trigger_user_structured_content_states_updated
  BEFORE UPDATE ON user_structured_content_states
  FOR EACH ROW
  EXECUTE FUNCTION update_structured_content_timestamp();

CREATE TRIGGER trigger_structured_content_relevance_scores_updated
  BEFORE UPDATE ON structured_content_relevance_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_structured_content_timestamp();

-- =============================================================================
-- 7. ユーティリティ関数
-- =============================================================================

-- ユーザーの情報状態を一括取得する関数
CREATE OR REPLACE FUNCTION get_user_content_states(p_user_id uuid)
RETURNS TABLE (
  structured_content_id uuid,
  is_read boolean,
  is_saved boolean,
  read_at timestamp with time zone,
  saved_at timestamp with time zone,
  view_count integer,
  last_viewed_at timestamp with time zone,
  final_relevance_score integer,
  relevance_explanation text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uscs.structured_content_id,
    uscs.is_read,
    uscs.is_saved,
    uscs.read_at,
    uscs.saved_at,
    uscs.view_count,
    uscs.last_viewed_at,
    scrs.final_relevance_score,
    scrs.relevance_explanation
  FROM user_structured_content_states uscs
  LEFT JOIN structured_content_relevance_scores scrs 
    ON uscs.user_id = scrs.user_id 
    AND uscs.structured_content_id = scrs.structured_content_id
  WHERE uscs.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. サンプルデータ（開発用）
-- =============================================================================

-- 注意: 実際の本番環境では削除してください
DO $$
DECLARE
    sample_user_id uuid;
    sample_content_id uuid;
BEGIN
    -- 既存のユーザーIDを取得（存在する場合）
    SELECT id INTO sample_user_id FROM profiles LIMIT 1;
    
    -- 既存の構造化コンテンツIDを取得（存在する場合）
    SELECT id INTO sample_content_id FROM structured_content_pool LIMIT 1;
    
    IF sample_user_id IS NOT NULL AND sample_content_id IS NOT NULL THEN
        -- サンプルユーザー状態データ
        INSERT INTO user_structured_content_states (
          user_id, 
          structured_content_id, 
          is_read, 
          is_saved, 
          read_at, 
          saved_at, 
          view_count, 
          last_viewed_at
        ) VALUES (
          sample_user_id, 
          sample_content_id, 
          true, 
          true, 
          now() - interval '1 hour', 
          now() - interval '30 minutes', 
          3, 
          now() - interval '1 hour'
        ) ON CONFLICT (user_id, structured_content_id) DO NOTHING;
        
        -- サンプル関連度スコアデータ
        INSERT INTO structured_content_relevance_scores (
          user_id, 
          structured_content_id, 
          medical_match_score, 
          situational_relevance_score, 
          personal_interest_score, 
          urgency_importance_score, 
          final_relevance_score, 
          relevance_explanation
        ) VALUES (
          sample_user_id, 
          sample_content_id, 
          95, 
          88, 
          92, 
          90, 
          91, 
          '医療状況と高い関連性があり、現在の治療段階に適した重要な情報です'
        ) ON CONFLICT (user_id, structured_content_id) DO NOTHING;
        
        RAISE NOTICE 'サンプルデータが正常に挿入されました。ユーザーID: %, コンテンツID: %', sample_user_id, sample_content_id;
    ELSE
        RAISE NOTICE 'profilesテーブルまたはstructured_content_poolテーブルにデータが存在しません。';
    END IF;
END $$;

-- =============================================================================
-- 完了！
-- =============================================================================

-- ログ出力
DO $$
BEGIN
  RAISE NOTICE '構造化コンテンツ・ユーザー状態管理テーブルの作成が完了しました。';
  RAISE NOTICE '新しい設計に合わせたAPIの実装が可能になりました。';
END $$; 