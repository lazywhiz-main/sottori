'use client'

import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/ui/Header'
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard'

export default function DashboardPage() {
  const { user, loading } = useAuth()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue-50 via-white to-soft-peach-50 flex flex-col">
      <Header subtitle="ダッシュボード" />
      
      <div className="flex-1 flex">
        <UnifiedDashboard />
      </div>
    </div>
  )
} 