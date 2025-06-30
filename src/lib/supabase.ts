import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables')
}

// デバッグ用ログ（本番では削除）
// console.log('Supabase URL:', supabaseUrl)
// console.log('Supabase Anon Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Sottori データベース型定義
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          date_of_birth: string | null
          phone: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          medical_conditions: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          date_of_birth?: string | null
          phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_conditions?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          date_of_birth?: string | null
          phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_conditions?: string[] | null
          updated_at?: string
        }
      }
      medical_institutions: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          address: string | null
          phone: string | null
          website: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          address?: string | null
          phone?: string | null
          website?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          address?: string | null
          phone?: string | null
          website?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      medical_professionals: {
        Row: {
          id: string
          user_id: string
          institution_id: string | null
          name: string
          specialty: string | null
          role: string | null
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          institution_id?: string | null
          name: string
          specialty?: string | null
          role?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          institution_id?: string | null
          name?: string
          specialty?: string | null
          role?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      medical_records: {
        Row: {
          id: string
          user_id: string
          institution_id: string | null
          professional_id: string | null
          record_type: string
          title: string
          content: string | null
          record_date: string
          attachments: string[] | null
          tags: string[] | null
          is_important: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          institution_id?: string | null
          professional_id?: string | null
          record_type: string
          title: string
          content?: string | null
          record_date: string
          attachments?: string[] | null
          tags?: string[] | null
          is_important?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          institution_id?: string | null
          professional_id?: string | null
          record_type?: string
          title?: string
          content?: string | null
          record_date?: string
          attachments?: string[] | null
          tags?: string[] | null
          is_important?: boolean
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          institution_id: string | null
          professional_id: string | null
          title: string
          description: string | null
          appointment_date: string
          duration_minutes: number
          status: string
          reminder_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          institution_id?: string | null
          professional_id?: string | null
          title: string
          description?: string | null
          appointment_date: string
          duration_minutes?: number
          status?: string
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          institution_id?: string | null
          professional_id?: string | null
          title?: string
          description?: string | null
          appointment_date?: string
          duration_minutes?: number
          status?: string
          reminder_sent?: boolean
          updated_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          user_id: string
          professional_id: string | null
          name: string
          dosage: string | null
          frequency: string | null
          start_date: string | null
          end_date: string | null
          instructions: string | null
          side_effects: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          professional_id?: string | null
          name: string
          dosage?: string | null
          frequency?: string | null
          start_date?: string | null
          end_date?: string | null
          instructions?: string | null
          side_effects?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          professional_id?: string | null
          name?: string
          dosage?: string | null
          frequency?: string | null
          start_date?: string | null
          end_date?: string | null
          instructions?: string | null
          side_effects?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      notes_and_questions: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string
          category: string | null
          priority: string
          is_resolved: boolean
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content: string
          category?: string | null
          priority?: string
          is_resolved?: boolean
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string
          category?: string | null
          priority?: string
          is_resolved?: boolean
          resolved_at?: string | null
          updated_at?: string
        }
      }
    }
  }
} 