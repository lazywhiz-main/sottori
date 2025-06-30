# Sottori - 開発計画書

## 開発方針
**一人運営での持続可能な開発**を前提とした段階的リリース計画

---

## Phase 1: MVP開発（3-4ヶ月）

### 開発優先順位

#### 1. 基盤構築（1ヶ月）
**技術スタック決定**
- フロントエンド: Next.js + TypeScript + Tailwind CSS
- データベース: Supabase PostgreSQL + Supabase Auth
- API: Supabase Client + Supabase Edge Functions（必要時）
- ホスティング: Vercel
- AI開発支援: Claude（コード生成・コンテンツ作成・最適化）

**デザインシステム構築**
- カラーパレット実装（#556AAB, #E69974, #FAD8C5, #F4CB88）
- コンポーネントライブラリ作成
- レスポンシブ対応
- アクセシビリティ対応

#### 2. コア機能開発（2ヶ月）

**Week 1-2: 30秒セルフチェック**
- 質問設計・文言決定
- フォーム UI/UX実装
- 「わからない」選択肢の実装
- 途中保存機能
- バリデーション・エラーハンドリング

**Week 3-4: 3分ロードマップ**
- ロジック設計（質問回答→情報マッピング）
- 情報コンテンツ作成
- 表示UI実装
- 「今すぐ決めなくても大丈夫」メッセージ統合

**Week 5-6: かんたん共有機能**
- 共有URL生成機能
- 家族向け「やさしい日本語」版作成
- QRコード生成
- PDF出力機能
- プライバシー設定

**Week 7-8: 統合・テスト**
- 全機能の統合テスト
- ユーザビリティテスト
- パフォーマンス最適化
- セキュリティ監査

#### 3. ランディングページ完成（0.5ヶ月）
- キービジュアル統合（提供される手のイラスト）
- 必要イラスト作成・統合
- SEO対策
- アナリティクス設定

#### 4. リリース準備（0.5ヶ月）
- ドメイン取得・SSL設定
- プライバシーポリシー・利用規約
- 法務確認
- 監視・ログ設定

---

## Phase 2: 第1段階拡張（2-3ヶ月）

### 時系列サポート機能

#### 1. 継続フォロー基盤（1ヶ月）
- Supabase Edge Functions でメール通知
- ユーザー状態管理（Supabase DB）
- スケジューリング機能（Supabase Cron）

#### 2. チェックイン機能（1-2ヶ月）
- 1週間後チェックイン
- 1ヶ月後振り返り
- 変化の可視化
- 継続的なロードマップ更新

---

## Phase 3: 第2段階拡張（4-6ヶ月）

### 情報深掘りサポート

#### 1. 質問リスト生成（2ヶ月）
- AI活用した質問生成
- 医師相談準備ツール
- カスタマイズ機能

#### 2. 比較検討ツール（2-3ヶ月）
- 治療選択肢の詳細比較
- 個人の価値観との照合
- 意思決定支援フレームワーク

#### 3. セカンドオピニオン準備（1ヶ月）
- 必要情報の整理
- 医療機関検索連携
- 資料作成支援

---

## 技術的実装詳細

### アーキテクチャ設計

```
Frontend (Next.js + Supabase)
├── pages/
│   ├── index.tsx (ランディング)
│   ├── check/
│   │   ├── start.tsx (セルフチェック開始)
│   │   ├── questions.tsx (質問画面)
│   │   └── result.tsx (結果・ロードマップ)
│   └── share/
│       └── [id].tsx (共有ページ)
├── components/
│   ├── ui/ (基本コンポーネント)
│   ├── forms/ (フォーム関連)
│   └── medical/ (医療特化)
├── lib/
│   ├── supabase/ (Supabase Client設定)
│   ├── utils/ (ユーティリティ)
│   └── constants/ (定数・設定)
└── supabase/
    ├── migrations/ (DB マイグレーション)
    └── functions/ (Edge Functions)
```

### データベース設計

```sql
-- Supabase Auth自動生成テーブル (auth.users) を活用

-- セルフチェック結果
CREATE TABLE self_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 生成されたロードマップ
CREATE TABLE roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  self_check_id UUID REFERENCES self_checks(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 共有設定
CREATE TABLE shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  family_mode BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) 設定
ALTER TABLE self_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
```

### セキュリティ・プライバシー対策

#### データ保護
- 個人情報の暗号化
- セッション管理の強化
- CSRF・XSS対策
- SQLインジェクション対策

#### プライバシー配慮
- 最小限の情報収集
- 明確な同意取得
- データ削除機能
- 匿名化処理

---

## 開発スケジュール（詳細）

### Phase 1: MVP（16週間）

**Week 1-4: 基盤構築**
- W1: Supabase + Vercel プロジェクト作成・連携
- W2: デザインシステム実装（確定カラーパレット）
- W3: Supabase Auth設定・基本UI構築
- W4: データベース設計・RLS設定・Supabase Client統合

**Week 5-12: コア機能開発**
- W5-6: セルフチェック機能
- W7-8: ロードマップ生成機能
- W9-10: 共有機能
- W11-12: 統合・テスト

**Week 13-16: リリース準備**
- W13: ランディングページ完成
- W14: イラスト統合・最終調整
- W15: 法務・セキュリティ確認
- W16: リリース・監視設定

### マイルストーン

**M1 (Week 4)**: 基盤完成・デモ環境構築
**M2 (Week 8)**: コア機能プロトタイプ完成
**M3 (Week 12)**: 全機能統合・内部テスト完了
**M4 (Week 16)**: 本番リリース

---

## リソース計画

### 開発時間見積もり
- **Phase 1**: 400-500時間（週25-30時間 × 16週）
- **Phase 2**: 200-300時間（週20-25時間 × 12週）
- **Phase 3**: 400-600時間（週20-25時間 × 24週）

### 外部リソース
- **イラスト作成**: 予算確保済み（ユーザー提供）
- **医療監修**: 専門家ネットワーク活用
- **法務確認**: 必要に応じて専門家相談
- **ユーザビリティテスト**: 知人・関係者協力
- **AI開発支援**: Claude（コード生成・デバッグ・最適化・コンテンツ作成）

### 運営コスト（月額）
- **Supabase**: $0-25 (無料枠→Pro: $25/月)
- **Vercel**: $0-20 (Hobby無料→Pro: $20/月)
- **ドメイン**: $10-15
- **監視・分析**: Supabase/Vercel標準機能で無料
- **合計**: $10-60/月 (大幅削減！)

---

## リスク管理

### 技術的リスク
- **対策**: プロトタイプでの早期検証
- **バックアップ**: 代替技術スタックの準備

### 法的リスク
- **対策**: 医療行為との明確な区別
- **バックアップ**: 法務専門家との継続相談

### 運営リスク
- **対策**: 段階的リリースでリソース調整
- **バックアップ**: 機能縮小での継続運営プラン

### スケジュールリスク
- **対策**: バッファ期間の確保
- **バックアップ**: 機能優先度の明確化

---

## 成功指標

### Phase 1 (MVP)
- **リリース**: 予定通りの機能完成
- **品質**: 重大バグゼロでのリリース
- **ユーザビリティ**: テストでの高評価

### Phase 2以降
- **ユーザー満足度**: NPS 50以上
- **継続利用率**: 1週間後50%、1ヶ月後30%
- **共有率**: セルフチェック完了者の40%が共有機能利用

---

## 最終目標
**一人運営で持続可能な、がん患者に真に役立つサービスの実現** 