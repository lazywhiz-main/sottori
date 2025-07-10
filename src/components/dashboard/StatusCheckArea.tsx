'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface StatusCheckAreaProps {
  userName?: string
  previousSituationSummary: string
  onStatusUpdate: () => void
}

export default function StatusCheckArea({ 
  userName, 
  previousSituationSummary, 
  onStatusUpdate 
}: StatusCheckAreaProps) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

  return (
    <Card 
      variant="elevated" 
      className="border-l-4 border-l-warm-coral-400 bg-gradient-to-r from-warm-coral-50 to-white overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start space-x-3 sm:space-x-4">
          {/* アバターエリア */}
          <div className="flex-shrink-0 relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-warm-coral-100 to-warm-coral-200 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xl sm:text-2xl">👩‍⚕️</span>
            </div>
            {/* オンラインインジケーター */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-sage-green-500 border-2 border-white rounded-full"></div>
          </div>
          
          {/* チャットメッセージエリア */}
          <div className="flex-1 relative">
            <div className="bg-white rounded-2xl rounded-tl-sm p-3 sm:p-4 relative shadow-sm border border-warm-coral-100">
              {/* 吹き出しの三角 */}
              <div className="absolute -left-2 top-3 sm:top-4 w-3 h-3 sm:w-4 sm:h-4 bg-white transform rotate-45 border-l border-b border-warm-coral-100"></div>
              
              <div className="space-y-2 sm:space-y-3">
                {/* メインメッセージ */}
                <div className="space-y-1">
                  <p className="text-base sm:text-lg font-medium text-deep-blue-800 leading-relaxed">
                    調子はいかがですか？
                  </p>
                  <p className="text-xs sm:text-sm text-deep-blue-600 leading-relaxed">
                    {previousSituationSummary}変わったことがあれば、お聞かせください。
                  </p>
                </div>

                {/* 感情アイコン */}
                <div className="flex space-x-2 pt-1">
                  <button className="text-2xl hover:scale-110 transition-transform duration-200" title="とても良い">
                    😊
                  </button>
                  <button className="text-2xl hover:scale-110 transition-transform duration-200" title="普通">
                    😐
                  </button>
                  <button className="text-2xl hover:scale-110 transition-transform duration-200" title="少し心配">
                    😔
                  </button>
                  <button className="text-2xl hover:scale-110 transition-transform duration-200" title="詳しく話したい">
                    💬
                  </button>
                </div>

                {/* アクションボタン */}
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={onStatusUpdate}
                    className={`w-full sm:w-auto shadow-md hover:shadow-lg transform transition-all duration-200 bg-warm-coral-500 text-white hover:bg-warm-coral-600 ${
                      isHovered ? 'scale-105' : 'scale-100'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>💬</span>
                      <span>状況をお聞かせください</span>
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* タイムスタンプ */}
            <div className="text-right mt-2">
              <span className="text-xs text-warm-coral-600">
                {new Date().toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* 追加のサポートメッセージ */}
        <div className="mt-4 pt-4 border-t border-warm-coral-100">
          <div className="flex items-center justify-between text-xs text-warm-coral-600">
            <span>いつでもお気軽にお声がけください</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-warm-coral-400 rounded-full animate-pulse"></div>
              <span>オンライン</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 