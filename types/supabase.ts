export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievement_rules: {
        Row: {
          badge_type: string
          created_at: string | null
          criteria: Json | null
          id: string
          is_active: boolean | null
          rule_description: string | null
          rule_name: string
          updated_at: string | null
        }
        Insert: {
          badge_type: string
          created_at?: string | null
          criteria?: Json | null
          id?: string
          is_active?: boolean | null
          rule_description?: string | null
          rule_name: string
          updated_at?: string | null
        }
        Update: {
          badge_type?: string
          created_at?: string | null
          criteria?: Json | null
          id?: string
          is_active?: boolean | null
          rule_description?: string | null
          rule_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          permissions: Json | null
          rate_limit: number | null
          revoked_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          rate_limit?: number | null
          revoked_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          rate_limit?: number | null
          revoked_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          custom_field: string | null
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          org_id: string | null
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          custom_field?: string | null
          email: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          org_id?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          custom_field?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          org_id?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string | null
          details: string | null
          entity_id: number | null
          entity_type: string | null
          id: number
          run_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: string | null
          entity_id?: number | null
          entity_type?: string | null
          id?: number
          run_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: string | null
          entity_id?: number | null
          entity_type?: string | null
          id?: number
          run_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      compliance_audit: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          reason: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contract_approvals: {
        Row: {
          comments: string | null
          contract_id: string
          created_at: string | null
          id: string
          reviewer_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          comments?: string | null
          contract_id: string
          created_at?: string | null
          id?: string
          reviewer_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          comments?: string | null
          contract_id?: string
          created_at?: string | null
          id?: string
          reviewer_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "formatted_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_failure_logs: {
        Row: {
          error: string | null
          happened_at: string | null
          id: string
          payload: Json | null
          scenario: string | null
          solved: boolean | null
          step: string | null
        }
        Insert: {
          error?: string | null
          happened_at?: string | null
          id?: string
          payload?: Json | null
          scenario?: string | null
          solved?: boolean | null
          step?: string | null
        }
        Update: {
          error?: string | null
          happened_at?: string | null
          id?: string
          payload?: Json | null
          scenario?: string | null
          solved?: boolean | null
          step?: string | null
        }
        Relationships: []
      }
      contract_notifications: {
        Row: {
          contract_id: string
          contract_number: string
          created_at: string | null
          id: string
          pdf_url: string
        }
        Insert: {
          contract_id: string
          contract_number: string
          created_at?: string | null
          id?: string
          pdf_url: string
        }
        Update: {
          contract_id?: string
          contract_number?: string
          created_at?: string | null
          id?: string
          pdf_url?: string
        }
        Relationships: []
      }
      contract_parties: {
        Row: {
          contract_id: string
          party_id: string
          role: string
        }
        Insert: {
          contract_id: string
          party_id: string
          role: string
        }
        Update: {
          contract_id?: string
          party_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_parties_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_parties_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "formatted_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_parties_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_reviews: {
        Row: {
          comment: string
          contract_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          comment: string
          contract_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          comment?: string
          contract_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "formatted_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          doc_template_id: string
          document_url: string | null
          fields: Json | null
          id: string
          is_active: boolean | null
          make_scenario_id: string | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          doc_template_id: string
          document_url?: string | null
          fields?: Json | null
          id?: string
          is_active?: boolean | null
          make_scenario_id?: string | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          doc_template_id?: string
          document_url?: string | null
          fields?: Json | null
          id?: string
          is_active?: boolean | null
          make_scenario_id?: string | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_versions: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          contract_id: string | null
          data: Json | null
          id: string
          version_number: number | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          contract_id?: string | null
          data?: Json | null
          id?: string
          version_number?: number | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          contract_id?: string | null
          data?: Json | null
          id?: string
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "formatted_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          allowances: number | null
          approval_status: string | null
          basic_salary: number | null
          contract_end_date: string | null
          contract_number: string
          contract_start_date: string | null
          contract_type: string | null
          contract_value: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          current_reviewer_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          department: string | null
          document_generated_at: string | null
          document_generation_started_at: string | null
          email: string | null
          extra_field: string | null
          first_party_crn: string | null
          first_party_id: string | null
          first_party_logo_url: string | null
          first_party_name_ar: string | null
          first_party_name_en: string | null
          id: string
          id_card_number: string | null
          is_current: boolean | null
          job_title: string | null
          new_column_name: string | null
          notify_days_before_contract_expiry: number | null
          org_id: string | null
          pdf_url: string | null
          promo_ref: string | null
          promoter_id: string | null
          promoter_id_card_url: string | null
          promoter_name_ar: string | null
          promoter_name_en: string | null
          promoter_passport_url: string | null
          second_party_crn: string | null
          second_party_id: string | null
          second_party_name_ar: string | null
          second_party_name_en: string | null
          special_terms: string | null
          status: string | null
          submitted_for_review_at: string | null
          updated_at: string | null
          user_id: string | null
          work_location: string | null
        }
        Insert: {
          allowances?: number | null
          approval_status?: string | null
          basic_salary?: number | null
          contract_end_date?: string | null
          contract_number: string
          contract_start_date?: string | null
          contract_type?: string | null
          contract_value?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_reviewer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          department?: string | null
          document_generated_at?: string | null
          document_generation_started_at?: string | null
          email?: string | null
          extra_field?: string | null
          first_party_crn?: string | null
          first_party_id?: string | null
          first_party_logo_url?: string | null
          first_party_name_ar?: string | null
          first_party_name_en?: string | null
          id?: string
          id_card_number?: string | null
          is_current?: boolean | null
          job_title?: string | null
          new_column_name?: string | null
          notify_days_before_contract_expiry?: number | null
          org_id?: string | null
          pdf_url?: string | null
          promo_ref?: string | null
          promoter_id?: string | null
          promoter_id_card_url?: string | null
          promoter_name_ar?: string | null
          promoter_name_en?: string | null
          promoter_passport_url?: string | null
          second_party_crn?: string | null
          second_party_id?: string | null
          second_party_name_ar?: string | null
          second_party_name_en?: string | null
          special_terms?: string | null
          status?: string | null
          submitted_for_review_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          work_location?: string | null
        }
        Update: {
          allowances?: number | null
          approval_status?: string | null
          basic_salary?: number | null
          contract_end_date?: string | null
          contract_number?: string
          contract_start_date?: string | null
          contract_type?: string | null
          contract_value?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_reviewer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          department?: string | null
          document_generated_at?: string | null
          document_generation_started_at?: string | null
          email?: string | null
          extra_field?: string | null
          first_party_crn?: string | null
          first_party_id?: string | null
          first_party_logo_url?: string | null
          first_party_name_ar?: string | null
          first_party_name_en?: string | null
          id?: string
          id_card_number?: string | null
          is_current?: boolean | null
          job_title?: string | null
          new_column_name?: string | null
          notify_days_before_contract_expiry?: number | null
          org_id?: string | null
          pdf_url?: string | null
          promo_ref?: string | null
          promoter_id?: string | null
          promoter_id_card_url?: string | null
          promoter_name_ar?: string | null
          promoter_name_en?: string | null
          promoter_passport_url?: string | null
          second_party_crn?: string | null
          second_party_id?: string | null
          second_party_name_ar?: string | null
          second_party_name_en?: string | null
          special_terms?: string | null
          status?: string | null
          submitted_for_review_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_current_reviewer_id_fkey"
            columns: ["current_reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_first_party_id_fkey"
            columns: ["first_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_second_party_id_fkey"
            columns: ["second_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          file_url: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          parameters: Json | null
          promoter_id: string | null
          report_data: Json | null
          report_name: string
          template_id: string | null
        }
        Insert: {
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          parameters?: Json | null
          promoter_id?: string | null
          report_data?: Json | null
          report_name: string
          template_id?: string | null
        }
        Update: {
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          parameters?: Json | null
          promoter_id?: string | null
          report_data?: Json | null
          report_name?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "generated_reports_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_settings: {
        Row: {
          backup_codes: string[] | null
          backup_codes_used: number[] | null
          created_at: string | null
          id: string
          totp_enabled: boolean | null
          totp_secret: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          backup_codes_used?: number[] | null
          created_at?: string | null
          id?: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          backup_codes_used?: number[] | null
          created_at?: string | null
          id?: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          message: string | null
          read: boolean | null
          related_contract_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          type: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string | null
          read?: boolean | null
          related_contract_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string | null
          read?: boolean | null
          related_contract_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      oauth_connections: {
        Row: {
          connected_at: string | null
          id: string
          last_used_at: string | null
          provider: string
          provider_data: Json | null
          provider_email: string | null
          provider_user_id: string
          user_id: string | null
        }
        Insert: {
          connected_at?: string | null
          id?: string
          last_used_at?: string | null
          provider: string
          provider_data?: Json | null
          provider_email?: string | null
          provider_user_id: string
          user_id?: string | null
        }
        Update: {
          connected_at?: string | null
          id?: string
          last_used_at?: string | null
          provider?: string
          provider_data?: Json | null
          provider_email?: string | null
          provider_user_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      organization_users: {
        Row: {
          added_at: string
          added_by: string | null
          org_id: string
          org_role: string
          profile_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          org_id: string
          org_role: string
          profile_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          org_id?: string
          org_role?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      parties: {
        Row: {
          address_ar: string | null
          address_en: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          cr_expiry_date: string | null
          created_at: string
          crn: string
          id: string
          license_expiry_date: string | null
          license_number: string | null
          logo_url: string | null
          name_ar: string
          name_en: string
          notes: string | null
          owner_id: string | null
          owning_org_id: string | null
          role: string | null
          status: string | null
          tax_number: string | null
          type: Database["public"]["Enums"]["party_type"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cr_expiry_date?: string | null
          created_at?: string
          crn: string
          id?: string
          license_expiry_date?: string | null
          license_number?: string | null
          logo_url?: string | null
          name_ar: string
          name_en: string
          notes?: string | null
          owner_id?: string | null
          owning_org_id?: string | null
          role?: string | null
          status?: string | null
          tax_number?: string | null
          type?: Database["public"]["Enums"]["party_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cr_expiry_date?: string | null
          created_at?: string
          crn?: string
          id?: string
          license_expiry_date?: string | null
          license_number?: string | null
          logo_url?: string | null
          name_ar?: string
          name_en?: string
          notes?: string | null
          owner_id?: string | null
          owning_org_id?: string | null
          role?: string | null
          status?: string | null
          tax_number?: string | null
          type?: Database["public"]["Enums"]["party_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      party_activities: {
        Row: {
          activity_type: string | null
          created_at: string | null
          details: string | null
          id: number
          party_id: string | null
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          created_at?: string | null
          details?: string | null
          id?: number
          party_id?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          created_at?: string | null
          details?: string | null
          id?: number
          party_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "party_activities_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      party_files: {
        Row: {
          file_name: string | null
          file_url: string | null
          id: number
          party_id: string | null
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          file_name?: string | null
          file_url?: string | null
          id?: number
          party_id?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          file_name?: string | null
          file_url?: string | null
          id?: number
          party_id?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "party_files_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      party_notes: {
        Row: {
          created_at: string | null
          id: number
          note: string | null
          party_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          note?: string | null
          party_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          note?: string | null
          party_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "party_notes_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      party_org_links: {
        Row: {
          access_role: string
          added_at: string
          added_by: string | null
          org_id: string
          party_id: string
        }
        Insert: {
          access_role: string
          added_at?: string
          added_by?: string | null
          org_id: string
          party_id: string
        }
        Update: {
          access_role?: string
          added_at?: string
          added_by?: string | null
          org_id?: string
          party_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_org_links_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_org_links_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      party_tags: {
        Row: {
          id: number
          party_id: string | null
          tag: string | null
        }
        Insert: {
          id?: number
          party_id?: string | null
          tag?: string | null
        }
        Update: {
          id?: number
          party_id?: string | null
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "party_tags_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      party_users: {
        Row: {
          added_at: string
          added_by: string | null
          party_id: string
          party_role: string
          profile_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          party_id: string
          party_role: string
          profile_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          party_id?: string
          party_role?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_users_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          token: string
          used_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          token: string
          used_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          token?: string
          used_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      placeholders: {
        Row: {
          created_at: string | null
          id: string
          key: string
          label_ar: string
          label_en: string
          template_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          label_ar: string
          label_en: string
          template_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          label_ar?: string
          label_en?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placeholders_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_locked_until: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          email_verified_at: string | null
          failed_attempts: number | null
          full_name: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          last_login: string | null
          last_password_reset_at: string | null
          last_sign_in_at: string | null
          locale: string | null
          locked_at: string | null
          login_ip_whitelist: unknown[] | null
          marketing_consent: boolean | null
          metadata: Json | null
          org_id: string | null
          password_changed_at: string | null
          password_history: Json | null
          permissions: string[] | null
          phone: string | null
          phone_verified_at: string | null
          plan: string | null
          privacy_accepted_at: string | null
          recovery_email: string | null
          recovery_phone: string | null
          role: string | null
          security_questions: Json | null
          sign_in_count: number | null
          status: string | null
          terms_accepted_at: string | null
          theme: string | null
          timezone: string | null
          two_factor_backup_email: string | null
          updated_at: string | null
        }
        Insert: {
          account_locked_until?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          failed_attempts?: number | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          is_premium?: boolean | null
          last_login?: string | null
          last_password_reset_at?: string | null
          last_sign_in_at?: string | null
          locale?: string | null
          locked_at?: string | null
          login_ip_whitelist?: unknown[] | null
          marketing_consent?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          password_changed_at?: string | null
          password_history?: Json | null
          permissions?: string[] | null
          phone?: string | null
          phone_verified_at?: string | null
          plan?: string | null
          privacy_accepted_at?: string | null
          recovery_email?: string | null
          recovery_phone?: string | null
          role?: string | null
          security_questions?: Json | null
          sign_in_count?: number | null
          status?: string | null
          terms_accepted_at?: string | null
          theme?: string | null
          timezone?: string | null
          two_factor_backup_email?: string | null
          updated_at?: string | null
        }
        Update: {
          account_locked_until?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          failed_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          last_login?: string | null
          last_password_reset_at?: string | null
          last_sign_in_at?: string | null
          locale?: string | null
          locked_at?: string | null
          login_ip_whitelist?: unknown[] | null
          marketing_consent?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          password_changed_at?: string | null
          password_history?: Json | null
          permissions?: string[] | null
          phone?: string | null
          phone_verified_at?: string | null
          plan?: string | null
          privacy_accepted_at?: string | null
          recovery_email?: string | null
          recovery_phone?: string | null
          role?: string | null
          security_questions?: Json | null
          sign_in_count?: number | null
          status?: string | null
          terms_accepted_at?: string | null
          theme?: string | null
          timezone?: string | null
          two_factor_backup_email?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_badges: {
        Row: {
          badge_description: string | null
          badge_icon: string | null
          badge_name: string
          badge_type: string
          created_at: string | null
          earned_at: string | null
          id: string
          is_active: boolean | null
          promoter_id: string | null
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          is_active?: boolean | null
          promoter_id?: string | null
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          is_active?: boolean | null
          promoter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_badges_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_communications: {
        Row: {
          attachments: Json | null
          communication_time: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          outcome: string | null
          participants: Json | null
          promoter_id: string | null
          status: string | null
          subject: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          communication_time: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          outcome?: string | null
          participants?: Json | null
          promoter_id?: string | null
          status?: string | null
          subject?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          communication_time?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          outcome?: string | null
          participants?: Json | null
          promoter_id?: string | null
          status?: string | null
          subject?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_communications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_communications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "promoter_communications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_documents: {
        Row: {
          description: string | null
          document_type: string
          file_name: string | null
          file_url: string
          id: string
          promoter_id: string | null
          uploaded_at: string | null
          version: number | null
        }
        Insert: {
          description?: string | null
          document_type: string
          file_name?: string | null
          file_url: string
          id?: string
          promoter_id?: string | null
          uploaded_at?: string | null
          version?: number | null
        }
        Update: {
          description?: string | null
          document_type?: string
          file_name?: string | null
          file_url?: string
          id?: string
          promoter_id?: string | null
          uploaded_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_documents_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_education: {
        Row: {
          created_at: string | null
          degree: string
          id: string
          institution: string
          promoter_id: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          degree: string
          id?: string
          institution: string
          promoter_id?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          degree?: string
          id?: string
          institution?: string
          promoter_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_education_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_experience: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          promoter_id: string | null
          role: string
          start_date: string | null
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          promoter_id?: string | null
          role: string
          start_date?: string | null
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          promoter_id?: string | null
          role?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_experience_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_feedback: {
        Row: {
          areas_for_improvement: string[] | null
          created_at: string | null
          feedback_text: string | null
          feedback_type: string
          id: string
          is_anonymous: boolean | null
          promoter_id: string | null
          rating: number | null
          reviewer_id: string | null
          strengths: string[] | null
          updated_at: string | null
        }
        Insert: {
          areas_for_improvement?: string[] | null
          created_at?: string | null
          feedback_text?: string | null
          feedback_type: string
          id?: string
          is_anonymous?: boolean | null
          promoter_id?: string | null
          rating?: number | null
          reviewer_id?: string | null
          strengths?: string[] | null
          updated_at?: string | null
        }
        Update: {
          areas_for_improvement?: string[] | null
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          is_anonymous?: boolean | null
          promoter_id?: string | null
          rating?: number | null
          reviewer_id?: string | null
          strengths?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_feedback_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_feedback_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_feedback_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      promoter_leaderboards: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          leaderboard_data: Json | null
          leaderboard_type: string
          period_end: string
          period_start: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          leaderboard_data?: Json | null
          leaderboard_type: string
          period_end: string
          period_start: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          leaderboard_data?: Json | null
          leaderboard_type?: string
          period_end?: string
          period_start?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      promoter_notes: {
        Row: {
          author: string | null
          content: string
          created_at: string | null
          id: string
          note_time: string | null
          promoter_id: string | null
          related_communication: string | null
          related_task: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          author?: string | null
          content: string
          created_at?: string | null
          id?: string
          note_time?: string | null
          promoter_id?: string | null
          related_communication?: string | null
          related_task?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          author?: string | null
          content?: string
          created_at?: string | null
          id?: string
          note_time?: string | null
          promoter_id?: string | null
          related_communication?: string | null
          related_task?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_notes_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_notes_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "promoter_notes_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_notes_related_communication_fkey"
            columns: ["related_communication"]
            isOneToOne: false
            referencedRelation: "promoter_communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_notes_related_task_fkey"
            columns: ["related_task"]
            isOneToOne: false
            referencedRelation: "promoter_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_type: string
          period_end: string
          period_start: string
          promoter_id: string | null
          target_value: number | null
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_type: string
          period_end: string
          period_start: string
          promoter_id?: string | null
          target_value?: number | null
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_type?: string
          period_end?: string
          period_start?: string
          promoter_id?: string | null
          target_value?: number | null
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promoter_performance_metrics_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_score_history: {
        Row: {
          change_reason: string | null
          changed_at: string | null
          created_at: string | null
          id: string
          new_score: number | null
          old_score: number | null
          promoter_id: string | null
          score_type: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string | null
          created_at?: string | null
          id?: string
          new_score?: number | null
          old_score?: number | null
          promoter_id?: string | null
          score_type: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string | null
          created_at?: string | null
          id?: string
          new_score?: number | null
          old_score?: number | null
          promoter_id?: string | null
          score_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_score_history_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_scores: {
        Row: {
          calculated_at: string | null
          created_at: string | null
          id: string
          max_score: number | null
          period_end: string
          period_start: string
          promoter_id: string | null
          score_type: string
          score_value: number
          updated_at: string | null
        }
        Insert: {
          calculated_at?: string | null
          created_at?: string | null
          id?: string
          max_score?: number | null
          period_end: string
          period_start: string
          promoter_id?: string | null
          score_type: string
          score_value: number
          updated_at?: string | null
        }
        Update: {
          calculated_at?: string | null
          created_at?: string | null
          id?: string
          max_score?: number | null
          period_end?: string
          period_start?: string
          promoter_id?: string | null
          score_type?: string
          score_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_scores_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_skills: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          promoter_id: string | null
          skill: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          promoter_id?: string | null
          skill: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          promoter_id?: string | null
          skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_skills_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_tags: {
        Row: {
          created_at: string | null
          promoter_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          promoter_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          promoter_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_tags_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          promoter_id: string | null
          related_communication: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          promoter_id?: string | null
          related_communication?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          promoter_id?: string | null
          related_communication?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "promoter_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "promoter_tasks_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_tasks_related_communication_fkey"
            columns: ["related_communication"]
            isOneToOne: false
            referencedRelation: "promoter_communications"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters: {
        Row: {
          _deprecated_employer_id: string | null
          created_at: string | null
          id: string
          id_card_expiry_date: string | null
          id_card_number: string
          id_card_url: string | null
          mobile_number: string | null
          name_ar: string
          name_en: string
          notes: string | null
          notify_days_before_contract_expiry: number | null
          notify_days_before_id_expiry: number | null
          notify_days_before_passport_expiry: number | null
          passport_expiry_date: string | null
          passport_number: string | null
          passport_url: string | null
          profile_picture_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          _deprecated_employer_id?: string | null
          created_at?: string | null
          id?: string
          id_card_expiry_date?: string | null
          id_card_number: string
          id_card_url?: string | null
          mobile_number?: string | null
          name_ar: string
          name_en: string
          notes?: string | null
          notify_days_before_contract_expiry?: number | null
          notify_days_before_id_expiry?: number | null
          notify_days_before_passport_expiry?: number | null
          passport_expiry_date?: string | null
          passport_number?: string | null
          passport_url?: string | null
          profile_picture_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          _deprecated_employer_id?: string | null
          created_at?: string | null
          id?: string
          id_card_expiry_date?: string | null
          id_card_number?: string
          id_card_url?: string | null
          mobile_number?: string | null
          name_ar?: string
          name_en?: string
          notes?: string | null
          notify_days_before_contract_expiry?: number | null
          notify_days_before_id_expiry?: number | null
          notify_days_before_passport_expiry?: number | null
          passport_expiry_date?: string | null
          passport_number?: string | null
          passport_url?: string | null
          profile_picture_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoters_employer_id_fkey"
            columns: ["_deprecated_employer_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          attempts: number | null
          blocked_until: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          action: string
          attempts?: number | null
          blocked_until?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          action?: string
          attempts?: number | null
          blocked_until?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limits_v2: {
        Row: {
          action: string
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          failure_count: number | null
          id: string
          identifier: string
          metadata: Json | null
          resource: string | null
          success_count: number | null
          updated_at: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          action: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          identifier: string
          metadata?: Json | null
          resource?: string | null
          success_count?: number | null
          updated_at?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          action?: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          identifier?: string
          metadata?: Json | null
          resource?: string | null
          success_count?: number | null
          updated_at?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_run: string | null
          next_run: string | null
          promoter_id: string | null
          schedule_config: Json | null
          schedule_type: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          next_run?: string | null
          promoter_id?: string | null
          schedule_config?: Json | null
          schedule_type: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          next_run?: string | null
          promoter_id?: string | null
          schedule_config?: Json | null
          schedule_type?: string
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "report_schedules_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          parameters: Json | null
          query_template: string | null
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          parameters?: Json | null
          query_template?: string | null
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          parameters?: Json | null
          query_template?: string | null
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      reviewer_roles: {
        Row: {
          approval_order: number
          created_at: string | null
          id: string
          id_user: string | null
          role_name: string
        }
        Insert: {
          approval_order: number
          created_at?: string | null
          id?: string
          id_user?: string | null
          role_name: string
        }
        Update: {
          approval_order?: number
          created_at?: string | null
          id?: string
          id_user?: string | null
          role_name?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          permission_id: string | null
          role_id: string | null
        }
        Insert: {
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Update: {
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          browser: string | null
          created_at: string | null
          device_fingerprint: string
          device_name: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          os: string | null
          revoked_at: string | null
          trusted_at: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_fingerprint: string
          device_name?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          os?: string | null
          revoked_at?: string | null
          trusted_at?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_fingerprint?: string
          device_name?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          os?: string | null
          revoked_at?: string | null
          trusted_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          token?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          id: string
          permission_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          permission_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          permission_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          accessibility: Json | null
          created_at: string | null
          id: string
          notifications: Json | null
          privacy: Json | null
          security: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accessibility?: Json | null
          created_at?: string | null
          id?: string
          notifications?: Json | null
          privacy?: Json | null
          security?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accessibility?: Json | null
          created_at?: string | null
          id?: string
          notifications?: Json | null
          privacy?: Json | null
          security?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_org"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          last_activity_at: string | null
          refresh_token: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_activity_at?: string | null
          refresh_token?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity_at?: string | null
          refresh_token?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          id: string
          last_login: string | null
          permissions: string[] | null
          phone: string | null
          position: string | null
          role: string
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          permissions?: string[] | null
          phone?: string | null
          position?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          permissions?: string[] | null
          phone?: string | null
          position?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          workflow_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          workflow_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          workflow_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      formatted_contracts: {
        Row: {
          contract_number: string | null
          created_at: string | null
          formatted_end_date: string | null
          formatted_start_date: string | null
          id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contract_number?: string | null
          created_at?: string | null
          formatted_end_date?: never
          formatted_start_date?: never
          id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contract_number?: string | null
          created_at?: string | null
          formatted_end_date?: never
          formatted_start_date?: never
          id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          active_users: number | null
          admin_users: number | null
          inactive_users: number | null
          manager_users: number | null
          pending_users: number | null
          recent_logins: number | null
          regular_users: number | null
          total_users: number | null
          verified_users: number | null
          viewer_users: number | null
        }
        Relationships: []
      }
      v_profile_org: {
        Row: {
          org_id: string | null
          profile_id: string | null
        }
        Insert: {
          org_id?: string | null
          profile_id?: string | null
        }
        Update: {
          org_id?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      check_premium_access: {
        Args: { user_id: string }
        Returns: boolean
      }
      create_contract_with_promoter: {
        Args: { p_promoter: Json; p_contract: Json }
        Returns: {
          allowances: number | null
          approval_status: string | null
          basic_salary: number | null
          contract_end_date: string | null
          contract_number: string
          contract_start_date: string | null
          contract_type: string | null
          contract_value: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          current_reviewer_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          department: string | null
          document_generated_at: string | null
          document_generation_started_at: string | null
          email: string | null
          extra_field: string | null
          first_party_crn: string | null
          first_party_id: string | null
          first_party_logo_url: string | null
          first_party_name_ar: string | null
          first_party_name_en: string | null
          id: string
          id_card_number: string | null
          is_current: boolean | null
          job_title: string | null
          new_column_name: string | null
          notify_days_before_contract_expiry: number | null
          org_id: string | null
          pdf_url: string | null
          promo_ref: string | null
          promoter_id: string | null
          promoter_id_card_url: string | null
          promoter_name_ar: string | null
          promoter_name_en: string | null
          promoter_passport_url: string | null
          second_party_crn: string | null
          second_party_id: string | null
          second_party_name_ar: string | null
          second_party_name_en: string | null
          special_terms: string | null
          status: string | null
          submitted_for_review_at: string | null
          updated_at: string | null
          user_id: string | null
          work_location: string | null
        }
      }
      exec_sql: {
        Args: { sql: string }
        Returns: undefined
      }
      generate_contract_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_contract_status_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          count: number
        }[]
      }
      get_contracts_with_names: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          contract_number: string
          status: string
          contract_start_date: string
          contract_end_date: string
          contract_value: number
          job_title: string
          work_location: string
          pdf_url: string
          is_current: boolean
          created_at: string
          updated_at: string
          first_party_id: string
          second_party_id: string
          promoter_id: string
          first_party_name: string
          second_party_name: string
          promoter_name: string
          first_party_name_en: string
          second_party_name_en: string
          promoter_name_en: string
          first_party_name_ar: string
          second_party_name_ar: string
          promoter_name_ar: string
          first_party_crn: string
          second_party_crn: string
          promoter_email: string
        }[]
      }
      get_monthly_contract_revenue: {
        Args: Record<PropertyKey, never>
        Returns: {
          month: string
          contracts: number
          revenue: number
        }[]
      }
      get_next_reviewer: {
        Args: { p_contract_id: string; p_current_status: string }
        Returns: string
      }
      get_placeholders: {
        Args: { tmpl: string }
        Returns: {
          id: string
          key: string
          label_en: string
          label_ar: string
        }[]
      }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_user_role: {
        Args: { uid: string }
        Returns: string
      }
      has_permission: {
        Args: { p_user_id: string; p_permission: string }
        Returns: boolean
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_auth_event: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_ip_address: unknown
          p_user_agent: string
          p_metadata?: Json
          p_success?: boolean
          p_error_message?: string
        }
        Returns: string
      }
      log_user_activity: {
        Args: {
          p_user_id: string
          p_action: string
          p_resource_type?: string
          p_resource_id?: string
          p_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: undefined
      }
      search_users: {
        Args: {
          search_term?: string
          user_role?: string
          user_status?: string
          page_num?: number
          page_size?: number
          sort_column?: string
          sort_direction?: string
        }
        Returns: {
          id: string
          email: string
          role: string
          status: string
          full_name: string
          department: string
          position: string
          avatar_url: string
          created_at: string
          last_login: string
          total_count: number
        }[]
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      update_contract_approval_status: {
        Args: {
          p_contract_id: string
          p_new_status: string
          p_reviewer_id: string
        }
        Returns: undefined
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      party_type: "Employer" | "Client" | "Generic"
      promoter_status: "active" | "inactive" | "suspended"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      party_type: ["Employer", "Client", "Generic"],
      promoter_status: ["active", "inactive", "suspended"],
      user_role: ["admin", "user"],
    },
  },
} as const
