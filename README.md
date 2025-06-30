# Sottori - がん患者向け情報整理サービス

がん患者の方が治療に関する情報を整理し、次の一歩をサポートするWebアプリケーションです。

## 主な機能

- **ゆっくりセルフチェック**: 現在の状況や気持ちを整理
- **あなた専用ガイド**: 個別化されたロードマップ生成
- **医療情報管理**: 診断結果や治療選択肢の整理
- **医療チーム管理**: 医師や医療機関の情報管理
- **予定・アポイントメント管理**: 医療スケジュールの管理
- **AI機能**: OpenAI APIを活用した個別化サポート

## 技術スタック

- **フロントエンド**: Next.js 15.3.4, React 19, TypeScript
- **スタイリング**: Tailwind CSS v4
- **バックエンド**: Supabase (認証・データベース)
- **AI機能**: OpenAI API (GPT-4)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

#### 基本設定（必須）
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### AI機能設定（オプション）
```
# OpenAI設定
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# AI機能の有効/無効フラグ
NEXT_PUBLIC_AI_ROADMAP_ENABLED=true
NEXT_PUBLIC_AI_ANALYSIS_ENABLED=true
NEXT_PUBLIC_AI_CHAT_ENABLED=false
NEXT_PUBLIC_AI_PERSONALIZATION_ENABLED=true

# AI機能のロールアウト設定
AI_ROLLOUT_PERCENTAGE=100
AI_BETA_ONLY=false
AI_AB_TEST_ENABLED=false
```

**注意**: AI機能を使用する場合は、OpenAI APIキーが必要です。APIキーが設定されていない場合は、既存のロジックが使用されます。

### 3. データベースのセットアップ

Supabaseプロジェクトで以下のSQLファイルを実行してください：

1. `src/lib/database.sql` - 基本テーブル作成
2. `src/lib/database_update_week6.sql` - 追加フィールド

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションが起動します。

## AI機能について

### 実装済み機能

- **ロードマップ生成**: ユーザーの回答に基づいて個別化されたガイドを生成
- **回答分析**: セルフチェックの結果を詳細分析
- **フォールバック機能**: AI生成に失敗した場合の既存ロジック使用
- **使用統計**: AI機能の利用状況をログ記録

### 今後実装予定

- **チャット支援**: 会話をAIで支援
- **コンテンツ個別化**: コンテンツをAIで個別化

### AI機能の設定

ダッシュボードでAI機能の有効/無効を切り替えることができます。各機能は独立して制御可能です。

## プロジェクト構造

```
sottori/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── roadmap/       # ロードマップ生成API
│   │   │   └── check/         # チェック分析API
│   │   ├── dashboard/         # ダッシュボード
│   │   ├── yukkuri-check/     # セルフチェック
│   │   ├── roadmap/           # ロードマップ表示
│   │   └── ...
│   ├── components/            # Reactコンポーネント
│   │   ├── ui/               # 基本UIコンポーネント
│   │   ├── check/            # チェック関連コンポーネント
│   │   ├── medical/          # 医療情報関連コンポーネント
│   │   └── forms/            # フォームコンポーネント
│   └── lib/                  # ユーティリティ・設定
│       ├── config/           # AI設定
│       ├── hooks/            # カスタムフック
│       └── utils/            # ユーティリティ関数
└── docs/                     # プロジェクト設計書
```

## サービスコンセプト

「迷っても、頼ってもいい。次の一歩は、あなたのペースで。」

がん患者の方が治療に関する情報を整理し、自分のペースで次の一歩を踏み出せるようサポートします。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
