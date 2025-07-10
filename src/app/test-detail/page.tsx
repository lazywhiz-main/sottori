'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function TestDetailPage() {
  const { user, loading } = useAuth()
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testDetailAPI = async () => {
    try {
      if (!user) {
        setError('ユーザーが認証されていません')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('セッションが見つかりません')
        return
      }

      // まずstructured_content_poolからIDを取得
      const { data: contentIds } = await supabase
        .from('structured_content_pool')
        .select('id')
        .limit(1)

      if (!contentIds || contentIds.length === 0) {
        setError('structured_content_poolにデータがありません')
        return
      }

      const testId = contentIds[0].id
      console.log('テスト用ID:', testId)

      // 詳細APIをテスト
      const response = await fetch(`/api/info-updates/read/${testId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `APIエラー: ${response.status}`)
      }

      const data = await response.json()
      setTestResult(data)
      console.log('詳細API結果:', data)

    } catch (err) {
      console.error('テストエラー:', err)
      setError(err instanceof Error ? err.message : '不明なエラー')
    }
  }

  const testPersonalization = async () => {
    try {
      if (!user) {
        setError('ユーザーが認証されていません')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('セッションが見つかりません')
        return
      }

      console.log('個人化エンジンを実行中...')
      
      const response = await fetch('/api/personalization/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: session.user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '個人化エンジンの実行に失敗しました')
      }

      const result = await response.json()
      setTestResult(result)
      console.log('個人化エンジン結果:', result)

    } catch (err) {
      console.error('個人化テストエラー:', err)
      setError(err instanceof Error ? err.message : '不明なエラー')
    }
  }

  if (loading) {
    return <div className="p-8">読み込み中...</div>
  }

  if (!user) {
    return <div className="p-8">認証が必要です</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">テストページ</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">データベース状況確認</h2>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/test-db')
                const data = await response.json()
                setTestResult(data)
              } catch (err) {
                setError(err instanceof Error ? err.message : '不明なエラー')
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            データベース状況を確認
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">詳細APIテスト</h2>
          <button
            onClick={testDetailAPI}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            詳細APIをテスト
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">個人化エンジンテスト</h2>
          <button
            onClick={testPersonalization}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            個人化エンジンをテスト
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-semibold">エラー:</h3>
          <p>{error}</p>
        </div>
      )}

      {testResult && (
        <div className="mt-6 p-4 bg-gray-100 border border-gray-400 rounded">
          <h3 className="font-semibold mb-2">テスト結果:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 