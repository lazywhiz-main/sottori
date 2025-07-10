'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Button from './Button'

interface HeaderProps {
  title?: string
  subtitle?: string
}

const Header: React.FC<HeaderProps> = ({ title = 'sottori', subtitle }) => {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleLogoClick = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* ロゴ */}
          <div className="flex items-center">
            <h1 
              className="text-2xl font-medium text-deep-blue-500 cursor-pointer hover:text-deep-blue-600 transition-colors"
              onClick={handleLogoClick}
            >
              {title}
            </h1>
            {subtitle && (
              <span className="ml-3 text-sm text-gray-600 hidden sm:inline">
                {subtitle}
              </span>
            )}
          </div>

          {/* ユーザー情報（モバイル表示） */}
          {user && (
            <div className="md:hidden text-sm text-gray-600">
              こんにちは、{user.user_metadata?.full_name || user.email?.split('@')[0]}さん
            </div>
          )}
          
          {user && (
            <>
              {/* デスクトップナビゲーション */}
              <nav className="hidden md:flex items-center gap-6">
                <Button variant="ghost" onClick={() => router.push('/')}>
                  ホーム
                </Button>
                <Button variant="ghost" onClick={() => router.push('/yukkuri-check')}>
                  ゆっくりチェック
                </Button>
                <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                  ダッシュボード
                </Button>
                <Button variant="ghost" onClick={() => router.push('/roadmap')}>
                  詳細情報
                </Button>
                <div className="border-l border-gray-200 pl-6 ml-2 flex gap-4">
                  <Button variant="ghost" onClick={() => router.push('/profile')}>
                    設定
                  </Button>
                  <Button variant="ghost" onClick={handleSignOut}>
                    ログアウト
                  </Button>
                </div>
              </nav>

              {/* モバイルハンバーガーボタン */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-deep-blue-500 transition-colors"
                onClick={toggleMobileMenu}
                aria-label="メニューを開く"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </>
          )}

          {/* ユーザー情報（デスクトップ表示） */}
          {user && !subtitle && (
            <div className="hidden md:block text-sm text-gray-600">
              こんにちは、{user.user_metadata?.full_name || user.email?.split('@')[0]}さん
            </div>
          )}
        </div>

        {/* モバイルメニュー */}
        {user && isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  router.push('/')
                  setIsMobileMenuOpen(false)
                }}
                className="justify-start"
              >
                ホーム
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  router.push('/yukkuri-check')
                  setIsMobileMenuOpen(false)
                }}
                className="justify-start"
              >
                ゆっくりチェック
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  router.push('/dashboard')
                  setIsMobileMenuOpen(false)
                }}
                className="justify-start"
              >
                ダッシュボード
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  router.push('/roadmap')
                  setIsMobileMenuOpen(false)
                }}
                className="justify-start"
              >
                詳細情報
              </Button>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    router.push('/profile')
                    setIsMobileMenuOpen(false)
                  }}
                  className="justify-start"
                >
                  設定
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    handleSignOut()
                    setIsMobileMenuOpen(false)
                  }}
                  className="justify-start"
                >
                  ログアウト
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header 