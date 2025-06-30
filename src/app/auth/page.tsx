'use client'

import React, { useState } from 'react'
import AuthForm from '@/components/forms/AuthForm'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue-50 via-white to-soft-peach-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Sottori
          </h1>
          <p className="text-gray-600">
            迷っても、頼ってもいい。次の一歩は、あなたのペースで。
          </p>
        </div>
        
        <AuthForm mode={mode} onToggleMode={toggleMode} />
      </div>
    </div>
  )
} 