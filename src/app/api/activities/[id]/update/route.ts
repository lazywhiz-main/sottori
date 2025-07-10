import { NextRequest, NextResponse } from 'next/server';
import { activityService } from '../../../../../lib/services/activityService';
import { UpdateActivityRequest } from '../../../../../lib/types/activities';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateActivityRequest = await request.json();
    const activity = await activityService.updateActivity(params.id, body);
    
    return NextResponse.json({ 
      activity,
      success: true 
    });
  } catch (error) {
    console.error('アクティビティ更新エラー:', error);
    return NextResponse.json(
      { error: 'アクティビティの更新に失敗しました' },
      { status: 500 }
    );
  }
} 