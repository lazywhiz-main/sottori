import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { runPersonalizationEngine } from '@/lib/services/personalizationEngine'

export async function GET() {
  try {
    // テスト用ユーザーIDを取得
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (profileError || !profiles || profiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No test user found',
        suggestion: 'Please create a user profile first'
      }, { status: 404 })
    }

    const testUserId = profiles[0].id

    // 個別化プロフィール存在確認
    const { data: medicalProfile, error: medicalError } = await supabase
      .from('user_medical_profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single()

    if (medicalError || !medicalProfile) {
      return NextResponse.json({
        success: false,
        error: 'Test data not found',
        suggestion: 'Please run database_personalization_test_data.sql first',
        userId: testUserId
      }, { status: 404 })
    }

    // 個別化エンジン実行
    console.log('🚀 Running personalization engine for user:', testUserId)
    const result = await runPersonalizationEngine(testUserId)

    // 結果の詳細情報を取得
    const { data: relevanceScores } = await supabase
      .from('info_relevance_scores')
      .select(`
        *,
        info_updates:info_update_id (
          title,
          category,
          priority
        )
      `)
      .eq('user_id', testUserId)
      .order('final_relevance_score', { ascending: false })

    const { data: userSegment } = await supabase
      .from('user_segments')
      .select('*')
      .eq('user_id', testUserId)
      .single()

    return NextResponse.json({
      success: true,
      testUserId: testUserId,
      personalizationResult: result,
      detailResults: {
        relevanceScores: relevanceScores || [],
        userSegment: userSegment || null,
        totalProcessedItems: relevanceScores?.length || 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Personalization test error:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      details: error?.stack || null
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({
        error: 'userId is required'
      }, { status: 400 })
    }

    // 個別化エンジン実行
    const result = await runPersonalizationEngine(userId)
    
    return NextResponse.json({
      success: true,
      userId: userId,
      result: result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Personalization engine error:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error'
    }, { status: 500 })
  }
} 