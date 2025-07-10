'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Header from '@/components/ui/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import InfoUpdatesHeader from '@/components/info-updates/InfoUpdatesHeader'
import { CategoryTabs } from '@/components/info-updates/CategoryTabs'
import { UpdatesList } from '@/components/info-updates/UpdatesList'
import { UpdateDetailModal } from '@/components/info-updates/UpdateDetailModal'
import HierarchicalInfoDisplay from '@/components/info-updates/HierarchicalInfoDisplay'
import { 
  InfoUpdate, 
  InfoCollectionProgress, 
  InfoUpdateStats, 
  InfoUpdateCategory, 
  CategoryTabData,
  InfoUpdatesResponse 
} from '@/lib/types/info-updates'

export default function InfoUpdatesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [updates, setUpdates] = useState<InfoUpdate[]>([])
  const [stats, setStats] = useState<InfoUpdateStats | null>(null)
  const [progress, setProgress] = useState<InfoCollectionProgress[]>([])
  const [selectedCategory, setSelectedCategory] = useState<InfoUpdateCategory | 'all'>('all')
  const [selectedUpdate, setSelectedUpdate] = useState<InfoUpdate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCollecting, setIsCollecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCollectionTime, setLastCollectionTime] = useState<string | null>(null)
  const [personalizationStatus, setPersonalizationStatus] = useState<{
    level: 'basic' | 'enhanced' | 'complete'
    dataCompleteness: number
  } | null>(null)
  const [displayMode, setDisplayMode] = useState<'list' | 'hierarchical'>('hierarchical')

  const sectionRefs = {
    treatment: useRef<HTMLDivElement>(null),
    guidelines: useRef<HTMLDivElement>(null),
    support: useRef<HTMLDivElement>(null),
    sideEffects: useRef<HTMLDivElement>(null),
    clinicalTrials: useRef<HTMLDivElement>(null),
    other: useRef<HTMLDivElement>(null)
  }

  // 認証チェック
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // 個別化状況を取得
  const fetchPersonalizationStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // 各プロフィールテーブルから情報を取得
      const [medicalProfile, contextProfile, preferenceProfile] = await Promise.all([
        supabase.from('user_medical_profiles').select('*').eq('user_id', session.user.id).single(),
        supabase.from('user_context_profiles').select('*').eq('user_id', session.user.id).single(),
        supabase.from('user_preference_profiles').select('*').eq('user_id', session.user.id).single()
      ])

      // データ完全性を計算
      let completeness = 0
      let level: 'basic' | 'enhanced' | 'complete' = 'basic'

      if (medicalProfile.data) {
        completeness += 40
        if (medicalProfile.data.cancer_type && medicalProfile.data.stage) {
          completeness += 20
        }
      }

      if (contextProfile.data) {
        completeness += 20
        if (contextProfile.data.prefecture && contextProfile.data.age_range) {
          completeness += 10
        }
      }

      if (preferenceProfile.data) {
        completeness += 10
        if (preferenceProfile.data.priority_areas?.length > 0) {
          completeness += 10
        }
      }

      if (completeness >= 80) level = 'complete'
      else if (completeness >= 50) level = 'enhanced'

      setPersonalizationStatus({ level, dataCompleteness: completeness })
    } catch (error) {
      console.error('個別化状況取得エラー:', error)
    }
  }

  // 個別化された情報収集（実データのみ・正直な報告）
  const collectNewInfoUpdates = async () => {
    try {
      setIsCollecting(true)
      setError(null)
      
      console.log('手動更新開始: 実データ収集のみ実行')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('認証セッションが見つかりません')
      }
      
      console.log('認証OK、ユーザーID:', session.user.id)
      
      // 個別化された情報収集を実行（実データのみ）
      console.log('API /api/info-updates/collect 呼び出し中...')
      const collectResponse = await fetch('/api/info-updates/collect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('API レスポンス状態:', collectResponse.status)
      
      if (!collectResponse.ok) {
        const errorData = await collectResponse.json()
        console.error('API エラーレスポンス:', errorData)
        throw new Error(errorData.error || '情報収集に失敗しました')
      }
      
      const collectData = await collectResponse.json()
      console.log('情報収集完了:', {
        success: collectData.success,
        total: collectData.stats?.total,
        realData: collectData.stats?.realDataCount,
        errors: collectData.errors
      })
      
      // 正直な結果表示
      if (!collectData.success || (collectData.stats?.total || 0) === 0) {
        const errorMessage = collectData.errors?.length > 0 
          ? collectData.errors.join('\n')
          : '現在、信頼できる情報ソースからデータを取得できません。'
        
        alert(`情報収集結果\n\n❌ データ取得に失敗しました\n\n理由:\n${errorMessage}\n\nしばらく時間をおいて再度お試しください。`)
        setError('データ取得に失敗しました。信頼できる情報ソースから情報を取得できませんでした。')
      } else {
        alert(`情報収集完了！\n\n✅ 信頼できるデータを${collectData.stats?.total || 0}件取得しました\n\n内訳:\n• 実データ: ${collectData.stats?.realDataCount || 0}件\n• 公的機関: ${collectData.stats?.sourceBreakdown?.official || 0}件\n• 医療機関: ${collectData.stats?.sourceBreakdown?.medical || 0}件`)
        setError(null)
      }
      
      // 最終収集時刻を更新
      setLastCollectionTime(new Date().toISOString())
      
      // 収集完了後、リストを再取得
      console.log('リスト再取得中...')
      await fetchInfoUpdates()
      
    } catch (err) {
      console.error('情報収集エラー:', err)
      const errorMessage = err instanceof Error ? err.message : '情報収集中にエラーが発生しました'
      setError(`データ取得エラー: ${errorMessage}`)
      alert(`❌ データ取得に失敗しました\n\n${errorMessage}\n\n現在、システムで問題が発生している可能性があります。\nしばらく時間をおいて再度お試しください。`)
    } finally {
      setIsCollecting(false)
    }
  }

  // データ取得（個別化スコア付き）
  const fetchInfoUpdates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('認証セッションが見つかりません')
      }
      
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      // 個別化された結果を要求（一時的に無効化）
      // params.append('personalized', 'true')
      // params.append('include_relevance', 'true')
      
      const response = await fetch(`/api/info-updates/list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '情報の取得に失敗しました')
      }
      
      const data: InfoUpdatesResponse = await response.json()
      
      // 関連度スコアでソート（高い順）
      const sortedUpdates = data.updates.sort((a, b) => 
        (b.relevance_score || 0) - (a.relevance_score || 0)
      )
      
      setUpdates(sortedUpdates)
      setStats(data.stats)
      setProgress(data.progress)
      
      // 最終更新時刻を取得
      if (data.updates.length > 0) {
        const latest = Math.max(...data.updates.map(u => new Date(u.created_at).getTime()))
        setLastCollectionTime(new Date(latest).toISOString())
      }
      
    } catch (err) {
      console.error('データ取得エラー:', err)
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 既読マーク（エンゲージメント追跡）
  const markAsRead = async (updateId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('認証セッションが見つかりません')
      }
      
      const response = await fetch(`/api/info-updates/read/${updateId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('既読マークの更新に失敗しました')
      }
      
      // 既読状態を更新
      setUpdates(prev => prev.map(update => 
        update.id === updateId 
          ? { ...update, is_read: true }
          : update
      ))
      
    } catch (err) {
      console.error('既読マークエラー:', err)
    }
  }

  // 個人化エンジン実行
  const runPersonalization = async () => {
    try {
      setIsCollecting(true)
      setError(null)
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('認証セッションが見つかりません')
      }

      console.log('個人化エンジンを実行中...')
      
      const response = await fetch('/api/personalization/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: session.user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '個人化エンジンの実行に失敗しました')
      }

      const result = await response.json()
      console.log('個人化エンジン実行結果:', result)

      // 個人化状況を更新
      await fetchPersonalizationStatus()
      
      // 情報更新を再取得（個人化された結果）
      await fetchInfoUpdates()

      alert(`✅ 個人化エンジンが正常に実行されました\n\n処理された項目: ${result.data.processed_items}件\nユーザーセグメント: ${result.data.user_segment}`)

    } catch (err) {
      console.error('個人化エンジン実行エラー:', err)
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました'
      alert(`❌ 個人化エンジンの実行に失敗しました\n\n${errorMessage}`)
    } finally {
      setIsCollecting(false)
    }
  }

  // 初期データ取得
  useEffect(() => {
    fetchInfoUpdates()
    fetchPersonalizationStatus()
  }, [selectedCategory])

  // 個別化状況の表示
  const renderPersonalizationStatus = () => {
    if (!personalizationStatus) return null
    
    const { level, dataCompleteness } = personalizationStatus
    const getStatusColor = () => {
      switch (level) {
        case 'complete': return 'text-success-600'
        case 'enhanced': return 'text-warning-600'
        default: return 'text-gray-600'
      }
    }
    
    const getStatusText = () => {
      switch (level) {
        case 'complete': return '完全個別化'
        case 'enhanced': return '強化個別化'
        default: return '基本個別化'
      }
    }
    
    return (
      <Card variant="outlined" className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-deep-blue-800">個別化状況</h3>
              <p className={`text-lg font-bold ${getStatusColor()}`}>
                {getStatusText()} ({dataCompleteness}%)
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-deep-blue-600">
                データ完全性: {dataCompleteness}%
              </p>
              <p className="text-xs text-deep-blue-600">
                関連度スコア: 有効
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 目次用カテゴリ件数取得
  const getCategoryCounts = () => {
    if (!stats) return []
    return [
      { key: 'treatment', label: '治療法', count: stats.by_category.treatment_options },
      { key: 'guidelines', label: 'ガイドライン', count: stats.by_category.guidelines },
      { key: 'support', label: 'サポート', count: stats.by_category.support_resources },
      { key: 'sideEffects', label: '副作用・対処法', count: stats.by_category.side_effects },
      { key: 'clinicalTrials', label: '治験情報', count: stats.by_category.clinical_trials },
      { key: 'other', label: 'その他', count: stats.total - (
        stats.by_category.treatment_options +
        stats.by_category.guidelines +
        stats.by_category.support_resources +
        stats.by_category.side_effects +
        stats.by_category.clinical_trials
      ) }
    ]
  }

  // 目次クリック時に該当セクションへスクロール
  const handleScrollToSection = (key: keyof typeof sectionRefs) => {
    sectionRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            読み込み中...
          </h3>
          <p className="text-gray-600">
            最新の医療情報を取得しています
          </p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-error-700 mb-2">
            エラーが発生しました
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" onClick={() => fetchInfoUpdates()}>
            再試行
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">最新の医療・サポート情報</h1>
          <p className="text-gray-600 mt-1">
            あなたに最適化された医療情報をお届けします
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={runPersonalization}
            disabled={isCollecting}
          >
            {isCollecting ? '実行中...' : '個人化実行'}
          </Button>
          <Button
            variant="primary"
            onClick={collectNewInfoUpdates}
            disabled={isCollecting}
          >
            {isCollecting ? '収集中...' : '最新情報を取得'}
          </Button>
        </div>
      </div>

      {/* 目次 */}
      <nav className="flex flex-wrap gap-3 mb-8">
        {getCategoryCounts().map(cat => (
          <button
            key={cat.key}
            className="px-4 py-2 rounded-lg bg-soft-peach-100 text-deep-blue-700 font-medium shadow-sm hover:bg-soft-peach-200 transition-colors"
            onClick={() => handleScrollToSection(cat.key as keyof typeof sectionRefs)}
            type="button"
          >
            {cat.label} <span className="ml-1 text-xs bg-white text-deep-blue-500 rounded-full px-2 py-0.5">{cat.count}</span>
          </button>
        ))}
      </nav>

      {/* 個別化状況表示 */}
      {renderPersonalizationStatus()}

      {/* 階層化表示（各セクションにrefを渡す） */}
      <HierarchicalInfoDisplay updates={updates} sectionRefs={sectionRefs} />
    </div>
  )
}