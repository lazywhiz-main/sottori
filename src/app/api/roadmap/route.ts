import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // ユーザー認証チェック（一時的に無効化）
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const userId = 'test-user-id'; // 仮のユーザーID
    
    // 1. 治療段階のマスターデータを取得
    const { data: steps, error: stepsError } = await supabase
      .from('roadmap_steps')
      .select('*')
      .eq('is_active', true)
      .order('order_index');
    
    if (stepsError) {
      console.error('Error fetching roadmap steps:', stepsError);
      return NextResponse.json({ error: 'Failed to fetch roadmap steps' }, { status: 500 });
    }
    
    // 2. 各段階の詳細を取得
    const { data: details, error: detailsError } = await supabase
      .from('roadmap_step_details')
      .select('*')
      .eq('is_active', true)
      .order('order_index');
    
    if (detailsError) {
      console.error('Error fetching step details:', detailsError);
      return NextResponse.json({ error: 'Failed to fetch step details' }, { status: 500 });
    }
    
    // 3. ユーザーの進捗状況を取得
    const { data: progress, error: progressError } = await supabase
      .from('user_roadmap_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (progressError) {
      console.error('Error fetching user progress:', progressError);
      // 進捗データがない場合は空配列として扱う
    }
    
    // 4. データを統合
    const roadmapData = steps?.map(step => {
      const stepDetails = details?.filter(detail => detail.step_id === step.id) || [];
      const userProgress = progress?.find(p => p.step_id === step.id);
      
      return {
        id: step.id,
        title: step.title,
        description: step.description,
        status: userProgress?.status || 'upcoming',
        details: stepDetails.map(detail => ({
          icon: detail.icon,
          text: detail.text
        })),
        progress: userProgress
      };
    }) || [];
    
    return NextResponse.json({
      success: true,
      data: roadmapData
    });
    
  } catch (error) {
    console.error('Roadmap API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // ユーザー認証チェック（一時的に無効化）
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const userId = 'test-user-id'; // 仮のユーザーID
    const { stepId, status, notes } = body;
    
    // 進捗データを更新または作成
    const { data, error } = await supabase
      .from('user_roadmap_progress')
      .upsert({
        user_id: userId,
        step_id: stepId,
        status: status,
        notes: notes,
        started_at: status === 'current' ? new Date().toISOString() : undefined,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating roadmap progress:', error);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Roadmap API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 