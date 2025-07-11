'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import { InfoUpdate } from '../../lib/types/info-updates'
import { InfoSection } from '../ui/InfoSection'
import { InfoCard, InfoBadge } from '../ui/InfoCard'

interface HierarchicalInfoDisplayProps {
  updates: InfoUpdate[]
  cancerType?: string
  stage?: string
  sectionRefs?: {
    treatment: React.RefObject<HTMLDivElement>
    diagnosis: React.RefObject<HTMLDivElement>
    support: React.RefObject<HTMLDivElement>
    lifestyle: React.RefObject<HTMLDivElement>
    research: React.RefObject<HTMLDivElement>
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
    const diagnosis: InfoUpdate[] = []
    const support: (SupportInfo & { originalUpdate: InfoUpdate })[] = []
    const lifestyle: InfoUpdate[] = []
    const research: InfoUpdate[] = []
    const other: InfoUpdate[] = []

    updates.forEach(update => {
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
      } else if (update.category === 'diagnosis') {
        diagnosis.push(update)
      } else if (update.category === 'support_resources') {
        support.push({
          type: 'financial',
          title: update.title,
          description: update.summary || update.content,
          eligibility: '詳細は各機関にお問い合わせください',
          contact: '厚労省がん情報サービス',
          source: update.source_url || '',
          originalUpdate: update
        })
      } else if (update.category === 'lifestyle') {
        lifestyle.push(update)
      } else if (update.category === 'research_news') {
        research.push(update)
      } else {
        other.push(update)
      }
    })

    return { treatment, diagnosis, support, lifestyle, research, other }
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

      {/* 2. 診断・検査セクション */}
      {categorizedInfo.diagnosis.length > 0 && (
        <div ref={sectionRefs?.diagnosis}>
          <InfoSection
            title="診断・検査"
            icon="🩺"
            variant="guidelines"
          >
            {categorizedInfo.diagnosis.map((item, index) => (
              <InfoCard
                key={index}
                title={item.title}
                subtitle={item.source_url}
                badge={<InfoBadge variant="info">診断・検査</InfoBadge>}
              >
                <div className="space-y-3">
                  <p className="text-gray-700">{item.summary || item.content}</p>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReadMore(item)}
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

      {/* 3. サポートセクション（現状維持） */}
      {categorizedInfo.support.length > 0 && (
        <div ref={sectionRefs?.support}>
          <InfoSection
            title="サポート"
            icon="🤝"
            variant="support"
          >
            {categorizedInfo.support.map((item, index) => (
              <InfoCard
                key={index}
                title={item.title}
                subtitle={item.source}
                badge={<InfoBadge variant="info">サポート</InfoBadge>}
              >
                <div className="space-y-3">
                  <p className="text-gray-700">{item.description}</p>
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

      {/* 4. 生活・副作用セクション */}
      {categorizedInfo.lifestyle.length > 0 && (
        <div ref={sectionRefs?.lifestyle}>
          <InfoSection
            title="生活・副作用"
            icon="🍀"
            variant="side-effects"
          >
            {categorizedInfo.lifestyle.map((item, index) => (
              <InfoCard
                key={index}
                title={item.title}
                subtitle={item.source_url}
                badge={<InfoBadge variant="info">生活・副作用</InfoBadge>}
              >
                <div className="space-y-3">
                  <p className="text-gray-700">{item.summary || item.content}</p>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReadMore(item)}
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

      {/* 5. 研究・治験セクション */}
      {categorizedInfo.research.length > 0 && (
        <div ref={sectionRefs?.research}>
          <InfoSection
            title="研究・治験"
            icon="🔬"
            variant="clinical-trials"
          >
            {categorizedInfo.research.map((item, index) => (
              <InfoCard
                key={index}
                title={item.title}
                subtitle={item.source_url}
                badge={<InfoBadge variant="info">研究・治験</InfoBadge>}
              >
                <div className="space-y-3">
                  <p className="text-gray-700">{item.summary || item.content}</p>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReadMore(item)}
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