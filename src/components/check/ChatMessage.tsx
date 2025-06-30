'use client'

import React from 'react'

interface ChatMessageProps {
  sender: 'sottori' | 'user'
  message: string
  isTyping?: boolean
}

export function ChatMessage({ sender, message, isTyping = false }: ChatMessageProps) {
  if (sender === 'sottori') {
    return (
      <div className="flex items-start gap-3 mb-4">
        {/* Sottoriのアバター（左側） */}
        <div className="flex-shrink-0 w-10 h-10 bg-warm-coral-400 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">S</span>
        </div>
        
        {/* メッセージバブル（左側） */}
        <div className="flex-1 max-w-md">
          <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border border-gray-100">
            {isTyping ? (
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ユーザーのメッセージ（右側）
  return (
    <div className="flex items-start gap-3 mb-4 justify-end">
      {/* メッセージバブル（右側） */}
      <div className="flex-1 max-w-md flex justify-end">
        <div className="bg-deep-blue-500 text-white rounded-2xl rounded-tr-md p-4 shadow-sm">
          <p className="leading-relaxed text-white">
            {message}
          </p>
        </div>
      </div>
      
      {/* ユーザーのアバター（右側） */}
      <div className="flex-shrink-0 w-10 h-10 bg-deep-blue-500 rounded-full flex items-center justify-center">
        <span className="text-white text-sm font-medium">あ</span>
      </div>
    </div>
  )
} 