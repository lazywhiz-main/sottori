# 🏗️ Sottori情報収集アーキテクチャ再設計分析

**作成日**: 2025年7月3日  
**目的**: 効率的で実用的な情報収集・個別化システムの設計検討  

---

## 🎯 **現在の設計の問題点**

### **⚠️ 主要な課題**
1. **リアルタイム収集の非効率性**
   - ユーザー毎にスクレイピング実行 → レスポンス時間悪化
   - 同じデータソースへの重複アクセス → リソース浪費

2. **データ収集と個別化の混在**
   - 情報取得と個別化ロジックが同一レイヤー
   - ユーザー固有処理でデータ収集が遅延

3. **再利用性の低さ**
   - 収集データの共有不可 → 重複処理
   - キャッシュ機能の不在

---

## 📊 **明確な整理の切り口: データ更新頻度別分析**

### **🗂️ 切り口: データソースの実際の更新頻度**

| データソース | 実際の更新頻度 | 推奨収集戦略 | 理由 |
|-------------|----------------|--------------|------|
| **厚労省がん情報** | 月1-2回 | **週1回バックグラウンド収集** | 公的情報、変更少ない |
| **国立がん研究センター** | 週2-3回 | **日1回バックグラウンド収集** | 研究情報、定期更新 |
| **臨床試験データ** | 日1-2回 | **日2回バックグラウンド収集** | 募集状況変更あり |
| **地域専門医情報** | 月1-2回 | **週1回バックグラウンド収集** | ❌ リアルタイム不要 |
| **支援制度情報** | 四半期1回 | **月1回バックグラウンド収集** | 制度変更稀少 |
| **薬剤・副作用情報** | 月1回 | **週1回バックグラウンド収集** | 添付文書更新稀少 |

### **🎯 個別化が必要な要素**

| 個別化要素 | 処理タイミング | 実装方法 |
|------------|----------------|----------|
| **地域フィルタリング** | リクエスト時 | 事前収集データから地域絞り込み |
| **がん種・ステージマッチング** | リクエスト時 | 事前収集データから条件絞り込み |
| **関連度スコア計算** | リクエスト時 | ユーザープロフィールとのマッチング |
| **表示優先順位** | リクエスト時 | 個人設定・履歴による重み付け |

---

## 🏗️ **新アーキテクチャ: 3層分離設計**

### **📊 アーキテクチャ概要**

```
┌─────────────────────────────────────────────┐
│           📱 個別化エンジン層                │
│                                             │
│  PersonalizationEngine                      │
│  ├─ 地域フィルタリング                       │
│  ├─ がん種・ステージマッチング               │
│  ├─ 関連度スコア計算                        │
│  └─ 表示順序最適化                          │
│                                             │
│  💡 処理時間: 100-500ms                     │
└─────────────────────────────────────────────┘
               ⬇️ 高速クエリ
┌─────────────────────────────────────────────┐
│           🗄️ 統合情報プール層                │
│                                             │
│  InformationPoolService                     │
│  ├─ 全収集データの統合管理                   │
│  ├─ 高速検索インデックス                     │
│  ├─ データ鮮度管理                          │
│  └─ 重複除去・正規化                        │
│                                             │
│  💡 応答時間: <100ms                        │
└─────────────────────────────────────────────┘
               ⬇️ 定期更新
┌─────────────────────────────────────────────┐
│          ⚙️ バックグラウンド収集層            │
│                                             │
│  BackgroundCollectionService                │
│  ├─ 厚労省コレクター (週1回)                  │
│  ├─ 国がんコレクター (日1回)                  │
│  ├─ 臨床試験コレクター (日2回)                │
│  ├─ 地域専門医コレクター (週1回)              │
│  ├─ 支援制度コレクター (月1回)                │
│  └─ 薬剤情報コレクター (週1回)                │
│                                             │
│  💡 ユーザーに影響なし                       │
└─────────────────────────────────────────────┘
```

