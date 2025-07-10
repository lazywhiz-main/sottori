# Sottori 情報収集・個別化システム設計計画

**作成日**: 2025-01-03
**バージョン**: 1.0
**対象範囲**: 情報収集システム全体設計と個別化エンジン

## 1. 概要

### 1.1 目的
Sottoriアプリケーションにおいて、がん患者一人ひとりに最適化された医療情報を自動収集・配信するシステムの設計

### 1.2 設計原則
- **医療安全性**: 正確で信頼できる情報源のみを使用
- **個別適応性**: ユーザーの状況に応じた情報提供
- **段階的実装**: フェーズ分けによる安全な機能拡張
- **透明性**: 情報源と処理プロセスの明示

## 2. 情報収集戦略

### 2.1 情報源の段階的アプローチ

#### フェーズ1: 公的機関ソース（優先実装）
```typescript
interface GovernmentSources {
  primary: [
    '厚生労働省がん情報',
    '国立がん研究センター',
    '都道府県がん情報センター'
  ]
  reliability: 5 // 最高信頼度
  updateFrequency: 'weekly'
  verificationRequired: false
}
```

#### フェーズ2: 学術・医療機関ソース
```typescript
interface AcademicSources {
  sources: [
    'PubMed医学論文',
    '大学病院公式情報',
    '日本癌学会認定情報'
  ]
  reliability: 4
  updateFrequency: 'daily'
  verificationRequired: true
}
```

#### フェーズ3: コミュニティ情報（慎重実装）
```typescript
interface CommunitySources {
  sources: [
    '患者会公式情報',
    '医療従事者監修済み情報'
  ]
  reliability: 3
  updateFrequency: 'daily'
  verificationRequired: true
  moderationRequired: true
}
```

### 2.2 情報カテゴリ定義
```typescript
type InfoCategory = 
  | 'treatment_options'     // 治療選択肢
  | 'doctors'              // 医師・病院情報
  | 'side_effects'         // 副作用情報
  | 'clinical_trials'      // 臨床試験
  | 'support_resources'    // サポートリソース
  | 'financial_assistance' // 経済的支援
```

## 3. 個別化システム設計

### 3.1 インプット（入力データ）

#### 3.1.1 ユーザープロフィールデータ
```typescript
interface PersonalizationInput {
  // 医療情報
  medical: {
    cancerType: string           // 'breast_cancer' | 'lung_cancer' | etc.
    stage: string               // 'stage_1' | 'stage_2' | etc.
    diagnosisDate: Date         // 診断日
    currentTreatment: {
      type: string[]            // ['chemotherapy', 'radiation', 'surgery']
      status: 'planning' | 'ongoing' | 'completed' | 'paused'
      startDate?: Date
      expectedEndDate?: Date
    }
    treatmentHistory: {
      type: string
      period: { start: Date, end: Date }
      outcome: string
    }[]
    sideEffectsExperienced: string[]  // 既に経験した副作用
  }

  // 地理的・社会的情報  
  context: {
    location: {
      prefecture: string        // 都道府県
      city: string             // 市区町村
      region: 'urban' | 'suburban' | 'rural'
    }
    demographics: {
      ageRange: '20-29' | '30-39' | '40-49' | '50-59' | '60-69' | '70+'
      employment: 'working' | 'retired' | 'student' | 'homemaker' | 'unemployed'
      familySupport: 'high' | 'medium' | 'low'
    }
    accessibility: {
      mobilityLimitations?: string[]
      languagePreference: 'japanese' | 'english' | 'both'
      technologyComfort: 'high' | 'medium' | 'low'
    }
  }

  // 情報需要特性
  preferences: {
    informationDepth: 'basic' | 'detailed' | 'comprehensive'
    updateFrequency: 'immediate' | 'daily' | 'weekly'
    priorityAreas: InfoCategory[]
    communicationStyle: 'formal' | 'casual' | 'empathetic'
    contentFormat: ('text' | 'visual' | 'video' | 'audio')[]
  }

  // 行動データ
  behavioral: {
    appUsagePattern: {
      activeHours: number[]     // [9, 10, 14, 20] = アクティブ時間
      sessionDuration: number   // 平均セッション時間（分）
      frequentFeatures: string[] // よく使う機能
    }
    informationConsumption: {
      readingSpeed: 'fast' | 'medium' | 'slow'
      completionRate: number    // 情報を最後まで読む率 (0-1)
      saveRate: number         // 情報を保存する率 (0-1)
      categories: Record<InfoCategory, {
        engagementScore: number // 0-100
        lastAccessed: Date
      }>
    }
  }
}
```

