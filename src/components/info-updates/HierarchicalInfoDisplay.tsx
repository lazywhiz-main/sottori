'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { InfoUpdate } from '@/lib/types/info-updates'
import { InfoSection } from '@/components/ui/InfoSection'
import { InfoCard, InfoBadge } from '@/components/ui/InfoCard'

interface HierarchicalInfoDisplayProps {
  updates: InfoUpdate[]
  cancerType?: string
  stage?: string
  sectionRefs?: {
    treatment: React.RefObject<HTMLDivElement>
    guidelines: React.RefObject<HTMLDivElement>
    support: React.RefObject<HTMLDivElement>
    sideEffects: React.RefObject<HTMLDivElement>
    clinicalTrials: React.RefObject<HTMLDivElement>
    other: React.RefObject<HTMLDivElement>
  }
}

interface TreatmentInfo {
  name: string
  description: string
  effectiveness: string
  sideEffects: string[]
  eligibility: string
  source: string
}

interface GuidelineInfo {
  title: string
  recommendations: {
    type: 'strong' | 'moderate' | 'weak'
    content: string
    evidence: string
  }[]
  source: string
  lastUpdated: string
}

interface SupportInfo {
  type: 'financial' | 'emotional' | 'practical'
  title: string
  description: string
  eligibility: string
  contact: string
  source: string
}

