# Sottori 詳細開発計画書

*作成日：2025-06-30*  
*最終更新：2025-06-30*

---

## 📊 実装現況サマリー

### ✅ **完全実装済み機能**
- **ゆっくりセルフチェック**: 5段階質問フロー、AI分析、履歴保存
- **ロードマップ生成**: AI生成、フォールバック機能、共有機能
- **認証・基本ダッシュボード**: Supabase認証、プロフィール管理
- **医療情報管理**: 医療機関・従事者・記録・予定管理（完全実装）
- **データ履歴管理**: チェック履歴・ロードマップ履歴の保存・閲覧

### 🔶 **改善対象機能**
- **ダッシュボード体験**: 基本レイアウトのみ → 設計書準拠の4エリア構成
- **ロードマップ生成**: 基本機能 → 設計書準拠の情報収集・整理支援
- **AI機能**: ロードマップ生成のみ → 包括的AI活用システム

---

## 🎯 Phase 1: 基盤完成・体験向上（最優先）

### **1-1. ダッシュボード4エリア実装**

#### **目標**
設計書で定義した4エリア構成のダッシュボードを実装し、「情報収集・整理支援」の価値を可視化

#### **技術仕様**
```typescript
// 新規コンポーネント設計
interface DashboardArea {
  id: string
  title: string
  component: React.ComponentType
  priority: number
}

// 4エリア構成
const dashboardAreas = [
  {
    id: 'welcome',
    title: '今日の確認エリア',
    component: WelcomeStatusArea,
    priority: 1
  },
  {
    id: 'info-collection',
    title: '情報収集状況エリア',
    component: InfoCollectionStatusArea,
    priority: 2
  },
  {
    id: 'weekly-suggestions',
    title: '今週の提案エリア',
    component: WeeklySuggestionsArea,
    priority: 3
  },
  {
    id: 'basic-info',
    title: '基本情報管理エリア',
    component: BasicInfoManagementArea,
    priority: 4
  }
]
```

#### **実装タスク（1週間）**
1. **WelcomeStatusArea**
   - 今日の調子チェック機能
   - 感情状態の簡易記録
   - 前回チェックからの経過表示

2. **InfoCollectionStatusArea**
   - AI収集進捗の可視化
   - 準備完了通知システム
   - 最新情報更新アラート

3. **WeeklySuggestionsArea**
   - パーソナライズされた週次提案
   - 段階別情報配信
   - アクション可能な具体的提案

4. **BasicInfoManagementArea**
   - 未入力項目の明確な可視化
   - 段階的入力促進
   - 完了度プログレス表示

#### **データベース拡張**
```sql
-- ユーザー状態追跡テーブル
CREATE TABLE user_daily_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 情報収集進捗管理テーブル
CREATE TABLE info_collection_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  concern_type TEXT NOT NULL,
  collection_status TEXT DEFAULT 'pending', -- 'pending', 'collecting', 'ready', 'completed'
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 週次提案管理テーブル
CREATE TABLE weekly_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **1-2. がん治療プロフィール設定画面**

#### **目標**
現在の一括入力方式を段階的入力に変更し、ユーザー負担を軽減しながら必要情報を収集

#### **設計方針**
```javascript
// 段階的入力フロー
const profileSteps = [
  {
    id: 'basic_cancer_info',
    title: 'がん種・ステージ',
    fields: ['cancer_type', 'stage', 'diagnosis_date'],
    required: ['cancer_type'],
    description: '基本的な診断情報を教えてください'
  },
  {
    id: 'treatment_status',
    title: '治療状況',
    fields: ['treatment_status', 'current_treatment', 'treatment_start_date'],
    required: ['treatment_status'],
    description: '現在の治療状況について'
  },
  {
    id: 'medical_team',
    title: '医療チーム',
    fields: ['primary_doctor', 'hospital', 'next_appointment'],
    required: [],
    description: '医療チーム情報（任意）'
  },
  {
    id: 'concerns_interests',
    title: '気になるポイント',
    fields: ['concern_areas', 'priority_concerns'],
    required: ['concern_areas'],
    description: '今、一番気になっていることを選択してください'
  }
]
```

#### **実装タスク（1週間）**
1. **CancerProfileForm**コンポーネント実装
2. **StepIndicator**進捗表示コンポーネント
3. **ConcernSelector**気になるポイント選択UI
4. **ProfileCompletionTracker**完了度追跡機能
5. 既存医療情報管理システムとの連携

### **1-3. ロードマップ生成の改善**

#### **目標**
現在のロードマップ生成を設計書準拠の「情報収集・整理支援」機能に拡張

#### **改善ポイント**
1. **情報源の多様化**
   - 治療ガイドライン自動収集
   - 専門医情報のリアルタイム更新
   - 治験情報の定期同期

2. **パーソナライズ強化**
   - ユーザーの関心領域別情報配信
   - 治療段階に応じた動的コンテンツ
   - 地域・年齢・がん種別最適化

3. **品質向上**
   - 出典情報の明確化
   - 最新性の保証機能
   - 医療情報ガイドライン準拠チェック

#### **現在の実装状況分析**

##### **既存の良い点**
- OpenAI APIを活用したAI生成機能
- フォールバック機能による安定性
- AI使用統計のログ記録
- 履歴保存・共有機能
- パーソナライズされたプロンプト生成

##### **改善が必要な点**
- 単発生成のみ（継続的な情報収集なし）
- 情報源が限定的（AIの知識ベースのみ）
- 出典情報の不明確さ
- リアルタイム情報の不足
- 段階的情報提供の欠如

#### **技術実装計画**

##### **1. 情報収集エンジンの統合**
```typescript
// 情報収集エンジン設計
interface InfoCollectionEngine {
  collectGuidelines(cancerType: string): Promise<GuidelineInfo[]>
  collectDoctorInfo(location: string, specialty: string): Promise<DoctorInfo[]>
  collectTrialInfo(cancerType: string, stage: string): Promise<TrialInfo[]>
  collectSupportInfo(location: string): Promise<SupportInfo[]>
}

