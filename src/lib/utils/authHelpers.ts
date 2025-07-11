import { NextRequest } from 'next/server'
import { supabase } from '../supabase'

// 認証ヘッダーからユーザーIDを取得
export async function getUserIdFromAuthHeader(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }

  try {
    // Bearer トークンの場合
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      
      // JWTトークンを検証
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        console.error('Token validation failed:', error)
        return null
      }
      
      return user.id
    }
    
    // 直接ユーザーIDの場合（開発用）
    if (authHeader.length === 36) { // UUIDの長さ
      return authHeader
    }
    
    return null
  } catch (error) {
    console.error('Failed to extract user ID from auth header:', error)
    return null
  }
}

// 認証チェック
export async function validateAuth(request: NextRequest): Promise<{ userId: string } | { error: string }> {
  const userId = await getUserIdFromAuthHeader(request)
  
  if (!userId) {
    return { error: '認証が必要です' }
  }
  
  return { userId }
}

// ユーザーの存在確認
export async function validateUserExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (error || !data) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('Failed to validate user exists:', error)
    return false
  }
} 