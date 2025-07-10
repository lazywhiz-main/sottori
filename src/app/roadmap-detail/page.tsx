'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import QuestionListModal from '@/components/question-list/QuestionListModal';
import { ActivityModal } from '@/components/activities/ActivityModal';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { RecommendationCard } from '@/components/activities/RecommendationCard';
import { useActivityStore } from '@/lib/stores/activityStore';
import { UserActivityInsert, UserActivityUpdate, UserActivity, ActivityRecommendation } from '@/lib/types/personalization';

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

// 治療段階の型定義
type TreatmentStep = {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  details: Array<{
    icon: string;
    text: string;
  }>;
  actions: Array<{
    text: string;
    type: 'primary' | 'secondary';
    href?: string;
  }>;
};

// 治療段階データ
const treatmentSteps: TreatmentStep[] = [
  {
    id: 1,
    title: '診断・検査',
    description: 'がんの種類と進行度を詳しく調べる段階です。',
    status: 'completed',
    details: [
      { icon: '✓', text: '乳がんの診断完了' },
      { icon: '✓', text: '病理検査完了' },
      { icon: '✓', text: 'ステージ判定完了' }
    ],
    actions: []
  },
  {
    id: 2,
    title: '治療方針の決定',
    description: '主治医と相談して、最適な治療法を決める段階です。',
    status: 'current',
    details: [
      { icon: '📅', text: '来週火曜日：主治医との相談' },
      { icon: '💭', text: '家族との相談が必要' },
      { icon: '📋', text: '治療選択肢の整理' }
    ],
    actions: []
  },
  {
    id: 3,
    title: '手術・治療',
    description: '決めた治療法に基づいて、実際の治療を始める段階です。',
    status: 'upcoming',
    details: [
      { icon: '🏥', text: '手術・化学療法・放射線治療' },
      { icon: '📅', text: '治療スケジュールの調整' },
      { icon: '👨‍👩‍👧‍👦', text: '家族のサポート体制' }
    ],
    actions: []
  },
  {
    id: 4,
    title: '術後ケア',
    description: '治療後の体調管理と、再発予防のための定期検査です。',
    status: 'upcoming',
    details: [
      { icon: '💊', text: '薬物療法の継続' },
      { icon: '🏥', text: '定期検査・診察' },
      { icon: '💪', text: 'リハビリ・運動' }
    ],
    actions: []
  },
  {
    id: 5,
    title: 'フォローアップ',
    description: '治療を終えて、元の生活に戻る段階です。',
    status: 'upcoming',
    details: [
      { icon: '💼', text: '仕事への復帰' },
      { icon: '👨‍👩‍👧‍👦', text: '家族との関係調整' },
      { icon: '🌸', text: '新しい生活の構築' }
    ],
    actions: []
  }
];

// 治療段階コンポーネント
const TreatmentStep = ({ step, onOpenQuestionList, onAddActivity }: { 
  step: TreatmentStep, 
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

  // コンポーネントマウント時にアクティビティとお薦めを取得
  useEffect(() => {
    const userId = 'test-user-id'; // 仮のユーザーID
    fetchActivities(userId);
    fetchRecommendations(userId, step.id);
  }, [step.id, fetchActivities, fetchRecommendations]);

  // ステップ別のアクティビティとお薦めをフィルタリング
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

  const handleAcceptRecommendation = (templateId: string) => {
    const userId = 'test-user-id'; // 仮のユーザーID
    addFromRecommendation(templateId, userId, step.id);
  };

  const handleSkipRecommendation = (templateId: string) => {
    // スキップ処理（将来的にはデータベースに記録）
    console.log('スキップ:', templateId);
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
        
        {/* お薦めアクティビティセクション */}
        {stepRecommendations.length > 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-3 mb-3 bg-white/70">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">おすすめ</span>
              <span className="text-sm font-medium text-gray-700">AIお薦めアクティビティ</span>
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
        
        <div className="flex gap-2 flex-wrap">
          {step.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleAction(action)}
              className={`px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 ${
                action.type === 'primary'
                  ? 'bg-deep-blue-500 text-white hover:bg-deep-blue-600 hover:-translate-y-px'
                  : 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              {action.text}
            </button>
          ))}
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
            {treatmentSteps.map((step) => (
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

export default function RoadmapDetailPage() {
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [editingActivity, setEditingActivity] = useState<UserActivity | null>(null);
  const { 
    activities, 
    recommendations, 
    preferences, 
    modalData, 
    isLoading, 
    error,
    fetchActivities, 
    fetchRecommendations, 
    fetchPreferences,
    addActivity, 
    updateActivity, 
    deleteActivity,
    addFromRecommendation,
    openModal, 
    closeModal, 
    setError 
  } = useActivityStore();

  // ユーザーIDを取得（実際の実装では認証から取得）
  const userId = 'test-user-id'; // 仮のユーザーID

  useEffect(() => {
    // 初期データの読み込み
    fetchPreferences(userId);
  }, [fetchPreferences, userId]);

  const handleAddActivity = (stepId: number) => {
    openModal('create', stepId);
  };

  const handleEditActivity = (activity: UserActivity) => {
    openModal('edit', activity.roadmap_step_id, activity);
  };

  const handleActivitySubmit = async (data: UserActivityInsert | UserActivityUpdate) => {
    try {
      if (modalData.mode === 'edit' && modalData.activity) {
        // 編集
        await updateActivity(modalData.activity.id, data as UserActivityUpdate);
      } else if (modalData.mode === 'create' && modalData.step_id) {
        // 新規作成
        await addActivity(data as UserActivityInsert);
      }
      closeModal();
    } catch (error) {
      console.error('アクティビティ操作エラー:', error);
      setError('アクティビティの操作に失敗しました');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteActivity(id);
    } catch (error) {
      console.error('アクティビティ削除エラー:', error);
      setError('アクティビティの削除に失敗しました');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateActivity(id, { status: status as any });
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      setError('ステータスの更新に失敗しました');
    }
  };

  const handleAddFromRecommendation = async (templateId: string) => {
    try {
      if (modalData.step_id) {
        await addFromRecommendation(templateId, userId, modalData.step_id);
      }
    } catch (error) {
      console.error('お薦め追加エラー:', error);
      setError('お薦めからの追加に失敗しました');
    }
  };

  return (
    <>
      <Header />
      <div className="dashboard-inner">
        <Sidebar />
        <MainContent onOpenQuestionList={() => setIsQuestionListOpen(true)} onAddActivity={handleAddActivity} />
      </div>
      
      {/* フローティングアクションボタン */}
      <div 
        className="fixed right-8 bottom-8 bg-deep-blue-500 text-white rounded-lg shadow-lg cursor-pointer z-50 transition-all duration-250 hover:bg-deep-blue-600 hover:-translate-y-1 hover:shadow-xl flex items-center gap-2 px-4 py-3 text-sm font-medium"
        onClick={() => openModal('create')}
      >
        <span className="text-lg font-bold">＋</span>
        <span>アクティビティ追加</span>
      </div>
      
      <QuestionListModal 
        isOpen={isQuestionListOpen} 
        onClose={() => setIsQuestionListOpen(false)} 
      />
      
      {/* アクティビティ追加・編集モーダル */}
      <ActivityModal
        isOpen={modalData.isOpen}
        mode={modalData.mode}
        stepId={modalData.step_id}
        activity={modalData.activity}
        onClose={closeModal}
        onSubmit={handleActivitySubmit}
      />

      {/* エラー表示 */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {error}
        </div>
      )}

      {/* ローディング表示 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">処理中...</p>
          </div>
        </div>
      )}
    </>
  );
} 