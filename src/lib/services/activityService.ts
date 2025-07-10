import {
  UserActivity,
  UserActivityInsert,
  UserActivityUpdate,
  ActivityTemplate,
  UserActivityPreference,
  UserActivityPreferenceInsert,
  ActivityRecommendation,
  ActivityType,
  ActivityStatus,
  ActivityPriority
} from '../types/personalization';
import { supabase } from '@/lib/supabase';

export class ActivityService {
  // =============================================================================
  // ユーザーアクティビティ管理
  // =============================================================================

  /**
   * ユーザーのアクティビティ一覧を取得
   */
  static async getUserActivities(userId: string): Promise<UserActivity[]> {
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  }

  /**
   * 特定のステップのアクティビティを取得
   */
  static async getActivitiesByStep(userId: string, stepId: number): Promise<UserActivity[]> {
    try {
      const response = await fetch(`/api/activities?stepId=${stepId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching activities by step:', error);
      throw error;
    }
  }

  /**
   * アクティビティを追加
   */
  static async addActivity(activity: UserActivityInsert): Promise<UserActivity> {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  }

  /**
   * アクティビティを更新
   */
  static async updateActivity(id: string, updates: UserActivityUpdate): Promise<UserActivity> {
    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  /**
   * アクティビティを削除
   */
  static async deleteActivity(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  // =============================================================================
  // アクティビティテンプレート管理
  // =============================================================================

  /**
   * アクティビティテンプレート一覧を取得
   */
  static async getActivityTemplates(): Promise<ActivityTemplate[]> {
    try {
      // テンプレートは静的なデータとして返す
      return [
        {
          id: '1',
          name: '初回診察',
          type: '診察' as ActivityType,
          content: '初回診察を受ける',
          description: 'がんの診断のための初回診察です',
          roadmap_step_id: 1,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 10,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: '血液検査',
          type: '検査' as ActivityType,
          content: '血液検査を受ける',
          description: 'がんの進行度や全身状態を確認する検査です',
          roadmap_step_id: 1,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 9,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'セカンドオピニオン',
          type: '診察' as ActivityType,
          content: 'セカンドオピニオンを受ける',
          description: '別の医師から治療方針について意見を聞く',
          roadmap_step_id: 2,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 10,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error fetching activity templates:', error);
      throw error;
    }
  }

  /**
   * 特定のステップのテンプレートを取得
   */
  static async getTemplatesByStep(stepId: number): Promise<ActivityTemplate[]> {
    try {
      const templates = await this.getActivityTemplates();
      return templates.filter(template => template.roadmap_step_id === stepId);
    } catch (error) {
      console.error('Error fetching templates by step:', error);
      throw error;
    }
  }

  // =============================================================================
  // おすすめアクティビティ生成
  // =============================================================================

  /**
   * ユーザーにおすすめのアクティビティを生成
   */
  static async generateRecommendations(
    userId: string,
    stepId: number,
    userProfile?: any
  ): Promise<ActivityRecommendation[]> {
    try {
      const response = await fetch(`/api/activities/recommendations?stepId=${stepId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * テンプレートの関連度スコアを計算
   */
  private static calculateRelevanceScore(template: ActivityTemplate, userProfile?: any): number {
    let score = template.priority * 10; // ベーススコア

    if (!userProfile) return score;

    // がん種の一致度
    if (userProfile.cancer_type && template.cancer_type.includes(userProfile.cancer_type)) {
      score += 20;
    }

    // ステージの一致度
    if (userProfile.stage && template.stage.includes(userProfile.stage)) {
      score += 15;
    }

    // 年齢層の一致度
    if (userProfile.age_range && template.age_group.includes(userProfile.age_range)) {
      score += 10;
    }

    // 家族状況の一致度
    if (userProfile.family_support && template.family_situation.includes(userProfile.family_support)) {
      score += 10;
    }

    return Math.min(score, 100); // 最大100点
  }

  /**
   * おすすめ理由を生成
   */
  private static generateRecommendationReason(template: ActivityTemplate, userProfile?: any): string {
    const reasons = [];

    if (template.priority >= 8) {
      reasons.push('重要度が高い');
    }

    if (userProfile?.cancer_type && template.cancer_type.includes(userProfile.cancer_type)) {
      reasons.push('あなたのがん種に適している');
    }

    if (userProfile?.stage && template.stage.includes(userProfile.stage)) {
      reasons.push('現在の病期に適している');
    }

    if (reasons.length === 0) {
      reasons.push('一般的におすすめ');
    }

    return reasons.join('、');
  }

  /**
   * テンプレートからアクティビティを追加
   */
  static async addFromTemplate(
    templateId: string,
    userId: string,
    stepId: number
  ): Promise<UserActivity> {
    try {
      // Supabaseのアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch('/api/activities/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ templateId, stepId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error adding from template:', error);
      throw error;
    }
  }

  // =============================================================================
  // ユーザー設定管理
  // =============================================================================

  /**
   * ユーザーのアクティビティ設定を取得
   */
  static async getUserPreferences(userId: string): Promise<UserActivityPreference | null> {
    try {
      // デフォルト設定を返す
      return {
        id: 'default',
        user_id: userId,
        show_ai_recommendations: true,
        max_recommendations_per_step: 5,
        preferred_activity_types: [],
        excluded_tags: [],
        priority_threshold: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  /**
   * ユーザーのアクティビティ設定を作成・更新
   */
  static async upsertUserPreferences(
    userId: string,
    preferences: UserActivityPreferenceInsert
  ): Promise<UserActivityPreference> {
    try {
      // デフォルト設定を返す
      return {
        id: 'default',
        user_id: userId,
        show_ai_recommendations: preferences.show_ai_recommendations ?? true,
        max_recommendations_per_step: preferences.max_recommendations_per_step ?? 5,
        preferred_activity_types: preferences.preferred_activity_types ?? [],
        excluded_tags: preferences.excluded_tags ?? [],
        priority_threshold: preferences.priority_threshold ?? 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error upserting user preferences:', error);
      throw error;
    }
  }

  // =============================================================================
  // 統計・分析
  // =============================================================================

  /**
   * ユーザーのアクティビティ統計を取得
   */
  static async getActivityStats(userId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    planned: number;
    byType: Record<ActivityType, number>;
    byStep: Record<number, number>;
  }> {
    try {
      const activities = await this.getUserActivities(userId);
      
      const stats = {
        total: activities.length,
        completed: activities.filter(a => a.status === 'completed').length,
        inProgress: activities.filter(a => a.status === 'in_progress').length,
        planned: activities.filter(a => a.status === 'planned').length,
        byType: {} as Record<ActivityType, number>,
        byStep: {} as Record<number, number>
      };

      // 種別別統計
      ['診察', '検査', '準備', '家族相談', 'メモ'].forEach(type => {
        stats.byType[type as ActivityType] = activities.filter(a => a.type === type).length;
      });

      // ステップ別統計
      [1, 2, 3, 4, 5].forEach(stepId => {
        stats.byStep[stepId] = activities.filter(a => a.roadmap_step_id === stepId).length;
      });

      return stats;
    } catch (error) {
      console.error('Error getting activity stats:', error);
      throw error;
    }
  }
} 