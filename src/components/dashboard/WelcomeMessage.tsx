'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { userVisitService } from '../../lib/services/userVisitService'

interface WelcomeMessageProps {
  onDismiss?: () => void
}

export default function WelcomeMessage({ onDismiss }: WelcomeMessageProps) {
  const { user } = useAuth()
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkFirstVisit = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const firstVisit = await userVisitService.isFirstVisit(user.id, 'dashboard')
        setIsFirstVisit(firstVisit)
      } catch (error) {
        console.warn('Error checking first visit:', error)
        // エラーの場合は初回訪問として扱う
        setIsFirstVisit(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkFirstVisit()
  }, [user?.id])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const handleNext = () => {
    setCurrentStep(prev => prev + 1)
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  // ローディング中は何も表示しない（デザインを崩さない）
  if (isLoading) {
    return null
  }

  // 初回訪問でない場合は何も表示しない
  if (isFirstVisit === false || !isVisible) {
    return null
  }

  const messages = [
    {
      title: "Sottoriへようこそ",
      content: "あなたの治療をサポートするパーソナルアシスタントです。不安な気持ちは当然です。一緒に一歩ずつ進んでいきましょう。",
      icon: "🤗",
      action: "次へ"
    },
    {
      title: "安心してください",
      content: "ここでは、あなたのペースで情報を確認できます。急ぐ必要はありません。分からないことがあれば、いつでも「わからない」と言ってください。",
      icon: "💙",
      action: "次へ"
    },
    {
      title: "あなたの治療をサポート",
      content: "治療の流れ、関連情報、次のステップを整理してお届けします。家族との共有も簡単にできます。",
      icon: "📋",
      action: "始めましょう"
    }
  ]

  const currentMessage = messages[currentStep]
  const isLastStep = currentStep === messages.length - 1

  return (
    <div className="welcome-message-overlay">
      <div className="welcome-message-card">
        <div className="welcome-message-header">
          <div className="welcome-message-icon">{currentMessage.icon}</div>
          <button 
            className="welcome-message-close"
            onClick={handleDismiss}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        
        <div className="welcome-message-content">
          <h2 className="welcome-message-title">{currentMessage.title}</h2>
          <p className="welcome-message-text">{currentMessage.content}</p>
        </div>
        
        <div className="welcome-message-footer">
          <div className="welcome-message-progress">
            {messages.map((_, index) => (
              <div 
                key={index}
                className={`progress-dot ${index === currentStep ? 'active' : ''}`}
              />
            ))}
          </div>
          
          <div className="welcome-message-actions">
            {currentStep > 0 && (
              <button 
                className="welcome-message-button secondary"
                onClick={handlePrevious}
              >
                戻る
              </button>
            )}
            
            <button 
              className="welcome-message-button primary"
              onClick={isLastStep ? handleDismiss : handleNext}
            >
              {currentMessage.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 