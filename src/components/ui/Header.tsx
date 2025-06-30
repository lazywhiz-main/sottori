'use client'

import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Button from './Button'

interface HeaderProps {
  title?: string
  subtitle?: string
}

const Header: React.FC<HeaderProps> = ({ title = 'Sottori', subtitle }) => {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
          {user && !subtitle && (
            <p className="text-sm text-gray-600">
              こんにちは、{user.user_metadata?.full_name || user.email}さん
            </p>
          )}
        </div>
        
        {user && (
          <nav className="flex gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              ダッシュボード
            </Button>
            <Button variant="ghost" onClick={() => router.push('/yukkuri-check')}>
              セルフチェック
            </Button>
            <Button variant="ghost" onClick={() => router.push('/roadmap')}>
              専用ガイド
            </Button>
            <Button variant="ghost" onClick={() => router.push('/profile')}>
              プロフィール
            </Button>
            <Button variant="ghost" onClick={() => router.push('/medical-records')}>
              医療記録
            </Button>
            <Button variant="ghost" onClick={() => router.push('/medical-team')}>
              医療チーム
            </Button>
            <Button variant="ghost" onClick={() => router.push('/appointments')}>
              予定
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              ログアウト
            </Button>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header 