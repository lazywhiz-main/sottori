# 2025年1月3日 - コンテンツ詳細・個人化機能実装計画

## 完了した作業

### 1. 詳細API・フロントエンド修正 ✅
- **詳細API修正**: `src/app/api/info-updates/read/[id]/route.ts`
  - `structured_content_pool`から正しくデータ取得
  - レスポンス構造の統一
- **フロントエンド修正**: `src/app/info-updates/[id]/page.tsx`
  - APIレスポンス構造の不一致修正（`data.update` vs 直接オブジェクト）
  - 型定義に合わせたUI描画修正
  - 関連度スコア表示ロジック修正

### 2. 個人化エンジンの挙動確認・修正 ✅
- **個人化エンジン修正**: `src/lib/services/personalizationEngine.ts`
  - `structured_content_pool`から未処理データのみを抽出
  - 関連度スコア計算・保存ロジック修正
- **テスト機能追加**: `/test-detail`ページで動作確認可能

### 3. DBスキーマ拡張 ✅
- **SQLファイル作成**: `src/lib/database_structured_content_pool_extension.sql`
  - `cancer_types` (TEXT[]) - がん種配列
  - `stages` (TEXT[]) - ステージ配列  
  - `age_groups` (TEXT[]) - 年齢層配列
  - `regions` (TEXT[]) - 地域配列
- **インデックス作成**: フィルタリング用GINインデックス
- **ユーティリティ関数**: `filter_structured_content_by_criteria()`
- **既存データ更新**: デフォルト値設定

### 4. AIプロンプト修正 ✅
- **構造化プロンプト更新**: `src/lib/services/realDataCollectors.ts`
  - 厚労省ガイドライン用プロンプトに新しいカラム対応
  - 医学会ガイドライン用プロンプトに新しいカラム対応
  - 出力形式に`cancer_types`、`stages`、`age_groups`、`regions`追加
  - 指定値の詳細説明（がん種、ステージ、年齢層、地域）

### 5. 型定義・サービスクラス更新 ✅
- **型定義更新**: `src/lib/types/info-updates.ts`
  - `StructuredContent`型に新しいカラム追加
- **サービスクラス更新**: `src/lib/services/informationPoolService.ts`
  - `convertToStructuredFormat`メソッドに新しいカラム対応
  - `normalizeItem`メソッドで新しいカラム処理
  - がん種・ステージ推定ロジック実装

## 詳細ページ設計 - ユーザー体験価値重視

### 設計の核となるユーザーストーリー

```
ユーザーが詳細ページに来る理由と期待する価値：

1. 「なぜこの情報が私に推薦されたのか？」（透明性・信頼性）
2. 「この情報は私の状況に合っているか？」（適合性確認）
3. 「この情報は信頼できるか？」（権威性・出典確認）
4. 「他にも関連する情報はあるか？」（継続的探索）
```

### 階層化UI構造と各セクションの存在理由

```
┌──────────────────────────────┐
│ ① タイトル + カテゴリ + スコア │ ← 情報の価値と信頼性の第一印象
├──────────────────────────────┤
│ ② 要約・リード文              │ ← 詳細を読むかどうかの判断材料
├──────────────────────────────┤
│ ③ 本文（詳細内容）            │ ← 核心情報の提供
│   - 段落・リスト・表など       │
│   - 長文は「続きを読む」対応   │
├──────────────────────────────┤
│ ④ 関連度根拠情報（最重要）    │ ← AI推薦の透明性と信頼性向上
│   - なぜ選ばれたか            │
│   - 各スコアの詳細            │
├──────────────────────────────┤
│ ⑤ 出典・信頼性情報            │ ← 情報の権威性と信頼性の明示
├──────────────────────────────┤
│ ⑥ 対象者・タグ情報            │ ← ユーザーの状況との適合性確認
├──────────────────────────────┤
│ ⑦ 関連情報へのリンク          │ ← 継続的な情報探索の支援
└──────────────────────────────┘
```

### 各セクションの詳細設計とユーザー価値

#### ① ヘッダー情報（情報の価値と信頼性の第一印象）
**ユーザー価値**: 一目で情報の重要度と信頼性を判断
```tsx
<div className="header-section">
  <h1>{update.title}</h1>
  <div className="meta-badges">
    <Badge variant="outline">{getCategoryLabel(update.category)}</Badge>
    <Badge variant="secondary">信頼度: {update.reliability_score}/5</Badge>
    <Badge variant="default">関連度: {update.final_relevance_score || update.relevance_score}%</Badge>
  </div>
</div>
```

#### ② 要約・リード文（詳細を読むかどうかの判断材料）
**ユーザー価値**: 時間をかけて詳細を読む価値があるかの判断
```tsx
<div className="summary-section">
  <p className="lead-text">{update.summary}</p>
  <div className="quick-stats">
    <span>📊 エビデンスレベル: {update.evidence_level}</span>
    <span>📅 更新日: {formatDate(update.updated_at)}</span>
  </div>
</div>
```

