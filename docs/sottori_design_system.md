# そっとり - デザインシステム & ブランドガイドライン

## 🎨 ブランドアイデンティティ

### ブランドコンセプト
**「迷っても、頼ってもいい。次の一歩は、あなたのペースで。」**

- **そっと寄り添う**: 押し付けがましくない、優しい支援
- **医療への敬意**: 専門性を尊重しつつ、親しみやすさを両立
- **個人の尊重**: ユーザーのペースと状況を最優先

### ブランド価値
1. **共感性（Empathy）** - ユーザーの感情に寄り添う
2. **信頼性（Trustworthiness）** - 医療情報を扱う責任感
3. **記憶性（Memorability）** - 他とは違う、印象的な体験
4. **包括性（Inclusivity）** - 誰もが使いやすい設計

---

## 🎯 カラーパレット

### プライマリカラー
```css
:root {
  /* ブランドコア */
  --brand-primary: #5a8a6b;        /* そっとりグリーン */
  --brand-primary-light: #9bb5a6;  /* ライトグリーン */
  --brand-primary-dark: #4a6d5a;   /* ダークグリーン */
  
  /* アクセント */
  --brand-accent: #6ba3d6;         /* 温かい青 */
  --brand-warm: #c29768;           /* 温かいブラウン */
}
```

### セマンティックカラー（色弱完全対応）
```css
:root {
  /* 機能的な色（形・テキスト・アイコンとの組み合わせ必須） */
  --success: #2d7d52;     /* 成功・完了 */
  --warning: #b8956a;     /* 注意・警告 */
  --info: #4a7ba7;        /* 情報・ヒント */
  --neutral: #7a8b8c;     /* 中立・無効 */
}
```

### テキストハイアラキー
```css
:root {
  --text-primary: #2c3e50;    /* メインテキスト */
  --text-secondary: #5d6d7e;  /* サブテキスト */
  --text-soft: #8e9aab;       /* 補足テキスト */
  --text-disabled: #bcc4d0;   /* 無効テキスト */
}
```

### 背景システム
```css
:root {
  --bg-primary: #fdfcfa;      /* メイン背景（温かい白） */
  --bg-soft: #f7f5f1;         /* ソフト背景 */
  --bg-card: #ffffff;         /* カード背景 */
  --bg-subtle: #f0ede9;       /* 微細な背景 */
}
```

### ボーダー & アウトライン
```css
:root {
  --border-primary: #e6e2dc;  /* メインボーダー */
  --border-soft: #f0ede9;     /* ソフトボーダー */
  --border-accent: #d4d8dc;   /* アクセントボーダー */
  --border-focus: var(--brand-accent);  /* フォーカス */
}
```

---

## 📏 スペーシングシステム（黄金比ベース）

```css
:root {
  /* 数学的に美しいスペーシング */
  --space-xs: 0.25rem;     /* 4px */
  --space-sm: 0.5rem;      /* 8px */
  --space-md: 1rem;        /* 16px */
  --space-lg: 1.618rem;    /* 26px - 黄金比 */
  --space-xl: 2.618rem;    /* 42px - 黄金比 */
  --space-xxl: 4.236rem;   /* 68px - 黄金比 */
  --space-xxxl: 6.854rem;  /* 110px - 黄金比 */
}
```

### 使用ルール
- **コンポーネント内のパディング**: `--space-md` 〜 `--space-xl`
- **セクション間の余白**: `--space-xxl` 〜 `--space-xxxl`
- **要素間の小さな余白**: `--space-xs` 〜 `--space-sm`
- **カード・ボタンの内側**: `--space-lg` 〜 `--space-xl`

---

## 🔤 タイポグラフィシステム

### フォントスタック
```css
font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Segoe UI', system-ui, sans-serif;
```

### サイズスケール
```css
:root {
  --text-xs: 0.75rem;      /* 12px - キャプション */
  --text-sm: 0.875rem;     /* 14px - 小テキスト */
  --text-base: 1rem;       /* 16px - ボディ */
  --text-lg: 1.125rem;     /* 18px - 大ボディ */
  --text-xl: 1.25rem;      /* 20px - サブ見出し */
  --text-2xl: 1.5rem;      /* 24px - 見出し */
  --text-3xl: 1.875rem;    /* 30px - 大見出し */
  --text-4xl: 2.25rem;     /* 36px - タイトル */
  --text-5xl: 3rem;        /* 48px - ディスプレイ */
  --text-6xl: 3.75rem;     /* 60px - ヒーロー */
}
```

