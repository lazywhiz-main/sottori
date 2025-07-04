# Sottori - 画面構成・情報設計書

## 必要画面の洗い出し

### 🏠 コア体験画面
1. **ランディングページ** - 最初の出会い・安心感の提供
2. **ゆっくりチェック画面** - 状況整理（旧：30秒セルフチェック）
3. **あなた専用ガイド画面** - 個別化ロードマップ表示（旧：3分ロードマップ）
4. **かんたん共有画面** - 家族向け情報共有

### 🔧 サポート画面
5. **運営者について画面** - 信頼性・一人運営の説明
6. **よくある質問画面** - 不安解消・使い方説明
7. **利用規約・プライバシーポリシー画面** - 法的事項
8. **お問い合わせ画面** - 困った時の相談窓口

### 📊 継続利用画面
9. **マイページ** - 過去の結果確認・更新
10. **通知設定画面** - フォロー頻度の調整
11. **情報更新通知画面** - 新しい治験・制度情報

---

## 🏗️ 大きな情報設計

### 1. ランディングページ
```
📍 情報階層
├── ヒーロー: 「迷っても、頼ってもいい。」
├── 価値提案: 「あなたの状況で情報を整理」
├── 運営者の顔: 信頼性・一人運営の説明
├── 利用の流れ: 3ステップで安心感
├── よくある不安: FAQ形式で先回り解決
└── CTA: 「まずは眺めてみる」
```

### 2. ゆっくりチェック画面
```
📍 情報階層
├── ヘッダー: 進行状況（圧迫感なし）
├── 安心メッセージ: 「わからなくても大丈夫」
├── 質問エリア: 1問ずつ、選択肢にも説明
├── 保存・中断: 「疲れたら休憩」ボタン
└── 次へ/戻る: プレッシャーのない進行
```

### 3. あなた専用ガイド画面
```
📍 情報階層
├── 個別化メッセージ: 「○○さんの場合」
├── 標準治療の流れ: タイムライン形式
├── お金の話: 概算費用・制度・控除
├── 治験情報: 地域別・条件マッチング
├── 専門医リスト: 距離・アクセス情報
├── 次のアクション: 「今日決めなくても大丈夫」
└── 共有・保存: 家族との相談材料として
```

---

## 🔄 画面間の遷移設計

### メイン動線
```
ランディング → ゆっくりチェック → あなた専用ガイド → かんたん共有
    ↓              ↓              ↓              ↓
 (安心感)        (受容感)        (理解感)       (連帯感)
```

### サポート動線
```
各画面から → よくある質問 / 運営者について / お問い合わせ
           ↓
         不安解消・信頼構築
```

### 継続利用動線
```
初回完了 → 通知設定 → マイページ → 情報更新 → 再チェック
   ↓         ↓         ↓         ↓         ↓
(達成感)   (選択権)   (継続感)   (最新感)   (進歩感)
```

---

## 📋 各画面の詳細情報設計

### 優先度 HIGH（MVP必須）

#### ランディングページ
**目的**: 安心感の提供・初回訪問の促進  
**KPI**: チェック開始率、滞在時間  
**重要要素**: 
- 共感メッセージ
- 運営者の顔と体験談
- 「完璧を求めない」スタンス
- プライバシー・信頼性の明記

**情報コンテンツ**:
- ヒーローメッセージ: 「迷っても、頼ってもいい。次の一歩は、あなたのペースで。」
- サブメッセージ: 「○○がんの情報、一緒に整理してみませんか？完璧な答えは求めません。」
- 運営者紹介: がん体験 + 医療×デジタル経験
- 3ステップの流れ: 眺める → 整理する → 相談する
- 信頼性の根拠: 医学文献、AI活用、一人運営の理由
- よくある不安: 「個人情報は？」「お金は？」「信頼できる？」

#### ゆっくりチェック画面
**目的**: ストレスなく状況整理  
**KPI**: 完了率、途中離脱ポイント  
**重要要素**:
- 「わからない」選択肢
- 保存・中断機能
- 優しい言葉遣い
- 医療用語の簡単な説明

