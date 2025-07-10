// 個別化プロフィール初期化API
// Phase 1: 基盤構築 - ユーザー登録時の個別化プロフィール作成

import { NextRequest, NextResponse } from 'next/server'
import { initializePersonalizationForUser } from '@/lib/services/personalizationEngine'

export async function POST(request: NextRequest) {
  try {
    // リクエストボディから情報を取得
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // 個別化プロフィール初期化
    const success = await initializePersonalizationForUser(user_id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to initialize personalization profiles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Personalization profiles initialized successfully',
      user_id,
      timestamp: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error('Personalization initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 