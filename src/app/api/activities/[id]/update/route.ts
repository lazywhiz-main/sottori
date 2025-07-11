import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '@/lib/services/activityService';
import { UpdateActivityRequest } from '@/lib/types/activities';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateActivityRequest = await request.json();
    const service = new ActivityService();
    const activity = await service.updateActivity(id, body);
    
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