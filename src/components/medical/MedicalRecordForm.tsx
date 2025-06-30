'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface MedicalRecord {
  id?: string
  record_type: string
  title: string
  content: string
  record_date: string
  tags: string[]
  is_important: boolean
}

interface MedicalRecordFormProps {
  record?: MedicalRecord
  onSave?: (record: MedicalRecord) => void
  onCancel?: () => void
}

const RECORD_TYPES = [
  { value: 'diagnosis', label: '診断結果' },
  { value: 'treatment', label: '治療内容' },
  { value: 'prescription', label: '処方箋' },
  { value: 'test_result', label: '検査結果' },
  { value: 'consultation', label: '相談・診察' },
  { value: 'other', label: 'その他' }
]

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({ 
  record, 
  onSave, 
  onCancel 
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState<MedicalRecord>({
    record_type: 'consultation',
    title: '',
    content: '',
    record_date: new Date().toISOString().split('T')[0],
    tags: [],
    is_important: false
  })

  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (record) {
      setFormData(record)
    }
  }, [record])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage('')

    try {
      const recordData = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      let result
      if (record?.id) {
        // 更新
        result = await supabase
          .from('medical_records')
          .update(recordData)
          .eq('id', record.id)
          .select()
          .single()
      } else {
        // 新規作成
        result = await supabase
          .from('medical_records')
          .insert(recordData)
          .select()
          .single()
      }

      if (result.error) throw result.error

      setMessage(record?.id ? '医療記録を更新しました。' : '医療記録を保存しました。')
      
      if (onSave) {
        onSave(result.data)
      }

      // 新規作成の場合はフォームをリセット
      if (!record?.id) {
        setFormData({
          record_type: 'consultation',
          title: '',
          content: '',
          record_date: new Date().toISOString().split('T')[0],
          tags: [],
          is_important: false
        })
      }
    } catch (error: any) {
      console.error('Medical record save error:', error)
      setMessage('医療記録の保存に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof MedicalRecord, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-deep-blue-500">
          {record?.id ? '医療記録を編集' : '新しい医療記録を追加'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 記録タイプと日付 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="record_type" className="block text-sm font-medium text-gray-700 mb-1">
                記録タイプ <span className="text-red-500">*</span>
              </label>
              <select
                id="record_type"
                value={formData.record_type}
                onChange={(e) => handleInputChange('record_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                required
              >
                {RECORD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="record_date" className="block text-sm font-medium text-gray-700 mb-1">
                記録日 <span className="text-red-500">*</span>
              </label>
              <input
                id="record_date"
                type="date"
                value={formData.record_date}
                onChange={(e) => handleInputChange('record_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* タイトル */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
              placeholder="例：定期検診、血液検査結果、診断内容など"
              required
            />
          </div>

          {/* 内容 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              詳細内容
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
              placeholder="診断内容、治療方法、薬剤情報、検査結果、医師からのアドバイスなど、詳細な情報を記録してください。"
            />
          </div>

          {/* タグ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タグ（検索用）
            </label>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="例：高血圧、定期検診、薬物療法など"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                追加
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-deep-blue-100 text-deep-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-deep-blue-600 hover:text-deep-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 重要度 */}
          <div className="flex items-center">
            <input
              id="is_important"
              type="checkbox"
              checked={formData.is_important}
              onChange={(e) => handleInputChange('is_important', e.target.checked)}
              className="w-4 h-4 text-deep-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-deep-blue-500 focus:ring-2"
            />
            <label htmlFor="is_important" className="ml-2 text-sm font-medium text-gray-700">
              重要な記録としてマークする
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
              {loading ? '保存中...' : (record?.id ? '更新' : '保存')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default MedicalRecordForm 