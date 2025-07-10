import { TreatmentStepWithProgress, UserRoadmapProgressUpdate } from '@/lib/types/database';

export class RoadmapService {
  /**
   * ユーザーの治療ロードマップを取得
   */
  static async getUserRoadmap(userId: string): Promise<TreatmentStepWithProgress[]> {
    try {
      const response = await fetch('/api/roadmap', {
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
      console.error('Error fetching user roadmap:', error);
      throw error;
    }
  }

  /**
   * 治療段階の進捗を更新
   */
  static async updateStepProgress(
    userId: string,
    stepId: number,
    updates: UserRoadmapProgressUpdate
  ): Promise<any> {
    try {
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId,
          ...updates
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating step progress:', error);
      throw error;
    }
  }

  /**
   * ダミーデータを返す（開発用）
   */
  static getDummyRoadmap(): TreatmentStepWithProgress[] {
    return [
      {
        id: 1,
        title: '診断・検査',
        description: 'がんの種類と進行度を詳しく調べる段階です。',
        status: 'completed',
        details: [
          { icon: '✓', text: '乳がんの診断完了' },
          { icon: '✓', text: '病理検査完了' },
          { icon: '✓', text: 'ステージ判定完了' }
        ]
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
        ]
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
        ]
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
        ]
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
        ]
      }
    ];
  }
} 