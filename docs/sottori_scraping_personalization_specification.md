# Sottori スクレイピング・個人化システム仕様書

## 概要

医療情報スクレイピング・個別化システムの実装仕様書です。
管理者が一括でURLリストをスクレイピングし、情報プールに保存、ユーザーごとの個人化を行う一連の流れを定義します。

## 1. 全体フロー概要

```
[URLリスト(TypeScript管理)]
    ↓
[逐次fetch/スクレイピング]
    ↓
[raw_content_pool（ローデータ保存）]
    ↓
[structured_content_pool（構造化データ保存）]
    ↓
[ユーザーごとの個人化処理]
    ↓
[structured_content_relevance_scores, user_content_consumption_history]
```

## 2. 詳細フロー

### 2-1. スクレイピング対象URL管理

**ファイル**: `src/const/scraping_urls.ts`

用途ごとにURLリストを一元管理：

- **テスト用**: `TEST_SCRAPING_URLS`
- **厚労省**: `MHLW_SCRAPING_URLS`, `generateMHLWUrls`
- **医学会**: `MEDICAL_SOCIETY_URLS`
- **地域病院**: `REGIONAL_HOSPITAL_URLS`
- **手動追加**: `MANUAL_ADDITIONAL_URLS`

### 2-2. スクレイピング本体

**実装**: `src/lib/services/realDataCollectors.ts`

- 逐次forループでURLごとにfetch
- HTMLパース・データ抽出（最低限タイトル・本文・段落数など）
- 失敗・スキップ・成功をすべてconsole.logで詳細出力
- 1秒sleepでアクセス間隔制御
- 結果は`CollectedInfo[]`型で返却

### 2-3. ローデータ保存（raw_content_pool）

**実装**: `src/lib/services/informationPoolService.ts`

- 取得したHTML等を**そのまま保存**
- 重複チェック（URL・ハッシュ・タイトル）
- 保存失敗時はエラー記録

### 2-4. 構造化データ保存（structured_content_pool）

**実装**: `src/lib/services/informationPoolService.ts`

- ローデータをもとに
  - タイトル
  - サマリー
  - 本文
  - カテゴリ
  - 信頼度
  - 関連度
  - がん種/ステージ/地域/年齢層 など
- 付加情報（tags, metadata, expires_at等）も保存
- 保存時にraw_content_poolのIDを参照

### 2-5. 個人化処理

**実装**: `src/lib/services/personalizationEngine.ts`

- ユーザーごとに
  - 関連度スコア計算（AIまたはルールベース）
  - 既読/保存/閲覧回数などの状態管理
- 結果を`structured_content_relevance_scores`や`user_content_consumption_history`に保存

## 3. 主要テーブル構造

### 3-1. raw_content_pool

| カラム名           | 型           | 説明                       |
|--------------------|--------------|----------------------------|
| id                 | uuid         | 主キー                     |
| source_url         | text         | 取得元URL                  |
| source_name        | text         | サイト名                   |
| source_type        | text         | 'official','medical','academic','community' |
| content_type       | text         | 'html','pdf','api_response','rss' |
| raw_content        | text         | 取得した生データ           |
| content_hash       | text         | 内容ハッシュ               |
| content_length     | integer      | 文字数                     |
| extracted_title    | text         | 抽出されたタイトル         |
| extracted_metadata | jsonb        | 抽出されたメタデータ       |
| paragraph_count    | integer      | 段落数                     |
| heading_count      | integer      | 見出し数                   |
| processing_status  | text         | 'pending','processing','completed','failed','skipped' |
| processing_attempts| integer      | 処理試行回数               |
| last_processing_error | text     | 最後の処理エラー           |
| is_cached          | boolean      | キャッシュフラグ           |
| cache_expires_at   | timestamp    | キャッシュ有効期限         |
| collected_at       | timestamp    | 取得日時                   |
| updated_at         | timestamp    | 更新日時                   |

**制約**:
- `(source_url, content_hash)` のユニーク制約
- `content_type` チェック制約
- `processing_status` チェック制約
- `source_type` チェック制約

### 3-2. structured_content_pool

| カラム名           | 型           | 説明                       |
|--------------------|--------------|----------------------------|
| id                 | uuid         | 主キー                     |
| raw_content_id     | uuid         | raw_content_pool参照       |
| title              | text         | タイトル                   |
| summary            | text         | サマリー                   |
| content            | text         | 本文                       |
| category           | text         | カテゴリ                   |
| reliability_score  | integer      | 信頼度（1-5）              |
| relevance_score    | integer      | 関連度（1-100）            |
| quality_score      | integer      | 品質スコア                 |
| structured_data    | jsonb        | 構造化メタデータ           |
| tags               | text[]       | タグ                       |
| key_points         | text[]       | キーポイント               |
| evidence_level     | text         | エビデンスレベル           |
| search_vector      | tsvector     | 全文検索用ベクトル         |
| last_updated       | timestamp    | 最終更新日時               |
| expires_at         | timestamp    | 有効期限                   |
| is_active          | boolean      | 有効フラグ                 |
| created_at         | timestamp    | 登録日時                   |
| updated_at         | timestamp    | 更新日時                   |
| cancer_types       | text[]       | がん種（デフォルト: ['all']） |
| stages             | text[]       | ステージ（デフォルト: ['all']） |
| age_groups         | text[]       | 年齢層（デフォルト: ['all']） |
| regions            | text[]       | 地域（デフォルト: []）      |

