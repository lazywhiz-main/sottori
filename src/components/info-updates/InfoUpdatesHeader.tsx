'use client'

import { InfoUpdateStats, InfoCollectionProgress } from '@/lib/types/info-updates'
import { Button } from '../ui/Button'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface InfoUpdatesHeaderProps {
  stats: InfoUpdateStats | null
  progress: InfoCollectionProgress[]
  onRefresh: () => void
  onCollectNewInfo?: () => Promise<void>
  isCollecting?: boolean
  lastCollectionTime?: string
  personalizationStatus?: {
    level: 'basic' | 'enhanced' | 'complete'
    dataCompleteness: number
  }
}

export default function InfoUpdatesHeader({ 
  stats, 
  progress, 
  onRefresh,
  onCollectNewInfo,
  isCollecting = false,
  lastCollectionTime,
  personalizationStatus
}: InfoUpdatesHeaderProps) {
  const [isRunningPersonalization, setIsRunningPersonalization] = useState(false)

  const handleCollectInfo = async () => {
    console.log('手動更新ボタンクリック')
    if (onCollectNewInfo) {
      try {
        await onCollectNewInfo()
        console.log('手動更新完了')
      } catch (error) {
        console.error('手動更新エラー:', error)
      }
    } else {
      console.warn('onCollectNewInfo関数が設定されていません')
    }
  }

  const handleRunPersonalization = async () => {
    setIsRunningPersonalization(true)
    try {
      // supabaseから認証セッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        alert('認証が必要です')
        return
      }

      const response = await fetch('/api/personalization/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ user_id: session.user.id })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`個別化エンジン実行完了\n処理件数: ${result.data?.processed_items || 0}件\nユーザーセグメント: ${result.data?.user_segment || '未分類'}`)
        
        // 情報収集も実行
        if (onCollectNewInfo) {
          await onCollectNewInfo()
        }
      } else {
        throw new Error('個別化エンジンの実行に失敗しました')
      }
    } catch (error) {
      console.error('個別化エンジンエラー:', error)
      alert('個別化エンジンの実行中にエラーが発生しました')
    } finally {
      setIsRunningPersonalization(false)
    }
  }

  const getPersonalizationBadge = () => {
    if (!personalizationStatus) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">未設定</span>
    }

    const { level, dataCompleteness } = personalizationStatus
    const colors = {
      basic: 'bg-yellow-100 text-yellow-800',
      enhanced: 'bg-blue-100 text-blue-800', 
      complete: 'bg-green-100 text-green-800'
    }

    const labels = {
      basic: '基本',
      enhanced: '強化',
      complete: '完全'
    }

    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[level]}`}>
        {labels[level]} ({Math.round(dataCompleteness)}%)
      </span>
    )
  }

  const lastUpdated = new Date().toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  const newUpdatesCount = stats?.unread || 0
  const hasTreatmentOptions = (stats?.by_category.treatment_options || 0) > 0
  const hasDoctors = (stats?.by_category.doctors || 0) > 0
  const hasTrials = (stats?.by_category.clinical_trials || 0) > 0

  const getProgressSummary = () => {
    const completedCategories = progress.filter(p => p.status === 'completed')
    const collectingCategories = progress.filter(p => p.status === 'collecting')
    
    return {
      completed: completedCategories.length,
      collecting: collectingCategories.length,
      totalItems: completedCategories.reduce((sum, p) => sum + p.items_found, 0)
    }
  }

  const progressSummary = getProgressSummary()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col space-y-4">
        {/* ヘッダー部分 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">情報アップデート</h1>
            <p className="text-gray-600 mt-1">
              あなたに関連する最新のがん情報をお届けします
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">個別化レベル:</span>
            {getPersonalizationBadge()}
          </div>
        </div>

        {/* 最終更新時刻表示 */}
        {lastCollectionTime && (
          <div className="text-sm text-gray-500">
            最終更新: {new Date(lastCollectionTime).toLocaleString('ja-JP')}
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleCollectInfo}
            disabled={isCollecting}
            className="bg-deep-blue hover:bg-blue-700 text-white px-6 py-2"
          >
            {isCollecting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>収集中...</span>
              </div>
            ) : (
              '情報を手動更新'
            )}
          </Button>

          <Button
            onClick={handleRunPersonalization}
            disabled={isRunningPersonalization || isCollecting}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2"
          >
            {isRunningPersonalization ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>個別化実行中...</span>
              </div>
            ) : (
              '個別化エンジン実行'
            )}
          </Button>

          <Button
            onClick={() => window.location.href = '/profile'}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2"
          >
            プロフィール設定
          </Button>
        </div>

        {/* 個別化説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            💡 個別化システムについて
          </h3>
          <p className="text-sm text-blue-700">
            あなたのがん種、治療段階、関心事に基づいて情報を優先順位付けし、
            最も関連性の高い情報を上位に表示します。
            プロフィール情報が詳細であるほど、より精密な個別化が可能になります。
          </p>
        </div>

        {/* 新情報サマリー */}
        {newUpdatesCount > 0 && (
          <div className="bg-info-50 border border-info-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">📢</div>
              <div>
                <h2 className="text-lg font-semibold text-info-700 mb-2">
                  新しい情報が <span className="text-info-600">{newUpdatesCount}件</span> 準備できました！
                </h2>
                <div className="flex flex-wrap gap-2 text-sm text-info-600">
                  {hasTreatmentOptions && (
                    <span>• 治療選択肢 ({stats?.by_category.treatment_options}件)</span>
                  )}
                  {hasDoctors && (
                    <span>• 専門医情報 ({stats?.by_category.doctors}件)</span>
                  )}
                  {hasTrials && (
                    <span>• 治験情報 ({stats?.by_category.clinical_trials}件)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 進捗インジケーター（オプション） */}
        {progress && progress.length > 0 && (
          <div className="mt-4 pt-4 border-t border-soft-peach-200">
            <h3 className="text-sm font-medium text-deep-blue-700 mb-2">情報収集進捗</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {progress.map((item) => (
                <div key={item.id} className="bg-soft-peach-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-deep-blue-600">{getCategoryLabel(item.category)}</span>
                    <span className="text-xs text-deep-blue-500">{item.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-soft-peach-200 rounded-full h-2">
                    <div 
                      className="bg-info-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ヘルパー関数
function getCategoryLabel(category: string): string {
  const labels = {
    treatment_options: '治療選択肢',
    doctors: '専門医情報',
    side_effects: '副作用・対処法',
    clinical_trials: '治験情報'
  }
  return labels[category as keyof typeof labels] || 'その他'
} 