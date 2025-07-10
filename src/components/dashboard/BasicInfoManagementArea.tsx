import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'
import { ProfileCompletionService, CancerProfileService, parseSupabaseError } from '@/lib/utils/databaseHelpers'
import type { ProfileCompletionItem, CompletionStats } from '@/lib/types/database'

export default function BasicInfoManagementArea() {
  const { user } = useAuth()
  const [profileItems, setProfileItems] = useState<ProfileCompletionItem[]>([])
  const [completionStats, setCompletionStats] = useState<CompletionStats>({ total: 0, completed: 0, percentage: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadProfileCompletion()
    }
  }, [user])

  const loadProfileCompletion = async () => {
    if (!user) return
    
    setIsLoading(true)
    
    try {
      console.log('プロフィール完了状況を読み込み中...', user.id)
      
      // がん治療プロフィールの状況を確認
      const cancerProfile = await CancerProfileService.getProfile(user.id)
      console.log('がん治療プロフィール:', cancerProfile)
      
      // 基本的なプロフィール完了項目を設定
      const baseItems: Partial<ProfileCompletionItem>[] = [
        {
          category: 'がん治療情報',
          title: 'がん種・ステージ設定',
          description: '診断されたがんの種類とステージを設定してください',
          priority: 1,
          estimated_time: '3分',
          related_url: '/profile?section=cancer-info',
          is_completed: !!(cancerProfile?.cancer_type)
        },
        {
          category: 'がん治療情報',
          title: '治療状況の入力',
          description: '現在の治療方針や進行状況を記録してください',
          priority: 2,
          estimated_time: '5分',
          related_url: '/profile?section=cancer-info',
          is_completed: !!(cancerProfile?.treatment_status)
        },
        {
          category: '関心・気になるポイント',
          title: '気になるポイントの選択',
          description: '今、最も知りたい情報のカテゴリを選択してください',
          priority: 3,
          estimated_time: '2分',
          related_url: '/profile?section=cancer-info',
          is_completed: !!(cancerProfile?.concern_areas && cancerProfile.concern_areas.length > 0)
        },
        {
          category: '医療チーム',
          title: '主治医情報の登録',
          description: '現在診てもらっている主治医の情報を登録してください',
          priority: 4,
          estimated_time: '3分',
          related_url: '/medical-team',
          is_completed: !!(cancerProfile?.primary_doctor)
        },
        {
          category: '医療チーム',
          title: '通院先医療機関の登録',
          description: '主な通院先の医療機関情報を登録してください',
          priority: 5,
          estimated_time: '2分',
          related_url: '/medical-team',
          is_completed: !!(cancerProfile?.hospital)
        },
        {
          category: '個人設定',
          title: 'プロフィール情報の完成',
          description: '基本的なプロフィール情報を完成させてください',
          priority: 6,
          estimated_time: '3分',
          related_url: '/profile',
          is_completed: !!(cancerProfile && cancerProfile.cancer_type && cancerProfile.treatment_status && cancerProfile.concern_areas?.length)
        }
      ]

              // プロフィール完了項目をデータベースに保存/更新
        const savedItems: ProfileCompletionItem[] = []
        for (const item of baseItems) {
          try {
            const savedItem = await ProfileCompletionService.createItem({
              user_id: user.id,
              category: item.category!,
              title: item.title!,
              description: item.description!,
              is_completed: item.is_completed!,
              priority: item.priority!,
              estimated_time: item.estimated_time!,
              related_url: item.related_url!
            })
            savedItems.push(savedItem)
          } catch (error) {
            console.error('プロフィール項目保存エラー:', error)
          }
        }
      
      setProfileItems(savedItems)
      
      // 完了統計を計算
      const completed = savedItems.filter(item => item.is_completed).length
      const total = savedItems.length
      const percentage = Math.round((completed / total) * 100)
      
      setCompletionStats({ total, completed, percentage })
      console.log('プロフィール完了状況:', { total, completed, percentage })
      
    } catch (error) {
      console.error('プロフィール完了状況読み込みエラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async (itemId: string) => {
    if (!user) return

    try {
      console.log('項目完了処理中...', itemId)
      await ProfileCompletionService.completeItem(itemId)
      
      // ローカル状態を更新
      setProfileItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, is_completed: true }
            : item
        )
      )
      
      // 統計を再計算
      const updatedItems = profileItems.map(item => 
        item.id === itemId ? { ...item, is_completed: true } : item
      )
      const completed = updatedItems.filter(item => item.is_completed).length
      const percentage = Math.round((completed / updatedItems.length) * 100)
      setCompletionStats(prev => ({ ...prev, completed, percentage }))
      
    } catch (error) {
      console.error('項目完了エラー:', error)
    }
  }

  const handleNavigate = (url: string | undefined) => {
    if (url) {
      window.location.href = url
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'がん治療情報': return '🏥'
      case '関心・気になるポイント': return '🎯'
      case '医療チーム': return '👨‍⚕️'
      case '個人設定': return '⚙️'
      default: return '📝'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'がん治療情報': return 'text-deep-blue-500'
      case '関心・気になるポイント': return 'text-warm-coral-500'
      case '医療チーム': return 'text-golden-yellow-600'
      case '個人設定': return 'text-green-600'
      default: return 'text-gray-500'
    }
  }

  const incompleteItems = profileItems.filter(item => !item.is_completed).slice(0, 4)
  const highPriorityIncomplete = incompleteItems.filter(item => item.priority <= 3)

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
            <span className="mr-2">📋</span>
            基本情報管理
          </div>
          <div className="text-sm font-normal">
            {completionStats.percentage}% 完了
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-deep-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">完了状況を確認中...</div>
          </div>
        ) : (
          <>
            {/* 完了度プログレス */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">プロフィール完了度</span>
                <span className="text-gray-600">
                  {completionStats.completed} / {completionStats.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-deep-blue-500 to-warm-coral-400 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${completionStats.percentage}%` }}
                >
                  {completionStats.percentage > 15 && (
                    <span className="text-xs text-white font-medium">
                      {completionStats.percentage}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 重要な未完了項目 */}
            {highPriorityIncomplete.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">重要な設定項目</h4>
                {highPriorityIncomplete.map((item) => (
                  <div 
                    key={item.id} 
                    className="border border-warm-coral-200 bg-warm-coral-50 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="mr-2">{getCategoryIcon(item.category)}</span>
                          <span className="font-medium text-sm text-gray-800">{item.title}</span>
                          <span className="ml-2 text-xs text-gray-500">({item.estimated_time})</span>
                        </div>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleNavigate(item.related_url)}
                        className="text-xs"
                      >
                        設定する
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(item.id)}
                        className="text-xs"
                      >
                        完了済み
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* その他の未完了項目 */}
            {incompleteItems.length > highPriorityIncomplete.length && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">その他の項目</h4>
                {incompleteItems.filter(item => item.priority > 3).map((item) => (
                  <div 
                    key={item.id} 
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="mr-2">{getCategoryIcon(item.category)}</span>
                        <div>
                          <div className="font-medium text-sm text-gray-800">{item.title}</div>
                          <div className="text-xs text-gray-500">{item.estimated_time}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigate(item.related_url)}
                        className="text-xs"
                      >
                        設定
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 全完了の場合 */}
            {incompleteItems.length === 0 && (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-sm font-medium text-green-600 mb-1">
                  基本設定が完了しました！
                </div>
                <div className="text-xs text-gray-600">
                  すべての重要な項目が設定されています
                </div>
              </div>
            )}

            {/* プロフィール管理リンク */}
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate('/profile')}
                className="w-full text-xs text-gray-600 hover:text-deep-blue-600"
              >
                プロフィール設定を開く →
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 