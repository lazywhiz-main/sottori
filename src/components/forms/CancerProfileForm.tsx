'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { CancerProfileService, parseSupabaseError } from '../../lib/utils/databaseHelpers'
import type { CancerProfile } from '../../lib/types/database'

// ステップ定義
const profileSteps = [
  {
    id: 'basic_cancer_info',
    title: 'がん種・ステージ',
    description: '基本的な診断情報を教えてください',
    fields: ['cancer_type', 'stage', 'diagnosis_date'],
    required: ['cancer_type']
  },
  {
    id: 'treatment_status',
    title: '治療状況',
    description: '現在の治療状況について教えてください',
    fields: ['treatment_status', 'current_treatment', 'treatment_start_date'],
    required: ['treatment_status']
  },
  {
    id: 'medical_team',
    title: '医療チーム',
    description: '主治医や病院について（任意）',
    fields: ['primary_doctor', 'hospital', 'next_appointment'],
    required: []
  },
  {
    id: 'concerns_interests',
    title: '気になるポイント',
    description: '今、一番気になっていることを選択してください',
    fields: ['concern_areas', 'priority_concerns'],
    required: ['concern_areas']
  }
]

// 選択肢の定義
const cancerTypes = [
  '胃がん', '大腸がん', '肝臓がん', '肺がん', '乳がん', '子宮がん', '卵巣がん', 
  '前立腺がん', '膀胱がん', '腎臓がん', '膵臓がん', '胆道がん', '食道がん',
  '頭頸部がん', '脳腫瘍', '血液がん（白血病）', '血液がん（リンパ腫）', 
  '皮膚がん', '骨軟部腫瘍', 'その他'
]

const stages = ['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', '不明・未確定']

const treatmentStatuses = [
  '診断されたばかり',
  '治療方針検討中',
  '手術前',
  '手術後',
  '化学療法中',
  '放射線治療中',
  '経過観察中',
  '治療完了（フォローアップ中）',
  'その他'
]

const treatmentOptions = [
  '手術', '化学療法（抗がん剤）', '放射線治療', '免疫療法', 'ホルモン療法',
  '分子標的治療', '緩和ケア', '経過観察', 'その他'
]

const concernAreas = [
  '治療選択肢について', '副作用・後遺症について', 'セカンドオピニオン',
  '専門医・病院情報', '治験・臨床試験情報', '費用・保険について',
  '仕事・生活への影響', '家族・周囲への説明', '心理的サポート',
  '栄養・食事について', '運動・リハビリ', 'その他'
]

