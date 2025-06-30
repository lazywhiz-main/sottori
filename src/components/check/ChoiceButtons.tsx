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
}

export function ChoiceButtons({ 
  choices, 
  onSelect, 
  disabled = false, 
  multiple = false, 
  selectedValues = [], 
  onNext 
}: ChoiceButtonsProps) {
  return (
    <div className="space-y-3 mb-6">
      {choices.map((choice) => {
        const isSelected = selectedValues.includes(choice.value)
        
        return (
          <button
            key={choice.value}
            onClick={() => onSelect(choice.value, choice.label)}
            disabled={disabled}
            className={`
              w-full text-left p-4 rounded-2xl border-2 transition-all duration-200
              ${disabled 
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                : isSelected
                  ? 'bg-deep-blue-100 border-deep-blue text-deep-blue-800'
                  : 'bg-white border-gray-200 hover:border-deep-blue hover:bg-deep-blue-50 focus:outline-none focus:ring-2 focus:ring-deep-blue focus:ring-offset-2'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {choice.emoji && (
                <span className="text-xl flex-shrink-0 mt-0.5">
                  {choice.emoji}
                </span>
              )}
              <div className="flex-1">
                <div className="font-medium mb-1">
                  {choice.label}
                  {multiple && isSelected && (
                    <span className="ml-2 text-deep-blue">✓</span>
                  )}
                </div>
                {choice.description && (
                  <div className="text-sm leading-relaxed opacity-80">
                    {choice.description}
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
      
      {/* 複数選択の場合の「次へ」ボタン */}
      {multiple && selectedValues.length > 0 && onNext && (
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