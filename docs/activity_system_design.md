# アクティビティ提示機能 設計仕様書

## 1. データベース設計

### 1.1 アクティビティ関連テーブル

#### `user_activities` テーブル
```sql
CREATE TABLE user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_step_id integer NOT NULL, -- 1: 診断・検査, 2: 治療方針決定, etc.
  
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
  source text, -- 'user_created', 'ai_recommended', 'template'
  tags text[], -- 検索・フィルタ用タグ
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  INDEX idx_user_step (user_id, roadmap_step_id),
  INDEX idx_status_date (status, scheduled_date)
);
```

#### `activity_templates` テーブル
```sql
CREATE TABLE activity_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- テンプレート基本情報
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('診察', '検査', '準備', '家族相談', 'メモ')),
  content text NOT NULL,
  description text,
  
  -- 適用条件
  roadmap_step_id integer NOT NULL,
  cancer_type text[], -- 適用がん種
  stage text[], -- 適用ステージ
  age_group text[], -- 年齢層
  family_situation text[], -- 家族状況
  
  -- 優先度・表示条件
  priority integer DEFAULT 0,
  is_ai_recommended boolean DEFAULT true,
  conditions jsonb, -- 動的表示条件
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  INDEX idx_step_type (roadmap_step_id, type),
  INDEX idx_cancer_stage (cancer_type, stage)
);
```

#### `user_activity_preferences` テーブル
```sql
CREATE TABLE user_activity_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 表示設定
  show_ai_recommendations boolean DEFAULT true,
  max_recommendations_per_step integer DEFAULT 5,
  preferred_activity_types text[], -- ユーザーが好む種別
  
  -- フィルタ設定
  excluded_tags text[], -- 除外したいタグ
  priority_threshold text DEFAULT 'normal', -- 表示する優先度の閾値
  
  -- システム管理
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);
```

### 1.2 関連テーブルとの連携

#### `user_treatment_roadmaps` テーブル拡張
```sql
-- 既存テーブルに追加
ALTER TABLE user_treatment_roadmaps ADD COLUMN current_step_id integer DEFAULT 2;
ALTER TABLE user_treatment_roadmaps ADD COLUMN user_profile jsonb; -- がん種、ステージ、年齢等
```

## 2. バックエンドAPI設計

### 2.1 アクティビティ取得API

#### `GET /api/activities/list`
```typescript
// リクエスト
interface GetActivitiesRequest {
  step_id?: number; // 特定ステップのみ取得
  type?: string; // 特定種別のみ取得
  status?: string; // 特定ステータスのみ取得
  include_recommendations?: boolean; // AIお薦めを含むか
  limit?: number;
  offset?: number;
}

// レスポンス
interface GetActivitiesResponse {
  activities: Array<{
    id: string;
    type: string;
    content: string;
    description?: string;
    scheduled_date?: string;
    completed_date?: string;
    status: string;
    priority: string;
    is_ai_recommended: boolean;
    tags: string[];
    created_at: string;
  }>;
  recommendations: Array<{
    id: string;
    type: string;
    content: string;
    description?: string;
    priority: string;
    reason: string; // お薦め理由
  }>;
  total_count: number;
  current_step: number;
}
```

#### `POST /api/activities/create`
```typescript
// リクエスト
interface CreateActivityRequest {
  type: string;
  content: string;
  description?: string;
  roadmap_step_id: number;
  scheduled_date?: string;
  priority?: string;
  tags?: string[];
}

// レスポンス
interface CreateActivityResponse {
  activity: {
    id: string;
    // ... 他のフィールド
  };
  success: boolean;
}
```

#### `PUT /api/activities/{id}/update`
```typescript
// アクティビティの更新（ステータス変更等）
interface UpdateActivityRequest {
  status?: string;
  completed_date?: string;
  content?: string;
  scheduled_date?: string;
  priority?: string;
}
```

### 2.2 AIお薦め生成API

#### `POST /api/activities/recommendations/generate`
```typescript
// リクエスト
interface GenerateRecommendationsRequest {
  step_id: number;
  user_context: {
    cancer_type: string;
    stage: string;
    age: number;
    family_situation: string;
    current_activities: string[]; // 既存アクティビティ
    preferences: string[]; // ユーザー設定
  };
}

// レスポンス
interface GenerateRecommendationsResponse {
  recommendations: Array<{
    id: string;
    type: string;
    content: string;
    description: string;
    priority: string;
    reason: string;
    confidence_score: number; // AIの信頼度
    estimated_impact: string; // 期待される効果
  }>;
  generated_at: string;
}
```

## 3. フロントエンド設計

### 3.1 コンポーネント設計

#### `ActivityList` コンポーネント
```typescript
interface ActivityListProps {
  stepId: number;
  activities: Activity[];
  recommendations: Recommendation[];
  onAddActivity: (activity: PartialActivity) => void;
  onUpdateActivity: (id: string, updates: PartialActivity) => void;
  onSkipRecommendation: (id: string) => void;
  onAcceptRecommendation: (recommendation: Recommendation) => void;
}
```

