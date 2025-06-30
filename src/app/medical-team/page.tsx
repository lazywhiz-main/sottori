'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/ui/Header'
import Button from '@/components/ui/Button'
import MedicalInstitutionForm from '@/components/medical/MedicalInstitutionForm'
import MedicalProfessionalForm from '@/components/medical/MedicalProfessionalForm'
import MedicalTeamList from '@/components/medical/MedicalTeamList'

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

type FormMode = 'none' | 'institution' | 'professional'

export default function MedicalTeamPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formMode, setFormMode] = useState<FormMode>('none')
  const [editingInstitution, setEditingInstitution] = useState<MedicalInstitution | undefined>()
  const [editingProfessional, setEditingProfessional] = useState<MedicalProfessional | undefined>()
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

  const handleEditInstitution = (institution: MedicalInstitution) => {
    setEditingInstitution(institution)
    setEditingProfessional(undefined)
    setFormMode('institution')
  }

  const handleEditProfessional = (professional: MedicalProfessional) => {
    setEditingProfessional(professional)
    setEditingInstitution(undefined)
    setFormMode('professional')
  }

  const handleSave = () => {
    setFormMode('none')
    setEditingInstitution(undefined)
    setEditingProfessional(undefined)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleCancel = () => {
    setFormMode('none')
    setEditingInstitution(undefined)
    setEditingProfessional(undefined)
  }

  const handleAddInstitution = () => {
    setEditingInstitution(undefined)
    setEditingProfessional(undefined)
    setFormMode('institution')
  }

  const handleAddProfessional = () => {
    setEditingInstitution(undefined)
    setEditingProfessional(undefined)
    setFormMode('professional')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue-50 via-white to-soft-peach-50">
      <Header subtitle="医療チーム管理" />

      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-3xl font-light text-gray-900 mb-2">
                医療チーム管理
              </h2>
              <p className="text-gray-600">
                医療機関と医療従事者の情報を管理します。
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleAddInstitution}
              >
                医療機関を追加
              </Button>
              <Button 
                variant="primary" 
                size="lg"
                onClick={handleAddProfessional}
              >
                医療従事者を追加
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* フォーム表示 */}
          {formMode === 'institution' && (
            <div className="mb-8">
              <MedicalInstitutionForm
                institution={editingInstitution}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          )}

          {formMode === 'professional' && (
            <div className="mb-8">
              <MedicalProfessionalForm
                professional={editingProfessional}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* 一覧表示 */}
          <MedicalTeamList
            onEditInstitution={handleEditInstitution}
            onEditProfessional={handleEditProfessional}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </main>
    </div>
  )
} 