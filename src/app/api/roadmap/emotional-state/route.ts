import { NextRequest, NextResponse } from 'next/server'
import { roadmapService } from '../../../../lib/services/roadmapService'

// 感情状態を記録
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
    const emotionalData = await request.json()

    if (!emotionalData.emotional_state || !emotionalData.intensity) {
      return NextResponse.json(
        { success: false, error: '感情状態と強度が必要です' },
        { status: 400 }
      )
    }

    // const recordedState = await roadmapService.recordEmotionalState(userId, emotionalData)
    // 仮実装: 受け取ったデータをそのまま返す
    const recordedState = { ...emotionalData, userId }

    if (recordedState) {
      return NextResponse.json({
        success: true,
        emotionalState: recordedState,
        message: '感情状態を記録しました'
      })
    } else {
      return NextResponse.json(
        { success: false, error: '感情状態の記録に失敗しました' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Failed to record emotional state:', error)
    return NextResponse.json(
      { success: false, error: '感情状態の記録に失敗しました' },
      { status: 500 }
    )
  }
}

// 感情状態の傾向を分析
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
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // const emotionalTrend = await roadmapService.analyzeEmotionalTrend(userId, days)
    // 仮実装: 空配列を返す
    const emotionalTrend: any[] = []

    return NextResponse.json({
      success: true,
      emotionalTrend
    })

  } catch (error) {
    console.error('Failed to analyze emotional trend:', error)
    return NextResponse.json(
      { success: false, error: '感情状態の分析に失敗しました' },
      { status: 500 }
    )
  }
} 