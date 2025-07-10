import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface WeeklySuggestion {
  id: string
  title: string
  description: string
  type: 'action' | 'information' | 'reminder' | 'opportunity'
  priority: number
  is_completed: boolean
  estimated_time?: string
  related_url?: string
  due_date?: string
}

export default function WeeklySuggestionsArea() {
  const [suggestions, setSuggestions] = useState<WeeklySuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [completedToday, setCompletedToday] = useState(0)

  useEffect(() => {
    loadWeeklySuggestions()
  }, [])

  const loadWeeklySuggestions = async () => {
    setIsLoading(true)
    
    try {
      // TODO: Supabaseから週次提案を取得
      // 仮のデータ
      const mockSuggestions: WeeklySuggestion[] = [
        {
          id: '1',
          title: '主治医への質問リストを作成',
          description: '次回の診察で聞きたいことを整理してみましょう。',
          type: 'action',
          priority: 1,
          is_completed: false,
          estimated_time: '15分',
          related_url: '/roadmap'
        },
        {
          id: '2',
          title: 'セカンドオピニオン先を調べる',
          description: 'お住まいの地域の専門医情報が更新されました。',
          type: 'information',
          priority: 2,
          is_completed: false,
          estimated_time: '20分',
          related_url: '/roadmap'
        },
        {
          id: '3',
          title: '家族との情報共有',
          description: '最新のガイドを家族と共有してみませんか。',
          type: 'opportunity',
          priority: 3,
          is_completed: false,
          estimated_time: '5分',
          related_url: '/roadmap'
        },
        {
          id: '4',
          title: '副作用日記をつける',
          description: '治療中の体調変化を記録すると、次回の診察で役立ちます。',
          type: 'reminder',
          priority: 4,
          is_completed: true,
          estimated_time: '10分'
        }
      ]
      
      setSuggestions(mockSuggestions)
      setCompletedToday(mockSuggestions.filter(s => s.is_completed).length)
      
    } catch (error) {
      console.error('Failed to load weekly suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async (suggestionId: string) => {
    try {
      // TODO: Supabaseで完了状態を更新
      setSuggestions(prev => 
        prev.map(suggestion => 
          suggestion.id === suggestionId 
            ? { ...suggestion, is_completed: true }
            : suggestion
        )
      )
      setCompletedToday(prev => prev + 1)
    } catch (error) {
      console.error('Failed to complete suggestion:', error)
    }
  }

  const handleAction = (suggestion: WeeklySuggestion) => {
    if (suggestion.related_url) {
      window.location.href = suggestion.related_url
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return '📝'
      case 'information': return '📖'
      case 'reminder': return '⏰'
      case 'opportunity': return '💡'
      default: return '📌'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'action': return 'text-deep-blue-500'
      case 'information': return 'text-warm-coral-500'
      case 'reminder': return 'text-golden-yellow-600'
      case 'opportunity': return 'text-green-600'
      default: return 'text-gray-500'
    }
  }

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return { text: '最優先', className: 'bg-red-100 text-red-700' }
    if (priority <= 2) return { text: '重要', className: 'bg-orange-100 text-orange-700' }
    return { text: '推奨', className: 'bg-blue-100 text-blue-700' }
  }

  const activeSuggestions = suggestions.filter(s => !s.is_completed).slice(0, 3)
  const completedSuggestions = suggestions.filter(s => s.is_completed)

  return (
    <Card variant="elevated" className="h-full">
      <CardHeader>
        <CardTitle className="text-deep-blue-500 flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">💡</span>
            今週の提案
          </div>
          {completedToday > 0 && (
            <div className="text-sm font-normal text-green-600">
              今日 {completedToday}件完了
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-deep-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">提案を準備中...</div>
          </div>
        ) : (
          <>
            {/* アクティブな提案 */}
            {activeSuggestions.length > 0 ? (
              <div className="space-y-3">
                {activeSuggestions.map((suggestion) => {
                  const priorityBadge = getPriorityBadge(suggestion.priority)
                  
                  return (
                    <div 
                      key={suggestion.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:border-deep-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 mb-1">
                              {suggestion.title}
                            </div>
                            <div className="text-sm text-gray-600">
                              {suggestion.description}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full ${priorityBadge.className}`}>
                          {priorityBadge.text}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {suggestion.estimated_time && (
                            <span>⏱️ {suggestion.estimated_time}</span>
                          )}
                          <span className={getTypeColor(suggestion.type)}>
                            {suggestion.type === 'action' && 'アクション'}
                            {suggestion.type === 'information' && '情報'}
                            {suggestion.type === 'reminder' && 'リマインダー'}
                            {suggestion.type === 'opportunity' && '提案'}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          {suggestion.related_url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAction(suggestion)}
                            >
                              実行
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleComplete(suggestion.id)}
                          >
                            完了
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <span className="text-4xl mb-2 block">🎉</span>
                <div className="text-sm">
                  今週の提案はすべて完了しました！<br />
                  素晴らしいですね。
                </div>
              </div>
            )}

            {/* 完了済みの提案 */}
            {completedSuggestions.length > 0 && (
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  完了済み ({completedSuggestions.length}件)
                </div>
                <div className="space-y-2">
                  {completedSuggestions.slice(0, 2).map((suggestion) => (
                    <div 
                      key={suggestion.id} 
                      className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg"
                    >
                      <span className="text-green-600">✓</span>
                      <div className="flex-1 text-sm text-gray-600 line-through">
                        {suggestion.title}
                      </div>
                    </div>
                  ))}
                  {completedSuggestions.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      他 {completedSuggestions.length - 2}件
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 新しい提案の準備中メッセージ */}
            {activeSuggestions.length === 0 && completedSuggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex items-center text-blue-700 text-sm">
                  <span className="mr-2">🔄</span>
                  あなたの状況に合わせて、新しい提案を準備中です。
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 