// 拡張されたロードマップ生成API
interface EnhancedRoadmapRequest {
  responses: UserResponses
  infoCollectionData?: CollectedInfo[] // 新規追加
  updateMode?: 'initial' | 'refresh' | 'stage_change' // 新規追加
  userProfile?: CancerProfile // 新規追加
}
```

##### **2. API改善計画**
```typescript
// src/app/api/roadmap/generate/route.ts の改善

export async function POST(request: NextRequest) {
  const { responses, infoCollectionData, updateMode, userProfile } = await request.json()
  
  // 情報収集状況に基づく生成
  if (infoCollectionData && infoCollectionData.length > 0) {
    return await generateEnhancedRoadmap(responses, infoCollectionData, userProfile)
  }
  
  // 従来の生成（既存機能維持）
  return await generateBasicRoadmap(responses)
}

async function generateEnhancedRoadmap(
  responses: UserResponses,
  collectedInfo: CollectedInfo[],
  userProfile?: CancerProfile
): Promise<NextResponse> {
  // リアルタイム情報を含む高度なプロンプト生成
  const enhancedPrompt = buildEnhancedPrompt(responses, collectedInfo, userProfile)
  
  // OpenAI APIで情報源を含む包括的なロードマップ生成
  const completion = await openai.chat.completions.create({
    model: 'gpt-4', // より高性能なモデル
    messages: [
      { role: "system", content: getEnhancedSystemPrompt() },
      { role: "user", content: enhancedPrompt }
    ],
    temperature: 0.3, // より一貫した出力
    max_tokens: 4000, // より詳細な内容
  })
  
  // 生成されたコンテンツに信頼度スコアと出典情報を付加
  const enrichedSections = await enrichWithSourceInfo(parsedResponse.sections, collectedInfo)
  
  return NextResponse.json({
    success: true,
    sections: enrichedSections,
    generatedAt: new Date().toISOString(),
    aiGenerated: true,
    enhanced: true,
    sources: collectedInfo.map(info => ({
      title: info.title,
      url: info.sourceUrl,
      reliability: info.reliabilityScore,
      lastUpdated: info.lastUpdated
    }))
  })
}
```

##### **3. 情報収集データ統合**
```typescript
// 新規ファイル: src/lib/services/infoCollection.ts

export class InfoCollectionService {
  async collectMedicalInfo(cancerType: string, concerns: string[]): Promise<CollectedInfo[]> {
    const collectors = [
      new GuidelineCollector(),
      new DoctorInfoCollector(),
      new TrialInfoCollector(),
      new SupportInfoCollector()
    ]
    
    const allInfo: CollectedInfo[] = []
    
    for (const collector of collectors) {
      try {
        const info = await collector.collect(cancerType, concerns)
        allInfo.push(...info)
      } catch (error) {
        console.error(`Collection failed for ${collector.name}:`, error)
        // 継続実行（一部の失敗で全体を止めない）
      }
    }
    
    // 信頼度でソート・重複除去
    return this.deduplicateAndSort(allInfo)
  }
  
