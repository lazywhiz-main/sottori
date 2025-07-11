'use client'

import { InfoUpdate } from '../../lib/types/info-updates'
import Button from '../ui/Button'

interface UpdateDetailModalProps {
  update: InfoUpdate
  onClose: () => void
  onMarkAsRead: (updateId: string) => void
  onToggleSave: (updateId: string) => void
}

export function UpdateDetailModal({
  update,
  onClose,
  onMarkAsRead,
  onToggleSave
}: UpdateDetailModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getPriorityConfig = (priority: 'high' | 'medium' | 'low') => {
    const configs = {
      high: { label: '重要', className: 'sottori-badge-priority-high' },
      medium: { label: '中程度', className: 'sottori-badge-priority-medium' },
      low: { label: '参考', className: 'sottori-badge-priority-low' }
    }
    return configs[priority] || configs.medium
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      treatment_options: '🏥',
      diagnosis: '👨‍⚕️',
      lifestyle: '💊',
      research_news: '🔬',
      support_resources: '🤝'
    }
    return icons[category as keyof typeof icons] || '📋'
  }

  const getCategoryName = (category: string) => {
    const names = {
      treatment_options: '治療選択肢',
      diagnosis: '診断・検査',
      lifestyle: '生活・副作用',
      research_news: '研究・治験',
      support_resources: 'サポート'
    }
    return names[category as keyof typeof names] || 'その他'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (score: number) => {
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

  const priorityConfig = getPriorityConfig(update.priority)

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-soft-peach-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{getCategoryIcon(update.category)}</div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-deep-blue-600">
                    {getCategoryName(update.category)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.className}`}>
                    {priorityConfig.label}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-deep-blue-800">{update.title}</h1>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-deep-blue-400 hover:text-deep-blue-600 transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        {/* メタ情報 */}
        <div className="p-6 bg-soft-peach-50 border-b border-soft-peach-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 関連度 */}
            <div className="flex items-center space-x-3">
              <div className="text-golden-yellow-500">⭐</div>
              <div>
                <div className="text-sm text-deep-blue-600">関連度</div>
                <div className="flex items-center space-x-2">
                  {renderStars(update.relevance_score)}
                  <span className="text-sm font-medium text-deep-blue-700">
                    {update.relevance_score}%
                  </span>
                </div>
              </div>
            </div>

            {/* 公開日時 */}
            <div className="flex items-center space-x-3">
              <div className="text-info-500">📅</div>
              <div>
                <div className="text-sm text-deep-blue-600">公開日時</div>
                <div className="text-sm font-medium text-deep-blue-700">
                  {formatDate(update.created_at)}
                </div>
              </div>
            </div>

            {/* ステータス */}
            <div className="flex items-center space-x-3">
              <div className="text-warm-coral-500">🔔</div>
              <div>
                <div className="text-sm text-deep-blue-600">ステータス</div>
                <div className="text-sm font-medium text-deep-blue-700">
                  {update.is_read ? '既読' : '未読'}
                  {update.is_saved && ' • 保存済み'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 要約 */}
        <div className="p-6 border-b border-soft-peach-200">
          <div className="flex items-start space-x-3">
            <div className="text-golden-yellow-500 text-xl mt-0.5">💡</div>
            <div>
              <h2 className="text-lg font-semibold text-deep-blue-800 mb-2">要約</h2>
              <p className="text-deep-blue-700 leading-relaxed">{update.summary}</p>
            </div>
          </div>
        </div>

        {/* 詳細内容 */}
        <div className="p-6 border-b border-soft-peach-200">
          <h2 className="text-lg font-semibold text-deep-blue-800 mb-4">詳細内容</h2>
          <div className="prose max-w-none text-deep-blue-700">
            <p className="leading-relaxed whitespace-pre-line">{update.content}</p>
          </div>
        </div>

        {/* 情報ソース */}
        {update.source_url && (
          <div className="p-6 border-b border-soft-peach-200">
            <h2 className="text-lg font-semibold text-deep-blue-800 mb-2">情報ソース</h2>
            <a 
              href={update.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-info-600 hover:text-info-700 underline"
            >
              <span className="mr-1">🔗</span>
              元の情報を確認する
            </a>
          </div>
        )}

        {/* アクションボタン */}
        <div className="p-6 bg-soft-peach-50">
          <div className="flex flex-wrap gap-3 justify-between">
            <div className="flex gap-3">
              {!update.is_read && (
                <button
                  onClick={() => onMarkAsRead(update.id)}
                  className="sottori-button-secondary px-4 py-2 rounded-lg text-sm font-medium"
                >
                  既読にする
                </button>
              )}
              
              <button
                onClick={() => onToggleSave(update.id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${update.is_saved 
                    ? 'bg-golden-yellow-500 text-deep-blue-700 hover:bg-golden-yellow-600' 
                    : 'sottori-button-secondary'
                  }
                `}
              >
                {update.is_saved ? '保存済み' : '保存する'}
              </button>
              
              <button className="sottori-button-primary px-4 py-2 rounded-lg text-sm font-medium">
                ロードマップに追加
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="text-deep-blue-600 hover:text-deep-blue-700 text-sm font-medium"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 