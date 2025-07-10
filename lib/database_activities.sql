-- アクティビティ機能のためのデータベーステーブル
-- 既存のデザインを維持しながら、アクティビティ機能を追加

-- 1. ユーザーアクティビティテーブル
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_step_id integer NOT NULL, -- 1: 診断・検査, 2: 治療方針決定, 3: 手術・治療, 4: 術後ケア, 5: フォローアップ
  
  -- アクティビティ基本情報
  type text NOT NULL CHECK (type IN ('診察', '検査', '準備', '家族相談', 'メモ')),
  content text NOT NULL,
  description text, -- 詳細説明（任意）
  
  -- スケジュール情報
  scheduled_date date,
  completed_date date,
  status text CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
  priority text CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  
  -- メタデータ
  is_ai_recommended boolean DEFAULT false,
  source text DEFAULT 'user_created', -- 'user_created', 'ai_recommended', 'template'
  tags text[] DEFAULT '{}', -- 検索・フィルタ用タグ
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_activities_user_step ON user_activities(user_id, roadmap_step_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_status_date ON user_activities(status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(type);

-- 2. アクティビティテンプレートテーブル
CREATE TABLE IF NOT EXISTS activity_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- テンプレート基本情報
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('診察', '検査', '準備', '家族相談', 'メモ')),
  content text NOT NULL,
  description text,
  
  -- 適用条件
  roadmap_step_id integer NOT NULL,
  cancer_type text[] DEFAULT '{}', -- 適用がん種
  stage text[] DEFAULT '{}', -- 適用ステージ
  age_group text[] DEFAULT '{}', -- 年齢層
  family_situation text[] DEFAULT '{}', -- 家族状況
  
  -- 優先度・表示条件
  priority integer DEFAULT 0,
  is_ai_recommended boolean DEFAULT true,
  conditions jsonb DEFAULT '{}', -- 動的表示条件
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_activity_templates_step_type ON activity_templates(roadmap_step_id, type);
CREATE INDEX IF NOT EXISTS idx_activity_templates_cancer_stage ON activity_templates(cancer_type, stage);

-- 3. ユーザーアクティビティ設定テーブル
CREATE TABLE IF NOT EXISTS user_activity_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 表示設定
  show_ai_recommendations boolean DEFAULT true,
  max_recommendations_per_step integer DEFAULT 5,
  preferred_activity_types text[] DEFAULT '{}', -- ユーザーが好む種別
  
  -- フィルタ設定
  excluded_tags text[] DEFAULT '{}', -- 除外したいタグ
  priority_threshold text DEFAULT 'normal', -- 表示する優先度の閾値
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- 4. 既存のuser_treatment_roadmapsテーブルに列を追加
ALTER TABLE user_treatment_roadmaps 
ADD COLUMN IF NOT EXISTS current_step_id integer DEFAULT 2;

ALTER TABLE user_treatment_roadmaps 
ADD COLUMN IF NOT EXISTS user_profile jsonb DEFAULT '{}';

-- 5. サンプルテンプレートデータの挿入
INSERT INTO activity_templates (name, type, content, description, roadmap_step_id, cancer_type, stage, priority) VALUES
-- 診断・検査段階
('初回診察', '診察', '初回診察を受ける', 'がんの診断のための初回診察です', 1, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 10),
('血液検査', '検査', '血液検査を受ける', 'がんの進行度や全身状態を確認する検査です', 1, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 9),
('画像検査', '検査', 'CT・MRI・PET検査を受ける', 'がんの位置や転移の有無を確認する検査です', 1, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 9),
('家族への説明', '家族相談', '家族に診断結果を説明する', '家族と今後の治療方針について話し合う', 1, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 7),
('治療費の確認', '準備', '治療費について調べる', '保険適用や自己負担額を確認する', 1, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 6),

-- 治療方針決定段階
('セカンドオピニオン', '診察', 'セカンドオピニオンを受ける', '別の医師から治療方針について意見を聞く', 2, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 10),
('治療方針の説明', '診察', '主治医から治療方針の詳細説明を受ける', '推奨される治療法について詳しく聞く', 2, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 9),
('家族会議', '家族相談', '家族と治療方針について話し合う', '家族全員で治療方針を決める', 2, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 8),
('治療スケジュール確認', '準備', '治療スケジュールを確認する', '入院や通院のスケジュールを整理する', 2, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 7),
('仕事の調整', '準備', '仕事の調整を行う', '休職や時短勤務について会社と相談する', 2, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 6),

-- 手術・治療段階
('手術前検査', '検査', '手術前の最終検査を受ける', '手術に必要な最終的な検査です', 3, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 10),
('手術', '診察', '手術を受ける', 'がんの切除手術です', 3, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 10),
('術後ケア準備', '準備', '術後のケアについて準備する', '退院後の生活について準備する', 3, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 8),
('家族への連絡', '家族相談', '手術結果を家族に連絡する', '手術の結果を家族に伝える', 3, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 7),
('術後記録', 'メモ', '術後の体調を記録する', '痛みや体調の変化を記録する', 3, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 5),

-- 術後ケア段階
('術後診察', '診察', '術後の診察を受ける', '手術後の経過を確認する診察です', 4, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 9),
('リハビリ', '準備', 'リハビリテーションを受ける', '術後の機能回復のためのリハビリです', 4, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 8),
('食事療法', '準備', '食事療法を始める', '術後の体調に合わせた食事を心がける', 4, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 7),
('家族のサポート確認', '家族相談', '家族のサポート体制を確認する', '家族のサポートについて話し合う', 4, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 6),
('体調記録', 'メモ', '日々の体調を記録する', '痛みや疲労感などの変化を記録する', 4, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 5),

-- フォローアップ段階
('定期診察', '診察', '定期診察を受ける', '再発の有無を確認する定期診察です', 5, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 9),
('定期検査', '検査', '定期検査を受ける', '再発や転移の早期発見のための検査です', 5, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 8),
('生活習慣改善', '準備', '生活習慣を改善する', '再発予防のための生活習慣改善です', 5, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 7),
('家族との振り返り', '家族相談', '家族と治療期間を振り返る', '家族と一緒に治療期間を振り返る', 5, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 6),
('今後の計画', 'メモ', '今後の生活計画を立てる', '治療後の新しい生活について計画する', 5, ARRAY['乳がん', '肺がん', '大腸がん'], ARRAY['早期', '進行期'], 5);

-- 6. RLS（Row Level Security）の設定
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_preferences ENABLE ROW LEVEL SECURITY;

-- user_activitiesのポリシー
CREATE POLICY "Users can view their own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON user_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON user_activities
  FOR DELETE USING (auth.uid() = user_id);

-- activity_templatesのポリシー（全ユーザーが読み取り可能）
CREATE POLICY "Anyone can view activity templates" ON activity_templates
  FOR SELECT USING (true);

-- user_activity_preferencesのポリシー
CREATE POLICY "Users can view their own preferences" ON user_activity_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_activity_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_activity_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_activity_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- 7. トリガー関数（updated_atの自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_user_activities_updated_at 
  BEFORE UPDATE ON user_activities 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_templates_updated_at 
  BEFORE UPDATE ON activity_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_activity_preferences_updated_at 
  BEFORE UPDATE ON user_activity_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 