"use client";

import { useState, useEffect } from 'react';
import StepGuide from './StepGuide';
import CategoryTagList from './CategoryTagList';
import QuestionPoolList from './QuestionPoolList';
import MyQuestionList from './MyQuestionList';
import ArrowBetween from './ArrowBetween';

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

interface QuestionListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuestionListModal({ isOpen, onClose }: QuestionListModalProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [questionPool] = useState(INITIAL_POOL);
  const [myQuestions, setMyQuestions] = useState(INITIAL_MY_QUESTIONS);

  // レスポンシブ判定
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // サイドピーク表示中はbodyスクロール禁止
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // カテゴリーで絞り込み
  const filteredPool = selectedCategory === 'すべて'
    ? questionPool.filter(q => !myQuestions.some(mq => mq.text === q.text))
    : questionPool.filter(q => q.category === selectedCategory && !myQuestions.some(mq => mq.text === q.text));

  // 質問追加
  const handleAdd = (q: any) => {
    setMyQuestions([...myQuestions, { ...q, recommended: false }]);
  };

  // 質問削除
  const handleRemove = (q: any) => {
    setMyQuestions(myQuestions.filter(mq => mq.text !== q.text));
  };

  // カテゴリー選択
  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
  };

  // おすすめクリア
  const handleClearRecommended = () => {
    setMyQuestions(myQuestions.filter(q => !q.recommended));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isDesktop ? 'bg-white/70' : 'bg-black bg-opacity-50'}`}
        onClick={onClose}
      />
      
      {/* モーダルコンテンツ */}
      <div className={`
        fixed z-50 transition-all duration-300 ease-out
        ${isDesktop 
          ? 'right-0 top-0 h-full w-[900px] bg-white shadow-2xl transform translate-x-0 flex flex-col' 
          : 'bottom-0 left-0 right-0 h-4/5 bg-white rounded-t-2xl transform translate-y-0 flex flex-col'
        }
        ${isOpen ? 'translate-x-0 translate-y-0' : isDesktop ? 'translate-x-full' : 'translate-y-full'}
      `}>
        
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">質問リストを作成</h2>
            <p className="text-sm text-gray-600 mt-1">
              医師との相談で聞きたい質問を選んで、効率的な診察を準備しましょう
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* スクロール本体 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* ステップガイド */}
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <StepGuide />
          </div>

          {/* メインコンテンツ */}
          {isDesktop ? (
            <div className="grid grid-cols-[1fr_32px_1fr] gap-6 h-full p-6">
              {/* 質問プールカード */}
              <div className="bg-white rounded-lg shadow p-6 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">質問プール</h3>
                  <p className="text-xs text-gray-500">カテゴリー別に整理された質問から選んでください</p>
                </div>
                <CategoryTagList
                  categories={ALL_CATEGORIES}
                  selected={selectedCategory}
                  onSelect={handleCategorySelect}
                />
                <div className="flex-1 overflow-y-auto mt-2">
                  <QuestionPoolList
                    questions={filteredPool}
                    onAdd={handleAdd}
                  />
                </div>
              </div>
              {/* 矢印 */}
              <div className="flex items-center justify-center">
                <ArrowBetween />
              </div>
              {/* 私の質問リストカード */}
              <div className="bg-white rounded-lg shadow p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">私の質問リスト</h3>
                  <button
                    onClick={handleClearRecommended}
                    className="px-3 py-1.5 rounded bg-red-50 text-red-600 border border-red-200 text-xs font-medium hover:bg-red-100 transition-colors duration-150"
                  >
                    おすすめをクリア
                  </button>
                </div>
                <div className="flex-1 min-h-[320px] bg-gray-50 border-2 border-dashed border-gray-300 rounded p-4 overflow-y-auto">
                  <MyQuestionList
                    questions={myQuestions}
                    onRemove={handleRemove}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setSelectedCategory('すべて')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    selectedCategory === 'すべて' 
                      ? 'text-deep-blue-600 border-b-2 border-deep-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  質問プール
                </button>
                <button
                  onClick={() => setSelectedCategory('my-list')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    selectedCategory === 'my-list' 
                      ? 'text-deep-blue-600 border-b-2 border-deep-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  私のリスト
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {selectedCategory === 'my-list' ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">私の質問リスト</h3>
                      <button
                        onClick={handleClearRecommended}
                        className="text-xs text-red-600 hover:text-red-700 underline"
                      >
                        おすすめをクリア
                      </button>
                    </div>
                    <MyQuestionList
                      questions={myQuestions}
                      onRemove={handleRemove}
                    />
                  </div>
                ) : (
                  <div>
                    <CategoryTagList
                      categories={ALL_CATEGORIES}
                      selected={selectedCategory}
                      onSelect={handleCategorySelect}
                    />
                    <div className="mt-4">
                      <QuestionPoolList
                        questions={filteredPool}
                        onAdd={handleAdd}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* フッター */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              質問数: {myQuestions.length}個
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                下書き保存
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-deep-blue-500 rounded-md hover:bg-deep-blue-600 transition-colors">
                次へ進む
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 