'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface TreatmentOverviewCardProps {
  currentPhase: string
  nextMilestone: string
  progressRate: number
  onViewDetail: () => void
}

export default function TreatmentOverviewCard({
  currentPhase,
  nextMilestone,
  progressRate,
  onViewDetail
}: TreatmentOverviewCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case '診断後の準備期間':
        return 'from-deep-blue-500 to-deep-blue-600'
      case '治療中':
        return 'from-warm-coral-500 to-warm-coral-600'
      case 'フォローアップ期間':
        return 'from-sage-green-500 to-sage-green-600'
      default:
        return 'from-deep-blue-500 to-deep-blue-600'
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case '診断後の準備期間':
        return '📋'
      case '治療中':
        return '🏥'
      case 'フォローアップ期間':
        return '📊'
      default:
        return '📋'
    }
  }

  const getProgressColor = (rate: number) => {
    if (rate < 30) return 'from-deep-blue-500 to-deep-blue-600'
    if (rate < 70) return 'from-warm-coral-500 to-warm-coral-600'
    return 'from-sage-green-500 to-sage-green-600'
  }

  return (
    <Card 
      variant="default" 
      className="border border-deep-blue-200 hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4 sm:p-6">
        {/* ヘッダー */}
        <div className="flex items-start sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-deep-blue-100 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-xl sm:text-2xl">{getPhaseIcon(currentPhase)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-deep-blue-800 truncate">
                治療ロードマップ
              </h3>
              <p className="text-xs sm:text-sm text-deep-blue-600">
                あなた専用のガイド
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 sm:hidden">
            <Button
              variant="primary"
              size="sm"
              onClick={onViewDetail}
              className="text-xs px-3 py-2"
            >
              表示
            </Button>
          </div>
        </div>

        {/* 進捗バー */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-deep-blue-700 font-medium">進捗</span>
            <span className="text-deep-blue-600 font-semibold">{progressRate}%</span>
          </div>
          <div className="w-full bg-deep-blue-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getProgressColor(progressRate)} ${
                isHovered ? 'shadow-lg' : ''
              }`}
              style={{ width: `${progressRate}%` }}
            />
          </div>
        </div>

        {/* 現在の段階と次のマイルストーン */}
        <div className="bg-deep-blue-50 rounded-lg p-3 sm:p-4 mb-4 border border-deep-blue-100">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 text-sm">
            {/* 現在の段階 */}
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-6 h-6 bg-deep-blue-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs">●</span>
              </div>
              <div className="flex-1">
                <span className="font-medium text-deep-blue-700 block">現在の段階:</span>
                <p className="text-deep-blue-600 text-xs sm:text-sm mt-1 font-medium">
                  {currentPhase}
                </p>
              </div>
            </div>

            {/* 次のマイルストーン */}
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-6 h-6 bg-warm-coral-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs">→</span>
              </div>
              <div className="flex-1">
                <span className="font-medium text-deep-blue-700 block">次のマイルストーン:</span>
                <p className="text-deep-blue-600 text-xs sm:text-sm mt-1 font-medium">
                  {nextMilestone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションエリア */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
          <p className="text-deep-blue-600 text-xs sm:text-sm leading-relaxed">
            詳細な治療計画をご確認いただけます
          </p>
          <div className="hidden sm:block">
            <Button
              variant="primary"
              size="md"
              onClick={onViewDetail}
              className={`bg-gradient-to-r ${getPhaseColor(currentPhase)} hover:shadow-lg transform transition-all duration-200 ${
                isHovered ? 'scale-105' : 'scale-100'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>📋</span>
                <span>詳しい治療計画を見る</span>
              </span>
            </Button>
          </div>
        </div>

        {/* 追加情報（ホバー時表示） */}
        {isHovered && (
          <div className="mt-4 pt-4 border-t border-deep-blue-100">
            <div className="text-xs text-deep-blue-500 space-y-1">
              <p>💡 治療計画は定期的に更新されます</p>
              <p>📅 次回更新予定: 1週間後</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 