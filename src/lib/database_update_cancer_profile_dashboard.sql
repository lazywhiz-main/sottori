-- Sottori データベース拡張: がん治療プロフィール & ダッシュボード4エリア
-- このファイルをSupabaseのSQL Editorで実行してください

-- =============================================================================
-- 1. がん治療プロフィールテーブル
-- =============================================================================

CREATE TABLE IF NOT EXISTS cancer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基本がん情報
  cancer_type TEXT,
  stage TEXT,
  diagnosis_date DATE,
  
  -- 治療状況
  treatment_status TEXT,
  current_treatment TEXT[], -- 複数選択可能
  treatment_start_date DATE,
  
  -- 医療チーム（任意）
  primary_doctor TEXT,
  hospital TEXT,
  next_appointment DATE,
  
  -- 関心事・気になるポイント
  concern_areas TEXT[], -- 複数選択可能
  priority_concerns TEXT[], -- 最重要項目
  
  -- その他
  notes TEXT,
  
  -- システム管理
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ユーザーごとに1レコードのみ
  UNIQUE(user_id)
);

-- =============================================================================
-- 2. プロフィール完了管理テーブル（BasicInfoManagementArea用）
-- =============================================================================

CREATE TABLE IF NOT EXISTS profile_completion_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 項目情報
  category TEXT NOT NULL, -- 'がん治療情報', '医療チーム', '個人設定' など
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 5,
  estimated_time TEXT,
  related_url TEXT,
  
  -- 完了状況
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- システム管理
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. 日次ステータステーブル（WelcomeStatusArea用）
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 日付（ユーザーごと・日付ごとに1レコード）
  status_date DATE NOT NULL,
  
  -- ステータス情報
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  notes TEXT,
  
  -- システム管理
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ユーザーごと・日付ごとに1レコードのみ
  UNIQUE(user_id, status_date)
);

-- =============================================================================
-- 4. 情報収集進捗テーブル（InfoCollectionStatusArea用）
-- =============================================================================

CREATE TABLE IF NOT EXISTS info_collection_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 収集対象
  concern_type TEXT NOT NULL, -- 'treatment_options', 'doctors', 'side_effects' など
  concern_label TEXT NOT NULL, -- 表示用ラベル
  
  -- 進捗情報
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collecting', 'ready', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  items_found INTEGER DEFAULT 0,
  
  -- システム管理
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ユーザーごと・関心事ごとに1レコードのみ
  UNIQUE(user_id, concern_type)
);

-- =============================================================================
-- 5. 週次提案テーブル（WeeklySuggestionsArea用）
-- =============================================================================

CREATE TABLE IF NOT EXISTS weekly_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 提案内容
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'action' CHECK (type IN ('action', 'information', 'reminder', 'opportunity')),
  priority INTEGER DEFAULT 3,
  estimated_time TEXT,
  related_url TEXT,
  due_date DATE,
  
  -- 完了状況
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- 表示制御
  is_active BOOLEAN DEFAULT TRUE,
  week_start_date DATE NOT NULL, -- どの週の提案か
  
  -- システム管理
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 6. インデックスの作成（パフォーマンス向上）
-- =============================================================================

-- がん治療プロフィール
CREATE INDEX IF NOT EXISTS idx_cancer_profiles_user_id ON cancer_profiles(user_id);

