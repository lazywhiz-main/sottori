# Sottori データベースセットアップガイド

## 概要

Sottoriのデータベース基盤として、がん治療プロフィール管理とダッシュボード4エリア用の新しいテーブルを作成します。

## 📋 事前準備

1. **Supabaseプロジェクトにアクセス**
   - [Supabase Dashboard](https://app.supabase.com)にログイン
   - Sottoriプロジェクトを選択

2. **SQL Editorを開く**
   - 左サイドバーから「SQL Editor」をクリック
   - 「New query」を選択

## 🗄️ 作成されるテーブル

| テーブル名 | 用途 | 対応コンポーネント |
|-----------|------|-------------------|
| `cancer_profiles` | がん治療プロフィール | CancerProfileForm |
| `profile_completion_items` | プロフィール完了管理 | BasicInfoManagementArea |
| `daily_status` | 日次ステータス記録 | WelcomeStatusArea |
| `info_collection_progress` | 情報収集進捗 | InfoCollectionStatusArea |
| `weekly_suggestions` | 週次提案 | WeeklySuggestionsArea |

## 🚀 実行手順

### ステップ1: 基本テーブル作成

1. SQL Editorで以下のファイルの内容をコピー・ペースト
   ```
   src/lib/database_update_cancer_profile_dashboard.sql
   ```

2. 「Run」ボタンをクリックして実行

3. 成功メッセージが表示されることを確認
   ```
   がん治療プロフィール & ダッシュボード4エリア用テーブルの作成が完了しました！
   ```

### ステップ2: 実行結果の確認

1. **テーブル作成の確認**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'cancer_profiles',
     'profile_completion_items', 
     'daily_status',
     'info_collection_progress',
     'weekly_suggestions'
   );
   ```

2. **RLSポリシーの確認**
   ```sql
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN (
     'cancer_profiles',
     'profile_completion_items',
     'daily_status', 
     'info_collection_progress',
     'weekly_suggestions'
   );
   ```

3. **インデックスの確認**
   ```sql
   SELECT indexname, tablename 
   FROM pg_indexes 
   WHERE tablename IN (
     'cancer_profiles',
     'profile_completion_items',
     'daily_status',
     'info_collection_progress', 
     'weekly_suggestions'
   );
   ```

### ステップ3: 新規ユーザーでのテスト

1. **テストユーザーでログイン**
   - アプリケーションで新規ユーザーを作成
   - 自動的にデフォルトデータが挿入されることを確認

2. **デフォルトデータの確認**
   ```sql
   -- プロフィール完了項目の確認（USER_IDを実際のIDに置換）
   SELECT * FROM profile_completion_items WHERE user_id = 'USER_ID';
   
   -- 情報収集進捗の確認
   SELECT * FROM info_collection_progress WHERE user_id = 'USER_ID';
   ```

## 📊 データベーススキーマ詳細

### 1. cancer_profiles（がん治療プロフィール）

```sql
CREATE TABLE cancer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基本がん情報
  cancer_type TEXT,
  stage TEXT, 
  diagnosis_date DATE,
  
  -- 治療状況
  treatment_status TEXT,
  current_treatment TEXT[],
  treatment_start_date DATE,
  
  -- 医療チーム
  primary_doctor TEXT,
  hospital TEXT,
  next_appointment DATE,
  
  -- 関心事
  concern_areas TEXT[],
  priority_concerns TEXT[],
  
  -- その他
  notes TEXT,
  
  -- システム管理
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

### 2. profile_completion_items（プロフィール完了管理）

```sql
CREATE TABLE profile_completion_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 項目情報
  category TEXT NOT NULL,
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
```

### 3. daily_status（日次ステータス）

```sql
CREATE TABLE daily_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 日付
  status_date DATE NOT NULL,
  
  -- ステータス情報
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  notes TEXT,
  
  -- システム管理
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, status_date)
);
```

### 4. info_collection_progress（情報収集進捗）

```sql
CREATE TABLE info_collection_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 収集対象
  concern_type TEXT NOT NULL,
  concern_label TEXT NOT NULL,
  
  -- 進捗情報
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collecting', 'ready', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  items_found INTEGER DEFAULT 0,
  
  -- システム管理
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, concern_type)
);
```

### 5. weekly_suggestions（週次提案）

```sql
CREATE TABLE weekly_suggestions (
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
  week_start_date DATE NOT NULL,
  
  -- システム管理
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 セキュリティ設定

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化され、ユーザーは自分のデータのみアクセス可能：

```sql
-- 例: cancer_profilesのRLSポリシー
CREATE POLICY "Users can manage own cancer profile" ON cancer_profiles
  FOR ALL USING (auth.uid() = user_id);
```

### データ整合性

- 外部キー制約によりユーザーデータの整合性を保証
- CHECK制約により数値範囲やenum値を制限
- UNIQUE制約により重複データを防止

## 🔧 開発者向け情報

### TypeScript型定義

新しいテーブル用の型定義を作成済み：
```typescript
// src/lib/types/database.ts
import type { CancerProfile, ProfileCompletionItem, ... } from '@/lib/types/database'
```

### ヘルパー関数

データベース操作用のサービスクラスを作成済み：
```typescript
// src/lib/utils/databaseHelpers.ts
import { CancerProfileService, DashboardService, ... } from '@/lib/utils/databaseHelpers'
```

### 使用例

```typescript
// がん治療プロフィールの取得
const profile = await CancerProfileService.getProfile(userId)

// ダッシュボードデータの一括取得
const dashboardData = await DashboardService.getDashboardData(userId)

// 日次ステータスの記録
await DailyStatusService.recordStatus({
  user_id: userId,
  status_date: '2024-01-01',
  mood_score: 4,
  energy_level: 3
})
```

## ⚠️ 注意事項

1. **データ移行**
   - 既存ユーザーには手動でデフォルトデータを追加する必要がある場合があります
   - 本番環境では事前にバックアップを取得してください

2. **パフォーマンス**
   - 大量のデータがある場合、インデックスが適切に効いているか確認してください
   - 必要に応じて追加のインデックスを作成してください

3. **監視**
   - RLSポリシーが正しく動作していることを定期的に確認してください
   - ログを監視してエラーがないか確認してください

## 🔄 次のステップ

1. **フロントエンド連携**
   - 既存のコンポーネントでヘルパー関数を使用
   - モックデータから実データへの切り替え

2. **データ初期化**
   - 既存ユーザー向けのデータ移行スクリプト実行
   - デフォルト提案データの作成

3. **テスト実行**
   - 全機能の動作確認
   - パフォーマンステスト

4. **本番デプロイ**
   - ステージング環境での最終確認
   - 本番環境への段階的適用

## 📞 サポート

データベースセットアップで問題が発生した場合：

1. Supabaseのログを確認
2. SQL実行結果のエラーメッセージを確認  
3. 必要に応じてロールバック用のSQLを実行

---

**作成日**: 2024年7月1日  
**更新日**: 2024年7月1日  
**バージョン**: 1.0.0 