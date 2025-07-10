'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { getUserState, type UserStateInfo } from '@/lib/utils/userStateHelpers'

interface SimpleDashboardProps {
  userId: string
  userName?: string
}

export default function SimpleDashboard({ userId, userName }: SimpleDashboardProps) {
  const [userState, setUserState] = useState<UserStateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [roadmapInfo, setRoadmapInfo] = useState<any>(null)
  const [infoUpdatesCount, setInfoUpdatesCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const loadUserState = async () => {
      try {
        const state = await getUserState(userId)
        setUserState(state)
        
        // ロードマップ情報を取得
        await loadRoadmapInfo()
        
        // 情報収集状況を取得
        await loadInfoUpdatesStatus()
      } catch (error) {
        console.error('ユーザー状態の取得に失敗しました:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserState()
  }, [userId])

  const loadRoadmapInfo = async () => {
    try {
      const { getRoadmapHistories } = await import('@/lib/utils/dataHistory')
      const roadmaps = await getRoadmapHistories(1)
      if (roadmaps && roadmaps.length > 0) {
        setRoadmapInfo(roadmaps[0])
      }
    } catch (error) {
      console.error('ロードマップ情報の取得に失敗しました:', error)
    }
  }

  const loadInfoUpdatesStatus = async () => {
    try {
      const response = await fetch('/api/info-updates/list')
      if (response.ok) {
        const data = await response.json()
        setInfoUpdatesCount(data.updates?.length || 0)
      }
    } catch (error) {
      console.error('情報収集状況の取得に失敗しました:', error)
    }
  }

  const handleStatusUpdate = () => {
    router.push('/status-update')
  }

  const handleViewRoadmap = () => {
    const roadmapId = localStorage.getItem('current-roadmap-id')
    if (roadmapId) {
      router.push(`/roadmap?mode=view&roadmapId=${roadmapId}`)
    } else {
      router.push('/roadmap?mode=view&findLatest=true')
    }
  }

  const handleViewInfoUpdates = () => {
    router.push('/info-updates')
  }

  const getPreviousSituationSummary = () => {
    if (userState?.lastRoadmapDate) {
      return `前回は${userState.lastRoadmapDate.toLocaleDateString()}にロードマップを作成されましたね。`
    }
    return '前回のセルフチェックから時間が経ちました。'
  }

  const getRoadmapGenerationConditions = () => {
    // ここでは簡略化していますが、実際には保存されたuser_responsesから生成条件を取得
    if (roadmapInfo?.user_responses) {
      const responses = roadmapInfo.user_responses
      return `${responses.step2?.label || 'がん'}・${responses.step3?.label || ''}の方向け`
    }
    return '個人の状況に合わせた内容'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-deep-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!userState) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">状態の取得に失敗しました</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* ウェルカムメッセージ */}
      {userName && (
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            {userName}さん、こんにちは
          </h1>
        </div>
      )}

      {/* 1. チャット風状況確認エリア */}
      <Card 
        variant="elevated" 
        className="border-l-4 border-l-warm-coral-400"
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            {/* 人のイラスト風アイコン */}
            <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-warm-coral-100 to-warm-coral-200 rounded-full flex items-center justify-center">
              <span className="text-xl sm:text-2xl">👩‍⚕️</span>
            </div>
            
            {/* 吹き出し */}
            <div className="flex-1 relative">
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-3 sm:p-4 relative">
                {/* 吹き出しの三角 */}
                <div className="absolute -left-2 top-3 sm:top-4 w-3 h-3 sm:w-4 sm:h-4 bg-gray-50 transform rotate-45"></div>
                
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-base sm:text-lg font-medium text-gray-800 leading-relaxed">
                    調子はいかがですか？
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {getPreviousSituationSummary()}変わったことがあれば、お聞かせください。
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleStatusUpdate}
                      className="w-full sm:w-auto shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                    >
                      💬 状況をお聞かせください
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 治療ロードマップカード */}
      {roadmapInfo && (
        <Card variant="default">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-deep-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">📋</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">治療ロードマップ</h3>
                  <p className="text-xs sm:text-sm text-gray-500">あなた専用のガイド</p>
                </div>
              </div>
              <div className="flex-shrink-0 sm:hidden">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleViewRoadmap}
                  className="text-xs px-3 py-2"
                >
                  表示
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 block">生成日時:</span>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    {new Date(roadmapInfo.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 block">対象条件:</span>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">{getRoadmapGenerationConditions()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                現在の段階と次のステップをご確認いただけます
              </p>
              <div className="hidden sm:block">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleViewRoadmap}
                >
                  詳しく見る
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. 情報収集状況カード */}
      <Card 
        variant="outlined" 
        className="border-golden-yellow-200"
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-golden-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-xl sm:text-2xl">🔍</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">関連情報</h3>
                <p className="text-xs sm:text-sm text-gray-500">今のあなたに関係がありそうな情報</p>
              </div>
            </div>
            <div className="flex-shrink-0 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewInfoUpdates}
                className="border-golden-yellow-400 text-golden-yellow-700 hover:bg-golden-yellow-400 hover:text-white text-xs px-3 py-2"
              >
                詳細
              </Button>
            </div>
          </div>

          <div className="bg-golden-yellow-50 rounded-lg p-3 sm:p-4 mb-4">
            <p className="text-golden-yellow-800 mb-2 text-sm sm:text-base leading-relaxed">
              あなたの状況に合わせて、関連する情報をお探ししています
            </p>
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-golden-yellow-500 rounded-full flex-shrink-0"></div>
                <span className="text-golden-yellow-700">
                  {infoUpdatesCount > 0 ? `${infoUpdatesCount}件の情報をご用意` : '情報を準備中'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              お時間のある時にご確認ください
            </p>
            <div className="hidden sm:block">
              <Button
                variant="outline"
                size="md"
                onClick={handleViewInfoUpdates}
                className="border-golden-yellow-400 text-golden-yellow-700 hover:bg-golden-yellow-400 hover:text-white"
              >
                確認する
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 高度機能へのアクセス */}
      <div className="text-center pt-6 sm:pt-8">
        <details className="group">
          <summary className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 cursor-pointer list-none">
            <span className="border-b border-dotted border-gray-300 group-hover:border-gray-500">
              その他の機能
            </span>
          </summary>
          <div className="mt-3 sm:mt-4 space-y-2">
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <button
                onClick={() => router.push('/my-data')}
                className="text-gray-600 hover:text-deep-blue-600 transition-colors py-2 px-3 sm:py-0 sm:px-0 rounded sm:rounded-none bg-gray-50 sm:bg-transparent text-center"
              >
                マイデータ
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="text-gray-600 hover:text-deep-blue-600 transition-colors py-2 px-3 sm:py-0 sm:px-0 rounded sm:rounded-none bg-gray-50 sm:bg-transparent text-center"
              >
                プロフィール編集
              </button>
            </div>
          </div>
        </details>
      </div>

      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2">デバッグ情報</h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p>状態: {userState.state}</p>
              <p>チェック回数: {userState.checkCount}</p>
              <p>ロードマップ回数: {userState.roadmapCount}</p>
              <p>最終チェック: {userState.lastCheckDate?.toLocaleDateString() || 'なし'}</p>
              <p>最終ロードマップ: {userState.lastRoadmapDate?.toLocaleDateString() || 'なし'}</p>
              <p>情報件数: {infoUpdatesCount}</p>
              <p>ロードマップID: {roadmapInfo?.id || 'なし'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 