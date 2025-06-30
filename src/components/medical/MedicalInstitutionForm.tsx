'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface MedicalInstitution {
  id?: string
  name: string
  type: string
  address: string
  phone: string
  website?: string
  notes?: string
  is_primary: boolean
}

interface MedicalInstitutionFormProps {
  institution?: MedicalInstitution
  onSave?: (institution: MedicalInstitution) => void
  onCancel?: () => void
}

const INSTITUTION_TYPES = [
  { value: 'hospital', label: '総合病院' },
  { value: 'clinic', label: 'クリニック・診療所' },
  { value: 'cancer_center', label: 'がん専門病院' },
  { value: 'university_hospital', label: '大学病院' },
  { value: 'specialized_hospital', label: '専門病院' },
  { value: 'pharmacy', label: '薬局' },
  { value: 'other', label: 'その他' }
]

const MedicalInstitutionForm: React.FC<MedicalInstitutionFormProps> = ({ 
  institution, 
  onSave, 
  onCancel 
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState<MedicalInstitution>({
    name: '',
    type: 'hospital',
    address: '',
    phone: '',
    website: '',
    notes: '',
    is_primary: false
  })

  useEffect(() => {
    if (institution) {
      setFormData(institution)
    }
  }, [institution])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage('')

    try {
      const institutionData = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      let result
      if (institution?.id) {
        // 更新
        result = await supabase
          .from('medical_institutions')
          .update(institutionData)
          .eq('id', institution.id)
          .select()
          .single()
      } else {
        // 新規作成
        result = await supabase
          .from('medical_institutions')
          .insert(institutionData)
          .select()
          .single()
      }

      if (result.error) throw result.error

      setMessage(institution?.id ? '医療機関情報を更新しました。' : '医療機関を登録しました。')
      
      if (onSave) {
        onSave(result.data)
      }

      // 新規作成の場合はフォームをリセット
      if (!institution?.id) {
        setFormData({
          name: '',
          type: 'hospital',
          address: '',
          phone: '',
          website: '',
          notes: '',
          is_primary: false
        })
      }
    } catch (error: any) {
      console.error('Medical institution save error:', error)
      setMessage('医療機関の保存に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof MedicalInstitution, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-deep-blue-500">
          {institution?.id ? '医療機関情報を編集' : '新しい医療機関を登録'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 機関名と種別 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                医療機関名 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="例：○○総合病院、△△クリニック"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                種別 <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                required
              >
                {INSTITUTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 住所 */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              住所 <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
              placeholder="例：東京都渋谷区○○1-2-3"
              required
            />
          </div>

          {/* 電話番号とウェブサイト */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                電話番号 <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="例：03-1234-5678"
                required
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                ウェブサイト
              </label>
              <input
                id="website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="例：https://example.com"
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
              placeholder="診療科、アクセス方法、特記事項などを記録できます。"
            />
          </div>

          {/* 主治医所属機関 */}
          <div className="flex items-center">
            <input
              id="is_primary"
              type="checkbox"
              checked={formData.is_primary}
              onChange={(e) => handleInputChange('is_primary', e.target.checked)}
              className="w-4 h-4 text-deep-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-deep-blue-500 focus:ring-2"
            />
            <label htmlFor="is_primary" className="ml-2 text-sm font-medium text-gray-700">
              主治医が所属する医療機関として設定
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
              {loading ? '保存中...' : (institution?.id ? '更新' : '登録')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default MedicalInstitutionForm 