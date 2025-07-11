import { NextRequest, NextResponse } from 'next/server';

// PUT: アクティビティを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedActivity = {
      id: id,
      user_id: 'test-user-id',
      roadmap_step_id: 1,
      type: '診察',
      content: '更新されたアクティビティ',
      description: '更新された説明',
      scheduled_date: '2024-01-15',
      completed_date: null,
      status: 'planned',
      priority: 'normal',
      is_ai_recommended: false,
      source: 'user_created',
      tags: [],
      created_at: '2024-01-10T10:00:00Z',
      updated_at: new Date().toISOString(),
      ...body
    };
    
    return NextResponse.json({ success: true, data: updatedActivity });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'アクティビティの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: アクティビティを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'アクティビティの削除に失敗しました' },
      { status: 500 }
    );
  }
} 