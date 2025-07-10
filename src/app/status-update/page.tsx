'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { ChatMessage } from '@/components/check/ChatMessage'
import { ChoiceButtons } from '@/components/check/ChoiceButtons'

interface PreviousCheckData {
  id: string
  completed_at: string
  responses: any
  cancer_type?: string
  stage?: string
  treatment_status?: string
  concern_areas?: string[]
  feelings?: string[]
}

interface UpdateResponse {
  question: string
  type: 'treatment' | 'concerns' | 'feelings' | 'other'
  value: string
  label: string
  hasChange: boolean
}

export default function StatusUpdatePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [previousData, setPreviousData] = useState<PreviousCheckData | null>(null)
  const [currentStep, setCurrentStep] = useState<'loading' | 'welcome' | 'treatment' | 'concerns' | 'feelings' | 'summary' | 'complete'>('loading')
  const [messages, setMessages] = useState<Array<{sender: 'user' | 'sottori', message: string}>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [responses, setResponses] = useState<UpdateResponse[]>([])
  const [daysSinceLast, setDaysSinceLast] = useState<number>(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (user && !isInitialized) {
      loadPreviousData()
      setIsInitialized(true)
    }
  }, [user, loading, router, isInitialized])

  const loadPreviousData = async () => {
    try {
      // 前回のチェック履歴を取得
      const { getCheckHistories } = await import('@/lib/utils/dataHistory')
      const histories = await getCheckHistories(1) // 最新1件
      
      if (histories.length > 0) {
        const latest = histories[0]
        setPreviousData(latest)
        
        const lastDate = new Date(latest.completed_at)
        const days = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        setDaysSinceLast(days)
        
        setCurrentStep('welcome')
        setTimeout(() => {
          showWelcomeMessage(days, latest)
        }, 500)
      } else {
        // 前回データがない場合は通常のセルフチェックへ
        router.push('/yukkuri-check')
      }
    } catch (error) {
      console.error('前回データの読み込みエラー:', error)
      router.push('/yukkuri-check')
    }
  }

  const showWelcomeMessage = (days: number, data: PreviousCheckData) => {
    const welcomeMessage = `今日は、前回から変わったことがあるかをお聞きします。
変化のある部分だけ、簡潔にお答えください。`

    showTypingThenMessage(welcomeMessage, 1500)
    
    // 治療状況の質問へ進む
    setTimeout(() => {
      setCurrentStep('treatment')
      showTypingThenMessage('まず、治療の状況に変化はありましたか？', 1200)
    }, 3000)
  }

  const showTypingThenMessage = (message: string, delay: number = 1500) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { sender: 'sottori', message }])
    }, delay)
  }

  const handleChoice = (value: string, label: string) => {
    const currentQuestion = getCurrentQuestion()
    const currentType = getCurrentType()
    const hasChange = value !== 'no-change'
    
    const newResponse: UpdateResponse = {
      question: currentQuestion,
      type: currentType,
      value,
      label,
      hasChange
    }
    
    // 1. 即座に完了状態を設定（選択肢を非アクティブ化）
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    
    // 2. 即座にユーザーメッセージを表示
    setMessages(prev => [...prev, { sender: 'user', message: label }])
    
    // 3. 即座に回答を保存
    setResponses(prev => {
      const filtered = prev.filter(r => r.type !== currentType)
      return [...filtered, newResponse]
    })
    
    // 4. 次のステップへの移行処理（遅延）
    setTimeout(() => {
      if (currentStep === 'treatment') {
        setCurrentStep('concerns')
        setMessages(prev => [...prev, { 
          sender: 'sottori', 
          message: '前回と同様に、知りたいことに変化はありますか？' 
        }])
      } else if (currentStep === 'concerns') {
        setCurrentStep('feelings')
        setMessages(prev => [...prev, { 
          sender: 'sottori', 
          message: '最後に、お気持ちの変化はありますか？' 
        }])
      } else if (currentStep === 'feelings') {
        setCurrentStep('summary')
        const hasAnyChange = responses.some(r => r.hasChange) || hasChange
        setMessages(prev => [...prev, { 
          sender: 'sottori', 
          message: hasAnyChange 
            ? 'ありがとうございました。\n\n変化のあった内容を確認して、新しい情報をお届けします。' 
            : 'ありがとうございました。\n\n変化はないとのことですが、定期的な確認は大切です。'
        }])
      }
    }, 1000)
  }

  const getCurrentQuestion = (): string => {
    switch (currentStep) {
      case 'treatment': return '治療状況の変化'
      case 'concerns': return '新しい関心事項'
      case 'feelings': return '気持ちの変化'
      default: return ''
    }
  }

  const getCurrentType = (): UpdateResponse['type'] => {
    switch (currentStep) {
      case 'treatment': return 'treatment'
      case 'concerns': return 'concerns'
      case 'feelings': return 'feelings'
      default: return 'other'
    }
  }

  const proceedToNextStep = (hasChange: boolean) => {
    switch (currentStep) {
      case 'treatment':
        // treatmentを完了してから次へ
        setTimeout(() => {
          setCurrentStep('concerns')
          showTypingThenMessage('前回と同様に、知りたいことに変化はありますか？', 1200)
        }, 1500)
        break
        
      case 'concerns':
        // concernsを完了してから次へ
        setTimeout(() => {
          setCurrentStep('feelings')
          showTypingThenMessage('最後に、お気持ちの変化はいかがですか？', 1200)
        }, 1500)
        break
        
      case 'feelings':
        // feelingsを完了してからサマリーへ
        setTimeout(() => {
          setCurrentStep('summary')
          showSummary()
        }, 1500)
        break
    }
  }

  const showSummary = () => {
    const changedItems = responses.filter(r => r.hasChange)
    
    if (changedItems.length === 0) {
      showTypingThenMessage('前回から大きな変化はないようですね。\n\n収集済みの情報を最新にアップデートして、お渡しします。', 1500)
    } else {
      const changesSummary = changedItems.map(r => `• ${r.question}: ${r.label}`).join('\n')
      showTypingThenMessage(`変化をお聞かせいただき、ありがとうございます。\n\n${changesSummary}\n\nこれらの変化を反映して、ロードマップを更新いたします。`, 1500)
    }
    
    setTimeout(() => {
      setCurrentStep('complete')
    }, 4000)
  }

  const handleComplete = async () => {
    try {
      // 状況更新を保存（簡単な実装）
      console.log('状況更新データ:', {
        user_id: user?.id,
        responses,
        completed_at: new Date().toISOString(),
        changes_count: responses.filter(r => r.hasChange).length
      })
      
      // ダッシュボードに戻る
      router.push('/dashboard')
    } catch (error) {
      console.error('状況更新の保存エラー:', error)
    }
  }

  const handleRedo = (step: string) => {
    // 該当ステップとそれ以降をクリア
    const stepOrder = ['treatment', 'concerns', 'feelings']
    const currentIndex = stepOrder.indexOf(step)
    
    if (currentIndex !== -1) {
      // 完了ステップから削除
      setCompletedSteps(prev => {
        const newSet = new Set(prev)
        stepOrder.slice(currentIndex).forEach(s => newSet.delete(s))
        return newSet
      })
      
      // 該当する回答をクリア
      const typesToClear = stepOrder.slice(currentIndex).map(s => {
        switch (s) {
          case 'treatment': return 'treatment'
          case 'concerns': return 'concerns'
          case 'feelings': return 'feelings'
          default: return 'other'
        }
      })
      
      setResponses(prev => prev.filter(r => !typesToClear.includes(r.type)))
      
      // ステップを戻す
      setCurrentStep(step as any)
    }
  }

  const handleGoBack = () => {
    if (currentStep === 'concerns') {
      setCurrentStep('treatment')
      setCompletedSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete('treatment')
        return newSet
      })
      setResponses(prev => prev.filter(r => r.type !== 'treatment'))
      setMessages(prev => prev.slice(0, -1)) // 最後のユーザーメッセージを削除
    } else if (currentStep === 'feelings') {
      setCurrentStep('concerns')
      setCompletedSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete('concerns')
        return newSet
      })
      setResponses(prev => prev.filter(r => r.type !== 'concerns'))
      setMessages(prev => prev.slice(0, -1))
    }
  }

  // 選択肢定義
  const treatmentChoices = [
    { value: 'no-change', label: '特に変わりありません', emoji: '😌' },
    { value: 'new-treatment', label: '治療方針が決まりました', emoji: '🎯' },
    { value: 'changed-hospital', label: '病院を変わりました', emoji: '🏥' },
    { value: 'stage-known', label: 'ステージが分かりました', emoji: '📋' },
    { value: 'surgery-scheduled', label: '手術の予定が決まりました', emoji: '🔬' },
    { value: 'treatment-started', label: '治療を開始しました', emoji: '💊' },
    { value: 'treatment-changed', label: '治療内容が変わりました', emoji: '🔄' },
    { value: 'side-effects', label: '副作用が出てきました', emoji: '😷' }
  ]

  const concernChoices = [
    { value: 'no-change', label: '特に変わりありません', emoji: '😌' },
    { value: 'treatment-flow', label: '治療の流れ', emoji: '📚' },
    { value: 'money', label: 'お金のこと', emoji: '💰' },
    { value: 'hospital-selection', label: '病院選び', emoji: '🏥' },
    { value: 'family-support', label: '家族のサポート', emoji: '👨‍👩‍👧‍👦' },
    { value: 'clinical-trials', label: '治験・臨床試験', emoji: '🧪' },
    { value: 'work-balance', label: '仕事との両立', emoji: '💼' },
    { value: 'side-effects-management', label: '副作用への対処', emoji: '🩺' },
    { value: 'second-opinion', label: 'セカンドオピニオン', emoji: '👩‍⚕️' }
  ]

  const feelingChoices = [
    { value: 'no-change', label: '特に変わりありません', emoji: '😌' },
    { value: 'more-positive', label: '前向きになれました', emoji: '😊' },
    { value: 'more-anxious', label: '不安が増しました', emoji: '😰' },
    { value: 'relieved', label: '安心できました', emoji: '😌' },
    { value: 'confused', label: '混乱しています', emoji: '🤷‍♀️' },
    { value: 'determined', label: '決意が固まりました', emoji: '💪' },
    { value: 'tired', label: '疲れを感じます', emoji: '😔' },
    { value: 'grateful', label: '感謝の気持ちです', emoji: '🙏' }
  ]

  const getChoicesForCurrentStep = () => {
    switch (currentStep) {
      case 'treatment': return treatmentChoices
      case 'concerns': return concernChoices
      case 'feelings': return feelingChoices
      default: return []
    }
  }

  const getCurrentStepResponse = () => {
    const currentType = getCurrentType()
    return responses.find(r => r.type === currentType)?.value || ''
  }

  if (loading || currentStep === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-peach-50 via-white to-deep-blue-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-blue-500 mx-auto"></div>
            <p className="mt-4 text-deep-blue-600">データを読み込んでいます...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-peach-50 via-white to-deep-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* チャットエリア */}
          <div className="bg-gray-50 rounded-3xl p-6 min-h-[500px]">
            <div className="space-y-4 mb-8">
              {messages.map((msg, index) => (
                <div key={index}>
                  <ChatMessage sender={msg.sender} message={msg.message} />
                  
                  {/* 各質問メッセージの直後に対応する選択肢を表示（選択済みの場合のみ） */}
                  {msg.sender === 'sottori' && msg.message.includes('治療の状況に変化はありましたか？') && completedSteps.has('treatment') && (
                    <div className="mt-4">
                      <ChoiceButtons
                        choices={treatmentChoices}
                        onSelect={() => {}} // 選択済みなので無効化
                        disabled={true}
                        isCompleted={true}
                        completedValue={responses.find(r => r.type === 'treatment')?.value || ''}
                        showRedo={currentStep !== 'treatment'}
                        onRedo={() => handleRedo('treatment')}
                      />
                    </div>
                  )}
                  
                  {msg.sender === 'sottori' && msg.message.includes('知りたいことに変化はありますか？') && completedSteps.has('concerns') && (
                    <div className="mt-4">
                      <ChoiceButtons
                        choices={concernChoices}
                        onSelect={() => {}} // 選択済みなので無効化
                        disabled={true}
                        isCompleted={true}
                        completedValue={responses.find(r => r.type === 'concerns')?.value || ''}
                        showRedo={currentStep !== 'concerns'}
                        onRedo={() => handleRedo('concerns')}
                      />
                    </div>
                  )}
                  
                  {msg.sender === 'sottori' && msg.message.includes('お気持ちの変化はありますか？') && completedSteps.has('feelings') && (
                    <div className="mt-4">
                      <ChoiceButtons
                        choices={feelingChoices}
                        onSelect={() => {}} // 選択済みなので無効化
                        disabled={true}
                        isCompleted={true}
                        completedValue={responses.find(r => r.type === 'feelings')?.value || ''}
                        showRedo={currentStep !== 'feelings'}
                        onRedo={() => handleRedo('feelings')}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && <ChatMessage sender="sottori" message="" isTyping={true} />}
            </div>

            {/* 現在アクティブな選択肢のみ表示 */}
            {/* 治療状況の選択肢 */}
            {currentStep === 'treatment' && !isTyping && messages.length >= 2 && (
              <ChoiceButtons
                choices={treatmentChoices}
                onSelect={handleChoice}
                disabled={isTyping}
                isCompleted={completedSteps.has('treatment')}
                completedValue={responses.find(r => r.type === 'treatment')?.value || ''}
                canGoBack={false}
              />
            )}

            {/* 関心事の選択肢 */}
            {currentStep === 'concerns' && !isTyping && (
              <ChoiceButtons
                choices={concernChoices}
                onSelect={handleChoice}
                disabled={isTyping}
                isCompleted={completedSteps.has('concerns')}
                completedValue={responses.find(r => r.type === 'concerns')?.value || ''}
                canGoBack={true}
                onGoBack={handleGoBack}
              />
            )}

            {/* 気持ちの選択肢 */}
            {currentStep === 'feelings' && !isTyping && (
              <ChoiceButtons
                choices={feelingChoices}
                onSelect={handleChoice}
                disabled={isTyping}
                isCompleted={completedSteps.has('feelings')}
                completedValue={responses.find(r => r.type === 'feelings')?.value || ''}
                canGoBack={true}
                onGoBack={handleGoBack}
              />
            )}

            {/* 完了画面 */}
            {currentStep === 'complete' && (
              <div className="text-center space-y-6">
                <div className="bg-deep-blue-50 p-6 rounded-2xl">
                  <h2 className="text-xl font-bold text-deep-blue-800 mb-2">
                    状況更新が完了しました
                  </h2>
                  <p className="text-deep-blue-600">
                    最新の情報でロードマップを更新いたします
                  </p>
                </div>
                
                <Button 
                  onClick={handleComplete}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  ダッシュボードに戻る
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 