#### 3.1.2 リアルタイム状況データ
```typescript
interface ContextualInput {
  currentTreatmentPhase: {
    phase: 'pre_treatment' | 'active_treatment' | 'post_treatment' | 'surveillance'
    daysInPhase: number
    nextMilestone?: {
      type: 'appointment' | 'test' | 'treatment_end'
      date: Date
    }
  }
  
  recentActivity: {
    lastVisit: Date
    recentSearches: string[]
    recentSavedItems: string[]
    reportedSymptoms?: string[]
  }

  currentConcerns: {
    immediate: string[]        // 今すぐ知りたいこと
    upcoming: string[]         // 近い将来に知りたいこと
    general: string[]          // 一般的な関心事
  }
}
```

### 3.2 プロセス（処理エンジン）

#### 3.2.1 個別化エンジンの構造
```typescript
class PersonalizationEngine {
  // Step 1: データ統合・正規化
  private integrateUserData(
    profile: PersonalizationInput,
    context: ContextualInput,
    historicalData: UserHistoryData
  ): UnifiedUserProfile

  // Step 2: ユーザーセグメント判定
  private determineUserSegment(unified: UnifiedUserProfile): UserSegment

  // Step 3: 関連度スコアリング
  private calculateRelevanceScores(
    availableInfo: InfoUpdate[],
    userProfile: UnifiedUserProfile
  ): ScoredInformation[]
}
```

#### 3.2.2 ユーザーセグメント分類
```typescript
type UserSegment = 
  | 'newly_diagnosed'      // 診断から3ヶ月以内
  | 'active_treatment'     // 治療中
  | 'post_treatment'       // 治療完了後
  | 'long_term_survivor'   // 5年以上経過
  | 'recurrence'          // 再発
  | 'palliative'          // 緩和ケア
  | 'caregiver'           // 介護者
```

#### 3.2.3 関連度計算アルゴリズム
```typescript
interface RelevanceCalculation {
  // 基本マッチング (40%)
  medicalMatch: {
    cancerTypeMatch: number      // がん種の一致度 (0-100)
    stageRelevance: number       // 病期の関連性 (0-100)
    treatmentRelevance: number   // 治療法の関連性 (0-100)
  }

  // 状況的関連性 (30%)
  contextualRelevance: {
    treatmentPhaseMatch: number  // 治療段階の一致度
    geographicRelevance: number  // 地理的関連性
    timelinessScore: number      // タイミングの適切さ
  }

  // 個人的関心 (20%)
  personalInterest: {
    categoryPreference: number   // カテゴリ嗜好
    pastEngagement: number       // 過去のエンゲージメント
    searchHistory: number        // 検索履歴との関連
  }

  // 緊急度・重要度 (10%)
  priority: {
    medicalUrgency: number       // 医学的緊急度
    userConcernMatch: number     // ユーザーの関心事との一致
    timeSpecificity: number      // 時期特有性
  }
}

// 最終スコア = Σ(各要素 × 重み) / 100
```

### 3.3 アウトプット（出力システム）

#### 3.3.1 パーソナライズドコンテンツ
```typescript
interface PersonalizedOutput {
  // 優先順位付き情報リスト
  prioritizedUpdates: {
    immediate: InfoUpdate[]      // 今すぐ見るべき情報
    upcoming: InfoUpdate[]       // 近日中に確認すべき情報
    background: InfoUpdate[]     // 時間があるときに読む情報
    archived: InfoUpdate[]       // 参考情報として保存
  }

  // カスタマイズされた表示
  presentation: {
    summaryLevel: 'brief' | 'standard' | 'detailed'
    highlightedSections: string[]    // 強調すべきセクション
    hiddenComplexity: string[]       // 現段階では非表示にする複雑な情報
    adaptedLanguage: {
      medicalTerms: 'simplified' | 'standard' | 'technical'
      tone: 'supportive' | 'neutral' | 'clinical'
    }
  }

  // 行動推奨
  recommendations: {
    nextActions: {
      type: 'read' | 'save' | 'discuss_with_doctor' | 'contact_hospital'
      item: string
      priority: 'high' | 'medium' | 'low'
      timing: 'now' | 'this_week' | 'next_appointment'
    }[]
    
    informationGaps: {
      category: InfoCategory
      reason: string
      suggestedAction: string
    }[]
  }

  // 進捗・フィードバック
  personalizationInsights: {
    confidence: number           // パーソナライゼーションの信頼度 (0-100)
    dataCompleteness: number     // プロフィールデータの完全性 (0-100)
    adaptationSuggestions: string[] // より良い個別化のための提案
  }
}
```

