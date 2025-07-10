-- 治療ロードマップ関連テーブル

-- 1. 治療段階テーブル（マスターデータ）
CREATE TABLE IF NOT EXISTS roadmap_steps (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  cancer_type VARCHAR(100)[], -- 対象がん種
  stage VARCHAR(100)[], -- 対象ステージ
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ユーザーの治療段階進捗テーブル
CREATE TABLE IF NOT EXISTS user_roadmap_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL REFERENCES roadmap_steps(id),
  status VARCHAR(50) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('completed', 'current', 'upcoming')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, step_id)
);

-- 3. 段階詳細テーブル
CREATE TABLE IF NOT EXISTS roadmap_step_details (
  id SERIAL PRIMARY KEY,
  step_id INTEGER NOT NULL REFERENCES roadmap_steps(id) ON DELETE CASCADE,
  icon VARCHAR(50),
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_roadmap_steps_order ON roadmap_steps(order_index);
CREATE INDEX IF NOT EXISTS idx_roadmap_steps_cancer_type ON roadmap_steps USING GIN(cancer_type);
CREATE INDEX IF NOT EXISTS idx_roadmap_steps_stage ON roadmap_steps USING GIN(stage);
CREATE INDEX IF NOT EXISTS idx_user_roadmap_progress_user_id ON user_roadmap_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roadmap_progress_step_id ON user_roadmap_progress(step_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_step_details_step_id ON roadmap_step_details(step_id);

-- RLSポリシー
ALTER TABLE roadmap_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_step_details ENABLE ROW LEVEL SECURITY;

-- roadmap_steps: 全ユーザーが読み取り可能
CREATE POLICY "roadmap_steps_select_policy" ON roadmap_steps
  FOR SELECT USING (true);

-- user_roadmap_progress: 自分のデータのみアクセス可能
CREATE POLICY "user_roadmap_progress_select_policy" ON user_roadmap_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_roadmap_progress_insert_policy" ON user_roadmap_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_roadmap_progress_update_policy" ON user_roadmap_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_roadmap_progress_delete_policy" ON user_roadmap_progress
  FOR DELETE USING (auth.uid() = user_id);

-- roadmap_step_details: 全ユーザーが読み取り可能
CREATE POLICY "roadmap_step_details_select_policy" ON roadmap_step_details
  FOR SELECT USING (true);

-- トリガー関数（updated_at自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roadmap_steps_updated_at BEFORE UPDATE ON roadmap_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roadmap_progress_updated_at BEFORE UPDATE ON user_roadmap_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_step_details_updated_at BEFORE UPDATE ON roadmap_step_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータ挿入
INSERT INTO roadmap_steps (title, description, order_index, cancer_type, stage) VALUES
('診断・検査', 'がんの種類と進行度を詳しく調べる段階です。', 1, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期']),
('治療方針の決定', '主治医と相談して、最適な治療法を決める段階です。', 2, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期']),
('手術・治療', '決めた治療法に基づいて、実際の治療を始める段階です。', 3, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期']),
('術後ケア', '治療後の体調管理と、再発予防のための定期検査です。', 4, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期']),
('フォローアップ', '治療を終えて、元の生活に戻る段階です。', 5, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'])
ON CONFLICT (id) DO NOTHING;

-- 段階詳細データ挿入
INSERT INTO roadmap_step_details (step_id, icon, text, order_index) VALUES
-- ステップ1: 診断・検査
(1, '✓', '乳がんの診断完了', 1),
(1, '✓', '病理検査完了', 2),
(1, '✓', 'ステージ判定完了', 3),

-- ステップ2: 治療方針の決定
(2, '📅', '来週火曜日：主治医との相談', 1),
(2, '💭', '家族との相談が必要', 2),
(2, '📋', '治療選択肢の整理', 3),

-- ステップ3: 手術・治療
(3, '🏥', '手術・化学療法・放射線治療', 1),
(3, '📅', '治療スケジュールの調整', 2),
(3, '👨‍👩‍👧‍👦', '家族のサポート体制', 3),

-- ステップ4: 術後ケア
(4, '💊', '薬物療法の継続', 1),
(4, '🏥', '定期検査・診察', 2),
(4, '💪', 'リハビリ・運動', 3),

-- ステップ5: フォローアップ
(5, '💼', '仕事への復帰', 1),
(5, '👨‍👩‍👧‍👦', '家族との関係調整', 2),
(5, '🌸', '新しい生活の構築', 3)
ON CONFLICT (id) DO NOTHING; 