**制約**:
- `raw_content_id` 外部キー制約（raw_content_pool参照）
- `category` チェック制約
- `relevance_score` チェック制約（1-100）
- `reliability_score` チェック制約（1-5）

**インデックス**:
- `idx_structured_content_search_gin` (search_vector)
- `idx_structured_quality_desc` (quality_score)
- `idx_structured_expires_active` (expires_at)

### 3-3. structured_content_relevance_scores

| カラム名                 | 型       | 説明                       |
|--------------------------|----------|----------------------------|
| id                       | uuid     | 主キー                     |
| user_id                  | uuid     | ユーザーID                 |
| structured_content_id    | uuid     | structured_content_pool参照|
| medical_match_score      | integer  | 医学的マッチ度（0-100）     |
| situational_relevance_score | integer| 状況的関連度（0-100）       |
| personal_interest_score  | integer  | 興味スコア（0-100）         |
| urgency_importance_score | integer  | 緊急性・重要度（0-100）     |
| final_relevance_score    | integer  | 総合関連度（0-100）         |
| relevance_explanation    | text     | 説明                       |
| calculation_details      | jsonb    | 計算詳細（デバッグ用）     |
| calculated_at            | timestamp| 計算日時                   |
| created_at               | timestamp| 登録日時                   |
| updated_at               | timestamp| 更新日時                   |

**制約**:
- `(user_id, structured_content_id)` のユニーク制約
- `structured_content_id` 外部キー制約
- `user_id` 外部キー制約（profiles参照）
- 各スコアのチェック制約（0-100）

**インデックス**:
- `idx_structured_content_relevance_scores_user_id`
- `idx_structured_content_relevance_scores_content_id`
- `idx_structured_content_relevance_scores_final_score`
- `idx_structured_content_relevance_scores_calculated_at`

### 3-4. user_content_consumption_history

| カラム名                 | 型       | 説明                       |
|--------------------------|----------|----------------------------|
| id                       | uuid     | 主キー                     |
| user_id                  | uuid     | ユーザーID                 |
| structured_content_id    | uuid     | structured_content_pool参照|
| action_type              | text     | 'viewed','read_partial','read_complete','saved','shared','dismissed' |
| reading_duration         | integer  | 読書時間（秒）             |
| reading_percentage       | decimal  | 読書進捗率（0-1）          |
| user_rating              | integer  | ユーザー評価（1-5）        |
| feedback_text            | text     | フィードバック             |
| usefulness_score         | integer  | 有用性スコア（1-5）        |
| created_at               | timestamp| 登録日時                   |

**制約**:
- `action_type` チェック制約
- `reading_percentage` チェック制約（0-1）
- `user_rating` チェック制約（1-5）
- `usefulness_score` チェック制約（1-5）

**インデックス**:
- `idx_user_content_consumption_history_user_id`
- `idx_user_content_consumption_history_content_id`
- `idx_user_content_consumption_history_action_type`
- `idx_user_content_consumption_history_timestamp`

## 4. 実装上の重要ポイント

### 4-1. ログ出力の徹底

- すべての処理で**詳細なログ出力**・**重複チェック**・**エラー記録**を徹底
- URLリスト・保存データ・個人化ロジックは**TypeScriptで明示管理**し、ブラックボックス化を避ける
- バッチ/管理者用スクリプトは**逐次・同期処理**で進捗・失敗理由をターミナルに出力

### 4-2. 重複チェック

- URLベース
- コンテンツハッシュベース
- タイトルベース
- 3つの重複チェックを実装

### 4-3. エラーハンドリング

- fetch失敗時は空配列で継続（フォールバックしない）
- DB保存失敗時はエラー記録
- タイムアウト・接続エラーは一時的エラーとして扱う

### 4-4. アクセス制御

- 1秒sleepでアクセス間隔制御
- 404などの永続的エラーはキャッシュに記録
- 無効URLの再取得を避ける

## 5. 管理者用バッチスクリプト

### 5-1. 実行方法

```bash
# テストモード（安全なテストサイトのみ）
npx ts-node scripts/admin_collect_all.ts --mode=test --dry-run

# 厚労省モード
npx ts-node scripts/admin_collect_all.ts --mode=mhlw --cancerType=colon

# 全収集モード
npx ts-node scripts/admin_collect_all.ts --mode=all --cancerType=colon --max-urls=10
```

### 5-2. オプション

- `--mode`: test, mhlw, all
- `--cancerType`: がん種指定
- `--dry-run`: 実際の収集は行わずURLリスト表示のみ
- `--max-urls`: 最大URL数（デフォルト: 5件）

## 6. 使用されないテーブル

- **user_structured_content_states**: 定義はあるが実際には使用しない

## 7. 今後の拡張予定

- リアルタイム進捗表示（SSE/WebSocket）
- 並列処理対応
- より詳細なエラー分類
- 自動リトライ機能

---

**注意**: この仕様書は現状の実装に基づいて作成されています。新しい実装に移行する際は、この仕様を参考にしてください。 