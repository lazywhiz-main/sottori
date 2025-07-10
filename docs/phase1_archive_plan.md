# Phase 1 実装資産アーカイブ計画

*作成日：2025-06-30*

## 🎯 目的
現在の実装資産を「将来の拡張機能」として保持し、シンプル化後も再利用可能にする

---

## 📦 アーカイブ対象の実装資産

### ✅ **保持すべき高品質な実装**

#### **1. AI機能システム**
```typescript
// 保持対象
src/lib/config/ai.ts              // AI設定管理システム
src/components/ui/AISettingsPanel.tsx // AI機能切り替えUI
src/app/api/roadmap/generate/route.ts // AI生成API

// 用途：将来の「高度なAI機能」として再利用
// - 専門医マッチング
- 治験情報生成
- 個別化コンテンツ
```

#### **2. 複雑な情報収集システム**
```typescript
// 保持対象
src/lib/services/infoCollection.ts    // 情報収集エンジン
src/app/api/info-updates/              // 情報更新API群
src/components/info-updates/           // 情報管理UI

// 用途：「プロフェッショナル版」として将来提供
// - 医療従事者向け
// - 詳細分析が必要なユーザー向け
```

#### **3. 高度な医療情報管理**
```typescript
// 保持対象
src/components/medical/               // 詳細医療情報管理
src/app/medical-records/              // 医療記録システム
src/app/medical-team/                 // 医療チーム管理

// 用途：「医療連携機能」として将来展開
// - 医師との情報共有
// - セカンドオピニオン準備
```

---

## 🗂️ アーカイブ構造

### **ディレクトリ構成**
```
src/
├── app/                          # シンプル版（メイン体験）
├── components/                   # シンプル版コンポーネント
├── lib/                         # シンプル版ロジック
└── archive/                     # 高度な機能の保管庫
    ├── advanced-ai/             # 高度なAI機能
    │   ├── components/
    │   ├── services/
    │   └── config/
    ├── medical-pro/             # プロ向け医療機能
    │   ├── components/
    │   ├── pages/
    │   └── api/
    └── info-collection/         # 高度な情報収集
        ├── engines/
        ├── components/
        └── api/
```

### **設定による機能切り替え**
```typescript
// .env.local
SOTTORI_MODE=simple              # simple | advanced | professional
ENABLE_ADVANCED_AI=false         # 高度なAI機能
ENABLE_MEDICAL_PRO=false         # プロ向け医療機能
ENABLE_INFO_COLLECTION=false     # 高度な情報収集

// lib/config/features.ts
export const FEATURE_FLAGS = {
  SIMPLE_MODE: process.env.SOTTORI_MODE === 'simple',
  ADVANCED_AI: process.env.ENABLE_ADVANCED_AI === 'true',
  MEDICAL_PRO: process.env.ENABLE_MEDICAL_PRO === 'true',
  INFO_COLLECTION: process.env.ENABLE_INFO_COLLECTION === 'true'
}
```

---

## 🎯 シンプル版への移行計画

### **Phase A: アーカイブ準備（1週間）**

#### **1. 既存実装の分類**
- ✅ **コア機能**：セルフチェック、基本ロードマップ → そのまま保持
- 📦 **高度機能**：複雑AI、詳細情報収集 → archive/に移動
- 🔧 **管理機能**：医療記録、チーム管理 → archive/medical-pro/に移動

#### **2. アーカイブディレクトリ作成**
```bash
# アーカイブ用ディレクトリの作成
mkdir -p src/archive/{advanced-ai,medical-pro,info-collection}

# 既存実装の移動
mv src/lib/services/infoCollection.ts src/archive/info-collection/
mv src/components/info-updates/ src/archive/info-collection/components/
mv src/app/api/info-updates/ src/archive/info-collection/api/
```

#### **3. 機能フラグの実装**
```typescript
// src/lib/config/features.ts
export function shouldShowAdvancedFeatures(): boolean {
  return FEATURE_FLAGS.ADVANCED_AI || FEATURE_FLAGS.MEDICAL_PRO
}

export function getEnabledFeatures(): string[] {
  const features = []
  if (FEATURE_FLAGS.ADVANCED_AI) features.push('advanced-ai')
  if (FEATURE_FLAGS.MEDICAL_PRO) features.push('medical-pro')
  if (FEATURE_FLAGS.INFO_COLLECTION) features.push('info-collection')
  return features
}
```

