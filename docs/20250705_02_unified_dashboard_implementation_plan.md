# Sottori 統合ダッシュボード実装計画書

## 📋 概要

このドキュメントは、Sottoriの統合ダッシュボード（UnifiedDashboard）の実装計画を詳細に記載したものです。設計書（20250705_01_experience_design_detailed_scenario.md）に基づき、段階的な実装により、ユーザー体験を最優先とした機能実装を行います。

## 🎯 実装方針

### 基本原則
1. **フロント体験最優先**: デザインとUXを完全に再現してから機能追加
2. **段階的実装**: 小さな機能単位で実装・テスト・改善を繰り返す
3. **非同期処理**: APIエンドポイントは非同期で実装
4. **既存リソース活用**: 既存のページ・コンポーネント・データベースを最大限活用

### 技術スタック
- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes, Supabase Edge Functions
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth

## 📊 フェーズ別実装計画

### フェーズ1: 基本的なインタラクション機能（最優先）

#### 1.1 ボタンクリック機能の実装
**目標**: 静的なデザインに基本的なナビゲーション機能を追加

**実装内容**:
```typescript
// 遷移先（設計書準拠）
- 「状況を更新」ボタン → /status-update ページ
- 「詳しく見る」ボタン → /roadmap-detail ページ（新規作成）
- 「すべて見る」ボタン → /info-updates ページ（既存活用）
```

**技術仕様**:
- Next.jsの`useRouter`を使用したクライアントサイドナビゲーション
- ボタンコンポーネントに`onClick`ハンドラーを追加
- ローディング状態の表示（必要に応じて）

#### 1.2 動的なユーザー名表示
**目標**: 認証システムからユーザー情報を取得して表示

**実装内容**:
```typescript
// プロフィール情報の動的化
- ユーザー名: profilesテーブルから取得
- プロフィールアバター: ユーザー名の頭文字を表示
- 治療ステータス: user_treatment_phasesテーブルから取得
```

**技術仕様**:
- `useAuth`フックを使用してユーザー情報を取得
- サーバーサイドでのデータ取得（SSR対応）
- フォールバック表示（ローディング中・エラー時）

### フェーズ2: ダッシュボード概要の動的化

#### 2.1 関連情報の動的表示（structured_content_pool + raw_content_pool対応）

**使用テーブル**:
- `structured_content_pool` - 構造化された情報コンテンツ
- `raw_content_pool` - スクレイピング元データ（参照元URL等）
- `structured_content_relevance_scores` - ユーザー別関連度スコア
- `user_content_consumption_history` - ユーザーの情報消費履歴

**実装内容**:
```sql
-- 関連情報取得クエリ（raw_content_poolとの結合）
SELECT 
  scp.*,
  rcp.source_url,
  rcp.original_title,
  rcp.published_date,
  scrs.final_relevance_score,
  scrs.urgency_score
FROM structured_content_pool scp
JOIN raw_content_pool rcp 
  ON scp.raw_content_id = rcp.id
JOIN structured_content_relevance_scores scrs 
  ON scp.id = scrs.content_id
WHERE scrs.user_id = :user_id
  AND scrs.final_relevance_score > 0.7
  AND scp.is_active = true
ORDER BY scrs.urgency_score DESC, scrs.final_relevance_score DESC
LIMIT 3;
```

**データフロー**:
1. `raw_content_pool`からスクレイピングした生データを取得
2. `structured_content_pool`で構造化・分類された情報を取得
3. `structured_content_relevance_scores`でユーザー別関連度を計算
4. 参照元URL・公開日・元タイトル等のメタデータも含めて表示

**表示ロジック**:
- 緊急度・関連度の高い情報を上位3件表示
- 未読情報の優先表示
- カテゴリ別の色分け表示
- 参照元URL・公開日等のメタデータ表示
- 元のタイトルと構造化されたタイトルの使い分け

#### 2.2 治療ロードマップ概要の動的化

