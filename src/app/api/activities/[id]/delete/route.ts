import { NextRequest, NextResponse } from 'next/server';
import { activityService } from '../../../../../lib/services/activityService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await activityService.deleteActivity(params.id);
    
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