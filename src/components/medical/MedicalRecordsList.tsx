'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface MedicalRecord {
  id: string
  record_type: string
  title: string
  content: string
  record_date: string
  tags: string[]
  is_important: boolean
  created_at: string
  updated_at: string
}

interface MedicalRecordsListProps {
  onEdit?: (record: MedicalRecord) => void
  refreshTrigger?: number
}

const RECORD_TYPE_LABELS: Record<string, string> = {
  diagnosis: '診断結果',
  treatment: '治療内容',
  prescription: '処方箋',
  test_result: '検査結果',
  consultation: '相談・診察',
  other: 'その他'
}

const MedicalRecordsList: React.FC<MedicalRecordsListProps> = ({ 
  onEdit, 
  refreshTrigger 
}) => {
  const { user } = useAuth()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showImportantOnly, setShowImportantOnly] = useState(false)

  useEffect(() => {
    if (user) {
      fetchRecords()
    }
  }, [user, refreshTrigger])

  const fetchRecords = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('user_id', user.id)
        .order('record_date', { ascending: false })

      if (error) throw error

      setRecords(data || [])
    } catch (error: any) {
      console.error('Records fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm('この医療記録を削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId)

      if (error) throw error

      setRecords(prev => prev.filter(record => record.id !== recordId))
    } catch (error: any) {
      console.error('Delete error:', error)
      alert('削除に失敗しました。')
    }
  }

  // フィルタリングされた記録
  const filteredRecords = records.filter(record => {
    // 検索フィルタ
    const matchesSearch = searchTerm === '' || 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    // タイプフィルタ
    const matchesType = filterType === 'all' || record.record_type === filterType

    // 重要度フィルタ
    const matchesImportant = !showImportantOnly || record.is_important

    return matchesSearch && matchesType && matchesImportant
  })

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
            <p className="text-gray-600">医療記録を読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 検索・フィルタ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-deep-blue-500">医療記録を検索・フィルタ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 検索バー */}
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="タイトル、内容、タグで検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
              />
            </div>

            {/* フィルタオプション */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  記録タイプ
                </label>
                <select
                  id="type-filter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                >
                  <option value="all">すべて</option>
                  {Object.entries(RECORD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showImportantOnly}
                    onChange={(e) => setShowImportantOnly(e.target.checked)}
                    className="w-4 h-4 text-deep-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-deep-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    重要な記録のみ
                  </span>
                </label>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {filteredRecords.length}件の記録が見つかりました
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 記録一覧 */}
      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {records.length === 0 
                  ? '医療記録がまだありません。' 
                  : '条件に一致する記録が見つかりませんでした。'
                }
              </p>
              {records.length === 0 && (
                <p className="text-sm text-gray-500">
                  最初の医療記録を追加して、情報の整理を始めましょう。
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} variant={record.is_important ? 'outlined' : 'default'}>
              <CardContent>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-deep-blue-100 text-deep-blue-800">
                        {RECORD_TYPE_LABELS[record.record_type]}
                      </span>
                      {record.is_important && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warm-coral-100 text-warm-coral-800">
                          重要
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatDate(record.record_date)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {record.title}
                    </h3>
                    
                    {record.content && (
                      <p className="text-gray-600 mb-3 line-clamp-3">
                        {record.content}
                      </p>
                    )}
                    
                    {record.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {record.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEdit(record)}
                      >
                        編集
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      削除
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 border-t pt-2">
                  作成日: {formatDate(record.created_at)}
                  {record.updated_at !== record.created_at && (
                    <span className="ml-4">
                      更新日: {formatDate(record.updated_at)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MedicalRecordsList 