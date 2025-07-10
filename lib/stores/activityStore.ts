import { create } from 'zustand';
import { 
  UserActivity, 
  ActivityRecommendation, 
  CreateActivityRequest, 
  UpdateActivityRequest,
  ActivityPriority 
} from '../types/activities';

interface ActivityStore {
  // 状態
  activities: Record<number, UserActivity[]>; // stepId -> activities
  recommendations: Record<number, ActivityRecommendation[]>;
  loading: boolean;
  error: string | null;
  currentStep: number;
  
  // アクション
  fetchActivities: (stepId: number) => Promise<void>;
  fetchRecommendations: (stepId: number) => Promise<void>;
  addActivity: (activity: CreateActivityRequest) => Promise<void>;
  updateActivity: (id: string, updates: UpdateActivityRequest) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  acceptRecommendation: (recommendation: ActivityRecommendation, stepId: number) => Promise<void>;
  skipRecommendation: (id: string) => Promise<void>;
  completeActivity: (id: string) => Promise<void>;
  cancelActivity: (id: string) => Promise<void>;
  updateActivityPriority: (id: string, priority: ActivityPriority) => Promise<void>;
  setCurrentStep: (stepId: number) => void;
  clearError: () => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  // 初期状態
  activities: {},
  recommendations: {},
  loading: false,
  error: null,
  currentStep: 2,

  // アクティビティ取得
  fetchActivities: async (stepId: number) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({
        step_id: stepId.toString(),
        include_recommendations: 'true'
      });
      
      const response = await fetch(`/api/activities/list?${params}`);
      if (!response.ok) {
        throw new Error('アクティビティの取得に失敗しました');
      }
      
      const data = await response.json();
      
      set(state => ({
        activities: {
          ...state.activities,
          [stepId]: data.activities
        },
        recommendations: {
          ...state.recommendations,
          [stepId]: data.recommendations
        },
        currentStep: data.current_step,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'エラーが発生しました',
        loading: false 
      });
    }
  },

  // お薦め取得
  fetchRecommendations: async (stepId: number) => {
    try {
      const response = await fetch('/api/activities/recommendations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step_id: stepId,
          user_context: {
            cancer_type: '乳がん',
            stage: '早期',
            age: 45,
            family_situation: '夫・娘と同居',
            current_activities: [],
            preferences: []
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('お薦めの取得に失敗しました');
      }
      
      const data = await response.json();
      
      set(state => ({
        recommendations: {
          ...state.recommendations,
          [stepId]: data.recommendations
        }
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'エラーが発生しました'
      });
    }
  },

  // アクティビティ追加
  addActivity: async (activity: CreateActivityRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/activities/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity)
      });
      
      if (!response.ok) {
        throw new Error('アクティビティの追加に失敗しました');
      }
      
      const data = await response.json();
      
      // 該当ステップのアクティビティを再取得
      await get().fetchActivities(activity.roadmap_step_id);
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'エラーが発生しました',
        loading: false 
      });
    }
  },

  // アクティビティ更新
  updateActivity: async (id: string, updates: UpdateActivityRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/activities/${id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('アクティビティの更新に失敗しました');
      }
      
      const data = await response.json();
      
      // 該当ステップのアクティビティを再取得
      const stepId = Object.keys(get().activities).find(key => 
        get().activities[parseInt(key)].some(activity => activity.id === id)
      );
      if (stepId) {
        await get().fetchActivities(parseInt(stepId));
      }
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'エラーが発生しました',
        loading: false 
      });
    }
  },

  // アクティビティ削除
  deleteActivity: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/activities/${id}/delete`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('アクティビティの削除に失敗しました');
      }
      
      // 該当ステップのアクティビティを再取得
      const stepId = Object.keys(get().activities).find(key => 
        get().activities[parseInt(key)].some(activity => activity.id === id)
      );
      if (stepId) {
        await get().fetchActivities(parseInt(stepId));
      }
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'エラーが発生しました',
        loading: false 
      });
    }
  },

  // お薦めの受け入れ
  acceptRecommendation: async (recommendation: ActivityRecommendation, stepId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/activities/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: recommendation.type,
          content: recommendation.content,
          description: recommendation.description,
          roadmap_step_id: stepId,
          priority: recommendation.priority,
          tags: recommendation.tags || []
        })
      });
      
      if (!response.ok) {
        throw new Error('お薦めの受け入れに失敗しました');
      }
      
      // 該当ステップのアクティビティとお薦めを再取得
      await get().fetchActivities(stepId);
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'エラーが発生しました',
        loading: false 
      });
    }
  },

  // お薦めのスキップ
  skipRecommendation: async (id: string) => {
    // スキップはローカル状態のみで管理（データベースには保存しない）
    set(state => {
      const newRecommendations = { ...state.recommendations };
      Object.keys(newRecommendations).forEach(stepId => {
        newRecommendations[parseInt(stepId)] = newRecommendations[parseInt(stepId)].filter(
          rec => rec.id !== id
        );
      });
      return { recommendations: newRecommendations };
    });
  },

  // アクティビティ完了
  completeActivity: async (id: string) => {
    await get().updateActivity(id, {
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0]
    });
  },

  // アクティビティキャンセル
  cancelActivity: async (id: string) => {
    await get().updateActivity(id, { status: 'cancelled' });
  },

  // 優先度更新
  updateActivityPriority: async (id: string, priority: ActivityPriority) => {
    await get().updateActivity(id, { priority });
  },

  // 現在のステップ設定
  setCurrentStep: (stepId: number) => {
    set({ currentStep: stepId });
  },

  // エラークリア
  clearError: () => {
    set({ error: null });
  }
})); 