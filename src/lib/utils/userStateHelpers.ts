import { supabase } from '@/lib/supabase'

// ユーザーの状態を定義（正しいフロー）
export type UserState = 'first-time' | 'has-roadmap' | 'returning'

// ユーザー状態の詳細情報
export interface UserStateInfo {
  state: UserState
  hasCompletedCheck: boolean
  hasRoadmap: boolean
  lastCheckDate: Date | null
  lastRoadmapDate: Date | null
  daysSinceLastCheck: number | null
  daysSinceLastRoadmap: number | null
  checkCount: number
  roadmapCount: number
  message: string
  action: string
  subActions: string[]
}

// ユーザーの状態を判定する関数
export async function getUserState(userId: string): Promise<UserStateInfo> {
  try {
    // チェック履歴を取得
    const { data: checkHistories, error: checkError } = await supabase
      .from('check_histories')
      .select('completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (checkError) {
      console.error('チェック履歴取得エラー:', checkError)
    }

    // ロードマップ履歴を取得
    const { data: roadmapHistories, error: roadmapError } = await supabase
      .from('roadmap_histories')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (roadmapError) {
      console.error('ロードマップ履歴取得エラー:', roadmapError)
    }

    // 最新のロードマップIDをローカルストレージに保存
    if (roadmapHistories && roadmapHistories.length > 0) {
      const latestRoadmapId = roadmapHistories[0].id.toString()
      localStorage.setItem('current-roadmap-id', latestRoadmapId)
    }

    const hasCompletedCheck = !!(checkHistories && checkHistories.length > 0)
    const hasRoadmap = !!(roadmapHistories && roadmapHistories.length > 0)
    const checkCount = checkHistories?.length || 0
    const roadmapCount = roadmapHistories?.length || 0

    const lastCheckDate = hasCompletedCheck 
      ? new Date(checkHistories[0].completed_at) 
      : null
    const lastRoadmapDate = hasRoadmap 
      ? new Date(roadmapHistories[0].created_at) 
      : null

    const daysSinceLastCheck = lastCheckDate 
      ? Math.floor((Date.now() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24))
      : null
    const daysSinceLastRoadmap = lastRoadmapDate 
      ? Math.floor((Date.now() - lastRoadmapDate.getTime()) / (1000 * 60 * 60 * 24))
      : null

    // 状態判定
    let state: UserState
    let message: string
    let action: string
    let subActions: string[] = []

    if (!hasRoadmap) {
      // 初回ユーザー：ロードマップ未作成
      state = 'first-time'
      message = "こんにちは。Sottoriです。\n\nまずは簡単なセルフチェックから始めませんか？"
      action = "セルフチェックを始める"
      subActions = []
    } else if (daysSinceLastRoadmap !== null && daysSinceLastRoadmap <= 7) {
      // 最近ロードマップを作成済み
      state = 'has-roadmap'
      message = `前回のロードマップから${daysSinceLastRoadmap}日経ちました。\n\n体調や状況に変化はありませんか？`
      action = "ロードマップを見る"
      subActions = ["状況を更新する", "情報を確認する"]
    } else {
      // 継続ユーザー：しばらく経過
      state = 'returning'
      const daysSince = daysSinceLastRoadmap || 0
      if (daysSince <= 30) {
        message = `お久しぶりです。前回から${daysSince}日経ちましたね。\n\n何か変わったことはありますか？`
      } else {
        message = "お久しぶりです。\n\n体調や治療の状況はいかがですか？"
      }
      action = "状況を更新する"
      subActions = ["前回のロードマップを見る", "新しくセルフチェックする"]
    }

    return {
      state,
      hasCompletedCheck,
      hasRoadmap,
      lastCheckDate,
      lastRoadmapDate,
      daysSinceLastCheck,
      daysSinceLastRoadmap,
      checkCount,
      roadmapCount,
      message,
      action,
      subActions
    }
  } catch (error) {
    console.error('ユーザー状態取得エラー:', error)
    
    // エラー時のフォールバック
    return {
      state: 'first-time',
      hasCompletedCheck: false,
      hasRoadmap: false,
      lastCheckDate: null,
      lastRoadmapDate: null,
      daysSinceLastCheck: null,
      daysSinceLastRoadmap: null,
      checkCount: 0,
      roadmapCount: 0,
      message: "こんにちは。Sottoriです。\n\nまずは簡単なセルフチェックから始めませんか？",
      action: "セルフチェックを始める",
      subActions: []
    }
  }
}

// 状態に応じたメッセージ生成
export function getStateMessage(userState: UserStateInfo): string {
  const { state, daysSinceLastRoadmap, roadmapCount } = userState

  switch (state) {
    case 'first-time':
      return "こんにちは。Sottoriです。\n\nまずは簡単なセルフチェックから始めませんか？"

    case 'has-roadmap':
      if (daysSinceLastRoadmap === 0) {
        return "ロードマップが完成しました！\n\nご自身のペースでお読みください。"
      } else if (daysSinceLastRoadmap === 1) {
        return "昨日ロードマップを作成しましたね。\n\n何かご質問はありませんか？"
      } else {
        return `前回のロードマップから${daysSinceLastRoadmap}日経ちました。\n\n体調や状況に変化はありませんか？`
      }

    case 'returning':
      const daysSince = daysSinceLastRoadmap || 0
      if (roadmapCount === 1) {
        return `初回のロードマップから${daysSince}日経ちましたね。\n\n状況に変化があれば、お聞かせください。`
      } else {
        return `お久しぶりです。前回から${daysSince}日経ちました。\n\n何か変わったことはありますか？`
      }

    default:
      return "こんにちは。Sottoriです。"
  }
} 