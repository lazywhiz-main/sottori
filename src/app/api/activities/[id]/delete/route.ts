import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '@/lib/services/activityService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = new ActivityService();
    await service.deleteActivity(id);
    
    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('アクティビティ削除エラー:', error);
    return NextResponse.json(
      { error: 'アクティビティの削除に失敗しました' },
      { status: 500 }
    );
  }
} 