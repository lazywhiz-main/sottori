# Sottori プロジェクト構成 & コンポーネント設計

## 📁 プロジェクト全体構成

```
sottori/
├── 📄 README.md
├── 📄 package.json
├── 📄 next.config.js
├── 📄 tailwind.config.js          # デザインシステム統合
├── 📄 .env.local                  # 環境変数
├── 📄 .env.example
├── 📄 tsconfig.json
├── 📄 supabase/
│   ├── 📄 config.toml
│   ├── 📄 seed.sql
│   └── migrations/
│       ├── 📄 20241201_initial_schema.sql
│       ├── 📄 20241202_user_responses.sql
│       └── 📄 20241203_medical_info.sql
├── 📂 src/
│   ├── 📂 app/                    # App Router (Next.js 13+)
│   │   ├── 📄 layout.tsx          # グローバルレイアウト
│   │   ├── 📄 page.tsx            # ランディングページ
│   │   ├── 📄 globals.css         # グローバルCSS + デザインシステム
│   │   ├── 📂 check/              # ゆっくりチェック
│   │   │   ├── 📄 page.tsx
│   │   │   ├── 📄 layout.tsx
│   │   │   └── 📂 [step]/
│   │   │       └── 📄 page.tsx
│   │   ├── 📂 guide/              # あなた専用ガイド
│   │   │   ├── 📄 page.tsx
│   │   │   └── 📂 [id]/
│   │   │       ├── 📄 page.tsx
│   │   │       └── 📂 share/
│   │   │           └── 📄 page.tsx
│   │   ├── 📂 about/              # 運営者について
│   │   │   └── 📄 page.tsx
│   │   ├── 📂 faq/                # よくある質問
│   │   │   └── 📄 page.tsx
│   │   ├── 📂 api/                # API Routes
│   │   │   ├── 📂 check/
│   │   │   │   ├── 📄 submit/route.ts
│   │   │   │   └── 📄 progress/route.ts
│   │   │   ├── 📂 guide/
│   │   │   │   ├── 📄 generate/route.ts
│   │   │   │   └── 📄 share/route.ts
│   │   │   └── 📂 ai/
│   │   │       ├── 📄 analyze/route.ts
│   │   │       └── 📄 personalize/route.ts
│   │   └── 📂 legal/              # 法的ページ
│   │       ├── 📂 terms/
│   │       │   └── 📄 page.tsx
│   │       └── 📂 privacy/
│   │           └── 📄 page.tsx
│   ├── 📂 components/             # 再利用可能コンポーネント
│   │   ├── 📂 ui/                 # 基本UIコンポーネント
│   │   │   ├── 📄 index.ts        # エクスポート統一
│   │   │   ├── 📄 Button.tsx
│   │   │   ├── 📄 Card.tsx
│   │   │   ├── 📄 Badge.tsx
│   │   │   ├── 📄 Progress.tsx
│   │   │   ├── 📄 Modal.tsx
│   │   │   ├── 📄 Input.tsx
│   │   │   ├── 📄 Select.tsx
│   │   │   ├── 📄 Checkbox.tsx
│   │   │   ├── 📄 RadioGroup.tsx
│   │   │   └── 📄 LoadingSpinner.tsx
│   │   ├── 📂 layout/             # レイアウトコンポーネント
│   │   │   ├── 📄 Header.tsx
│   │   │   ├── 📄 Footer.tsx
│   │   │   ├── 📄 Navigation.tsx
│   │   │   ├── 📄 Breadcrumb.tsx
│   │   │   └── 📄 Container.tsx
│   │   ├── 📂 landing/            # ランディング専用
│   │   │   ├── 📄 HeroSection.tsx
│   │   │   ├── 📄 FeatureSection.tsx
│   │   │   ├── 📄 StepsSection.tsx
│   │   │   ├── 📄 OperatorSection.tsx
│   │   │   ├── 📄 FAQSection.tsx
│   │   │   └── 📄 CTASection.tsx
│   │   ├── 📂 check/              # ゆっくりチェック専用
│   │   │   ├── 📄 QuestionCard.tsx
│   │   │   ├── 📄 ProgressTracker.tsx
│   │   │   ├── 📄 AnswerOption.tsx
│   │   │   ├── 📄 SaveButton.tsx
│   │   │   ├── 📄 NavigationButtons.tsx
│   │   │   └── 📄 EncouragementMessage.tsx
│   │   ├── 📂 guide/              # あなた専用ガイド
│   │   │   ├── 📄 GuideHeader.tsx
│   │   │   ├── 📄 TreatmentTimeline.tsx
│   │   │   ├── 📄 CostSection.tsx
│   │   │   ├── 📄 TrialSection.tsx
│   │   │   ├── 📄 HospitalSection.tsx
│   │   │   ├── 📄 ShareButton.tsx
│   │   │   └── 📄 DisclaimerNote.tsx
│   │   ├── 📂 shared/             # 共通機能コンポーネント
│   │   │   ├── 📄 ScrollReveal.tsx
│   │   │   ├── 📄 ErrorBoundary.tsx
│   │   │   ├── 📄 Toast.tsx
│   │   │   ├── 📄 ConfirmDialog.tsx
│   │   │   └── 📄 SmoothScroll.tsx
│   │   └── 📂 icons/              # アイコンコンポーネント
│   │       ├── 📄 index.ts
│   │       ├── 📄 Logo.tsx
│   │       ├── 📄 CheckIcon.tsx
│   │       ├── 📄 HeartIcon.tsx
│   │       └── 📄 ArrowIcon.tsx
│   ├── 📂 lib/                    # ユーティリティ & 設定
│   │   ├── 📄 supabase.ts         # Supabase設定
│   │   ├── 📄 utils.ts            # 汎用ユーティリティ
│   │   ├── 📄 constants.ts        # 定数定義
│   │   ├── 📄 validations.ts      # バリデーションスキーマ
│   │   ├── 📄 ai.ts               # AI機能統合
│   │   └── 📄 analytics.ts        # アナリティクス
│   ├── 📂 hooks/                  # カスタムフック
│   │   ├── 📄 useLocalStorage.ts
│   │   ├── 📄 useProgress.ts
│   │   ├── 📄 useUserResponse.ts
│   │   ├── 📄 useGuideGeneration.ts
│   │   ├── 📄 useShare.ts
│   │   └── 📄 useAnalytics.ts
│   ├── 📂 types/                  # TypeScript型定義
│   │   ├── 📄 user.ts
│   │   ├── 📄 response.ts
│   │   ├── 📄 guide.ts
│   │   ├── 📄 medical.ts
│   │   └── 📄 api.ts
│   ├── 📂 styles/                 # スタイル関連
│   │   ├── 📄 design-system.css   # デザインシステム（CSS変数）
│   │   ├── 📄 components.css      # コンポーネント固有スタイル
│   │   └── 📄 animations.css      # アニメーション定義
│   └── 📂 data/                   # 静的データ
│       ├── 📄 questions.ts        # 質問データ
│       ├── 📄 cancer-types.ts     # がん種データ
│       ├── 📄 regions.ts          # 地域データ
│       └── 📄 faq.ts              # FAQ データ
├── 📂 public/
│   ├── 📄 favicon.ico
│   ├── 📄 logo.svg
│   ├── 📂 images/
│   │   ├── 📄 hero-visual.png
│   │   └── 📄 operator-photo.jpg
│   └── 📂 icons/
│       ├── 📄 apple-touch-icon.png
│       └── 📄 favicon-32x32.png
├── 📂 docs/                       # 設計ドキュメント
│   ├── 📄 design-system.md
│   ├── 📄 component-guide.md
│   ├── 📄 api-specification.md
│   └── 📄 deployment.md
└── 📂 tests/                      # テスト
    ├── 📂 __mocks__/
    ├── 📂 components/
    ├── 📂 pages/
    └── 📄 setup.ts
```

