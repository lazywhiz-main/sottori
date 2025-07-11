'use client'

import { StructuredContent } from '../../lib/types/info-updates'
import Button from '../ui/Button'

interface UpdatesListProps {
  updates: StructuredContent[]
  isLoading: boolean
  onUpdateClick: (update: StructuredContent) => void
  onMarkAsRead: (updateId: string) => void
  onToggleSave: (updateId: string) => void
}

export function UpdatesList({
  updates,
  isLoading,
  onUpdateClick,
  onMarkAsRead,
  onToggleSave
}: UpdatesListProps) {
  const getCategoryIcon = (category: StructuredContent['category']): string => {
    const icons = {
      treatment_options: '🏥',
      diagnosis: '🔍', 
      support_resources: '🤝',
      lifestyle: '🌱',
      research_news: '🔬'
    }
    return icons[category] || '📋'
  }

  const getCategoryName = (category: StructuredContent['category']): string => {
    const names = {
      treatment_options: '治療選択肢',
      diagnosis: '診断・検査',
      support_resources: 'サポートリソース', 
      lifestyle: '生活・療養',
      research_news: '研究・ニュース'
    }
    return names[category] || 'その他'
  }

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'たった今'
    } else if (diffInHours < 24) {
      const hour = date.getHours()
      const minute = date.getMinutes()
      return `今日 ${hour}:${minute.toString().padStart(2, '0')}`
    } else if (diffInHours < 48) {
      const hour = date.getHours()
      const minute = date.getMinutes()
      return `昨日 ${hour}:${minute.toString().padStart(2, '0')}`
    } else {
      const days = Math.floor(diffInHours / 24)
      return `${days}日前`
    }
  }

  const renderStars = (score: number): React.ReactElement => {
    const fullStars = Math.floor(score / 20)
    const hasHalfStar = (score % 20) >= 10
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <span key={i} className="text-golden-yellow-500">★</span>
          } else if (i === fullStars && hasHalfStar) {
            return <span key={i} className="text-golden-yellow-500">☆</span>
          } else {
            return <span key={i} className="text-soft-peach-300">☆</span>
          }
        })}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin text-2xl mb-4">🔄</div>
          <p className="text-gray-500">情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (updates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <span className="text-4xl mb-4 block">📭</span>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            該当する情報がありません
          </h3>
          <p className="text-gray-500">
            新しい情報が見つかり次第、こちらに表示されます
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => {
        const isUnread = !update.user_state?.is_read
        const isSaved = update.user_state?.is_saved || false
        const relevanceScore = update.final_relevance_score || update.relevance_score || 0
        
        return (
          <div
            key={update.id}
            className={`
              sottori-card-hover p-6 cursor-pointer transition-all duration-200
              ${isUnread ? 'border-l-4 border-info-500 bg-info-50' : ''}
            `}
            onClick={() => onUpdateClick(update)}
          >
            {/* ヘッダー部分 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {/* 未読インジケーター */}
                {isUnread && (
                  <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                )}
                
                {/* カテゴリアイコン */}
                <div className="text-lg">{getCategoryIcon(update.category)}</div>
                
                {/* カテゴリ名 */}
                <span className="text-sm font-medium text-deep-blue-600">
                  {getCategoryName(update.category)}
                </span>
                
                {/* 信頼性スコア */}
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  信頼性: {update.reliability_score}/5
                </span>
              </div>
              
              {/* 時刻表示 */}
              <div className="text-sm text-deep-blue-400 flex items-center">
                <span className="mr-1">📅</span>
                {formatRelativeTime(update.updated_at)}
              </div>
            </div>

            {/* タイトル */}
            <h3 className="text-lg font-semibold text-deep-blue-800 mb-2 line-clamp-2">
              {update.title}
            </h3>

            {/* 関連度表示 */}
            {relevanceScore > 0 && (
              <div className="flex items-center mb-3">
                <span className="text-sm text-deep-blue-600 mr-2">あなたのプロフィールに基づく関連度:</span>
                <div className="flex items-center">
                  {renderStars(relevanceScore)}
                  <span className="ml-2 text-sm font-medium text-deep-blue-700">
                    ({relevanceScore}%)
                  </span>
                </div>
              </div>
            )}

            {/* 要約 */}
            {update.summary && (
              <div className="mb-4">
                <div className="flex items-start">
                  <span className="text-golden-yellow-500 mr-2 mt-0.5">💡</span>
                  <div>
                    <span className="text-sm font-medium text-deep-blue-700">要約: </span>
                    <span className="text-sm text-deep-blue-600 line-clamp-3">
                      {update.summary}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateClick(update)
                  }}
                  className="sottori-button-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  詳細を見る
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSave(update.id)
                  }}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isSaved 
                      ? 'bg-golden-yellow-500 text-deep-blue-700 hover:bg-golden-yellow-600' 
                      : 'sottori-button-secondary'
                    }
                  `}
                >
                  {isSaved ? '保存済み' : '保存'}
                </button>
              </div>
              
              {isUnread && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead(update.id)
                  }}
                  className="text-info-600 hover:text-info-700 text-sm font-medium transition-colors"
                >
                  既読にする
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
} 