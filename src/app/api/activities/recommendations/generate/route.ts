import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '@/lib/services/activityService';
import { GenerateRecommendationsRequest } from '@/lib/types/activities';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRecommendationsRequest = await request.json();
    
    // バリデーション
    if (!body.step_id || !body.user_context) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    const service = new ActivityService();
    const recommendations = await service.generateRecommendations(body);
    
    return NextResponse.json({ 
      recommendations,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('おすすめ生成エラー:', error);
    return NextResponse.json(
      { error: 'おすすめの生成に失敗しました' },
      { status: 500 }
    );
  }
} 