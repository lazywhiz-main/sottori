import { NextRequest, NextResponse } from 'next/server'
import { roadmapService } from '@/lib/services/roadmapService'

// セクション一覧を取得
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
    const roadmapId = searchParams.get('roadmapId')

    if (!roadmapId) {
      return NextResponse.json(
        { success: false, error: 'ロードマップIDが必要です' },
        { status: 400 }
      )
    }

    const sections = await roadmapService.getRoadmapSections(roadmapId)

    return NextResponse.json({
      success: true,
      sections
    })

  } catch (error) {
    console.error('Failed to get sections:', error)
    return NextResponse.json(
      { success: false, error: 'セクションの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// セクションの状態を更新
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { sectionId, status } = await request.json()

    if (!sectionId || !status) {
      return NextResponse.json(
        { success: false, error: 'セクションIDとステータスが必要です' },
        { status: 400 }
      )
    }

    const success = await roadmapService.updateSectionStatus(sectionId, status)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'セクションの状態を更新しました'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'セクションの更新に失敗しました' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Failed to update section:', error)
    return NextResponse.json(
      { success: false, error: 'セクションの更新に失敗しました' },
      { status: 500 }
    )
  }
} 