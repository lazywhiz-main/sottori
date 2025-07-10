import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // 各テーブルのデータ数を確認
    const [
      { count: structuredContentCount },
      { count: rawContentCount },
      { count: relevanceScoresCount },
      { count: userSegmentsCount },
      { count: medicalProfilesCount }
    ] = await Promise.all([
      supabase.from('structured_content_pool').select('*', { count: 'exact', head: true }),
      supabase.from('raw_content_pool').select('*', { count: 'exact', head: true }),
      supabase.from('structured_content_relevance_scores').select('*', { count: 'exact', head: true }),
      supabase.from('user_segments').select('*', { count: 'exact', head: true }),
      supabase.from('user_medical_profiles').select('*', { count: 'exact', head: true })
    ])

    // サンプルデータを取得
    const { data: sampleStructuredContent } = await supabase
      .from('structured_content_pool')
      .select('id, title, category, created_at')
      .limit(3)

    const { data: sampleRawContent } = await supabase
      .from('raw_content_pool')
      .select('id, extracted_title, source_url, collected_at')
      .limit(3)

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          structured_content_pool: structuredContentCount || 0,
          raw_content_pool: rawContentCount || 0,
          structured_content_relevance_scores: relevanceScoresCount || 0,
          user_segments: userSegmentsCount || 0,
          user_medical_profiles: medicalProfilesCount || 0
        },
        samples: {
          structured_content: sampleStructuredContent || [],
          raw_content: sampleRawContent || []
        }
      }
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, testData } = await request.json()

    if (action === 'create-test-user') {
      // テスト用ユーザー作成
      const testUserId = crypto.randomUUID()
      
      // プロフィール作成
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          full_name: 'テストユーザー',
          date_of_birth: '1980-01-01',
          phone: '090-1234-5678',
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create profile',
          details: profileError.message
        }, { status: 500 })
      }

      // 個別化プロフィール初期化
      await supabase.rpc('create_personalization_profiles_for_user', {
        p_user_id: testUserId
      })

      // テストデータ投入
      await setupTestDataForUser(testUserId)

      return NextResponse.json({
        success: true,
        testUserId: testUserId,
        message: 'Test user created successfully with personalization data'
      })
    }

    if (action === 'create-profile-for-existing-user') {
      const { userId } = testData
      
      if (!userId) {
        return NextResponse.json({
          error: 'userId is required'
        }, { status: 400 })
      }

      // 既存ユーザーID用のプロフィール作成
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: 'テストユーザー',
          date_of_birth: '1980-01-01',
          phone: '090-1234-5678',
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create profile',
          details: profileError.message
        }, { status: 500 })
      }

      // 個別化プロフィール初期化
      await supabase.rpc('create_personalization_profiles_for_user', {
        p_user_id: userId
      })

      // テストデータ投入
      await setupTestDataForUser(userId)

      return NextResponse.json({
        success: true,
        testUserId: userId,
        message: 'Profile created for existing user with personalization data'
      })
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function setupTestDataForUser(userId: string) {
  // 医療プロフィール設定
  await supabase
    .from('user_medical_profiles')
    .update({
      cancer_type: 'breast_cancer',
      stage: 'stage_2',
      diagnosis_date: '2024-03-15',
      current_treatment_types: ['chemotherapy', 'hormone_therapy'],
      treatment_status: 'ongoing',
      treatment_start_date: '2024-04-01',
      treatment_history: {
        completed: ['surgery'],
        planned: ['radiation_therapy']
      },
      side_effects_experienced: ['fatigue', 'nausea'],
      primary_doctor: '田中先生',
      hospital: '都立病院',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  // コンテクストプロフィール設定
  await supabase
    .from('user_context_profiles')
    .update({
      age_range: '40-49',
      employment: 'part_time',
      family_support: 'high',
      mobility_limitations: [],
      language_preference: 'japanese',
      technology_comfort: 'medium',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  // 現在の関心事設定
  await supabase
    .from('user_current_concerns')
    .upsert([
      {
        user_id: userId,
        concern_category: 'treatment_side_effects',
        severity_level: 'high',
        description: '化学療法の副作用管理',
        created_at: new Date().toISOString()
      },
      {
        user_id: userId,
        concern_category: 'emotional_support',
        severity_level: 'medium', 
        description: '家族への影響の心配',
        created_at: new Date().toISOString()
      }
    ])
} 