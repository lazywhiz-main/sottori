'use client'

import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import AISettingsPanel from '@/components/ui/AISettingsPanel'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

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

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue-50 via-white to-soft-peach-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Sottori</h1>
            <p className="text-sm text-gray-600">
              こんにちは、{user.user_metadata?.full_name || user.email}さん
            </p>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            ログアウト
          </Button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-light text-gray-900 mb-2">
            ダッシュボード
          </h2>
          <p className="text-gray-600">
            あなたの情報を整理し、次の一歩をサポートします。
          </p>
        </div>

        {/* 機能カード */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-warm-coral-400">ゆっくりセルフチェック</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                今の状況や気持ちを整理し、次の一歩をサポートします。
              </p>
              <Button variant="secondary" size="sm" onClick={() => router.push('/yukkuri-check')}>
                チェックを始める
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-deep-blue-500">あなた専用ガイド</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                セルフチェックの結果から、あなたに最適な情報をまとめて提供します。
              </p>
              <Button variant="primary" size="sm" onClick={() => router.push('/roadmap')}>
                ガイドを見る
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-deep-blue-500">医療情報の整理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                診断結果、治療選択肢、医療機関情報などを一箇所で管理できます。
              </p>
              <Button variant="primary" size="sm" onClick={() => router.push('/medical-records')}>
                情報を追加
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-warm-coral-400">医療チーム管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                医師、看護師、医療機関など、医療チームの情報を管理できます。
              </p>
              <Button variant="secondary" size="sm" onClick={() => router.push('/medical-team')}>
                医療チームを管理
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-golden-yellow-500">予定・アポイントメント</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                医療機関での予約や検査スケジュールを管理できます。
              </p>
              <Button variant="outline" size="sm" onClick={() => router.push('/appointments')}>
                予定を管理
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-warm-coral-400">かんたん共有・保存</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                あなた専用ガイドを家族と共有したり、PDFで保存できます。
              </p>
              <Button variant="secondary" size="sm" onClick={() => router.push('/roadmap')}>
                共有・保存する
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI機能設定 */}
        <div className="mb-8">
          <AISettingsPanel />
        </div>

        {/* クイックアクション */}
        <Card variant="outlined">
          <CardHeader>
            <CardTitle>今日のアクション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">ゆっくりセルフチェックを試す</span>
                <Button variant="ghost" size="sm" onClick={() => router.push('/yukkuri-check')}>
                  開始
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">プロフィール情報を完成させる</span>
                <Button variant="ghost" size="sm" onClick={() => router.push('/profile')}>
                  設定
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">最初の医療情報を追加する</span>
                <Button variant="ghost" size="sm" onClick={() => router.push('/medical-records')}>
                  開始
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">医療チーム情報を登録する</span>
                <Button variant="ghost" size="sm" onClick={() => router.push('/medical-team')}>
                  開始
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">次回の予定を確認する</span>
                <Button variant="ghost" size="sm" onClick={() => router.push('/appointments')}>
                  確認
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 