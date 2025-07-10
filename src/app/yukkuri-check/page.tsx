'use client'

import React, { useState, useEffect } from 'react'
import { ChatMessage } from '@/components/check/ChatMessage'
import { ChoiceButtons } from '@/components/check/ChoiceButtons'

type Step = 'welcome' | 'question1' | 'question2' | 'question3' | 'question4' | 'question5' | 'result'

export default function YukkuriCheckPage() {
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<{
    step1?: { value: string; label: string }
    step2?: { value: string; label: string }
    step3?: { value: string; label: string }
    step4?: { value: string; label: string }[]
    step5?: { value: string; label: string }[]
  }>({})
  const [messages, setMessages] = useState<Array<{ sender: 'sottori' | 'user'; message: string }>>([])
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set())

  // 各ステップの選択肢（設計書から）
  const step1Choices = [
    {
      value: 'diagnosed_recently',
      label: '診断されたばかり',
      description: 'がんと確定診断され、これから詳しい検査を受ける',
      emoji: '📋'
    },
    {
      value: 'detailed_examination',
      label: '詳しい検査中',
      description: 'ステージや転移の有無を調べている段階',
      emoji: '🔍'
    },
    {
      value: 'treatment_consultation',
      label: '治療方針の相談中',
      description: '検査結果が出て、治療選択肢を検討している',
      emoji: '👨‍⚕️'
    },
    {
      value: 'second_opinion',
      label: 'セカンドオピニオンを検討',
      description: '他の病院での意見も聞きたいと思っている',
      emoji: '🏥'
    },
    {
      value: 'not_sure',
      label: 'よくわからない',
      description: '説明が難しくて、今どの段階かわからない',
      emoji: '🤷‍♀️'
    }
  ]

  const step2Choices = [
    { value: 'lung_cancer', label: '肺がん', emoji: '🫁' },
    { value: 'breast_cancer', label: '乳がん', emoji: '🎀' },
    { value: 'colorectal_cancer', label: '大腸がん', emoji: '🦴' },
    { value: 'stomach_cancer', label: '胃がん', emoji: '🔴' },
    { value: 'liver_cancer', label: '肝臓がん', emoji: '🫀' },
    { value: 'pancreatic_cancer', label: '膵臓がん', emoji: '🟡' },
    { value: 'prostate_cancer', label: '前立腺がん', emoji: '👁️' },
    { value: 'gynecologic_cancer', label: '子宮がん・卵巣がん', emoji: '🩺' },
    { value: 'brain_tumor', label: '脳腫瘍', emoji: '🧠' },
    { value: 'blood_cancer', label: '血液のがん', description: '白血病・リンパ腫・骨髄腫など', emoji: '🩸' },
    { value: 'other_cancer', label: 'その他のがん', description: '上記にない部位のがん', emoji: '👥' },
    { value: 'not_clear', label: 'まだはっきりしない', description: '検査中・説明が難しい・複数の可能性', emoji: '🤷‍♀️' }
  ]

  const step3Choices = [
    { value: 'hokkaido', label: '北海道', emoji: '🗾' },
    { value: 'tohoku', label: '東北地方', emoji: '🗾' },
    { value: 'kanto', label: '関東地方', emoji: '🗾' },
    { value: 'chubu', label: '中部地方', emoji: '🗾' },
    { value: 'kansai', label: '関西地方', emoji: '🗾' },
    { value: 'chugoku', label: '中国地方', emoji: '🗾' },
    { value: 'shikoku', label: '四国地方', emoji: '🗾' },
    { value: 'kyushu', label: '九州・沖縄地方', emoji: '🗾' },
    { value: 'overseas', label: '海外在住', emoji: '🌏' },
    { value: 'no_answer', label: '答えたくない', emoji: '🤷‍♀️' }
  ]

  const step4Choices = [
    { value: 'treatment_flow', label: '治療の流れ', description: 'どんな治療があるか、期間はどれくらいか', emoji: '📚' },
    { value: 'money', label: 'お金のこと', description: '治療費、保険、助成制度について', emoji: '💰' },
    { value: 'hospital_selection', label: '病院選び', description: '専門医、セカンドオピニオン、アクセス情報', emoji: '🏥' },
    { value: 'family_support', label: '家族のサポート', description: 'どう説明するか、どう支えてもらうか', emoji: '👨‍👩‍👧‍👦' },
    { value: 'clinical_trials', label: '治験・臨床試験', description: '新しい治療の可能性について', emoji: '🧪' },
    { value: 'work_balance', label: '仕事との両立', description: '休職、復職、働き方の調整について', emoji: '💼' },
    { value: 'dont_know', label: '何を知りたいかもわからない', description: '今の状況では判断がつかない', emoji: '🤷‍♀️' }
  ]

  const step5Choices = [
    { value: 'anxious', label: '不安で眠れない', description: '将来への心配、恐怖感が強い', emoji: '😰' },
    { value: 'want_information', label: '情報を集めたい', description: 'とにかく調べて理解したい', emoji: '🤔' },
    { value: 'family_consultation', label: '家族と相談したい', description: '一人で決められない、支えが必要', emoji: '👨‍👩‍👧‍👦' },
    { value: 'positive', label: '前向きに取り組みたい', description: '治療に向けて準備したい', emoji: '😤' },
    { value: 'cant_accept', label: 'まだ受け入れられない', description: '現実感がない、混乱している', emoji: '😞' },
    { value: 'want_to_talk', label: '誰かに話を聞いてほしい', description: '気持ちを整理したい、相談したい', emoji: '🤝' },
    { value: 'tired', label: '疲れている', description: '身体的・精神的に疲れを感じている', emoji: '😔' },
    { value: 'confused', label: '自分でもよくわからない', description: '複雑な気持ちで言葉にできない', emoji: '🤷‍♀️' }
  ]

  // タイピング効果のヘルパー関数
  const showTypingThenMessage = (message: string, delay: number = 1500) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('タイピング開始:', { 
        currentStep, 
        delay,
        message: message.substring(0, 30) + '...',
        timestamp: new Date().toLocaleTimeString()
      })
    }
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => {
        const newMessages = [...prev, { sender: 'sottori' as const, message }]
        if (process.env.NODE_ENV === 'development') {
          console.log('メッセージ追加:', { 
            messageCount: newMessages.length, 
            currentStep, 
            message: message.substring(0, 30) + '...',
            timestamp: new Date().toLocaleTimeString()
          })
        }
        return newMessages
      })
    }, delay)
  }

  // 初期化フラグ
  const [isInitialized, setIsInitialized] = useState(false)

  // 初期化
  useEffect(() => {
    // 初期化が既に実行されているかチェック
    if (isInitialized) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('初期化開始:', { 
        messagesLength: messages.length, 
        isInitialized,
        timestamp: new Date().toLocaleTimeString()
      })
    }
    
    setIsInitialized(true)
    
    // 最初の挨拶メッセージ
    showTypingThenMessage(
      'こんにちは。sottoriです。\n\n今日はお疲れさまでした。\n少しお話ししませんか？',
      1500
    )

    // 安心メッセージ（最初のメッセージ表示後、2秒後に開始）
    const welcomeTimeoutId = setTimeout(() => {
      showTypingThenMessage(
        '無理をする必要はありません。\n途中で止めてもOKです。\n\nあなたのペースで、大丈夫です。',
        1200
      )
    }, 2000)

    // 質問への移行（安心メッセージ表示後、1.5秒後）
    const transitionTimeoutId = setTimeout(() => {
      // 先にタイピング状態を設定してからステップを変更
      setIsTyping(true)
      setTimeout(() => {
        setCurrentStep('question1')
      }, 0)
    }, 4700)
    
    const questionTimeoutId = setTimeout(() => {
      showTypingThenMessage(
        '今、どんな状況でしょうか？\n\nだいたいで構いませんので、教えてください。',
        1200
      )
    }, 5000)
    
    // クリーンアップ
    return () => {
      clearTimeout(welcomeTimeoutId)
      clearTimeout(transitionTimeoutId)
      clearTimeout(questionTimeoutId)
    }
  }, [])

  const handleChoice = (value: string, label: string, isMultiple = false) => {
    // 回答を保存（即座に実行してUIに反映）
    if (currentStep === 'question1') {
      setSelectedAnswers(prev => ({ ...prev, step1: { value, label } }))
      setCompletedSteps(prev => new Set([...prev, 'question1']))
      
      // 単一選択なので即座にユーザーメッセージを表示
      setMessages(prev => [...prev, { sender: 'user', message: label }])
      
      // Step2への移行
      setTimeout(() => {
        showTypingThenMessage(
          'ありがとうございます。\n\n「わからない」も大切な情報です。\n医療の専門用語は難しいので、無理をしなくて大丈夫です。',
          1500
        )
      }, 1000)

      setTimeout(() => {
        // 先にタイピング状態を設定してからステップを変更
        setIsTyping(true)
        setTimeout(() => {
          setCurrentStep('question2')
          showTypingThenMessage(
            'どちらの部位のがんと診断されましたか？\n\nまだ検査中の場合は、疑われている部位で構いません。',
            1500
          )
        }, 0)
      }, 4000)
      
    } else if (currentStep === 'question2') {
      setSelectedAnswers(prev => ({ ...prev, step2: { value, label } }))
      setCompletedSteps(prev => new Set([...prev, 'question2']))
      
      // 単一選択なので即座にユーザーメッセージを表示
      setMessages(prev => [...prev, { sender: 'user', message: label }])
      
      setTimeout(() => {
        showTypingThenMessage(
          'がんの種類によって治療法や情報が変わります。\n正確でなくても、今わかる範囲で大丈夫です。',
          1500
        )
      }, 1000)

      setTimeout(() => {
        // 先にタイピング状態を設定してからステップを変更
        setIsTyping(true)
        setTimeout(() => {
          setCurrentStep('question3')
          showTypingThenMessage(
            'どちらの地域にお住まいでしょうか？\n\nお住まいの地域に合わせて、病院や制度の情報をお伝えできます。',
            1500
          )
        }, 0)
      }, 4000)
      
    } else if (currentStep === 'question3') {
      setSelectedAnswers(prev => ({ ...prev, step3: { value, label } }))
      setCompletedSteps(prev => new Set([...prev, 'question3']))
      
      // 単一選択なので即座にユーザーメッセージを表示
      setMessages(prev => [...prev, { sender: 'user', message: label }])
      
      setTimeout(() => {
        showTypingThenMessage(
          '地域情報は病院検索や助成制度のご案内に使用します。\n詳細な住所は必要ありません。',
          1500
        )
      }, 1000)

      setTimeout(() => {
        // 先にタイピング状態を設定してからステップを変更
        setIsTyping(true)
        setTimeout(() => {
          setCurrentStep('question4')
          showTypingThenMessage(
            '今、一番知りたいのはどんなことでしょうか？\n\n複数選んでいただいても構いません。',
            1500
          )
        }, 0)
      }, 4000)
      
    } else if (currentStep === 'question4') {
      // 複数選択の場合は選択状態を切り替える（選択済みなら削除、未選択なら追加）
      setSelectedAnswers(prev => {
        const currentStep4 = prev.step4 || []
        const isAlreadySelected = currentStep4.some(item => item.value === value)
        
        if (isAlreadySelected) {
          // 既に選択されている場合は削除
          return {
            ...prev,
            step4: currentStep4.filter(item => item.value !== value)
          }
        } else {
          // 未選択の場合は追加
          return {
            ...prev,
            step4: [...currentStep4, { value, label }]
          }
        }
      })
      
    } else if (currentStep === 'question5') {
      // 複数選択の場合は選択状態を切り替える（選択済みなら削除、未選択なら追加）
      setSelectedAnswers(prev => {
        const currentStep5 = prev.step5 || []
        const isAlreadySelected = currentStep5.some(item => item.value === value)
        
        if (isAlreadySelected) {
          // 既に選択されている場合は削除
          return {
            ...prev,
            step5: currentStep5.filter(item => item.value !== value)
          }
        } else {
          // 未選択の場合は追加
          return {
            ...prev,
            step5: [...currentStep5, { value, label }]
          }
        }
      })
    }
  }

  const handleMultipleChoiceNext = () => {
    if (currentStep === 'question4') {
      setCompletedSteps(prev => new Set([...prev, 'question4']))
      
      // 選択した項目をユーザーメッセージとして表示
      const selectedLabels = selectedAnswers.step4?.map(a => a.label).join(', ') || ''
      setMessages(prev => [...prev, { sender: 'user', message: selectedLabels }])
      
      setTimeout(() => {
        showTypingThenMessage(
          'すべてを一度に理解する必要はありません。\n今気になることから、一つずつ整理していきましょう。',
          1500
        )
      }, 500)

      setTimeout(() => {
        // 先にタイピング状態を設定してからステップを変更
        setIsTyping(true)
        setTimeout(() => {
          setCurrentStep('question5')
          showTypingThenMessage(
            '最後に、今のお気持ちはいかがですか？\n\nどんな気持ちでも大丈夫です。正直な気持ちを教えてください。',
            1500
          )
        }, 0)
      }, 3000)
      
    } else if (currentStep === 'question5') {
      setCompletedSteps(prev => new Set([...prev, 'question5']))
      
      // 選択した項目をユーザーメッセージとして表示
      const selectedLabels = selectedAnswers.step5?.map(a => a.label).join(', ') || ''
      setMessages(prev => [...prev, { sender: 'user', message: selectedLabels }])
      
      setTimeout(() => {
        showTypingThenMessage(
          'どんな気持ちも自然なことです。\n不安や混乱を感じるのは当然のことです。一人じゃありません。',
          1500
        )
      }, 500)

      setTimeout(() => {
        // 先にタイピング状態を設定してからステップを変更
        setIsTyping(true)
        setTimeout(() => {
          setCurrentStep('result')
          showTypingThenMessage(
            'お疲れさまでした。\n\nいただいた情報をもとに、あなたにぴったりの情報をご用意します。',
            1500
          )
        }, 0)
      }, 3000)
    }
  }

  // やり直し機能を追加
  const handleRedo = (step: Step) => {
    // 該当ステップとそれ以降の完了状態をリセット
    const stepOrder: Step[] = ['question1', 'question2', 'question3', 'question4', 'question5']
    const stepIndex = stepOrder.indexOf(step)
    
    if (stepIndex !== -1) {
      // 該当ステップ以降の完了状態をクリア
      const newCompletedSteps = new Set(completedSteps)
      for (let i = stepIndex; i < stepOrder.length; i++) {
        newCompletedSteps.delete(stepOrder[i])
      }
      setCompletedSteps(newCompletedSteps)
      
      // 該当ステップに戻る
      setCurrentStep(step)
      
      // 該当ステップ以降の選択状態をクリア
      setSelectedAnswers(prev => {
        const newAnswers = { ...prev }
        if (stepIndex <= 0) delete newAnswers.step1
        if (stepIndex <= 1) delete newAnswers.step2
        if (stepIndex <= 2) delete newAnswers.step3
        if (stepIndex <= 3) delete newAnswers.step4
        if (stepIndex <= 4) delete newAnswers.step5
        return newAnswers
      })
      
      // 該当ステップ以降のメッセージを削除
      // これは複雑なので、シンプルに現在のメッセージを保持
    }
  }

  // 戻る機能の実装
  const handleGoBack = () => {
    if (currentStep === 'question2') {
      setCurrentStep('question1')
      setSelectedAnswers(prev => ({ ...prev, step1: undefined }))
      // 最後のユーザーメッセージを削除
      setMessages(prev => prev.slice(0, -1))
    } else if (currentStep === 'question3') {
      setCurrentStep('question2')
      setSelectedAnswers(prev => ({ ...prev, step2: undefined }))
      setMessages(prev => prev.slice(0, -1))
    } else if (currentStep === 'question4') {
      setCurrentStep('question3')
      setSelectedAnswers(prev => ({ ...prev, step3: undefined }))
      setMessages(prev => prev.slice(0, -1))
    } else if (currentStep === 'question5') {
      setCurrentStep('question4')
      setSelectedAnswers(prev => ({ ...prev, step4: undefined }))
      setMessages(prev => prev.slice(0, -1))
    }
  }

  // 編集機能の実装
  const handleEdit = (messageIndex: number) => {
    // メッセージのインデックスから対応するステップを特定して戻る処理を実行
    const userMessages = messages.filter(msg => msg.sender === 'user')
    const userMessageCount = userMessages.length
    
    if (messageIndex < userMessageCount) {
      const targetStep = messageIndex + 1 // 1から始まるステップ番号
      
      if (targetStep === 1) {
        setCurrentStep('question1')
        setSelectedAnswers(prev => ({ ...prev, step1: undefined }))
        setMessages(prev => prev.slice(0, 3)) // 最初の3つのメッセージまで残す
      } else if (targetStep === 2) {
        setCurrentStep('question2')
        setSelectedAnswers(prev => ({ ...prev, step2: undefined }))
        setMessages(prev => prev.slice(0, 4))
      } else if (targetStep === 3) {
        setCurrentStep('question3')
        setSelectedAnswers(prev => ({ ...prev, step3: undefined }))
        setMessages(prev => prev.slice(0, 5))
      } else if (targetStep === 4) {
        setCurrentStep('question4')
        setSelectedAnswers(prev => ({ ...prev, step4: undefined }))
        setMessages(prev => prev.slice(0, 6))
      } else if (targetStep === 5) {
        setCurrentStep('question5')
        setSelectedAnswers(prev => ({ ...prev, step5: undefined }))
        setMessages(prev => prev.slice(0, 7))
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-peach-50 via-white to-deep-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light text-deep-blue mb-2">
              ゆっくりセルフチェック
            </h1>
            <p className="text-gray-600 text-sm">
              迷っても、頼ってもいい。次の一歩は、あなたのペースで。
            </p>
          </div>

          {/* チャットエリア */}
          <div className="bg-gray-50 rounded-3xl p-6 min-h-[500px]">
            {/* メッセージ履歴 */}
            <div className="space-y-4 mb-6">
              {messages.map((msg, index) => (
                <div key={index} className="flex">
                  <div className={`max-w-[85%] ${msg.sender === 'user' ? 'ml-auto' : ''}`}>
                    <ChatMessage
                      sender={msg.sender}
                      message={msg.message}
                      isTyping={false}
                    />
                    
                    {/* 選択済み選択肢をメッセージの直後に表示（1度だけ） */}
                    {/* Step1: question1の後 */}
                    {msg.sender === 'sottori' && 
                     msg.message.includes('今、どんな状況でしょうか？') && 
                     selectedAnswers.step1 && (
                      <div className="mt-4">
                        <ChoiceButtons
                          choices={step1Choices}
                          onSelect={() => {}}
                          disabled={true}
                          selectedValues={[selectedAnswers.step1.value]}
                        />
                      </div>
                    )}
                    
                    {/* Step2: question2の後 */}
                    {msg.sender === 'sottori' && 
                     msg.message.includes('どちらの部位のがんと診断されましたか？') && 
                     selectedAnswers.step2 && (
                      <div className="mt-4">
                        <ChoiceButtons
                          choices={step2Choices}
                          onSelect={() => {}}
                          disabled={true}
                          selectedValues={[selectedAnswers.step2.value]}
                        />
                      </div>
                    )}
                    
                    {/* Step3: question3の後 */}
                    {msg.sender === 'sottori' && 
                     msg.message.includes('どちらの地域にお住まいでしょうか？') && 
                     selectedAnswers.step3 && (
                      <div className="mt-4">
                        <ChoiceButtons
                          choices={step3Choices}
                          onSelect={() => {}}
                          disabled={true}
                          selectedValues={[selectedAnswers.step3.value]}
                        />
                      </div>
                    )}
                    
                    {/* Step4: question4の後 */}
                    {msg.sender === 'sottori' && 
                     msg.message.includes('今、一番知りたいのはどんなことでしょうか？') && 
                     selectedAnswers.step4 && 
                     selectedAnswers.step4.length > 0 && (
                      <div className="mt-4">
                        <ChoiceButtons
                          choices={step4Choices}
                          onSelect={() => {}}
                          disabled={true}
                          multiple={true}
                          selectedValues={selectedAnswers.step4.map(a => a.value)}
                        />
                      </div>
                    )}
                    
                    {/* Step5: question5の後 */}
                    {msg.sender === 'sottori' && 
                     msg.message.includes('最後に、今のお気持ちはいかがですか？') && 
                     selectedAnswers.step5 && 
                     selectedAnswers.step5.length > 0 && (
                      <div className="mt-4">
                        <ChoiceButtons
                          choices={step5Choices}
                          onSelect={() => {}}
                          disabled={true}
                          multiple={true}
                          selectedValues={selectedAnswers.step5.map(a => a.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* タイピング中の表示 */}
              {isTyping && (
                <ChatMessage
                  sender="sottori"
                  message=""
                  isTyping={true}
                />
              )}
            </div>

            {/* アクティブな選択肢（現在のステップでのみ表示） */}
            {/* デバッグ情報 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
                <div>Debug: currentStep={currentStep}, isTyping={isTyping}, messages.length={messages.length}</div>
                <div>isInitialized={isInitialized.toString()}</div>
                <div>Messages: {JSON.stringify(messages.map(m => ({ sender: m.sender, preview: m.message.substring(0, 20) + '...' })))}</div>
              </div>
            )}
            
            {/* 質問1の選択肢 */}
            {currentStep === 'question1' && !isTyping && messages.length >= 3 && !selectedAnswers.step1 && (
              <ChoiceButtons
                choices={step1Choices}
                onSelect={handleChoice}
                canGoBack={false}
              />
            )}
            
            {/* 質問2の選択肢 */}
            {currentStep === 'question2' && !isTyping && messages.length >= 4 && !selectedAnswers.step2 && (
              <ChoiceButtons
                choices={step2Choices}
                onSelect={handleChoice}
                canGoBack={true}
                onGoBack={handleGoBack}
              />
            )}
            
            {/* 質問3の選択肢 */}
            {currentStep === 'question3' && !isTyping && messages.length >= 5 && !selectedAnswers.step3 && (
              <ChoiceButtons
                choices={step3Choices}
                onSelect={handleChoice}
                canGoBack={true}
                onGoBack={handleGoBack}
              />
            )}
            
            {/* 質問4の選択肢 */}
            {currentStep === 'question4' && !isTyping && messages.length >= 6 && (
              <ChoiceButtons
                choices={step4Choices}
                onSelect={handleChoice}
                multiple={true}
                selectedValues={selectedAnswers.step4?.map(a => a.value) || []}
                onNext={handleMultipleChoiceNext}
                canGoBack={true}
                onGoBack={handleGoBack}
              />
            )}
            
            {/* 質問5の選択肢 */}
            {currentStep === 'question5' && !isTyping && messages.length >= 7 && (
              <ChoiceButtons
                choices={step5Choices}
                onSelect={handleChoice}
                multiple={true}
                selectedValues={selectedAnswers.step5?.map(a => a.value) || []}
                onNext={handleMultipleChoiceNext}
                canGoBack={true}
                onGoBack={handleGoBack}
              />
            )}

            {/* 結果画面でのアクション */}
            {currentStep === 'result' && !isTyping && (
              <div className="text-center mt-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <p className="text-gray-600 mb-4">
                    5つの質問が完了しました！
                  </p>
                  <div className="text-sm text-gray-500 text-left space-y-2 mb-6">
                    <p><strong>あなたの回答:</strong></p>
                    {selectedAnswers.step1 && <p>• 現在の状況: {selectedAnswers.step1.label}</p>}
                    {selectedAnswers.step2 && <p>• がんの種類: {selectedAnswers.step2.label}</p>}
                    {selectedAnswers.step3 && <p>• お住まいの地域: {selectedAnswers.step3.label}</p>}
                    {selectedAnswers.step4 && <p>• 知りたいこと: {selectedAnswers.step4.map(a => a.label).join(', ')}</p>}
                    {selectedAnswers.step5 && <p>• 今のお気持ち: {selectedAnswers.step5.map(a => a.label).join(', ')}</p>}
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6">
                    これらの情報を基に、あなた専用のガイドを作成します。
                  </p>
                  
                  {/* 次のステップボタン */}
                  <button
                    onClick={async () => {
                      // 回答をローカルストレージに保存
                      localStorage.setItem('yukkuri-check-responses', JSON.stringify(selectedAnswers))
                      
                      // データベースにチェック履歴を保存し、そのIDを取得
                      let checkHistoryId = null
                      try {
                        const { saveCheckHistory } = await import('@/lib/utils/dataHistory')
                        const checkHistory = await saveCheckHistory(selectedAnswers)
                        checkHistoryId = checkHistory.id
                        
                        // チェック履歴IDをローカルストレージに保存
                        localStorage.setItem('current-check-history-id', checkHistoryId.toString())
                      } catch (error) {
                        console.error('チェック履歴の保存に失敗しました:', error)
                      }
                      
                      // ロードマップページに遷移（新規生成モード）
                      window.location.href = '/roadmap?mode=generate'
                    }}
                    className="w-full bg-gradient-to-r from-warm-coral-400 to-warm-coral-500 text-white py-4 px-6 rounded-2xl font-medium hover:from-warm-coral-500 hover:to-warm-coral-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    🗺️ あなた専用ガイドを見る
                  </button>
                  
                  <p className="text-xs text-gray-400 mt-3">
                    ※ 3分程度でお読みいただけます
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* プログレス表示 */}
          <div className="mt-6 text-center">
            <div className="flex justify-center items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${['question1', 'question2', 'question3', 'question4', 'question5', 'result'].includes(currentStep) ? 'bg-deep-blue' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-0.5 ${['question2', 'question3', 'question4', 'question5', 'result'].includes(currentStep) ? 'bg-deep-blue' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${['question2', 'question3', 'question4', 'question5', 'result'].includes(currentStep) ? 'bg-deep-blue' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-0.5 ${['question3', 'question4', 'question5', 'result'].includes(currentStep) ? 'bg-deep-blue' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${['question3', 'question4', 'question5', 'result'].includes(currentStep) ? 'bg-deep-blue' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-0.5 ${['question4', 'question5', 'result'].includes(currentStep) ? 'bg-deep-blue' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${['question4', 'question5', 'result'].includes(currentStep) ? 'bg-deep-blue' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-0.5 ${['question5', 'result'].includes(currentStep) ? 'bg-deep-blue' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${['question5', 'result'].includes(currentStep) ? 'bg-deep-blue' : 'bg-gray-300'}`}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {currentStep === 'welcome' ? 'Step 0 / 5' :
               currentStep === 'question1' ? 'Step 1 / 5' :
               currentStep === 'question2' ? 'Step 2 / 5' :
               currentStep === 'question3' ? 'Step 3 / 5' :
               currentStep === 'question4' ? 'Step 4 / 5' :
               currentStep === 'question5' ? 'Step 5 / 5' :
               'Complete!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 