export default function CancerProfileForm() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const [formData, setFormData] = useState<Partial<CancerProfile>>({
    cancer_type: '',
    stage: '',
    diagnosis_date: '',
    treatment_status: '',
    current_treatment: [],
    treatment_start_date: '',
    primary_doctor: '',
    hospital: '',
    next_appointment: '',
    concern_areas: [],
    priority_concerns: [],
    notes: ''
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('がん治療プロフィールを読み込み中...', user.id)
      
      const profile = await CancerProfileService.getProfile(user.id)
      
      if (profile) {
        console.log('プロフィールが見つかりました:', profile)
        setFormData({
          cancer_type: profile.cancer_type || '',
          stage: profile.stage || '',
          diagnosis_date: profile.diagnosis_date || '',
          treatment_status: profile.treatment_status || '',
          current_treatment: profile.current_treatment || [],
          treatment_start_date: profile.treatment_start_date || '',
          primary_doctor: profile.primary_doctor || '',
          hospital: profile.hospital || '',
          next_appointment: profile.next_appointment || '',
          concern_areas: profile.concern_areas || [],
          priority_concerns: profile.priority_concerns || [],
          notes: profile.notes || ''
        })
      } else {
        console.log('プロフィールが見つからなかったため、新規作成します')
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error)
      setMessage(`読み込みエラー: ${parseSupabaseError(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!user) return

    setSaving(true)
    setMessage('')

    try {
      console.log('=== がん治療プロフィール保存開始 ===')
      console.log('ユーザーID:', user.id)
      console.log('フォームデータ:', formData)
      
      const profileData = {
        user_id: user.id,
        cancer_type: formData.cancer_type || undefined,
        stage: formData.stage || undefined,
        diagnosis_date: formData.diagnosis_date || undefined,
        treatment_status: formData.treatment_status || undefined,
        current_treatment: formData.current_treatment || undefined,
        treatment_start_date: formData.treatment_start_date || undefined,
        primary_doctor: formData.primary_doctor || undefined,
        hospital: formData.hospital || undefined,
        next_appointment: formData.next_appointment || undefined,
        concern_areas: formData.concern_areas || undefined,
        priority_concerns: formData.priority_concerns || undefined,
        notes: formData.notes || undefined
      }

      console.log('保存するプロフィールデータ:', profileData)

      const savedProfile = await CancerProfileService.upsertProfile(profileData)
      console.log('=== プロフィール保存完了 ===')
      console.log('保存されたプロフィール:', savedProfile)
      
      setMessage('✅ プロフィールを保存しました')
      
      // 成功メッセージを3秒後に消す
      setTimeout(() => {
        setMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('=== プロフィール保存エラー ===')
      console.error('エラー詳細:', error)
      console.error('エラーオブジェクト:', JSON.stringify(error, null, 2))
      setMessage(`❌ 保存に失敗しました: ${parseSupabaseError(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof CancerProfile, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayToggle = (field: keyof CancerProfile, value: string) => {
    const currentArray = (formData[field] as string[]) || []
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    handleInputChange(field, newArray)
  }

  const isStepValid = (stepIndex: number) => {
    const step = profileSteps[stepIndex]
    return step.required.every(field => {
      const value = formData[field as keyof CancerProfile]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== ''
    })
  }

  const nextStep = () => {
    if (currentStep < profileSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getCompletionPercentage = () => {
    const totalFields = profileSteps.reduce((total, step) => total + step.fields.length, 0)
    const completedFields = profileSteps.reduce((completed, step) => {
      return completed + step.fields.filter(field => {
        const value = formData[field as keyof CancerProfile]
        if (Array.isArray(value)) {
          return value && value.length > 0
        }
        return value !== '' && value !== undefined && value !== null
      }).length
    }, 0)
    
    return Math.round((completedFields / totalFields) * 100)
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-deep-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">プロフィール情報を読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentStepData = profileSteps[currentStep]

  return (
    <div className="max-w-2xl mx-auto">
      {/* メッセージ表示 */}
      {message && (
        <Card className={`mb-4 ${
          message.includes('✅') ? 'border-green-200 bg-green-50' : 
          message.includes('❌') ? 'border-red-200 bg-red-50' : 
          'border-blue-200 bg-blue-50'
        }`}>
          <CardContent className="pt-4">
            <p className={`text-sm ${
              message.includes('✅') ? 'text-green-700' : 
              message.includes('❌') ? 'text-red-700' : 
              'text-blue-700'
            }`}>
              {message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 進捗インジケーター */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              ステップ {currentStep + 1} / {profileSteps.length}
            </span>
            <span className="text-sm font-medium text-deep-blue-600">
              全体完了度: {getCompletionPercentage()}%
            </span>
          </div>
          
          <div className="flex items-center">
            {profileSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index <= currentStep 
                    ? 'bg-deep-blue-500 border-deep-blue-500 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {index + 1}
                </div>
                {index < profileSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    index < currentStep ? 'bg-deep-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="mt-4">
            <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden`}>
              <div 
                className="h-full bg-deep-blue-500 transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 現在のステップ */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-deep-blue-500">{currentStepData.title}</CardTitle>
          <p className="text-gray-600 mt-2">{currentStepData.description}</p>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            
            {/* ステップ1: 基本がん情報 */}
            {currentStep === 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    がん種 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.cancer_type || ''}
                    onChange={(e) => handleInputChange('cancer_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-deep-blue-500"
                  >
                    <option value="">選択してください</option>
                    {cancerTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ステージ
                  </label>
                  <select
                    value={formData.stage || ''}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-deep-blue-500"
                  >
                    <option value="">選択してください</option>
                    {stages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    診断日
                  </label>
                  <input
                    type="date"
                    value={formData.diagnosis_date || ''}
                    onChange={(e) => handleInputChange('diagnosis_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-deep-blue-500"
                  />
                </div>
              </>
            )}

            {/* ステップ2: 治療状況 */}
            {currentStep === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    治療状況 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {treatmentStatuses.map(status => (
                      <label key={status} className="flex items-center">
                        <input
                          type="radio"
                          name="treatment_status"
                          value={status}
                          checked={formData.treatment_status === status}
                          onChange={(e) => handleInputChange('treatment_status', e.target.value)}
                          className="mr-3 h-4 w-4 text-deep-blue-600 focus:ring-deep-blue-500 border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    現在の治療（複数選択可）
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {treatmentOptions.map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(formData.current_treatment || []).includes(option)}
                          onChange={() => handleArrayToggle('current_treatment', option)}
                          className="mr-2 h-4 w-4 text-deep-blue-600 focus:ring-deep-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    治療開始日
                  </label>
                  <input
                    type="date"
                    value={formData.treatment_start_date || ''}
                    onChange={(e) => handleInputChange('treatment_start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-deep-blue-500"
                  />
                </div>
              </>
            )}

            {/* ステップ3: 医療チーム */}
            {currentStep === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    主治医
                  </label>
                  <input
                    type="text"
                    value={formData.primary_doctor || ''}
                    onChange={(e) => handleInputChange('primary_doctor', e.target.value)}
                    placeholder="主治医の名前"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-deep-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    病院・医療機関
                  </label>
                  <input
                    type="text"
                    value={formData.hospital || ''}
                    onChange={(e) => handleInputChange('hospital', e.target.value)}
                    placeholder="病院名"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-deep-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    次回予定日
                  </label>
                  <input
                    type="date"
                    value={formData.next_appointment || ''}
                    onChange={(e) => handleInputChange('next_appointment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-deep-blue-500"
                  />
                </div>
              </>
            )}

            {/* ステップ4: 関心事・気になるポイント */}
            {currentStep === 3 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    気になるポイント（複数選択可） <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {concernAreas.map(area => (
                      <label key={area} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(formData.concern_areas || []).includes(area)}
                          onChange={() => handleArrayToggle('concern_areas', area)}
                          className="mr-3 h-4 w-4 text-deep-blue-600 focus:ring-deep-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    特に重要なポイント（上記から最大3つ）
                  </label>
                  <div className="space-y-2">
                    {(formData.concern_areas || []).map(area => (
                      <label key={area} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(formData.priority_concerns || []).includes(area)}
                          onChange={() => handleArrayToggle('priority_concerns', area)}
                          disabled={(formData.priority_concerns || []).length >= 3 && !(formData.priority_concerns || []).includes(area)}
                          className="mr-3 h-4 w-4 text-warm-coral-600 focus:ring-warm-coral-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    その他のメモ
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="その他、気になることや伝えたいことがあれば..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-deep-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* ナビゲーションボタン */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              前へ
            </Button>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-deep-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </Button>

              {currentStep < profileSteps.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                >
                  次へ
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={saveProfile}
                  disabled={saving || !isStepValid(currentStep)}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-white border-t-transparent border-2 rounded-full animate-spin mr-2"></div>
                      完了中...
                    </>
                  ) : (
                    '完了'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 