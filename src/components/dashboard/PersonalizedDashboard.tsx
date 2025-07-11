'use client'

// 個別化ダッシュボード
// Phase 1: 基盤構築 - 個別化エンジンとの統合

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { getUserState, type UserStateInfo } from '../../lib/utils/userStateHelpers'
import type { UnifiedUserProfile, UserSegment, InfoUpdate, PersonalizationApiResponse } from '../../lib/types/personalization'
import { useAuth } from '../../lib/hooks/useAuth'

interface PersonalizedDashboardProps {
  userId: string
  userName?: string
}

interface PersonalizationStatus {
  isInitialized: boolean
  lastRun: string | null
  nextRun: string | null
  preferences: any
}

interface PersonalizedUpdate {
  id: string
  title: string
  content: string
  category: string
  priority: 'high' | 'medium' | 'low'
  relevance_score: number
  created_at: string
  personalization_reasons: string[]
}

export default function PersonalizedDashboard({ userId, userName }: PersonalizedDashboardProps) {
  const { user, loading: authLoading } = useAuth()
  const [userState, setUserState] = useState<UserStateInfo | null>(null)
  const [personalizationStatus, setPersonalizationStatus] = useState<PersonalizationStatus | null>(null)
  const [prioritizedUpdates, setPrioritizedUpdates] = useState<{
    immediate: InfoUpdate[]
    upcoming: InfoUpdate[]
    background: InfoUpdate[]
  }>({
    immediate: [],
    upcoming: [],
    background: []
  })
  const [loading, setLoading] = useState(true)
  const [personalizationLoading, setPersonalizationLoading] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // 既存のユーザー状態を読み込み
      const state = await getUserState(userId)
      setUserState(state)

      // 個別化状況を確認
      await loadPersonalizationStatus()

      // 個別化された情報更新を取得
      await loadPersonalizedUpdates()

    } catch (error) {
      console.error('Dashboard data loading failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPersonalizationStatus = async () => {
    try {
      const { data: { session } } = await (window as any).supabase.auth.getSession()
      
      if (!session) {
        setAuthRequired(true)
        return
      }

      const response = await fetch('/api/personalization/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ user_id: userId })
      })

      if (response.ok) {
        const data = await response.json()
        setPersonalizationStatus(data)
      }
    } catch (error) {
      console.error('Failed to load personalization status:', error)
    }
  }

  const loadPersonalizedUpdates = async () => {
    try {
      const { data: { session } } = await (window as any).supabase.auth.getSession()
      
      if (!session) {
        setAuthRequired(true)
        return
      }

      const response = await fetch('/api/info-updates/list?personalized=true', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const updates = data.updates || []
        
        // 関連度スコアに基づいて優先順位付け
        const prioritized = prioritizeUpdates(updates)
        setPrioritizedUpdates(prioritized)
      } else if (response.status === 401) {
        // 認証エラーの場合、認証が必要であることを明示
        setAuthRequired(true)
      } else {
        console.error('Failed to load personalized updates')
      }
    } catch (error) {
      console.error('Failed to load personalized updates:', error)
      // ネットワークエラーの場合も認証が必要であることを示す
      setAuthRequired(true)
    }
  }

  const prioritizeUpdates = (updates: InfoUpdate[]) => {
    const sorted = updates.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    
    return {
      immediate: sorted.filter(u => (u.relevance_score || 0) >= 80).slice(0, 3),
      upcoming: sorted.filter(u => (u.relevance_score || 0) >= 60 && (u.relevance_score || 0) < 80).slice(0, 3),
      background: sorted.filter(u => (u.relevance_score || 0) < 60).slice(0, 3)
    }
  }

  const generateSamplePersonalizedUpdates = (segment: UserSegment | null): {
    immediate: InfoUpdate[]
    upcoming: InfoUpdate[]
    background: InfoUpdate[]
  } => {
    if (segment === 'newly_diagnosed') {
      return {
        immediate: [
          {
            id: 'sample-1',
            user_id: userId,
            title: '初回診断後の治療選択肢について',
            summary: 'がん診断を受けた後の一般的な治療選択肢と、セカンドオピニオンの重要性について説明します。',
            category: 'treatment_options',
            created_at: new Date().toISOString(),
            source_url: '#',
            relevance_score: 95,
            content: '診断直後の治療選択...',
            priority: 'high',
            is_read: false,
            is_saved: false,
            metadata: { source_name: '厚生労働省がん情報サービス', tags: ['治療選択', '初期対応'] }
          },
          {
            id: 'sample-2',
            user_id: userId,
            title: 'がん専門医の見つけ方',
            summary: 'お住まいの地域でがん専門医を見つける方法と、病院選びのポイントをご紹介します。',
            category: 'doctors',
            created_at: new Date().toISOString(),
            source_url: '#',
            relevance_score: 90,
            content: '専門医選びのポイント...',
            priority: 'high',
            is_read: false,
            is_saved: false,
            metadata: { source_name: '国立がん研究センター', tags: ['専門医', '病院選び'] }
          }
        ],
        upcoming: [
          {
            id: 'sample-3',
            user_id: userId,
            title: '治療中の副作用対策',
            summary: '治療開始前に知っておくべき副作用とその対処法について詳しく解説します。',
            category: 'side_effects',
            created_at: new Date().toISOString(),
            source_url: '#',
            relevance_score: 75,
            content: '副作用対策の基本...',
            priority: 'medium',
            is_read: false,
            is_saved: false,
            metadata: { source_name: 'がん情報サービス', tags: ['副作用', '対策'] }
          }
        ],
        background: [
          {
            id: 'sample-4',
            user_id: userId,
            title: '患者会・サポートグループ情報',
            summary: '同じ経験を持つ患者さんとの交流や情報交換ができるサポートグループをご紹介。',
            category: 'treatment_options', // support_resourcesがInfoUpdateCategoryに含まれていないためtreatment_optionsに変更
            created_at: new Date().toISOString(),
            source_url: '#',
            relevance_score: 60,
            content: 'サポートグループの活用...',
            priority: 'low',
            is_read: false,
            is_saved: false,
            metadata: { source_name: 'がん患者会ネットワーク', tags: ['患者会', 'サポート'] }
          }
        ]
      }
    }

    // デフォルトのサンプルデータ
    return {
      immediate: [
        {
          id: 'default-1',
          user_id: userId,
          title: '最新のがん治療情報',
          summary: '最新の治療法とその効果について',
          category: 'treatment_options',
          created_at: new Date().toISOString(),
          source_url: '#',
          relevance_score: 80,
          content: '最新治療法について...',
          priority: 'medium',
          is_read: false,
          is_saved: false,
          metadata: { source_name: 'がん情報サービス', tags: ['治療法'] }
        }
      ],
      upcoming: [],
      background: []
    }
  }

  const runPersonalizationEngine = async () => {
    setPersonalizationLoading(true)
    try {
      const { data: { session } } = await (window as any).supabase.auth.getSession()
      
      if (!session) {
        setAuthRequired(true)
        setPersonalizationLoading(false)
        return
      }

      const response = await fetch('/api/personalization/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ user_id: userId })
      })

      if (response.ok) {
        await loadPersonalizationStatus()
        await loadPersonalizedUpdates()
      }
    } catch (error) {
      console.error('Failed to run personalization engine:', error)
    } finally {
      setPersonalizationLoading(false)
    }
  }

  const getSegmentDisplayName = (segment: UserSegment | null): string => {
    const segmentNames: Record<UserSegment, string> = {
      newly_diagnosed: '新規診断',
      active_treatment: '治療中',
      post_treatment: '治療後',
      long_term_survivor: '長期サバイバー',
      recurrence: '再発',
      palliative: '緩和ケア',
      caregiver: '介護者'
    }
    return segment ? segmentNames[segment] : '未分類'
  }

  const getPersonalizedWelcomeMessage = () => {
    if (!personalizationStatus) {
      return `${userName}さん、こんにちは`
    }

    const segmentMessages: Record<UserSegment, string> = {
      newly_diagnosed: `${userName}さん、体調はいかがですか？`,
      active_treatment: `${userName}さん、治療お疲れさまです`,
      post_treatment: `${userName}さん、調子はいかがですか？`,
      long_term_survivor: `${userName}さん、いつもお疲れさまです`,
      recurrence: `${userName}さん、無理をせずに過ごしてください`,
      palliative: `${userName}さん、今日も穏やかに過ごせますように`,
      caregiver: `${userName}さん、いつもお疲れさまです`
    }

    return segmentMessages['newly_diagnosed'] || `${userName}さん、こんにちは`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-warm-coral-100 text-warm-coral-700 border-warm-coral-200'
      case 'medium': return 'bg-golden-yellow-100 text-golden-yellow-700 border-golden-yellow-200'
      case 'low': return 'bg-sage-green-100 text-sage-green-700 border-sage-green-200'
      default: return 'bg-soft-peach-100 text-deep-blue-700 border-soft-peach-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'treatment': return '🌸'
      case 'research': return '🔬'
      case 'wellness': return '🌿'
      case 'support': return '💝'
      default: return '📋'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="sottori-gradient-background min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-white/50 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-white/50 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="sottori-gradient-background min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto p-8 text-center bg-white/80 backdrop-blur-sm border-deep-blue-200">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-deep-blue-800 mb-4">ログインが必要です</h2>
          <p className="text-deep-blue-600 mb-6">
            個別化されたダッシュボードを表示するには、ログインしてください。
          </p>
          <a
            href="/auth"
            className="inline-flex items-center px-6 py-3 bg-deep-blue-500 text-white rounded-lg hover:bg-deep-blue-600 transition-colors font-medium"
          >
            ログインページへ
          </a>
        </Card>
      </div>
    )
  }

  return (
    <div className="sottori-gradient-background min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ウェルカムエリア */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-soft-peach-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-5xl floating-gentle">💝</div>
                <div>
                  <h1 className="text-3xl font-bold text-deep-blue-800 mb-2">
                    {getPersonalizedWelcomeMessage()}
                  </h1>
                  <p className="text-deep-blue-600">
                    あなただけの個別化された情報をお届けします
                  </p>
                </div>
              </div>
              <div className="hidden md:flex space-x-2">
                <div className="px-4 py-2 bg-sage-green-100 text-sage-green-700 rounded-full text-sm font-medium border border-sage-green-200">
                  ✓ 個別化済み
                </div>
                <div className="px-4 py-2 bg-lavender-100 text-lavender-700 rounded-full text-sm font-medium border border-lavender-200">
                  🎯 最適化中
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 優先情報エリア */}
        {prioritizedUpdates.immediate.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-deep-blue-800 mb-6 flex items-center">
              <span className="text-2xl mr-3">⭐</span>
              あなたへの優先情報
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {prioritizedUpdates.immediate.slice(0, 4).map((update, index) => (
                <Card key={update.id} className={`p-6 hover:shadow-lg transition-all duration-300 border-l-4 ${
                  index === 0 ? 'border-l-warm-coral-400 bg-warm-coral-50/50' :
                  index === 1 ? 'border-l-golden-yellow-400 bg-golden-yellow-50/50' :
                  index === 2 ? 'border-l-sage-green-400 bg-sage-green-50/50' :
                  'border-l-lavender-400 bg-lavender-50/50'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryIcon(update.category)}</span>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(update.priority)}`}>
                          {update.priority === 'high' ? '重要' : update.priority === 'medium' ? '中程度' : '参考'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white text-deep-blue-700 border border-deep-blue-200">
                          関連度 {Math.round(update.relevance_score * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-deep-blue-700 bg-white rounded-full w-8 h-8 flex items-center justify-center border border-deep-blue-200">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-deep-blue-800 mb-3 line-clamp-2">
                    {update.title}
                  </h3>
                  <p className="text-deep-blue-600 mb-4 line-clamp-3">
                    {update.summary}
                  </p>
                  {/* personalization_reasonsの表示部分を削除 */}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* メインアクションエリア */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-deep-blue-800 mb-6 flex items-center">
            <span className="text-2xl mr-3">🎯</span>
            おすすめのアクション
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-warm-coral-50 to-warm-coral-100 border-warm-coral-200 hover:shadow-lg transition-all duration-300 gentle-hover">
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-3xl">📊</div>
                <div>
                  <h3 className="text-xl font-semibold text-warm-coral-800">詳細な健康記録</h3>
                  <p className="text-warm-coral-600">より良い個別化のために</p>
                </div>
              </div>
              <p className="text-warm-coral-700 mb-4">
                症状や治療の詳細を記録することで、より精度の高い個別化情報をお届けできます。
              </p>
              <button
                onClick={() => router.push('/health-record')}
                className="w-full bg-warm-coral-500 text-white py-3 rounded-lg hover:bg-warm-coral-600 transition-colors font-medium"
              >
                記録を更新する
              </button>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-sage-green-50 to-sage-green-100 border-sage-green-200 hover:shadow-lg transition-all duration-300 gentle-hover">
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-3xl">🌿</div>
                <div>
                  <h3 className="text-xl font-semibold text-sage-green-800">ゆっくりチェック</h3>
                  <p className="text-sage-green-600">今日の調子を確認</p>
                </div>
              </div>
              <p className="text-sage-green-700 mb-4">
                定期的なセルフチェックで、あなたの状態に合わせた情報をお届けします。
              </p>
              <button
                onClick={() => router.push('/self-check')}
                className="w-full bg-sage-green-500 text-white py-3 rounded-lg hover:bg-sage-green-600 transition-colors font-medium"
              >
                チェックを開始
              </button>
            </Card>
          </div>
        </div>

        {/* システム情報エリア */}
        <div className="mb-8">
          <Card className="p-6 bg-lavender-50/50 border-lavender-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">⚡</div>
                <div>
                  <h3 className="text-lg font-semibold text-lavender-800">個別化エンジン</h3>
                  <p className="text-lavender-600">
                    {personalizationStatus?.isInitialized ? 
                      `最終実行: ${personalizationStatus.lastRun ? new Date(personalizationStatus.lastRun).toLocaleString('ja-JP') : '未実行'}` :
                      '初期化中...'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={runPersonalizationEngine}
                disabled={personalizationLoading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  personalizationLoading
                    ? 'bg-lavender-200 text-lavender-500 cursor-not-allowed'
                    : 'bg-lavender-500 text-white hover:bg-lavender-600'
                }`}
              >
                {personalizationLoading ? (
                  <span className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-lavender-300 border-t-white"></div>
                    <span>実行中...</span>
                  </span>
                ) : (
                  '今すぐ更新'
                )}
              </button>
            </div>
          </Card>
        </div>

        {/* 追加情報 */}
        {prioritizedUpdates.immediate.length === 0 && !loading && (
          <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border-soft-peach-200">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-deep-blue-800 mb-4">
              個別化を開始しましょう
            </h3>
            <p className="text-deep-blue-600 mb-6">
              プロフィール情報を入力し、個別化エンジンを実行することで、
              あなたに最適化された情報をお届けします。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/profile"
                className="px-6 py-3 bg-deep-blue-500 text-white rounded-lg hover:bg-deep-blue-600 transition-colors font-medium"
              >
                プロフィールを更新
              </a>
              <button
                onClick={runPersonalizationEngine}
                disabled={personalizationLoading}
                className="px-6 py-3 bg-soft-peach-500 text-deep-blue-700 rounded-lg hover:bg-soft-peach-600 transition-colors font-medium"
              >
                個別化を開始
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
} 