#### ③ 本文（核心情報の提供）
**ユーザー価値**: 実用的で具体的な情報の取得
```tsx
<div className="content-section">
  <div className="content-body">
    {update.content}
  </div>
  {update.key_points && (
    <div className="key-points">
      <h3>重要ポイント</h3>
      <ul>
        {update.key_points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
    </div>
  )}
</div>
```

#### ④ 関連度根拠情報（AI推薦の透明性と信頼性向上）
**ユーザー価値**: AI推薦の根拠を理解し、信頼性を向上させる
```tsx
<div className="relevance-section">
  <h3>🤖 この情報があなたに選ばれた理由</h3>
  
  <div className="relevance-grid">
    <div className="relevance-item">
      <div className="score-header">
        <span>医療的マッチング</span>
        <span className="score">{update.medical_match_score || 0}点</span>
      </div>
      <Progress value={update.medical_match_score || 0} />
      <div className="reasons">
        {update.cancer_types?.includes(userProfile.cancerType) && (
          <span>✓ あなたのがん種（{getCancerTypeLabel(userProfile.cancerType)}）と一致</span>
        )}
        {update.stages?.includes(userProfile.stage) && (
          <span>✓ 現在の病期（{getStageLabel(userProfile.stage)}）に該当</span>
        )}
      </div>
    </div>
    
    <div className="relevance-item">
      <div className="score-header">
        <span>状況的関連性</span>
        <span className="score">{update.situational_relevance_score || 0}点</span>
      </div>
      <Progress value={update.situational_relevance_score || 0} />
      <div className="reasons">
        <span>✓ 現在の治療段階（{getTreatmentPhaseLabel(userProfile.phase)}）に適切</span>
        {update.regions?.includes(userProfile.region) && (
          <span>✓ お住まいの地域（{getRegionLabel(userProfile.region)}）の情報</span>
        )}
      </div>
    </div>
    
    <div className="relevance-item">
      <div className="score-header">
        <span>個人的関心</span>
        <span className="score">{update.personal_interest_score || 0}点</span>
      </div>
      <Progress value={update.personal_interest_score || 0} />
      <div className="reasons">
        <span>✓ 過去に「{update.category}」カテゴリをよく閲覧</span>
        <span>✓ 類似情報の保存・クリック履歴あり</span>
      </div>
    </div>
    
    <div className="relevance-item">
      <div className="score-header">
        <span>緊急度・重要度</span>
        <span className="score">{update.urgency_importance_score || 0}点</span>
      </div>
      <Progress value={update.urgency_importance_score || 0} />
      <div className="reasons">
        <span>✓ 現在の治療段階で重要な情報</span>
        <span>✓ あなたの関心事（{userProfile.currentConcerns.join(', ')}）と一致</span>
      </div>
    </div>
  </div>
  
  {update.relevance_explanation && (
    <div className="explanation">
      <p>{update.relevance_explanation}</p>
    </div>
  )}
</div>
```

#### ⑤ 出典・信頼性情報（情報の権威性と信頼性の明示）
**ユーザー価値**: 情報の信頼性と権威性を確認
```tsx
<div className="source-section">
  <h3>📚 出典・信頼性情報</h3>
  <div className="source-grid">
    <div className="source-item">
      <span className="label">情報源:</span>
      <span>{update.source_name}</span>
    </div>
    <div className="source-item">
      <span className="label">信頼度:</span>
      <div className="reliability-stars">
        {[...Array(5)].map((_, i) => (
          <Star key={i} filled={i < update.reliability_score} />
        ))}
      </div>
    </div>
    <div className="source-item">
      <span className="label">エビデンスレベル:</span>
      <Badge variant="outline">{update.evidence_level}</Badge>
    </div>
    {update.source_url && (
      <div className="source-item">
        <span className="label">原文:</span>
        <a href={update.source_url} target="_blank" rel="noopener">
          詳細を見る →
        </a>
      </div>
    )}
  </div>
</div>
```

#### ⑥ 対象者・タグ情報（ユーザーの状況との適合性確認）
**ユーザー価値**: 自分の状況に合っているかの確認
```tsx
<div className="target-section">
  <h3>🎯 対象者・タグ情報</h3>
  <div className="target-grid">
    <div className="target-item">
      <span className="label">対象がん種:</span>
      <div className="tags">
        {update.cancer_types?.map(type => (
          <Badge key={type} variant="outline">
            {getCancerTypeLabel(type)}
          </Badge>
        ))}
      </div>
    </div>
    <div className="target-item">
      <span className="label">対象ステージ:</span>
      <div className="tags">
        {update.stages?.map(stage => (
          <Badge key={stage} variant="outline">
            {getStageLabel(stage)}
          </Badge>
        ))}
      </div>
    </div>
    <div className="target-item">
      <span className="label">対象年齢層:</span>
      <div className="tags">
        {update.age_groups?.map(age => (
          <Badge key={age} variant="outline">
            {getAgeGroupLabel(age)}
          </Badge>
        ))}
      </div>
    </div>
    <div className="target-item">
      <span className="label">対象地域:</span>
      <div className="tags">
        {update.regions?.map(region => (
          <Badge key={region} variant="outline">
            {getRegionLabel(region)}
          </Badge>
        ))}
      </div>
    </div>
    <div className="target-item">
      <span className="label">タグ:</span>
      <div className="tags">
        {update.tags?.map(tag => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  </div>
</div>
```

