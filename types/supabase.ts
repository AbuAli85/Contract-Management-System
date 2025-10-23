export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contracts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          contract_number: string | null
          job_title: string | null
          status: string | null
          approval_status: string | null
          first_party_id: string | null
          second_party_id: string | null
          client_id: string | null
          employer_id: string | null
          promoter_id: string | null
          salary: number | null
          currency: string | null
          contract_start_date: string | null
          contract_end_date: string | null
          approved_at: string | null
          approved_by: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          changes_requested_at: string | null
          changes_requested_by: string | null
          changes_requested_reason: string | null
          sent_to_legal_at: string | null
          sent_to_legal_by: string | null
          sent_to_hr_at: string | null
          sent_to_hr_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          contract_number?: string | null
          job_title?: string | null
          status?: string | null
          approval_status?: string | null
          first_party_id?: string | null
          second_party_id?: string | null
          client_id?: string | null
          employer_id?: string | null
          promoter_id?: string | null
          salary?: number | null
          currency?: string | null
          contract_start_date?: string | null
          contract_end_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          changes_requested_at?: string | null
          changes_requested_by?: string | null
          changes_requested_reason?: string | null
          sent_to_legal_at?: string | null
          sent_to_legal_by?: string | null
          sent_to_hr_at?: string | null
          sent_to_hr_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          contract_number?: string | null
          job_title?: string | null
          status?: string | null
          approval_status?: string | null
          first_party_id?: string | null
          second_party_id?: string | null
          client_id?: string | null
          employer_id?: string | null
          promoter_id?: string | null
          salary?: number | null
          currency?: string | null
          contract_start_date?: string | null
          contract_end_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          changes_requested_at?: string | null
          changes_requested_by?: string | null
          changes_requested_reason?: string | null
          sent_to_legal_at?: string | null
          sent_to_legal_by?: string | null
          sent_to_hr_at?: string | null
          sent_to_hr_by?: string | null
        }
      }
      parties: {
        Row: {
          id: string
          name_en: string
          name_ar: string | null
          email: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_en: string
          name_ar?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_en?: string
          name_ar?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      promoters: {
        Row: {
          id: string
          name_en: string
          name_ar: string | null
          email: string | null
          phone: string | null
          id_card_number: string | null
          id_card_url: string | null
          passport_url: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_en: string
          name_ar?: string | null
          email?: string | null
          phone?: string | null
          id_card_number?: string | null
          id_card_url?: string | null
          passport_url?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_en?: string
          name_ar?: string | null
          email?: string | null
          phone?: string | null
          id_card_number?: string | null
          id_card_url?: string | null
          passport_url?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contract_activity_logs: {
        Row: {
          id: string
          contract_id: string
          user_id: string
          action: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          user_id: string
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          user_id?: string
          action?: string
          details?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