---

## 🔧 **実装戦略の詳細**

### **⚙️ Phase 1: バックグラウンド収集システム構築**

```typescript
interface CollectionSchedule {
  mhlw_cancer_info: {
    frequency: 'weekly',
    schedule: '毎週月曜 02:00',
    estimated_duration: '30分',
    priority: 'low'
  },
  ncc_research: {
    frequency: 'daily', 
    schedule: '毎日 03:00',
    estimated_duration: '20分',
    priority: 'medium'
  },
  clinical_trials: {
    frequency: 'twice_daily',
    schedule: '06:00, 18:00',
    estimated_duration: '15分',
    priority: 'high'
  },
  regional_doctors: {
    frequency: 'weekly',
    schedule: '毎週火曜 04:00', 
    estimated_duration: '45分',
    priority: 'medium'
  }
}
```

### **🗄️ Phase 2: 統合情報プール構築**

```sql
-- 統合情報テーブル
CREATE TABLE information_pool (
  id UUID PRIMARY KEY,
  category info_category NOT NULL,
  cancer_types TEXT[] NOT NULL,      -- ['breast', 'lung', 'all']
  stages TEXT[] NOT NULL,            -- ['stage_1', 'stage_2', 'all']  
  regions TEXT[] NOT NULL,           -- ['tokyo', 'osaka', 'all']
  source_type TEXT NOT NULL,         -- 'official', 'medical', 'academic'
  reliability_score INTEGER NOT NULL, -- 1-5
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  metadata JSONB,
  collected_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  
  -- 高速検索用インデックス
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('japanese', title || ' ' || summary || ' ' || content)
  ) STORED
);

-- 複合インデックス（高速フィルタリング用）
CREATE INDEX idx_info_pool_filter ON information_pool 
  USING GIN(cancer_types, stages, regions);
CREATE INDEX idx_info_pool_search ON information_pool 
  USING GIN(search_vector);
```

### **📱 Phase 3: 個別化エンジン実装**

```typescript
class PersonalizationEngine {
  async getPersonalizedInfo(
    userProfile: UserProfile,
    requestedCategories: InfoCategory[]
  ): Promise<PersonalizedInfo[]> {
    
    // Step 1: プロフィールからフィルタ条件構築
    const filters = this.buildFilters(userProfile)
    
    // Step 2: 情報プールから高速取得
    const rawInfo = await this.informationPool.query({
      categories: requestedCategories,
      cancer_types: filters.cancerTypes,
      stages: filters.stages,
      regions: filters.regions,
      limit: 50
    })
    
    // Step 3: 関連度スコア計算
    const scoredInfo = rawInfo.map(info => ({
      ...info,
      relevanceScore: this.calculateRelevance(info, userProfile)
    }))
    
    // Step 4: ソート・フィルタリング
    return scoredInfo
      .filter(info => info.relevanceScore > 30)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15)
  }
}
```

---

## 📈 **期待される効果**

### **⚡ パフォーマンス劇的改善**
- **現在**: ユーザーリクエスト時に5-10秒のスクレイピング
- **改善後**: 情報プールから100-500msで応答
- **改善率**: **95%レスポンス時間短縮**

### **🔄 運用効率向上**
- **サーバー負荷**: 90%削減（バックグラウンド処理化）
- **外部API負荷**: 重複アクセス排除
- **データ品質**: 統一的な管理・検証

### **👤 ユーザー体験向上**
- **即座の応答**: 待機時間ほぼゼロ
- **情報の網羅性**: 事前収集による取りこぼし防止
- **一貫した品質**: 統一的なデータ処理

---

## 🚀 **次のステップ**

### **immediate TODO**
1. **フォールバックデータ削除**: 正直な失敗報告の実装
2. **バックグラウンド収集基盤構築**: cronジョブ設定
3. **情報プール設計**: データベーススキーマ作成

どのステップから着手しますか？ 