# 質問ピックアップロジック仕様・UIサンプル（2025/07/08）

## 1. 質問ピックアップロジック仕様

### ● ロジック概要
- ユーザーの治療段階・状況・過去の選択履歴に応じて、質問プールから「おすすめ質問」を自動でピックアップし上位表示
- ユーザーはカテゴリごとに質問を追加・編集・並べ替え可能
- 「優先」ラベルや並び順はユーザーが自由にカスタマイズ

### ● ピックアップ基準
1. **治療段階に応じたおすすめ**
   - 例：治療方針決定前→治療法比較、副作用、家族相談など
2. **過去のユーザー行動・選択履歴**
   - 例：前回「副作用」を重視→関連質問を優先表示
3. **よく使われる質問（人気順）**
   - 全体の利用頻度が高いものを上位に
4. **カテゴリ選択による絞り込み**
   - ユーザーがカテゴリを選ぶと、そのカテゴリの質問を一覧表示
5. **自由追加・編集・並べ替え**
   - ユーザーが自分の言葉で追加・編集・順序変更

### ● 表示ロジック例
- 「おすすめ」セクションに自動ピックアップされた質問を上位表示
- 「カテゴリから選ぶ」セクションで全カテゴリの質問を参照・追加
- 「自分の質問リスト」セクションで編集・優先度付け・並べ替え

---

## 2. UIサンプル（HTMLワイヤーフレーム）

```html
<!-- 質問ピックアップUIサンプル -->
<div class="container">
  <div class="header">
    <div class="header-icon">💡</div>
    <div>
      <div class="header-title">おすすめ質問ピックアップ</div>
      <div class="header-desc">あなたの治療段階や状況に合わせて、よく使われる質問を自動で提案します。</div>
    </div>
  </div>
  <section class="recommend-section">
    <div class="section-title">おすすめ</div>
    <ul class="recommend-list">
      <li class="recommend-item">治療法の選択肢ごとのメリット・デメリットは何ですか？ <button class="add-btn">追加</button></li>
      <li class="recommend-item">副作用や生活への影響について詳しく知りたいです。 <button class="add-btn">追加</button></li>
      <li class="recommend-item">家族がサポートできることは何ですか？ <button class="add-btn">追加</button></li>
    </ul>
  </section>
  <section class="category-section">
    <div class="section-title">カテゴリから選ぶ</div>
    <div class="category-tabs">
      <button class="tab-btn active">治療法</button>
      <button class="tab-btn">副作用・生活</button>
      <button class="tab-btn">費用・制度</button>
      <button class="tab-btn">家族・サポート</button>
      <button class="tab-btn">仕事・社会復帰</button>
      <button class="tab-btn">その他</button>
    </div>
    <ul class="category-list">
      <li class="category-item">治療法の変更は可能ですか？ <button class="add-btn">追加</button></li>
      <li class="category-item">標準治療と先進医療の違いは？ <button class="add-btn">追加</button></li>
    </ul>
  </section>
  <section class="mylist-section">
    <div class="section-title">自分の質問リスト</div>
    <ul class="mylist">
      <li class="mylist-item">
        <span class="priority-label">優先</span>
        治療法の選択肢ごとのメリット・デメリットは何ですか？
        <button class="action-btn">編集</button>
        <button class="action-btn">削除</button>
        <button class="action-btn">↑</button>
        <button class="action-btn">↓</button>
      </li>
      <li class="mylist-item">
        <span class="priority-label">通常</span>
        副作用や生活への影響について詳しく知りたいです。
        <button class="action-btn">編集</button>
        <button class="action-btn">削除</button>
        <button class="action-btn">↑</button>
        <button class="action-btn">↓</button>
      </li>
    </ul>
  </section>
</div>
```

---

## 3. 備考
- 実際のUIは既存デザイン（色・余白・角丸・ボタン等）を踏襲
- 「おすすめ」や「カテゴリ」タブは動的に切り替え可能
- ピックアップロジックは今後AIやユーザー行動分析で高度化も可能 