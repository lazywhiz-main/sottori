'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface MedicalInstitution {
  id: string
  name: string
  type: string
  address: string
  phone: string
  website?: string
  notes?: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

interface MedicalProfessional {
  id: string
  name: string
  role: string
  specialization?: string
  institution_id?: string
  phone?: string
  email?: string
  notes?: string
  is_primary_doctor: boolean
  created_at: string
  updated_at: string
  institution?: {
    name: string
    type: string
  }
}

interface MedicalTeamListProps {
  onEditInstitution?: (institution: MedicalInstitution) => void
  onEditProfessional?: (professional: MedicalProfessional) => void
  refreshTrigger?: number
}

const INSTITUTION_TYPE_LABELS: Record<string, string> = {
  hospital: '総合病院',
  clinic: 'クリニック・診療所',
  cancer_center: 'がん専門病院',
  university_hospital: '大学病院',
  specialized_hospital: '専門病院',
  pharmacy: '薬局',
  other: 'その他'
}

const PROFESSIONAL_ROLE_LABELS: Record<string, string> = {
  oncologist: '腫瘍内科医',
  surgeon: '外科医',
  radiation_oncologist: '放射線腫瘍医',
  pathologist: '病理医',
  radiologist: '放射線科医',
  nurse: '看護師',
  pharmacist: '薬剤師',
  social_worker: 'ソーシャルワーカー',
  counselor: 'カウンセラー',
  nutritionist: '栄養士',
  other: 'その他'
}

const MedicalTeamList: React.FC<MedicalTeamListProps> = ({ 
  onEditInstitution,
  onEditProfessional,
  refreshTrigger 
}) => {
  const { user } = useAuth()
  const [institutions, setInstitutions] = useState<MedicalInstitution[]>([])
  const [professionals, setProfessionals] = useState<MedicalProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'institutions' | 'professionals'>('institutions')

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, refreshTrigger])

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // 医療機関を取得
      const institutionsResult = await supabase
        .from('medical_institutions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // 医療従事者を取得（医療機関情報も含む）
      const professionalsResult = await supabase
        .from('medical_professionals')
        .select(`
          *,
          institution:medical_institutions(name, type)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (institutionsResult.error) throw institutionsResult.error
      if (professionalsResult.error) throw professionalsResult.error

      setInstitutions(institutionsResult.data || [])
      setProfessionals(professionalsResult.data || [])
    } catch (error: any) {
      console.error('Data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInstitution = async (institutionId: string) => {
    if (!confirm('この医療機関を削除してもよろしいですか？関連する医療従事者の所属情報も削除されます。')) return

    try {
      const { error } = await supabase
        .from('medical_institutions')
        .delete()
        .eq('id', institutionId)

      if (error) throw error

      setInstitutions(prev => prev.filter(inst => inst.id !== institutionId))
      // 関連する医療従事者の所属情報もクリア
      setProfessionals(prev => prev.map(prof => 
        prof.institution_id === institutionId 
          ? { ...prof, institution_id: undefined, institution: undefined }
          : prof
      ))
    } catch (error: any) {
      console.error('Delete error:', error)
      alert('削除に失敗しました。')
    }
  }

  const handleDeleteProfessional = async (professionalId: string) => {
    if (!confirm('この医療従事者を削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('medical_professionals')
        .delete()
        .eq('id', professionalId)

      if (error) throw error

      setProfessionals(prev => prev.filter(prof => prof.id !== professionalId))
    } catch (error: any) {
      console.error('Delete error:', error)
      alert('削除に失敗しました。')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-deep-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">データを読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* タブ切り替え */}
      <Card>
        <CardContent>
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('institutions')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'institutions'
                  ? 'border-b-2 border-deep-blue-500 text-deep-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              医療機関 ({institutions.length})
            </button>
            <button
              onClick={() => setActiveTab('professionals')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'professionals'
                  ? 'border-b-2 border-deep-blue-500 text-deep-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              医療従事者 ({professionals.length})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 医療機関一覧 */}
      {activeTab === 'institutions' && (
        <div className="space-y-4">
          {institutions.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">医療機関がまだ登録されていません。</p>
                  <p className="text-sm text-gray-500">
                    最初の医療機関を登録して、医療チーム情報の管理を始めましょう。
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            institutions.map((institution) => (
              <Card key={institution.id} variant={institution.is_primary ? 'outlined' : 'default'}>
                <CardContent>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-deep-blue-100 text-deep-blue-800">
                          {INSTITUTION_TYPE_LABELS[institution.type]}
                        </span>
                        {institution.is_primary && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warm-coral-100 text-warm-coral-800">
                            主治医所属
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {institution.name}
                      </h3>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📍 {institution.address}</p>
                        <p>📞 {institution.phone}</p>
                        {institution.website && (
                          <p>🌐 <a href={institution.website} target="_blank" rel="noopener noreferrer" className="text-deep-blue-600 hover:underline">{institution.website}</a></p>
                        )}
                      </div>
                      
                      {institution.notes && (
                        <p className="text-gray-600 mt-3 text-sm">
                          {institution.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {onEditInstitution && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onEditInstitution(institution)}
                        >
                          編集
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteInstitution(institution.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 border-t pt-2">
                    登録日: {formatDate(institution.created_at)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 医療従事者一覧 */}
      {activeTab === 'professionals' && (
        <div className="space-y-4">
          {professionals.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">医療従事者がまだ登録されていません。</p>
                  <p className="text-sm text-gray-500">
                    主治医や看護師など、医療チームのメンバーを登録しましょう。
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            professionals.map((professional) => (
              <Card key={professional.id} variant={professional.is_primary_doctor ? 'outlined' : 'default'}>
                <CardContent>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-deep-blue-100 text-deep-blue-800">
                          {PROFESSIONAL_ROLE_LABELS[professional.role]}
                        </span>
                        {professional.is_primary_doctor && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warm-coral-100 text-warm-coral-800">
                            主治医
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {professional.name}
                      </h3>
                      
                      {professional.specialization && (
                        <p className="text-sm text-gray-600 mb-2">
                          専門分野: {professional.specialization}
                        </p>
                      )}
                      
                      {professional.institution && (
                        <p className="text-sm text-gray-600 mb-2">
                          所属: {professional.institution.name}
                        </p>
                      )}
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {professional.phone && <p>📞 {professional.phone}</p>}
                        {professional.email && <p>📧 {professional.email}</p>}
                      </div>
                      
                      {professional.notes && (
                        <p className="text-gray-600 mt-3 text-sm">
                          {professional.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {onEditProfessional && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onEditProfessional(professional)}
                        >
                          編集
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteProfessional(professional.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 border-t pt-2">
                    登録日: {formatDate(professional.created_at)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default MedicalTeamList 