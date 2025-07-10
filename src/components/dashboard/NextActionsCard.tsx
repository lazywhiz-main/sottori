'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'

interface NextActionsCardProps {
  treatmentAction: string
  informationAction: string
}

export default function NextActionsCard({
  treatmentAction,
  informationAction
}: NextActionsCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card 
      variant="elevated" 
      className="border border-sage-green-200 bg-gradient-to-r from-sage-green-50 to-white hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4 sm:p-6">
        {/* ヘッダー */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-sage-green-100 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-xl sm:text-2xl">🎯</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-deep-blue-800">次のアクション</h3>
            <p className="text-xs sm:text-sm text-deep-blue-600">おすすめの次のステップ</p>
          </div>
        </div>

        {/* アクション一覧 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* 治療関連アクション */}
          {treatmentAction && (
            <div className="bg-white border border-sage-green-200 rounded-lg p-3 hover:shadow-md transition-shadow group">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-sage-green-100 rounded-lg flex items-center justify-center group-hover:bg-sage-green-200 transition-colors">
                  <span className="text-sage-green-600 text-sm">🌸</span>
                </div>
                <span className="text-sm font-medium text-sage-green-800">治療関連</span>
              </div>
              <p className="text-xs text-sage-green-700 leading-relaxed">
                {treatmentAction}
              </p>
              <div className="mt-2 flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-sage-green-400 rounded-full"></div>
                <span className="text-xs text-sage-green-600">推奨</span>
              </div>
            </div>
          )}

          {/* 情報関連アクション */}
          {informationAction && (
            <div className="bg-white border border-sage-green-200 rounded-lg p-3 hover:shadow-md transition-shadow group">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-sage-green-100 rounded-lg flex items-center justify-center group-hover:bg-sage-green-200 transition-colors">
                  <span className="text-sage-green-600 text-sm">📚</span>
                </div>
                <span className="text-sm font-medium text-sage-green-800">情報関連</span>
              </div>
              <p className="text-xs text-sage-green-700 leading-relaxed">
                {informationAction}
              </p>
              <div className="mt-2 flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-sage-green-400 rounded-full"></div>
                <span className="text-xs text-sage-green-600">推奨</span>
              </div>
            </div>
          )}
        </div>

        {/* アクションがない場合 */}
        {!treatmentAction && !informationAction && (
          <div className="bg-white border border-sage-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">✨</div>
            <p className="text-sm text-sage-green-700">
              現在、特別なアクションはありません
            </p>
            <p className="text-xs text-sage-green-600 mt-1">
              お気持ちに余裕がある時に、ゆっくりと情報をご確認ください
            </p>
          </div>
        )}

        {/* 追加情報（ホバー時表示） */}
        {isHovered && (
          <div className="mt-4 pt-4 border-t border-sage-green-100">
            <div className="text-xs text-sage-green-600 space-y-1">
              <p>💡 これらのアクションはあなたの状況に基づいて提案されています</p>
              <p>⏰ 無理のないペースで進めてください</p>
            </div>
          </div>
        )}

        {/* サポートメッセージ */}
        <div className="mt-4 pt-4 border-t border-sage-green-100">
          <div className="flex items-center justify-between text-xs text-sage-green-600">
            <span>いつでもお気軽にご相談ください</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-sage-green-400 rounded-full animate-pulse"></div>
              <span>サポート中</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 