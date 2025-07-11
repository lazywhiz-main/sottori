import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '@/lib/services/activityService';

// GET: ユーザーのアクティビティ一覧を取得
export async function GET(request: NextRequest) {
  try {
    // 一時的に認証を無効にしてテスト用データを返す
    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get('stepId');

    // テスト用のダミーデータ
    const dummyActivities = [
      {
        id: '1',
        user_id: 'test-user-id',
        roadmap_step_id: 1,
        type: '診察',
        content: '初回診察を受ける',
        description: 'がんの診断のための初回診察です',
        scheduled_date: '2024-01-15',
        completed_date: null,
        status: 'completed',
        priority: 'high',
        is_ai_recommended: false,
        source: 'user_created',
        tags: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z'
      },
      {
        id: '2',
        user_id: 'test-user-id',
        roadmap_step_id: 2,
        type: '準備',
        content: '家族との相談',
        description: '治療方針について家族と話し合う',
        scheduled_date: '2024-01-20',
        completed_date: null,
        status: 'planned',
        priority: 'normal',
        is_ai_recommended: true,
        source: 'ai_recommended',
        tags: [],
        created_at: '2024-01-12T14:30:00Z',
        updated_at: '2024-01-12T14:30:00Z'
      }
    ];

    let activities = dummyActivities;
    if (stepId) {
      activities = dummyActivities.filter(activity => activity.roadmap_step_id === parseInt(stepId));
    }

    return NextResponse.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'アクティビティの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 新しいアクティビティを追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const activityData = {
      ...body,
      user_id: 'test-user-id',
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: activityData });
  } catch (error) {
    console.error('Error adding activity:', error);
    return NextResponse.json(
      { error: 'アクティビティの追加に失敗しました' },
      { status: 500 }
    );
  }
} 