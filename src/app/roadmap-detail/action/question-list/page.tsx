"use client";

import { useState } from 'react';
import StepGuide from '@/components/question-list/StepGuide';
import CategoryTagList from '@/components/question-list/CategoryTagList';
import QuestionPoolList from '@/components/question-list/QuestionPoolList';
import MyQuestionList from '@/components/question-list/MyQuestionList';
import ArrowBetween from '@/components/question-list/ArrowBetween';

const ALL_CATEGORIES = [
  'すべて',
  '症状・体調',
  '治療について',
  '薬について',
  '生活・食事',
  '副作用',
  '経過・予後',
  '検査について',
];

const INITIAL_POOL = [
  { text: '現在の治療の効果はどの程度期待できますか？', category: '治療について' },
  { text: 'この薬の副作用で注意すべき症状はありますか？', category: '薬について' },
  { text: '次回の検査はいつ頃予定されていますか？', category: '検査について' },
  { text: '日常生活で気をつけるべき点はありますか？', category: '生活・食事' },
  { text: '痛みや不快感が続く場合はどうすればよいですか？', category: '症状・体調' },
];

const INITIAL_MY_QUESTIONS = [
  { text: '現在の症状は治療の効果として正常な範囲内ですか？', category: '症状・体調', recommended: true },
  { text: '治療の進行状況は予定通りですか？', category: '治療について', recommended: true },
  { text: '次回の診察までに気をつけるべきことはありますか？', category: '生活・食事', recommended: true },
  { text: 'この薬の服用方法で正しいでしょうか？', category: '薬について', recommended: false },
];

export default function QuestionListPage() {
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [questionPool] = useState(INITIAL_POOL);
  const [myQuestions, setMyQuestions] = useState(INITIAL_MY_QUESTIONS);

  // カテゴリーで絞り込み
  const filteredPool = selectedCategory === 'すべて'
    ? questionPool.filter(q => !myQuestions.some(mq => mq.text === q.text))
    : questionPool.filter(q => q.category === selectedCategory && !myQuestions.some(mq => mq.text === q.text));

  // 質問追加
  const handleAdd = (q) => {
    setMyQuestions([...myQuestions, { ...q, recommended: false }]);
  };
  // 質問削除
  const handleRemove = (q) => {
    setMyQuestions(myQuestions.filter(mq => mq.text !== q.text));
  };
  // カテゴリー選択
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <StepGuide />
      <div className="grid grid-cols-3 gap-6 mt-8">
        <div>
          <CategoryTagList
            categories={ALL_CATEGORIES}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
          />
          <QuestionPoolList
            questions={filteredPool}
            onAdd={handleAdd}
          />
        </div>
        <div className="flex items-center justify-center">
          <ArrowBetween />
        </div>
        <div>
          <MyQuestionList
            questions={myQuestions}
            onRemove={handleRemove}
          />
        </div>
      </div>
    </div>
  );
} 