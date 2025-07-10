'use client'

import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ProfileForm from '@/components/forms/ProfileForm'
import CancerProfileForm from '@/components/forms/CancerProfileForm'
import Button from '@/components/ui/Button'
import { useState } from 'react'

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<'basic' | 'cancer'>('basic')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // URLパラメータから初期セクションを設定
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const section = urlParams.get('section')
      if (section === 'cancer-info') {
        setActiveSection('cancer')
      }
    }
  }, [])

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

        {/* セクション切り替えタブ */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveSection('basic')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'basic'
                  ? 'border-deep-blue-500 text-deep-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              基本情報
            </button>
            <button
              onClick={() => setActiveSection('cancer')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'cancer'
                  ? 'border-deep-blue-500 text-deep-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              がん治療プロフィール
            </button>
          </div>
        </div>

        {/* セクション別コンテンツ */}
        {activeSection === 'basic' ? (
          <ProfileForm />
        ) : (
          <CancerProfileForm />
        )}
      </main>
    </div>
  )
} 