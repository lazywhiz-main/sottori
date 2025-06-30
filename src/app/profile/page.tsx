'use client'

import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ProfileForm from '@/components/forms/ProfileForm'
import Button from '@/components/ui/Button'

export default function ProfilePage() {
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
              プロフィール設定
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              ダッシュボード
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-light text-gray-900 mb-2">
            プロフィール設定
          </h2>
          <p className="text-gray-600">
            あなたの基本情報を管理します。医療従事者との情報共有に役立ちます。
          </p>
        </div>

        <ProfileForm />
      </main>
    </div>
  )
} 