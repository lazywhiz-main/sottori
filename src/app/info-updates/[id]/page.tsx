'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import Header from '@/components/ui/Header'
import { Button } from '@/components/ui/Button'
import { StructuredContent } from '../../../lib/types/info-updates'
import { InfoRelevanceScore } from '../../../lib/types/personalization'
import { 
  CANCER_TYPE_LABELS, 
  STAGE_LABELS, 
  AGE_GROUP_LABELS, 
  REGION_LABELS 
} from '../../../lib/constants/labels'

export default function InfoUpdateDetail() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [update, setUpdate] = useState<StructuredContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRead, setIsRead] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (params.id && user) {
      fetchUpdate()
      checkReadStatus()
      checkSavedStatus()
      // 詳細ページを開いたタイミングで既読マークを自動設定
      markAsReadOnView()
    }
  }, [params.id, user])

  // 詳細ページを開いたタイミングで既読マークを自動設定
  const markAsReadOnView = async () => {
    if (!user || !params.id) return
    
    try {
      // 既にread_completeタイプで記録されているかチェック
      const { data: existingRead } = await supabase
        .from('user_content_consumption_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('structured_content_id', params.id)
        .eq('action_type', 'read_complete')
        .single()

      // まだ記録されていない場合のみinsert
      if (!existingRead) {
        await supabase
          .from('user_content_consumption_history')
          .insert({
            user_id: user.id,
            structured_content_id: params.id,
            action_type: 'read_complete',
            created_at: new Date().toISOString()
          })
        
        setIsRead(true)
      }
    } catch (error) {
      // エラーは無視（既読マークの自動設定は重要ではない）
      console.log('自動既読マーク設定エラー:', error)
    }
  }

  const fetchUpdate = async () => {
    try {
      setLoading(true)
      
      // 認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認証が必要です')
      }

      const response = await fetch(`/api/info-updates/read/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('情報の取得に失敗しました')
      }
      const data = await response.json()
      setUpdate(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const checkReadStatus = async () => {
    if (!user || !params.id) return
    try {
      const { data } = await supabase
        .from('user_content_consumption_history')
        .select('id, user_id, structured_content_id, action_type, created_at')
        .eq('user_id', user.id)
        .eq('structured_content_id', params.id)
        .eq('action_type', 'read_complete')
        .single()
      setIsRead(!!data)
    } catch (error) {
      // エラーは無視（未読として扱う）
    }
  }

  const checkSavedStatus = async () => {
    if (!user || !params.id) return
    try {
      const { data } = await supabase
        .from('user_content_consumption_history')
        .select('id, user_id, structured_content_id, action_type, created_at')
        .eq('user_id', user.id)
        .eq('structured_content_id', params.id)
        .eq('action_type', 'saved')
        .single()
      setIsSaved(!!data)
    } catch (error) {
      // エラーは無視（未保存として扱う）
    }
  }

  const markAsRead = async () => {
    if (!user || !params.id || isRead) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('認証トークンが取得できません')
        return
      }

      await fetch(`/api/info-updates/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ structured_content_id: params.id })
      })
      setIsRead(true)
    } catch (error) {
      console.error('既読マークの設定に失敗しました:', error)
    }
  }

  const toggleSave = async () => {
    if (!user || !params.id) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('認証トークンが取得できません')
        return
      }

      if (isSaved) {
        await fetch(`/api/info-updates/save/${params.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        setIsSaved(false)
      } else {
        await fetch(`/api/info-updates/save/${params.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        setIsSaved(true)
      }
    } catch (error) {
      console.error('保存状態の変更に失敗しました:', error)
    }
  }

  // カテゴリの日本語表示
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'treatment_options': '治療法',
      'doctors': '医師・医療機関',
      'side_effects': '副作用管理',
      'clinical_trials': '治験情報',
      'support_resources': 'サポート情報',
      'financial_assistance': '経済的支援'
    }
    return labels[category] || category
  }

  // 出典タイプの日本語表示
  const getSourceTypeLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      'medical': '医療機関・学会',
      'government': '政府機関',
      'research': '研究機関',
      'news': 'ニュース・メディア',
      'patient_organization': '患者団体',
      'other': 'その他'
    }
    return labels[sourceType] || sourceType
  }

  // 関連度スコアの色分け
  const getRelevanceScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600 bg-success-50'
    if (score >= 60) return 'text-info-600 bg-info-50'
    if (score >= 40) return 'text-warning-600 bg-warning-50'
    return 'text-error-600 bg-error-50'
  }

  // 関連度の説明文
  const getRelevanceExplanation = (score: number) => {
    if (score >= 80) return 'あなたの状況と非常に高い関連性があります'
    if (score >= 60) return 'あなたの状況と高い関連性があります'
    if (score >= 40) return 'あなたの状況と中程度の関連性があります'
    return '一般的な参考情報として提供しています'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-peach-50">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !update) {
    return (
      <div className="min-h-screen bg-soft-peach-50">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              {error || '情報が見つかりませんでした'}
            </h1>
            <Button 
              variant="primary" 
              onClick={() => router.push('/info-updates')}
              className="mt-4"
            >
              一覧に戻る
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soft-peach-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 1. タイトル */}
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6">
            {update.title}
          </h1>
          
          {/* メタ情報 */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-deep-blue-100 text-deep-blue-700 text-sm font-medium rounded-full">
              {getCategoryLabel(update.category)}
            </span>
            {update.personalization && (
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRelevanceScoreColor(update.personalization.final_relevance_score)}`}>
                関連度: {update.personalization.final_relevance_score}点
              </span>
            )}
            {update.evidence_level && (
              <span className="px-3 py-1 bg-golden-yellow-100 text-golden-yellow-700 text-sm font-medium rounded-full">
                エビデンスレベル: {update.evidence_level}
              </span>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant={isRead ? "secondary" : "primary"}
              onClick={markAsRead}
              className="flex items-center gap-2"
            >
              {isRead ? '✓ 既読済み' : '既読にする'}
            </Button>
            <Button 
              variant={isSaved ? "secondary" : "outline"}
              onClick={toggleSave}
              className="flex items-center gap-2"
            >
              {isSaved ? '✓ 保存済み' : '保存する'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/info-updates')}
            >
              一覧に戻る
            </Button>
          </div>
        </section>

        {/* 2. タグ */}
        {update.tags && update.tags.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">🏷️ タグ</h2>
            <div className="flex flex-wrap gap-2">
              {update.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-soft-peach-100 text-deep-blue-700 text-sm rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 3. カテゴリ */}
        <section className="mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">📂 カテゴリ</h2>
          <div className="bg-white p-4 rounded-lg border border-soft-peach-200">
            <span className="text-deep-blue-700 font-medium">
              {getCategoryLabel(update.category)}
            </span>
          </div>
        </section>

        {/* 4. 出典・出典タイプ */}
        <section className="mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">📚 出典・出典タイプ</h2>
          <div className="bg-white p-6 rounded-lg border border-soft-peach-200 space-y-4">
            {update.structured_data?.original_item?.sourceUrl && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">出典URL</h3>
                <a 
                  href={update.structured_data.original_item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-deep-blue-600 hover:text-deep-blue-700 underline break-all"
                >
                  {update.structured_data.original_item.sourceUrl}
                </a>
              </div>
            )}
            {update.structured_data?.original_item?.sourceType && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">出典タイプ</h3>
                <span className="px-3 py-1 bg-golden-yellow-100 text-golden-yellow-700 text-sm font-medium rounded">
                  {getSourceTypeLabel(update.structured_data.original_item.sourceType)}
                </span>
              </div>
            )}
            {update.structured_data?.original_item?.sourceAuthority && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">出典の信頼性</h3>
                <p className="text-gray-700 text-sm">
                  {update.structured_data.original_item.sourceAuthority}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 5. 要約 */}
        <section className="mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">📋 要約</h2>
          <div className="bg-white p-6 rounded-lg border border-soft-peach-200">
            <p className="text-gray-700 leading-relaxed">
              {update.summary}
            </p>
          </div>
        </section>

        {/* 6. 本文 */}
        <section className="mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">📄 本文</h2>
          <div className="bg-white p-6 rounded-lg border border-soft-peach-200">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {update.content}
            </p>
          </div>
        </section>

        {/* 7. 本文へのリンク */}
        {update.structured_data?.original_item?.sourceUrl && (
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">🔗 本文へのリンク</h2>
            <div className="bg-white p-6 rounded-lg border border-soft-peach-200">
              <a 
                href={update.structured_data.original_item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-deep-blue-600 hover:text-deep-blue-700 font-medium"
              >
                <span>元の情報を確認する</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </section>
        )}

        {/* 8. 関連度・関連度が高いと判断した理由 */}
        {update.personalization && (
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">🎯 関連度・関連度が高いと判断した理由</h2>
            <div className="bg-white p-6 rounded-lg border border-soft-peach-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">関連度スコア</h3>
                <span className={`px-4 py-2 text-lg font-bold rounded-lg ${getRelevanceScoreColor(update.personalization.final_relevance_score)}`}>
                  {update.personalization.final_relevance_score}点
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">関連度の説明</h3>
                <p className="text-gray-700">
                  {getRelevanceExplanation(update.personalization.final_relevance_score)}
                </p>
              </div>
              {update.personalization.relevance_explanation && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">詳細な理由</h3>
                  <p className="text-gray-700">
                    {update.personalization.relevance_explanation}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 9. この情報と関連高い他情報（枠のみ） */}
        <section className="mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">🔗 この情報と関連高い他情報</h2>
          <div className="bg-white p-6 rounded-lg border border-soft-peach-200">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🚧</div>
              <p className="text-gray-500">
                関連情報の表示機能は準備中です
              </p>
            </div>
          </div>
        </section>

        {/* 注意喚起 */}
        <section className="mb-8">
          <div className="bg-warning-50 border border-warning-200 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-warning-600 text-xl">⚠️</div>
              <div>
                <h3 className="font-medium text-warning-800 mb-2">医療情報について</h3>
                <p className="text-warning-700 text-sm leading-relaxed">
                  この情報は参考資料として提供されています。具体的な治療方針については、必ず主治医にご相談ください。
                  当サービスは医療機関ではありません。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
} 