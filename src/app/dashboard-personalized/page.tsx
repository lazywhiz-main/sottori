'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Header from '@/components/ui/Header'

export default function PersonalizedDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [personalizationData, setPersonalizationData] = useState({
    segment: '新規診断',
    confidence: 85,
    lastUpdated: '2024年7月2日',
    profileCompleteness: 78
  })

  // プレビュー用のサンプルデータ（元のコードから復元）
  const samplePersonalizationData = {
    segment: 'newly_diagnosed' as const,
    confidence: 85,
    lastUpdated: new Date().toISOString(),
    calculatedScores: 15,
    prioritizedUpdates: {
      immediate: [
        {
          id: 'sample-1',
          user_id: 'preview',
          title: '初回診断後の治療選択肢について',
          summary: 'がん診断を受けた後の一般的な治療選択肢と、セカンドオピニオンの重要性について説明します。',
          category: 'treatment_options' as const,
          created_at: new Date().toISOString(),
          source_url: '#',
          relevance_score: 95,
          content: '診断直後の治療選択...',
          priority: 'high' as const,
          is_read: false,
          is_saved: false,
          metadata: { source_name: '厚生労働省がん情報サービス', tags: ['治療選択', '初期対応'] }
        },
        {
          id: 'sample-2',
          user_id: 'preview',
          title: 'がん専門医の見つけ方',
          summary: 'お住まいの地域でがん専門医を見つける方法と、病院選びのポイントをご紹介します。',
          category: 'doctors' as const,
          created_at: new Date().toISOString(),
          source_url: '#',
          relevance_score: 90,
          content: '専門医選びのポイント...',
          priority: 'high' as const,
          is_read: false,
          is_saved: false,
          metadata: { source_name: '国立がん研究センター', tags: ['専門医', '病院選び'] }
        }
      ],
      upcoming: [
        {
          id: 'sample-3',
          user_id: 'preview',
          title: '治療中の副作用対策',
          summary: '治療開始前に知っておくべき副作用とその対処法について詳しく解説します。',
          category: 'side_effects' as const,
          created_at: new Date().toISOString(),
          source_url: '#',
          relevance_score: 75,
          content: '副作用対策の基本...',
          priority: 'medium' as const,
          is_read: false,
          is_saved: false,
          metadata: { source_name: 'がん情報サービス', tags: ['副作用', '対策'] }
        }
      ]
    }
  }

  // パーソナライズプロフィール情報（実際のDBデータに基づく）
  const profileData = {
    medical: {
      cancerType: '乳がん',
      stage: 'ステージII',
      diagnosisDate: '2024年4月15日',
      treatmentStatus: '治療中',
      currentTreatments: ['化学療法', '放射線治療']
    },
    context: {
      ageRange: '40-49歳',
      region: '東京都 都市部',
      familySupport: '高'
    },
    preferences: {
      informationDepth: '詳細',
      updateFrequency: '毎日',
      priorityAreas: ['治療選択肢', '副作用情報', 'サポートリソース']
    },
    behavior: {
      activeHours: '9-12時, 20-22時',
      readingSpeed: '標準',
      frequentFeatures: ['体調記録', '情報収集', 'ロードマップ']
    }
  }

  const getPersonalizedWelcomeMessage = () => {
    return `${user?.email?.split('@')[0]}さん、お疲れさまでした。`
  }

  const getPersonalizedSubMessage = () => {
    return `今日も一日お疲れさまでした。一緒に情報を整理していきましょう。`
  }

  const getDaysFromDiagnosis = () => {
    const diagnosisDate = new Date('2024-04-15')
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - diagnosisDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // ナビゲーションハンドラー
  const handleYukkuriCheck = () => {
    router.push('/yukkuri-check')
  }

  const handleInfoUpdates = () => {
    router.push('/info-updates')
  }

  const handleRoadmap = () => {
    router.push('/roadmap')
  }

  const handleProfile = () => {
    router.push('/profile')
  }

  const handleAppointments = () => {
    router.push('/appointments')
  }

  const handleStatusUpdate = () => {
    router.push('/status-update')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-50">
      <Header />
      
      {/* メインコンテナ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* メイングリッド */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* 左カラム: パーソナルプロフィール＆AI状況 */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* パーソナルプロフィール＆AI状況エリア */}
            <Card variant="outlined" className="bg-gradient-to-br from-soft-peach-50 to-soft-peach-100 border-2 border-soft-peach-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                {/* ヘッダー */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-deep-blue-500 to-deep-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl text-white">👤</span>
                  </div>
                  <h2 className="text-xl font-bold text-deep-blue-800 mb-2">
                    {getPersonalizedWelcomeMessage()}
                  </h2>
                  <p className="text-deep-blue-700 text-sm">
                    {getPersonalizedSubMessage()}
                  </p>
                </div>

                {/* パーソナライズ情報の詳細 */}
                <div className="space-y-4 text-sm">
                  
                  {/* 医療情報 */}
                  <div className="bg-white/50 rounded-lg p-4">
                    <h3 className="font-semibold text-deep-blue-800 mb-3 flex items-center gap-2">
                      🏥 医療プロフィール
                    </h3>
                    <div className="space-y-2 text-deep-blue-700">
                      <div className="flex justify-between">
                        <span className="text-slate-600">がん種・病期:</span>
                        <span className="font-medium">{profileData.medical.cancerType} {profileData.medical.stage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">診断からの期間:</span>
                        <span className="font-medium">{getDaysFromDiagnosis()}日経過</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">治療状況:</span>
                        <span className="font-medium">{profileData.medical.treatmentStatus}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">現在の治療:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profileData.medical.currentTreatments.map((treatment, index) => (
                            <span key={index} className="px-2 py-1 bg-soft-peach-200 text-deep-blue-700 rounded text-xs">
                              {treatment}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 個人特性 */}
                  <div className="bg-white/50 rounded-lg p-4">
                    <h3 className="font-semibold text-deep-blue-800 mb-3 flex items-center gap-2">
                      📊 個人特性
                    </h3>
                    <div className="space-y-2 text-deep-blue-700">
                      <div className="flex justify-between">
                        <span className="text-slate-600">年代・地域:</span>
                        <span className="font-medium">{profileData.context.ageRange} {profileData.context.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">情報深度:</span>
                        <span className="font-medium">{profileData.preferences.informationDepth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">更新頻度:</span>
                        <span className="font-medium">{profileData.preferences.updateFrequency}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">関心領域:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profileData.preferences.priorityAreas.map((area, index) => (
                            <span key={index} className="px-2 py-1 bg-soft-peach-200 text-deep-blue-700 rounded text-xs">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI分析状況 */}
                  <div className="bg-white/50 rounded-lg p-4">
                    <h3 className="font-semibold text-deep-blue-800 mb-3 flex items-center gap-2">
                      🤖 AI分析状況
                    </h3>
                    <div className="space-y-2 text-deep-blue-700">
                      <div className="flex justify-between">
                        <span className="text-slate-600">セグメント:</span>
                        <span className="font-medium">{personalizationData.segment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">分析済み項目:</span>
                        <span className="font-medium">15件</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">プロフィール完成度:</span>
                        <span className="font-medium">{personalizationData.profileCompleteness}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">最終更新:</span>
                        <span className="font-medium">{personalizationData.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="mt-6 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full text-deep-blue-700 border-deep-blue-300 hover:bg-deep-blue-50"
                    onClick={handleProfile}
                  >
                    プロフィール詳細を編集
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-slate-600 hover:bg-soft-peach-100"
                    onClick={() => {
                      // 個別化エンジンの更新処理（将来実装）
                      console.log('エンジン更新処理')
                    }}
                  >
                    エンジン更新
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右カラム: メインコンテンツエリア */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 体調確認チャット（プライマリー色） */}
            <Card variant="outlined" className="bg-gradient-to-br from-deep-blue-50 to-deep-blue-100 border-2 border-deep-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-deep-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-white">💬</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-deep-blue-800 mb-4">
                    体調はいかがですか？
                  </h2>
                  <p className="text-deep-blue-700 mb-6 text-lg">
                    今日の体調や気になることを教えてください。<br />
                    あなたの状況に合わせて情報をお届けします。
                  </p>
                  <Button 
                    className="bg-deep-blue-500 hover:bg-deep-blue-600 text-white px-8 py-3 text-lg"
                    onClick={handleYukkuriCheck}
                  >
                    体調チェックを始める
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* あなたに関連の深い情報エリア（具体的な情報付き） */}
            <Card variant="outlined" className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                    <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">📋</span>
                    </span>
                    あなたに関連の深い情報
                  </h3>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                    {samplePersonalizationData.prioritizedUpdates.immediate.length}件
                  </span>
                </div>
                
                <div className="space-y-4">
                  {samplePersonalizationData.prioritizedUpdates.immediate.map((update) => (
                    <div key={update.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-800 flex-1 pr-3">
                          {update.title}
                        </h4>
                        <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                          優先度: 高
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {update.summary}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">
                          {update.metadata?.source_name}
                        </span>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-slate-300 text-slate-600 hover:bg-slate-100"
                          onClick={() => {
                            // 個別記事の詳細ページへ（将来実装）
                            router.push(`/info-updates/${update.id}`)
                          }}
                        >
                          詳細を見る
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <Button 
                    variant="outline"
                    className="w-full border-slate-300 text-slate-600 hover:bg-slate-50"
                    onClick={handleInfoUpdates}
                  >
                    すべての情報を見る
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* その他のエリア（2x2グリッド） */}
            <div className="grid sm:grid-cols-2 gap-6">
              
              {/* 近日確認予定 */}
              <Card variant="outlined" className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">📅</span>
                    </span>
                    近日確認予定
                  </h3>
                  
                  <div className="space-y-3">
                    {samplePersonalizationData.prioritizedUpdates.upcoming.map((update) => (
                      <div key={update.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <h4 className="font-medium text-slate-800 text-sm mb-1">
                          {update.title}
                        </h4>
                        <p className="text-slate-600 text-xs line-clamp-2">
                          {update.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 border-slate-300 text-slate-600 hover:bg-slate-50"
                    onClick={handleAppointments}
                  >
                    スケジュール調整
                  </Button>
                </CardContent>
              </Card>

              {/* ロードマップ */}
              <Card variant="outlined" className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">🗺️</span>
                    </span>
                    治療ロードマップ（AI作成）
                  </h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm">
                      <div className="w-3 h-3 bg-slate-500 rounded-full mr-3"></div>
                      <span className="text-slate-700">情報収集（完了）</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-3 h-3 bg-slate-300 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-slate-700">治療選択肢の理解</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-3 h-3 bg-slate-200 rounded-full mr-3"></div>
                      <span className="text-slate-600 opacity-70">専門医との相談</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-300 text-slate-600 hover:bg-slate-50"
                    onClick={handleRoadmap}
                  >
                    詳細ロードマップ
                  </Button>
                </CardContent>
              </Card>

              {/* 週の振り返り */}
              <Card variant="outlined" className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg text-white">📝</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">
                      週の振り返り
                    </h3>
                    <p className="text-slate-700 text-sm mb-4">
                      この1週間の体調変化や気づきをまとめて確認
                    </p>
                    <Button 
                      variant="outline" 
                      className="text-slate-700 border-slate-300 hover:bg-slate-50"
                      onClick={handleStatusUpdate}
                    >
                      振り返る
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 個別化エンジン状況 */}
              <Card variant="outlined" className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">🎯</span>
                    </span>
                    エンジン情報
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">関連度計算</span>
                        <span className="text-sm text-slate-600">完了</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">最新スコア</span>
                        <span className="text-sm text-slate-600">{samplePersonalizationData.confidence}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">処理済み項目</span>
                        <span className="text-sm text-slate-600">{samplePersonalizationData.calculatedScores}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      再計算実行
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 