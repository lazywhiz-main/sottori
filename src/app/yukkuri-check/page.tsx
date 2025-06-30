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
      'こんにちは。Sottoriです。\n\n今日はお疲れさまでした。\n少しお話ししませんか？',
      1500
    )

    // 安心メッセージ（最初のメッセージ表示後、2秒後に開始）
    const timeoutId1 = setTimeout(() => {
      showTypingThenMessage(
        '無理をする必要はありません。\n途中で止めてもOKです。\n\nあなたのペースで、大丈夫です。',
        1200
      )
    }, 2000)

    // 質問への移行（安心メッセージ表示後、1.5秒後）
    const timeoutId2 = setTimeout(() => {
      setCurrentStep('question1')
    }, 4700)
    
    const timeoutId3 = setTimeout(() => {
      showTypingThenMessage(
        '今、どんな状況でしょうか？\n\nだいたいで構いませんので、教えてください。',
        1200
      )
    }, 5000)
    
    // クリーンアップ
    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      clearTimeout(timeoutId3)
    }
  }, [])

  const handleChoice = (value: string, label: string, isMultiple = false) => {
    // 回答を保存
    if (currentStep === 'question1') {
      setSelectedAnswers(prev => ({ ...prev, step1: { value, label } }))
      
      // 単一選択なので即座にユーザーメッセージを表示して次へ進む
      setMessages(prev => [...prev, { sender: 'user', message: label }])
      
      // Step2への移行
      setTimeout(() => {
        showTypingThenMessage(
          'ありがとうございます。\n\n「わからない」も大切な情報です。\n医療の専門用語は難しいので、無理をしなくて大丈夫です。',
          1500
        )
      }, 1000)

      setTimeout(() => {
        setCurrentStep('question2')
        showTypingThenMessage(
          'どちらの部位のがんと診断されましたか？\n\nまだ検査中の場合は、疑われている部位で構いません。',
          1500
        )
      }, 4000)
      
    } else if (currentStep === 'question2') {
      setSelectedAnswers(prev => ({ ...prev, step2: { value, label } }))
      
      // 単一選択なので即座にユーザーメッセージを表示して次へ進む
      setMessages(prev => [...prev, { sender: 'user', message: label }])
      
      setTimeout(() => {
        showTypingThenMessage(
          'がんの種類によって治療法や情報が変わります。\n正確でなくても、今わかる範囲で大丈夫です。',
          1500
        )
      }, 1000)

      setTimeout(() => {
        setCurrentStep('question3')
        showTypingThenMessage(
          'どちらの地域にお住まいでしょうか？\n\nお住まいの地域に合わせて、病院や制度の情報をお伝えできます。',
          1500
        )
      }, 4000)
      
    } else if (currentStep === 'question3') {
      setSelectedAnswers(prev => ({ ...prev, step3: { value, label } }))
      
      // 単一選択なので即座にユーザーメッセージを表示して次へ進む
      setMessages(prev => [...prev, { sender: 'user', message: label }])
      
      setTimeout(() => {
        showTypingThenMessage(
          '地域情報は病院検索や助成制度のご案内に使用します。\n詳細な住所は必要ありません。',
          1500
        )
      }, 1000)

      setTimeout(() => {
        setCurrentStep('question4')
        showTypingThenMessage(
          '今、一番知りたいのはどんなことでしょうか？\n\n複数選んでいただいても構いません。',
          1500
        )
      }, 4000)
      
    } else if (currentStep === 'question4') {
      // 複数選択の場合は選択状態を更新するだけ（メッセージは追加しない）
      setSelectedAnswers(prev => ({ 
        ...prev, 
        step4: prev.step4 ? [...prev.step4, { value, label }] : [{ value, label }]
      }))
      
    } else if (currentStep === 'question5') {
      // 複数選択の場合は選択状態を更新するだけ（メッセージは追加しない）
      setSelectedAnswers(prev => ({ 
        ...prev, 
        step5: prev.step5 ? [...prev.step5, { value, label }] : [{ value, label }]
      }))
    }
  }

  const handleMultipleChoiceNext = () => {
    if (currentStep === 'question4') {
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
        setCurrentStep('question5')
        showTypingThenMessage(
          '最後に、今のお気持ちはいかがですか？\n\nどんな気持ちでも大丈夫です。正直な気持ちを教えてください。',
          1500
        )
      }, 3000)
      
    } else if (currentStep === 'question5') {
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
        setCurrentStep('result')
        showTypingThenMessage(
          'お疲れさまでした。\n\nあなたの状況とお気持ちを教えてくださり、ありがとうございました。\n\nこれからも、あなたのペースで一歩ずつ進んでいきましょう。',
          1500
        )
      }, 3000)
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
                <div key={index}>
                  <ChatMessage
                    sender={msg.sender}
                    message={msg.message}
                  />
                  
                  {/* 各質問メッセージの直後に対応する選択肢を表示（選択済みの場合のみ） */}
                  {msg.sender === 'sottori' && msg.message.includes('今、どんな状況でしょうか？') && selectedAnswers.step1 && (
                    <div className="mt-4">
                      <ChoiceButtons
                        choices={step1Choices}
                        onSelect={() => {}} // 選択済みなので無効化
                        disabled={true}
                        selectedValues={[selectedAnswers.step1.value]}
                      />
                    </div>
                  )}
                  
                  {msg.sender === 'sottori' && msg.message.includes('どちらの部位のがんと診断されましたか？') && selectedAnswers.step2 && (
                    <div className="mt-4">
                      <ChoiceButtons
                        choices={step2Choices}
                        onSelect={() => {}} // 選択済みなので無効化
                        disabled={true}
                        selectedValues={[selectedAnswers.step2.value]}
                      />
                    </div>
                  )}
                  
                  {msg.sender === 'sottori' && msg.message.includes('どちらの地域にお住まいでしょうか？') && selectedAnswers.step3 && (
                    <div className="mt-4">
                      <ChoiceButtons
                        choices={step3Choices}
                        onSelect={() => {}} // 選択済みなので無効化
                        disabled={true}
                        selectedValues={[selectedAnswers.step3.value]}
                      />
                    </div>
                  )}
                  
                  {msg.sender === 'sottori' && msg.message.includes('今、一番知りたいのはどんなことでしょうか？') && selectedAnswers.step4 && selectedAnswers.step4.length > 0 && currentStep !== 'question4' && (
                    <div className="mt-4">
                      <ChoiceButtons
                        choices={step4Choices}
                        onSelect={() => {}} // 選択済みなので無効化
                        disabled={true}
                        multiple={true}
                        selectedValues={selectedAnswers.step4.map(a => a.value)}
                      />
                    </div>
                  )}
                  
                  {msg.sender === 'sottori' && msg.message.includes('最後に、今のお気持ちはいかがですか？') && selectedAnswers.step5 && selectedAnswers.step5.length > 0 && currentStep !== 'question5' && (
                    <div className="mt-4">
                      <ChoiceButtons
                        choices={step5Choices}
                        onSelect={() => {}} // 選択済みなので無効化
                        disabled={true}
                        multiple={true}
                        selectedValues={selectedAnswers.step5.map(a => a.value)}
                      />
                    </div>
                  )}
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

            {/* 選択肢 */}
            {/* デバッグ情報 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
                <div>Debug: currentStep={currentStep}, isTyping={isTyping}, messages.length={messages.length}</div>
                <div>isInitialized={isInitialized.toString()}</div>
                <div>Messages: {JSON.stringify(messages.map(m => ({ sender: m.sender, preview: m.message.substring(0, 20) + '...' })))}</div>
              </div>
            )}
            
            {/* 現在アクティブなステップの選択肢のみ表示（未選択の場合のみ） */}
            {currentStep === 'question1' && !isTyping && messages.length >= 3 && !selectedAnswers.step1 && (
              <ChoiceButtons
                choices={step1Choices}
                onSelect={handleChoice}
              />
            )}
            
            {currentStep === 'question2' && !isTyping && messages.length >= 4 && !selectedAnswers.step2 && (
              <ChoiceButtons
                choices={step2Choices}
                onSelect={handleChoice}
              />
            )}
            
            {currentStep === 'question3' && !isTyping && messages.length >= 5 && !selectedAnswers.step3 && (
              <ChoiceButtons
                choices={step3Choices}
                onSelect={handleChoice}
              />
            )}
            
            {currentStep === 'question4' && !isTyping && messages.length >= 6 && (
              <ChoiceButtons
                choices={step4Choices}
                onSelect={handleChoice}
                multiple={true}
                selectedValues={selectedAnswers.step4?.map(a => a.value) || []}
                onNext={handleMultipleChoiceNext}
              />
            )}
            
            {currentStep === 'question5' && !isTyping && messages.length >= 7 && (
              <ChoiceButtons
                choices={step5Choices}
                onSelect={handleChoice}
                multiple={true}
                selectedValues={selectedAnswers.step5?.map(a => a.value) || []}
                onNext={handleMultipleChoiceNext}
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
                    onClick={() => {
                      // 回答をローカルストレージに保存
                      localStorage.setItem('yukkuri-check-responses', JSON.stringify(selectedAnswers))
                      // ロードマップページに遷移
                      window.location.href = '/roadmap'
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