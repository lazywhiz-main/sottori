'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import { useActivityStore } from '@/lib/stores/activityStore';
import { ActivityModal } from '@/components/activities/ActivityModal';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { RecommendationCard } from '@/components/activities/RecommendationCard';
import { UserActivity, ActivityRecommendation } from '@/lib/types/personalization';
import { TreatmentStepWithProgress } from '@/lib/types/database';
import { RoadmapService } from '@/lib/services/roadmapService';

// サイドバーコンポーネント
const Sidebar = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('田中さん');
  const [userStatus, setUserStatus] = useState('新規診断');

  const handleStatusUpdate = () => {
    router.push('/status-update');
  };

  return (
    <aside className="sidebar">
      {/* Profile Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-deep-blue-400 to-warm-coral-400 flex items-center justify-center text-2xl text-white font-semibold">
            {userName.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{userName}</h1>
            <p className="text-sm text-gray-600">{userStatus}</p>
          </div>
        </div>
      </div>

      {/* Status Check Section */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4 transition-all duration-250 hover:border-warm-coral-300 hover:shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-md bg-warm-coral-100 flex items-center justify-center text-warm-coral-600 text-base">
              👩‍⚕️
            </div>
            <div className="text-sm font-semibold text-gray-900">今日の調子</div>
          </div>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            診断から1週間が経ちました。家族と相談は進んでいますか？
          </p>
          <button
            onClick={handleStatusUpdate}
            className="w-full bg-warm-coral-500 text-white border-none py-2 px-3 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 hover:bg-warm-coral-600"
          >
            状況を更新
          </button>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">プロフィール概要</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-xs text-gray-600">診断日</span>
            <span className="text-xs font-medium text-gray-900">1週間前</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-xs text-gray-600">がん種</span>
            <span className="text-xs font-medium text-gray-900">乳がん</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-xs text-gray-600">現在の段階</span>
            <span className="text-xs font-medium text-gray-900">治療方針決定前</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-gray-600">家族状況</span>
            <span className="text-xs font-medium text-gray-900">夫・娘と同居</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

// 治療段階コンポーネント
const TreatmentStep = ({ step, onOpenQuestionList, onAddActivity }: { 
  step: TreatmentStepWithProgress, 
  onOpenQuestionList: () => void,
  onAddActivity: (stepId: number) => void 
}) => {
  const router = useRouter();
  const { 
    activities, 
    recommendations, 
    fetchActivities, 
    fetchRecommendations,
    addActivity, 
    updateActivity, 
    deleteActivity,
    addFromRecommendation
  } = useActivityStore();

  // コンポーネントマウント時にアクティビティとおすすめを取得
  useEffect(() => {
    const userId = 'test-user-id'; // 仮のユーザーID
    fetchActivities(userId);
    fetchRecommendations(userId, step.id);
  }, [step.id, fetchActivities, fetchRecommendations]);

  // ステップ別のアクティビティとおすすめをフィルタリング
  const stepActivities = activities.filter(activity => activity.roadmap_step_id === step.id);
  const stepRecommendations = (recommendations[step.id] ?? []);

  const getStepStyles = () => {
    switch (step.status) {
      case 'completed':
        return {
          marker: 'bg-sage-green-500 text-white',
          content: 'bg-sage-green-50 border-sage-green-200'
        };
      case 'current':
        return {
          marker: 'bg-warm-coral-500 text-white animate-pulse',
          content: 'bg-warm-coral-50 border-warm-coral-200'
        };
      case 'upcoming':
        return {
          marker: 'bg-gray-300 text-gray-600',
          content: 'bg-gray-50 border-gray-200'
        };
    }
  };

  const getDetailIconStyles = () => {
    switch (step.status) {
      case 'completed':
        return 'bg-sage-green-200 text-sage-green-700';
      case 'current':
        return 'bg-warm-coral-200 text-warm-coral-700';
      case 'upcoming':
        return 'bg-gray-200 text-gray-600';
    }
  };

  const styles = getStepStyles();
  const detailIconStyles = getDetailIconStyles();

  const handleAction = (action: any) => {
    if (action.href) {
      router.push(action.href);
    } else {
      console.log('アクション実行:', action.text);
    }
  };

  const handleEditActivity = (activity: UserActivity) => {
    onAddActivity(step.id);
  };

  const handleDeleteActivity = (id: string) => {
    if (confirm('このアクティビティを削除しますか？')) {
      deleteActivity(id);
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateActivity(id, { status: status as any });
  };

  const handleAcceptRecommendation = async (templateId: string) => {
    try {
      const userId = 'test-user-id'; // 仮のユーザーID
      await addFromRecommendation(templateId, userId, step.id);
      // 成功時のフィードバック（将来的にはトースト通知など）
      console.log('おすすめアクティビティを追加しました:', templateId);
    } catch (error) {
      console.error('おすすめ追加エラー:', error);
    }
  };

  const handleSkipRecommendation = async (templateId: string) => {
    try {
      // スキップ処理（将来的にはデータベースに記録）
      console.log('おすすめをスキップしました:', templateId);
      // スキップしたおすすめを非表示にする（将来的にはデータベースに記録）
      // 現在は一時的にコンソールログのみ
    } catch (error) {
      console.error('スキップ処理エラー:', error);
    }
  };

  return (
    <div className="flex items-start gap-4 mb-8 relative">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 relative z-10 border-3 border-white shadow-sm ${styles.marker}`}>
        {step.id}
      </div>
      <div className={`flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 transition-all duration-250 ${styles.content}`}>
        <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{step.description}</p>
        
        <div className="bg-white/70 rounded-md p-3 mb-3">
          {step.details.map((detail, index) => (
            <div key={index} className="flex items-center gap-2 mb-2 last:mb-0">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${detailIconStyles}`}>
                {detail.icon}
              </div>
              <span className="text-xs text-gray-600">{detail.text}</span>
            </div>
          ))}
        </div>
        
        {/* アクティビティリスト */}
        {stepActivities.length > 0 && (
          <div className="mb-3">
            <div className="space-y-2">
              {stepActivities.map((activity: UserActivity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onEdit={handleEditActivity}
                  onDelete={handleDeleteActivity}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        )}

        {/* おすすめアクティビティセクション */}
        {stepRecommendations.length > 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-3 mb-3 bg-white/70">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">おすすめ</span>
              <span className="text-sm font-medium text-gray-700">AIおすすめアクティビティ</span>
            </div>
            <div className="space-y-2">
              {stepRecommendations.map((recommendation: ActivityRecommendation) => (
                <RecommendationCard
                  key={recommendation.template.id}
                  recommendation={recommendation}
                  onAdd={handleAcceptRecommendation}
                  onSkip={handleSkipRecommendation}
                />
              ))}
            </div>
          </div>
        )}

        {/* ＋アクティビティ追加セクション */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-md p-3 mb-3 bg-white/70 hover:border-deep-blue-300 hover:bg-blue-50/30 transition-all duration-250 cursor-pointer"
          onClick={() => onAddActivity(step.id)}
        >
          <button className="w-full flex items-center justify-center gap-2 text-deep-blue-500 text-sm font-medium">
            <span className="text-lg font-bold">＋</span>
            <span>アクティビティ追加</span>
          </button>
        </div>

        {/* お助けツール: currentステップのみ例として表示 */}
        {step.status === 'current' && (
          <div className="mt-3">
            <div className="text-xs font-semibold text-gray-400 mb-1">お助けツール</div>
            <ul className="flex gap-4">
              <li>
                <button 
                  onClick={onOpenQuestionList}
                  className="flex items-center gap-1 text-xs text-gray-700 hover:text-blue-700"
                >
                  <span className="text-base">📝</span>
                  <span className="underline">質問リスト</span>
                </button>
              </li>
              <li>
                <a href="/roadmap-detail/action/family-share" className="flex items-center gap-1 text-xs text-gray-700 hover:text-blue-700">
                  <span className="text-base">👪</span>
                  <span className="underline">家族と共有</span>
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// メインコンテンツ
const MainContent = ({ onOpenQuestionList, onAddActivity }: { 
  onOpenQuestionList: () => void,
  onAddActivity: (stepId: number) => void 
}) => {
  const [roadmapData, setRoadmapData] = useState<TreatmentStepWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoadmapData = async () => {
      try {
        setIsLoading(true);
        const userId = 'test-user-id'; // 仮のユーザーID
        
        // APIからデータを取得（失敗時はダミーデータを使用）
        let data;
        try {
          data = await RoadmapService.getUserRoadmap(userId);
        } catch (apiError) {
          console.warn('API取得に失敗、ダミーデータを使用:', apiError);
          data = RoadmapService.getDummyRoadmap();
        }
        
        setRoadmapData(data);
        setError(null);
      } catch (error) {
        console.error('ロードマップデータ取得エラー:', error);
        setError('データの取得に失敗しました');
        // エラー時もダミーデータを表示
        setRoadmapData(RoadmapService.getDummyRoadmap());
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoadmapData();
  }, []);

  if (isLoading) {
    return (
      <main className="main-content">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 bg-gray-200 rounded-lg p-4 h-32"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="main-content">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
          <p className="text-red-700">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      {/* Content Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">治療ロードマップ詳細</h1>
        <p className="text-base text-gray-600">田中さんの治療の流れと、今必要なことを整理しました</p>
      </div>

      {/* Treatment Journey Map */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6 transition-all duration-250 hover:border-gray-300 hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-deep-blue-100 flex items-center justify-center text-deep-blue-600 text-xl">
            🗺️
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">治療の流れ</h2>
            <p className="text-sm text-gray-600">あなた専用のガイドマップ</p>
          </div>
        </div>
        
        <div className="relative py-6">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>
          <div className="relative z-10">
            {roadmapData.map((step) => (
              <TreatmentStep
                key={step.id}
                step={step}
                onOpenQuestionList={onOpenQuestionList}
                onAddActivity={onAddActivity}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Current Focus */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6 transition-all duration-250 hover:border-gray-300 hover:shadow-md border-l-4 border-l-warm-coral-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-md bg-warm-coral-100 flex items-center justify-center text-warm-coral-600 text-xl">
            🎯
          </div>
          <h2 className="text-lg font-semibold text-gray-900">今、大切なこと</h2>
        </div>

        <div className="bg-warm-coral-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            現在は治療方針を決める段階です。焦らずに、家族とよく相談して決めましょう。
            主治医との相談で聞きたいことを整理しておくと、より良い選択ができます。
          </p>
          
          <ul className="space-y-2">
            {[
              '家族に診断結果を伝える',
              '主治医との相談で聞きたいことをメモする',
              '治療の選択肢について調べる',
              '仕事や家事の調整について考える',
              '経済的な準備について確認する'
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-xs text-gray-700">
                <div className="w-4 h-4 bg-warm-coral-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  ✓
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 transition-all duration-250 hover:border-gray-300 hover:shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-md bg-golden-yellow-100 flex items-center justify-center text-golden-yellow-600 text-xl">
            📋
          </div>
          <h2 className="text-lg font-semibold text-gray-900">次のステップ</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '👨‍👩‍👧‍👦', category: '家族', description: '夫と娘に診断結果を伝え、一緒に治療方針を考えましょう' },
            { icon: '👩‍⚕️', category: '医療', description: '主治医との相談で、手術・化学療法・放射線治療の選択肢を確認' },
            { icon: '💰', category: '経済', description: '治療費用と保険の適用について、詳しく調べておきましょう' },
            { icon: '💼', category: '仕事', description: '職場に治療のことを伝えるタイミングと方法を考えましょう' }
          ].map((item, index) => (
            <div key={index} className="bg-golden-yellow-50 border border-golden-yellow-200 rounded-lg p-4 transition-all duration-150 hover:-translate-y-1 hover:shadow-md hover:border-golden-yellow-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-base">{item.icon}</div>
                <span className="text-xs text-golden-yellow-700 font-semibold uppercase tracking-wider">{item.category}</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

// メインページコンポーネント
export default function RoadmapDetailPage() {
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [editingActivity, setEditingActivity] = useState<any>(null);

  const handleAddActivity = (stepId: number) => {
    setSelectedStepId(stepId);
    setEditingActivity(null);
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (activity: UserActivity) => {
    setSelectedStepId(activity.roadmap_step_id);
    setEditingActivity(activity);
    setIsActivityModalOpen(true);
  };

  const handleActivitySubmit = async (data: any) => {
    try {
      if (editingActivity) {
        // 編集
        console.log('アクティビティ編集:', data);
      } else {
        // 新規作成
        console.log('新規アクティビティ作成:', data);
      }
      setIsActivityModalOpen(false);
    } catch (error) {
      console.error('アクティビティ保存エラー:', error);
    }
  };

  const handleOpenQuestionList = () => {
    setIsQuestionListOpen(true);
  };

  return (
    <>
      <Header />
      <div className="dashboard-inner">
        <Sidebar />
        <MainContent 
          onOpenQuestionList={handleOpenQuestionList}
          onAddActivity={handleAddActivity}
        />
      </div>
      
      {/* フローティングアクションボタン */}
      <div 
        className="fixed right-8 bottom-8 bg-deep-blue-500 text-white rounded-lg shadow-lg cursor-pointer z-50 transition-all duration-250 hover:bg-deep-blue-600 hover:-translate-y-1 hover:shadow-xl flex items-center gap-2 px-4 py-3 text-sm font-medium"
        onClick={() => setIsActivityModalOpen(true)}
      >
        <span className="text-lg font-bold">＋</span>
        <span>アクティビティ追加</span>
      </div>
      
      {/* アクティビティモーダル */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        mode={editingActivity ? 'edit' : 'create'}
        stepId={selectedStepId || undefined}
        activity={editingActivity}
        onSubmit={handleActivitySubmit}
      />
    </>
  );
} 