import { NextRequest, NextResponse } from 'next/server'
import { roadmapService } from '@/lib/services/roadmapService'

// 進捗を記録
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const userId = authHeader.replace('Bearer ', '')
    const progressData = await request.json()

    if (!progressData.progress_type) {
      return NextResponse.json(
        { success: false, error: '進捗タイプが必要です' },
        { status: 400 }
      )
    }

    const recordedProgress = await roadmapService.recordProgress(userId, progressData)

    if (recordedProgress) {
      return NextResponse.json({
        success: true,
        progress: recordedProgress,
        message: '進捗を記録しました'
      })
    } else {
      return NextResponse.json(
        { success: false, error: '進捗の記録に失敗しました' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Failed to record progress:', error)
    return NextResponse.json(
      { success: false, error: '進捗の記録に失敗しました' },
      { status: 500 }
    )
  }
}

// ロードマップの進捗を取得
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const userId = authHeader.replace('Bearer ', '')
    const progress = await roadmapService.calculateRoadmapProgress(userId)

    return NextResponse.json({
      success: true,
      progress
    })

  } catch (error) {
    console.error('Failed to get progress:', error)
    return NextResponse.json(
      { success: false, error: '進捗の取得に失敗しました' },
      { status: 500 }
    )
  }
} 