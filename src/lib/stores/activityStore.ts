import { create } from 'zustand';
import { ActivityService } from '../services/activityService';
import {
  UserActivity,
  UserActivityInsert,
  UserActivityUpdate,
  ActivityRecommendation,
  UserActivityPreference,
  ActivityModalData
} from '../types/personalization';

interface ActivityStore {
  // 状態
  activities: UserActivity[];
  recommendations: Record<number, ActivityRecommendation[]>;
  preferences: UserActivityPreference | null;
  modalData: ActivityModalData;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  fetchActivities: (userId: string) => Promise<void>;
  fetchRecommendations: (userId: string, stepId: number) => Promise<void>;
  fetchPreferences: (userId: string) => Promise<void>;
  addActivity: (activity: UserActivityInsert) => Promise<void>;
  updateActivity: (id: string, updates: UserActivityUpdate) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  addFromRecommendation: (templateId: string, userId: string, stepId: number) => Promise<void>;
  openModal: (mode: 'create' | 'edit', stepId?: number, activity?: UserActivity) => void;
  closeModal: () => void;
  setError: (error: string | null) => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  // 初期状態
  activities: [],
  recommendations: {},
  preferences: null,
  modalData: {
    isOpen: false,
    mode: 'create'
  },
  isLoading: false,
  error: null,

  // アクティビティ一覧を取得
  fetchActivities: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const activities = await ActivityService.getUserActivities(userId);
      set({ activities, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'アクティビティの取得に失敗しました',
        isLoading: false 
      });
    }
  },

  // お薦めアクティビティを取得
  fetchRecommendations: async (userId: string, stepId: number) => {
    set({ isLoading: true, error: null });
    try {
      const recommendations = await ActivityService.generateRecommendations(userId, stepId);
      set(state => ({
        recommendations: {
          ...state.recommendations,
          [stepId]: recommendations
        },
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'お薦めの取得に失敗しました',
        isLoading: false 
      });
    }
  },

  // ユーザー設定を取得
  fetchPreferences: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const preferences = await ActivityService.getUserPreferences(userId);
      set({ preferences, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '設定の取得に失敗しました',
        isLoading: false 
      });
    }
  },

  // アクティビティを追加
  addActivity: async (activity: UserActivityInsert) => {
    set({ isLoading: true, error: null });
    try {
      const newActivity = await ActivityService.addActivity(activity);
      set(state => ({
        activities: [newActivity, ...state.activities],
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'アクティビティの追加に失敗しました',
        isLoading: false 
      });
    }
  },

  // アクティビティを更新
  updateActivity: async (id: string, updates: UserActivityUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const updatedActivity = await ActivityService.updateActivity(id, updates);
      set(state => ({
        activities: state.activities.map(activity => 
          activity.id === id ? updatedActivity : activity
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'アクティビティの更新に失敗しました',
        isLoading: false 
      });
    }
  },

  // アクティビティを削除
  deleteActivity: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await ActivityService.deleteActivity(id);
      set(state => ({
        activities: state.activities.filter(activity => activity.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'アクティビティの削除に失敗しました',
        isLoading: false 
      });
    }
  },

  // お薦めからアクティビティを追加
  addFromRecommendation: async (templateId: string, userId: string, stepId: number) => {
    set({ isLoading: true, error: null });
    try {
      const newActivity = await ActivityService.addFromTemplate(templateId, userId, stepId);
      set(state => ({
        activities: [newActivity, ...state.activities],
        recommendations: state.recommendations.map(rec => 
          rec.template.id === templateId 
            ? { ...rec, is_already_added: true }
            : rec
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'お薦めからの追加に失敗しました',
        isLoading: false 
      });
    }
  },

  // モーダルを開く
  openModal: (mode: 'create' | 'edit', stepId?: number, activity?: UserActivity) => {
    set({
      modalData: {
        isOpen: true,
        mode,
        step_id: stepId,
        activity
      }
    });
  },

  // モーダルを閉じる
  closeModal: () => {
    set({
      modalData: {
        isOpen: false,
        mode: 'create'
      }
    });
  },

  // エラーを設定
  setError: (error: string | null) => {
    set({ error });
  }
})); 