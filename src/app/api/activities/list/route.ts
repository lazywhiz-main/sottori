import { NextRequest, NextResponse } from 'next/server';
import { activityService } from '../../../../lib/services/activityService';
import { GetActivitiesRequest } from '../../../../lib/types/activities';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: GetActivitiesRequest = {
      step_id: searchParams.get('step_id') ? parseInt(searchParams.get('step_id')!) : undefined,
      type: searchParams.get('type') as any,
      status: searchParams.get('status') as any,
      include_recommendations: searchParams.get('include_recommendations') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await activityService.getActivities(params);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('アクティビティ取得エラー:', error);
    return NextResponse.json(
      { error: 'アクティビティの取得に失敗しました' },
      { status: 500 }
    );
  }
} 