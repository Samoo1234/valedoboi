export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  Tables: {
    app_users: {
      Row: {
        id: string
        username: string
        role: string
        full_name: string | null
        created_at: string | null
        auth?: { email: string }[]
      }
      Insert: {
        id?: string
        username: string
        role: string
        full_name?: string | null
        created_at?: string | null
        auth?: { email: string }[]
      }
      Update: {
        id?: string
        username?: string
        role?: string
        full_name?: string | null
        created_at?: string | null
        auth?: { email: string }[]
      }
    }
    user_roles: {
      Row: {
        user_id: string
        role: 'admin' | 'atendente'
        full_name: string | null
        created_at: string
        auth: { email: string }[]
      }
      Insert: {
        user_id: string
        role: 'admin' | 'atendente'
        full_name?: string | null
        created_at?: string
        auth?: { email: string }[]
      }
      Update: {
        user_id?: string
        role?: 'admin' | 'atendente'
        full_name?: string | null
        created_at?: string
        auth?: { email: string }[]
      }
    }
  }
}
