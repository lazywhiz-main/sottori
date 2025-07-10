import { NextRequest, NextResponse } from 'next/server'
import { roadmapService } from '@/lib/services/roadmapService'
import { validateAuth } from '@/lib/utils/authHelpers'

export async function GET(request: NextRequest) {
  try {
    // ユーザー認証チェック
    const authResult = await validateAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const { userId } = authResult
    
    // ユーザーの全ロードマップデータを取得
    const roadmapData = await roadmapService.getUserRoadmapData(userId)

    return NextResponse.json({
      success: true,
      data: roadmapData
    })

  } catch (error) {
    console.error('Failed to get roadmap data:', error)
    return NextResponse.json(
      { success: false, error: 'ロードマップデータの取得に失敗しました' },
      { status: 500 }
    )
  }
} 