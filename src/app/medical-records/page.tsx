'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/ui/Header'
import Button from '@/components/ui/Button'
import MedicalRecordForm from '@/components/medical/MedicalRecordForm'
import MedicalRecordsList from '@/components/medical/MedicalRecordsList'

interface MedicalRecord {
  id?: string
  record_type: string
  title: string
  content: string
  record_date: string
  tags: string[]
  is_important: boolean
}

export default function MedicalRecordsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | undefined>()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

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

  if (!user) {
    return null
  }

  const handleEdit = (record: MedicalRecord) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  const handleSave = () => {
    setShowForm(false)
    setEditingRecord(undefined)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingRecord(undefined)
  }

  const handleAddNew = () => {
    setEditingRecord(undefined)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue-50 via-white to-soft-peach-50">
      <Header subtitle="医療記録管理" />

      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-3xl font-light text-gray-900 mb-2">
                医療記録管理
              </h2>
              <p className="text-gray-600">
                診断結果、治療内容、検査結果などを記録・管理します。
              </p>
            </div>
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleAddNew}
            >
              新しい記録を追加
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* フォーム表示 */}
          {showForm && (
            <div className="mb-8">
              <MedicalRecordForm
                record={editingRecord}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* 記録一覧 */}
          <MedicalRecordsList
            onEdit={handleEdit}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </main>
    </div>
  )
} 