import React from 'react'

interface AIStatusIndicatorProps {
  isAIEnabled: boolean
  isGenerating?: boolean
  aiGenerated?: boolean
  fallbackUsed?: boolean
  className?: string
}

export default function AIStatusIndicator({
  isAIEnabled,
  isGenerating = false,
  aiGenerated = false,
  fallbackUsed = false,
  className = ''
}: AIStatusIndicatorProps) {
  if (isGenerating) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span>AI生成中...</span>
      </div>
    )
  }

  if (!isAIEnabled) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        <span>AI機能：無効</span>
      </div>
    )
  }

  if (fallbackUsed) {
    return (
      <div className={`flex items-center gap-2 text-sm text-amber-600 ${className}`}>
        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
        <span>AI生成失敗（既存ロジック使用）</span>
      </div>
    )
  }

  if (aiGenerated) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 ${className}`}>
        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        <span>AI生成済み</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-blue-600 ${className}`}>
      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
      <span>AI機能：有効</span>
    </div>
  )
} 