**使用テーブル**:
- `user_treatment_phases` - ユーザー別治療段階
- `treatment_roadmaps` - 治療ロードマップ詳細（新規作成予定）
- `user_roadmap_progress` - ユーザー別進捗（新規作成予定）

**実装内容**:
```typescript
// 進捗計算ロジック
const calculateProgress = (currentPhase: number, totalPhases: number) => {
  return Math.round((currentPhase / totalPhases) * 100);
};

// 次のマイルストーン取得
const getNextMilestone = (currentPhase: string) => {
  // フェーズ別の次のステップを定義
  const milestones = {
    'diagnosis': '治療方針決定',
    'treatment_planning': '治療開始',
    'treatment': '治療完了',
    'follow_up': '定期検査'
  };
  return milestones[currentPhase] || '次のステップ';
};
```

**表示内容**:
- 現在の治療段階
- 進捗率（プログレスバー）
- 次のマイルストーン
- 予想完了日

#### 2.3 次のアクション統合エリアの動的化

**実装内容**:
```typescript
// アクション優先度計算
const getActionPriority = (action: Action) => {
  const priorities = {
    'status_update': 1,    // 状況更新（最優先）
    'appointment': 2,      // 予約関連
    'medication': 3,       // 服薬関連
    'information': 4       // 情報確認
  };
  return priorities[action.type] || 5;
};
```

**表示ロジック**:
- 優先度順でのアクション表示
- 期限があるアクションの強調表示
- 完了済みアクションの非表示

### フェーズ3: 詳細ページの実装

#### 3.1 治療ロードマップ詳細ページ（/roadmap-detail）

**設計方針**:
- フェーズ1で概要版の内容を決定してから詳細設計
- 段階的開示による情報の整理
- インタラクティブな進捗管理

**実装内容**:
```typescript
// ページ構造
interface RoadmapDetailPage {
  overview: {
    currentPhase: string;
    progress: number;
    estimatedCompletion: Date;
  };
  phases: {
    id: string;
    name: string;
    description: string;
    status: 'completed' | 'current' | 'upcoming';
    tasks: Task[];
  }[];
  milestones: Milestone[];
}
```

#### 3.2 関連情報詳細ページ（/info-updates）

**設計方針**:
- 既存のinfo-updatesページを拡張
- パーソナライゼーション機能の強化
- フィルタリング・ソート機能

**実装内容**:
```typescript
// 拡張機能
interface InfoUpdatesEnhanced {
  filters: {
    category: string[];
    urgency: 'high' | 'medium' | 'low';
    readStatus: 'read' | 'unread';
  };
  sorting: {
    by: 'relevance' | 'date' | 'urgency';
    order: 'asc' | 'desc';
  };
  personalization: {
    relevanceScore: number;
    recommendedContent: Content[];
  };
}
```

### フェーズ4: 高度な機能実装

#### 4.1 パーソナライゼーション機能の強化

**実装内容**:
- ユーザーの行動履歴に基づく推薦システム
- 機械学習による関連度スコアの動的調整
- カスタマイズ可能なダッシュボードレイアウト

#### 4.2 リアルタイム更新機能

**技術仕様**:
- Supabase Realtimeを使用したリアルタイム更新
- WebSocket接続による即座の情報反映
- オフライン対応（Service Worker）

## 🔧 API設計

### 4.1 非同期APIエンドポイント

#### 統合ダッシュボード用API
```typescript
// GET /api/dashboard/summary
interface DashboardSummaryResponse {
  user: {
    name: string;
    avatar: string;
    status: string;
  };
  roadmap: {
    currentPhase: string;
    progress: number;
    nextMilestone: string;
  };
  relatedInfo: {
    urgent: InfoItem[];
    relevant: InfoItem[];
  };
  nextActions: Action[];
}
```

#### 関連情報取得API
```typescript
// GET /api/structured-content/relevant
interface RelevantContentResponse {
  content: (StructuredContent & {
    sourceUrl?: string;
    originalTitle?: string;
    publishedDate?: string;
  })[];
  totalCount: number;
  filters: ContentFilters;
}
```