#### ⑦ 関連情報へのリンク（継続的な情報探索の支援）
**ユーザー価値**: 次のステップへの導線提供
```tsx
<div className="related-section">
  <h3>🔗 関連情報</h3>
  <div className="related-grid">
    <div className="related-category">
      <h4>同じカテゴリの情報</h4>
      <div className="related-items">
        {relatedByCategory.map(item => (
          <RelatedItem key={item.id} item={item} />
        ))}
      </div>
    </div>
    <div className="related-category">
      <h4>同じがん種の情報</h4>
      <div className="related-items">
        {relatedByCancerType.map(item => (
          <RelatedItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  </div>
</div>
```

### ユーザー体験の流れと価値提供

1. **情報の価値判断**（①→②）
   - タイトル・カテゴリ・スコアで重要度を判断
   - 要約で詳細を読む価値があるかを判断

2. **核心情報の取得**（③）
   - 実用的で具体的な情報を取得
   - 重要ポイントで要点を把握

3. **AI推薦の理解**（④）
   - なぜこの情報が選ばれたかを理解
   - AI推薦への信頼性を向上

4. **信頼性の確認**（⑤）
   - 情報源の権威性を確認
   - エビデンスレベルで信頼性を判断

5. **適合性の確認**（⑥）
   - 自分の状況に合っているかを確認
   - 対象者情報で適合性を判断

6. **継続的探索**（⑦）
   - 関連情報で次のステップを見つける
   - 情報探索の継続を支援

## 現在の状況

### 実装済み機能
1. **DBスキーマ拡張**: 新しいカラム追加完了
2. **AIプロンプト修正**: 構造化処理で新しいカラム生成
3. **型定義更新**: TypeScript型安全性確保
4. **サービスクラス対応**: データ処理・保存機能
5. **詳細ページ修正**: 表示・API連携正常化
6. **個人化エンジン修正**: 関連度計算・保存機能

### 次のステップ
1. **SQL実行**: `database_structured_content_pool_extension.sql`を実行
2. **動作確認**: 新しいカラムでのデータ保存・取得テスト
3. **フロントエンド表示**: 新しいカラムのUI表示実装
4. **フィルタリング機能**: がん種・ステージ・年齢層での絞り込み

## 技術仕様

### 新しいカラム仕様
```sql
-- がん種カラム
cancer_types TEXT[] NOT NULL DEFAULT '{"all"}'
-- 指定値: breast_cancer, lung_cancer, stomach_cancer, colorectal_cancer, 
--        prostate_cancer, liver_cancer, pancreatic_cancer, esophageal_cancer, all

-- ステージカラム  
stages TEXT[] NOT NULL DEFAULT '{"all"}'
-- 指定値: stage_1, stage_2, stage_3, stage_4, all

-- 年齢層カラム
age_groups TEXT[] NOT NULL DEFAULT '{"all"}'
-- 指定値: 20s, 30s, 40s, 50s, 60s, 70s, all

-- 地域カラム
regions TEXT[] NOT NULL DEFAULT '{"all"}'
-- 指定値: tokyo, osaka, kanto, kansai, all
```

### AIプロンプト出力形式
```json
{
  "guidelines": [
    {
      "title": "情報のタイトル",
      "summary": "100文字程度の要約",
      "content": "詳細な内容",
      "cancer_types": ["breast_cancer", "lung_cancer", "all"],
      "stages": ["stage_1", "stage_2", "all"],
      "age_groups": ["30s", "40s", "50s", "all"],
      "regions": ["tokyo", "osaka", "all"],
      "treatmentInfo": { ... },
      "recommendations": [ ... ],
      "practicalInfo": { ... }
    }
  ]
}
```

## 今後の改善ポイント

### 短期（1-2週間）
1. **フロントエンド表示**: 新しいカラムの表示・フィルタリングUI
2. **検索機能強化**: がん種・ステージ・年齢層での絞り込み
3. **データ品質向上**: 既存データの新しいカラム値設定

### 中期（1ヶ月）
1. **個人化精度向上**: 新しいカラムを活用した関連度計算
2. **レコメンデーション**: ユーザープロファイルとのマッチング
3. **統計・分析**: カテゴリ別の利用状況分析

### 長期（2-3ヶ月）
1. **機械学習導入**: 自動カテゴリ分類・関連度予測
2. **コンテンツ生成**: ユーザー固有の情報生成
3. **外部連携**: 医療機関・学会とのデータ連携

---

**最終更新**: 2025年1月3日
**ステータス**: DB拡張・プロンプト修正完了、SQL実行待ち 