#### 3.3.2 ダッシュボード統合
```typescript
interface DashboardPersonalization {
  // ウィジェット配置の最適化
  widgetPriority: {
    statusCheck: number          // ゆっくりチェックの重要度
    treatmentRoadmap: number     // 治療ロードマップの重要度
    informationCollection: number // 情報収集の重要度
    appointments: number         // 予約管理の重要度
  }

  // 情報密度の調整
  informationDensity: {
    summaryLength: number        // 要約の長さ (文字数)
    itemsPerCategory: number     // カテゴリあたりの表示アイテム数
    detailLevel: 'overview' | 'standard' | 'comprehensive'
  }

  // 通知・アラートのカスタマイズ
  notifications: {
    frequency: 'minimal' | 'standard' | 'comprehensive'
    channels: ('in_app' | 'push' | 'email')[]
    timing: number[]             // 通知に適した時間帯
    contentTypes: InfoCategory[] // 通知対象のカテゴリ
  }
}
```

## 4. 信頼性・品質管理

### 4.1 多層検証システム
```typescript
interface QualityCheck {
  sourceVerification: {
    officialDomain: boolean      // 公式ドメインからの情報か
    authorCredentials: boolean   // 著者の医療資格確認
    lastUpdated: Date           // 情報の新しさ
    certificationLevel: 1 | 2 | 3 | 4 | 5 // 認証レベル
  }
  
  contentValidation: {
    medicalTermsCheck: boolean   // 医学用語の正確性
    factualConsistency: boolean  // 他ソースとの整合性
    disclaimerPresence: boolean  // 適切な免責事項
    biasDetection: number        // バイアス検出スコア (0-100)
  }
  
  userFeedback: {
    helpfulnessScore: number    // ユーザー評価
    reportedIssues: string[]    // 報告された問題
    expertReview: boolean       // 専門家レビュー済み
  }
}
```

### 4.2 AI使用制限ポリシー
```typescript
interface AIUsagePolicy {
  allowedUsage: [
    'content_summarization',     // 要約作成のみ
    'relevance_scoring',         // 関連度判定のみ
    'duplicate_detection',       // 重複検出のみ
    'language_adaptation'        // 言語レベル調整のみ
  ]
  
  prohibitedUsage: [
    'medical_advice_generation', // 医療アドバイス生成禁止
    'diagnosis_assistance',      // 診断支援禁止
    'treatment_recommendation',  // 治療推奨禁止
    'prognosis_prediction'       // 予後予測禁止
  ]
  
  safeguards: {
    humanOversight: true         // 人間による監督必須
    disclaimerRequired: true     // 免責事項必須
    sourceAttribution: true      // ソース明示必須
  }
}
```

## 5. 更新タイミング最適化

### 5.1 収集トリガー設計
```typescript
type CollectionTrigger = 
  | 'user_profile_update'    // プロフィール更新時
  | 'scheduled_daily'        // 日次定期収集
  | 'manual_request'         // ユーザー手動要求
  | 'important_update'       // 緊急性の高い情報発生時
  | 'treatment_milestone'    // 治療段階変更時
  | 'seasonal_adjustment'    // 季節調整
  | 'location_change'        // 居住地変更時
```

### 5.2 段階的収集戦略
```typescript
interface CollectionStrategy {
  // 新規ユーザー: 即座に基本情報収集
  newUser: {
    immediate: ['treatment_options', 'doctors']
    delayed_1hour: ['side_effects']
    delayed_24hours: ['clinical_trials', 'support_resources']
  }
  
  // 既存ユーザー: 増分更新
  existingUser: {
    daily: ['clinical_trials', 'doctors']        // 変動が多い
    weekly: ['treatment_options']                // 比較的安定
    monthly: ['side_effects', 'support_resources'] // 長期的情報
  }
  
  // 治療段階変更時: 包括的再収集
  treatmentPhaseChange: {
    immediate: 'all_categories'
    priority: 'treatment_options'
    depth: 'comprehensive'
  }
}
```

### 5.3 適応的更新頻度
```typescript
interface AdaptiveUpdateFrequency {
  baseFrequency: {
    treatment_options: 'weekly'
    doctors: 'daily'
    side_effects: 'monthly'
    clinical_trials: 'daily'
  }
  
  adjustmentFactors: {
    userEngagement: number       // ユーザーの活発度 (0.5-2.0)
    treatmentUrgency: number     // 治療の緊急度 (0.5-3.0)
    informationVolatility: number // 情報の変動性 (0.5-2.0)
  }
  
  // 最終頻度 = baseFrequency × adjustmentFactors
}
```

## 6. 実装フェーズ計画

### Phase 1: 基盤構築（1-2ヶ月）
1. **データモデル拡張**
   - 個別化インプットテーブル設計
   - 行動データ収集システム
   - 関連度スコアリングテーブル

2. **基本収集システム**
   - 公的機関ソース連携
   - 品質検証システム
   - 基本的な関連度計算

3. **UI/UX基盤**
   - 個別化設定画面
   - パーソナライズドダッシュボード
   - 情報表示調整機能