## 🎨 デザインシステム統合戦略

### CSS変数ベースのデザインシステム
```css
/* src/styles/design-system.css */
:root {
  /* Sottoriブランドカラー */
  --brand-primary: #5a8a6b;
  --brand-primary-light: #9bb5a6;
  --brand-primary-dark: #4a6d5a;
  --brand-accent: #6ba3d6;
  --brand-warm: #c29768;
  
  /* セマンティックカラー */
  --success: #2d7d52;
  --info: #4a7ba7;
  --neutral: #7a8b8c;
  
  /* テキストハイアラキー */
  --text-primary: #2c3e50;
  --text-secondary: #5d6d7e;
  --text-soft: #8e9aab;
  
  /* 背景システム */
  --bg-primary: #fdfcfa;
  --bg-soft: #f7f5f1;
  --bg-card: #ffffff;
  --bg-subtle: #f0ede9;
  
  /* スペーシング（黄金比ベース） */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.618rem;
  --space-xl: 2.618rem;
  --space-xxl: 4.236rem;
  --space-xxxl: 6.854rem;
  
  /* タイポグラフィ */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
  
  /* ボーダーラディウス */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-xxl: 1.5rem;
  
  /* シャドウ */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.15);
}
```

## 🧩 コンポーネント設計原則

### 1. Atomic Design ベース
```
Atoms (原子) → Molecules (分子) → Organisms (有機体) → Templates → Pages
```

