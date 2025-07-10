'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Header from '@/components/ui/Header'

interface CheckHistory {
  id: string
  created_at: string
  status: string
  cancer_type?: string
  region?: string
  concerns?: string[]
  feelings?: string[]
}

interface RoadmapHistory {
  id: string
  created_at: string
  title: string
  content_preview: string
  status: 'success' | 'error'
  ai_used: boolean
}

export default function MyDataPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkHistory, setCheckHistory] = useState<CheckHistory[]>([])
  const [roadmapHistory, setRoadmapHistory] = useState<RoadmapHistory[]>([])
  const [activeTab, setActiveTab] = useState<'checks' | 'roadmaps'>('checks')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    } else if (user) {
      loadHistoryData()
    }
  }, [user, loading, router])

  const loadHistoryData = async () => {
    setIsLoading(true)
    
    try {
      // TODO: Supabaseから実際のデータを取得
      // 仮のデータ
      const mockCheckHistory: CheckHistory[] = [
        {
          id: '1',
          created_at: '2024-06-29T10:30:00Z',
          status: 'completed',
          cancer_type: '乳がん',
          region: '関東',
          concerns: ['治療選択肢', '副作用・対処法'],
          feelings: ['不安', '混乱']
        },
        {
          id: '2', 
          created_at: '2024-06-25T14:15:00Z',
          status: 'completed',
          cancer_type: '乳がん',
          region: '関東',
          concerns: ['セカンドオピニオン'],
          feelings: ['希望']
        },
        {
          id: '3',
          created_at: '2024-06-20T09:45:00Z',
          status: 'incomplete',
          cancer_type: undefined,
          region: undefined
        }
      ]

      const mockRoadmapHistory: RoadmapHistory[] = [
        {
          id: '1',
          created_at: '2024-06-29T11:00:00Z',
          title: '乳がん治療の情報整理ガイド',
          content_preview: '診断から治療選択まで、あなたの状況に合わせた情報をまとめました...',
          status: 'success',
          ai_used: true
        },
        {
          id: '2',
          created_at: '2024-06-25T14:45:00Z', 
          title: 'セカンドオピニオンの活用ガイド',
          content_preview: 'セカンドオピニオンの準備から実際の活用方法まで...',
          status: 'success',
          ai_used: true
        },
        {
          id: '3',
          created_at: '2024-06-20T10:00:00Z',
          title: '生成エラー',
          content_preview: 'ガイドの生成中にエラーが発生しました',
          status: 'error',
          ai_used: false
        }
      ]

      setCheckHistory(mockCheckHistory)
      setRoadmapHistory(mockRoadmapHistory)
      
    } catch (error) {
      console.error('Failed to load history data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'incomplete':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status: string, type: 'check' | 'roadmap') => {
    if (type === 'check') {
      switch (status) {
        case 'completed': return '完了'
        case 'incomplete': return '未完了'
        default: return status
      }
    } else {
      switch (status) {
        case 'success': return '生成成功'
        case 'error': return '生成エラー'
        default: return status
      }
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-blue-50 via-white to-soft-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-deep-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue-50 via-white to-soft-peach-50">
      <Header />
      
      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            マイデータ
          </h1>
          <p className="text-gray-600">
            あなたのゆっくりチェック履歴とガイド生成履歴を確認できます。
          </p>
        </div>

        {/* タブナビゲーション */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('checks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'checks'
                    ? 'border-deep-blue-500 text-deep-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">🧭</span>
                ゆっくりチェック履歴 ({checkHistory.length})
              </button>
              <button
                onClick={() => setActiveTab('roadmaps')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'roadmaps'
                    ? 'border-deep-blue-500 text-deep-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">📋</span>
                ガイド生成履歴 ({roadmapHistory.length})
              </button>
            </nav>
          </div>
        </div>

        {/* ゆっくりチェック履歴 */}
        {activeTab === 'checks' && (
          <div className="space-y-6">
            {checkHistory.length > 0 ? (
              checkHistory.map((check) => (
                <Card key={check.id} variant="elevated">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-3">🧭</span>
                          <h3 className="text-lg font-medium text-gray-900">
                            ゆっくりセルフチェック
                          </h3>
                          <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                            check.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {getStatusText(check.status, 'check')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {formatDate(check.created_at)}
                        </div>
                        
                        {check.status === 'completed' && (
                          <div className="space-y-2">
                            {check.cancer_type && (
                              <div className="flex items-center text-sm">
                                <span className="text-gray-500 w-20">がん種:</span>
                                <span className="text-gray-700">{check.cancer_type}</span>
                              </div>
                            )}
                            {check.region && (
                              <div className="flex items-center text-sm">
                                <span className="text-gray-500 w-20">地域:</span>
                                <span className="text-gray-700">{check.region}</span>
                              </div>
                            )}
                            {check.concerns && check.concerns.length > 0 && (
                              <div className="flex items-start text-sm">
                                <span className="text-gray-500 w-20">関心事:</span>
                                <div className="flex flex-wrap gap-1">
                                  {check.concerns.map((concern, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                      {concern}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {check.feelings && check.feelings.length > 0 && (
                              <div className="flex items-start text-sm">
                                <span className="text-gray-500 w-20">気持ち:</span>
                                <div className="flex flex-wrap gap-1">
                                  {check.feelings.map((feeling, index) => (
                                    <span key={index} className="px-2 py-1 bg-warm-coral-100 text-warm-coral-700 rounded-full text-xs">
                                      {feeling}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        {check.status === 'completed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push('/roadmap')}
                          >
                            ガイドを生成
                          </Button>
                        )}
                        {check.status === 'incomplete' && (
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => router.push('/yukkuri-check')}
                          >
                            続きから始める
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card variant="outlined">
                <CardContent className="p-12 text-center">
                  <span className="text-6xl mb-4 block">🧭</span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    まだゆっくりチェックを行っていません
                  </h3>
                  <p className="text-gray-600 mb-6">
                    最初のゆっくりチェックを行って、あなたに最適な情報をまとめましょう。
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={() => router.push('/yukkuri-check')}
                  >
                    最初のチェックを始める
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ガイド生成履歴 */}
        {activeTab === 'roadmaps' && (
          <div className="space-y-6">
            {roadmapHistory.length > 0 ? (
              roadmapHistory.map((roadmap) => (
                <Card key={roadmap.id} variant="elevated">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-3">📋</span>
                          <h3 className="text-lg font-medium text-gray-900">
                            {roadmap.title}
                          </h3>
                          <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                            roadmap.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {getStatusText(roadmap.status, 'roadmap')}
                          </span>
                          {roadmap.ai_used && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                              AI生成
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {formatDate(roadmap.created_at)}
                        </div>
                        <p className="text-sm text-gray-700">
                          {roadmap.content_preview}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        {roadmap.status === 'success' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push('/roadmap')}
                          >
                            詳細を見る
                          </Button>
                        )}
                        {roadmap.status === 'error' && (
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => router.push('/roadmap')}
                          >
                            再生成
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card variant="outlined">
                <CardContent className="p-12 text-center">
                  <span className="text-6xl mb-4 block">📋</span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    まだガイドを生成していません
                  </h3>
                  <p className="text-gray-600 mb-6">
                    ゆっくりチェックを完了してから、あなた専用のガイドを生成してみましょう。
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={() => router.push('/yukkuri-check')}
                  >
                    ゆっくりチェックから始める
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 戻るボタン */}
        <div className="mt-12 text-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
          >
            ← ダッシュボードに戻る
          </Button>
        </div>
      </main>
    </div>
  )
} 