### Phase 2: 個別化エンジン（2-3ヶ月）
1. **高度な個別化**
   - ユーザーセグメント分類
   - 行動パターン学習
   - 動的関連度調整

2. **情報源拡張**
   - 学術機関ソース追加
   - 地域情報統合
   - 多言語対応準備

3. **品質向上**
   - 専門家レビューシステム
   - ユーザーフィードバック統合
   - AIバイアス検出

### Phase 3: 高度機能（3-4ヶ月）
1. **予測・推奨システム**
   - 治療段階予測
   - 情報需要予測
   - プロアクティブ推奨

2. **コミュニティ統合**
   - 患者会情報連携
   - ピアサポート情報
   - 経験共有プラットフォーム

3. **最適化・スケール**
   - パフォーマンス最適化
   - リアルタイム処理
   - 大規模ユーザー対応

## 7. 具体的シナリオ例

### シナリオ1: 新規診断患者（45歳女性、乳がん）
**インプット:**
- 医療: 乳がんStage II、診断から2週間、手術予定
- 状況: 東京都在住、会社員、家族サポート有
- 行動: アプリ初回利用、情報を詳しく知りたい傾向

**プロセス:**
- セグメント: `newly_diagnosed`
- 優先情報: 手術準備、治療選択肢、セカンドオピニオン
- 表示調整: 詳細レベル、専門用語は解説付き

**アウトプット:**
```json
{
  "prioritizedUpdates": {
    "immediate": [
      "乳がん手術前の準備について",
      "お住まいの地域の専門医情報", 
      "手術方法の選択肢比較"
    ],
    "upcoming": [
      "術後の回復期間について",
      "化学療法の可能性と準備"
    ]
  },
  "recommendations": {
    "nextActions": [
      {
        "type": "discuss_with_doctor",
        "item": "手術方法の選択",
        "priority": "high",
        "timing": "now"
      }
    ]
  }
}
```

### シナリオ2: 治療完了患者（62歳男性、肺がん）
**インプット:**
- 医療: 肺がん治療完了から6ヶ月、定期検診中
- 状況: 地方在住、退職済み、1人暮らし
- 行動: 週1回アプリ利用、要約情報を好む

**アウトプット:**
```json
{
  "prioritizedUpdates": {
    "immediate": [
      "定期検診のポイント",
      "再発の初期症状について"
    ],
    "background": [
      "肺がんサバイバーの生活改善法",
      "地域のサポートグループ情報"
    ]
  },
  "presentation": {
    "summaryLevel": "brief",
    "adaptedLanguage": {
      "medicalTerms": "simplified",
      "tone": "supportive"
    }
  }
}
```

## 8. 技術的考慮事項

### 8.1 パフォーマンス
- **リアルタイム処理**: 関連度計算の最適化
- **キャッシュ戦略**: 個別化結果の効率的保存
- **非同期処理**: バックグラウンド情報収集

### 8.2 セキュリティ
- **プライバシー保護**: 個人情報の暗号化
- **アクセス制御**: 情報源への安全なアクセス
- **監査ログ**: 個別化処理の追跡可能性

### 8.3 スケーラビリティ
- **マイクロサービス**: 個別化エンジンの独立性
- **負荷分散**: 計算処理の分散化
- **データパーティショニング**: 大規模ユーザー対応

## 9. 成功指標（KPI）

### 9.1 個別化精度
- **関連度一致率**: ユーザー評価との一致度 (>80%)
- **エンゲージメント率**: 推奨情報のクリック率 (>60%)
- **保存率**: 情報の保存率 (>40%)

### 9.2 システム品質
- **情報新鮮度**: 24時間以内の情報更新率 (>90%)
- **応答時間**: 個別化処理時間 (<2秒)
- **可用性**: システム稼働率 (>99.5%)

### 9.3 ユーザー満足度
- **満足度スコア**: 個別化機能への満足度 (>4.0/5.0)
- **継続利用率**: 月次アクティブユーザー率 (>70%)
- **推奨意向**: NPS (Net Promoter Score) (>50)

## 10. リスク管理

### 10.1 医療安全リスク
- **誤情報配信**: 多層検証システムによる防止
- **過度依存**: 「医師への相談推奨」の明確表示
- **薬事法遵守**: 治療推奨の厳格な制限

### 10.2 技術リスク
- **AIバイアス**: 定期的なアルゴリズム監査
- **データ漏洩**: エンドツーエンド暗号化
- **システム障害**: 冗長化とバックアップ

### 10.3 運用リスク
- **専門知識不足**: 医療専門家との連携体制
- **法規制変更**: 継続的な法務チェック
- **ユーザークレーム**: 迅速な対応プロセス

---

**注記**: 本設計書は医療安全性を最優先とし、段階的実装により品質とユーザー体験を両立することを目指しています。実装前に医療専門家および法務専門家による詳細レビューが必要です。 