### 2. コンポーネント例
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

// components/check/QuestionCard.tsx
interface QuestionCardProps {
  question: Question;
  currentAnswer?: Answer;
  onAnswer: (answer: Answer) => void;
  showEncouragement?: boolean;
}

// components/guide/TreatmentTimeline.tsx
interface TreatmentTimelineProps {
  cancerType: CancerType;
  stage: Stage;
  treatments: Treatment[];
  personalizedNotes?: string[];
}
```

## 🗄️ データベース設計（Supabase）

### 主要テーブル
```sql
-- ユーザー回答
user_responses (
  id uuid PRIMARY KEY,
  session_id text,
  step integer,
  question_id text,
  answer jsonb,
  created_at timestamp,
  updated_at timestamp
);

-- 生成されたガイド
personalized_guides (
  id uuid PRIMARY KEY,
  user_response_id uuid,
  content jsonb,
  share_token text UNIQUE,
  expires_at timestamp,
  created_at timestamp
);

-- 医療情報ベース
medical_information (
  id uuid PRIMARY KEY,
  cancer_type text,
  category text, -- 'treatment', 'cost', 'trial', 'hospital'
  content jsonb,
  source text,
  last_updated timestamp
);

-- 地域情報
regional_data (
  id uuid PRIMARY KEY,
  prefecture text,
  hospitals jsonb,
  support_programs jsonb,
  updated_at timestamp
);
```

## 🚀 開発フェーズ計画

### Phase 1: 基盤構築（2週間）
1. **プロジェクト初期化**
   - Next.js 13+ セットアップ
   - Supabase プロジェクト作成
   - デザインシステム CSS 実装
   - 基本コンポーネント作成（Button, Card, Badge等）

2. **ランディングページ実装**
   - 現在のHTMLをReactコンポーネント化
   - レスポンシブ対応
   - アニメーション実装

### Phase 2: ゆっくりチェック機能（3週間）
1. **質問フロー実装**
   - 5つの質問画面
   - プログレス管理
   - 自動保存機能
   - 途中中断・再開

2. **データ管理**
   - ローカルストレージ
   - Supabase連携
   - バリデーション

### Phase 3: あなた専用ガイド（3週間）
1. **個別化エンジン**
   - AI統合（OpenAI API）
   - 医療情報データベース
   - 地域情報統合

2. **ガイド表示**
   - 動的コンテンツ生成
   - 共有機能
   - PDF出力

### Phase 4: 継続機能・最適化（2週間）
1. **追加機能**
   - 通知システム
   - 情報更新アラート
   - アナリティクス

2. **最適化**
   - パフォーマンス改善
   - SEO対策
   - アクセシビリティ

## 💡 技術選定理由

### 🔧 フロントエンド
- **Next.js 13+**: App Router、RSC、ISRでSEOとパフォーマンス最適化
- **TypeScript**: 型安全性によるバグ減少
- **Tailwind CSS**: ユーティリティファーストでデザインシステム統合

### 🗄️ バックエンド
- **Supabase**: リアルタイム機能、認証、ストレージを統合
- **Edge Functions**: API処理の高速化
- **RLS**: 行レベルセキュリティでデータ保護

### 🤖 AI統合
- **OpenAI API**: GPT-4での情報個別化
- **Vector Search**: 医療情報の意味的検索
- **Fine-tuning**: 医療専門性向上

## 📋 次のアクション

1. **今すぐ開始**: プロジェクト初期化とデザインシステム
2. **1週間以内**: 基本コンポーネント完成
3. **2週間以内**: ランディングページのReact化完了

どこから始めましょうか？まずはプロジェクトの初期化から進めますか？ 