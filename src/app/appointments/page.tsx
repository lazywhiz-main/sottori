'use client'

import React, { useState, useEffect } from 'react'
import { AppointmentForm } from '@/components/medical/AppointmentForm'
import { AppointmentsList } from '@/components/medical/AppointmentsList'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

export default function AppointmentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithDetails | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    } else if (!loading && user) {
      // 企画意図から逸脱したページのため、ダッシュボードにリダイレクト
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleAddNew = () => {
    setEditingAppointment(undefined)
    setShowForm(true)
  }

  const handleEdit = (appointment: AppointmentWithDetails) => {
    setEditingAppointment(appointment)
    setShowForm(true)
  }

  const handleSave = () => {
    setShowForm(false)
    setEditingAppointment(undefined)
    setRefreshKey(prev => prev + 1) // リストを再読み込み
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingAppointment(undefined)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-blue-50 via-white to-soft-peach-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-deep-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AppointmentForm
          appointment={editingAppointment ? {
            id: editingAppointment.id,
            title: editingAppointment.title,
            description: editingAppointment.description,
            appointment_date: editingAppointment.appointment_date,
            duration_minutes: editingAppointment.duration_minutes,
            institution_id: editingAppointment.institution_id || '',
            professional_id: editingAppointment.professional_id || '',
            status: editingAppointment.status
          } : undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deep-blue mb-2">
              予定・アポイントメント管理
            </h1>
            <p className="text-gray-600">
              医療機関での予約や検査スケジュールを管理できます
            </p>
          </div>
          <Button onClick={handleAddNew}>
            新しい予定を追加
          </Button>
        </div>
      </div>

      {/* 今日の予定 */}
      <div className="mb-8">
        <Card className="p-6 bg-gradient-to-r from-soft-peach to-golden-yellow">
          <h2 className="text-xl font-semibold text-deep-blue mb-4">
            📅 今日の予定
          </h2>
          <div className="text-deep-blue">
            <TodaysAppointments key={refreshKey} />
          </div>
        </Card>
      </div>

      {/* 予定一覧 */}
      <AppointmentsList key={refreshKey} onEdit={handleEdit} />
    </div>
  )
}

// 今日の予定を表示するコンポーネント
function TodaysAppointments() {
  const { user } = useAuth()
  const [todaysAppointments, setTodaysAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchTodaysAppointments()
    }
  }, [user])

  const fetchTodaysAppointments = async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          title,
          appointment_date,
          status,
          medical_institutions (name),
          medical_professionals (name)
        `)
        .eq('user_id', user?.id)
        .gte('appointment_date', startOfDay.toISOString())
        .lt('appointment_date', endOfDay.toISOString())
        .eq('status', 'scheduled')
        .order('appointment_date', { ascending: true })

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted = (data || []).map((appointment: any) => ({
        id: appointment.id,
        title: appointment.title,
        description: '',
        appointment_date: appointment.appointment_date,
        duration_minutes: 0,
        status: appointment.status,
        institution_name: appointment.medical_institutions?.name,
        professional_name: appointment.medical_professionals?.name,
      }))

      setTodaysAppointments(formatted)
    } catch (error) {
      console.error('今日の予定の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-sm">読み込み中...</div>
  }

  if (todaysAppointments.length === 0) {
    return (
      <div className="text-sm opacity-75">
        今日の予定はありません
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {todaysAppointments.map(appointment => (
        <div key={appointment.id} className="text-sm">
          <span className="font-medium">{appointment.title}</span>
          <span className="ml-2 opacity-75">
            {new Date(appointment.appointment_date).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {appointment.institution_name && (
            <span className="ml-2 text-xs opacity-60">
              @ {appointment.institution_name}
            </span>
          )}
        </div>
      ))}
    </div>
  )
} 