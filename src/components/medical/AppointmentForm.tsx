'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface MedicalInstitution {
  id: string
  name: string
  type: string
}

interface MedicalProfessional {
  id: string
  name: string
  specialization: string
  institution_id: string
}

interface Appointment {
  id?: string
  title: string
  description: string
  appointment_date: string
  duration_minutes: number
  institution_id: string
  professional_id: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

interface AppointmentFormProps {
  appointment?: Appointment
  onSave: () => void
  onCancel: () => void
}

export function AppointmentForm({ appointment, onSave, onCancel }: AppointmentFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [institutions, setInstitutions] = useState<MedicalInstitution[]>([])
  const [professionals, setProfessionals] = useState<MedicalProfessional[]>([])
  const [filteredProfessionals, setFilteredProfessionals] = useState<MedicalProfessional[]>([])
  
  const [formData, setFormData] = useState<Appointment>({
    title: '',
    description: '',
    appointment_date: '',
    duration_minutes: 30,
    institution_id: '',
    professional_id: '',
    status: 'scheduled',
    ...appointment
  })

  useEffect(() => {
    if (user) {
      fetchInstitutions()
      fetchProfessionals()
    }
  }, [user])

  useEffect(() => {
    // 選択された医療機関に所属する医療従事者をフィルタリング
    if (formData.institution_id) {
      const filtered = professionals.filter(
        prof => prof.institution_id === formData.institution_id
      )
      setFilteredProfessionals(filtered)
      
      // 現在選択されている医療従事者が新しい機関に所属していない場合はリセット
      if (formData.professional_id && !filtered.find(prof => prof.id === formData.professional_id)) {
        setFormData(prev => ({ ...prev, professional_id: '' }))
      }
    } else {
      setFilteredProfessionals(professionals)
    }
  }, [formData.institution_id, professionals])

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_institutions')
        .select('id, name, type')
        .eq('user_id', user?.id)
        .order('name')

      if (error) throw error
      setInstitutions(data || [])
    } catch (error) {
      console.error('医療機関の取得に失敗しました:', error)
    }
  }

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_professionals')
        .select('id, name, specialization, institution_id')
        .eq('user_id', user?.id)
        .order('name')

      if (error) throw error
      setProfessionals(data || [])
    } catch (error) {
      console.error('医療従事者の取得に失敗しました:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const appointmentData = {
        ...formData,
        user_id: user.id,
        // 医療機関や医療従事者が選択されていない場合はnullに設定
        institution_id: formData.institution_id || null,
        professional_id: formData.professional_id || null,
      }

      if (appointment?.id) {
        // 更新
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointment.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('appointments')
          .insert([appointmentData])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('予定の保存に失敗しました:', error)
      alert('予定の保存に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const appointmentTypes = [
    { value: '診察', label: '診察' },
    { value: '検査', label: '検査' },
    { value: '治療', label: '治療' },
    { value: '手術', label: '手術' },
    { value: 'カウンセリング', label: 'カウンセリング' },
    { value: '薬の受け取り', label: '薬の受け取り' },
    { value: 'その他', label: 'その他' },
  ]

  const durationOptions = [
    { value: 15, label: '15分' },
    { value: 30, label: '30分' },
    { value: 45, label: '45分' },
    { value: 60, label: '1時間' },
    { value: 90, label: '1時間30分' },
    { value: 120, label: '2時間' },
    { value: 180, label: '3時間' },
    { value: 240, label: '4時間' },
  ]

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-deep-blue mb-6">
        {appointment ? '予定を編集' : '新しい予定を追加'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-deep-blue mb-2">
            予定のタイトル *
          </label>
          <select
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue"
            required
          >
            <option value="">選択してください</option>
            {appointmentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-deep-blue mb-2">
            詳細・メモ
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue"
            placeholder="診察内容、持参物、質問事項など"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-deep-blue mb-2">
              日時 *
            </label>
            <input
              type="datetime-local"
              value={formData.appointment_date}
              onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-blue mb-2">
              予定時間
            </label>
            <select
              value={formData.duration_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue"
            >
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-deep-blue mb-2">
            医療機関
          </label>
          <select
            value={formData.institution_id}
            onChange={(e) => setFormData(prev => ({ ...prev, institution_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue"
          >
            <option value="">選択してください</option>
            {institutions.map(institution => (
              <option key={institution.id} value={institution.id}>
                {institution.name} ({institution.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-deep-blue mb-2">
            担当医・医療従事者
          </label>
          <select
            value={formData.professional_id}
            onChange={(e) => setFormData(prev => ({ ...prev, professional_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue"
            disabled={!formData.institution_id}
          >
            <option value="">選択してください</option>
            {filteredProfessionals.map(professional => (
              <option key={professional.id} value={professional.id}>
                {professional.name} ({professional.specialization})
              </option>
            ))}
          </select>
          {!formData.institution_id && (
            <p className="text-sm text-gray-500 mt-1">
              医療機関を選択すると、担当者を選択できます
            </p>
          )}
        </div>

        {appointment && (
          <div>
            <label className="block text-sm font-medium text-deep-blue mb-2">
              ステータス
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'scheduled' | 'completed' | 'cancelled' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deep-blue"
            >
              <option value="scheduled">予定</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? '保存中...' : (appointment ? '更新' : '追加')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            キャンセル
          </Button>
        </div>
      </form>
    </Card>
  )
} 