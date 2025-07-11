import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAuth } from '../../lib/hooks/useAuth'
import { supabase } from '../../lib/supabase'

interface CollectionProgress {
  concern_type: string
  concern_label: string
  status: 'pending' | 'collecting' | 'ready' | 'completed'
  progress_percentage: number
  last_updated: string
  items_found?: number
}

interface CollectionStatus {
  isCollecting: boolean
  currentStep: string
  overallProgress: number
  message: string
  messageType: 'info' | 'success' | 'error' | 'warning'
}

export default function InfoCollectionStatusArea() {
  const [collectionProgress, setCollectionProgress] = useState<CollectionProgress[]>([])
  const [status, setStatus] = useState<CollectionStatus>({
    isCollecting: false,
    currentStep: '',
    overallProgress: 0,
    message: '',
    messageType: 'info'
  })
  const [lastUpdated, setLastUpdated] = useState<string>('未更新')
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadCollectionProgress()
    }
  }, [user])

  const loadCollectionProgress = async () => {
    if (!user) return

    try {
      // 認証トークンを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        console.log('認証が必要です')
        setDefaultProgress()
        return
      }

      const response = await fetch('/api/info-updates/list?', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch collection status')
      }
      
      const data = await response.json()
      const categoryStats = data.categoryStats || {}
      
      // カテゴリごとの進捗を作成
      const categories = [
        { key: 'treatment_options', label: '治療選択肢', icon: '💊' },
        { key: 'doctor_info', label: '専門医情報', icon: '👨‍⚕️' },
        { key: 'clinical_trials', label: '治験情報', icon: '🔬' },
        { key: 'support_programs', label: 'サポート制度', icon: '🤝' }
      ]

      const progressItems: CollectionProgress[] = categories.map(category => {
        const count = categoryStats[category.key] || 0
        return {
          concern_type: category.key,
          concern_label: category.label,
          status: count > 0 ? 'completed' : 'pending',
          progress_percentage: count > 0 ? 100 : 0,
          last_updated: count > 0 ? '最近更新' : '未更新',
          items_found: count
        }
      })

      setCollectionProgress(progressItems)
      
      // 全体進捗を計算
      const completedCount = progressItems.filter(item => item.status === 'completed').length
      const overallProgress = Math.round((completedCount / progressItems.length) * 100)
      
      // 最終更新時刻を設定
      if (data.lastUpdated) {
        const updateDate = new Date(data.lastUpdated)
        const now = new Date()
        const hoursDiff = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60))
        
        if (hoursDiff < 1) {
          setLastUpdated('1時間以内')
        } else if (hoursDiff < 24) {
          setLastUpdated(`${hoursDiff}時間前`)
        } else {
          setLastUpdated(`${Math.floor(hoursDiff / 24)}日前`)
        }
      }
      
      setStatus(prev => ({ ...prev, overallProgress }))
      
    } catch (error) {
      console.error('Collection status load failed:', error)
      setDefaultProgress()
    }
  }

  const setDefaultProgress = () => {
    // デフォルトの進捗データを設定
    const defaultCategories = [
      { key: 'treatment_options', label: '治療選択肢', icon: '💊' },
      { key: 'doctor_info', label: '専門医情報', icon: '👨‍⚕️' },
      { key: 'clinical_trials', label: '治験情報', icon: '🔬' },
      { key: 'support_programs', label: 'サポート制度', icon: '🤝' }
    ]

    const defaultItems: CollectionProgress[] = defaultCategories.map(category => ({
      concern_type: category.key,
      concern_label: category.label,
      status: 'pending',
      progress_percentage: 0,
      last_updated: '未更新',
      items_found: 0
    }))

    setCollectionProgress(defaultItems)
    setStatus(prev => ({ ...prev, overallProgress: 0 }))
    setLastUpdated('未更新')
  }

  const startInfoCollection = async () => {
    if (!user || status.isCollecting) return

    setStatus({
      isCollecting: true,
      currentStep: '情報収集を開始しています...',
      overallProgress: 0,
      message: '',
      messageType: 'info'
    })

    try {
      const response = await fetch('/api/info-updates/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Request failed: ${response.status}`)
      }

      const result = await response.json()
      
      // 成功メッセージを表示
      setStatus({
        isCollecting: false,
        currentStep: '',
        overallProgress: 100,
        message: `✨ 情報収集完了！新たに${result.totalFound}件の情報を取得しました`,
        messageType: 'success'
      })

      // 進捗データを再読み込み
      await loadCollectionProgress()

      // 5秒後にメッセージをクリア
      setTimeout(() => {
        setStatus(prev => ({ ...prev, message: '', messageType: 'info' }))
      }, 5000)

    } catch (error) {
      console.error('Info collection failed:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'
      
      setStatus({
        isCollecting: false,
        currentStep: '',
        overallProgress: 0,
        message: `❌ 情報収集エラー: ${errorMessage}`,
        messageType: 'error'
      })

      // 10秒後にエラーメッセージをクリア
      setTimeout(() => {
        setStatus(prev => ({ ...prev, message: '', messageType: 'info' }))
      }, 10000)
    }
  }

  const navigateToInfoUpdates = () => {
    window.location.href = '/info-updates'
  }

  const getStatusIcon = (itemStatus: string) => {
    switch (itemStatus) {
      case 'completed': return '✅'
      case 'collecting': return '🔄'
      case 'ready': return '⏳'
      default: return '⏸️'
    }
  }

  const getMessageColor = () => {
    switch (status.messageType) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-golden-yellow-700 bg-golden-yellow-50 border-golden-yellow-200'
      default: return 'text-deep-blue-600 bg-deep-blue-50 border-deep-blue-200'
    }
  }

  const getCategoryIcon = (concernType: string) => {
    switch (concernType) {
      case 'treatment_options': return '💊'
      case 'doctor_info': return '👨‍⚕️'
      case 'clinical_trials': return '🔬'
      case 'support_programs': return '🤝'
      default: return '📋'
    }
  }

  if (!user) {
    return (
      <Card variant="elevated" className="h-full">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">ログインが必要です</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className="h-full">
      <CardHeader>
        <CardTitle className="text-deep-blue-500 flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">📊</span>
            情報収集状況
          </div>
          <span className="text-sm font-normal text-gray-500">
            最終更新: {lastUpdated}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 全体進捗バー */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">全体進捗 {status.overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-deep-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${status.overallProgress}%` }}
            />
          </div>
        </div>

        {/* 進捗表示中のメッセージ */}
        {status.isCollecting && (
          <div className="bg-deep-blue-50 border border-deep-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-deep-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-deep-blue-700">
                {status.currentStep}
              </span>
            </div>
          </div>
        )}

        {/* 完了・エラーメッセージ */}
        {status.message && !status.isCollecting && (
          <div className={`rounded-lg p-3 border ${getMessageColor()}`}>
            <span className="text-sm font-medium">
              {status.message}
            </span>
          </div>
        )}

        {/* カテゴリ別サマリー表示 */}
        <div className="space-y-2">
          {collectionProgress.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-soft-peach-50 rounded-lg border border-soft-peach-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{getCategoryIcon(item.concern_type)}</span>
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {item.concern_label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.status === 'completed' && item.items_found ? 
                      `${item.items_found}件の情報` : '待機中'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getStatusIcon(item.status)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <div className="space-y-2 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={startInfoCollection}
            disabled={status.isCollecting}
            className="w-full"
          >
            {status.isCollecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                情報収集中...
              </>
            ) : (
              '🔄 新しい情報を収集'
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToInfoUpdates}
            className="w-full"
          >
            📋 収集済み情報の確認
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 