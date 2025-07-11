'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import type { InfoUpdate } from '../../lib/types/info-updates'

interface PersonalizedInfoCardProps {
  urgentUpdates: InfoUpdate[]
  relevantUpdates: InfoUpdate[]
  onViewDetail: () => void
}

export default function PersonalizedInfoCard({
  urgentUpdates,
  relevantUpdates,
  onViewDetail
}: PersonalizedInfoCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'treatment':
        return '🏥'
      case 'research':
        return '🔬'
      case 'wellness':
        return '🌿'
      case 'support':
        return '💝'
      case 'side_effects':
        return '⚠️'
      case 'doctors':
        return '👨‍⚕️'
      default:
        return '📚'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-warm-coral-100 text-warm-coral-700 border-warm-coral-200'
      case 'medium':
        return 'bg-golden-yellow-100 text-golden-yellow-700 border-golden-yellow-200'
      case 'low':
        return 'bg-sage-green-100 text-sage-green-700 border-sage-green-200'
      default:
        return 'bg-soft-peach-100 text-deep-blue-700 border-soft-peach-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '重要'
      case 'medium':
        return '中程度'
      case 'low':
        return '参考'
      default:
        return '一般'
    }
  }

  return (
    <Card 
      variant="outlined" 
      className="border-golden-yellow-200 bg-gradient-to-r from-golden-yellow-50 to-white hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4 sm:p-6">
        {/* ヘッダー */}
        <div className="flex items-start sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-golden-yellow-100 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-xl sm:text-2xl">🔍</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-deep-blue-800 truncate">
                関連情報
              </h3>
              <p className="text-xs sm:text-sm text-deep-blue-600">
                今のあなたに関係がありそうな情報
              </p>
            </div>
            <div className="flex-shrink-0 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDetail}
                className="border-golden-yellow-400 text-golden-yellow-700 hover:bg-golden-yellow-400 hover:text-white text-xs px-3 py-2"
              >
                詳細
              </Button>
            </div>
          </div>
        </div>

        {/* 情報一覧 */}
        <div className="space-y-3 mb-4">
          {/* 緊急情報 */}
          {urgentUpdates.map((update, index) => (
            <div key={update.id} className="bg-warm-coral-50 border border-warm-coral-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-2">
                <span className="text-warm-coral-600 text-sm flex-shrink-0">
                  {getCategoryIcon(update.category)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-warm-coral-800 truncate">
                      {update.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(update.priority)}`}>
                      {getPriorityLabel(update.priority)}
                    </span>
                  </div>
                  <p className="text-xs text-warm-coral-700 line-clamp-2 leading-relaxed">
                    {update.summary}
                  </p>
                  {update.metadata?.source_name && (
                    <p className="text-xs text-warm-coral-600 mt-1">
                      出典: {update.metadata.source_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 関連情報 */}
          {relevantUpdates.map((update, index) => (
            <div key={update.id} className="bg-golden-yellow-50 border border-golden-yellow-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-2">
                <span className="text-golden-yellow-600 text-sm flex-shrink-0">
                  {getCategoryIcon(update.category)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-golden-yellow-800 truncate">
                      {update.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(update.priority)}`}>
                      {getPriorityLabel(update.priority)}
                    </span>
                  </div>
                  <p className="text-xs text-golden-yellow-700 line-clamp-2 leading-relaxed">
                    {update.summary}
                  </p>
                  {update.metadata?.source_name && (
                    <p className="text-xs text-golden-yellow-600 mt-1">
                      出典: {update.metadata.source_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 情報がない場合 */}
          {urgentUpdates.length === 0 && relevantUpdates.length === 0 && (
            <div className="bg-golden-yellow-50 border border-golden-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-golden-yellow-600 text-sm">🔍</span>
                <div className="flex-1">
                  <p className="text-golden-yellow-800 text-sm leading-relaxed">
                    あなたの状況に合わせて、関連する情報をお探ししています
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2.5 h-2.5 bg-golden-yellow-500 rounded-full flex-shrink-0 animate-pulse"></div>
                    <span className="text-golden-yellow-700 text-xs">
                      情報を準備中
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 統計情報 */}
        {(urgentUpdates.length > 0 || relevantUpdates.length > 0) && (
          <div className="mb-4 p-3 bg-white border border-golden-yellow-100 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                {urgentUpdates.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-warm-coral-500 rounded-full"></div>
                    <span className="text-warm-coral-700">
                      緊急: {urgentUpdates.length}件
                    </span>
                  </div>
                )}
                {relevantUpdates.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-golden-yellow-500 rounded-full"></div>
                    <span className="text-golden-yellow-700">
                      関連: {relevantUpdates.length}件
                    </span>
                  </div>
                )}
              </div>
              <span className="text-golden-yellow-600">
                更新: {new Date().toLocaleDateString('ja-JP')}
              </span>
            </div>
          </div>
        )}

        {/* アクションエリア */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
          <p className="text-deep-blue-600 text-xs sm:text-sm leading-relaxed">
            お時間のある時にご確認ください
          </p>
          <div className="hidden sm:block">
            <Button
              variant="outline"
              size="md"
              onClick={onViewDetail}
              className="border-golden-yellow-400 text-golden-yellow-700 hover:bg-golden-yellow-400 hover:text-white transform transition-all duration-200"
            >
              <span className="flex items-center space-x-2">
                <span>📚</span>
                <span>すべての情報を見る</span>
              </span>
            </Button>
          </div>
        </div>

        {/* 追加情報（ホバー時表示） */}
        {isHovered && (
          <div className="mt-4 pt-4 border-t border-golden-yellow-100">
            <div className="text-xs text-golden-yellow-600 space-y-1">
              <p>💡 情報はあなたの状況に基づいて選ばれています</p>
              <p>🔄 新しい情報が追加されると自動で更新されます</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 