### 行間
```css
:root {
  --leading-tight: 1.25;     /* タイトル用 */
  --leading-snug: 1.375;     /* 見出し用 */
  --leading-normal: 1.5;     /* 標準 */
  --leading-relaxed: 1.625;  /* 読みやすさ重視 */
  --leading-loose: 2;        /* 特別な場合 */
}
```

### 文字間隔
```css
:root {
  --tracking-tighter: -0.05em;  /* 大きな見出し */
  --tracking-tight: -0.025em;   /* 見出し */
  --tracking-normal: 0em;       /* 標準 */
  --tracking-wide: 0.025em;     /* キャプション */
  --tracking-wider: 0.05em;     /* ロゴ・特別な場合 */
}
```

### タイポグラフィクラス
```css
.text-hero {
  font-size: clamp(var(--text-4xl), 5vw, var(--text-6xl));
  font-weight: 200;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
}

.text-display {
  font-size: clamp(var(--text-3xl), 4vw, var(--text-5xl));
  font-weight: 300;
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
}

.text-heading {
  font-size: clamp(var(--text-2xl), 3vw, var(--text-3xl));
  font-weight: 400;
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
}

.text-subheading {
  font-size: var(--text-xl);
  font-weight: 500;
  line-height: var(--leading-normal);
}

.text-body-large {
  font-size: var(--text-lg);
  font-weight: 400;
  line-height: var(--leading-relaxed);
}

.text-body {
  font-size: var(--text-base);
  font-weight: 400;
  line-height: var(--leading-relaxed);
}

.text-caption {
  font-size: var(--text-sm);
  font-weight: 400;
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wide);
}
```

---

## 🔘 ボーダーラディウス

```css
:root {
  --radius-xs: 0.125rem;   /* 2px - 微細 */
  --radius-sm: 0.375rem;   /* 6px - 小要素 */
  --radius-md: 0.5rem;     /* 8px - 標準 */
  --radius-lg: 0.75rem;    /* 12px - カード */
  --radius-xl: 1rem;       /* 16px - 大カード */
  --radius-2xl: 1.5rem;    /* 24px - 特別な要素 */
  --radius-3xl: 2rem;      /* 32px - 大きな要素 */
  --radius-full: 9999px;   /* 完全な円形 */
}
```

---

## 🌟 シャドウシステム

```css
:root {
  /* ブランドカラーを含んだ影 */
  --shadow-xs: 0 1px 2px 0 rgba(90, 138, 107, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(90, 138, 107, 0.1), 0 1px 2px 0 rgba(90, 138, 107, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(90, 138, 107, 0.1), 0 2px 4px -1px rgba(90, 138, 107, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(90, 138, 107, 0.1), 0 4px 6px -2px rgba(90, 138, 107, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(90, 138, 107, 0.1), 0 10px 10px -5px rgba(90, 138, 107, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(90, 138, 107, 0.25);
  
  /* ブランド専用エフェクト */
  --glow-soft: 0 0 20px rgba(90, 138, 107, 0.15);
  --glow-medium: 0 0 30px rgba(90, 138, 107, 0.25);
  --glow-strong: 0 0 40px rgba(90, 138, 107, 0.35);
}
```

---

## ⚡ トランジション

```css
:root {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 🧩 コンポーネント設計ルール

### 1. ボタン
```css
/* プライマリボタン */
.btn-primary {
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark));
  color: white;
  padding: var(--space-lg) var(--space-xxl);
  border-radius: var(--radius-full);
  font-size: var(--text-xl);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-base);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-2xl), var(--glow-medium);
}

/* セカンダリボタン */
.btn-secondary {
  background: white;
  color: var(--brand-primary);
  border: 2px solid var(--border-primary);
  /* 他のプロパティは同様 */
}
```

### 2. カード
```css
.card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}
```

### 3. 入力フィールド
```css
.input {
  padding: var(--space-md) var(--space-lg);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: all var(--transition-base);
}

