import { NextRequest, NextResponse } from 'next/server';
import { activityService } from '../../../../lib/services/activityService';
import { CreateActivityRequest } from '../../../../lib/types/activities';

export async function POST(request: NextRequest) {
  try {
    const body: CreateActivityRequest = await request.json();
    
    // バリデーション
    if (!body.type || !body.content || !body.roadmap_step_id) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    const activity = await activityService.createActivity(body);
    
    return NextResponse.json({ 
      activity,
      success: true 
    });
  } catch (error) {
    console.error('アクティビティ作成エラー:', error);
    return NextResponse.json(
      { error: 'アクティビティの作成に失敗しました' },
      { status: 500 }
    );
  }
} 