#### `ActivityCard` コンポーネント
```typescript
interface ActivityCardProps {
  activity: Activity;
  onEdit: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}
```

#### `RecommendationCard` コンポーネント
```typescript
interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept: (recommendation: Recommendation) => void;
  onSkip: (id: string) => void;
  onViewDetails: (id: string) => void;
}
```

### 3.2 状態管理

#### Zustand Store
```typescript
interface ActivityStore {
  // 状態
  activities: Record<number, Activity[]>; // stepId -> activities
  recommendations: Record<number, Recommendation[]>;
  loading: boolean;
  error: string | null;
  
  // アクション
  fetchActivities: (stepId: number) => Promise<void>;
  fetchRecommendations: (stepId: number) => Promise<void>;
  addActivity: (activity: PartialActivity) => Promise<void>;
  updateActivity: (id: string, updates: PartialActivity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  acceptRecommendation: (recommendation: Recommendation) => Promise<void>;
  skipRecommendation: (id: string) => Promise<void>;
}
```

## 4. AIお薦めロジック

### 4.1 お薦め生成アルゴリズム

#### 基本ロジック
```typescript
class ActivityRecommendationEngine {
  async generateRecommendations(
    stepId: number, 
    userContext: UserContext
  ): Promise<Recommendation[]> {
    
    // 1. テンプレートベースのお薦め
    const templateRecommendations = await this.getTemplateRecommendations(stepId, userContext);
    
    // 2. ユーザー状況に基づく動的生成
    const dynamicRecommendations = await this.generateDynamicRecommendations(userContext);
    
    // 3. 既存アクティビティとの重複チェック
    const filteredRecommendations = this.filterDuplicates(
      [...templateRecommendations, ...dynamicRecommendations],
      userContext.currentActivities
    );
    
    // 4. 優先度スコアリング
    const scoredRecommendations = this.scoreRecommendations(filteredRecommendations, userContext);
    
    // 5. 上位N件を返す
    return scoredRecommendations.slice(0, 5);
  }
  
  private async getTemplateRecommendations(stepId: number, userContext: UserContext) {
    // データベースからテンプレートを取得
    // がん種、ステージ、年齢等でフィルタリング
  }
  
  private async generateDynamicRecommendations(userContext: UserContext) {
    // AIモデルを使用した動的生成
    // ユーザーの状況に応じた個別化
  }
  
  private filterDuplicates(recommendations: Recommendation[], existingActivities: Activity[]) {
    // 既存アクティビティとの重複を除外
  }
  
  private scoreRecommendations(recommendations: Recommendation[], userContext: UserContext) {
    // 優先度、関連性、タイミング等でスコアリング
  }
}
```

### 4.2 お薦め理由の生成

#### 理由テンプレート
```typescript
const REASON_TEMPLATES = {
  '診察': {
    'timing': 'この時期の診察は治療方針決定に重要です',
    'symptom': '症状の変化を確認するため',
    'followup': '前回の検査結果について詳しく聞くため'
  },
  '検査': {
    'routine': '定期的な検査で早期発見が可能です',
    'diagnostic': '正確な診断のために必要です',
    'monitoring': '治療効果を確認するため'
  },
  '準備': {
    'logistics': 'スムーズな治療開始のため',
    'financial': '経済的準備を整えるため',
    'emotional': '心理的準備を整えるため'
  }
};
```

## 5. 実装優先度

### Phase 1: 基本機能（1-2週間）
1. データベーステーブル作成
2. 基本的なCRUD API実装
3. フロントエンド表示機能
4. 手動アクティビティ追加

### Phase 2: AIお薦め機能（2-3週間）
1. テンプレートベースのお薦め
2. 基本的なAI生成ロジック
3. お薦めの受け入れ・スキップ機能
4. 重複チェック機能

### Phase 3: 高度な機能（3-4週間）
1. 動的AI生成の改善
2. パーソナライゼーション強化
3. 分析・レポート機能
4. 通知・リマインダー機能

## 6. 技術スタック

### バックエンド
- **データベース**: PostgreSQL (Supabase)
- **API**: Next.js API Routes
- **AI/ML**: OpenAI API または 独自モデル
- **認証**: Supabase Auth

### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **状態管理**: Zustand
- **UI**: Tailwind CSS + 既存コンポーネント
- **型安全性**: TypeScript

### インフラ
- **ホスティング**: Vercel
- **データベース**: Supabase
- **AI API**: OpenAI / Anthropic
- **監視**: Vercel Analytics

## 7. セキュリティ・プライバシー

### データ保護
- ユーザー固有のアクティビティは完全に分離
- 個人情報の暗号化
- GDPR準拠のデータ処理

### AI倫理
- 医療アドバイスの免責事項
- ユーザーの意思決定支援（決定の代行ではない）
- 透明性のあるお薦め理由

この設計により、ユーザーは段階を意識せずに自然にアクティビティを追加でき、AIが状況に応じた適切なお薦めを提供する体験が実現できます。 