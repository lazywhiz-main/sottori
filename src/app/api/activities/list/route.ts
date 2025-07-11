import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '@/lib/services/activityService';

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get('stepId');
    // 必要に応じて他のパラメータも取得

    // アクティビティ取得
    const service = new ActivityService();
    const result = await service.getActivities({
      step_id: stepId ? parseInt(stepId) : undefined,
      include_recommendations: true
    });
    return NextResponse.json({ 
      activities: result.activities, 
      recommendations: result.recommendations,
      success: true 
    });
  } catch (error) {
    console.error('アクティビティ一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'アクティビティ一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
} 