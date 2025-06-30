'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

// interface Profile { // 現在未使用
//   id: string
//   full_name: string | null
//   date_of_birth: string | null
//   phone: string | null
//   emergency_contact_name: string | null
//   emergency_contact_phone: string | null
//   medical_conditions: string[] | null
// }

const ProfileForm: React.FC = () => {
  const { user } = useAuth()
  // const [profile, setProfile] = useState<Profile | null>(null) // 現在未使用
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // フォーム状態
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_conditions: [] as string[]
  })

  // 新しい医療条件の入力
  const [newCondition, setNewCondition] = useState('')

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        // setProfile(data) // 現在profile変数は未使用
        setFormData({
          full_name: data.full_name || '',
          date_of_birth: data.date_of_birth || '',
          phone: data.phone || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          medical_conditions: data.medical_conditions || []
        })
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      setMessage('プロフィール情報の取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setMessage('プロフィールを更新しました。')
      await fetchProfile()
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage('プロフィールの更新に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addMedicalCondition = () => {
    if (newCondition.trim() && !formData.medical_conditions.includes(newCondition.trim())) {
      setFormData(prev => ({
        ...prev,
        medical_conditions: [...prev.medical_conditions, newCondition.trim()]
      }))
      setNewCondition('')
    }
  }

  const removeMedicalCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      medical_conditions: prev.medical_conditions.filter(c => c !== condition)
    }))
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

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-deep-blue-500">プロフィール情報</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="お名前を入力してください"
                required
              />
            </div>

            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                生年月日
              </label>
              <input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              電話番号
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
              placeholder="090-1234-5678"
            />
          </div>

          {/* 緊急連絡先 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">緊急連絡先</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                  緊急連絡先（お名前）
                </label>
                <input
                  id="emergency_contact_name"
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                  placeholder="緊急連絡先のお名前"
                />
              </div>

              <div>
                <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  緊急連絡先（電話番号）
                </label>
                <input
                  id="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                  placeholder="090-1234-5678"
                />
              </div>
            </div>
          </div>

          {/* 医療条件・アレルギー */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">既往歴・アレルギー・医療上の注意点</h3>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="例：薬物アレルギー、高血圧、糖尿病など"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedicalCondition())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addMedicalCondition}>
                追加
              </Button>
            </div>

            {formData.medical_conditions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.medical_conditions.map((condition, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-soft-peach-100 text-soft-peach-800 rounded-full text-sm"
                  >
                    {condition}
                    <button
                      type="button"
                      onClick={() => removeMedicalCondition(condition)}
                      className="ml-2 text-soft-peach-600 hover:text-soft-peach-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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

          <div className="flex justify-end">
            <Button 
              type="submit" 
              variant="primary" 
              size="lg"
              disabled={saving}
            >
              {saving ? '保存中...' : 'プロフィールを保存'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default ProfileForm 