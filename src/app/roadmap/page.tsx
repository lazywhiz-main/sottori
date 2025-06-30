'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import AIStatusIndicator from '@/components/ui/AIStatusIndicator'
import ShareSaveModal from '@/components/ui/ShareSaveModal'

interface UserResponses {
  step1?: { value: string; label: string }
  step2?: { value: string; label: string }
  step3?: { value: string; label: string }
  step4?: { value: string; label: string }[]
  step5?: { value: string; label: string }[]
}

interface RoadmapSection {
  id: string
  title: string
  icon: string
  content: string[]
  priority: number
}

export default function RoadmapPage() {
  const searchParams = useSearchParams()
  const [userResponses, setUserResponses] = useState<UserResponses>({})
  const [roadmapSections, setRoadmapSections] = useState<RoadmapSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [aiStatus, setAiStatus] = useState({
    aiGenerated: false,
    fallbackUsed: false,
    isAIEnabled: true
  })

  useEffect(() => {
    // URLパラメータまたはローカルストレージから回答を取得
    const responses = searchParams.get('responses')
    if (responses) {
      try {
        const parsedResponses = JSON.parse(decodeURIComponent(responses))
        setUserResponses(parsedResponses)
        generateRoadmap(parsedResponses)
      } catch (error) {
        console.error('Failed to parse responses:', error)
      }
    } else {
      // ローカルストレージから取得
      const storedResponses = localStorage.getItem('yukkuri-check-responses')
      if (storedResponses) {
        const parsedResponses = JSON.parse(storedResponses)
        setUserResponses(parsedResponses)
        generateRoadmap(parsedResponses)
      }
    }
  }, [searchParams])

  const generateRoadmap = async (responses: UserResponses) => {
    setIsLoading(true)
    
    try {
      // AI生成APIを呼び出し
      const response = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses }),
      })

      const data = await response.json()

      if (data.success) {
        setRoadmapSections(data.sections)
        
        // AI状態を更新
        setAiStatus({
          aiGenerated: data.aiGenerated || false,
          fallbackUsed: data.fallbackUsed || false,
          isAIEnabled: true
        })
        
        // AI生成の成功/失敗をログ出力
        if (data.aiGenerated) {
          console.log('✅ AI生成でロードマップを作成しました')
        } else if (data.fallbackUsed) {
          console.log('⚠️ AI生成に失敗したため、既存ロジックを使用しました')
        } else {
          console.log('ℹ️ AI機能が無効のため、既存ロジックを使用しました')
        }
      } else {
        console.error('ロードマップ生成エラー:', data.error)
        // フォールバック：クライアントサイドでの生成
        generateRoadmapFallback(responses)
      }
    } catch (error) {
      console.error('API呼び出しエラー:', error)
      // フォールバック：クライアントサイドでの生成
      generateRoadmapFallback(responses)
      setAiStatus({
        aiGenerated: false,
        fallbackUsed: true,
        isAIEnabled: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  // フォールバック用のクライアントサイド生成
  const generateRoadmapFallback = (responses: UserResponses) => {
    // 個別化ロジック：Step4の回答に基づいて優先度を決定
    const priorityMap: { [key: string]: number } = {
      'treatment_flow': 1,
      'money': 2,
      'hospital_selection': 3,
      'family_support': 4,
      'clinical_trials': 5,
      'work_balance': 6,
      'dont_know': 7
    }

    // Step5の回答に基づいて表示方法を調整
    const emotionalState = responses.step5?.map(r => r.value) || []
    const isAnxious = emotionalState.includes('anxious')
    const wantsInformation = emotionalState.includes('want_information')

    // 基本的なロードマップセクションを生成
    const sections: RoadmapSection[] = []

    // Step4で選択された項目に基づいてセクションを追加
    if (responses.step4) {
      responses.step4.forEach(interest => {
        const section = createSection(interest.value, responses, isAnxious, wantsInformation)
        if (section) {
          sections.push(section)
        }
      })
    }

    // 優先度でソート
    sections.sort((a, b) => a.priority - b.priority)

    setRoadmapSections(sections)
  }

  const createSection = (
    interestType: string, 
    responses: UserResponses, 
    isAnxious: boolean, 
    wantsInformation: boolean
  ): RoadmapSection | null => {
    const cancerType = responses.step2?.label || 'がん'
    const region = responses.step3?.label || 'お住まいの地域'

    switch (interestType) {
      case 'treatment_flow':
        return {
          id: 'treatment',
          title: '治療の流れ',
          icon: '📚',
          priority: 1,
          content: [
            `${cancerType}の標準的な治療の流れをご説明します。`,
            '診断確定 → 病期（ステージ）診断 → 治療方針決定 → 治療開始',
            isAnxious 
              ? '一つずつ段階を踏んで進みますので、焦る必要はありません。'
              : '各段階で主治医と十分に相談しながら進めていきます。',
            '治療期間は個人差がありますが、多くの場合は数ヶ月から1年程度です。',
            '※ これは一般的な情報です。詳細は必ず主治医にご相談ください。'
          ]
        }

      case 'money':
        return {
          id: 'money',
          title: 'お金のこと',
          icon: '💰',
          priority: 2,
          content: [
            `${cancerType}の治療にかかる費用の概算をお示しします。`,
            '高額療養費制度により、月の医療費負担には上限があります。',
            '年収約370万円以下の方：月額約57,600円',
            '年収約770万円以下の方：月額約80,100円',
            '医療費控除も活用できます（年間10万円超の医療費）。',
            `${region}の助成制度についても調べてみましょう。`,
            '※ 詳細な費用は治療内容により変わります。医療ソーシャルワーカーにもご相談ください。'
          ]
        }

      case 'hospital_selection':
        return {
          id: 'hospital',
          title: '病院選び',
          icon: '🏥',
          priority: 3,
          content: [
            `${region}の${cancerType}専門医療機関をご紹介します。`,
            'がん診療連携拠点病院は設備・人員が充実しています。',
            'セカンドオピニオンは患者さんの権利です。',
            '紹介状があると初診料の加算がありません。',
            'アクセスや家族の通いやすさも重要な要素です。',
            '※ 転院を急ぐ必要はありません。まずは主治医と相談してください。'
          ]
        }

      case 'family_support':
        return {
          id: 'family',
          title: '家族のサポート',
          icon: '👨‍👩‍👧‍👦',
          priority: 4,
          content: [
            '家族への説明と理解を深めるためのポイントをお伝えします。',
            '「一緒に治療に向き合う」という気持ちが大切です。',
            '家族も不安を感じるのは自然なことです。',
            '患者会や家族会での情報交換も有効です。',
            '介護保険や障害年金などの制度も確認しましょう。',
            '※ 家族の負担も考慮しながら、みんなで支え合っていきましょう。'
          ]
        }

      case 'clinical_trials':
        return {
          id: 'trials',
          title: '治験・臨床試験',
          icon: '🧪',
          priority: 5,
          content: [
            `${cancerType}に関する最新の治験・臨床試験情報をお調べします。`,
            '治験は新しい治療法の可能性を提供します。',
            '参加には厳格な条件があります。',
            '費用負担が軽減される場合があります。',
            'jRCT（臨床研究実施計画・研究概要公開システム）で検索できます。',
            '※ 参加を検討される場合は、主治医と十分にご相談ください。'
          ]
        }

      case 'work_balance':
        return {
          id: 'work',
          title: '仕事との両立',
          icon: '💼',
          priority: 6,
          content: [
            '治療と仕事の両立支援制度についてご案内します。',
            '傷病手当金（健康保険）で収入の3分の2が支給されます。',
            '職場での配慮（時短勤務、在宅勤務など）を相談しましょう。',
            '産業医や人事部との面談も活用してください。',
            '両立支援コーディネーターという専門職もいます。',
            '※ 無理をせず、体調を最優先に考えてください。'
          ]
        }

      default:
        return null
    }
  }

  const handleShare = () => {
    setIsShareModalOpen(true)
  }

  const handleSave = () => {
    setIsShareModalOpen(true)
  }

  // 共有・保存モーダル用のデータを準備
  const roadmapData = {
    title: `${userResponses.step2?.label || 'がん'}・${userResponses.step3?.label || 'お住まいの地域'}の方向け - あなた専用ガイド`,
    content: roadmapSections.map(section => `${section.title}: ${section.content.join(' ')}`).join('\n\n'),
    url: window.location.href,
    userResponses: userResponses
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-peach-50 via-white to-deep-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-deep-blue-200 border-t-deep-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-deep-blue-600">あなた専用ガイドを作成中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-peach-50 via-white to-deep-blue-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-light text-deep-blue-600">Sottori</h1>
              <span className="text-gray-400">|</span>
              <h2 className="text-lg text-gray-700">あなた専用ガイド</h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-warm-coral-100 text-warm-coral-700 rounded-lg hover:bg-warm-coral-200 transition-colors"
              >
                📤 家族と共有
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-deep-blue-100 text-deep-blue-700 rounded-lg hover:bg-deep-blue-200 transition-colors"
              >
                💾 保存
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 個別化ヘッダー */}
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
            <div className="text-center">
              <h1 className="text-2xl font-medium text-deep-blue-700 mb-2">
                {userResponses.step2?.label || 'がん'}・{userResponses.step3?.label || 'お住まいの地域'}の方向け
              </h1>
              <p className="text-gray-600 mb-4">
                あなたの状況に合わせて情報を整理しました
              </p>
              
              {/* AI状態インジケーター */}
              <div className="flex justify-center mb-4">
                <AIStatusIndicator
                  isAIEnabled={aiStatus.isAIEnabled}
                  aiGenerated={aiStatus.aiGenerated}
                  fallbackUsed={aiStatus.fallbackUsed}
                />
              </div>
              <div className="bg-golden-yellow-50 border border-golden-yellow-200 rounded-lg p-4">
                <p className="text-sm text-golden-yellow-800">
                  ⚠️ <strong>重要</strong>: これらは参考情報です。治療に関する判断は必ず主治医とご相談ください。
                </p>
              </div>
            </div>
          </div>

          {/* あなたの選択内容 */}
          {Object.keys(userResponses).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
              <h2 className="text-xl font-medium text-deep-blue mb-4 flex items-center">
                <span className="mr-2">📝</span>
                あなたの選択内容
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {userResponses.step1 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-600 mb-1">現在の状況</h3>
                    <p className="text-gray-800">{userResponses.step1.label}</p>
                  </div>
                )}
                
                {userResponses.step2 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-600 mb-1">がんの種類</h3>
                    <p className="text-gray-800">{userResponses.step2.label}</p>
                  </div>
                )}
                
                {userResponses.step3 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-600 mb-1">地域</h3>
                    <p className="text-gray-800">{userResponses.step3.label}</p>
                  </div>
                )}
                
                {userResponses.step4 && userResponses.step4.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-600 mb-1">知りたいこと</h3>
                    <div className="flex flex-wrap gap-1">
                      {userResponses.step4.map((item, index) => (
                        <span key={index} className="inline-block bg-deep-blue-100 text-deep-blue-700 text-xs px-2 py-1 rounded">
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {userResponses.step5 && userResponses.step5.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-600 mb-1">お気持ち</h3>
                    <div className="flex flex-wrap gap-1">
                      {userResponses.step5.map((item, index) => (
                        <span key={index} className="inline-block bg-warm-coral-100 text-warm-coral-700 text-xs px-2 py-1 rounded">
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                この情報をもとに、以下のロードマップを作成しました
              </p>
            </div>
          )}

          {/* ロードマップセクション */}
          <div className="space-y-6">
            {roadmapSections.map((section, index) => (
              <div
                key={section.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{section.icon}</span>
                  <h2 className="text-xl font-medium text-deep-blue-700">{section.title}</h2>
                </div>
                <div className="space-y-3">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 次のステップ */}
          <div className="bg-soft-peach-100 rounded-2xl p-6 mt-8 border border-soft-peach-200">
            <h2 className="text-xl font-medium text-soft-peach-800 mb-4 flex items-center gap-2">
              🤗 次のステップ
            </h2>
            <div className="space-y-3 text-soft-peach-700">
              <p>• <strong>今日決める必要はありません</strong> - ゆっくり考えてください</p>
              <p>• <strong>家族と相談してください</strong> - この情報を共有して一緒に考えましょう</p>
              <p>• <strong>主治医に質問してください</strong> - 気になることは遠慮なく聞いてみましょう</p>
              <p>• <strong>また戻ってきてください</strong> - 新しい疑問が出てきたらいつでもどうぞ</p>
            </div>
          </div>

          {/* フッター */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              このガイドは{new Date().toLocaleDateString('ja-JP')}に作成されました
            </p>
            <p className="text-xs text-gray-400">
              医療情報は日々更新されます。最新の情報は主治医にご確認ください。
            </p>
          </div>
        </div>
      </div>

      {/* 共有・保存モーダル */}
      <ShareSaveModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roadmapData={roadmapData}
      />
    </div>
  )
} 