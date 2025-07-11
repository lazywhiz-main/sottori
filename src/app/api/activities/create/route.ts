import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '@/lib/services/activityService';
import { CreateActivityRequest } from '@/lib/types/activities';

export async function POST(request: NextRequest) {
  try {
    const body: CreateActivityRequest = await request.json();
    const service = new ActivityService();
    const activity = await service.createActivity(body);
    return NextResponse.json({ activity, success: true });
  } catch (error) {
    console.error('アクティビティ作成エラー:', error);
    return NextResponse.json(
      { error: 'アクティビティの作成に失敗しました' },
      { status: 500 }
    );
  }
} 