export default function HierarchicalInfoDisplay({ 
  updates, 
  cancerType = 'がん',
  stage = '全段階',
  sectionRefs
}: HierarchicalInfoDisplayProps) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['treatment']))
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null)

  // 情報をカテゴリ別に分類
  const categorizedInfo = React.useMemo(() => {
    const treatment: (TreatmentInfo & { originalUpdate: InfoUpdate })[] = []
    const guidelines: (GuidelineInfo & { originalUpdate: InfoUpdate })[] = []
    const support: (SupportInfo & { originalUpdate: InfoUpdate })[] = []
    const sideEffects: InfoUpdate[] = []
    const clinicalTrials: InfoUpdate[] = []
    const other: InfoUpdate[] = []

    updates.forEach(update => {
      // 治療法: categoryがtreatment_optionsなら全て表示
      if (update.category === 'treatment_options') {
        treatment.push({
          name: update.title || '治療法',
          description: update.summary || update.content || '',
          effectiveness: '（効果情報未設定）',
          sideEffects: ['（副作用情報未設定）'],
          eligibility: '（対象情報未設定）',
          source: update.source_url || '',
          originalUpdate: update
        })
      }
      // ガイドライン: categoryがguidelinesなら全て表示
      else if (update.category && String(update.category) === 'guidelines') {
        guidelines.push({
          title: update.title || 'ガイドライン',
          recommendations: [
            {
              type: 'moderate',
              content: update.summary || update.content || '',
              evidence: ''
            }
          ],
          source: update.source_url || '',
          lastUpdated: update.created_at || '',
          originalUpdate: update
        })
      }
      // サポート: categoryがsupport_resourcesなら全て表示（現状維持）
      else if (update.category === 'support_resources') {
        support.push({
          type: 'financial',
          title: update.title,
          description: update.summary || update.content,
          eligibility: '詳細は各機関にお問い合わせください',
          contact: '厚労省がん情報サービス',
          source: update.source_url || '',
          originalUpdate: update
        })
      } else if (update.category === 'side_effects') {
        sideEffects.push(update)
      } else if (update.category === 'clinical_trials') {
        clinicalTrials.push(update)
      } else {
        other.push(update)
      }
    })

    return { treatment, guidelines, support, sideEffects, clinicalTrials, other }
  }, [updates])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleReadMore = (update: InfoUpdate) => {
    // 詳細ページへの遷移
    router.push(`/info-updates/${update.id}`)
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {cancerType}の治療・サポート情報
        </h2>
        <p className="text-gray-600">
          段階: {stage} | 最終更新: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* 1. 治療法セクション */}
      {categorizedInfo.treatment.length > 0 && (
        <div ref={sectionRefs?.treatment}>
          <InfoSection
            title="治療法"
            icon="💊"
            variant="treatment"
          >
            {categorizedInfo.treatment.map((item, index) => (
              <InfoCard
                key={index}
                title={item.name}
                subtitle={item.source}
                badge={<InfoBadge variant="info">治療法</InfoBadge>}
              >
                <div className="space-y-3">
                  <p className="text-gray-700">{item.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">効果:</span>
                      <p className="text-gray-600">{item.effectiveness}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">副作用:</span>
                      <p className="text-gray-600">{item.sideEffects.join(', ')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">対象:</span>
                      <p className="text-gray-600">{item.eligibility}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReadMore(item.originalUpdate)}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </div>
              </InfoCard>
            ))}
          </InfoSection>
        </div>
      )}

      {/* 2. ガイドラインセクション */}
      {categorizedInfo.guidelines.length > 0 && (
        <div ref={sectionRefs?.guidelines}>
          <InfoSection
            title="ガイドライン"
            icon="📋"
            variant="guidelines"
          >
            {categorizedInfo.guidelines.map((item, index) => (
              <InfoCard
                key={index}
                title={item.title}
                subtitle={item.source}
                badge={<InfoBadge variant="priority-medium">ガイドライン</InfoBadge>}
              >
                <div className="space-y-3">
                  {item.recommendations.map((rec, recIndex) => (
                    <div key={recIndex} className="p-3 bg-golden-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-golden-yellow-700">
                          {rec.type === 'strong' ? '強く推奨' : 
                           rec.type === 'moderate' ? '推奨' : '弱い推奨'}
                        </span>
                      </div>
                      <p className="text-gray-700">{rec.content}</p>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReadMore(item.originalUpdate)}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </div>
              </InfoCard>
            ))}
          </InfoSection>
        </div>
      )}

      {/* 3. サポート情報セクション */}
      {categorizedInfo.support.length > 0 && (
        <div ref={sectionRefs?.support}>
          <InfoSection
            title="サポート情報"
            icon="🤝"
            variant="support"
          >
            {categorizedInfo.support.map((item, index) => (
              <InfoCard
                key={index}
                title={item.title}
                subtitle={item.source}
                badge={<InfoBadge variant="priority-low">サポート</InfoBadge>}
              >
                <div className="space-y-3">
                  <p className="text-gray-700">{item.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">連絡先:</span>
                      <p className="text-gray-600">{item.contact}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReadMore(item.originalUpdate)}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </div>
              </InfoCard>
            ))}
          </InfoSection>
        </div>
      )}

      {/* 4. 副作用・対処法セクション */}
      {categorizedInfo.sideEffects.length > 0 && (
        <div ref={sectionRefs?.sideEffects}>
          <InfoSection
            title="副作用・対処法"
            icon="💊"
            variant="side-effects"
          >
            {categorizedInfo.sideEffects.map((update, index) => (
              <InfoCard
                key={update.id || index}
                title={update.title}
                subtitle={update.source_url}
                badge={<InfoBadge variant="priority-high">副作用</InfoBadge>}
              >
                <div className="space-y-3">
                  <p className="text-gray-700 line-clamp-3">
                    {update.summary || update.content}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReadMore(update)}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </div>
              </InfoCard>
            ))}
          </InfoSection>
        </div>
      )}

      {/* 5. 治験情報セクション */}
      {categorizedInfo.clinicalTrials.length > 0 && (
        <div ref={sectionRefs?.clinicalTrials}>
          <InfoSection
            title="治験情報"
            icon="🔬"
            variant="clinical-trials"
          >
            {categorizedInfo.clinicalTrials.map((update, index) => (
              <InfoCard
                key={update.id || index}
                title={update.title}
                subtitle={update.source_url}
                badge={<InfoBadge variant="new">治験</InfoBadge>}
              >
                <div className="space-y-3">
                  <p className="text-gray-700 line-clamp-3">
                    {update.summary || update.content}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReadMore(update)}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </div>
              </InfoCard>
            ))}
          </InfoSection>
        </div>
      )}

      {/* 4. その他セクション */}
      {categorizedInfo.other.length > 0 && (
        <div ref={sectionRefs?.other}>
          <InfoSection
            title="その他の情報"
            icon="📄"
            variant="treatment"
          >
            {categorizedInfo.other.map((update, index) => (
              <InfoCard
                key={update.id || index}
                title={update.title}
                subtitle={`${update.category} | ${update.source_url}`}
                badge={<InfoBadge variant="info">その他</InfoBadge>}
              >
                <div className="space-y-3">
                  <p className="text-gray-700 line-clamp-3">
                    {update.summary || update.content}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReadMore(update)}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </div>
              </InfoCard>
            ))}
          </InfoSection>
        </div>
      )}

      {/* データがない場合 */}
      {Object.values(categorizedInfo).every(arr => arr.length === 0) && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            情報が見つかりません
          </h3>
          <p className="text-gray-600">
            現在、表示できる情報がありません。<br />
            最新情報の取得を試してみてください。
          </p>
        </div>
      )}

      {/* 情報源と更新状況 */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            <p>情報源: 厚生労働省がん情報サービス、各医学会ガイドライン</p>
            <p className="mt-1">
              この情報は参考情報です。具体的な治療方針は主治医とご相談ください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 