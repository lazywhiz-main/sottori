'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface MedicalProfessional {
  id?: string
  name: string
  role: string
  specialization?: string
  institution_id?: string
  phone?: string
  email?: string
  notes?: string
  is_primary_doctor: boolean
}

interface MedicalInstitution {
  id: string
  name: string
  type: string
}

interface MedicalProfessionalFormProps {
  professional?: MedicalProfessional
  onSave?: (professional: MedicalProfessional) => void
  onCancel?: () => void
}

const PROFESSIONAL_ROLES = [
  { value: 'oncologist', label: '腫瘍内科医' },
  { value: 'surgeon', label: '外科医' },
  { value: 'radiation_oncologist', label: '放射線腫瘍医' },
  { value: 'pathologist', label: '病理医' },
  { value: 'radiologist', label: '放射線科医' },
  { value: 'nurse', label: '看護師' },
  { value: 'pharmacist', label: '薬剤師' },
  { value: 'social_worker', label: 'ソーシャルワーカー' },
  { value: 'counselor', label: 'カウンセラー' },
  { value: 'nutritionist', label: '栄養士' },
  { value: 'other', label: 'その他' }
]

const MedicalProfessionalForm: React.FC<MedicalProfessionalFormProps> = ({ 
  professional, 
  onSave, 
  onCancel 
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [institutions, setInstitutions] = useState<MedicalInstitution[]>([])

  const [formData, setFormData] = useState<MedicalProfessional>({
    name: '',
    role: 'oncologist',
    specialization: '',
    institution_id: '',
    phone: '',
    email: '',
    notes: '',
    is_primary_doctor: false
  })

  useEffect(() => {
    if (professional) {
      setFormData(professional)
    }
    fetchInstitutions()
  }, [professional])

  const fetchInstitutions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('medical_institutions')
        .select('id, name, type')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setInstitutions(data || [])
    } catch (error: any) {
      console.error('Institutions fetch error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage('')

    try {
      const professionalData = {
        ...formData,
        user_id: user.id,
        institution_id: formData.institution_id || null,
        updated_at: new Date().toISOString()
      }

      let result
      if (professional?.id) {
        // 更新
        result = await supabase
          .from('medical_professionals')
          .update(professionalData)
          .eq('id', professional.id)
          .select()
          .single()
      } else {
        // 新規作成
        result = await supabase
          .from('medical_professionals')
          .insert(professionalData)
          .select()
          .single()
      }

      if (result.error) throw result.error

      setMessage(professional?.id ? '医療従事者情報を更新しました。' : '医療従事者を登録しました。')
      
      if (onSave) {
        onSave(result.data)
      }

      // 新規作成の場合はフォームをリセット
      if (!professional?.id) {
        setFormData({
          name: '',
          role: 'oncologist',
          specialization: '',
          institution_id: '',
          phone: '',
          email: '',
          notes: '',
          is_primary_doctor: false
        })
      }
    } catch (error: any) {
      console.error('Medical professional save error:', error)
      setMessage('医療従事者の保存に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof MedicalProfessional, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-deep-blue-500">
          {professional?.id ? '医療従事者情報を編集' : '新しい医療従事者を登録'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 氏名と職種 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                氏名 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="例：田中太郎 先生"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                職種 <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                required
              >
                {PROFESSIONAL_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 専門分野と所属機関 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                専門分野
              </label>
              <input
                id="specialization"
                type="text"
                value={formData.specialization || ''}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="例：乳がん、肺がん、消化器がんなど"
              />
            </div>

            <div>
              <label htmlFor="institution_id" className="block text-sm font-medium text-gray-700 mb-1">
                所属医療機関
              </label>
              <select
                id="institution_id"
                value={formData.institution_id || ''}
                onChange={(e) => handleInputChange('institution_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                {institutions.map(institution => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
              {institutions.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  先に医療機関を登録してください
                </p>
              )}
            </div>
          </div>

          {/* 連絡先 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                電話番号
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="例：03-1234-5678"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="例：doctor@example.com"
              />
            </div>
          </div>

          {/* メモ */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              メモ・備考
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
              placeholder="診療時間、特記事項、相談した内容などを記録できます。"
            />
          </div>

          {/* 主治医設定 */}
          <div className="flex items-center">
            <input
              id="is_primary_doctor"
              type="checkbox"
              checked={formData.is_primary_doctor}
              onChange={(e) => handleInputChange('is_primary_doctor', e.target.checked)}
              className="w-4 h-4 text-deep-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-deep-blue-500 focus:ring-2"
            />
            <label htmlFor="is_primary_doctor" className="ml-2 text-sm font-medium text-gray-700">
              主治医として設定
            </label>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('失敗') || message.includes('エラー')
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                キャンセル
              </Button>
            )}
            <Button 
              type="submit" 
              variant="primary" 
              size="lg"
              disabled={loading}
            >
              {loading ? '保存中...' : (professional?.id ? '更新' : '登録')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default MedicalProfessionalForm 