**質問設計**:
1. **現在の状況**: 告知直後/治療中/経過観察/再発 + わからない
2. **がんの種類**: 主要がん種 + その他・わからない
3. **地域**: 都道府県選択
4. **一番知りたいこと**: 治療の流れ/お金/病院/家族サポート（複数選択可）
5. **気持ちの状態**: 不安が強い/情報収集したい/家族と相談したい + 複数選択可

**UX要素**:
- 進行状況: 「あなたのペースで」表示
- 保存機能: 「疲れたら休憩してください」
- 各質問に: 「わからなくても大丈夫です」
- 医療用語: ホバーで簡単説明

#### あなた専用ガイド画面
**目的**: 個別化された行動指針の提示  
**KPI**: 共有率、再訪問率  
**重要要素**:
- 情報の信頼性明記
- 「参考情報」としての位置づけ
- 具体的だが急かさない表現
- 主治医相談の促進

**コンテンツ構成**:
1. **個別化ヘッダー**: 「○○がん・○○地域の○○さんの場合」
2. **標準治療タイムライン**: 
   - ガイドライン準拠の治療選択肢
   - 期間・費用概算
   - 各段階での注意点
   - 出典明記
3. **お金の総合ガイド**:
   - 治療費概算
   - 高額療養費制度
   - 医療費控除
   - 地域の助成金
   - 民間保険活用
4. **治験・臨床試験**:
   - 地域別の適合試験
   - 参加条件・期間
   - 試験登録番号
   - 実施機関の連絡先
5. **専門医・医療機関**:
   - 地域別リスト
   - アクセス情報
   - セカンドオピニオン対応
6. **次のステップ**:
   - 「今日決めなくても大丈夫」
   - 「家族と相談してください」
   - 「主治医に聞いてみてください」

#### かんたん共有画面
**目的**: 家族との情報共有支援  
**KPI**: 共有実行率、家族の理解度  
**重要要素**:
- 短縮URL・QRコード
- やさしい日本語版
- PDF/画像ダウンロード
- プライバシー配慮

### 優先度 MEDIUM（フェーズ2）

#### マイページ
**目的**: 継続的な関係性構築  
**機能**:
- 過去のチェック結果確認
- 情報更新の通知履歴
- 再チェック（状況変化時）
- 通知設定変更

#### よくある質問画面
**目的**: 不安解消・信頼性向上  
**カテゴリ**:
- サービスについて
- 個人情報・プライバシー
- 医療情報の信頼性
- 利用料金
- 技術的な問題

#### 運営者について画面
**目的**: 信頼関係の構築  
**内容**:
- 運営者の体験談
- 専門背景・経歴
- サービス開発の想い
- 一人運営の理由と限界
- 連絡先・お問い合わせ

### 優先度 LOW（将来拡張）

#### 通知設定画面
**目的**: ユーザーの自律性尊重  
**機能**:
- 通知頻度の調整
- 通知内容の選択
- 通知停止・再開

#### 情報更新通知画面
**目的**: 最新情報の提供  
**機能**:
- 新しい治験情報
- ガイドライン更新
- 制度変更
- 地域の医療イベント

---

## 📱 レスポンシブ対応

### デバイス別優先度
1. **スマートフォン** - メイン対象（告知直後の検索）
2. **タブレット** - 家族との相談時
3. **PC** - 詳細な情報確認時

### 画面サイズ別調整
- **スマホ**: 1カラム、大きなタップエリア、スクロール最適化
- **タブレット**: 2カラム、家族での閲覧に配慮
- **PC**: 3カラム、詳細情報の並列表示

---

## 🔍 アクセシビリティ

### 必須対応
- 高コントラスト対応
- 大きな文字サイズ対応
- 音声読み上げ対応
- キーボード操作対応

### 特別配慮
- 疲労状態での利用を想定
- 集中力低下時でも理解できる設計
- 感情的に不安定な状態での利用配慮