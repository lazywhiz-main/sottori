import { NextRequest, NextResponse } from 'next/server'
import { RoadmapService } from '../../../../lib/services/roadmapService'

// アクション一覧を取得
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'セクションIDが必要です' },
        { status: 400 }
      )
    }

    // const actions = await RoadmapService.getSectionActions(sectionId)
    // 仮実装: ダミーデータ返却
    const actions: any[] = []

    return NextResponse.json({
      success: true,
      actions
    })

  } catch (error) {
    console.error('Failed to get actions:', error)
    return NextResponse.json(
      { success: false, error: 'アクションの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// アクションの状態を更新
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { actionId, status } = await request.json()

    if (!actionId || !status) {
      return NextResponse.json(
        { success: false, error: 'アクションIDとステータスが必要です' },
        { status: 400 }
      )
    }

    // const success = await RoadmapService.updateActionStatus(actionId, status)
    // 仮実装: 常に成功
    const success = true

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'アクションの状態を更新しました'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'アクションの更新に失敗しました' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Failed to update action:', error)
    return NextResponse.json(
      { success: false, error: 'アクションの更新に失敗しました' },
      { status: 500 }
    )
  }
} 