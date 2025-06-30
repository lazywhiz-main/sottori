import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onToggleMode }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        })
        
        if (error) throw error
        setMessage('確認メールをお送りしました。メールをご確認ください。')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        setMessage('ログインしました。')
      }
    } catch (error) {
      console.error('Auth error:', error)
      setMessage(error instanceof Error ? error.message : 'エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="elevated" className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-deep-blue-500">
          {mode === 'signin' ? 'ログイン' : 'アカウント作成'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                お名前
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
                placeholder="お名前を入力してください"
                required
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
              placeholder="メールアドレスを入力してください"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 focus:border-transparent"
              placeholder="パスワードを入力してください"
              minLength={6}
              required
            />
          </div>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('エラー') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}
          
          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className="w-full"
            disabled={loading}
          >
            {loading ? '処理中...' : (mode === 'signin' ? 'ログイン' : 'アカウント作成')}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-deep-blue-500 hover:text-deep-blue-600 text-sm underline"
          >
            {mode === 'signin' 
              ? 'アカウントをお持ちでない方はこちら' 
              : 'すでにアカウントをお持ちの方はこちら'
            }
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AuthForm 