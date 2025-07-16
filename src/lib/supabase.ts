import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      startups: {
        Row: {
          id: string
          email: string
          name: string
          cnpj: string
          phone: string
          created_at: string
          updated_at: string
          status: 'pending' | 'in_progress' | 'completed' | 'under_review'
          last_activity: string
          completion_date: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          cnpj: string
          phone: string
          created_at?: string
          updated_at?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'under_review'
          last_activity?: string
          completion_date?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          cnpj?: string
          phone?: string
          updated_at?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'under_review'
          last_activity?: string
          completion_date?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          startup_id: string
          category: string
          name: string
          file_url: string
          file_size: number
          file_type: string
          uploaded_at: string
          status: 'pending' | 'uploaded' | 'verified' | 'rejected'
          required: boolean
        }
        Insert: {
          id?: string
          startup_id: string
          category: string
          name: string
          file_url: string
          file_size: number
          file_type: string
          uploaded_at?: string
          status?: 'pending' | 'uploaded' | 'verified' | 'rejected'
          required?: boolean
        }
        Update: {
          id?: string
          startup_id?: string
          category?: string
          name?: string
          file_url?: string
          file_size?: number
          file_type?: string
          uploaded_at?: string
          status?: 'pending' | 'uploaded' | 'verified' | 'rejected'
          required?: boolean
        }
      }
      notifications: {
        Row: {
          id: string
          startup_id: string
          type: 'reminder' | 'completion' | 'welcome' | 'follow_up'
          message: string
          sent_at: string
          status: 'pending' | 'sent' | 'failed'
          whatsapp_message_id: string | null
        }
        Insert: {
          id?: string
          startup_id: string
          type: 'reminder' | 'completion' | 'welcome' | 'follow_up'
          message: string
          sent_at?: string
          status?: 'pending' | 'sent' | 'failed'
          whatsapp_message_id?: string | null
        }
        Update: {
          id?: string
          startup_id?: string
          type?: 'reminder' | 'completion' | 'welcome' | 'follow_up'
          message?: string
          sent_at?: string
          status?: 'pending' | 'sent' | 'failed'
          whatsapp_message_id?: string | null
        }
      }
      admins: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          role: 'admin' | 'super_admin'
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
          role?: 'admin' | 'super_admin'
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'super_admin'
        }
      }
    }
  }
}