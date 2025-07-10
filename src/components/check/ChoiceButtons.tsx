'use client'

import React from 'react'

interface Choice {
  value: string
  label: string
  description?: string
  emoji?: string
}

interface ChoiceButtonsProps {
  choices: Choice[]
  onSelect: (value: string, label: string) => void
  disabled?: boolean
  multiple?: boolean
  selectedValues?: string[]
  onNext?: () => void
  canGoBack?: boolean
  onGoBack?: () => void
  isCompleted?: boolean
  completedValue?: string
  onRedo?: () => void
  showRedo?: boolean
}

export function ChoiceButtons({ 
  choices, 
  onSelect, 
  disabled = false, 
  multiple = false, 
  selectedValues = [], 
  onNext,
  canGoBack = false,
  onGoBack,
  isCompleted = false,
  completedValue = '',
  onRedo,
  showRedo = false
}: ChoiceButtonsProps) {
  return (
    <div className="space-y-3 mb-6">
      {/* やり直しオプション */}
      {showRedo && onRedo && (
        <button
          onClick={onRedo}
          className="w-full text-left p-3 rounded-xl border border-dashed transition-all duration-200 bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🔄</span>
            <span className="text-sm font-medium">この回答をやり直す</span>
          </div>
        </button>
      )}
      
      {/* 戻るオプション */}
      {canGoBack && onGoBack && !isCompleted && (
        <button
          onClick={onGoBack}
          disabled={disabled}
          className={`
            w-full text-left p-3 rounded-xl border border-dashed transition-all duration-200
            ${disabled 
              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">↑</span>
            <span className="text-sm font-medium">前の設問に回答し直す</span>
          </div>
        </button>
      )}
      
      {choices.map((choice) => {
        const isSelected = selectedValues.includes(choice.value)
        const isSelectedInCompleted = isCompleted && choice.value === completedValue
        
        return (
          <button
            key={choice.value}
            onClick={() => !isCompleted && onSelect(choice.value, choice.label)}
            disabled={disabled || isCompleted}
            className={`
              w-full text-left p-4 rounded-2xl border-2 transition-all duration-200
              ${isCompleted
                ? isSelectedInCompleted
                  ? 'bg-warm-coral-100 border-warm-coral-300 text-warm-coral-800'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
                : disabled 
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                  : isSelected
                    ? 'bg-deep-blue-100 border-deep-blue text-deep-blue-800'
                    : 'bg-white border-gray-200 hover:border-deep-blue hover:bg-deep-blue-50 focus:outline-none focus:ring-2 focus:ring-deep-blue focus:ring-offset-2'
              }
              ${isCompleted ? 'cursor-default' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              {choice.emoji && (
                <span className={`text-xl flex-shrink-0 mt-0.5 ${isCompleted && !isSelectedInCompleted ? 'opacity-50' : ''}`}>
                  {choice.emoji}
                </span>
              )}
              <div className="flex-1">
                <div className="font-medium mb-1">
                  {choice.label}
                  {multiple && isSelected && (
                    <span className="ml-2 text-deep-blue">✓</span>
                  )}
                  {isSelectedInCompleted && (
                    <span className="ml-2 text-warm-coral-600">✓ 選択済み</span>
                  )}
                </div>
                {choice.description && (
                  <div className={`text-sm leading-relaxed ${isCompleted && !isSelectedInCompleted ? 'opacity-50' : 'opacity-80'}`}>
                    {choice.description}
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
      
      {/* 複数選択の場合の「次へ」ボタン */}
      {multiple && selectedValues.length > 0 && onNext && !isCompleted && (
        <div className="pt-4">
          <button
            onClick={onNext}
            className="w-full bg-deep-blue text-white py-3 px-6 rounded-2xl font-medium hover:bg-deep-blue-600 transition-colors duration-200"
          >
            次へ進む
          </button>
        </div>
      )}
    </div>
  )
} 