  private deduplicateAndSort(info: CollectedInfo[]): CollectedInfo[] {
    // URL重複除去 + 信頼度ソート
    const uniqueInfo = new Map()
    info.forEach(item => {
      if (!uniqueInfo.has(item.sourceUrl) || 
          uniqueInfo.get(item.sourceUrl).reliabilityScore < item.reliabilityScore) {
        uniqueInfo.set(item.sourceUrl, item)
      }
    })
    
    return Array.from(uniqueInfo.values())
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
  }
}
```

##### **4. データベース拡張**
```sql
-- 収集情報管理テーブル
CREATE TABLE collected_information (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cancer_type TEXT NOT NULL,
  concern_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'guideline', 'doctor_info', 'trial', 'support'
  reliability_score INTEGER CHECK (reliability_score >= 1 AND reliability_score <= 5),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ロードマップセクション拡張
ALTER TABLE roadmap_sections ADD COLUMN source_references JSONB;
ALTER TABLE roadmap_sections ADD COLUMN reliability_score INTEGER;
ALTER TABLE roadmap_sections ADD COLUMN last_info_update TIMESTAMP WITH TIME ZONE;
```

##### **5. 段階的改善スケジュール**

**Week 1: 基盤実装**
- InfoCollectionService 基本クラス実装
- データベーススキーマ更新
- API拡張（基本機能）

**Week 2: 情報収集実装**
- GuidelineCollector 実装
- DoctorInfoCollector 実装
- API統合テスト

**Week 3: AI生成改善**
- 拡張プロンプト実装
- 出典情報統合
- 品質保証機能

**Week 4: UI統合**
- ロードマップページ改善
- 情報源表示機能
- 更新通知システム

#### **品質向上機能**

##### **1. 出典情報の明確化**
```typescript
interface SourceInfo {
  title: string
  url: string
  organization: string
  lastUpdated: Date
  reliabilityScore: number // 1-5
  type: 'official' | 'medical' | 'academic' | 'community'
}

// ロードマップの各セクションに出典情報を付加
interface EnhancedRoadmapSection extends RoadmapSection {
  sources: SourceInfo[]
  reliabilityIndicator: 'high' | 'medium' | 'low'
  lastUpdated: Date
}
```

##### **2. 医療情報ガイドライン準拠チェック**
```typescript
class MedicalContentValidator {
  async validateContent(content: string): Promise<ValidationResult> {
    const checks = [
      this.checkDisclaimerPresence(content),
      this.checkConsultationPrompt(content),
      this.checkDefinitiveStatements(content),
      this.checkSourceCitation(content)
    ]
    
    const results = await Promise.all(checks)
    
    return {
      isValid: results.every(r => r.passed),
      warnings: results.filter(r => !r.passed).map(r => r.message),
      suggestions: this.generateImprovementSuggestions(results)
    }
  }
}
```

---

## 🔄 Phase 2: 情報収集・整理システム（コア機能）

### **2-1. 自動情報収集エンジン**

#### **目標**
ユーザーの「気になるポイント」に基づいて、信頼できる医療情報を自動収集・整理

#### **情報源統合設計**
```typescript
// 情報源プロバイダー
interface InfoProvider {
  name: string
  type: 'official' | 'medical' | 'community'
  reliability: number // 1-5
  updateFrequency: 'daily' | 'weekly' | 'monthly'
  collectInfo(query: InfoQuery): Promise<InfoResult[]>
}

const infoProviders: InfoProvider[] = [
  {
    name: 'Japan Cancer Society Guidelines',
    type: 'official',
    reliability: 5,
    updateFrequency: 'monthly',
    collectInfo: collectJCSGuidelines
  },
  {
    name: 'Cancer Hospital Database',
    type: 'medical',
    reliability: 5,
    updateFrequency: 'weekly',
    collectInfo: collectHospitalInfo
  },
  {
    name: 'Clinical Trials Registry',
    type: 'official',
    reliability: 5,
    updateFrequency: 'daily',
    collectInfo: collectTrialInfo
  }
]
```

#### **実装タスク（2週間）**
1. **InfoCollectionService**実装
2. **ReliabilityScoring**信頼度評価システム
3. **ContentNormalization**情報正規化処理
4. **UpdateScheduler**定期更新スケジューラー
5. **QualityAssurance**品質保証機能

### **2-2. 専門医リスト生成機能**

#### **目標**
AI活用による個別化された専門医マッチングシステム

#### **マッチングアルゴリズム**
```typescript
interface DoctorMatcher {
  matchDoctors(criteria: MatchCriteria): Promise<MatchedDoctor[]>
}

interface MatchCriteria {
  cancerType: string
  stage?: string
  location: {
    latitude: number
    longitude: number
    maxDistance: number // km
  }
  preferences: {
    hospital_type?: string[]
    experience_years?: number
    language?: string[]
    gender?: string
  }
}

interface MatchedDoctor {
  doctor: DoctorInfo
  hospital: HospitalInfo
  matchScore: number // 0-100
  matchReasons: string[]
  availability: AvailabilityInfo
  accessInfo: AccessInfo
}
```

#### **実装タスク（2週間）**
1. **DoctorDatabase**構築・統合
2. **GeolocationMatcher**位置情報マッチング
3. **SpecialtyMatcher**専門性マッチング
4. **AvailabilityChecker**予約可能性確認
5. **ReviewAggregator**患者評価集計

---

## 🚀 Phase 3: 体験向上・利便性強化

### **3-1. 共有・保存機能完成**

#### **目標**
家族・医療従事者との情報共有機能の完成

#### **技術実装**
```typescript
// PDF生成機能
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface PDFGenerator {
  generateRoadmapPDF(roadmap: RoadmapData): Promise<Blob>
  generateMedicalSummaryPDF(medicalData: MedicalData): Promise<Blob>
  generateQuestionListPDF(questions: Question[]): Promise<Blob>
}

// 家族共有機能
interface FamilySharing {
  createFamilyAccount(familyInfo: FamilyInfo): Promise<FamilyAccount>
  shareRoadmap(roadmapId: string, familyMembers: string[]): Promise<void>
  setPermissions(memberId: string, permissions: Permission[]): Promise<void>
}
```

### **3-2. アプリ版連携基盤**

#### **目標**
モバイルアプリとの効率的な情報同期基盤

#### **同期システム設計**
```typescript
// リアルタイム同期
interface SyncEngine {
  syncUserData(userId: string): Promise<SyncResult>
  handleConflictResolution(conflicts: DataConflict[]): Promise<void>
  subscribeToChanges(userId: string, callback: ChangeCallback): void
}

// オフライン対応
interface OfflineManager {
  cacheEssentialData(userId: string): Promise<void>
  syncWhenOnline(): Promise<void>
  handleOfflineChanges(changes: OfflineChange[]): Promise<void>
}
```

---

## 📈 開発スケジュール

### **Week 1-2: Phase 1 完了**
- ダッシュボード4エリア実装
- がん治療プロフィール設定画面
- ロードマップ生成改善

### **Week 3-6: Phase 2 実装**
- 自動情報収集エンジン
- 専門医リスト生成機能
- 情報収集進捗表示システム

### **Week 7-10: Phase 3 実装**
- 共有・保存機能完成
- 家族連携機能
- アプリ版連携基盤

### **Week 11-12: テスト・改善**
- 統合テスト
- ユーザビリティテスト
- パフォーマンス最適化

---

## ⚡ 技術的課題と解決策

### **課題1: AI生成コンテンツの品質保証**
**解決策:**
- 多層品質チェックシステム
- 出典情報の自動検証
- 専門家監修ワークフロー

### **課題2: 大量データの効率的処理**
**解決策:**
- 非同期処理とキューシステム
- インクリメンタル更新
- キャッシュ戦略最適化

### **課題3: プライバシー保護**
**解決策:**
- データ分離とセキュリティレベル管理
- 匿名化・仮名化処理
- GDPR/個人情報保護法準拠

---

## 🎯 成功指標と測定方法

### **Phase 1 成功指標**
- ダッシュボード滞在時間: 現在の2分 → 目標5分
- プロフィール完了率: 現在の30% → 目標80%
- ロードマップ生成完了率: 現在の60% → 目標90%

### **Phase 2 成功指標**
- 情報収集精度: 目標85%以上
- 専門医マッチング満足度: 目標4.5/5.0以上
- 情報更新頻度: 週次更新達成率90%以上

### **Phase 3 成功指標**
- 共有機能利用率: 目標40%以上
- 家族アカウント作成率: 目標30%以上
- アプリ連携同期成功率: 目標99%以上

---

## 🔄 継続的改善プロセス

### **月次レビュー項目**
1. ユーザーフィードバック分析
2. システムパフォーマンス評価
3. 医療情報の最新性チェック
4. セキュリティ監査

### **四半期レビュー項目**
1. AI機能の精度評価
2. 新機能のROI分析
3. 競合分析と差別化戦略見直し
4. 技術スタック最適化検討

---

*この開発計画書は、実装の進行に合わせて週次で更新されます。* 