### **Phase B: シンプル版実装（2週間）**

#### **1. 核心体験の実装**
```typescript
// 新しいシンプルなロードマップ生成
// src/lib/simple-roadmap.ts
export async function generateSimpleRoadmap(responses: UserResponses): Promise<SimpleRoadmap> {
  // 1. 基本的な情報整理
  // 2. 信頼できる情報源からの抜粋
  // 3. 次のステップの提案
  // 4. 「医師に相談してください」の自然な配置
}

// バックグラウンド情報収集（シンプル版）
// src/lib/background-collection.ts
export async function startBackgroundCollection(userProfile: UserProfile): Promise<void> {
  // 1. ユーザーの関心領域を特定
  // 2. 信頼できる情報源から情報を収集
  // 3. 週1回の頻度で更新
  // 4. 準備完了時にやさしい通知
}
```

#### **2. 継続フォロー機能**
```typescript
// src/lib/follow-up.ts
export async function scheduleFollowUp(userId: string, checkResult: CheckResult): Promise<void> {
  // 1週間後：「調子はいかがですか？」
  // 1ヶ月後：「状況に変化はありましたか？」
  // 必要に応じて：「新しい情報があります」
}

// やさしい通知システム
export async function sendGentleNotification(userId: string, message: GentleMessage): Promise<void> {
  // 「お時間のある時にどうぞ」
  // 「急がなくて大丈夫です」
  // 「変化があった時だけお知らせします」
}
```

### **Phase C: 機能切り替え実装（1週間）**

#### **管理画面で簡単切り替え**
```typescript
// src/components/admin/FeatureToggle.tsx
export default function FeatureToggle() {
  return (
    <div className="admin-panel">
      <h3>機能レベル設定</h3>
      
      <div className="feature-modes">
        <label>
          <input type="radio" name="mode" value="simple" />
          シンプル版（一般ユーザー向け）
        </label>
        
        <label>
          <input type="radio" name="mode" value="advanced" />
          高度版（詳細分析が必要な方向け）
        </label>
        
        <label>
          <input type="radio" name="mode" value="professional" />
          プロフェッショナル版（医療従事者連携）
        </label>
      </div>
      
      <div className="individual-features">
        <label>
          <input type="checkbox" name="advanced-ai" />
          高度なAI機能
        </label>
        <label>
          <input type="checkbox" name="medical-pro" />
          医療プロ機能
        </label>
        <label>
          <input type="checkbox" name="info-collection" />
          詳細情報収集
        </label>
      </div>
    </div>
  )
}
```

---

## 🔄 将来の活用シナリオ

### **1. ユーザーの成長に合わせた機能提供**
```
初期：シンプル版でお試し
　↓
慣れてきた：高度版を一部有効化
　↓
専門的なニーズ：プロフェッショナル版
```

### **2. 異なるユーザー層への対応**
```
一般患者：シンプル版
医療従事者：プロフェッショナル版
研究者：高度版（データ分析機能付き）
```

### **3. 段階的な機能ロールアウト**
```
新機能開発 → 高度版でテスト → 安定化 → シンプル版に統合
```

---

## 📊 移行スケジュール

### **Week 1: アーカイブ準備**
- 既存実装の分類・整理
- archive/ディレクトリ構造作成
- 機能フラグシステム実装

### **Week 2-3: シンプル版実装**
- 核心体験の再実装
- バックグラウンド情報収集
- 継続フォロー機能

### **Week 4: 切り替え機能**
- 管理画面実装
- 機能レベル切り替え
- テスト・デバッグ

---

## 🎯 成功指標

### **実装品質**
- ✅ 既存機能が archive/ から正常に動作する
- ✅ シンプル版の体験が設計通りに実現される
- ✅ 機能切り替えが管理画面から容易に行える

### **ユーザー体験**
- ✅ 初期ユーザーの迷いが軽減される
- ✅ 継続利用率が向上する
- ✅ 「勝手によしなに」感が実現される

---

*この計画により、既存の開発資産を無駄にすることなく、シンプルで本質的な体験を提供できます。* 