#### 治療ロードマップAPI
```typescript
// GET /api/roadmap/progress
interface RoadmapProgressResponse {
  currentPhase: TreatmentPhase;
  progress: number;
  phases: TreatmentPhase[];
  milestones: Milestone[];
}
```

### 4.2 Supabase Edge Functions

**推奨理由**:
- サーバーレスでスケーラブル
- PostgreSQLとの直接連携
- リアルタイム機能との親和性
- 認証・認可の統合

**実装例**:
```typescript
// supabase/functions/dashboard-summary/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  // ユーザー認証
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // ダッシュボード概要データ取得
  const summary = await getDashboardSummary(supabase, user.id)
  
  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## 🗄️ データベース設計

### 4.1 新規テーブル（必要に応じて）

#### treatment_roadmaps
```sql
CREATE TABLE treatment_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  cancer_type VARCHAR(100),
  treatment_plan JSONB,
  phases JSONB,
  milestones JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_roadmap_progress
```sql
CREATE TABLE user_roadmap_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  roadmap_id UUID REFERENCES treatment_roadmaps(id),
  current_phase VARCHAR(50),
  progress_percentage INTEGER,
  completed_milestones JSONB,
  next_milestone VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 既存テーブルの活用

#### structured_content_pool
- 関連情報の取得元
- カテゴリ・タグによる分類
- アクティブ/非アクティブ状態管理
- `raw_content_id`でraw_content_poolと関連付け

#### raw_content_pool
- スクレイピング元データ
- 参照元URL・公開日・元タイトル等のメタデータ
- 構造化前の生データ
- `structured_content_pool`の元データ

#### structured_content_relevance_scores
- ユーザー別関連度スコア
- 緊急度・重要度の計算
- パーソナライゼーションの基盤

#### user_content_consumption_history
- ユーザーの情報消費履歴
- 推薦システムの学習データ
- エンゲージメント分析

## 📅 実装スケジュール

### Week 1: フェーズ1完了
- [ ] ボタンクリック機能実装
- [ ] 動的ユーザー名表示
- [ ] 基本的なエラーハンドリング

### Week 2: フェーズ2前半
- [ ] 関連情報の動的表示
- [ ] APIエンドポイント設計・実装
- [ ] データベースクエリ最適化

### Week 3: フェーズ2後半
- [ ] 治療ロードマップ概要の動的化
- [ ] 次のアクション統合エリア
- [ ] パフォーマンス最適化

### Week 4: フェーズ3
- [ ] 詳細ページの設計・実装
- [ ] 段階的開示機能
- [ ] インタラクティブ機能

### Week 5: フェーズ4
- [ ] 高度なパーソナライゼーション
- [ ] リアルタイム更新機能
- [ ] 最終調整・テスト

## 🧪 テスト戦略

### 4.1 単体テスト
- コンポーネントの動作確認
- APIエンドポイントのテスト
- データベースクエリの検証

### 4.2 統合テスト
- ページ遷移の動作確認
- データフローの検証
- エラーハンドリングの確認

### 4.3 ユーザビリティテスト
- 実際のユーザーによる操作確認
- パフォーマンス測定
- アクセシビリティチェック

## 🚀 デプロイメント

### 4.1 段階的デプロイ
1. **開発環境**: 機能実装・テスト
2. **ステージング環境**: 統合テスト・ユーザビリティテスト
3. **本番環境**: 段階的リリース

### 4.2 監視・ログ
- パフォーマンス監視
- エラーログの収集
- ユーザー行動分析

## 📝 注意事項

### 4.1 セキュリティ
- 認証・認可の徹底
- SQLインジェクション対策
- XSS対策

### 4.2 パフォーマンス
- データベースクエリの最適化
- キャッシュ戦略の実装
- 画像・アセットの最適化

### 4.3 アクセシビリティ
- WCAG 2.1準拠
- キーボードナビゲーション対応
- スクリーンリーダー対応

---

**作成日**: 2025年1月7日  
**更新日**: 2025年1月7日  
**作成者**: AI Assistant  
**承認者**: ユーザー 