-- プロフィール完了管理
CREATE INDEX IF NOT EXISTS idx_profile_completion_user_id ON profile_completion_items(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_completion_category ON profile_completion_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_profile_completion_priority ON profile_completion_items(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_profile_completion_status ON profile_completion_items(user_id, is_completed);

-- 日次ステータス
CREATE INDEX IF NOT EXISTS idx_daily_status_user_id ON daily_status(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_status_date ON daily_status(user_id, status_date DESC);

-- 情報収集進捗
CREATE INDEX IF NOT EXISTS idx_info_collection_user_id ON info_collection_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_info_collection_status ON info_collection_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_info_collection_type ON info_collection_progress(concern_type);

-- 週次提案
CREATE INDEX IF NOT EXISTS idx_weekly_suggestions_user_id ON weekly_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_suggestions_week ON weekly_suggestions(user_id, week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_suggestions_active ON weekly_suggestions(user_id, is_active, week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_suggestions_priority ON weekly_suggestions(user_id, priority, is_completed);

-- =============================================================================
-- 7. Row Level Security (RLS) の設定
-- =============================================================================

-- テーブルでRLSを有効化
ALTER TABLE cancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_completion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_collection_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_suggestions ENABLE ROW LEVEL SECURITY;

-- がん治療プロフィール
CREATE POLICY "Users can manage own cancer profile" ON cancer_profiles
  FOR ALL USING (auth.uid() = user_id);

-- プロフィール完了管理
CREATE POLICY "Users can manage own profile completion" ON profile_completion_items
  FOR ALL USING (auth.uid() = user_id);

-- 日次ステータス
CREATE POLICY "Users can manage own daily status" ON daily_status
  FOR ALL USING (auth.uid() = user_id);

-- 情報収集進捗
CREATE POLICY "Users can manage own collection progress" ON info_collection_progress
  FOR ALL USING (auth.uid() = user_id);

-- 週次提案
CREATE POLICY "Users can manage own weekly suggestions" ON weekly_suggestions
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 8. 更新日時自動更新のトリガー
-- =============================================================================

-- がん治療プロフィール
CREATE TRIGGER update_cancer_profiles_updated_at 
  BEFORE UPDATE ON cancer_profiles 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- プロフィール完了管理
CREATE TRIGGER update_profile_completion_items_updated_at 
  BEFORE UPDATE ON profile_completion_items 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 日次ステータス
CREATE TRIGGER update_daily_status_updated_at 
  BEFORE UPDATE ON daily_status 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 情報収集進捗
CREATE TRIGGER update_info_collection_progress_updated_at 
  BEFORE UPDATE ON info_collection_progress 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 週次提案
CREATE TRIGGER update_weekly_suggestions_updated_at 
  BEFORE UPDATE ON weekly_suggestions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================================================
-- 9. デフォルトデータの挿入関数
-- =============================================================================

-- 新規ユーザー用のデフォルトプロフィール完了項目を作成する関数
CREATE OR REPLACE FUNCTION create_default_profile_items(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profile_completion_items (user_id, category, title, description, priority, estimated_time, related_url)
  VALUES 
    (user_id_param, 'がん治療情報', 'がん種・ステージ設定', '診断されたがんの種類とステージを設定してください', 1, '3分', '/profile?section=cancer-info'),
    (user_id_param, 'がん治療情報', '治療状況の入力', '現在の治療方針や進行状況を記録してください', 2, '5分', '/profile?section=cancer-info'),
    (user_id_param, '関心・気になるポイント', '気になるポイントの選択', '今、最も知りたい情報のカテゴリを選択してください', 3, '2分', '/profile?section=cancer-info'),
    (user_id_param, '医療チーム', '主治医情報の登録', '現在診てもらっている主治医の情報を登録してください', 4, '3分', '/medical-team'),
    (user_id_param, '医療チーム', '通院先医療機関の登録', '主な通院先の医療機関情報を登録してください', 5, '2分', '/medical-team'),
    (user_id_param, '個人設定', 'プロフィール情報の完成', '基本的なプロフィール情報を完成させてください', 6, '3分', '/profile')
  ON CONFLICT (user_id) DO NOTHING; -- 既存の場合は何もしない
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新規ユーザー用のデフォルト情報収集進捗を作成する関数
CREATE OR REPLACE FUNCTION create_default_collection_items(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO info_collection_progress (user_id, concern_type, concern_label, status, progress_percentage)
  VALUES 
    (user_id_param, 'treatment_options', '治療選択肢', 'pending', 0),
    (user_id_param, 'doctors', '専門医情報', 'pending', 0),
    (user_id_param, 'side_effects', '副作用・対処法', 'pending', 0),
    (user_id_param, 'clinical_trials', '治験情報', 'pending', 0)
  ON CONFLICT (user_id, concern_type) DO NOTHING; -- 既存の場合は何もしない
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 10. 新規ユーザー作成時のトリガー拡張
-- =============================================================================

-- 既存の新規ユーザー処理関数を拡張
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 基本プロフィール作成（既存）
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- デフォルトプロフィール完了項目作成
  PERFORM create_default_profile_items(NEW.id);
  
  -- デフォルト情報収集進捗作成
  PERFORM create_default_collection_items(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 完了！
-- =============================================================================

-- ログ出力
DO $$
BEGIN
  RAISE NOTICE 'がん治療プロフィール & ダッシュボード4エリア用テーブルの作成が完了しました！';
  RAISE NOTICE '以下のテーブルが作成されました:';
  RAISE NOTICE '- cancer_profiles (がん治療プロフィール)';
  RAISE NOTICE '- profile_completion_items (プロフィール完了管理)';
  RAISE NOTICE '- daily_status (日次ステータス)';
  RAISE NOTICE '- info_collection_progress (情報収集進捗)';
  RAISE NOTICE '- weekly_suggestions (週次提案)';
  RAISE NOTICE '';
  RAISE NOTICE '新規ユーザー作成時に自動的にデフォルトデータが挿入されます。';
END $$; 