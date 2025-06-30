'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface AppointmentWithDetails {
  id: string
  title: string
  description: string
  appointment_date: string
  duration_minutes: number
  status: 'scheduled' | 'completed' | 'cancelled'
  institution_id?: string
  professional_id?: string
  institution_name?: string
  institution_type?: string
  professional_name?: string
  professional_specialization?: string
}

interface AppointmentsListProps {
  onEdit: (appointment: AppointmentWithDetails) => void
}

export function AppointmentsList({ onEdit }: AppointmentsListProps) {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'scheduled' | 'completed' | 'cancelled'>('upcoming')

  useEffect(() => {
    if (user) {
      fetchAppointments()
    }
  }, [user])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          title,
          description,
          appointment_date,
          duration_minutes,
          status,
          institution_id,
          professional_id,
          medical_institutions (
            name,
            type
          ),
          medical_professionals (
            name,
            specialization
          )
        `)
        .eq('user_id', user?.id)
        .order('appointment_date', { ascending: true })

      if (error) throw error

      const formattedAppointments: AppointmentWithDetails[] = (data || []).map((appointment: any) => ({
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        appointment_date: appointment.appointment_date,
        duration_minutes: appointment.duration_minutes,
        status: appointment.status,
        institution_id: appointment.institution_id,
        professional_id: appointment.professional_id,
        institution_name: appointment.medical_institutions?.name,
        institution_type: appointment.medical_institutions?.type,
        professional_name: appointment.medical_professionals?.name,
        professional_specialization: appointment.medical_professionals?.specialization,
      }))

      setAppointments(formattedAppointments)
    } catch (error) {
      console.error('予定の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この予定を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAppointments(prev => prev.filter(appointment => appointment.id !== id))
    } catch (error) {
      console.error('予定の削除に失敗しました:', error)
      alert('予定の削除に失敗しました。もう一度お試しください。')
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id 
            ? { ...appointment, status: newStatus }
            : appointment
        )
      )
    } catch (error) {
      console.error('ステータスの更新に失敗しました:', error)
      alert('ステータスの更新に失敗しました。もう一度お試しください。')
    }
  }

  const getFilteredAppointments = () => {
    const now = new Date()
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date)
      
      switch (filter) {
        case 'upcoming':
          return appointmentDate >= now && appointment.status === 'scheduled'
        case 'past':
          return appointmentDate < now
        case 'scheduled':
          return appointment.status === 'scheduled'
        case 'completed':
          return appointment.status === 'completed'
        case 'cancelled':
          return appointment.status === 'cancelled'
        default:
          return true
      }
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      }),
      time: date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '予定'
      case 'completed':
        return '完了'
      case 'cancelled':
        return 'キャンセル'
      default:
        return status
    }
  }

  const filteredAppointments = getFilteredAppointments()

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">読み込み中...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === 'upcoming'
                ? 'bg-deep-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            今後の予定
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === 'past'
                ? 'bg-deep-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            過去の予定
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === 'scheduled'
                ? 'bg-deep-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            予定済み
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === 'completed'
                ? 'bg-deep-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            完了済み
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === 'cancelled'
                ? 'bg-deep-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            キャンセル
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === 'all'
                ? 'bg-deep-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
        </div>
      </Card>

      {/* 予定一覧 */}
      {filteredAppointments.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          {filter === 'upcoming' && '今後の予定はありません'}
          {filter === 'past' && '過去の予定はありません'}
          {filter !== 'upcoming' && filter !== 'past' && '該当する予定がありません'}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map(appointment => {
            const { date, time } = formatDateTime(appointment.appointment_date)
            const isUpcoming = new Date(appointment.appointment_date) >= new Date()
            
            return (
              <Card key={appointment.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-deep-blue">
                        {appointment.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="text-gray-600 mb-3">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">{date}</span>
                        <span>{time}</span>
                        <span>{appointment.duration_minutes}分</span>
                      </div>
                    </div>

                    {appointment.institution_name && (
                      <div className="text-sm text-gray-600 mb-2">
                        📍 {appointment.institution_name}
                        {appointment.institution_type && ` (${appointment.institution_type})`}
                      </div>
                    )}

                    {appointment.professional_name && (
                      <div className="text-sm text-gray-600 mb-2">
                        👨‍⚕️ {appointment.professional_name}
                        {appointment.professional_specialization && ` (${appointment.professional_specialization})`}
                      </div>
                    )}

                    {appointment.description && (
                      <div className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded-md">
                        {appointment.description}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(appointment)}
                    >
                      編集
                    </Button>
                    
                    {appointment.status === 'scheduled' && isUpcoming && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusChange(appointment.id, 'completed')}
                      >
                        完了
                      </Button>
                    )}
                    
                    {appointment.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                      >
                        キャンセル
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(appointment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 