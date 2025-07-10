import { NextRequest, NextResponse } from 'next/server';
import { activityService } from '../../../../../lib/services/activityService';
import { GenerateRecommendationsRequest } from '../../../../../lib/types/activities';

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

    const recommendations = await activityService.generateRecommendations(body);
    
    return NextResponse.json({ 
      recommendations,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('お薦め生成エラー:', error);
    return NextResponse.json(
      { error: 'お薦めの生成に失敗しました' },
      { status: 500 }
    );
  }
} 