.input:focus {
  outline: none;
  border-color: var(--brand-accent);
  box-shadow: 0 0 0 3px rgba(107, 163, 214, 0.1);
}
```

---

## 🎭 アニメーション原則

### 基本ルール
1. **自然な動き**: イージング `cubic-bezier(0.4, 0, 0.2, 1)` を基本使用
2. **適切な速度**: 150ms（小要素）〜 350ms（大要素）
3. **目的のある動き**: 装飾ではなく、ユーザビリティ向上のため

### 標準アニメーション
```css
/* フェードイン */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(var(--space-xl));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ホバーエフェクト */
.hover-lift {
  transition: transform var(--transition-base);
}

.hover-lift:hover {
  transform: translateY(-4px);
}
```

---

## ♿ アクセシビリティ要件

### 色弱対応
- **色のみに依存しない**: 必ず形・テキスト・アイコンとの組み合わせ
- **コントラスト比**: 4.5:1以上（WCAG 2.1 AA準拠）
- **重要な情報**: 複数の視覚的手がかりで表現

### フォーカス管理
```css
.focus-visible {
  outline: 3px solid var(--brand-accent);
  outline-offset: 2px;
}
```

### 動きへの配慮
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📱 レスポンシブブレークポイント

```css
/* モバイルファースト設計 */
:root {
  --breakpoint-sm: 640px;   /* スマートフォン */
  --breakpoint-md: 768px;   /* タブレット */
  --breakpoint-lg: 1024px;  /* デスクトップ */
  --breakpoint-xl: 1280px;  /* 大画面 */
}

/* 使用例 */
@media (min-width: 768px) {
  .container {
    padding: 0 var(--space-xl);
  }
}
```

---

## 🔧 実装ガイドライン

### CSS構成
```
src/
├── styles/
│   ├── globals.css          # デザイントークン
│   ├── components/          # コンポーネントスタイル
│   ├── utilities/           # ユーティリティクラス
│   └── animations/          # アニメーション定義
```

### コンポーネント命名規則
- **BEM方式**: `.block__element--modifier`
- **例**: `.card`, `.card__title`, `.card--featured`

### 状態管理
```css
/* 状態クラス */
.is-loading { /* ローディング状態 */ }
.is-disabled { /* 無効状態 */ }
.is-active { /* アクティブ状態 */ }
.is-hidden { /* 非表示状態 */ }
```

---

## 🎯 ブランド特有のルール

### ロゴ使用
- **フォント**: システムフォント、font-weight: 200-300
- **サイズ**: `--text-3xl` が基本
- **色**: `var(--brand-primary)` 
- **レタースペーシング**: `var(--tracking-wider)`

### アイコン
- **スタイル**: 絵文字ベース（温かみ重視）
- **カスタマイズ**: hue-rotate()でブランドカラーに調整
- **サイズ**: 周囲のテキストサイズに合わせて1.2〜1.5倍

### 写真・イラスト
- **トーン**: 温かみのある、自然な色調
- **フィルター**: 必要に応じて`saturate(0.9) hue-rotate(10deg)`

---

## 🚨 実装時の注意点

### パフォーマンス
- **CSS最適化**: 未使用スタイルの削除
- **画像最適化**: WebP形式、遅延読み込み
- **アニメーション**: `transform`と`opacity`のみ使用

### ブラウザサポート
- **最新2バージョン**: Chrome, Firefox, Safari, Edge
- **モバイル**: iOS Safari 14+, Chrome Mobile 90+

### 品質保証
- **色弱シミュレーター**: 実装後の確認必須
- **コントラストチェッカー**: 4.5:1以上の確認
- **レスポンシブテスト**: 全ブレークポイントでの動作確認

---

## 📋 実装チェックリスト

### 基本
- [ ] デザイントークンの設定
- [ ] タイポグラフィシステムの実装
- [ ] カラーパレットの適用
- [ ] スペーシングシステムの適用

### コンポーネント
- [ ] ボタンコンポーネント
- [ ] カードコンポーネント
- [ ] 入力フィールドコンポーネント
- [ ] ナビゲーションコンポーネント

### アクセシビリティ
- [ ] キーボードナビゲーション
- [ ] フォーカス管理
- [ ] 色弱対応確認
- [ ] コントラスト比確認

### パフォーマンス
- [ ] CSS最適化
- [ ] アニメーション最適化
- [ ] 画像最適化
- [ ] レスポンシブ最適化

---

このデザインシステムを基に、一貫性のある「そっとり」らしい体験を実装してください。質問や不明点があれば、いつでもお気軽にお尋ねください。