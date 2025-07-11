import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義（後で拡張）
export type Database = {
  public: {
    Tables: Record<string, unknown>
  }
} 