// アクティビティ機能のバックエンドサービス
// 既存のデザインを維持しながら、アクティビティ機能を追加

import { supabase } from '../supabase';
import {
  UserActivity,
  ActivityTemplate,
  UserActivityPreferences,
  ActivityRecommendation,
  CreateActivityRequest,
  UpdateActivityRequest,
  GetActivitiesRequest,
  GetActivitiesResponse,
  GenerateRecommendationsRequest,
  UserContext,
  ActivityType,
  ActivityStatus,
  ActivityPriority
} from '../types/activities';

export class ActivityService {
  // ユーザーアクティビティの取得
  async getActivities(request: GetActivitiesRequest): Promise<GetActivitiesResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      let query = supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id);

      // フィルタリング
      if (request.step_id) {
        query = query.eq('roadmap_step_id', request.step_id);
      }
      if (request.type) {
        query = query.eq('type', request.type);
      }
      if (request.status) {
        query = query.eq('status', request.status);
      }

      // ソート（作成日時の降順）
      query = query.order('created_at', { ascending: false });

      // ページネーション
      if (request.limit) {
        query = query.limit(request.limit);
      }
      if (request.offset) {
        query = query.range(request.offset, request.offset + (request.limit || 10) - 1);
      }

      const { data: activities, error, count } = await query;

      if (error) {
        throw error;
      }

      // AIお薦めの取得
      let recommendations: ActivityRecommendation[] = [];
      if (request.include_recommendations && request.step_id) {
        const userContext = await this.getUserContext(user.id);
        recommendations = await this.generateRecommendations({
          step_id: request.step_id,
          user_context: {
            cancer_type: userContext.cancer_type,
            stage: userContext.stage,
            age: userContext.age,
            family_situation: userContext.family_situation,
            current_activities: userContext.current_activities.map((a: UserActivity) => a.id),
            preferences: []
          }
        });
      }

      // 現在のステップを取得
      const { data: roadmap } = await supabase
        .from('user_treatment_roadmaps')
        .select('current_step_id')
        .eq('user_id', user.id)
        .single();

      return {
        activities: activities || [],
        recommendations,
        total_count: count || 0,
        current_step: roadmap?.current_step_id || 2
      };
    } catch (error) {
      console.error('アクティビティ取得エラー:', error);
      throw error;
    }
  }

  // アクティビティの作成
  async createActivity(request: CreateActivityRequest): Promise<UserActivity> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      const { data, error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          roadmap_step_id: request.roadmap_step_id,
          type: request.type,
          content: request.content,
          description: request.description,
          scheduled_date: request.scheduled_date,
          priority: request.priority || 'normal',
          tags: request.tags || [],
          is_ai_recommended: false,
          source: 'user_created'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('アクティビティ作成エラー:', error);
      throw error;
    }
  }

  // アクティビティの更新
  async updateActivity(id: string, request: UpdateActivityRequest): Promise<UserActivity> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      const { data, error } = await supabase
        .from('user_activities')
        .update({
          ...request,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('アクティビティ更新エラー:', error);
      throw error;
    }
  }

  // アクティビティの削除
  async deleteActivity(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      const { error } = await supabase
        .from('user_activities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('アクティビティ削除エラー:', error);
      throw error;
    }
  }

  // AIお薦めの生成
  async generateRecommendations(request: GenerateRecommendationsRequest): Promise<ActivityRecommendation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      // 1. テンプレートベースのお薦めを取得
      const templateRecommendations = await this.getTemplateRecommendations(request.step_id, request.user_context);

      // 2. 既存アクティビティとの重複チェック
      const { data: existingActivities } = await supabase
        .from('user_activities')
        .select('content, type')
        .eq('user_id', user.id)
        .eq('roadmap_step_id', request.step_id);

      const filteredRecommendations = this.filterDuplicates(templateRecommendations, existingActivities || []);

      // 3. ユーザー設定に基づくフィルタリング
      const { data: preferences } = await supabase
        .from('user_activity_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const finalRecommendations = this.applyUserPreferences(filteredRecommendations, preferences);

      return finalRecommendations.slice(0, preferences?.max_recommendations_per_step || 5);
    } catch (error) {
      console.error('お薦め生成エラー:', error);
      throw error;
    }
  }

  // テンプレートベースのお薦め取得
  private async getTemplateRecommendations(stepId: number, userContext: any): Promise<ActivityRecommendation[]> {
    const { data: templates, error } = await supabase
      .from('activity_templates')
      .select('*')
      .eq('roadmap_step_id', stepId)
      .eq('is_ai_recommended', true)
      .order('priority', { ascending: false });

    if (error) {
      throw error;
    }

    return (templates || []).map((template: ActivityTemplate) => ({
      id: `template_${template.id}`,
      type: template.type as ActivityType,
      content: template.content,
      description: template.description,
      priority: this.mapTemplatePriority(template.priority),
      reason: this.generateRecommendationReason(template, userContext),
      confidence_score: 0.8,
      estimated_impact: '治療の進行に重要です',
      template_id: template.id,
      tags: []
    }));
  }

  // 重複チェック
  private filterDuplicates(recommendations: ActivityRecommendation[], existingActivities: any[]): ActivityRecommendation[] {
    return recommendations.filter(recommendation => {
      const isDuplicate = existingActivities.some(activity => 
        activity.content.toLowerCase().includes(recommendation.content.toLowerCase()) ||
        recommendation.content.toLowerCase().includes(activity.content.toLowerCase())
      );
      return !isDuplicate;
    });
  }

  // ユーザー設定の適用
  private applyUserPreferences(recommendations: ActivityRecommendation[], preferences: UserActivityPreferences | null): ActivityRecommendation[] {
    if (!preferences) {
      return recommendations;
    }

    return recommendations.filter(recommendation => {
      // 除外タグのチェック（tagsプロパティが存在しない場合はスキップ）
      if (recommendation.tags && recommendation.tags.length > 0) {
        const hasExcludedTag = recommendation.tags.some((tag: string) => 
          preferences.excluded_tags.includes(tag)
        );
        if (hasExcludedTag) {
          return false;
        }
      }

      // 優先度閾値のチェック
      const priorityOrder = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 };
      const recommendationPriority = priorityOrder[recommendation.priority];
      const thresholdPriority = priorityOrder[preferences.priority_threshold];
      
      return recommendationPriority >= thresholdPriority;
    });
  }

  // テンプレート優先度のマッピング
  private mapTemplatePriority(templatePriority: number): ActivityPriority {
    if (templatePriority >= 9) return 'urgent';
    if (templatePriority >= 7) return 'high';
    if (templatePriority >= 5) return 'normal';
    return 'low';
  }

  // お薦め理由の生成
  private generateRecommendationReason(template: ActivityTemplate, userContext: any): string {
    const reasonTemplates = {
      '診察': {
        'timing': 'この時期の診察は治療方針決定に重要です',
        'symptom': '症状の変化を確認するため',
        'followup': '前回の検査結果について詳しく聞くため'
      },
      '検査': {
        'routine': '定期的な検査で早期発見が可能です',
        'diagnostic': '正確な診断のために必要です',
        'monitoring': '治療効果を確認するため'
      },
      '準備': {
        'logistics': 'スムーズな治療開始のため',
        'financial': '経済的準備を整えるため',
        'emotional': '心理的準備を整えるため'
      },
      '家族相談': {
        'support': '家族のサポート体制を整えるため',
        'decision': '重要な決定を家族と共有するため',
        'communication': '家族とのコミュニケーションを深めるため'
      },
      'メモ': {
        'record': '重要な情報を記録するため',
        'tracking': '体調の変化を追跡するため',
        'planning': '今後の計画を整理するため'
      }
    };

    const typeReasons = reasonTemplates[template.type as keyof typeof reasonTemplates];
    if (!typeReasons) {
      return '治療の進行に重要です';
    }

    // テンプレートの優先度に基づいて理由を選択
    const reasons = Object.values(typeReasons);
    const reasonIndex = Math.min(Math.floor(template.priority / 3), reasons.length - 1);
    
    return reasons[reasonIndex];
  }

  // ユーザーコンテキストの取得
  private async getUserContext(userId: string): Promise<UserContext> {
    const { data: roadmap } = await supabase
      .from('user_treatment_roadmaps')
      .select('user_profile')
      .eq('user_id', userId)
      .single();

    const { data: activities } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId);

    const { data: preferences } = await supabase
      .from('user_activity_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const userProfile = roadmap?.user_profile || {};
    
    return {
      cancer_type: userProfile.cancer_type || '不明',
      stage: userProfile.stage || '不明',
      age: userProfile.age || 0,
      family_situation: userProfile.family_situation || '不明',
      current_activities: activities || [],
      preferences: preferences || {
        id: '',
        user_id: userId,
        show_ai_recommendations: true,
        max_recommendations_per_step: 5,
        preferred_activity_types: [],
        excluded_tags: [],
        priority_threshold: 'normal',
        created_at: '',
        updated_at: ''
      }
    };
  }

  // アクティビティの完了
  async completeActivity(id: string): Promise<UserActivity> {
    return this.updateActivity(id, {
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0]
    });
  }

  // アクティビティのキャンセル
  async cancelActivity(id: string): Promise<UserActivity> {
    return this.updateActivity(id, {
      status: 'cancelled'
    });
  }

  // お薦めの受け入れ
  async acceptRecommendation(recommendation: ActivityRecommendation, stepId: number): Promise<UserActivity> {
    const createRequest: CreateActivityRequest = {
      type: recommendation.type,
      content: recommendation.content,
      description: recommendation.description,
      roadmap_step_id: stepId,
      priority: recommendation.priority,
      tags: recommendation.tags || []
    };

    const activity = await this.createActivity(createRequest);
    
    // AIお薦めフラグを設定
    await this.updateActivity(activity.id, {
      is_ai_recommended: true,
      source: 'ai_recommended'
    } as any);

    return activity;
  }

  // アクティビティ統計の取得
  async getActivityStats(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id);

      if (!activities) {
        return {
          total_activities: 0,
          completed_activities: 0,
          pending_activities: 0,
          activities_by_type: {},
          activities_by_step: {}
        };
      }

      const stats = {
        total_activities: activities.length,
        completed_activities: activities.filter((a: UserActivity) => a.status === 'completed').length,
        pending_activities: activities.filter((a: UserActivity) => a.status === 'planned' || a.status === 'in_progress').length,
        activities_by_type: {} as Record<string, number>,
        activities_by_step: {} as Record<number, number>
      };

      // 種別別統計
      activities.forEach((activity: UserActivity) => {
        stats.activities_by_type[activity.type] = (stats.activities_by_type[activity.type] || 0) + 1;
        stats.activities_by_step[activity.roadmap_step_id] = (stats.activities_by_step[activity.roadmap_step_id] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('統計取得エラー:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const activityService = new ActivityService(); 