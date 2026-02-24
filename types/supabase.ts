export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      action_requests: {
        Row: {
          assigned_to: string | null
          booking_id: string
          created_at: string | null
          description: string
          id: string
          milestone_id: string | null
          priority: string
          requested_by: string
          response: string | null
          response_at: string | null
          response_author: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          booking_id: string
          created_at?: string | null
          description: string
          id?: string
          milestone_id?: string | null
          priority?: string
          requested_by: string
          response?: string | null
          response_at?: string | null
          response_author?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string
          created_at?: string | null
          description?: string
          id?: string
          milestone_id?: string | null
          priority?: string
          requested_by?: string
          response?: string | null
          response_at?: string | null
          response_author?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "action_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "action_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "action_requests_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "action_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "action_requests_response_author_fkey"
            columns: ["response_author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_response_author_fkey"
            columns: ["response_author"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_response_author_fkey"
            columns: ["response_author"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_requests_response_author_fkey"
            columns: ["response_author"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "action_requests_response_author_fkey"
            columns: ["response_author"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_deactivation_backup_20251028: {
        Row: {
          created_at: string | null
          deactivated_at: string | null
          deactivated_reason: string | null
          email: string | null
          full_name: string | null
          id: string | null
          last_sign_in_at: string | null
          role: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_reason?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          last_sign_in_at?: string | null
          role?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_reason?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          last_sign_in_at?: string | null
          role?: string | null
          status?: string | null
        }
        Relationships: []
      }
      alert_configurations: {
        Row: {
          alert_type: string
          created_at: string | null
          custom_message: string | null
          days_before: number[] | null
          id: string
          is_enabled: boolean | null
          notification_channels: string[] | null
          recipients: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          custom_message?: string | null
          days_before?: number[] | null
          id?: string
          is_enabled?: boolean | null
          notification_channels?: string[] | null
          recipients?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          custom_message?: string | null
          days_before?: number[] | null
          id?: string
          is_enabled?: boolean | null
          notification_channels?: string[] | null
          recipients?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          eventType: string
          id: string
          metadata: Json | null
          notificationId: string
          timestamp: string | null
          userId: string
        }
        Insert: {
          eventType: string
          id?: string
          metadata?: Json | null
          notificationId: string
          timestamp?: string | null
          userId: string
        }
        Update: {
          eventType?: string
          id?: string
          metadata?: Json | null
          notificationId?: string
          timestamp?: string | null
          userId?: string
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          employee_id: string
          id: string
          read_at: string | null
        }
        Insert: {
          announcement_id: string
          employee_id: string
          id?: string
          read_at?: string | null
        }
        Update: {
          announcement_id?: string
          employee_id?: string
          id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "team_announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "announcement_reads_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      api_key_usage_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown
          method: string
          response_time_ms: number | null
          status_code: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: unknown
          method: string
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          allowed_origins: string[] | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          metadata: Json | null
          name: string
          permissions: Json
          rate_limit_per_minute: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_origins?: string[] | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          permissions?: Json
          rate_limit_per_minute?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_origins?: string[] | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          permissions?: Json
          rate_limit_per_minute?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          method: string
          path: string
          request_id: string
          response_time: number | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          method: string
          path: string
          request_id: string
          response_time?: number | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          path?: string
          request_id?: string
          response_time?: number | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      approval_actions: {
        Row: {
          acted_at: string | null
          action: string | null
          approver_id: string
          comments: string | null
          contract_approval_id: string
          created_at: string | null
          delegated_reason: string | null
          delegated_to: string | null
          due_at: string | null
          id: string
          metadata: Json | null
          reminder_sent_at: string | null
          step_id: string | null
          step_order: number
        }
        Insert: {
          acted_at?: string | null
          action?: string | null
          approver_id: string
          comments?: string | null
          contract_approval_id: string
          created_at?: string | null
          delegated_reason?: string | null
          delegated_to?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          reminder_sent_at?: string | null
          step_id?: string | null
          step_order: number
        }
        Update: {
          acted_at?: string | null
          action?: string | null
          approver_id?: string
          comments?: string | null
          contract_approval_id?: string
          created_at?: string | null
          delegated_reason?: string | null
          delegated_to?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          reminder_sent_at?: string | null
          step_id?: string | null
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_actions_contract_approval_id_fkey"
            columns: ["contract_approval_id"]
            isOneToOne: false
            referencedRelation: "contract_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_actions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "approval_workflow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_history: {
        Row: {
          action_type: string
          comments: string | null
          contract_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          new_status: string | null
          performed_by: string
          previous_status: string | null
        }
        Insert: {
          action_type: string
          comments?: string | null
          contract_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          performed_by: string
          previous_status?: string | null
        }
        Update: {
          action_type?: string
          comments?: string | null
          contract_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          performed_by?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflow_steps: {
        Row: {
          approver_department: string | null
          approver_id: string | null
          approver_role: string | null
          approver_type: string | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          escalation_user_id: string | null
          id: string
          is_required: boolean | null
          step_name: string
          step_order: number
          timeout_hours: number | null
          workflow_id: string
        }
        Insert: {
          approver_department?: string | null
          approver_id?: string | null
          approver_role?: string | null
          approver_type?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          escalation_user_id?: string | null
          id?: string
          is_required?: boolean | null
          step_name: string
          step_order: number
          timeout_hours?: number | null
          workflow_id: string
        }
        Update: {
          approver_department?: string | null
          approver_id?: string | null
          approver_role?: string | null
          approver_type?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          escalation_user_id?: string | null
          id?: string
          is_required?: boolean | null
          step_name?: string
          step_order?: number
          timeout_hours?: number | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflow_templates: {
        Row: {
          contract_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_contract_value: number | null
          min_contract_value: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_contract_value?: number | null
          min_contract_value?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_contract_value?: number | null
          min_contract_value?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      assignment_performance: {
        Row: {
          assignment_id: string
          client_feedback: string | null
          client_rating: number | null
          created_at: string | null
          id: string
          internal_feedback: string | null
          internal_rating: number | null
          metrics: Json | null
          review_period_end: string
          review_period_start: string
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          client_feedback?: string | null
          client_rating?: number | null
          created_at?: string | null
          id?: string
          internal_feedback?: string | null
          internal_rating?: number | null
          metrics?: Json | null
          review_period_end: string
          review_period_start: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          client_feedback?: string | null
          client_rating?: number | null
          created_at?: string | null
          id?: string
          internal_feedback?: string | null
          internal_rating?: number | null
          metrics?: Json | null
          review_period_end?: string
          review_period_start?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_performance_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "client_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_performance_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_performance_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_performance_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_performance_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "assignment_performance_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      assignment_transfers: {
        Row: {
          created_at: string | null
          from_assignment_id: string
          id: string
          reason: string | null
          to_assignment_id: string | null
          transfer_date: string
          transfer_type: string
          transferred_by: string | null
        }
        Insert: {
          created_at?: string | null
          from_assignment_id: string
          id?: string
          reason?: string | null
          to_assignment_id?: string | null
          transfer_date: string
          transfer_type: string
          transferred_by?: string | null
        }
        Update: {
          created_at?: string | null
          from_assignment_id?: string
          id?: string
          reason?: string | null
          to_assignment_id?: string | null
          transfer_date?: string
          transfer_type?: string
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_transfers_from_assignment_id_fkey"
            columns: ["from_assignment_id"]
            isOneToOne: false
            referencedRelation: "client_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_transfers_to_assignment_id_fkey"
            columns: ["to_assignment_id"]
            isOneToOne: false
            referencedRelation: "client_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "assignment_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      attendance_link_schedules: {
        Row: {
          allowed_radius_meters: number | null
          assignment_type: string | null
          check_in_time: string
          check_out_time: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          employee_group_ids: string[] | null
          friday: boolean | null
          id: string
          is_active: boolean | null
          last_generated_at: string | null
          last_sent_at: string | null
          link_valid_duration_hours: number | null
          max_uses_per_link: number | null
          monday: boolean | null
          name: string
          next_generation_date: string | null
          notification_method: string[] | null
          office_location_id: string | null
          require_location_verification: boolean | null
          require_photo: boolean | null
          saturday: boolean | null
          send_before_minutes: number | null
          send_check_in_link: boolean | null
          send_check_out_link: boolean | null
          send_to_all_employees: boolean | null
          specific_employee_ids: string[] | null
          specific_team_ids: string[] | null
          sunday: boolean | null
          target_latitude: number | null
          target_longitude: number | null
          thursday: boolean | null
          total_links_generated: number | null
          total_notifications_sent: number | null
          tuesday: boolean | null
          updated_at: string | null
          wednesday: boolean | null
        }
        Insert: {
          allowed_radius_meters?: number | null
          assignment_type?: string | null
          check_in_time: string
          check_out_time?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_group_ids?: string[] | null
          friday?: boolean | null
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          last_sent_at?: string | null
          link_valid_duration_hours?: number | null
          max_uses_per_link?: number | null
          monday?: boolean | null
          name: string
          next_generation_date?: string | null
          notification_method?: string[] | null
          office_location_id?: string | null
          require_location_verification?: boolean | null
          require_photo?: boolean | null
          saturday?: boolean | null
          send_before_minutes?: number | null
          send_check_in_link?: boolean | null
          send_check_out_link?: boolean | null
          send_to_all_employees?: boolean | null
          specific_employee_ids?: string[] | null
          specific_team_ids?: string[] | null
          sunday?: boolean | null
          target_latitude?: number | null
          target_longitude?: number | null
          thursday?: boolean | null
          total_links_generated?: number | null
          total_notifications_sent?: number | null
          tuesday?: boolean | null
          updated_at?: string | null
          wednesday?: boolean | null
        }
        Update: {
          allowed_radius_meters?: number | null
          assignment_type?: string | null
          check_in_time?: string
          check_out_time?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_group_ids?: string[] | null
          friday?: boolean | null
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          last_sent_at?: string | null
          link_valid_duration_hours?: number | null
          max_uses_per_link?: number | null
          monday?: boolean | null
          name?: string
          next_generation_date?: string | null
          notification_method?: string[] | null
          office_location_id?: string | null
          require_location_verification?: boolean | null
          require_photo?: boolean | null
          saturday?: boolean | null
          send_before_minutes?: number | null
          send_check_in_link?: boolean | null
          send_check_out_link?: boolean | null
          send_to_all_employees?: boolean | null
          specific_employee_ids?: string[] | null
          specific_team_ids?: string[] | null
          sunday?: boolean | null
          target_latitude?: number | null
          target_longitude?: number | null
          thursday?: boolean | null
          total_links_generated?: number | null
          total_notifications_sent?: number | null
          tuesday?: boolean | null
          updated_at?: string | null
          wednesday?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_link_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_link_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_link_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_link_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_link_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_link_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attendance_link_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "attendance_link_schedules_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "office_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_link_schedules_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "office_locations_with_company"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_link_usage: {
        Row: {
          attendance_id: string | null
          attendance_link_id: string | null
          distance_from_target: number | null
          employer_employee_id: string | null
          id: string
          latitude: number | null
          location_verified: boolean | null
          longitude: number | null
          used_at: string | null
          used_date: string | null
        }
        Insert: {
          attendance_id?: string | null
          attendance_link_id?: string | null
          distance_from_target?: number | null
          employer_employee_id?: string | null
          id?: string
          latitude?: number | null
          location_verified?: boolean | null
          longitude?: number | null
          used_at?: string | null
          used_date?: string | null
        }
        Update: {
          attendance_id?: string | null
          attendance_link_id?: string | null
          distance_from_target?: number | null
          employer_employee_id?: string | null
          id?: string
          latitude?: number | null
          location_verified?: boolean | null
          longitude?: number | null
          used_at?: string | null
          used_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_link_usage_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "employee_attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_link_usage_attendance_link_id_fkey"
            columns: ["attendance_link_id"]
            isOneToOne: false
            referencedRelation: "attendance_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_link_usage_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_links: {
        Row: {
          allowed_radius_meters: number | null
          auto_generate_daily: boolean | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          id: string
          is_active: boolean | null
          link_code: string
          max_uses: number | null
          office_location_id: string | null
          target_latitude: number
          target_longitude: number
          title: string | null
          updated_at: string | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          allowed_radius_meters?: number | null
          auto_generate_daily?: boolean | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          id?: string
          is_active?: boolean | null
          link_code: string
          max_uses?: number | null
          office_location_id?: string | null
          target_latitude: number
          target_longitude: number
          title?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_until: string
        }
        Update: {
          allowed_radius_meters?: number | null
          auto_generate_daily?: boolean | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          id?: string
          is_active?: boolean | null
          link_code?: string
          max_uses?: number | null
          office_location_id?: string | null
          target_latitude?: number
          target_longitude?: number
          title?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attendance_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "attendance_links_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "office_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_links_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "office_locations_with_company"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_verification_logs: {
        Row: {
          attendance_id: string | null
          id: string
          verification_details: Json | null
          verification_status: string
          verification_type: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          attendance_id?: string | null
          id?: string
          verification_details?: Json | null
          verification_status: string
          verification_type: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          attendance_id?: string | null
          id?: string
          verification_details?: Json | null
          verification_status?: string
          verification_type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_verification_logs_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "employee_attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_verification_logs_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_verification_logs_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_verification_logs_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_verification_logs_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attendance_verification_logs_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      booking_approval_history: {
        Row: {
          action: string
          action_at: string | null
          action_by: string
          booking_id: string
          comments: string | null
          id: string
          metadata: Json | null
          new_status: string | null
          previous_status: string | null
        }
        Insert: {
          action: string
          action_at?: string | null
          action_by: string
          booking_id: string
          comments?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          previous_status?: string | null
        }
        Update: {
          action?: string
          action_at?: string | null
          action_by?: string
          booking_id?: string
          comments?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_approval_history_action_by_fkey"
            columns: ["action_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_action_by_fkey"
            columns: ["action_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_action_by_fkey"
            columns: ["action_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_action_by_fkey"
            columns: ["action_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booking_approval_history_action_by_fkey"
            columns: ["action_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_approval_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      booking_events: {
        Row: {
          booking_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      booking_files: {
        Row: {
          booking_id: string
          category: string
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          original_name: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          booking_id: string
          category: string
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          original_name: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          booking_id?: string
          category?: string
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          original_name?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booking_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      booking_messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          priority: string | null
          read_at: string | null
          replied_to_id: string | null
          sender_id: string
          sender_role: string
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          priority?: string | null
          read_at?: string | null
          replied_to_id?: string | null
          sender_id: string
          sender_role: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          priority?: string | null
          read_at?: string | null
          replied_to_id?: string | null
          sender_id?: string
          sender_role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_messages_replied_to_id_fkey"
            columns: ["replied_to_id"]
            isOneToOne: false
            referencedRelation: "booking_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_milestones: {
        Row: {
          booking_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      booking_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          booking_id: string
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          priority: string | null
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          booking_id: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: string | null
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          booking_id?: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      booking_operations: {
        Row: {
          assigned_to: string | null
          booking_id: string
          completed_at: string | null
          completion_notes: string | null
          description: string
          due_date: string | null
          id: string
          metadata: Json | null
          operation_at: string | null
          operation_by: string
          operation_type: string
          priority: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          booking_id: string
          completed_at?: string | null
          completion_notes?: string | null
          description: string
          due_date?: string | null
          id?: string
          metadata?: Json | null
          operation_at?: string | null
          operation_by: string
          operation_type: string
          priority?: string | null
          status: string
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string
          completed_at?: string | null
          completion_notes?: string | null
          description?: string
          due_date?: string | null
          id?: string
          metadata?: Json | null
          operation_at?: string | null
          operation_by?: string
          operation_type?: string
          priority?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_operations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booking_operations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_operations_operation_by_fkey"
            columns: ["operation_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_operation_by_fkey"
            columns: ["operation_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_operation_by_fkey"
            columns: ["operation_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_operations_operation_by_fkey"
            columns: ["operation_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booking_operations_operation_by_fkey"
            columns: ["operation_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      booking_progress: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          milestone_name: string
          progress: number
          steps: Json
          updated_at: string | null
          week_number: number
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          milestone_name: string
          progress?: number
          steps?: Json
          updated_at?: string | null
          week_number: number
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          milestone_name?: string
          progress?: number
          steps?: Json
          updated_at?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      booking_resources: {
        Row: {
          amenities: Json | null
          availability_hours: Json | null
          capacity: number
          created_at: string | null
          created_by: string | null
          description: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          location: string | null
          metadata: Json | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          availability_hours?: Json | null
          capacity?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          location?: string | null
          metadata?: Json | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          availability_hours?: Json | null
          capacity?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          location?: string | null
          metadata?: Json | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      booking_services: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          service_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          service_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      booking_status_transitions: {
        Row: {
          from_status: string
          to_status: string
        }
        Insert: {
          from_status: string
          to_status: string
        }
        Update: {
          from_status?: string
          to_status?: string
        }
        Relationships: []
      }
      booking_task_dependencies: {
        Row: {
          booking_id: string
          created_at: string | null
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_task_dependencies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      booking_task_time_logs: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          notes: string | null
          start_time: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          task_id?: string
        }
        Relationships: []
      }
      booking_tasks: {
        Row: {
          action_items: Json | null
          actual_hours: number | null
          approval_status: string | null
          assigned_to: string | null
          booking_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          internal_notes: string | null
          is_overdue: boolean | null
          overdue_since: string | null
          priority: string | null
          shared_comments: Json | null
          status: string | null
          time_logs: Json | null
          title: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          action_items?: Json | null
          actual_hours?: number | null
          approval_status?: string | null
          assigned_to?: string | null
          booking_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          internal_notes?: string | null
          is_overdue?: boolean | null
          overdue_since?: string | null
          priority?: string | null
          shared_comments?: Json | null
          status?: string | null
          time_logs?: Json | null
          title: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          action_items?: Json | null
          actual_hours?: number | null
          approval_status?: string | null
          assigned_to?: string | null
          booking_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          internal_notes?: string | null
          is_overdue?: boolean | null
          overdue_since?: string | null
          priority?: string | null
          shared_comments?: Json | null
          status?: string | null
          time_logs?: Json | null
          title?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      booking_timeline_comments: {
        Row: {
          booking_id: string
          comment: string
          created_at: string | null
          id: string
          reaction: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_id: string
          comment: string
          created_at?: string | null
          id?: string
          reaction?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          reaction?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_timeline_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      bookings: {
        Row: {
          actual_completion_date: string | null
          actual_start_date: string | null
          amount: number | null
          amount_cents: number | null
          approval_comments: string | null
          approval_rejection_reason: string | null
          approval_requested_at: string | null
          approval_requested_by: string | null
          approval_reviewed_at: string | null
          approval_reviewed_by: string | null
          approval_status: string | null
          assigned_to: string | null
          attendees: Json | null
          booking_number: string | null
          budget_range: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string | null
          client_name: string | null
          compliance_status: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          due_at: string | null
          end_time: string
          estimated_completion_date: string | null
          estimated_duration: string | null
          estimated_start_date: string | null
          id: string
          last_message_at: string | null
          location: string | null
          location_type: string | null
          metadata: Json | null
          milestone_notes: string | null
          notes: string | null
          operational_notes: string | null
          operational_status: string | null
          package_id: string | null
          parent_booking_id: string | null
          payment_status: string | null
          priority: string | null
          progress_percentage: number | null
          project_progress: number | null
          provider_company_id: string | null
          provider_id: string | null
          provider_name: string | null
          quality_score: number | null
          rating: number | null
          recurring_pattern: Json | null
          requirements: Json | null
          resource_id: string | null
          review: string | null
          scheduled_date: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          scheduled_time: string | null
          service_id: string | null
          service_title: string | null
          service_type_id: string | null
          special_requirements: string | null
          start_time: string
          status: string | null
          subtotal: number | null
          title: string
          total_amount: number | null
          total_cost: number | null
          total_price: number | null
          updated_at: string | null
          urgency: string | null
          user_id: string
          vat_amount: number | null
          vat_percent: number | null
        }
        Insert: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          amount?: number | null
          amount_cents?: number | null
          approval_comments?: string | null
          approval_rejection_reason?: string | null
          approval_requested_at?: string | null
          approval_requested_by?: string | null
          approval_reviewed_at?: string | null
          approval_reviewed_by?: string | null
          approval_status?: string | null
          assigned_to?: string | null
          attendees?: Json | null
          booking_number?: string | null
          budget_range?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string | null
          client_name?: string | null
          compliance_status?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_at?: string | null
          end_time?: string
          estimated_completion_date?: string | null
          estimated_duration?: string | null
          estimated_start_date?: string | null
          id?: string
          last_message_at?: string | null
          location?: string | null
          location_type?: string | null
          metadata?: Json | null
          milestone_notes?: string | null
          notes?: string | null
          operational_notes?: string | null
          operational_status?: string | null
          package_id?: string | null
          parent_booking_id?: string | null
          payment_status?: string | null
          priority?: string | null
          progress_percentage?: number | null
          project_progress?: number | null
          provider_company_id?: string | null
          provider_id?: string | null
          provider_name?: string | null
          quality_score?: number | null
          rating?: number | null
          recurring_pattern?: Json | null
          requirements?: Json | null
          resource_id?: string | null
          review?: string | null
          scheduled_date?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          scheduled_time?: string | null
          service_id?: string | null
          service_title?: string | null
          service_type_id?: string | null
          special_requirements?: string | null
          start_time?: string
          status?: string | null
          subtotal?: number | null
          title?: string
          total_amount?: number | null
          total_cost?: number | null
          total_price?: number | null
          updated_at?: string | null
          urgency?: string | null
          user_id: string
          vat_amount?: number | null
          vat_percent?: number | null
        }
        Update: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          amount?: number | null
          amount_cents?: number | null
          approval_comments?: string | null
          approval_rejection_reason?: string | null
          approval_requested_at?: string | null
          approval_requested_by?: string | null
          approval_reviewed_at?: string | null
          approval_reviewed_by?: string | null
          approval_status?: string | null
          assigned_to?: string | null
          attendees?: Json | null
          booking_number?: string | null
          budget_range?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string | null
          client_name?: string | null
          compliance_status?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_at?: string | null
          end_time?: string
          estimated_completion_date?: string | null
          estimated_duration?: string | null
          estimated_start_date?: string | null
          id?: string
          last_message_at?: string | null
          location?: string | null
          location_type?: string | null
          metadata?: Json | null
          milestone_notes?: string | null
          notes?: string | null
          operational_notes?: string | null
          operational_status?: string | null
          package_id?: string | null
          parent_booking_id?: string | null
          payment_status?: string | null
          priority?: string | null
          progress_percentage?: number | null
          project_progress?: number | null
          provider_company_id?: string | null
          provider_id?: string | null
          provider_name?: string | null
          quality_score?: number | null
          rating?: number | null
          recurring_pattern?: Json | null
          requirements?: Json | null
          resource_id?: string | null
          review?: string | null
          scheduled_date?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          scheduled_time?: string | null
          service_id?: string | null
          service_title?: string | null
          service_type_id?: string | null
          special_requirements?: string | null
          start_time?: string
          status?: string | null
          subtotal?: number | null
          title?: string
          total_amount?: number | null
          total_cost?: number | null
          total_price?: number | null
          updated_at?: string | null
          urgency?: string | null
          user_id?: string
          vat_amount?: number | null
          vat_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_approval_requested_by_fkey"
            columns: ["approval_requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_approval_requested_by_fkey"
            columns: ["approval_requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_approval_requested_by_fkey"
            columns: ["approval_requested_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_approval_requested_by_fkey"
            columns: ["approval_requested_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_approval_requested_by_fkey"
            columns: ["approval_requested_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_approval_reviewed_by_fkey"
            columns: ["approval_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_approval_reviewed_by_fkey"
            columns: ["approval_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_approval_reviewed_by_fkey"
            columns: ["approval_reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_approval_reviewed_by_fkey"
            columns: ["approval_reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_approval_reviewed_by_fkey"
            columns: ["approval_reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_company_fk"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_company_fk"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "booking_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "bookings_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      bucket_order_ref: {
        Row: {
          bucket_order: number
          start_bucket: string
        }
        Insert: {
          bucket_order: number
          start_bucket: string
        }
        Update: {
          bucket_order?: number
          start_bucket?: string
        }
        Relationships: []
      }
      candidate_applications: {
        Row: {
          available_start_date: string | null
          candidate_email: string
          candidate_id: string | null
          candidate_name_ar: string | null
          candidate_name_en: string | null
          candidate_nationality: string | null
          candidate_phone: string | null
          company_id: string | null
          cover_letter: string | null
          cover_letter_url: string | null
          created_at: string | null
          current_stage: string | null
          evaluated_at: string | null
          evaluated_by: string | null
          evaluation_notes: string | null
          evaluation_score: number | null
          expected_salary: number | null
          id: string
          interview_notes: string | null
          job_posting_id: string
          metadata: Json | null
          notice_period_days: number | null
          other_documents: Json | null
          resume_url: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          available_start_date?: string | null
          candidate_email: string
          candidate_id?: string | null
          candidate_name_ar?: string | null
          candidate_name_en?: string | null
          candidate_nationality?: string | null
          candidate_phone?: string | null
          company_id?: string | null
          cover_letter?: string | null
          cover_letter_url?: string | null
          created_at?: string | null
          current_stage?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_notes?: string | null
          evaluation_score?: number | null
          expected_salary?: number | null
          id?: string
          interview_notes?: string | null
          job_posting_id: string
          metadata?: Json | null
          notice_period_days?: number | null
          other_documents?: Json | null
          resume_url?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          available_start_date?: string | null
          candidate_email?: string
          candidate_id?: string | null
          candidate_name_ar?: string | null
          candidate_name_en?: string | null
          candidate_nationality?: string | null
          candidate_phone?: string | null
          company_id?: string | null
          cover_letter?: string | null
          cover_letter_url?: string | null
          created_at?: string | null
          current_stage?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_notes?: string | null
          evaluation_score?: number | null
          expected_salary?: number | null
          id?: string
          interview_notes?: string | null
          job_posting_id?: string
          metadata?: Json | null
          notice_period_days?: number | null
          other_documents?: Json | null
          resume_url?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "candidate_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "candidate_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "candidate_applications_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "candidate_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      clause_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ar: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clause_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "clause_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      clause_versions: {
        Row: {
          change_summary: string | null
          clause_id: string
          content: string
          content_ar: string | null
          created_at: string | null
          created_by: string | null
          id: string
          title: string
          title_ar: string | null
          version: number
        }
        Insert: {
          change_summary?: string | null
          clause_id: string
          content: string
          content_ar?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          title: string
          title_ar?: string | null
          version: number
        }
        Update: {
          change_summary?: string | null
          clause_id?: string
          content?: string
          content_ar?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          title?: string
          title_ar?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "clause_versions_clause_id_fkey"
            columns: ["clause_id"]
            isOneToOne: false
            referencedRelation: "clauses"
            referencedColumns: ["id"]
          },
        ]
      }
      clauses: {
        Row: {
          applicable_contract_types: string[] | null
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          content: string
          content_ar: string | null
          created_at: string | null
          created_by: string | null
          effective_date: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          is_template: boolean | null
          jurisdiction: string | null
          metadata: Json | null
          tags: string[] | null
          title: string
          title_ar: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          applicable_contract_types?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          content: string
          content_ar?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          is_template?: boolean | null
          jurisdiction?: string | null
          metadata?: Json | null
          tags?: string[] | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          applicable_contract_types?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          content?: string
          content_ar?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          is_template?: boolean | null
          jurisdiction?: string | null
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clauses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "clause_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assignments: {
        Row: {
          assignment_terms: Json | null
          assignment_type: string | null
          client_contact_email: string | null
          client_contact_person: string | null
          client_contact_phone: string | null
          client_party_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          department: string | null
          deployment_letter_id: string | null
          employer_employee_id: string
          end_date: string | null
          id: string
          job_title: string
          notes: string | null
          salary_at_assignment: number | null
          start_date: string
          status: string | null
          terminated_at: string | null
          termination_reason: string | null
          updated_at: string | null
          work_location: string | null
        }
        Insert: {
          assignment_terms?: Json | null
          assignment_type?: string | null
          client_contact_email?: string | null
          client_contact_person?: string | null
          client_contact_phone?: string | null
          client_party_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          deployment_letter_id?: string | null
          employer_employee_id: string
          end_date?: string | null
          id?: string
          job_title: string
          notes?: string | null
          salary_at_assignment?: number | null
          start_date: string
          status?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          updated_at?: string | null
          work_location?: string | null
        }
        Update: {
          assignment_terms?: Json | null
          assignment_type?: string | null
          client_contact_email?: string | null
          client_contact_person?: string | null
          client_contact_phone?: string | null
          client_party_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          deployment_letter_id?: string | null
          employer_employee_id?: string
          end_date?: string | null
          id?: string
          job_title?: string
          notes?: string | null
          salary_at_assignment?: number | null
          start_date?: string
          status?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          updated_at?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_client_party_id_fkey"
            columns: ["client_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "client_assignments_deployment_letter_id_fkey"
            columns: ["deployment_letter_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_deployment_letter_id_fkey"
            columns: ["deployment_letter_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_deployment_letter_id_fkey"
            columns: ["deployment_letter_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_deployment_letter_id_fkey"
            columns: ["deployment_letter_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_deployment_letter_id_fkey"
            columns: ["deployment_letter_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      client_replies: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          subject: string | null
          submission_id: string | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          subject?: string | null
          submission_id?: string | null
          timestamp: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          subject?: string | null
          submission_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_replies_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_mentions: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          mentioned_user_id: string
          notified_at: string | null
          read_at: string | null
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          notified_at?: string | null
          read_at?: string | null
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          notified_at?: string | null
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "contract_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: Json | null
          brand_colors: Json | null
          business_type: Database["public"]["Enums"]["company_type"] | null
          cr_number: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          founded_year: number | null
          group_id: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          is_verified: boolean | null
          location: string | null
          logo_url: string | null
          lower_email: string | null
          name: string
          owner_id: string | null
          party_id: string | null
          phone: string | null
          portfolio_links: string | null
          registration_number: string | null
          services_offered: string | null
          settings: Json | null
          size: string | null
          slug: string
          type: string | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          brand_colors?: Json | null
          business_type?: Database["public"]["Enums"]["company_type"] | null
          cr_number?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          founded_year?: number | null
          group_id?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          lower_email?: string | null
          name: string
          owner_id?: string | null
          party_id?: string | null
          phone?: string | null
          portfolio_links?: string | null
          registration_number?: string | null
          services_offered?: string | null
          settings?: Json | null
          size?: string | null
          slug: string
          type?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          brand_colors?: Json | null
          business_type?: Database["public"]["Enums"]["company_type"] | null
          cr_number?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          founded_year?: number | null
          group_id?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          lower_email?: string | null
          name?: string
          owner_id?: string | null
          party_id?: string | null
          phone?: string | null
          portfolio_links?: string | null
          registration_number?: string | null
          services_offered?: string | null
          settings?: Json | null
          size?: string | null
          slug?: string
          type?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "company_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "companies_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      company_attendance_settings: {
        Row: {
          absent_threshold_hours: number | null
          alert_on_anomalies: boolean | null
          allow_breaks: boolean | null
          analytics_retention_days: number | null
          approval_deadline_hours: number | null
          auto_approve: boolean | null
          auto_approve_valid_checkins: boolean | null
          auto_generate_reports: boolean | null
          auto_mark_absent: boolean | null
          auto_mark_absent_time: string | null
          check_in_time_window_minutes: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          default_check_in_time: string | null
          default_check_out_time: string | null
          default_link_validity_hours: number | null
          default_report_format: string | null
          enable_analytics: boolean | null
          id: string
          include_device_info_in_reports: boolean | null
          include_location_in_reports: boolean | null
          include_photos_in_reports: boolean | null
          late_threshold_minutes: number | null
          link_expiry_hours: number | null
          location_radius_meters: number | null
          max_break_duration_minutes: number | null
          max_breaks_per_day: number | null
          max_uses_per_link: number | null
          notification_methods: string[] | null
          overtime_rate_multiplier: number | null
          overtime_threshold_hours: number | null
          reminder_time_minutes: number | null
          report_generation_day: number | null
          report_generation_schedule: string | null
          require_approval: boolean | null
          require_location: boolean | null
          require_photo: boolean | null
          send_approval_notifications: boolean | null
          send_check_in_reminders: boolean | null
          send_check_out_reminders: boolean | null
          send_late_notifications: boolean | null
          standard_work_hours: number | null
          track_attendance_patterns: boolean | null
          track_overtime_trends: boolean | null
          unpaid_break_minutes: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          absent_threshold_hours?: number | null
          alert_on_anomalies?: boolean | null
          allow_breaks?: boolean | null
          analytics_retention_days?: number | null
          approval_deadline_hours?: number | null
          auto_approve?: boolean | null
          auto_approve_valid_checkins?: boolean | null
          auto_generate_reports?: boolean | null
          auto_mark_absent?: boolean | null
          auto_mark_absent_time?: string | null
          check_in_time_window_minutes?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          default_check_in_time?: string | null
          default_check_out_time?: string | null
          default_link_validity_hours?: number | null
          default_report_format?: string | null
          enable_analytics?: boolean | null
          id?: string
          include_device_info_in_reports?: boolean | null
          include_location_in_reports?: boolean | null
          include_photos_in_reports?: boolean | null
          late_threshold_minutes?: number | null
          link_expiry_hours?: number | null
          location_radius_meters?: number | null
          max_break_duration_minutes?: number | null
          max_breaks_per_day?: number | null
          max_uses_per_link?: number | null
          notification_methods?: string[] | null
          overtime_rate_multiplier?: number | null
          overtime_threshold_hours?: number | null
          reminder_time_minutes?: number | null
          report_generation_day?: number | null
          report_generation_schedule?: string | null
          require_approval?: boolean | null
          require_location?: boolean | null
          require_photo?: boolean | null
          send_approval_notifications?: boolean | null
          send_check_in_reminders?: boolean | null
          send_check_out_reminders?: boolean | null
          send_late_notifications?: boolean | null
          standard_work_hours?: number | null
          track_attendance_patterns?: boolean | null
          track_overtime_trends?: boolean | null
          unpaid_break_minutes?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          absent_threshold_hours?: number | null
          alert_on_anomalies?: boolean | null
          allow_breaks?: boolean | null
          analytics_retention_days?: number | null
          approval_deadline_hours?: number | null
          auto_approve?: boolean | null
          auto_approve_valid_checkins?: boolean | null
          auto_generate_reports?: boolean | null
          auto_mark_absent?: boolean | null
          auto_mark_absent_time?: string | null
          check_in_time_window_minutes?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          default_check_in_time?: string | null
          default_check_out_time?: string | null
          default_link_validity_hours?: number | null
          default_report_format?: string | null
          enable_analytics?: boolean | null
          id?: string
          include_device_info_in_reports?: boolean | null
          include_location_in_reports?: boolean | null
          include_photos_in_reports?: boolean | null
          late_threshold_minutes?: number | null
          link_expiry_hours?: number | null
          location_radius_meters?: number | null
          max_break_duration_minutes?: number | null
          max_breaks_per_day?: number | null
          max_uses_per_link?: number | null
          notification_methods?: string[] | null
          overtime_rate_multiplier?: number | null
          overtime_threshold_hours?: number | null
          reminder_time_minutes?: number | null
          report_generation_day?: number | null
          report_generation_schedule?: string | null
          require_approval?: boolean | null
          require_location?: boolean | null
          require_photo?: boolean | null
          send_approval_notifications?: boolean | null
          send_check_in_reminders?: boolean | null
          send_check_out_reminders?: boolean | null
          send_late_notifications?: boolean | null
          standard_work_hours?: number | null
          track_attendance_patterns?: boolean | null
          track_overtime_trends?: boolean | null
          unpaid_break_minutes?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_attendance_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_attendance_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_attendance_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_attendance_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_attendance_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_attendance_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_attendance_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "company_attendance_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_attendance_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_attendance_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_attendance_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_attendance_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      company_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          name_ar: string | null
          owner_id: string
          parent_group_id: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          name_ar?: string | null
          owner_id: string
          parent_group_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          owner_id?: string
          parent_group_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "company_groups_parent_group_id_fkey"
            columns: ["parent_group_id"]
            isOneToOne: false
            referencedRelation: "company_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string | null
          department: string | null
          id: string
          invited_by: string | null
          is_primary: boolean | null
          job_title: string | null
          joined_at: string | null
          permissions: Json | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          department?: string | null
          id?: string
          invited_by?: string | null
          is_primary?: boolean | null
          job_title?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          department?: string | null
          id?: string
          invited_by?: string | null
          is_primary?: boolean | null
          job_title?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      company_permissions: {
        Row: {
          company_id: string
          created_at: string | null
          expires_at: string | null
          granted: boolean
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          permission: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          expires_at?: string | null
          granted?: boolean
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permission: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          expires_at?: string | null
          granted?: boolean
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permission?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "company_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          applicable_departments: string[] | null
          applicable_roles: string[] | null
          applicable_to: string[] | null
          company_id: string | null
          created_at: string | null
          description: string | null
          document_type: string | null
          expiry_days: number | null
          id: string
          is_mandatory: boolean | null
          requirement_name: string
          requirement_type: string
          updated_at: string | null
        }
        Insert: {
          applicable_departments?: string[] | null
          applicable_roles?: string[] | null
          applicable_to?: string[] | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          expiry_days?: number | null
          id?: string
          is_mandatory?: boolean | null
          requirement_name: string
          requirement_type: string
          updated_at?: string | null
        }
        Update: {
          applicable_departments?: string[] | null
          applicable_roles?: string[] | null
          applicable_to?: string[] | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          expiry_days?: number | null
          id?: string
          is_mandatory?: boolean | null
          requirement_name?: string
          requirement_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_submissions: {
        Row: {
          budget: string | null
          businessType: string | null
          company: string | null
          createdAt: string | null
          email: string
          id: string
          ipAddress: string | null
          language: string | null
          location: string | null
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          preferredContact: string | null
          preferredTime: string | null
          primaryService: string
          referrer: string | null
          services: string[]
          source: string | null
          status: string | null
          submissionId: string
          timeline: string | null
          updatedAt: string | null
          userAgent: string | null
          userId: string | null
          webhookSent: boolean | null
          webhookSentAt: string | null
        }
        Insert: {
          budget?: string | null
          businessType?: string | null
          company?: string | null
          createdAt?: string | null
          email: string
          id?: string
          ipAddress?: string | null
          language?: string | null
          location?: string | null
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          preferredContact?: string | null
          preferredTime?: string | null
          primaryService: string
          referrer?: string | null
          services?: string[]
          source?: string | null
          status?: string | null
          submissionId: string
          timeline?: string | null
          updatedAt?: string | null
          userAgent?: string | null
          userId?: string | null
          webhookSent?: boolean | null
          webhookSentAt?: string | null
        }
        Update: {
          budget?: string | null
          businessType?: string | null
          company?: string | null
          createdAt?: string | null
          email?: string
          id?: string
          ipAddress?: string | null
          language?: string | null
          location?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferredContact?: string | null
          preferredTime?: string | null
          primaryService?: string
          referrer?: string | null
          services?: string[]
          source?: string | null
          status?: string | null
          submissionId?: string
          timeline?: string | null
          updatedAt?: string | null
          userAgent?: string | null
          userId?: string | null
          webhookSent?: boolean | null
          webhookSentAt?: string | null
        }
        Relationships: []
      }
      contract_activity_logs: {
        Row: {
          action: string
          contract_id: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          contract_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          contract_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_activity_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_activity_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_activity_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_activity_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_activity_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_amendments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          changes: string
          comments: string | null
          contract_id: string
          description: string
          effective_date: string
          id: string
          status: string
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          changes: string
          comments?: string | null
          contract_id: string
          description: string
          effective_date: string
          id?: string
          status?: string
          version: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          changes?: string
          comments?: string | null
          contract_id?: string
          description?: string
          effective_date?: string
          id?: string
          status?: string
          version?: string
        }
        Relationships: []
      }
      contract_approvals: {
        Row: {
          completed_at: string | null
          contract_id: string
          created_by: string | null
          current_step: number | null
          id: string
          overall_status: string | null
          started_at: string | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          contract_id: string
          created_by?: string | null
          current_step?: number | null
          id?: string
          overall_status?: string | null
          started_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          contract_id?: string
          created_by?: string | null
          current_step?: number | null
          id?: string
          overall_status?: string | null
          started_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_approvals_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_clauses: {
        Row: {
          category: string
          content: string
          id: string
          is_required: boolean | null
          order: number | null
          template_id: string | null
          title: string
          type: string
        }
        Insert: {
          category?: string
          content: string
          id?: string
          is_required?: boolean | null
          order?: number | null
          template_id?: string | null
          title: string
          type?: string
        }
        Update: {
          category?: string
          content?: string
          id?: string
          is_required?: boolean | null
          order?: number | null
          template_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_clauses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_comments: {
        Row: {
          content: string
          contract_id: string
          created_at: string | null
          id: string
          is_resolved: boolean | null
          parent_id: string | null
          position_data: Json | null
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          contract_id: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          parent_id?: string | null
          position_data?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          contract_id?: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          parent_id?: string | null
          position_data?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_comments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_comments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_comments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_comments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_comments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "contract_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_obligations: {
        Row: {
          amount: number | null
          completed_by: string | null
          completion_date: string | null
          completion_notes: string | null
          contract_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          id: string
          last_reminder_at: string | null
          metadata: Json | null
          obligation_type: string | null
          recurring_pattern: string | null
          reminder_days: number[] | null
          responsible_party: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          completed_by?: string | null
          completion_date?: string | null
          completion_notes?: string | null
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          last_reminder_at?: string | null
          metadata?: Json | null
          obligation_type?: string | null
          recurring_pattern?: string | null
          reminder_days?: number[] | null
          responsible_party?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          completed_by?: string | null
          completion_date?: string | null
          completion_notes?: string | null
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          last_reminder_at?: string | null
          metadata?: Json | null
          obligation_type?: string | null
          recurring_pattern?: string | null
          reminder_days?: number[] | null
          responsible_party?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_obligations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_obligations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_obligations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_obligations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_obligations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_presence: {
        Row: {
          contract_id: string
          cursor_position: Json | null
          id: string
          last_active_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          contract_id: string
          cursor_position?: Json | null
          id?: string
          last_active_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          contract_id?: string
          cursor_position?: Json | null
          id?: string
          last_active_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_presence_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_presence_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_presence_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_presence_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_presence_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_promoter_audit: {
        Row: {
          change_reason: string | null
          changed_at: string | null
          changed_by: string | null
          contract_id: string
          id: string
          new_promoter_id: string | null
          old_promoter_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          contract_id: string
          id?: string
          new_promoter_id?: string | null
          old_promoter_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          contract_id?: string
          id?: string
          new_promoter_id?: string | null
          old_promoter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_promoter_audit_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_promoter_audit_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_promoter_audit_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_promoter_audit_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_promoter_audit_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_promoter_audit_new_promoter_id_fkey"
            columns: ["new_promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_promoter_audit_new_promoter_id_fkey"
            columns: ["new_promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_promoter_audit_new_promoter_id_fkey"
            columns: ["new_promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_promoter_audit_old_promoter_id_fkey"
            columns: ["old_promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_promoter_audit_old_promoter_id_fkey"
            columns: ["old_promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_promoter_audit_old_promoter_id_fkey"
            columns: ["old_promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      contract_versions: {
        Row: {
          change_summary: string | null
          changes: Json | null
          content: Json
          contract_id: string
          created_at: string | null
          created_by: string
          id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changes?: Json | null
          content: Json
          contract_id: string
          created_at?: string | null
          created_by: string
          id?: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          changes?: Json | null
          content?: Json
          contract_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
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
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          basic_salary: number | null
          billing_frequency: string | null
          changes_requested_at: string | null
          changes_requested_by: string | null
          changes_requested_reason: string | null
          client_company_id: string | null
          client_id: string | null
          contract_number: string
          contract_type: string
          contract_value: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          employer_id: string | null
          end_date: string
          first_party_id: string | null
          google_doc_url: string | null
          id: string
          is_current: boolean | null
          location_ar: string | null
          location_en: string | null
          location_id: string | null
          notes: string | null
          notice_period: number | null
          notify_days_before_contract_expiry: number | null
          payment_terms: string | null
          pdf_url: string | null
          priority: string
          product_id: string | null
          products_ar: string | null
          products_en: string | null
          promoter_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          renewal_terms: string | null
          second_party_id: string | null
          sent_to_hr_at: string | null
          sent_to_hr_by: string | null
          sent_to_legal_at: string | null
          sent_to_legal_by: string | null
          start_date: string
          status: string
          submitted_for_review_at: string | null
          tags: string[] | null
          termination_clause: string | null
          terms: string | null
          title: string
          total_value: number | null
          type: string
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          amount?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          basic_salary?: number | null
          billing_frequency?: string | null
          changes_requested_at?: string | null
          changes_requested_by?: string | null
          changes_requested_reason?: string | null
          client_company_id?: string | null
          client_id?: string | null
          contract_number: string
          contract_type?: string
          contract_value?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          employer_id?: string | null
          end_date: string
          first_party_id?: string | null
          google_doc_url?: string | null
          id?: string
          is_current?: boolean | null
          location_ar?: string | null
          location_en?: string | null
          location_id?: string | null
          notes?: string | null
          notice_period?: number | null
          notify_days_before_contract_expiry?: number | null
          payment_terms?: string | null
          pdf_url?: string | null
          priority?: string
          product_id?: string | null
          products_ar?: string | null
          products_en?: string | null
          promoter_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          renewal_terms?: string | null
          second_party_id?: string | null
          sent_to_hr_at?: string | null
          sent_to_hr_by?: string | null
          sent_to_legal_at?: string | null
          sent_to_legal_by?: string | null
          start_date: string
          status?: string
          submitted_for_review_at?: string | null
          tags?: string[] | null
          termination_clause?: string | null
          terms?: string | null
          title: string
          total_value?: number | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          amount?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          basic_salary?: number | null
          billing_frequency?: string | null
          changes_requested_at?: string | null
          changes_requested_by?: string | null
          changes_requested_reason?: string | null
          client_company_id?: string | null
          client_id?: string | null
          contract_number?: string
          contract_type?: string
          contract_value?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          employer_id?: string | null
          end_date?: string
          first_party_id?: string | null
          google_doc_url?: string | null
          id?: string
          is_current?: boolean | null
          location_ar?: string | null
          location_en?: string | null
          location_id?: string | null
          notes?: string | null
          notice_period?: number | null
          notify_days_before_contract_expiry?: number | null
          payment_terms?: string | null
          pdf_url?: string | null
          priority?: string
          product_id?: string | null
          products_ar?: string | null
          products_en?: string | null
          promoter_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          renewal_terms?: string | null
          second_party_id?: string | null
          sent_to_hr_at?: string | null
          sent_to_hr_by?: string | null
          sent_to_legal_at?: string | null
          sent_to_legal_by?: string | null
          start_date?: string
          status?: string
          submitted_for_review_at?: string | null
          tags?: string[] | null
          termination_clause?: string | null
          terms?: string | null
          title?: string
          total_value?: number | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "parties"
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
            foreignKeyName: "contracts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
            foreignKeyName: "contracts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
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
      dashboard_layouts: {
        Row: {
          breakpoint: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          layout_data: Json
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          breakpoint?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout_data: Json
          name?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          breakpoint?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout_data?: Json
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      default_layouts_by_role: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          layout_data: Json
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          layout_data: Json
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          layout_data?: Json
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      deliverables_master: {
        Row: {
          category_id: string
          created_at: string | null
          deliverable: string
          description: string | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          deliverable: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          deliverable?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tracking: {
        Row: {
          actual_delivery: string | null
          carrier: string | null
          checkpoints: Json | null
          created_at: string | null
          created_by: string | null
          estimated_delivery: string | null
          from_location: string
          id: string
          metadata: Json | null
          progress_percentage: number | null
          status: string | null
          title: string
          to_location: string
          tracking_number: string
          updated_at: string | null
        }
        Insert: {
          actual_delivery?: string | null
          carrier?: string | null
          checkpoints?: Json | null
          created_at?: string | null
          created_by?: string | null
          estimated_delivery?: string | null
          from_location: string
          id?: string
          metadata?: Json | null
          progress_percentage?: number | null
          status?: string | null
          title: string
          to_location: string
          tracking_number: string
          updated_at?: string | null
        }
        Update: {
          actual_delivery?: string | null
          carrier?: string | null
          checkpoints?: Json | null
          created_at?: string | null
          created_by?: string | null
          estimated_delivery?: string | null
          from_location?: string
          id?: string
          metadata?: Json | null
          progress_percentage?: number | null
          status?: string | null
          title?: string
          to_location?: string
          tracking_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      designations: {
        Row: {
          category: string | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_required: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_required?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_required?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_comments: {
        Row: {
          author_id: string
          author_name: string
          author_role: string
          booking_id: string
          content: string
          created_at: string | null
          document_id: string
          id: string
          is_internal: boolean | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          author_role: string
          booking_id: string
          content: string
          created_at?: string | null
          document_id: string
          id?: string
          is_internal?: boolean | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          author_role?: string
          booking_id?: string
          content?: string
          created_at?: string | null
          document_id?: string
          id?: string
          is_internal?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_reminders: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          notification_method: string | null
          reminder_date: string
          reminder_type: string
          sent_at: string | null
          sent_to: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          notification_method?: string | null
          reminder_date: string
          reminder_type: string
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          notification_method?: string | null
          reminder_date?: string
          reminder_type?: string
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_reminders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "employee_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reminders_sent_to_fkey"
            columns: ["sent_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reminders_sent_to_fkey"
            columns: ["sent_to"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reminders_sent_to_fkey"
            columns: ["sent_to"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reminders_sent_to_fkey"
            columns: ["sent_to"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_reminders_sent_to_fkey"
            columns: ["sent_to"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      document_requests: {
        Row: {
          booking_id: string
          category_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_required: boolean | null
          milestone_id: string | null
          priority: string | null
          requested_by: string
          requested_from: string
          status: string
          task_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean | null
          milestone_id?: string | null
          priority?: string | null
          requested_by: string
          requested_from: string
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean | null
          milestone_id?: string | null
          priority?: string | null
          requested_by?: string
          requested_from?: string
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "document_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks_status"
            referencedColumns: ["id"]
          },
        ]
      }
      document_return_tracking: {
        Row: {
          company_id: string | null
          completed_date: string | null
          completion_percentage: number | null
          created_at: string | null
          created_by: string | null
          deadline_date: string | null
          documents_to_return: Json
          employer_employee_id: string
          id: string
          notes: string | null
          received_at: string | null
          received_by: string | null
          requested_date: string
          returned_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          completed_date?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string | null
          documents_to_return?: Json
          employer_employee_id: string
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          requested_date: string
          returned_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          completed_date?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string | null
          documents_to_return?: Json
          employer_employee_id?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          requested_date?: string
          returned_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_return_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_return_tracking_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "document_return_tracking_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_return_tracking_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "document_return_tracking_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_return_tracking_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_return_tracking_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_content: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_content?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_content?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          booking_id: string
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          is_latest: boolean | null
          milestone_id: string | null
          original_name: string
          rejection_reason: string | null
          request_id: string | null
          status: string
          task_id: string | null
          updated_at: string | null
          uploaded_by: string
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          booking_id: string
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          is_latest?: boolean | null
          milestone_id?: string | null
          original_name: string
          rejection_reason?: string | null
          request_id?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string | null
          uploaded_by: string
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          is_latest?: boolean | null
          milestone_id?: string | null
          original_name?: string
          rejection_reason?: string | null
          request_id?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string | null
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "documents_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks_status"
            referencedColumns: ["id"]
          },
        ]
      }
      email_clicks: {
        Row: {
          clicked_at: string
          created_at: string | null
          email_id: string
          id: string
          link: string
        }
        Insert: {
          clicked_at: string
          created_at?: string | null
          email_id: string
          id?: string
          link: string
        }
        Update: {
          clicked_at?: string
          created_at?: string | null
          email_id?: string
          id?: string
          link?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_clicks_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "email_logs"
            referencedColumns: ["email_id"]
          },
        ]
      }
      email_digests: {
        Row: {
          createdAt: string | null
          emailAddress: string
          frequency: string
          htmlContent: string | null
          id: string
          scheduledFor: string
          sentAt: string | null
          status: string | null
          subject: string | null
          updatedAt: string | null
          userId: string
        }
        Insert: {
          createdAt?: string | null
          emailAddress: string
          frequency: string
          htmlContent?: string | null
          id?: string
          scheduledFor: string
          sentAt?: string | null
          status?: string | null
          subject?: string | null
          updatedAt?: string | null
          userId: string
        }
        Update: {
          createdAt?: string | null
          emailAddress?: string
          frequency?: string
          htmlContent?: string | null
          id?: string
          scheduledFor?: string
          sentAt?: string | null
          status?: string | null
          subject?: string | null
          updatedAt?: string | null
          userId?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          bounce_message: string | null
          bounce_type: string | null
          bounced: boolean | null
          bounced_at: string | null
          complained: boolean | null
          created_at: string | null
          delivered_at: string | null
          email_id: string
          id: string
          metadata: Json | null
          open_count: number | null
          opened: boolean | null
          opened_at: string | null
          sent_at: string | null
          status: string
          subject: string | null
          to_email: string
        }
        Insert: {
          bounce_message?: string | null
          bounce_type?: string | null
          bounced?: boolean | null
          bounced_at?: string | null
          complained?: boolean | null
          created_at?: string | null
          delivered_at?: string | null
          email_id: string
          id?: string
          metadata?: Json | null
          open_count?: number | null
          opened?: boolean | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_email: string
        }
        Update: {
          bounce_message?: string | null
          bounce_type?: string | null
          bounced?: boolean | null
          bounced_at?: string | null
          complained?: boolean | null
          created_at?: string | null
          delivered_at?: string | null
          email_id?: string
          id?: string
          metadata?: Json | null
          open_count?: number | null
          opened?: boolean | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_email?: string
        }
        Relationships: []
      }
      email_notification_logs: {
        Row: {
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          notification_id: string
          notification_type: string
          provider: string | null
          provider_message_id: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          notification_id: string
          notification_type: string
          provider?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          notification_id?: string
          notification_type?: string
          provider?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_notification_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string | null
          daily_digest_time: string | null
          email_address: string
          email_template_style: string | null
          id: string
          is_unsubscribed: boolean | null
          is_verified: boolean | null
          send_time_preference: string | null
          unsubscribe_token: string | null
          updated_at: string | null
          user_id: string
          verification_expires_at: string | null
          verification_token: string | null
          weekly_digest_day: number | null
        }
        Insert: {
          created_at?: string | null
          daily_digest_time?: string | null
          email_address: string
          email_template_style?: string | null
          id?: string
          is_unsubscribed?: boolean | null
          is_verified?: boolean | null
          send_time_preference?: string | null
          unsubscribe_token?: string | null
          updated_at?: string | null
          user_id: string
          verification_expires_at?: string | null
          verification_token?: string | null
          weekly_digest_day?: number | null
        }
        Update: {
          created_at?: string | null
          daily_digest_time?: string | null
          email_address?: string
          email_template_style?: string | null
          id?: string
          is_unsubscribed?: boolean | null
          is_verified?: boolean | null
          send_time_preference?: string | null
          unsubscribe_token?: string | null
          updated_at?: string | null
          user_id?: string
          verification_expires_at?: string | null
          verification_token?: string | null
          weekly_digest_day?: number | null
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          email_address: string
          error_message: string | null
          id: string
          max_attempts: number | null
          notification_id: string
          notification_type: string
          priority: number | null
          processed_at: string | null
          scheduled_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email_address: string
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          notification_id: string
          notification_type: string
          priority?: number | null
          processed_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email_address?: string
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          notification_id?: string
          notification_type?: string
          priority?: number | null
          processed_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          html_template: string
          id: string
          is_active: boolean | null
          name: string
          notification_type: string
          subject_template: string
          text_template: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          html_template: string
          id?: string
          is_active?: boolean | null
          name: string
          notification_type: string
          subject_template: string
          text_template: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          html_template?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notification_type?: string
          subject_template?: string
          text_template?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      employee_attendance: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attendance_date: string
          break_duration_minutes: number | null
          break_start_time: string | null
          check_in: string | null
          check_in_photo: string | null
          check_out: string | null
          check_out_photo: string | null
          created_at: string | null
          device_fingerprint: string | null
          device_info: Json | null
          distance_from_office: number | null
          employer_employee_id: string
          id: string
          ip_address: unknown
          latitude: number | null
          location: string | null
          location_accuracy: number | null
          location_verified: boolean | null
          longitude: number | null
          method: string | null
          notes: string | null
          overtime_hours: number | null
          rejection_reason: string | null
          status: string | null
          total_hours: number | null
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attendance_date: string
          break_duration_minutes?: number | null
          break_start_time?: string | null
          check_in?: string | null
          check_in_photo?: string | null
          check_out?: string | null
          check_out_photo?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          device_info?: Json | null
          distance_from_office?: number | null
          employer_employee_id: string
          id?: string
          ip_address?: unknown
          latitude?: number | null
          location?: string | null
          location_accuracy?: number | null
          location_verified?: boolean | null
          longitude?: number | null
          method?: string | null
          notes?: string | null
          overtime_hours?: number | null
          rejection_reason?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attendance_date?: string
          break_duration_minutes?: number | null
          break_start_time?: string | null
          check_in?: string | null
          check_in_photo?: string | null
          check_out?: string | null
          check_out_photo?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          device_info?: Json | null
          distance_from_office?: number | null
          employer_employee_id?: string
          id?: string
          ip_address?: unknown
          latitude?: number | null
          location?: string | null
          location_accuracy?: number | null
          location_verified?: boolean | null
          longitude?: number | null
          method?: string | null
          notes?: string | null
          overtime_hours?: number | null
          rejection_reason?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_attendance_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_attendance_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "employee_attendance_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_attendance_groups: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          default_check_in_time: string | null
          default_check_out_time: string | null
          department_name: string | null
          description: string | null
          employee_count: number | null
          group_type: string | null
          id: string
          is_active: boolean | null
          name: string
          office_location_id: string | null
          project_name: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          default_check_in_time?: string | null
          default_check_out_time?: string | null
          department_name?: string | null
          description?: string | null
          employee_count?: number | null
          group_type?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          office_location_id?: string | null
          project_name?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          default_check_in_time?: string | null
          default_check_out_time?: string | null
          department_name?: string | null
          description?: string | null
          employee_count?: number | null
          group_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          office_location_id?: string | null
          project_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_attendance_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_attendance_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "employee_attendance_groups_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "office_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_groups_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "office_locations_with_company"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_compliance: {
        Row: {
          checked_by: string | null
          completion_date: string | null
          created_at: string | null
          employer_employee_id: string
          expiry_date: string | null
          id: string
          last_checked_at: string | null
          notes: string | null
          requirement_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          checked_by?: string | null
          completion_date?: string | null
          created_at?: string | null
          employer_employee_id: string
          expiry_date?: string | null
          id?: string
          last_checked_at?: string | null
          notes?: string | null
          requirement_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          checked_by?: string | null
          completion_date?: string | null
          created_at?: string | null
          employer_employee_id?: string
          expiry_date?: string | null
          id?: string
          last_checked_at?: string | null
          notes?: string | null
          requirement_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_compliance_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_compliance_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_compliance_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_compliance_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_compliance_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "employee_compliance_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_compliance_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_number: string | null
          document_type: string
          employer_employee_id: string
          expiry_date: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          issue_date: string | null
          issuing_authority: string | null
          metadata: Json | null
          mime_type: string | null
          notes: string | null
          rejection_reason: string | null
          status: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_number?: string | null
          document_type: string
          employer_employee_id: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          metadata?: Json | null
          mime_type?: string | null
          notes?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_number?: string | null
          document_type?: string
          employer_employee_id?: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          metadata?: Json | null
          mime_type?: string | null
          notes?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      employee_expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string
          employer_employee_id: string
          expense_date: string
          id: string
          paid_at: string | null
          payment_reference: string | null
          receipt_filename: string | null
          receipt_url: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          employer_employee_id: string
          expense_date: string
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          receipt_filename?: string | null
          receipt_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          employer_employee_id?: string
          expense_date?: string
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          receipt_filename?: string | null
          receipt_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_expenses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      employee_group_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          employer_employee_id: string
          group_id: string
          id: string
          is_primary: boolean | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          employer_employee_id: string
          group_id: string
          id?: string
          is_primary?: boolean | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          employer_employee_id?: string
          group_id?: string
          id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_group_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_group_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_group_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_group_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_group_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "employee_group_assignments_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "employee_attendance_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leave_balances: {
        Row: {
          created_at: string | null
          employer_employee_id: string
          id: string
          leave_type: string
          pending_days: number
          total_days: number
          updated_at: string | null
          used_days: number
          year: number
        }
        Insert: {
          created_at?: string | null
          employer_employee_id: string
          id?: string
          leave_type: string
          pending_days?: number
          total_days?: number
          updated_at?: string | null
          used_days?: number
          year?: number
        }
        Update: {
          created_at?: string | null
          employer_employee_id?: string
          id?: string
          leave_type?: string
          pending_days?: number
          total_days?: number
          updated_at?: string | null
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_leave_balances_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leave_requests: {
        Row: {
          created_at: string | null
          employer_employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          total_days: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employer_employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
          total_days: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employer_employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_leave_requests_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      employee_performance_reviews: {
        Row: {
          acknowledged_at: string | null
          areas_for_improvement: string | null
          attendance_rating: number | null
          communication_rating: number | null
          created_at: string | null
          employee_comments: string | null
          employer_employee_id: string
          goals_for_next_period: string | null
          id: string
          initiative_rating: number | null
          manager_comments: string | null
          overall_rating: number | null
          performance_rating: number | null
          review_period_end: string
          review_period_start: string
          review_type: string
          reviewed_by: string | null
          status: string
          strengths: string | null
          submitted_at: string | null
          teamwork_rating: number | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          areas_for_improvement?: string | null
          attendance_rating?: number | null
          communication_rating?: number | null
          created_at?: string | null
          employee_comments?: string | null
          employer_employee_id: string
          goals_for_next_period?: string | null
          id?: string
          initiative_rating?: number | null
          manager_comments?: string | null
          overall_rating?: number | null
          performance_rating?: number | null
          review_period_end: string
          review_period_start: string
          review_type?: string
          reviewed_by?: string | null
          status?: string
          strengths?: string | null
          submitted_at?: string | null
          teamwork_rating?: number | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          areas_for_improvement?: string | null
          attendance_rating?: number | null
          communication_rating?: number | null
          created_at?: string | null
          employee_comments?: string | null
          employer_employee_id?: string
          goals_for_next_period?: string | null
          id?: string
          initiative_rating?: number | null
          manager_comments?: string | null
          overall_rating?: number | null
          performance_rating?: number | null
          review_period_end?: string
          review_period_start?: string
          review_type?: string
          reviewed_by?: string | null
          status?: string
          strengths?: string | null
          submitted_at?: string | null
          teamwork_rating?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_performance_reviews_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_performance_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_performance_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_performance_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_performance_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_performance_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      employee_permissions: {
        Row: {
          created_at: string | null
          employer_employee_id: string
          granted: boolean | null
          granted_at: string | null
          granted_by: string | null
          id: string
          notes: string | null
          permission_id: string
        }
        Insert: {
          created_at?: string | null
          employer_employee_id: string
          granted?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          permission_id: string
        }
        Update: {
          created_at?: string | null
          employer_employee_id?: string
          granted?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_permissions_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      employee_targets: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          employer_employee_id: string
          end_date: string
          id: string
          metadata: Json | null
          notes: string | null
          period_type: string | null
          progress_percentage: number | null
          start_date: string
          status: string | null
          target_type: string | null
          target_value: number
          title: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          employer_employee_id: string
          end_date: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          period_type?: string | null
          progress_percentage?: number | null
          start_date: string
          status?: string | null
          target_type?: string | null
          target_value: number
          title: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          employer_employee_id?: string
          end_date?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          period_type?: string | null
          progress_percentage?: number | null
          start_date?: string
          status?: string | null
          target_type?: string | null
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_targets_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_targets_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_targets_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_targets_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_targets_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "employee_targets_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_tasks: {
        Row: {
          actual_hours: number | null
          assigned_at: string | null
          assigned_by: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          employer_employee_id: string
          estimated_hours: number | null
          id: string
          metadata: Json | null
          priority: string | null
          status: string | null
          tags: string[] | null
          task_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          employer_employee_id: string
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          task_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          employer_employee_id?: string
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "employee_tasks_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_employees: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          department: string | null
          employee_code: string | null
          employee_id: string
          employer_id: string
          employment_status: string | null
          employment_type: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          notes: string | null
          party_id: string | null
          promoter_id: string | null
          reporting_manager_id: string | null
          salary: number | null
          termination_date: string | null
          updated_at: string | null
          work_location: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          employee_code?: string | null
          employee_id: string
          employer_id: string
          employment_status?: string | null
          employment_type?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          notes?: string | null
          party_id?: string | null
          promoter_id?: string | null
          reporting_manager_id?: string | null
          salary?: number | null
          termination_date?: string | null
          updated_at?: string | null
          work_location?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          employee_code?: string | null
          employee_id?: string
          employer_id?: string
          employment_status?: string | null
          employment_type?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          notes?: string | null
          party_id?: string | null
          promoter_id?: string | null
          reporting_manager_id?: string | null
          salary?: number | null
          termination_date?: string | null
          updated_at?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employer_employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "employer_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employer_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "employer_employees_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employer_employees_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "employer_employees_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_employees_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employer_employees_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string | null
          effective_date: string
          from_currency: Database["public"]["Enums"]["currency_code"]
          id: string
          is_active: boolean | null
          rate: number
          source: string | null
          to_currency: Database["public"]["Enums"]["currency_code"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          effective_date?: string
          from_currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          is_active?: boolean | null
          rate: number
          source?: string | null
          to_currency: Database["public"]["Enums"]["currency_code"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          from_currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          is_active?: boolean | null
          rate?: number
          source?: string | null
          to_currency?: Database["public"]["Enums"]["currency_code"]
          updated_at?: string | null
        }
        Relationships: []
      }
      exit_interviews: {
        Row: {
          company_id: string | null
          conducted_by: string | null
          created_at: string | null
          created_by: string | null
          employee_id: string | null
          employer_employee_id: string
          id: string
          interview_date: string
          interview_type: string | null
          notes: string | null
          overall_feedback: string | null
          questions_answers: Json | null
          rating: number | null
          reason_category: string | null
          resignation_reason: string | null
          status: string | null
          suggestions_for_improvement: string | null
          updated_at: string | null
          would_recommend: boolean | null
        }
        Insert: {
          company_id?: string | null
          conducted_by?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          employer_employee_id: string
          id?: string
          interview_date: string
          interview_type?: string | null
          notes?: string | null
          overall_feedback?: string | null
          questions_answers?: Json | null
          rating?: number | null
          reason_category?: string | null
          resignation_reason?: string | null
          status?: string | null
          suggestions_for_improvement?: string | null
          updated_at?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          company_id?: string | null
          conducted_by?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          employer_employee_id?: string
          id?: string
          interview_date?: string
          interview_type?: string | null
          notes?: string | null
          overall_feedback?: string | null
          questions_answers?: Json | null
          rating?: number | null
          reason_category?: string | null
          resignation_reason?: string | null
          status?: string | null
          suggestions_for_improvement?: string | null
          updated_at?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "exit_interviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exit_interviews_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "exit_interviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exit_interviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "exit_interviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exit_interviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "exit_interviews_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string | null
          description: string | null
          employer_id: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          employer_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          employer_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expense_categories_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      experience_certificates: {
        Row: {
          achievements: string[] | null
          approved_at: string | null
          approved_by: string | null
          certificate_content: string | null
          certificate_content_ar: string | null
          certificate_number: string | null
          certificate_pdf_url: string | null
          certificate_type: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          delivered_date: string | null
          department: string | null
          employer_employee_id: string
          end_date: string
          id: string
          issued_by: string | null
          issued_date: string | null
          notes: string | null
          performance_summary: string | null
          position_title: string
          start_date: string
          status: string | null
          total_service_months: number | null
          total_service_years: number | null
          updated_at: string | null
        }
        Insert: {
          achievements?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          certificate_content?: string | null
          certificate_content_ar?: string | null
          certificate_number?: string | null
          certificate_pdf_url?: string | null
          certificate_type?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_date?: string | null
          department?: string | null
          employer_employee_id: string
          end_date: string
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          notes?: string | null
          performance_summary?: string | null
          position_title: string
          start_date: string
          status?: string | null
          total_service_months?: number | null
          total_service_years?: number | null
          updated_at?: string | null
        }
        Update: {
          achievements?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          certificate_content?: string | null
          certificate_content_ar?: string | null
          certificate_number?: string | null
          certificate_pdf_url?: string | null
          certificate_type?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_date?: string | null
          department?: string | null
          employer_employee_id?: string
          end_date?: string
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          notes?: string | null
          performance_summary?: string | null
          position_title?: string
          start_date?: string
          status?: string | null
          total_service_months?: number | null
          total_service_years?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_certificates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "experience_certificates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "experience_certificates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "experience_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "experience_certificates_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "experience_certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      failed_login_attempts: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          email: string
          first_attempt_at: string | null
          id: string
          ip_address: unknown
          last_attempt_at: string | null
          user_agent: string | null
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          email: string
          first_attempt_at?: string | null
          id?: string
          ip_address: unknown
          last_attempt_at?: string | null
          user_agent?: string | null
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          email?: string
          first_attempt_at?: string | null
          id?: string
          ip_address?: unknown
          last_attempt_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      final_settlements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deductions: number | null
          employer_employee_id: string
          final_salary: number | null
          gratuity: number | null
          id: string
          last_working_date: string
          leave_encashment: number | null
          notes: string | null
          notice_period_pay: number | null
          paid_at: string | null
          paid_by: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          payslip_url: string | null
          settlement_date: string
          settlement_letter_url: string | null
          settlement_type: string
          total_settlement: number
          unused_leave_days: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deductions?: number | null
          employer_employee_id: string
          final_salary?: number | null
          gratuity?: number | null
          id?: string
          last_working_date: string
          leave_encashment?: number | null
          notes?: string | null
          notice_period_pay?: number | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          payslip_url?: string | null
          settlement_date: string
          settlement_letter_url?: string | null
          settlement_type: string
          total_settlement: number
          unused_leave_days?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deductions?: number | null
          employer_employee_id?: string
          final_salary?: number | null
          gratuity?: number | null
          id?: string
          last_working_date?: string
          leave_encashment?: number | null
          notes?: string | null
          notice_period_pay?: number | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          payslip_url?: string | null
          settlement_date?: string
          settlement_letter_url?: string | null
          settlement_type?: string
          total_settlement?: number
          unused_leave_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "final_settlements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "final_settlements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "final_settlements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "final_settlements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "final_settlements_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_settlements_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "final_settlements_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      holding_group_members: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          holding_group_id: string
          id: string
          member_type: string
          notes: string | null
          party_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          holding_group_id: string
          id?: string
          member_type: string
          notes?: string | null
          party_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          holding_group_id?: string
          id?: string
          member_type?: string
          notes?: string | null
          party_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holding_group_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_group_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_group_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_group_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_group_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_group_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "holding_group_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "holding_group_members_holding_group_id_fkey"
            columns: ["holding_group_id"]
            isOneToOne: false
            referencedRelation: "holding_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_group_members_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      holding_groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name_ar: string | null
          name_en: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name_ar?: string | null
          name_en: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name_ar?: string | null
          name_en?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holding_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "holding_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      hr_letters: {
        Row: {
          additional_data: Json | null
          approved_at: string | null
          approved_by: string | null
          content: string
          created_at: string | null
          employer_employee_id: string
          generated_by: string | null
          id: string
          letter_type: string
          metadata: Json | null
          pdf_url: string | null
          sent_at: string | null
          sent_to: string | null
          status: string | null
          subject: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          additional_data?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          content: string
          created_at?: string | null
          employer_employee_id: string
          generated_by?: string | null
          id?: string
          letter_type: string
          metadata?: Json | null
          pdf_url?: string | null
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_data?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          created_at?: string | null
          employer_employee_id?: string
          generated_by?: string | null
          id?: string
          letter_type?: string
          metadata?: Json | null
          pdf_url?: string | null
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "hr_letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "hr_letters_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_letters_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_letters_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_letters_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_letters_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "hr_letters_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string | null
          key: string
        }
        Insert: {
          created_at?: string | null
          key: string
        }
        Update: {
          created_at?: string | null
          key?: string
        }
        Relationships: []
      }
      insight_events: {
        Row: {
          confidence_score: number | null
          context: Json | null
          created_at: string | null
          id: string
          is_resolved: boolean | null
          metrics: Json | null
          recommendation: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          summary: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          context?: Json | null
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          metrics?: Json | null
          recommendation?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          summary: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          context?: Json | null
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          metrics?: Json | null
          recommendation?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          summary?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insight_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "insight_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      insight_notifications: {
        Row: {
          channel_id: string
          created_at: string | null
          error_message: string | null
          id: string
          insight_id: string
          metadata: Json | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          insight_id: string
          metadata?: Json | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          insight_id?: string
          metadata?: Json | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insight_notifications_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_notifications_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "insight_events"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_run_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          insights_generated: Json | null
          metadata: Json | null
          run_at: string | null
          status: string | null
          total_insights: number | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          insights_generated?: Json | null
          metadata?: Json | null
          run_at?: string | null
          status?: string | null
          total_insights?: number | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          insights_generated?: Json | null
          metadata?: Json | null
          run_at?: string | null
          status?: string | null
          total_insights?: number | null
        }
        Relationships: []
      }
      interview_schedules: {
        Row: {
          application_id: string
          cancelled_reason: string | null
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          feedback: Json | null
          id: string
          interview_notes: string | null
          interview_round: number | null
          interview_type: string
          interviewer_ids: string[]
          interviewer_names: string[] | null
          location: string | null
          meeting_link: string | null
          overall_rating: number | null
          recommendation: string | null
          rescheduled_from_id: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          cancelled_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          feedback?: Json | null
          id?: string
          interview_notes?: string | null
          interview_round?: number | null
          interview_type: string
          interviewer_ids: string[]
          interviewer_names?: string[] | null
          location?: string | null
          meeting_link?: string | null
          overall_rating?: number | null
          recommendation?: string | null
          rescheduled_from_id?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          cancelled_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          feedback?: Json | null
          id?: string
          interview_notes?: string | null
          interview_round?: number | null
          interview_type?: string
          interviewer_ids?: string[]
          interviewer_names?: string[] | null
          location?: string | null
          meeting_link?: string | null
          overall_rating?: number | null
          recommendation?: string | null
          rescheduled_from_id?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_schedules_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "interview_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "interview_schedules_rescheduled_from_id_fkey"
            columns: ["rescheduled_from_id"]
            isOneToOne: false
            referencedRelation: "interview_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          booking_id: string
          client_email: string | null
          client_id: string
          client_name: string | null
          company_logo: string | null
          company_name: string | null
          created_at: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_number: string | null
          invoice_pdf_url: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_terms: string | null
          pdf_url: string | null
          provider_email: string | null
          provider_id: string
          provider_name: string | null
          service_description: string | null
          service_title: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          updated_at: string | null
          vat_amount: number | null
          vat_percent: number | null
        }
        Insert: {
          amount?: number
          booking_id: string
          client_email?: string | null
          client_id: string
          client_name?: string | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          provider_email?: string | null
          provider_id: string
          provider_name?: string | null
          service_description?: string | null
          service_title?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_percent?: number | null
        }
        Update: {
          amount?: number
          booking_id?: string
          client_email?: string | null
          client_id?: string
          client_name?: string | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          provider_email?: string | null
          provider_id?: string
          provider_name?: string | null
          service_description?: string | null
          service_title?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "fk_invoices_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_invoices_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      job_postings: {
        Row: {
          application_deadline: string | null
          applications_count: number | null
          closed_at: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          department: string | null
          description: string | null
          description_ar: string | null
          education_required: string | null
          experience_required: number | null
          id: string
          job_type: string
          location: string | null
          metadata: Json | null
          preferred_skills: string[] | null
          published_at: string | null
          required_documents: string[] | null
          required_skills: string[] | null
          salary_max: number | null
          salary_min: number | null
          status: string | null
          title: string
          title_ar: string | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          application_deadline?: string | null
          applications_count?: number | null
          closed_at?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          description?: string | null
          description_ar?: string | null
          education_required?: string | null
          experience_required?: number | null
          id?: string
          job_type: string
          location?: string | null
          metadata?: Json | null
          preferred_skills?: string[] | null
          published_at?: string | null
          required_documents?: string[] | null
          required_skills?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          application_deadline?: string | null
          applications_count?: number | null
          closed_at?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          description?: string | null
          description_ar?: string | null
          education_required?: string | null
          experience_required?: number | null
          id?: string
          job_type?: string
          location?: string | null
          metadata?: Json | null
          preferred_skills?: string[] | null
          published_at?: string | null
          required_documents?: string[] | null
          required_skills?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_postings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      leads: {
        Row: {
          createdAt: string | null
          currentStage: string
          email: string
          id: string
          metadata: Json | null
          source: string | null
          stages: string[]
          submissionId: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          currentStage: string
          email: string
          id?: string
          metadata?: Json | null
          source?: string | null
          stages?: string[]
          submissionId: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          currentStage?: string
          email?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          stages?: string[]
          submissionId?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      letter_templates: {
        Row: {
          company_id: string | null
          content_template: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          letter_type: string
          placeholders: Json | null
          subject_template: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          content_template: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          letter_type: string
          placeholders?: Json | null
          subject_template: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          content_template?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          letter_type?: string
          placeholders?: Json | null
          subject_template?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "letter_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "letter_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      load_test_results: {
        Row: {
          average_response_time_ms: number | null
          booking_id: string | null
          created_at: string | null
          created_by: string | null
          duration_seconds: number | null
          end_time: string | null
          error_message: string | null
          error_rate: number | null
          failed_requests: number | null
          id: string
          max_response_time_ms: number | null
          min_response_time_ms: number | null
          requests_per_second: number | null
          results_data: Json | null
          start_time: string
          status: string
          successful_requests: number | null
          test_config: Json | null
          test_name: string
          test_type: string
          total_requests: number | null
        }
        Insert: {
          average_response_time_ms?: number | null
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          error_message?: string | null
          error_rate?: number | null
          failed_requests?: number | null
          id?: string
          max_response_time_ms?: number | null
          min_response_time_ms?: number | null
          requests_per_second?: number | null
          results_data?: Json | null
          start_time: string
          status: string
          successful_requests?: number | null
          test_config?: Json | null
          test_name: string
          test_type: string
          total_requests?: number | null
        }
        Update: {
          average_response_time_ms?: number | null
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          error_message?: string | null
          error_rate?: number | null
          failed_requests?: number | null
          id?: string
          max_response_time_ms?: number | null
          min_response_time_ms?: number | null
          requests_per_second?: number | null
          results_data?: Json | null
          start_time?: string
          status?: string
          successful_requests?: number | null
          test_config?: Json | null
          test_name?: string
          test_type?: string
          total_requests?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "load_test_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      locations: {
        Row: {
          address_ar: string | null
          address_en: string | null
          amenities: Json | null
          capacity: number | null
          city_ar: string | null
          city_en: string | null
          contact_email: string | null
          contact_person_ar: string | null
          contact_person_en: string | null
          contact_phone: string | null
          coordinates: Json | null
          country_ar: string | null
          country_en: string | null
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          name_ar: string | null
          name_en: string
          postal_code: string | null
          state_ar: string | null
          state_en: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          amenities?: Json | null
          capacity?: number | null
          city_ar?: string | null
          city_en?: string | null
          contact_email?: string | null
          contact_person_ar?: string | null
          contact_person_en?: string | null
          contact_phone?: string | null
          coordinates?: Json | null
          country_ar?: string | null
          country_en?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name_ar?: string | null
          name_en: string
          postal_code?: string | null
          state_ar?: string | null
          state_en?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          amenities?: Json | null
          capacity?: number | null
          city_ar?: string | null
          city_en?: string | null
          contact_email?: string | null
          contact_person_ar?: string | null
          contact_person_en?: string | null
          contact_phone?: string | null
          coordinates?: Json | null
          country_ar?: string | null
          country_en?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name_ar?: string | null
          name_en?: string
          postal_code?: string | null
          state_ar?: string | null
          state_en?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "booking_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "booking_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          booking_id: string | null
          content: string | null
          created_at: string | null
          id: string
          message: string | null
          message_type: string | null
          priority: string | null
          read: boolean | null
          read_at: string | null
          receiver_id: string | null
          scheduled_send: string | null
          sender_id: string
          status: string | null
          subject: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          booking_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          message_type?: string | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          receiver_id?: string | null
          scheduled_send?: string | null
          sender_id: string
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          booking_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          message_type?: string | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          receiver_id?: string | null
          scheduled_send?: string | null
          sender_id?: string
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      metrics_history: {
        Row: {
          breakdown: Json | null
          created_at: string
          created_by: string | null
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          snapshot_date: string
          snapshot_time: string
        }
        Insert: {
          breakdown?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          snapshot_date?: string
          snapshot_time?: string
        }
        Update: {
          breakdown?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          snapshot_date?: string
          snapshot_time?: string
        }
        Relationships: []
      }
      milestone_approvals: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          milestone_id: string
          status: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          milestone_id: string
          status: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          milestone_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_approvals_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_approvals_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_comments: {
        Row: {
          author_name: string | null
          author_role: string | null
          booking_id: string
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_internal: boolean | null
          milestone_id: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_name?: string | null
          author_role?: string | null
          booking_id: string
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          is_internal?: boolean | null
          milestone_id: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_name?: string | null
          author_role?: string | null
          booking_id?: string
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_internal?: boolean | null
          milestone_id?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_milestone_comments_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestone_comments_author_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_author_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_author_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_author_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "milestone_comments_author_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestone_comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestone_comments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "milestone_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string
          depends_on_milestone_id: string
          id: string
          lag_days: number | null
          milestone_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type: string
          depends_on_milestone_id: string
          id?: string
          lag_days?: number | null
          milestone_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string
          depends_on_milestone_id?: string
          id?: string
          lag_days?: number | null
          milestone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_dependencies_depends_on_milestone_id_fkey"
            columns: ["depends_on_milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_dependencies_depends_on_milestone_id_fkey"
            columns: ["depends_on_milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_dependencies_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_dependencies_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_template_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          order_index: number | null
          priority: string | null
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          order_index?: number | null
          priority?: string | null
          template_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          order_index?: number | null
          priority?: string | null
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "milestone_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_duration_days: number | null
          id: string
          is_active: boolean | null
          name: string
          service_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          service_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          service_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          actual_end_date: string | null
          actual_hours: number | null
          actual_start_date: string | null
          booking_id: string
          completed_at: string | null
          completed_tasks: number | null
          created_at: string | null
          created_by: string | null
          critical_path: boolean | null
          description: string | null
          due_date: string | null
          editable: boolean | null
          end_date: string | null
          estimated_hours: number | null
          id: string
          is_overdue: boolean | null
          month_number: number | null
          order_index: number | null
          overdue_since: string | null
          phase_id: string | null
          priority: string | null
          progress: number | null
          progress_percentage: number | null
          risk_level: string | null
          service_id: string | null
          service_milestone_id: string | null
          start_date: string | null
          status: string | null
          template_id: string | null
          title: string
          total_tasks: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          actual_end_date?: string | null
          actual_hours?: number | null
          actual_start_date?: string | null
          booking_id: string
          completed_at?: string | null
          completed_tasks?: number | null
          created_at?: string | null
          created_by?: string | null
          critical_path?: boolean | null
          description?: string | null
          due_date?: string | null
          editable?: boolean | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_overdue?: boolean | null
          month_number?: number | null
          order_index?: number | null
          overdue_since?: string | null
          phase_id?: string | null
          priority?: string | null
          progress?: number | null
          progress_percentage?: number | null
          risk_level?: string | null
          service_id?: string | null
          service_milestone_id?: string | null
          start_date?: string | null
          status?: string | null
          template_id?: string | null
          title: string
          total_tasks?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          actual_end_date?: string | null
          actual_hours?: number | null
          actual_start_date?: string | null
          booking_id?: string
          completed_at?: string | null
          completed_tasks?: number | null
          created_at?: string | null
          created_by?: string | null
          critical_path?: boolean | null
          description?: string | null
          due_date?: string | null
          editable?: boolean | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_overdue?: boolean | null
          month_number?: number | null
          order_index?: number | null
          overdue_since?: string | null
          phase_id?: string | null
          priority?: string | null
          progress?: number | null
          progress_percentage?: number | null
          risk_level?: string | null
          service_id?: string | null
          service_milestone_id?: string | null
          start_date?: string | null
          status?: string | null
          template_id?: string | null
          title?: string
          total_tasks?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_service_milestone_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_service_milestone_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_service_milestone_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_service_milestone_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "milestones_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "milestone_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones_master: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_refresh_meta: {
        Row: {
          last_refreshed: string
          view_name: string
        }
        Insert: {
          last_refreshed: string
          view_name: string
        }
        Update: {
          last_refreshed?: string
          view_name?: string
        }
        Relationships: []
      }
      notification_channels: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          severity_filter: string[] | null
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          severity_filter?: string[] | null
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          severity_filter?: string[] | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          categories: Json | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          notification_frequency: string | null
          push_notifications: boolean | null
          sound_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categories?: Json | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          notification_frequency?: string | null
          push_notifications?: boolean | null
          sound_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categories?: Json | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          notification_frequency?: string | null
          push_notifications?: boolean | null
          sound_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          body: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          recipient_email: string
          recipient_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          body: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          recipient_email: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          body?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          recipient_email?: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          booking_id: string | null
          channels: string[] | null
          conditions: Json | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          rule_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          channels?: string[] | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          rule_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          channels?: string[] | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          rule_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "notification_rules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          activity_notifications: boolean | null
          booking_notifications: boolean | null
          created_at: string | null
          deadline_notifications: boolean | null
          digest_frequency: string | null
          document_notifications: boolean | null
          email_notifications: boolean | null
          id: string
          invoice_notifications: boolean | null
          message_notifications: boolean | null
          milestone_notifications: boolean | null
          notification_types: Json | null
          payment_notifications: boolean | null
          project_notifications: boolean | null
          push_notifications: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          request_notifications: boolean | null
          review_notifications: boolean | null
          sms_notifications: boolean | null
          system_notifications: boolean | null
          task_notifications: boolean | null
          team_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_notifications?: boolean | null
          booking_notifications?: boolean | null
          created_at?: string | null
          deadline_notifications?: boolean | null
          digest_frequency?: string | null
          document_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          invoice_notifications?: boolean | null
          message_notifications?: boolean | null
          milestone_notifications?: boolean | null
          notification_types?: Json | null
          payment_notifications?: boolean | null
          project_notifications?: boolean | null
          push_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          request_notifications?: boolean | null
          review_notifications?: boolean | null
          sms_notifications?: boolean | null
          system_notifications?: boolean | null
          task_notifications?: boolean | null
          team_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_notifications?: boolean | null
          booking_notifications?: boolean | null
          created_at?: string | null
          deadline_notifications?: boolean | null
          digest_frequency?: string | null
          document_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          invoice_notifications?: boolean | null
          message_notifications?: boolean | null
          milestone_notifications?: boolean | null
          notification_types?: Json | null
          payment_notifications?: boolean | null
          project_notifications?: boolean | null
          push_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          request_notifications?: boolean | null
          review_notifications?: boolean | null
          sms_notifications?: boolean | null
          system_notifications?: boolean | null
          task_notifications?: boolean | null
          team_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          read?: boolean | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      object_meta: {
        Row: {
          created_at: string | null
          id: number
          meta: Json | null
          object_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          meta?: Json | null
          object_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          meta?: Json | null
          object_id?: string
        }
        Relationships: []
      }
      offboarding_checklists: {
        Row: {
          checklist_items: Json
          company_id: string | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          created_by: string | null
          employer_employee_id: string
          id: string
          notes: string | null
          started_at: string | null
          status: string | null
          target_completion_date: string | null
          updated_at: string | null
        }
        Insert: {
          checklist_items?: Json
          company_id?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          employer_employee_id: string
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Update: {
          checklist_items?: Json
          company_id?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          employer_employee_id?: string
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offboarding_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offboarding_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "offboarding_checklists_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      offboarding_tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          attachments: Json | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          due_date: string | null
          id: string
          is_mandatory: boolean | null
          notes: string | null
          offboarding_checklist_id: string
          status: string | null
          task_category: string | null
          task_description: string | null
          task_name: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          offboarding_checklist_id: string
          status?: string | null
          task_category?: string | null
          task_description?: string | null
          task_name: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          offboarding_checklist_id?: string
          status?: string | null
          task_category?: string | null
          task_description?: string | null
          task_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "offboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "offboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "offboarding_tasks_offboarding_checklist_id_fkey"
            columns: ["offboarding_checklist_id"]
            isOneToOne: false
            referencedRelation: "offboarding_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_letters: {
        Row: {
          accepted_at: string | null
          application_id: string
          benefits: Json | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          department: string | null
          employment_type: string
          expiry_date: string | null
          id: string
          job_posting_id: string | null
          offer_letter_url: string | null
          position_title: string
          rejected_at: string | null
          salary: number
          sent_at: string | null
          start_date: string
          status: string | null
          terms_and_conditions: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          application_id: string
          benefits?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          employment_type: string
          expiry_date?: string | null
          id?: string
          job_posting_id?: string | null
          offer_letter_url?: string | null
          position_title: string
          rejected_at?: string | null
          salary: number
          sent_at?: string | null
          start_date: string
          status?: string | null
          terms_and_conditions?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          application_id?: string
          benefits?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          employment_type?: string
          expiry_date?: string | null
          id?: string
          job_posting_id?: string | null
          offer_letter_url?: string | null
          position_title?: string
          rejected_at?: string | null
          salary?: number
          sent_at?: string | null
          start_date?: string
          status?: string | null
          terms_and_conditions?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_letters_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offer_letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "offer_letters_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      office_locations: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          radius_meters: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          radius_meters?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklists: {
        Row: {
          checklist_items: Json
          company_id: string | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          created_by: string | null
          employee_id: string | null
          employer_employee_id: string | null
          id: string
          notes: string | null
          started_at: string | null
          status: string | null
          target_completion_date: string | null
          updated_at: string | null
        }
        Insert: {
          checklist_items?: Json
          company_id?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          employer_employee_id?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Update: {
          checklist_items?: Json
          company_id?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          employer_employee_id?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onboarding_checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "onboarding_checklists_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onboarding_checklists_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "onboarding_checklists_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          attachments: Json | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          due_date: string | null
          id: string
          is_mandatory: boolean | null
          notes: string | null
          onboarding_checklist_id: string
          status: string | null
          task_category: string | null
          task_description: string | null
          task_name: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          onboarding_checklist_id: string
          status?: string | null
          task_category?: string | null
          task_description?: string | null
          task_name: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          onboarding_checklist_id?: string
          status?: string | null
          task_category?: string | null
          task_description?: string | null
          task_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "onboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "onboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "onboarding_tasks_onboarding_checklist_id_fkey"
            columns: ["onboarding_checklist_id"]
            isOneToOne: false
            referencedRelation: "onboarding_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          active_contracts: number | null
          address_en: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          cr_expiry: string | null
          cr_status: string | null
          created_at: string | null
          crn: string | null
          designation_id: string | null
          id: string
          license_expiry: string | null
          license_number: string | null
          license_status: string | null
          logo_url: string | null
          name_ar: string | null
          name_en: string
          notes: string | null
          overall_status: string | null
          role: string | null
          signatory_name_ar: string | null
          signatory_name_en: string | null
          status: string | null
          tax_number: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          active_contracts?: number | null
          address_en?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cr_expiry?: string | null
          cr_status?: string | null
          created_at?: string | null
          crn?: string | null
          designation_id?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          license_status?: string | null
          logo_url?: string | null
          name_ar?: string | null
          name_en: string
          notes?: string | null
          overall_status?: string | null
          role?: string | null
          signatory_name_ar?: string | null
          signatory_name_en?: string | null
          status?: string | null
          tax_number?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          active_contracts?: number | null
          address_en?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cr_expiry?: string | null
          cr_status?: string | null
          created_at?: string | null
          crn?: string | null
          designation_id?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          license_status?: string | null
          logo_url?: string | null
          name_ar?: string | null
          name_en?: string
          notes?: string | null
          overall_status?: string | null
          role?: string | null
          signatory_name_ar?: string | null
          signatory_name_en?: string | null
          status?: string | null
          tax_number?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_designation_id_fkey"
            columns: ["designation_id"]
            isOneToOne: false
            referencedRelation: "designations"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          client_id: string
          created_at: string | null
          currency: string
          gateway_response: Json | null
          id: string
          invoice_id: string
          payment_intent_id: string | null
          payment_method: string | null
          processed_at: string | null
          provider_id: string
          provider_ref: string | null
          received_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          client_id: string
          created_at?: string | null
          currency?: string
          gateway_response?: Json | null
          id?: string
          invoice_id: string
          payment_intent_id?: string | null
          payment_method?: string | null
          processed_at?: string | null
          provider_id: string
          provider_ref?: string | null
          received_at?: string | null
          status: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          client_id?: string
          created_at?: string | null
          currency?: string
          gateway_response?: Json | null
          id?: string
          invoice_id?: string
          payment_intent_id?: string | null
          payment_method?: string | null
          processed_at?: string | null
          provider_id?: string
          provider_ref?: string | null
          received_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          absent_days: number | null
          allowances: number | null
          basic_salary: number
          bonus: number | null
          created_at: string | null
          deductions: number | null
          employer_employee_id: string
          gross_salary: number | null
          id: string
          leave_days: number | null
          metadata: Json | null
          net_salary: number | null
          notes: string | null
          overtime_days: number | null
          overtime_hours: number | null
          overtime_pay: number | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          payroll_run_id: string
          payslip_generated_at: string | null
          payslip_url: string | null
          present_days: number | null
          salary_structure_id: string | null
          updated_at: string | null
          working_days: number | null
        }
        Insert: {
          absent_days?: number | null
          allowances?: number | null
          basic_salary?: number
          bonus?: number | null
          created_at?: string | null
          deductions?: number | null
          employer_employee_id: string
          gross_salary?: number | null
          id?: string
          leave_days?: number | null
          metadata?: Json | null
          net_salary?: number | null
          notes?: string | null
          overtime_days?: number | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          payroll_run_id: string
          payslip_generated_at?: string | null
          payslip_url?: string | null
          present_days?: number | null
          salary_structure_id?: string | null
          updated_at?: string | null
          working_days?: number | null
        }
        Update: {
          absent_days?: number | null
          allowances?: number | null
          basic_salary?: number
          bonus?: number | null
          created_at?: string | null
          deductions?: number | null
          employer_employee_id?: string
          gross_salary?: number | null
          id?: string
          leave_days?: number | null
          metadata?: Json | null
          net_salary?: number | null
          notes?: string | null
          overtime_days?: number | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          payroll_run_id?: string
          payslip_generated_at?: string | null
          payslip_url?: string | null
          present_days?: number | null
          salary_structure_id?: string | null
          updated_at?: string | null
          working_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_salary_structure_id_fkey"
            columns: ["salary_structure_id"]
            isOneToOne: false
            referencedRelation: "salary_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          payment_date: string | null
          payroll_month: string
          payroll_period: string | null
          processed_at: string | null
          processed_by: string | null
          status: string | null
          total_allowances: number | null
          total_amount: number | null
          total_basic_salary: number | null
          total_bonus: number | null
          total_deductions: number | null
          total_employees: number | null
          total_overtime: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_date?: string | null
          payroll_month: string
          payroll_period?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          total_allowances?: number | null
          total_amount?: number | null
          total_basic_salary?: number | null
          total_bonus?: number | null
          total_deductions?: number | null
          total_employees?: number | null
          total_overtime?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_date?: string | null
          payroll_month?: string
          payroll_period?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          total_allowances?: number | null
          total_amount?: number | null
          total_basic_salary?: number | null
          total_bonus?: number | null
          total_deductions?: number | null
          total_employees?: number | null
          total_overtime?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "payroll_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payroll_runs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          booking_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "performance_metrics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          resource: string
          scope: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          resource: string
          scope: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          resource?: string
          scope?: string
        }
        Relationships: []
      }
      phase_milestones: {
        Row: {
          created_at: string | null
          id: string
          milestone_id: string
          order_index: number | null
          phase_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          milestone_id: string
          order_index?: number | null
          phase_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          milestone_id?: string
          order_index?: number | null
          phase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_milestones_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_ar: string | null
          category_en: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          metadata: Json | null
          name_ar: string | null
          name_en: string
          price: number | null
          specifications: Json | null
          status: string | null
          type: string | null
          unit_ar: string | null
          unit_en: string | null
          updated_at: string | null
        }
        Insert: {
          category_ar?: string | null
          category_en?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          metadata?: Json | null
          name_ar?: string | null
          name_en: string
          price?: number | null
          specifications?: Json | null
          status?: string | null
          type?: string | null
          unit_ar?: string | null
          unit_en?: string | null
          updated_at?: string | null
        }
        Update: {
          category_ar?: string | null
          category_en?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          metadata?: Json | null
          name_ar?: string | null
          name_en?: string
          price?: number | null
          specifications?: Json | null
          status?: string | null
          type?: string | null
          unit_ar?: string | null
          unit_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_creation_webhooks: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          full_name: string | null
          id: string
          phone: string | null
          processed_at: string | null
          status: string | null
          user_email: string | null
          user_id: string
          user_role: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          processed_at?: string | null
          status?: string | null
          user_email?: string | null
          user_id: string
          user_role?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          processed_at?: string | null
          status?: string | null
          user_email?: string | null
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_company_id: string | null
          admin_notes: string | null
          availability_status: string | null
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          company: string | null
          company_id: string | null
          company_name: string | null
          country: string | null
          cr_number: string | null
          created_at: string | null
          email: string
          experience_years: number | null
          facebook: string | null
          first_name: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          languages: string[] | null
          last_active: string | null
          last_name: string | null
          linkedin: string | null
          location: string | null
          logo_url: string | null
          must_change_password: boolean | null
          phone: string | null
          portfolio_links: string | null
          preferred_contact_method: string | null
          preferred_currency:
            | Database["public"]["Enums"]["currency_code"]
            | null
          professional_title: string | null
          profile_completed: boolean | null
          profile_image_url: string | null
          rating: number | null
          response_time: string | null
          role: string | null
          services: string | null
          social_links: Json | null
          specialization: string[] | null
          status: string | null
          timezone: string | null
          twitter: string | null
          updated_at: string | null
          vat_number: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          website: string | null
          website_url: string | null
        }
        Insert: {
          active_company_id?: string | null
          admin_notes?: string | null
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          company?: string | null
          company_id?: string | null
          company_name?: string | null
          country?: string | null
          cr_number?: string | null
          created_at?: string | null
          email: string
          experience_years?: number | null
          facebook?: string | null
          first_name?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id: string
          instagram?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_active?: string | null
          last_name?: string | null
          linkedin?: string | null
          location?: string | null
          logo_url?: string | null
          must_change_password?: boolean | null
          phone?: string | null
          portfolio_links?: string | null
          preferred_contact_method?: string | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          professional_title?: string | null
          profile_completed?: boolean | null
          profile_image_url?: string | null
          rating?: number | null
          response_time?: string | null
          role?: string | null
          services?: string | null
          social_links?: Json | null
          specialization?: string[] | null
          status?: string | null
          timezone?: string | null
          twitter?: string | null
          updated_at?: string | null
          vat_number?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          website_url?: string | null
        }
        Update: {
          active_company_id?: string | null
          admin_notes?: string | null
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          company?: string | null
          company_id?: string | null
          company_name?: string | null
          country?: string | null
          cr_number?: string | null
          created_at?: string | null
          email?: string
          experience_years?: number | null
          facebook?: string | null
          first_name?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_active?: string | null
          last_name?: string | null
          linkedin?: string | null
          location?: string | null
          logo_url?: string | null
          must_change_password?: boolean | null
          phone?: string | null
          portfolio_links?: string | null
          preferred_contact_method?: string | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          professional_title?: string | null
          profile_completed?: boolean | null
          profile_image_url?: string | null
          rating?: number | null
          response_time?: string | null
          role?: string | null
          services?: string | null
          social_links?: Json | null
          specialization?: string[] | null
          status?: string | null
          timezone?: string | null
          twitter?: string | null
          updated_at?: string | null
          vat_number?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_company_id_fkey"
            columns: ["active_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_active_company_id_fkey"
            columns: ["active_company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_logs: {
        Row: {
          action: string
          booking_id: string
          created_at: string | null
          id: string
          milestone_id: string | null
          new_value: string | null
          old_value: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          booking_id: string
          created_at?: string | null
          id?: string
          milestone_id?: string | null
          new_value?: string | null
          old_value?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          booking_id?: string
          created_at?: string | null
          id?: string
          milestone_id?: string | null
          new_value?: string | null
          old_value?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_logs_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks_status"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          booking_id: string
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          priority: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          booking_id: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          booking_id?: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "progress_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      progress_templates: {
        Row: {
          category: string | null
          created_at: string | null
          default_steps: Json | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_steps?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_steps?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_phases: {
        Row: {
          booking_id: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          order_index: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          order_index?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          order_index?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "project_phases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      project_timeline: {
        Row: {
          assigned_to: string | null
          booking_id: string
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          order_index: number
          priority: string
          progress_percentage: number
          start_date: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          booking_id: string
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          order_index?: number
          priority?: string
          progress_percentage?: number
          start_date: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          order_index?: number
          priority?: string
          progress_percentage?: number
          start_date?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "project_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      promoter_attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          promoter_id: string | null
          status: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          promoter_id?: string | null
          status?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          promoter_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      promoter_availability: {
        Row: {
          day_of_week: string
          end_time: string
          id: number
          is_available: boolean | null
          notes: string | null
          promoter_id: number
          start_time: string
        }
        Insert: {
          day_of_week: string
          end_time: string
          id?: number
          is_available?: boolean | null
          notes?: string | null
          promoter_id: number
          start_time: string
        }
        Update: {
          day_of_week?: string
          end_time?: string
          id?: number
          is_available?: boolean | null
          notes?: string | null
          promoter_id?: number
          start_time?: string
        }
        Relationships: []
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
        Relationships: []
      }
      promoter_communications: {
        Row: {
          communication_time: string | null
          created_at: string | null
          id: string
          message: string
          promoter_id: string | null
          read_at: string | null
          subject: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          communication_time?: string | null
          created_at?: string | null
          id?: string
          message: string
          promoter_id?: string | null
          read_at?: string | null
          subject?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          communication_time?: string | null
          created_at?: string | null
          id?: string
          message?: string
          promoter_id?: string | null
          read_at?: string | null
          subject?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      promoter_documents: {
        Row: {
          created_at: string | null
          document_type: string
          expires_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: number
          is_verified: boolean | null
          mime_type: string
          notes: string | null
          promoter_id: number
          updated_at: string | null
          uploaded_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: number
          is_verified?: boolean | null
          mime_type: string
          notes?: string | null
          promoter_id: number
          updated_at?: string | null
          uploaded_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: number
          is_verified?: boolean | null
          mime_type?: string
          notes?: string | null
          promoter_id?: number
          updated_at?: string | null
          uploaded_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      promoter_education: {
        Row: {
          created_at: string | null
          degree: string
          description: string | null
          end_date: string | null
          field_of_study: string
          gpa: number | null
          honors: string | null
          id: number
          institution_name: string
          is_current: boolean | null
          location: string | null
          promoter_id: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          degree: string
          description?: string | null
          end_date?: string | null
          field_of_study: string
          gpa?: number | null
          honors?: string | null
          id?: number
          institution_name: string
          is_current?: boolean | null
          location?: string | null
          promoter_id: number
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          degree?: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string
          gpa?: number | null
          honors?: string | null
          id?: number
          institution_name?: string
          is_current?: boolean | null
          location?: string | null
          promoter_id?: number
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      promoter_experience: {
        Row: {
          achievements: string[] | null
          company_name: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: number
          industry: string | null
          is_current: boolean | null
          job_title: string
          location: string | null
          promoter_id: number
          skills_used: string[] | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          achievements?: string[] | null
          company_name: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          industry?: string | null
          is_current?: boolean | null
          job_title: string
          location?: string | null
          promoter_id: number
          skills_used?: string[] | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          achievements?: string[] | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          industry?: string | null
          is_current?: boolean | null
          job_title?: string
          location?: string | null
          promoter_id?: number
          skills_used?: string[] | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      promoter_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          feedback_type: string
          id: string
          promoter_id: string | null
          rating: number | null
          reviewer_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          feedback_type: string
          id?: string
          promoter_id?: string | null
          rating?: number | null
          reviewer_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string
          id?: string
          promoter_id?: string | null
          rating?: number | null
          reviewer_id?: string | null
        }
        Relationships: []
      }
      promoter_leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          end_date: string
          id: string
          leave_type: string
          promoter_id: string | null
          reason: string | null
          start_date: string
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          leave_type: string
          promoter_id?: string | null
          reason?: string | null
          start_date: string
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          promoter_id?: string | null
          reason?: string | null
          start_date?: string
          status?: string | null
        }
        Relationships: []
      }
      promoter_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          note_content: string
          note_title: string
          note_type: string | null
          promoter_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_content: string
          note_title: string
          note_type?: string | null
          promoter_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_content?: string
          note_title?: string
          note_type?: string | null
          promoter_id?: string | null
        }
        Relationships: []
      }
      promoter_notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_type: string | null
          document_url: string | null
          failed_reason: string | null
          id: string
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["notification_priority"]
          promoter_id: string
          read_at: string | null
          retry_count: number | null
          send_email: boolean | null
          send_in_app: boolean | null
          send_sms: boolean | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          document_url?: string | null
          failed_reason?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          promoter_id: string
          read_at?: string | null
          retry_count?: number | null
          send_email?: boolean | null
          send_in_app?: boolean | null
          send_sms?: boolean | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          document_url?: string | null
          failed_reason?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          promoter_id?: string
          read_at?: string | null
          retry_count?: number | null
          send_email?: boolean | null
          send_in_app?: boolean | null
          send_sms?: boolean | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_notifications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_notifications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_notifications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_performance: {
        Row: {
          average_rating: number | null
          contracts_cancelled: number | null
          contracts_completed: number | null
          customer_satisfaction_score: number | null
          id: number
          metric_date: string
          notes: string | null
          on_time_delivery_rate: number | null
          promoter_id: number
          total_earnings: number | null
        }
        Insert: {
          average_rating?: number | null
          contracts_cancelled?: number | null
          contracts_completed?: number | null
          customer_satisfaction_score?: number | null
          id?: number
          metric_date: string
          notes?: string | null
          on_time_delivery_rate?: number | null
          promoter_id: number
          total_earnings?: number | null
        }
        Update: {
          average_rating?: number | null
          contracts_cancelled?: number | null
          contracts_completed?: number | null
          customer_satisfaction_score?: number | null
          id?: number
          metric_date?: string
          notes?: string | null
          on_time_delivery_rate?: number | null
          promoter_id?: number
          total_earnings?: number | null
        }
        Relationships: []
      }
      promoter_performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          period_end: string | null
          period_start: string | null
          promoter_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          period_end?: string | null
          period_start?: string | null
          promoter_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          period_end?: string | null
          period_start?: string | null
          promoter_id?: string | null
        }
        Relationships: []
      }
      promoter_references: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: number
          is_verified: boolean | null
          phone: string | null
          promoter_id: number
          reference_name: string
          reference_text: string | null
          reference_title: string | null
          relationship: string | null
          verified_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          is_verified?: boolean | null
          phone?: string | null
          promoter_id: number
          reference_name: string
          reference_text?: string | null
          reference_title?: string | null
          relationship?: string | null
          verified_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          is_verified?: boolean | null
          phone?: string | null
          promoter_id?: number
          reference_name?: string
          reference_text?: string | null
          reference_title?: string | null
          relationship?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      promoter_reports: {
        Row: {
          created_at: string | null
          generated_at: string | null
          id: string
          promoter_id: string | null
          report_content: string | null
          report_title: string
          report_type: string
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          promoter_id?: string | null
          report_content?: string | null
          report_title: string
          report_type: string
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          promoter_id?: string | null
          report_content?: string | null
          report_title?: string
          report_type?: string
        }
        Relationships: []
      }
      promoter_scores: {
        Row: {
          created_at: string | null
          id: string
          max_score: number | null
          notes: string | null
          period_end: string | null
          period_start: string | null
          promoter_id: string | null
          score_type: string
          score_value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_score?: number | null
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          promoter_id?: string | null
          score_type: string
          score_value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          max_score?: number | null
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          promoter_id?: string | null
          score_type?: string
          score_value?: number
        }
        Relationships: []
      }
      promoter_skills: {
        Row: {
          certification: string | null
          created_at: string | null
          id: number
          proficiency: string
          promoter_id: number
          skill_name: string
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          years_of_experience: number | null
        }
        Insert: {
          certification?: string | null
          created_at?: string | null
          id?: number
          proficiency?: string
          promoter_id: number
          skill_name: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          years_of_experience?: number | null
        }
        Update: {
          certification?: string | null
          created_at?: string | null
          id?: number
          proficiency?: string
          promoter_id?: number
          skill_name?: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      promoter_suggestions: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          confidence_score: number | null
          contract_id: string
          created_at: string | null
          id: string
          is_applied: boolean | null
          suggested_promoter_id: string
          suggestion_reason: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          confidence_score?: number | null
          contract_id: string
          created_at?: string | null
          id?: string
          is_applied?: boolean | null
          suggested_promoter_id: string
          suggestion_reason?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          confidence_score?: number | null
          contract_id?: string
          created_at?: string | null
          id?: string
          is_applied?: boolean | null
          suggested_promoter_id?: string
          suggestion_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_suggestions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_suggestions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_suggestions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_suggestions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_suggestions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_suggestions_suggested_promoter_id_fkey"
            columns: ["suggested_promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_suggestions_suggested_promoter_id_fkey"
            columns: ["suggested_promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_suggestions_suggested_promoter_id_fkey"
            columns: ["suggested_promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_tags: {
        Row: {
          created_at: string | null
          id: string
          promoter_id: string | null
          tag: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          promoter_id?: string | null
          tag: string
        }
        Update: {
          created_at?: string | null
          id?: string
          promoter_id?: string | null
          tag?: string
        }
        Relationships: []
      }
      promoter_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          priority: string | null
          promoter_id: string
          status: string | null
          task_description: string | null
          task_title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          promoter_id?: string
          status?: string | null
          task_description?: string | null
          task_title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          promoter_id?: string
          status?: string | null
          task_description?: string | null
          task_title?: string
        }
        Relationships: []
      }
      promoters: {
        Row: {
          account_number: string | null
          address: string | null
          availability: string | null
          bank_name: string | null
          certifications: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          department: string | null
          education_level: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          employer_id: string | null
          experience_years: number | null
          first_name: string | null
          gender: string | null
          graduation_year: number | null
          iban: string | null
          id: string
          id_card_expiry_date: string | null
          id_card_number: string | null
          id_card_url: string | null
          job_title: string | null
          last_name: string | null
          marital_status: string | null
          mobile_number: string | null
          name_ar: string | null
          name_en: string | null
          nationality: string | null
          notes: string | null
          notify_days_before_id_expiry: number | null
          notify_days_before_passport_expiry: number | null
          original_email: string | null
          overall_status: string | null
          passport_expiry_date: string | null
          passport_number: string | null
          passport_url: string | null
          phone: string | null
          postal_code: string | null
          preferred_language: string | null
          profile_picture_url: string | null
          rating: number | null
          skills: string | null
          special_requirements: string | null
          specialization: string | null
          state: string | null
          status: string | null
          status_enum: Database["public"]["Enums"]["promoter_status_enum"]
          swift_code: string | null
          tax_id: string | null
          timezone: string | null
          university: string | null
          updated_at: string | null
          visa_expiry_date: string | null
          visa_number: string | null
          work_permit_expiry_date: string | null
          work_permit_number: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          availability?: string | null
          bank_name?: string | null
          certifications?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          education_level?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employer_id?: string | null
          experience_years?: number | null
          first_name?: string | null
          gender?: string | null
          graduation_year?: number | null
          iban?: string | null
          id?: string
          id_card_expiry_date?: string | null
          id_card_number?: string | null
          id_card_url?: string | null
          job_title?: string | null
          last_name?: string | null
          marital_status?: string | null
          mobile_number?: string | null
          name_ar?: string | null
          name_en?: string | null
          nationality?: string | null
          notes?: string | null
          notify_days_before_id_expiry?: number | null
          notify_days_before_passport_expiry?: number | null
          original_email?: string | null
          overall_status?: string | null
          passport_expiry_date?: string | null
          passport_number?: string | null
          passport_url?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          profile_picture_url?: string | null
          rating?: number | null
          skills?: string | null
          special_requirements?: string | null
          specialization?: string | null
          state?: string | null
          status?: string | null
          status_enum?: Database["public"]["Enums"]["promoter_status_enum"]
          swift_code?: string | null
          tax_id?: string | null
          timezone?: string | null
          university?: string | null
          updated_at?: string | null
          visa_expiry_date?: string | null
          visa_number?: string | null
          work_permit_expiry_date?: string | null
          work_permit_number?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          availability?: string | null
          bank_name?: string | null
          certifications?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          education_level?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employer_id?: string | null
          experience_years?: number | null
          first_name?: string | null
          gender?: string | null
          graduation_year?: number | null
          iban?: string | null
          id?: string
          id_card_expiry_date?: string | null
          id_card_number?: string | null
          id_card_url?: string | null
          job_title?: string | null
          last_name?: string | null
          marital_status?: string | null
          mobile_number?: string | null
          name_ar?: string | null
          name_en?: string | null
          nationality?: string | null
          notes?: string | null
          notify_days_before_id_expiry?: number | null
          notify_days_before_passport_expiry?: number | null
          original_email?: string | null
          overall_status?: string | null
          passport_expiry_date?: string | null
          passport_number?: string | null
          passport_url?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          profile_picture_url?: string | null
          rating?: number | null
          skills?: string | null
          special_requirements?: string | null
          specialization?: string | null
          state?: string | null
          status?: string | null
          status_enum?: Database["public"]["Enums"]["promoter_status_enum"]
          swift_code?: string | null
          tax_id?: string | null
          timezone?: string | null
          university?: string | null
          updated_at?: string | null
          visa_expiry_date?: string | null
          visa_number?: string | null
          work_permit_expiry_date?: string | null
          work_permit_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoters_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters_status_backup: {
        Row: {
          backup_date: string | null
          id: string | null
          status: string | null
        }
        Insert: {
          backup_date?: string | null
          id?: string | null
          status?: string | null
        }
        Update: {
          backup_date?: string | null
          id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      provider_replies: {
        Row: {
          client_email: string
          created_at: string | null
          id: string
          message: string
          submission_id: string | null
          timestamp: string
        }
        Insert: {
          client_email: string
          created_at?: string | null
          id?: string
          message: string
          submission_id?: string | null
          timestamp: string
        }
        Update: {
          client_email?: string
          created_at?: string | null
          id?: string
          message?: string
          submission_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_replies_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_services: {
        Row: {
          category: string | null
          company_id: string
          created_at: string | null
          created_by: string
          delivery_time: string | null
          description: string | null
          featured: boolean | null
          id: string
          lower_slug: string | null
          name: string
          price: number | null
          price_base: number
          price_currency: string
          provider_id: string
          service_type: string | null
          slug: string
          status: Database["public"]["Enums"]["service_status"]
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          delivery_time?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          lower_slug?: string | null
          name: string
          price?: number | null
          price_base?: number
          price_currency?: string
          provider_id: string
          service_type?: string | null
          slug: string
          status?: Database["public"]["Enums"]["service_status"]
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          delivery_time?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          lower_slug?: string | null
          name?: string
          price?: number | null
          price_base?: number
          price_currency?: string
          provider_id?: string
          service_type?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["service_status"]
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_logs: {
        Row: {
          blocked: boolean
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          ip_address: unknown
          requests_count: number
          user_agent: string | null
          window_end: string
          window_start: string
        }
        Insert: {
          blocked?: boolean
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          ip_address?: unknown
          requests_count: number
          user_agent?: string | null
          window_end: string
          window_start: string
        }
        Update: {
          blocked?: boolean
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          ip_address?: unknown
          requests_count?: number
          user_agent?: string | null
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          description: string | null
          file_url: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          metrics: Json | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metrics?: Json | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metrics?: Json | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      requirements_master: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          requirement: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          requirement: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          requirement?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirements_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          provider_id: string
          rating: number | null
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          provider_id: string
          rating?: number | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          provider_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "rbac_user_role_assignments"
            referencedColumns: ["role_id"]
          },
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
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      roles_new: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_system: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_system?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_system?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roles_v2: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_system: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_system?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_system?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      salary_history: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_amount: number | null
          change_percentage: number | null
          change_type: string
          created_at: string | null
          effective_date: string
          employer_employee_id: string
          id: string
          new_salary: number | null
          notes: string | null
          previous_salary: number | null
          reason: string | null
          salary_structure_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_amount?: number | null
          change_percentage?: number | null
          change_type: string
          created_at?: string | null
          effective_date: string
          employer_employee_id: string
          id?: string
          new_salary?: number | null
          notes?: string | null
          previous_salary?: number | null
          reason?: string | null
          salary_structure_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_amount?: number | null
          change_percentage?: number | null
          change_type?: string
          created_at?: string | null
          effective_date?: string
          employer_employee_id?: string
          id?: string
          new_salary?: number | null
          notes?: string | null
          previous_salary?: number | null
          reason?: string | null
          salary_structure_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "salary_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "salary_history_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_history_salary_structure_id_fkey"
            columns: ["salary_structure_id"]
            isOneToOne: false
            referencedRelation: "salary_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_structures: {
        Row: {
          allowances: Json | null
          basic_salary: number
          bonus_structure: Json | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deductions: Json | null
          effective_from: string
          effective_to: string | null
          employer_employee_id: string
          id: string
          notes: string | null
          overtime_rate: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          allowances?: Json | null
          basic_salary: number
          bonus_structure?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deductions?: Json | null
          effective_from: string
          effective_to?: string | null
          employer_employee_id: string
          id?: string
          notes?: string | null
          overtime_rate?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          allowances?: Json | null
          basic_salary?: number
          bonus_structure?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deductions?: Json | null
          effective_from?: string
          effective_to?: string | null
          employer_employee_id?: string
          id?: string
          notes?: string | null
          overtime_rate?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_structures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_structures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_structures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_structures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "salary_structures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "salary_structures_employer_employee_id_fkey"
            columns: ["employer_employee_id"]
            isOneToOne: false
            referencedRelation: "employer_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_alerts: {
        Row: {
          alert_type: string
          contract_id: string
          created_at: string | null
          id: string
          is_sent: boolean | null
          notification_data: Json | null
          sent_at: string | null
          trigger_date: string
        }
        Insert: {
          alert_type: string
          contract_id: string
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          notification_data?: Json | null
          sent_at?: string | null
          trigger_date: string
        }
        Update: {
          alert_type?: string
          contract_id?: string
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          notification_data?: Json | null
          sent_at?: string | null
          trigger_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_alerts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_alerts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_alerts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_alerts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_alerts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_attendance_links: {
        Row: {
          attendance_link_id: string
          created_at: string | null
          generated_at: string | null
          id: string
          link_type: string
          notifications_sent_count: number | null
          schedule_id: string
          scheduled_date: string
          scheduled_time: string
          sent_at: string | null
        }
        Insert: {
          attendance_link_id: string
          created_at?: string | null
          generated_at?: string | null
          id?: string
          link_type: string
          notifications_sent_count?: number | null
          schedule_id: string
          scheduled_date: string
          scheduled_time: string
          sent_at?: string | null
        }
        Update: {
          attendance_link_id?: string
          created_at?: string | null
          generated_at?: string | null
          id?: string
          link_type?: string
          notifications_sent_count?: number | null
          schedule_id?: string
          scheduled_date?: string
          scheduled_time?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_attendance_links_attendance_link_id_fkey"
            columns: ["attendance_link_id"]
            isOneToOne: false
            referencedRelation: "attendance_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_attendance_links_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "attendance_link_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          method: string | null
          path: string | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string | null
          path?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string | null
          path?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_audit_logs: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string
          event: string | null
          id: string
          metadata: Json | null
          service_id: string
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          event?: string | null
          id?: string
          metadata?: Json | null
          service_id: string
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          event?: string | null
          id?: string
          metadata?: Json | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_audit_logs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_audit_logs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_audit_logs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_audit_logs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_milestone_templates: {
        Row: {
          created_at: string | null
          default_order: number | null
          default_weight: number | null
          description: string | null
          id: string
          is_required: boolean | null
          service_type_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_order?: number | null
          default_weight?: number | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          service_type_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_order?: number | null
          default_weight?: number | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          service_type_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_milestone_templates_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_milestones: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          is_required: boolean | null
          milestone_title: string
          order_index: number | null
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_required?: boolean | null
          milestone_title: string
          order_index?: number | null
          service_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_required?: boolean | null
          milestone_title?: string
          order_index?: number | null
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_milestones_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_milestones_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_milestones_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_milestones_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      service_packages: {
        Row: {
          created_at: string | null
          delivery_days: number
          description: string | null
          features: string[] | null
          id: string
          is_popular: boolean | null
          is_premium: boolean | null
          name: string
          price: number
          revisions: number
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_days: number
          description?: string | null
          features?: string[] | null
          id?: string
          is_popular?: boolean | null
          is_premium?: boolean | null
          name: string
          price: number
          revisions?: number
          service_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_days?: number
          description?: string | null
          features?: string[] | null
          id?: string
          is_popular?: boolean | null
          is_premium?: boolean | null
          name?: string
          price?: number
          revisions?: number
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      service_requirements: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          order_index: number | null
          requirement: string
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          requirement: string
          service_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          requirement?: string
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requirements_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requirements_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requirements_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requirements_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      service_resource_map: {
        Row: {
          created_at: string | null
          resource_id: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          resource_id: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          resource_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_resource_map_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: true
            referencedRelation: "booking_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_resource_map_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "provider_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_suggestions: {
        Row: {
          client_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          original_booking_id: string | null
          priority: string | null
          provider_id: string
          responded_at: string | null
          status: string | null
          suggested_service_id: string
          suggestion_reason: string | null
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          original_booking_id?: string | null
          priority?: string | null
          provider_id: string
          responded_at?: string | null
          status?: string | null
          suggested_service_id: string
          suggestion_reason?: string | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          original_booking_id?: string | null
          priority?: string | null
          provider_id?: string
          responded_at?: string | null
          status?: string | null
          suggested_service_id?: string
          suggestion_reason?: string | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_suggestions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_suggestions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "service_suggestions_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "service_suggestions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_suggestions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "service_suggestions_suggested_service_id_fkey"
            columns: ["suggested_service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_suggested_service_id_fkey"
            columns: ["suggested_service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_suggested_service_id_fkey"
            columns: ["suggested_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suggestions_suggested_service_id_fkey"
            columns: ["suggested_service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      service_titles: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_titles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          approval_status: string | null
          availability_schedule: Json | null
          base_price: number | null
          bookings_count: number | null
          cancellation_policy: string | null
          category: string | null
          company_id: string | null
          cover_image_url: string | null
          created_at: string
          currency: string | null
          deliverables: string[] | null
          delivery_timeframe: string | null
          description: string | null
          duration: string | null
          estimated_duration: string | null
          featured: boolean
          featured_until: string | null
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          location_preferences: string[] | null
          max_advance_booking: string | null
          minimum_notice: string | null
          portfolio_samples: string[] | null
          price: number | null
          pricing_model: string | null
          provider_id: string
          rating: number | null
          rejection_reason: string | null
          requirements: string | null
          revision_policy: string | null
          service_type: string | null
          status: string
          tags: string[] | null
          terms_conditions: string | null
          title: string | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          approval_status?: string | null
          availability_schedule?: Json | null
          base_price?: number | null
          bookings_count?: number | null
          cancellation_policy?: string | null
          category?: string | null
          company_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          deliverables?: string[] | null
          delivery_timeframe?: string | null
          description?: string | null
          duration?: string | null
          estimated_duration?: string | null
          featured?: boolean
          featured_until?: string | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          location_preferences?: string[] | null
          max_advance_booking?: string | null
          minimum_notice?: string | null
          portfolio_samples?: string[] | null
          price?: number | null
          pricing_model?: string | null
          provider_id: string
          rating?: number | null
          rejection_reason?: string | null
          requirements?: string | null
          revision_policy?: string | null
          service_type?: string | null
          status?: string
          tags?: string[] | null
          terms_conditions?: string | null
          title?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          approval_status?: string | null
          availability_schedule?: Json | null
          base_price?: number | null
          bookings_count?: number | null
          cancellation_policy?: string | null
          category?: string | null
          company_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          deliverables?: string[] | null
          delivery_timeframe?: string | null
          description?: string | null
          duration?: string | null
          estimated_duration?: string | null
          featured?: boolean
          featured_until?: string | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          location_preferences?: string[] | null
          max_advance_booking?: string | null
          minimum_notice?: string | null
          portfolio_samples?: string[] | null
          price?: number | null
          pricing_model?: string | null
          provider_id?: string
          rating?: number | null
          rejection_reason?: string | null
          requirements?: string | null
          revision_policy?: string | null
          service_type?: string | null
          status?: string
          tags?: string[] | null
          terms_conditions?: string | null
          title?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      shared_layout_access: {
        Row: {
          can_edit: boolean | null
          created_at: string | null
          id: string
          layout_id: string
          shared_with_role: string | null
          shared_with_user_id: string | null
        }
        Insert: {
          can_edit?: boolean | null
          created_at?: string | null
          id?: string
          layout_id: string
          shared_with_role?: string | null
          shared_with_user_id?: string | null
        }
        Update: {
          can_edit?: boolean | null
          created_at?: string | null
          id?: string
          layout_id?: string
          shared_with_role?: string | null
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_layout_access_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "dashboard_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_audit_log: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          request_id: string
          signature_id: string | null
          user_agent: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          request_id: string
          signature_id?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          request_id?: string
          signature_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_audit_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "pending_signatures"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "signature_audit_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "signature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_audit_log_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_requests: {
        Row: {
          allow_decline: boolean | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          contract_id: string
          created_at: string | null
          created_by: string | null
          document_url: string | null
          expires_at: string | null
          external_provider: string | null
          external_request_id: string | null
          id: string
          reminder_frequency_days: number | null
          require_all_signers: boolean | null
          send_reminders: boolean | null
          signed_document_url: string | null
          signers: Json
          signing_order: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          allow_decline?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          expires_at?: string | null
          external_provider?: string | null
          external_request_id?: string | null
          id?: string
          reminder_frequency_days?: number | null
          require_all_signers?: boolean | null
          send_reminders?: boolean | null
          signed_document_url?: string | null
          signers: Json
          signing_order?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_decline?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          expires_at?: string | null
          external_provider?: string | null
          external_request_id?: string | null
          id?: string
          reminder_frequency_days?: number | null
          require_all_signers?: boolean | null
          send_reminders?: boolean | null
          signed_document_url?: string | null
          signers?: Json
          signing_order?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_templates: {
        Row: {
          completion_email_template: string | null
          created_at: string | null
          created_by: string | null
          default_signers: Json | null
          description: string | null
          expiry_days: number | null
          id: string
          invitation_email_template: string | null
          is_active: boolean | null
          name: string
          reminder_email_template: string | null
          signing_order: string | null
          updated_at: string | null
        }
        Insert: {
          completion_email_template?: string | null
          created_at?: string | null
          created_by?: string | null
          default_signers?: Json | null
          description?: string | null
          expiry_days?: number | null
          id?: string
          invitation_email_template?: string | null
          is_active?: boolean | null
          name: string
          reminder_email_template?: string | null
          signing_order?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_email_template?: string | null
          created_at?: string | null
          created_by?: string | null
          default_signers?: Json | null
          description?: string | null
          expiry_days?: number | null
          id?: string
          invitation_email_template?: string | null
          is_active?: boolean | null
          name?: string
          reminder_email_template?: string | null
          signing_order?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      signatures: {
        Row: {
          certificate: string | null
          certificate_issuer: string | null
          decline_reason: string | null
          declined_at: string | null
          geolocation: Json | null
          id: string
          ip_address: unknown
          request_id: string
          revocation_reason: string | null
          revoked_at: string | null
          signature_data: string
          signature_type: string | null
          signed_at: string | null
          signed_document_hash: string | null
          signer_email: string
          signer_id: string | null
          signer_name: string
          signer_role: string | null
          signing_order: number | null
          status: string | null
          user_agent: string | null
          verification_hash: string | null
        }
        Insert: {
          certificate?: string | null
          certificate_issuer?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          geolocation?: Json | null
          id?: string
          ip_address?: unknown
          request_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          signature_data: string
          signature_type?: string | null
          signed_at?: string | null
          signed_document_hash?: string | null
          signer_email: string
          signer_id?: string | null
          signer_name: string
          signer_role?: string | null
          signing_order?: number | null
          status?: string | null
          user_agent?: string | null
          verification_hash?: string | null
        }
        Update: {
          certificate?: string | null
          certificate_issuer?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          geolocation?: Json | null
          id?: string
          ip_address?: unknown
          request_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          signature_data?: string
          signature_type?: string | null
          signed_at?: string | null
          signed_document_hash?: string | null
          signer_email?: string
          signer_id?: string | null
          signer_name?: string
          signer_role?: string | null
          signing_order?: number | null
          status?: string | null
          user_agent?: string | null
          verification_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signatures_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "pending_signatures"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "signatures_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "signature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      signed_documents: {
        Row: {
          all_signatures_complete: boolean | null
          audit_trail_url: string | null
          certificate_url: string | null
          contract_id: string
          created_at: string | null
          document_hash: string
          document_url: string
          finalized_at: string | null
          id: string
        }
        Insert: {
          all_signatures_complete?: boolean | null
          audit_trail_url?: string | null
          certificate_url?: string | null
          contract_id: string
          created_at?: string | null
          document_hash: string
          document_url: string
          finalized_at?: string | null
          id?: string
        }
        Update: {
          all_signatures_complete?: boolean | null
          audit_trail_url?: string | null
          certificate_url?: string | null
          contract_id?: string
          created_at?: string | null
          document_hash?: string
          document_url?: string
          finalized_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signed_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      slack_webhooks: {
        Row: {
          booking_id: string | null
          channel_name: string | null
          created_at: string | null
          created_by: string | null
          events: string[] | null
          id: string
          is_enabled: boolean | null
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          booking_id?: string | null
          channel_name?: string | null
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          booking_id?: string | null
          channel_name?: string | null
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "slack_webhooks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      submissions: {
        Row: {
          budget_range: string | null
          business_name: string | null
          business_type: string | null
          client_email: string
          client_name: string | null
          client_replied: boolean | null
          client_replied_at: string | null
          created_at: string | null
          form_id: string | null
          id: string
          initial_message: string | null
          language: string | null
          location: string | null
          message: string | null
          phone: string | null
          preferred_contact: string | null
          preferred_time: string | null
          provider_replied: boolean | null
          provider_replied_at: string | null
          service_type: string | null
          status: string | null
          submission_source: string | null
          timeline: string | null
          timestamp: string
          updated_at: string | null
        }
        Insert: {
          budget_range?: string | null
          business_name?: string | null
          business_type?: string | null
          client_email: string
          client_name?: string | null
          client_replied?: boolean | null
          client_replied_at?: string | null
          created_at?: string | null
          form_id?: string | null
          id?: string
          initial_message?: string | null
          language?: string | null
          location?: string | null
          message?: string | null
          phone?: string | null
          preferred_contact?: string | null
          preferred_time?: string | null
          provider_replied?: boolean | null
          provider_replied_at?: string | null
          service_type?: string | null
          status?: string | null
          submission_source?: string | null
          timeline?: string | null
          timestamp: string
          updated_at?: string | null
        }
        Update: {
          budget_range?: string | null
          business_name?: string | null
          business_type?: string | null
          client_email?: string
          client_name?: string | null
          client_replied?: boolean | null
          client_replied_at?: string | null
          created_at?: string | null
          form_id?: string | null
          id?: string
          initial_message?: string | null
          language?: string | null
          location?: string | null
          message?: string | null
          phone?: string | null
          preferred_contact?: string | null
          preferred_time?: string | null
          provider_replied?: boolean | null
          provider_replied_at?: string | null
          service_type?: string | null
          status?: string | null
          submission_source?: string | null
          timeline?: string | null
          timestamp?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_announcements: {
        Row: {
          created_at: string | null
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          starts_at: string | null
          target_audience: string | null
          target_user_ids: Json | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          starts_at?: string | null
          target_audience?: string | null
          target_user_ids?: Json | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          starts_at?: string | null
          target_audience?: string | null
          target_user_ids?: Json | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          dimension_tags: Json | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          dimension_tags?: Json | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          dimension_tags?: Json | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: []
      }
      target_progress: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          recorded_by: string | null
          recorded_date: string
          recorded_value: number
          target_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          recorded_date: string
          recorded_value: number
          target_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          recorded_date?: string
          recorded_value?: number
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_progress_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_progress_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_progress_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_progress_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "target_progress_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "target_progress_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "employee_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      task_approvals: {
        Row: {
          action: string
          approved_by: string
          created_at: string | null
          feedback: string | null
          id: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          action: string
          approved_by: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          approved_by?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "task_approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks_status"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string | null
          comment_type: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_internal: boolean | null
          metadata: Json | null
          parent_id: string | null
          task_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          comment_type?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          metadata?: Json | null
          parent_id?: string | null
          task_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          comment_type?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          metadata?: Json | null
          parent_id?: string | null
          task_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "task_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks_status"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string
          depends_on_task_id: string
          id: string
          lag_days: number | null
          task_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type: string
          depends_on_task_id: string
          id?: string
          lag_days?: number | null
          task_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          lag_days?: number | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks_status"
            referencedColumns: ["id"]
          },
        ]
      }
      task_files: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          original_name: string
          task_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          original_name: string
          task_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          original_name?: string
          task_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_end_date: string | null
          actual_hours: number | null
          actual_start_date: string | null
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          attachments: Json
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          critical_path: boolean | null
          description: string | null
          due_date: string | null
          editable: boolean | null
          estimated_hours: number | null
          id: string
          is_overdue: boolean | null
          milestone_id: string
          notes: string | null
          order_index: number | null
          overdue_since: string | null
          phase_id: string | null
          priority: string | null
          progress_percentage: number | null
          risk_level: string | null
          start_date: string | null
          status: string
          steps: Json | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          weight: number
        }
        Insert: {
          actual_end_date?: string | null
          actual_hours?: number | null
          actual_start_date?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          attachments?: Json
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          critical_path?: boolean | null
          description?: string | null
          due_date?: string | null
          editable?: boolean | null
          estimated_hours?: number | null
          id?: string
          is_overdue?: boolean | null
          milestone_id: string
          notes?: string | null
          order_index?: number | null
          overdue_since?: string | null
          phase_id?: string | null
          priority?: string | null
          progress_percentage?: number | null
          risk_level?: string | null
          start_date?: string | null
          status?: string
          steps?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          weight?: number
        }
        Update: {
          actual_end_date?: string | null
          actual_hours?: number | null
          actual_start_date?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          attachments?: Json
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          critical_path?: boolean | null
          description?: string | null
          due_date?: string | null
          editable?: boolean | null
          estimated_hours?: number | null
          id?: string
          is_overdue?: boolean | null
          milestone_id?: string
          notes?: string | null
          order_index?: number | null
          overdue_since?: string | null
          phase_id?: string | null
          priority?: string | null
          progress_percentage?: number | null
          risk_level?: string | null
          start_date?: string | null
          status?: string
          steps?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      team_announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          employer_id: string
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          priority: string
          target_departments: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          employer_id: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string
          target_departments?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          employer_id?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string
          target_departments?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "team_announcements_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_announcements_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_announcements_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_announcements_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_announcements_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      time_entries: {
        Row: {
          booking_id: string
          created_at: string | null
          description: string | null
          duration_hours: number
          duration_minutes: number | null
          end_time: string | null
          id: string
          is_active: boolean | null
          logged_at: string | null
          milestone_id: string | null
          start_time: string
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          description?: string | null
          duration_hours: number
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          logged_at?: string | null
          milestone_id?: string | null
          start_time: string
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          logged_at?: string | null
          milestone_id?: string | null
          start_time?: string
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_tasks_status"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline: {
        Row: {
          booking_id: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          order_index: number | null
          priority: string | null
          progress_percentage: number | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          order_index?: number | null
          priority?: string | null
          progress_percentage?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          order_index?: number | null
          priority?: string | null
          progress_percentage?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      tracking_entities: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          name: string
          priority: string | null
          progress_percentage: number | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          name: string
          priority?: string | null
          progress_percentage?: number | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          priority?: string | null
          progress_percentage?: number | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          created_at: string | null
          description: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "tracking_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      trademarks: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          parent_company_id: string | null
          parent_party_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          parent_company_id?: string | null
          parent_party_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          parent_company_id?: string | null
          parent_party_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trademarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trademarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trademarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trademarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trademarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "trademarks_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trademarks_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trademarks_parent_party_id_fkey"
            columns: ["parent_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_email_preferences: {
        Row: {
          created_at: string | null
          delivery_frequency: string | null
          disabled_types: string[] | null
          email_enabled: boolean | null
          id: string
          template_style: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_frequency?: string | null
          disabled_types?: string[] | null
          email_enabled?: boolean | null
          id?: string
          template_style?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_frequency?: string | null
          disabled_types?: string[] | null
          email_enabled?: boolean | null
          id?: string
          template_style?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_mfa: {
        Row: {
          backup_codes: string[]
          created_at: string | null
          disabled_at: string | null
          enabled: boolean
          id: string
          totp_secret: string
          updated_at: string | null
          user_id: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[]
          created_at?: string | null
          disabled_at?: string | null
          enabled?: boolean
          id?: string
          totp_secret: string
          updated_at?: string | null
          user_id: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[]
          created_at?: string | null
          disabled_at?: string | null
          enabled?: boolean
          id?: string
          totp_secret?: string
          updated_at?: string | null
          user_id?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          archived_at: string | null
          booking_updates: boolean | null
          category: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          marketing_emails: boolean | null
          message: string
          metadata: Json | null
          payment_notifications: boolean | null
          priority: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sender_id: string | null
          title: string
          type: string | null
          user_id: string
          weekly_reports: boolean | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          booking_updates?: boolean | null
          category?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          marketing_emails?: boolean | null
          message: string
          metadata?: Json | null
          payment_notifications?: boolean | null
          priority?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          title: string
          type?: string | null
          user_id: string
          weekly_reports?: boolean | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          booking_updates?: boolean | null
          category?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          marketing_emails?: boolean | null
          message?: string
          metadata?: Json | null
          payment_notifications?: boolean | null
          priority?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
          weekly_reports?: boolean | null
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          assigned_by: string | null
          context: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          role_id: string | null
          updated_at: string | null
          user_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          assigned_by?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string | null
          updated_at?: string | null
          user_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          assigned_by?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "rbac_user_role_assignments"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments_backup: {
        Row: {
          assigned_by: string | null
          context: Json | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          role_id: string | null
          updated_at: string | null
          user_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          assigned_by?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          assigned_by?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: number
          role: string | null
          user_id: string | null
        }
        Insert: {
          id?: never
          role?: string | null
          user_id?: string | null
        }
        Update: {
          id?: never
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles_new: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          role_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_new_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_new_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_new_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_new_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_new_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "user_roles_new_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      user_roles_v2: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          role_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_v2_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_v2_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_v2_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_v2_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_v2_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "user_roles_v2_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_v2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_v2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_v2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_v2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_v2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      user_security: {
        Row: {
          created_at: string | null
          id: string
          login_notifications: boolean | null
          password_change_required: boolean | null
          session_timeout: number | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          login_notifications?: boolean | null
          password_change_required?: boolean | null
          session_timeout?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          login_notifications?: boolean | null
          password_change_required?: boolean | null
          session_timeout?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_security_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_security_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_security_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_security_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_security_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean
          last_activity_at: string | null
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity_at?: string | null
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity_at?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          consultationSubmissionId: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          role: string | null
          slack_id: string | null
          status: string | null
        }
        Insert: {
          consultationSubmissionId?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          role?: string | null
          slack_id?: string | null
          status?: string | null
        }
        Update: {
          consultationSubmissionId?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: string | null
          slack_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      webhook_configs: {
        Row: {
          created_at: string | null
          event_types: string[]
          id: string
          is_active: boolean | null
          name: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          event_types: string[]
          id?: string
          is_active?: boolean | null
          name: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          event_types?: string[]
          id?: string
          is_active?: boolean | null
          name?: string
          webhook_url?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          called_at: string
          error_message: string | null
          event_data: Json | null
          event_type: string
          id: string
          status: string
          webhook_url: string
        }
        Insert: {
          called_at: string
          error_message?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          status: string
          webhook_url: string
        }
        Update: {
          called_at?: string
          error_message?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          status?: string
          webhook_url?: string
        }
        Relationships: []
      }
      whatsapp_configs: {
        Row: {
          api_key: string | null
          booking_id: string | null
          created_at: string | null
          created_by: string | null
          events: string[] | null
          id: string
          is_enabled: boolean | null
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          id?: string
          is_enabled?: boolean | null
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          id?: string
          is_enabled?: boolean | null
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "whatsapp_configs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      widget_configurations: {
        Row: {
          created_at: string | null
          id: string
          is_visible: boolean | null
          layout_id: string
          position_data: Json
          refresh_interval: number | null
          updated_at: string | null
          widget_config: Json
          widget_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          layout_id: string
          position_data: Json
          refresh_interval?: number | null
          updated_at?: string | null
          widget_config?: Json
          widget_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          layout_id?: string
          position_data?: Json
          refresh_interval?: number | null
          updated_at?: string | null
          widget_config?: Json
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_configurations_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "dashboard_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      work_permit_applications: {
        Row: {
          application_number: string | null
          application_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          department: string | null
          document_urls: Json | null
          employee_id: string
          employee_name_ar: string | null
          employee_name_en: string
          employer_id: string
          employer_party_id: string | null
          employment_type: string | null
          id: string
          internal_notes: string | null
          job_title: string
          metadata: Json | null
          ministry_approval_date: string | null
          ministry_notes: string | null
          ministry_reference_number: string | null
          ministry_rejection_reason: string | null
          ministry_submission_date: string | null
          national_id: string | null
          nationality: string | null
          passport_number: string | null
          promoter_id: string | null
          rejection_reason: string | null
          required_documents: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary: number | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          submitted_documents: Json | null
          updated_at: string | null
          work_permit_category: string | null
          work_permit_end_date: string | null
          work_permit_number: string | null
          work_permit_start_date: string | null
        }
        Insert: {
          application_number?: string | null
          application_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          document_urls?: Json | null
          employee_id: string
          employee_name_ar?: string | null
          employee_name_en: string
          employer_id: string
          employer_party_id?: string | null
          employment_type?: string | null
          id?: string
          internal_notes?: string | null
          job_title: string
          metadata?: Json | null
          ministry_approval_date?: string | null
          ministry_notes?: string | null
          ministry_reference_number?: string | null
          ministry_rejection_reason?: string | null
          ministry_submission_date?: string | null
          national_id?: string | null
          nationality?: string | null
          passport_number?: string | null
          promoter_id?: string | null
          rejection_reason?: string | null
          required_documents?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary?: number | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          submitted_documents?: Json | null
          updated_at?: string | null
          work_permit_category?: string | null
          work_permit_end_date?: string | null
          work_permit_number?: string | null
          work_permit_start_date?: string | null
        }
        Update: {
          application_number?: string | null
          application_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          document_urls?: Json | null
          employee_id?: string
          employee_name_ar?: string | null
          employee_name_en?: string
          employer_id?: string
          employer_party_id?: string | null
          employment_type?: string | null
          id?: string
          internal_notes?: string | null
          job_title?: string
          metadata?: Json | null
          ministry_approval_date?: string | null
          ministry_notes?: string | null
          ministry_reference_number?: string | null
          ministry_rejection_reason?: string | null
          ministry_submission_date?: string | null
          national_id?: string | null
          nationality?: string | null
          passport_number?: string | null
          promoter_id?: string | null
          rejection_reason?: string | null
          required_documents?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary?: number | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          submitted_documents?: Json | null
          updated_at?: string | null
          work_permit_category?: string | null
          work_permit_end_date?: string | null
          work_permit_number?: string | null
          work_permit_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_permit_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_permit_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "work_permit_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_permit_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "work_permit_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_permit_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "work_permit_applications_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_permit_applications_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "work_permit_applications_employer_party_id_fkey"
            columns: ["employer_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_permit_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "work_permit_applications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_applications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_permit_applications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      work_permit_compliance: {
        Row: {
          alert_level: string | null
          compliance_history: Json | null
          compliance_status: string | null
          created_at: string | null
          days_until_expiry: number | null
          employee_id: string
          employer_id: string
          employer_party_id: string | null
          id: string
          last_alert_sent: string | null
          updated_at: string | null
          work_permit_application_id: string | null
          work_permit_expiry_date: string | null
          work_permit_number: string | null
        }
        Insert: {
          alert_level?: string | null
          compliance_history?: Json | null
          compliance_status?: string | null
          created_at?: string | null
          days_until_expiry?: number | null
          employee_id: string
          employer_id: string
          employer_party_id?: string | null
          id?: string
          last_alert_sent?: string | null
          updated_at?: string | null
          work_permit_application_id?: string | null
          work_permit_expiry_date?: string | null
          work_permit_number?: string | null
        }
        Update: {
          alert_level?: string | null
          compliance_history?: Json | null
          compliance_status?: string | null
          created_at?: string | null
          days_until_expiry?: number | null
          employee_id?: string
          employer_id?: string
          employer_party_id?: string | null
          id?: string
          last_alert_sent?: string | null
          updated_at?: string | null
          work_permit_application_id?: string | null
          work_permit_expiry_date?: string | null
          work_permit_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_permit_compliance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_compliance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_compliance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_compliance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_permit_compliance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "work_permit_compliance_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_compliance_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_compliance_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_compliance_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_permit_compliance_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "work_permit_compliance_employer_party_id_fkey"
            columns: ["employer_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_compliance_work_permit_application_id_fkey"
            columns: ["work_permit_application_id"]
            isOneToOne: false
            referencedRelation: "work_permit_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      work_permit_renewals: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_expiry_date: string
          document_urls: Json | null
          id: string
          notes: string | null
          original_work_permit_number: string
          rejection_reason: string | null
          reminder_sent_14_days: boolean | null
          reminder_sent_30_days: boolean | null
          reminder_sent_60_days: boolean | null
          reminder_sent_7_days: boolean | null
          reminder_sent_90_days: boolean | null
          renewal_approved_date: string | null
          renewal_documents: Json | null
          renewal_end_date: string | null
          renewal_number: string | null
          renewal_start_date: string | null
          renewal_submitted_date: string | null
          renewal_type: string | null
          status: string | null
          updated_at: string | null
          work_permit_application_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_expiry_date: string
          document_urls?: Json | null
          id?: string
          notes?: string | null
          original_work_permit_number: string
          rejection_reason?: string | null
          reminder_sent_14_days?: boolean | null
          reminder_sent_30_days?: boolean | null
          reminder_sent_60_days?: boolean | null
          reminder_sent_7_days?: boolean | null
          reminder_sent_90_days?: boolean | null
          renewal_approved_date?: string | null
          renewal_documents?: Json | null
          renewal_end_date?: string | null
          renewal_number?: string | null
          renewal_start_date?: string | null
          renewal_submitted_date?: string | null
          renewal_type?: string | null
          status?: string | null
          updated_at?: string | null
          work_permit_application_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_expiry_date?: string
          document_urls?: Json | null
          id?: string
          notes?: string | null
          original_work_permit_number?: string
          rejection_reason?: string | null
          reminder_sent_14_days?: boolean | null
          reminder_sent_30_days?: boolean | null
          reminder_sent_60_days?: boolean | null
          reminder_sent_7_days?: boolean | null
          reminder_sent_90_days?: boolean | null
          renewal_approved_date?: string | null
          renewal_documents?: Json | null
          renewal_end_date?: string | null
          renewal_number?: string | null
          renewal_start_date?: string | null
          renewal_submitted_date?: string | null
          renewal_type?: string | null
          status?: string | null
          updated_at?: string | null
          work_permit_application_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_permit_renewals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_renewals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_renewals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_permit_renewals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_permit_renewals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "work_permit_renewals_work_permit_application_id_fkey"
            columns: ["work_permit_application_id"]
            isOneToOne: false
            referencedRelation: "work_permit_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          execution_data: Json | null
          id: string
          started_at: string | null
          status: string | null
          trigger_data: Json | null
          trigger_event: string | null
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          execution_data?: Json | null
          id?: string
          started_at?: string | null
          status?: string | null
          trigger_data?: Json | null
          trigger_event?: string | null
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          execution_data?: Json | null
          id?: string
          started_at?: string | null
          status?: string | null
          trigger_data?: Json | null
          trigger_event?: string | null
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_executions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_step_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          execution_id: string
          id: string
          result_data: Json | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          step_id: string
          step_order: number
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          execution_id: string
          id?: string
          result_data?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          step_id: string
          step_order: number
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          execution_id?: string
          id?: string
          result_data?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          step_id?: string
          step_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_step_executions_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_step_executions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          conditions: Json | null
          created_at: string | null
          id: string
          on_failure_action: string | null
          on_success_action: string | null
          retry_count: number | null
          retry_delay_seconds: number | null
          step_config: Json
          step_order: number
          step_type: string
          timeout_seconds: number | null
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          on_failure_action?: string | null
          on_success_action?: string | null
          retry_count?: number | null
          retry_delay_seconds?: number | null
          step_config?: Json
          step_order: number
          step_type: string
          timeout_seconds?: number | null
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          on_failure_action?: string | null
          on_success_action?: string | null
          retry_count?: number | null
          retry_delay_seconds?: number | null
          step_config?: Json
          step_order?: number
          step_type?: string
          timeout_seconds?: number | null
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_system_template: boolean | null
          name: string
          template_config: Json
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean | null
          name: string
          template_config: Json
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean | null
          name?: string
          template_config?: Json
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          category: string
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          priority: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          category: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          priority?: number | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          priority?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
    }
    Views: {
      approval_metrics: {
        Row: {
          approved_count: number | null
          avg_approval_hours: number | null
          pending_approvals: number | null
          rejected_count: number | null
          total_approvals: number | null
        }
        Relationships: []
      }
      approved_contracts_view: {
        Row: {
          amount: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          approved_by_email: string | null
          approved_by_name: string | null
          attachments: Json | null
          basic_salary: number | null
          billing_frequency: string | null
          changes_requested_at: string | null
          changes_requested_by: string | null
          changes_requested_reason: string | null
          client_company_id: string | null
          client_id: string | null
          contract_number: string | null
          contract_type: string | null
          contract_value: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          days_until_start: number | null
          description: string | null
          employer_id: string | null
          end_date: string | null
          first_party_id: string | null
          google_doc_url: string | null
          id: string | null
          is_current: boolean | null
          location_ar: string | null
          location_en: string | null
          location_id: string | null
          notes: string | null
          notice_period: number | null
          notify_days_before_contract_expiry: number | null
          payment_terms: string | null
          pdf_url: string | null
          priority: string | null
          product_id: string | null
          products_ar: string | null
          products_en: string | null
          promoter_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          renewal_terms: string | null
          second_party_id: string | null
          sent_to_hr_at: string | null
          sent_to_hr_by: string | null
          sent_to_legal_at: string | null
          sent_to_legal_by: string | null
          start_date: string | null
          status: string | null
          submitted_for_review_at: string | null
          tags: string[] | null
          termination_clause: string | null
          terms: string | null
          title: string | null
          total_value: number | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "parties"
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
            foreignKeyName: "contracts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
            foreignKeyName: "contracts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
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
      booking_dashboard_stats: {
        Row: {
          active_bookings: number | null
          cancelled_bookings: number | null
          completed_bookings: number | null
          last_updated: string | null
          pending_bookings: number | null
          pending_revenue: number | null
          portfolio_percentage: number | null
          success_rate: number | null
          total_bookings: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      booking_list_enhanced: {
        Row: {
          client_company: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          completion_days: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_status: string | null
          due_at: string | null
          id: string | null
          is_overdue: boolean | null
          progress: number | null
          progress_percentage: number | null
          provider_company: string | null
          provider_email: string | null
          provider_name: string | null
          provider_phone: string | null
          service_base_price: number | null
          service_category: string | null
          service_description: string | null
          service_title: string | null
          status: string | null
          subtotal: number | null
          title: string | null
          total_amount: number | null
          updated_at: string | null
          vat_amount: number | null
        }
        Relationships: []
      }
      booking_list_optimized: {
        Row: {
          amount: number | null
          client_company: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          due_at: string | null
          id: string | null
          package_id: string | null
          project_progress: number | null
          provider_company: string | null
          provider_email: string | null
          provider_id: string | null
          provider_name: string | null
          scheduled_date: string | null
          service_category: string | null
          service_id: string | null
          service_title: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      booking_progress_view: {
        Row: {
          booking_created_at: string | null
          booking_id: string | null
          booking_status: string | null
          booking_title: string | null
          booking_updated_at: string | null
          client_email: string | null
          client_name: string | null
          progress_percentage: number | null
          provider_email: string | null
          provider_name: string | null
        }
        Relationships: []
      }
      bookings_full_view: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_status: string | null
          due_at: string | null
          id: string | null
          progress: number | null
          progress_percentage: number | null
          provider_email: string | null
          provider_id: string | null
          provider_name: string | null
          provider_phone: string | null
          service_base_price: number | null
          service_category: string | null
          service_description: string | null
          service_id: string | null
          service_title: string | null
          status: string | null
          subtotal: number | null
          title: string | null
          total_amount: number | null
          updated_at: string | null
          vat_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      bookings_normalized: {
        Row: {
          booking_number: string | null
          client_email: string | null
          client_name: string | null
          created_at: string | null
          id: string | null
          provider_email: string | null
          provider_name: string | null
          requirements: Json | null
          service_category: string | null
          service_title: string | null
          status: string | null
          subtotal: number | null
          title: string | null
          total_amount: number | null
          updated_at: string | null
          vat_amount: number | null
        }
        Relationships: []
      }
      company_with_party: {
        Row: {
          address: Json | null
          brand_colors: Json | null
          business_type: Database["public"]["Enums"]["company_type"] | null
          cr_number: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          founded_year: number | null
          group_id: string | null
          id: string | null
          industry: string | null
          is_active: boolean | null
          is_verified: boolean | null
          location: string | null
          logo_url: string | null
          lower_email: string | null
          name: string | null
          owner_id: string | null
          party_contact_email: string | null
          party_contact_person: string | null
          party_contact_phone: string | null
          party_crn: string | null
          party_id: string | null
          party_name_ar: string | null
          party_name_en: string | null
          party_status: string | null
          party_type: string | null
          phone: string | null
          portfolio_links: string | null
          registration_number: string | null
          services_offered: string | null
          settings: Json | null
          size: string | null
          slug: string | null
          type: string | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "company_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "companies_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_status_summary: {
        Row: {
          active_contract_value: number | null
          active_contracts: number | null
          cancelled_contracts: number | null
          draft_contracts: number | null
          expired_contracts: number | null
          pending_contracts: number | null
          total_contract_value: number | null
          total_contracts: number | null
        }
        Relationships: []
      }
      contracts_expiring_soon: {
        Row: {
          contract_number: string | null
          contract_value: number | null
          days_until_expiry: number | null
          end_date: string | null
          first_party_name: string | null
          id: string | null
          second_party_name: string | null
          status: string | null
        }
        Relationships: []
      }
      contracts_needing_promoters: {
        Row: {
          contract_number: string | null
          contract_type: string | null
          created_at: string | null
          days_without_promoter: number | null
          first_party_name: string | null
          id: string | null
          priority: string | null
          second_party_name: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
      email_notification_analytics: {
        Row: {
          notification_type: string | null
          pending_emails: number | null
          sent_emails: number | null
          total_emails: number | null
        }
        Relationships: []
      }
      make_com_bookings: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          id: string | null
          provider_email: string | null
          provider_id: string | null
          provider_name: string | null
          requirements: Json | null
          service_category: string | null
          service_id: string | null
          service_title: string | null
          status: string | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string | null
          vat_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      mv_booking_progress_analytics: {
        Row: {
          avg_milestone_progress: number | null
          avg_task_progress: number | null
          booking_id: string | null
          booking_progress: number | null
          booking_status: string | null
          booking_title: string | null
          completed_milestones: number | null
          completed_tasks: number | null
          created_at: string | null
          in_progress_milestones: number | null
          in_progress_tasks: number | null
          overdue_tasks: number | null
          pending_milestones: number | null
          pending_tasks: number | null
          total_actual_hours: number | null
          total_estimated_hours: number | null
          total_milestones: number | null
          total_tasks: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      office_locations_with_company: {
        Row: {
          address: string | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          radius_meters: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
        ]
      }
      parties_index_usage: {
        Row: {
          idx_scan: number | null
          idx_tup_fetch: number | null
          idx_tup_read: number | null
          indexname: unknown
          schemaname: unknown
          tablename: unknown
        }
        Relationships: []
      }
      pending_contracts_view: {
        Row: {
          amount: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          basic_salary: number | null
          billing_frequency: string | null
          changes_requested_at: string | null
          changes_requested_by: string | null
          changes_requested_reason: string | null
          client_company_id: string | null
          client_id: string | null
          contract_number: string | null
          contract_type: string | null
          contract_value: number | null
          created_at: string | null
          created_by: string | null
          created_by_email: string | null
          created_by_name: string | null
          currency: string | null
          days_pending: number | null
          description: string | null
          employer_id: string | null
          end_date: string | null
          first_party_id: string | null
          google_doc_url: string | null
          id: string | null
          is_current: boolean | null
          location_ar: string | null
          location_en: string | null
          location_id: string | null
          notes: string | null
          notice_period: number | null
          notify_days_before_contract_expiry: number | null
          payment_terms: string | null
          pdf_url: string | null
          priority: string | null
          product_id: string | null
          products_ar: string | null
          products_en: string | null
          promoter_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          renewal_terms: string | null
          second_party_id: string | null
          sent_to_hr_at: string | null
          sent_to_hr_by: string | null
          sent_to_legal_at: string | null
          sent_to_legal_by: string | null
          start_date: string | null
          status: string | null
          submitted_for_review_at: string | null
          tags: string[] | null
          termination_clause: string | null
          terms: string | null
          title: string | null
          total_value: number | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "parties"
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
            foreignKeyName: "contracts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
            foreignKeyName: "contracts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
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
      pending_signatures: {
        Row: {
          contract_id: string | null
          contract_title: string | null
          expires_at: string | null
          request_created_at: string | null
          request_id: string | null
          request_status: string | null
          signatures_completed: number | null
          signatures_pending: number | null
          total_signers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "approved_contracts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_needing_promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "pending_contracts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_for_bookings: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      promoter_recent_notifications: {
        Row: {
          created_at: string | null
          document_type: string | null
          id: string | null
          message: string | null
          priority: Database["public"]["Enums"]["notification_priority"] | null
          promoter_email: string | null
          promoter_id: string | null
          promoter_name: string | null
          promoter_phone: string | null
          read_at: string | null
          send_email: boolean | null
          send_in_app: boolean | null
          send_sms: boolean | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          title: string | null
          type: Database["public"]["Enums"]["notification_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_notifications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_notifications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_notifications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_status_summary: {
        Row: {
          count: number | null
          percentage: number | null
          status: Database["public"]["Enums"]["promoter_status_enum"] | null
        }
        Relationships: []
      }
      promoter_tags_aggregated: {
        Row: {
          promoter_id: string | null
          tag_count: number | null
          tag_names: string[] | null
        }
        Relationships: []
      }
      promoter_unread_notifications: {
        Row: {
          high_priority_count: number | null
          promoter_id: string | null
          unread_count: number | null
          urgent_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_notifications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_notifications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_status_review"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_notifications_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters_with_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters_status_review: {
        Row: {
          email: string | null
          employer_id: string | null
          id: string | null
          name_en: string | null
          new_status: Database["public"]["Enums"]["promoter_status_enum"] | null
          old_status: string | null
          priority: number | null
          status_check: string | null
        }
        Insert: {
          email?: string | null
          employer_id?: string | null
          id?: string | null
          name_en?: string | null
          new_status?:
            | Database["public"]["Enums"]["promoter_status_enum"]
            | null
          old_status?: string | null
          priority?: never
          status_check?: never
        }
        Update: {
          email?: string | null
          employer_id?: string | null
          id?: string | null
          name_en?: string | null
          new_status?:
            | Database["public"]["Enums"]["promoter_status_enum"]
            | null
          old_status?: string | null
          priority?: never
          status_check?: never
        }
        Relationships: [
          {
            foreignKeyName: "promoters_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters_with_tags: {
        Row: {
          account_number: string | null
          address: string | null
          availability: string | null
          bank_name: string | null
          certifications: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          department: string | null
          education_level: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          employer_id: string | null
          experience_years: number | null
          first_name: string | null
          gender: string | null
          graduation_year: number | null
          iban: string | null
          id: string | null
          id_card_expiry_date: string | null
          id_card_number: string | null
          id_card_url: string | null
          job_title: string | null
          last_name: string | null
          marital_status: string | null
          mobile_number: string | null
          name_ar: string | null
          name_en: string | null
          nationality: string | null
          notes: string | null
          notify_days_before_id_expiry: number | null
          notify_days_before_passport_expiry: number | null
          original_email: string | null
          overall_status: string | null
          passport_expiry_date: string | null
          passport_number: string | null
          passport_url: string | null
          phone: string | null
          postal_code: string | null
          preferred_language: string | null
          profile_picture_url: string | null
          rating: number | null
          skills: string | null
          special_requirements: string | null
          specialization: string | null
          state: string | null
          status: string | null
          status_enum:
            | Database["public"]["Enums"]["promoter_status_enum"]
            | null
          swift_code: string | null
          tag_count: number | null
          tags: string[] | null
          tax_id: string | null
          timezone: string | null
          university: string | null
          updated_at: string | null
          visa_expiry_date: string | null
          visa_number: string | null
          work_permit_expiry_date: string | null
          work_permit_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoters_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      public_services: {
        Row: {
          base_price: number | null
          category: string | null
          company_name: string | null
          cover_image_url: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          provider_id: string | null
          provider_name: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      rbac_user_role_assignments: {
        Row: {
          assigned_by: string | null
          context: Json | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          role_id: string | null
          updated_at: string | null
          user_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Relationships: []
      }
      service_enriched: {
        Row: {
          base_price: number | null
          category: string | null
          company_name: string | null
          cover_image_url: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          provider_email: string | null
          provider_id: string | null
          provider_name: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      signature_completion_stats: {
        Row: {
          avg_completion_hours: number | null
          cancelled_requests: number | null
          completed_requests: number | null
          date: string | null
          expired_requests: number | null
          total_requests: number | null
        }
        Relationships: []
      }
      user_enriched: {
        Row: {
          company_id: string | null
          company_name: string | null
          country: string | null
          cr_number: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          phone: string | null
          role: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Relationships: []
      }
      user_permissions_cache: {
        Row: {
          email: string | null
          full_name: string | null
          permissions: string[] | null
          roles: string[] | null
          user_id: string | null
        }
        Relationships: []
      }
      v_active_projects: {
        Row: {
          client_name: string | null
          created_at: string | null
          id: string | null
          provider_name: string | null
          service_title: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_activity_feed: {
        Row: {
          activity_type: string | null
          created_at: string | null
          description: string | null
          id: string | null
          metadata: Json | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      v_booking_anomalies: {
        Row: {
          anomaly_type: string | null
          booking_count: number | null
          daily_revenue: number | null
          date: string | null
          expected_bookings: number | null
          expected_revenue: number | null
        }
        Relationships: []
      }
      v_booking_kpis: {
        Row: {
          active_projects: number | null
          as_of_date: string | null
          cancelled_projects: number | null
          completed_projects: number | null
          total_projects: number | null
        }
        Relationships: []
      }
      v_booking_normalized: {
        Row: {
          booking_number: string | null
          client_id: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          provider_company_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          service_id: string | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          booking_number?: string | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          provider_company_id?: string | null
          scheduled_end?: never
          scheduled_start?: never
          service_id?: string | null
          status?: string | null
          total_amount?: never
        }
        Update: {
          booking_number?: string | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          provider_company_id?: string | null
          scheduled_end?: never
          scheduled_start?: never
          service_id?: string | null
          status?: string | null
          total_amount?: never
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_company_fk"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_company_fk"
            columns: ["provider_company_id"]
            isOneToOne: false
            referencedRelation: "company_with_party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      v_booking_progress: {
        Row: {
          booking_created_at: string | null
          booking_id: string | null
          booking_status: string | null
          booking_title: string | null
          booking_updated_at: string | null
          progress_percentage: number | null
        }
        Insert: {
          booking_created_at?: string | null
          booking_id?: string | null
          booking_status?: string | null
          booking_title?: never
          booking_updated_at?: string | null
          progress_percentage?: never
        }
        Update: {
          booking_created_at?: string | null
          booking_id?: string | null
          booking_status?: string | null
          booking_title?: never
          booking_updated_at?: string | null
          progress_percentage?: never
        }
        Relationships: []
      }
      v_booking_status: {
        Row: {
          amount: number | null
          amount_cents: number | null
          amount_cents_calculated: number | null
          approval_status: string | null
          booking_created_at: string | null
          booking_id: string | null
          booking_status: string | null
          booking_title: string | null
          booking_updated_at: string | null
          client_avatar: string | null
          client_company: string | null
          client_company_address: Json | null
          client_company_email: string | null
          client_company_phone: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          completed_milestones: number | null
          created_at: string | null
          currency: string | null
          display_status: string | null
          due_at: string | null
          id: string | null
          invoice_id: string | null
          invoice_status: string | null
          location: string | null
          notes: string | null
          package_id: string | null
          payment_status: string | null
          progress: number | null
          provider_avatar: string | null
          provider_company: string | null
          provider_company_address: Json | null
          provider_company_cr: number | null
          provider_company_email: string | null
          provider_company_logo: string | null
          provider_company_phone: string | null
          provider_company_vat: string | null
          provider_email: string | null
          provider_id: string | null
          provider_name: string | null
          provider_phone: string | null
          raw_status: string | null
          requirements: Json | null
          scheduled_date: string | null
          service_base_price: number | null
          service_category: string | null
          service_description: string | null
          service_id: string | null
          service_title: string | null
          subtotal: number | null
          total_amount: number | null
          total_milestones: number | null
          updated_at: string | null
          vat_amount: number | null
          vat_percent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_performance"
            referencedColumns: ["service_id"]
          },
        ]
      }
      v_booking_status_metrics: {
        Row: {
          approved_count: number | null
          avg_progress: number | null
          cancelled_count: number | null
          completed_count: number | null
          in_progress_count: number | null
          pending_count: number | null
          total_bookings: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_booking_trends: {
        Row: {
          avg_progress: number | null
          cancelled_bookings: number | null
          completed_bookings: number | null
          completed_revenue: number | null
          date: string | null
          in_progress_bookings: number | null
          pending_bookings: number | null
          total_bookings: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_bookings_summary: {
        Row: {
          cancelled_bookings: number | null
          completed_bookings: number | null
          month: string | null
          total_bookings: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_client_satisfaction: {
        Row: {
          booking_id: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          feedback: string | null
          rating: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      v_completion_analytics: {
        Row: {
          avg_progress: number | null
          completed_bookings: number | null
          total_bookings: number | null
          total_revenue: number | null
          week: string | null
        }
        Relationships: []
      }
      v_invoices_with_details: {
        Row: {
          amount: number | null
          booking_id: string | null
          booking_status: string | null
          booking_title: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string | null
          invoice_number: string | null
          invoice_pdf_url: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_terms: string | null
          pdf_url: string | null
          provider_email: string | null
          provider_id: string | null
          provider_name: string | null
          service_title: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "fk_invoices_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_invoices_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles_for_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_workload_analytics"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      v_milestone_progress: {
        Row: {
          booking_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string | null
          progress_percentage: number | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string | null
          progress_percentage?: never
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string | null
          progress_percentage?: never
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_list_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_progress_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_full_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "make_com_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_progress_analytics"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_active_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_progress"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_booking_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_client_satisfaction"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_project_completion"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      v_project_completion: {
        Row: {
          booking_id: string | null
          client_name: string | null
          completion_percentage: number | null
          created_at: string | null
          provider_name: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_provider_workload_analytics: {
        Row: {
          active_bookings: number | null
          avg_progress: number | null
          completed_bookings: number | null
          completion_rate: number | null
          provider_email: string | null
          provider_id: string | null
          provider_name: string | null
          total_bookings: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_revenue_by_status: {
        Row: {
          avg_booking_value: number | null
          booking_count: number | null
          revenue_last_30_days: number | null
          status: string | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_revenue_forecast: {
        Row: {
          avg_3month_revenue: number | null
          forecast_next_month: number | null
          month: string | null
          month_over_month_growth: number | null
          prev_month_revenue: number | null
          revenue: number | null
        }
        Relationships: []
      }
      v_revenue_monthly: {
        Row: {
          bookings_count: number | null
          month_start: string | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_service_performance: {
        Row: {
          avg_completion_days: string | null
          avg_progress: number | null
          completed_bookings: number | null
          completion_rate: number | null
          service_category: string | null
          service_id: string | null
          service_title: string | null
          total_bookings: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_tasks_status: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string | null
          is_overdue: boolean | null
          milestone_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string | null
          is_overdue?: never
          milestone_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string | null
          is_overdue?: never
          milestone_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "v_milestone_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_webhook_stats: {
        Row: {
          date: string | null
          event_type: string | null
          failed_events: number | null
          successful_events: number | null
          total_events: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_milestone:
        | {
            Args: {
              booking_id: string
              description: string
              due_date: string
              title: string
              weight?: number
            }
            Returns: string
          }
        | {
            Args: {
              booking_uuid_param: string
              milestone_description?: string
              milestone_status?: string
              milestone_title: string
              milestone_weight?: number
            }
            Returns: string
          }
      add_password_to_history: {
        Args: { p_password_hash: string; p_user_id: string }
        Returns: undefined
      }
      add_task:
        | {
            Args: {
              description?: string
              due_date?: string
              estimated_hours?: number
              milestone_id: string
              priority?: string
              title: string
            }
            Returns: string
          }
        | {
            Args: { due_date: string; milestone_id: string; title: string }
            Returns: string
          }
        | {
            Args: {
              description?: string
              due_date?: string
              estimated_hours?: number
              milestone_id: string
              priority?: string
              title: string
            }
            Returns: string
          }
        | {
            Args: {
              milestone_uuid_param: string
              task_due_date?: string
              task_status?: string
              task_title: string
            }
            Returns: string
          }
      add_task_to_milestone: {
        Args: {
          estimated_hours_val?: number
          milestone_uuid: string
          task_description?: string
          task_priority?: string
          task_title: string
        }
        Returns: string
      }
      alert_on_failed_webhooks: { Args: never; Returns: undefined }
      append_booking_event: {
        Args: {
          p_booking_id: string
          p_description?: string
          p_event_type: string
          p_new_status?: string
        }
        Returns: undefined
      }
      assign_user_role_v2: {
        Args: {
          assigned_by_user_id?: string
          role_name: string
          target_user_id: string
        }
        Returns: boolean
      }
      auto_create_location_groups: {
        Args: { p_company_id: string }
        Returns: number
      }
      auto_generate_daily_attendance_links: { Args: never; Returns: undefined }
      bind_service_to_resource: {
        Args: { p_resource_id: string; p_service_id: string }
        Returns: undefined
      }
      booking_tasks_append_action_item: {
        Args: { p_action: Json; p_task_id: string }
        Returns: undefined
      }
      booking_tasks_append_shared_comment: {
        Args: { p_comment: Json; p_task_id: string }
        Returns: undefined
      }
      booking_tasks_update_action_item_status: {
        Args: { p_action_id: string; p_status: string; p_task_id: string }
        Returns: undefined
      }
      bookings_revenue_stats: {
        Args: { p_search: string; p_status: string }
        Returns: {
          booking_sum: number
          price_sum: number
        }[]
      }
      bulk_assign_promoters: {
        Args: { p_assigned_by?: string; p_assignments: Json }
        Returns: {
          contract_id: string
          error_message: string
          success: boolean
        }[]
      }
      calculate_booking_progress: {
        Args: { booking_id: string }
        Returns: number
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_milestone_progress: {
        Args: { milestone_id: string }
        Returns: number
      }
      calculate_service_rating: {
        Args: { service_id: string }
        Returns: number
      }
      call_webhook: {
        Args: { event_data: Json; event_type: string; webhook_url: string }
        Returns: undefined
      }
      can_transition: {
        Args: {
          current_status: string
          entity_type?: string
          new_status: string
        }
        Returns: boolean
      }
      can_view_profile: { Args: { profile_id: string }; Returns: boolean }
      check_company_membership: {
        Args: {
          p_company_id: string
          p_required_role?: string
          p_user_id?: string
        }
        Returns: boolean
      }
      check_email_exists: { Args: { email_to_check: string }; Returns: boolean }
      check_overdue_milestones: { Args: never; Returns: undefined }
      check_password_reused: {
        Args: {
          p_history_limit?: number
          p_new_password_hash: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_security_status: {
        Args: never
        Returns: {
          check_type: string
          details: string
          recommendation: string
          status: string
        }[]
      }
      cleanup_expired_sessions: { Args: never; Returns: number }
      cleanup_old_notifications: { Args: never; Returns: number }
      clone_dashboard_layout: {
        Args: { p_source_user_id: string; p_target_user_id: string }
        Returns: boolean
      }
      convert_currency: {
        Args: {
          p_amount: number
          p_date?: string
          p_from_currency: Database["public"]["Enums"]["currency_code"]
          p_to_currency: Database["public"]["Enums"]["currency_code"]
        }
        Returns: number
      }
      count_promoters_with_active_contracts: { Args: never; Returns: number }
      create_booking_simple: {
        Args: {
          p_client_id: string
          p_currency?: string
          p_end: string
          p_service_id: string
          p_start: string
          p_total?: number
        }
        Returns: {
          booking_number: string
          id: string
          status: string
        }[]
      }
      create_default_milestones: {
        Args: { booking_uuid: string }
        Returns: undefined
      }
      create_default_tasks_for_milestone: {
        Args: { m_id: string; m_name: string }
        Returns: undefined
      }
      create_invoice_for_booking: {
        Args: { p_booking_id: string }
        Returns: string
      }
      create_invoice_from_booking: {
        Args: {
          p_booking_id: string
          p_description?: string
          p_vat_rate?: number
        }
        Returns: Json
      }
      create_progress_notification: {
        Args: {
          booking_uuid: string
          notification_data?: Json
          notification_message: string
          notification_title: string
          notification_type: string
          user_uuid: string
        }
        Returns: string
      }
      create_user_profile:
        | {
            Args: {
              full_name?: string
              phone?: string
              user_email?: string
              user_id: string
              user_role?: string
            }
            Returns: Json
          }
        | {
            Args: {
              full_name?: string
              phone?: string
              user_id: string
              user_role?: string
            }
            Returns: Json
          }
      create_user_profile_simple: {
        Args: { user_id: string }
        Returns: boolean
      }
      delete_milestone: { Args: { milestone_id: string }; Returns: undefined }
      delete_task: { Args: { task_id: string }; Returns: undefined }
      detect_anomalies: {
        Args: { days_back?: number; sensitivity?: number }
        Returns: {
          anomaly_type: string
          confidence_score: number
          current_value: number
          date: string
          deviation_percent: number
          expected_value: number
          severity: string
        }[]
      }
      ensure_updated_at_trigger: {
        Args: { tbl: unknown; trig_name: string }
        Returns: undefined
      }
      ensure_user_profile: { Args: { user_id: string }; Returns: undefined }
      fn_auto_generate_insights: { Args: never; Returns: undefined }
      fn_create_notification: {
        Args: {
          p_data: Json
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      forecast_revenue: {
        Args: { alpha?: number; days_ahead?: number }
        Returns: {
          confidence_lower: number
          confidence_upper: number
          forecast_date: string
          forecasted_revenue: number
          trend_direction: string
          trend_strength: number
        }[]
      }
      generate_attendance_link_code: { Args: never; Returns: string }
      generate_daily_insights: {
        Args: never
        Returns: {
          confidence_score: number
          insight_id: string
          recommendation: string
          severity: string
          summary: string
          title: string
          type: string
        }[]
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_milestones_from_templates: {
        Args: { booking_uuid: string }
        Returns: undefined
      }
      generate_schedule_links: {
        Args: { p_schedule_id: string }
        Returns: {
          check_in_link_id: string
          check_out_link_id: string
        }[]
      }
      generate_work_permit_application_number: { Args: never; Returns: string }
      generate_work_permit_renewal_number: { Args: never; Returns: string }
      get_booking_dashboard_data: {
        Args: { user_id?: string; user_role?: string }
        Returns: Json
      }
      get_booking_details: {
        Args: { booking_id: string }
        Returns: {
          client_id: string
          created_at: string
          end_time: string
          id: string
          provider_id: string
          resource_id: string
          service_id: string
          start_time: string
          status: string
          total_cost: number
        }[]
      }
      get_booking_display_status: {
        Args: { booking_status: string; progress_percentage: number }
        Returns: string
      }
      get_booking_kpis: {
        Args: never
        Returns: {
          approved: number
          completed: number
          in_progress: number
          pending: number
          total: number
          total_revenue: number
        }[]
      }
      get_booking_progress_analytics_secure: {
        Args: never
        Returns: {
          booking_id: string
          completed_milestones: number
          completed_tasks: number
          overall_progress: number
          total_milestones: number
          total_tasks: number
        }[]
      }
      get_booking_progress_data: {
        Args: { booking_uuid: string }
        Returns: {
          booking_id: string
          booking_progress: number
          booking_status: string
          booking_title: string
          completed_milestones: number
          completed_tasks: number
          created_at: string
          overdue_tasks: number
          total_actual_hours: number
          total_estimated_hours: number
          total_milestones: number
          total_tasks: number
          updated_at: string
        }[]
      }
      get_booking_trends: {
        Args: { days_back?: number; group_by?: string }
        Returns: {
          avg_progress: number
          cancelled_bookings: number
          completed_bookings: number
          completed_revenue: number
          completion_rate: number
          in_progress_bookings: number
          pending_bookings: number
          period_end: string
          period_start: string
          total_bookings: number
          total_revenue: number
        }[]
      }
      get_bookings_for_user_v2: {
        Args: {
          limit_count?: number
          offset_count?: number
          user_role: string
          user_uuid: string
        }
        Returns: {
          booking_number: string
          client_name: string
          created_at: string
          currency: string
          id: string
          provider_name: string
          service_title: string
          status: string
          total_amount: number
        }[]
      }
      get_bookings_summary: {
        Args: never
        Returns: {
          completed_count: number
          total_projects: number
          total_revenue: number
        }[]
      }
      get_company_attendance_settings: {
        Args: { p_company_id: string }
        Returns: {
          absent_threshold_hours: number
          alert_on_anomalies: boolean
          allow_breaks: boolean
          analytics_retention_days: number
          approval_deadline_hours: number
          auto_approve: boolean
          auto_approve_valid_checkins: boolean
          auto_generate_reports: boolean
          auto_mark_absent: boolean
          auto_mark_absent_time: string
          check_in_time_window_minutes: number
          company_id: string
          created_at: string
          default_check_in_time: string
          default_check_out_time: string
          default_link_validity_hours: number
          default_report_format: string
          enable_analytics: boolean
          id: string
          include_device_info_in_reports: boolean
          include_location_in_reports: boolean
          include_photos_in_reports: boolean
          late_threshold_minutes: number
          link_expiry_hours: number
          location_radius_meters: number
          max_break_duration_minutes: number
          max_breaks_per_day: number
          max_uses_per_link: number
          notification_methods: string[]
          overtime_rate_multiplier: number
          overtime_threshold_hours: number
          reminder_time_minutes: number
          report_generation_day: number
          report_generation_schedule: string
          require_approval: boolean
          require_location: boolean
          require_photo: boolean
          send_approval_notifications: boolean
          send_check_in_reminders: boolean
          send_check_out_reminders: boolean
          send_late_notifications: boolean
          standard_work_hours: number
          track_attendance_patterns: boolean
          track_overtime_trends: boolean
          unpaid_break_minutes: number
          updated_at: string
        }[]
      }
      get_company_office_locations: {
        Args: { p_company_id: string }
        Returns: {
          address: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters: number
        }[]
      }
      get_completion_analytics: {
        Args: { days_back?: number; group_by?: string }
        Returns: {
          avg_completion_days: number
          avg_progress: number
          completed_bookings: number
          completion_rate: number
          period_end: string
          period_start: string
          total_bookings: number
          total_revenue: number
        }[]
      }
      get_contract_analytics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          metric_change: number
          metric_name: string
          metric_value: number
        }[]
      }
      get_contracts_without_promoters: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: {
          contract_id: string
          contract_number: string
          contract_type: string
          created_at: string
          days_since_creation: number
          end_date: string
          first_party_name: string
          second_party_name: string
          start_date: string
          status: string
          title: string
        }[]
      }
      get_dashboard_kpis: {
        Args: { days_back?: number }
        Returns: {
          avg_completion_days: number
          avg_progress: number
          booking_growth: number
          completed_bookings: number
          completed_revenue: number
          completion_rate: number
          in_progress_bookings: number
          pending_bookings: number
          revenue_growth: number
          total_bookings: number
          total_revenue: number
        }[]
      }
      get_dashboard_metrics: {
        Args: never
        Returns: {
          active_projects: number
          avg_rating: number
          completion_pct: number
          revenue_growth_pct: number
          revenue_this_month: number
        }[]
      }
      get_email_notification_stats: {
        Args: { user_id_param: string }
        Returns: {
          failed_emails: number
          last_email_sent: string
          pending_emails: number
          sent_emails: number
          total_emails: number
        }[]
      }
      get_enhanced_booking_stats: {
        Args: { user_id?: string; user_role?: string }
        Returns: Json
      }
      get_exchange_rate: {
        Args: {
          p_date?: string
          p_from_currency: Database["public"]["Enums"]["currency_code"]
          p_to_currency: Database["public"]["Enums"]["currency_code"]
        }
        Returns: number
      }
      get_insight_run_stats: {
        Args: { days_back?: number }
        Returns: {
          avg_duration_ms: number
          avg_insights_per_run: number
          failed_runs: number
          last_run_at: string
          last_run_status: string
          successful_runs: number
          total_insights_generated: number
          total_runs: number
        }[]
      }
      get_insights_for_notification: {
        Args: { hours_back?: number; min_severity?: string }
        Returns: {
          confidence_score: number
          created_at: string
          id: string
          recommendation: string
          severity: string
          summary: string
          title: string
          type: string
        }[]
      }
      get_invoice_details: { Args: { p_invoice_id: string }; Returns: Json }
      get_latest_insights: {
        Args: {
          limit_count?: number
          severity_filter?: string
          type_filter?: string
        }
        Returns: {
          confidence_score: number
          created_at: string
          id: string
          is_resolved: boolean
          recommendation: string
          severity: string
          summary: string
          title: string
          type: string
        }[]
      }
      get_metric_trend: {
        Args: {
          p_days_back?: number
          p_metric_name: string
          p_metric_type: string
        }
        Returns: {
          change_percent: number
          change_value: number
          current_value: number
          previous_value: number
          trend: string
        }[]
      }
      get_mv_columns: {
        Args: { mv_name: string }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
      get_notification_preferences: {
        Args: { user_uuid: string }
        Returns: {
          categories: Json | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          notification_frequency: string | null
          push_notifications: boolean | null
          sound_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_payment_status_display_info: {
        Args: { payment_status: string }
        Returns: Json
      }
      get_pending_emails: {
        Args: { limit_count?: number }
        Returns: {
          attempts: number
          email_address: string
          id: string
          max_attempts: number
          notification_id: string
          notification_type: string
          priority: number
          user_id: string
        }[]
      }
      get_pending_signatures_for_user: {
        Args: { p_user_id: string }
        Returns: {
          contract_id: string
          contract_title: string
          created_at: string
          expires_at: string
          request_id: string
          signer_email: string
        }[]
      }
      get_promoter_assignment_stats: {
        Args: never
        Returns: {
          contracts_with_promoter: number
          contracts_without_promoter: number
          high_priority_missing: number
          low_priority_missing: number
          medium_priority_missing: number
          percentage_complete: number
          total_contracts: number
        }[]
      }
      get_promoter_metrics: {
        Args: never
        Returns: {
          active_on_contracts: number
          available_for_work: number
          compliance_rate: number
          inactive: number
          on_leave: number
          terminated: number
          total_workforce: number
          utilization_rate: number
        }[]
      }
      get_promoter_tags: {
        Args: { p_promoter_id: string }
        Returns: {
          tag_count: number
          tag_names: string[]
        }[]
      }
      get_provider_dashboard: {
        Args: { pid: string }
        Returns: {
          active_bookings: number
          active_services: number
          avg_rating: number
          completion_rate: number
          monthly_earnings: number
          monthly_growth: number
          response_rate: number
          total_earnings: number
        }[]
      }
      get_provider_monthly_earnings: {
        Args: { months_back: number; pid: string }
        Returns: {
          booking_count: number
          earnings: number
          month_year: string
        }[]
      }
      get_provider_recent_bookings: {
        Args: { limit_count: number; pid: string }
        Returns: {
          client_email: string
          client_name: string
          completed_milestones: number
          created_at: string
          currency: string
          description: string
          end_date: string
          id: string
          milestone_count: number
          service_title: string
          start_date: string
          status: string
          title: string
          total_amount: number
        }[]
      }
      get_provider_top_services: {
        Args: { limit_count: number; pid: string }
        Returns: {
          avg_rating: number
          booking_count: number
          completion_rate: number
          currency: string
          description: string
          id: string
          price: number
          status: string
          title: string
          total_earnings: number
        }[]
      }
      get_rbac_health_summary: {
        Args: never
        Returns: {
          metric: string
          value: number
        }[]
      }
      get_revenue_analytics: {
        Args: { days_back?: number }
        Returns: {
          avg_booking_value: number
          booking_count: number
          revenue_last_30_days: number
          revenue_trend: number
          status: string
          total_revenue: number
        }[]
      }
      get_revenue_display_status: {
        Args: { booking_status: string; payment_status: string }
        Returns: string
      }
      get_schedule_employees: {
        Args: { p_schedule_id: string }
        Returns: {
          email: string
          employee_id: string
          full_name: string
          phone: string
        }[]
      }
      get_schedule_employees_enhanced: {
        Args: { p_schedule_id: string }
        Returns: {
          department: string
          email: string
          employee_code: string
          employee_id: string
          full_name: string
          group_names: string[]
          job_title: string
          phone: string
        }[]
      }
      get_service_performance: {
        Args: { days_back?: number; min_bookings?: number }
        Returns: {
          avg_booking_value: number
          avg_completion_days: number
          avg_progress: number
          completed_bookings: number
          completion_rate: number
          service_category: string
          service_id: string
          service_title: string
          total_bookings: number
          total_revenue: number
        }[]
      }
      get_service_with_details: {
        Args: { service_uuid: string }
        Returns: Json
      }
      get_services_for_user_v2: {
        Args: {
          limit_count?: number
          offset_count?: number
          user_role: string
          user_uuid: string
        }
        Returns: {
          avg_rating: number
          base_price: number
          booking_count: number
          category: string
          created_at: string
          currency: string
          id: string
          provider_name: string
          title: string
        }[]
      }
      get_status_display_info: { Args: { status: string }; Returns: Json }
      get_teams_for_user: {
        Args: { user_id: string }
        Returns: {
          team_id: string
        }[]
      }
      get_unread_message_count: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: number
      }
      get_unread_notification_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_by_email: {
        Args: { email_to_find: string }
        Returns: {
          company_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          role: string
        }[]
      }
      get_user_companies: {
        Args: { p_user_id: string }
        Returns: {
          company_id: string
          company_logo: string
          company_name: string
          group_name: string
          is_primary: boolean
          user_role: string
        }[]
      }
      get_user_company_permissions: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: {
          granted: boolean
          permission: string
        }[]
      }
      get_user_dashboard_layout: { Args: { p_user_id: string }; Returns: Json }
      get_user_email_preferences: {
        Args: { user_uuid: string }
        Returns: {
          daily_digest_time: string
          email_address: string
          email_template_style: string
          is_unsubscribed: boolean
          is_verified: boolean
          send_time_preference: string
          weekly_digest_day: number
        }[]
      }
      get_user_notification_stats: {
        Args: { user_uuid: string }
        Returns: {
          recent_notifications: number
          total_notifications: number
          unread_notifications: number
        }[]
      }
      get_user_notifications: {
        Args: { limit_count?: number; offset_count?: number; user_uuid: string }
        Returns: {
          booking_id: string
          created_at: string
          data: Json
          id: string
          message: string
          read: boolean
          title: string
          type: string
        }[]
      }
      get_user_pending_approvals: {
        Args: { p_user_id: string }
        Returns: {
          approval_id: string
          contract_id: string
          contract_number: string
          created_at: string
          due_at: string
          step_name: string
        }[]
      }
      get_user_permissions_secure: {
        Args: never
        Returns: {
          role_name: string
          user_id: string
        }[]
      }
      get_user_primary_role: { Args: { user_uuid: string }; Returns: string }
      get_user_primary_role_v2: { Args: { user_uuid: string }; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_user_roles: {
        Args: { user_uuid: string }
        Returns: {
          assigned_at: string
          is_active: boolean
          role_display_name: string
          role_name: string
        }[]
      }
      get_user_roles_v2: {
        Args: { user_uuid: string }
        Returns: {
          assigned_at: string
          is_active: boolean
          role_display_name: string
          role_name: string
        }[]
      }
      get_user_with_role: {
        Args: { p_user_id?: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          status: string
        }[]
      }
      get_users_with_roles_v2: {
        Args: never
        Returns: {
          company_id: string
          country: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_verified: boolean
          phone: string
          roles: Json
          updated_at: string
        }[]
      }
      get_users_without_roles: {
        Args: never
        Returns: {
          role_count: number
          user_created_at: string
          user_email: string
          user_id: string
        }[]
      }
      get_webhook_stats: {
        Args: never
        Returns: {
          failed_calls: number
          last_called: string
          success_rate: number
          successful_calls: number
          total_calls: number
          webhook_name: string
        }[]
      }
      has_company_permission: {
        Args: { p_company_id: string; p_permission: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { role_name: string; user_uuid: string }
        Returns: boolean
      }
      has_role_v2: {
        Args: { role_name: string; user_uuid: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_booking_approved: { Args: { booking_id: string }; Returns: boolean }
      is_booking_requester: { Args: { p_booking_id: string }; Returns: boolean }
      is_client: { Args: never; Returns: boolean }
      is_client_of_booking: { Args: { b_id: string }; Returns: boolean }
      is_invoiceable_status: { Args: { s: string }; Returns: boolean }
      is_login_blocked: {
        Args: { p_email: string; p_ip_address: unknown }
        Returns: boolean
      }
      is_provider: { Args: never; Returns: boolean }
      is_provider_of_booking: { Args: { b_id: string }; Returns: boolean }
      is_user_related_to_booking: {
        Args: { booking_id: string }
        Returns: boolean
      }
      log_notification_attempt: {
        Args: {
          p_channel_id: string
          p_error_message?: string
          p_insight_id: string
          p_metadata?: Json
          p_status: string
        }
        Returns: string
      }
      log_permission_usage: {
        Args: {
          p_action: string
          p_ip_address?: string
          p_permission: string
          p_resource: string
          p_result: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_role_change:
        | {
            Args: {
              p_changed_by: string
              p_ip_address?: string
              p_new_roles: Json
              p_old_roles: Json
              p_user_agent?: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_changed_by: string
              p_ip_address?: string
              p_new_roles: Json
              p_old_roles: Json
              p_result?: string
              p_user_agent?: string
              p_user_id: string
            }
            Returns: string
          }
      log_security_event: {
        Args: { p_event_type: string; p_metadata?: Json; p_user_id?: string }
        Returns: string
      }
      log_time_for_task: {
        Args: {
          description_val: string
          duration_hours_val: number
          task_uuid: string
          user_uuid: string
        }
        Returns: string
      }
      mark_all_notifications_read: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      mark_email_processed: {
        Args: { p_error_message?: string; p_queue_id: string; p_status: string }
        Returns: undefined
      }
      mark_messages_as_read: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: number
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      no_overlap_for_service: {
        Args: {
          p_end: string
          p_exclude_booking?: string
          p_service_id: string
          p_start: string
        }
        Returns: boolean
      }
      post_milestone_comment_by_task: {
        Args: { p_content: string; p_task_id: string }
        Returns: string
      }
      process_payment_success: {
        Args: {
          p_booking_id: string
          p_payment_amount: number
          p_payment_gateway?: string
          p_payment_method: string
          p_payment_reference?: string
        }
        Returns: Json
      }
      process_profile_creation_webhooks: { Args: never; Returns: number }
      promoter_tags_array: {
        Args: { promoter_id: string }
        Returns: {
          tags: string[]
        }[]
      }
      prune_webhook_logs: { Args: never; Returns: undefined }
      queue_email_notification: {
        Args: {
          p_email_address: string
          p_notification_id: string
          p_notification_type: string
          p_priority?: number
          p_scheduled_at?: string
          p_user_id: string
        }
        Returns: string
      }
      rbac_attach_permission: {
        Args: { p_perm_id: string; p_role_id: string }
        Returns: undefined
      }
      rbac_refresh_user_permissions_mv: { Args: never; Returns: undefined }
      rbac_upsert_permission: {
        Args: {
          p_action: string
          p_description: string
          p_name: string
          p_resource: string
          p_scope: string
        }
        Returns: string
      }
      rbac_upsert_role: {
        Args: { p_category: string; p_description: string; p_name: string }
        Returns: string
      }
      record_daily_metrics: { Args: never; Returns: undefined }
      refresh_booking_progress_analytics: { Args: never; Returns: undefined }
      refresh_mv_bucket_kpis: { Args: never; Returns: undefined }
      refresh_mv_buckets: { Args: never; Returns: undefined }
      refresh_user_permissions: { Args: never; Returns: undefined }
      refresh_user_permissions_cache: { Args: never; Returns: undefined }
      remove_user_role_v2: {
        Args: { role_name: string; target_user_id: string }
        Returns: boolean
      }
      reset_failed_login_attempts: {
        Args: { p_email: string; p_ip_address: unknown }
        Returns: undefined
      }
      resolve_insight: {
        Args: { insight_id: string; resolved_by_user_id?: string }
        Returns: boolean
      }
      safe_fetch_profile: {
        Args: { user_id: string }
        Returns: {
          company_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          profile_completed: boolean
          role: string
          verification_status: string
        }[]
      }
      safe_webhook_call: {
        Args: { payload: Json; webhook_url: string }
        Returns: boolean
      }
      services_stats: {
        Args: { p_search: string; p_status: string }
        Returns: {
          approved: number
          featured: number
          pending: number
          price_sum: number
          rejected: number
          total: number
        }[]
      }
      should_schedule_run_today: {
        Args: {
          schedule: Database["public"]["Tables"]["attendance_link_schedules"]["Row"]
        }
        Returns: boolean
      }
      slugify: { Args: { src: string }; Returns: string }
      standardize_booking_status: {
        Args: {
          approval_status?: string
          progress_percentage?: number
          raw_status: string
        }
        Returns: string
      }
      start_time_tracking: { Args: { p_task_id: string }; Returns: Json }
      stop_time_tracking: { Args: { p_task_id: string }; Returns: Json }
      suggest_promoters_for_contract: {
        Args: { p_contract_id: string; p_max_suggestions?: number }
        Returns: {
          confidence_score: number
          promoter_id: string
          promoter_name_ar: string
          promoter_name_en: string
          reason: string
        }[]
      }
      switch_active_company: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      sync_party_to_company: { Args: { p_party_id: string }; Returns: string }
      sync_promoter_to_employer_employee: {
        Args: { p_party_id: string; p_promoter_id: string }
        Returns: string
      }
      test_booking_status: {
        Args: never
        Returns: {
          booking_id: string
          booking_status: string
          booking_title: string
        }[]
      }
      test_notification_creation: {
        Args: never
        Returns: {
          message: string
          notification_id: string
          success: boolean
        }[]
      }
      test_webhook: { Args: { webhook_name: string }; Returns: string }
      track_failed_login: {
        Args: { p_email: string; p_ip_address: unknown; p_user_agent?: string }
        Returns: boolean
      }
      trigger_manual_insight_generation: { Args: never; Returns: Json }
      unaccent: { Args: { "": string }; Returns: string }
      update_booking_progress_from_milestones: {
        Args: { booking_uuid: string }
        Returns: number
      }
      update_booking_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      update_milestone:
        | {
            Args: {
              description?: string
              due_date?: string
              milestone_id: string
              status?: string
              title?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              milestone_description?: string
              milestone_due_date?: string
              milestone_status?: string
              milestone_title?: string
              milestone_uuid_param: string
              milestone_weight?: number
            }
            Returns: undefined
          }
      update_milestone_progress: {
        Args: { milestone_uuid: string }
        Returns: undefined
      }
      update_overdue_status: { Args: never; Returns: undefined }
      update_overdue_tasks: { Args: never; Returns: undefined }
      update_service_stats: {
        Args: {
          increment_value?: number
          service_id: string
          stat_type: string
        }
        Returns: undefined
      }
      update_task: {
        Args: {
          actual_hours?: number
          due_date?: string
          notes?: string
          progress_percentage?: number
          status?: string
          task_id: string
          title?: string
        }
        Returns: undefined
      }
      update_task_basic: {
        Args: {
          due_date?: string
          status?: string
          task_id: string
          title?: string
        }
        Returns: undefined
      }
      update_task_details: {
        Args: {
          estimated_hours_val: number
          task_description: string
          task_priority: string
          task_title: string
          task_uuid: string
          user_uuid?: string
        }
        Returns: boolean
      }
      update_task_status: {
        Args: { new_status: string; task_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      upsert_booking_by_number: {
        Args: {
          p_booking_number: string
          p_client_id: string
          p_currency?: string
          p_end: string
          p_service_id: string
          p_start: string
          p_status?: string
          p_total?: number
        }
        Returns: {
          booking_number: string
          id: string
          status: string
        }[]
      }
      upsert_booking_by_number_exc: {
        Args: {
          p_booking_number: string
          p_client_id: string
          p_currency?: string
          p_end: string
          p_service_id: string
          p_start: string
          p_status?: string
          p_total?: number
        }
        Returns: {
          booking_id: string
          booking_number: string
          status: string
        }[]
      }
      upsert_company_by_slug_safe: {
        Args: {
          p_created_by: string
          p_email: string
          p_name: string
          p_slug: string
        }
        Returns: {
          email: string
          email_updated: boolean
          id: string
          slug: string
        }[]
      }
      upsert_service_by_slug_safe: {
        Args: {
          p_company_id: string
          p_created_by: string
          p_description: string
          p_name: string
          p_price_base: number
          p_price_currency?: string
          p_slug: string
          p_status?: Database["public"]["Enums"]["service_status"]
        }
        Returns: {
          company_id: string
          id: string
          slug: string
          slug_changed: boolean
        }[]
      }
      user_has_permission: {
        Args: { p_permission_name: string; p_user_id: string }
        Returns: boolean
      }
      validate_attendance_link: {
        Args: {
          p_employee_id: string
          p_latitude: number
          p_link_code: string
          p_longitude: number
        }
        Returns: Json
      }
      validate_contract_outsourcing: {
        Args: { p_contract_id: string }
        Returns: boolean
      }
      validate_promoter_assignment: {
        Args: { p_contract_id: string; p_promoter_id: string }
        Returns: boolean
      }
      verify_attendance_location: {
        Args: {
          p_attendance_id: string
          p_company_id: string
          p_latitude: number
          p_longitude: number
        }
        Returns: Json
      }
      verify_invoice_system: { Args: never; Returns: Json }
      verify_signature_integrity: {
        Args: { p_signature_id: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "draft"
        | "pending_payment"
        | "paid"
        | "in_progress"
        | "delivered"
        | "completed"
        | "cancelled"
        | "disputed"
      booking_status_normalized:
        | "not_started"
        | "pending_approval"
        | "approved"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
      company_type:
        | "individual"
        | "small_business"
        | "enterprise"
        | "non_profit"
      currency_code: "USD" | "OMR" | "SAR" | "AED" | "EUR" | "GBP"
      enhanced_user_role:
        | "admin"
        | "manager"
        | "user"
        | "viewer"
        | "client"
        | "provider"
        | "super_admin"
      hr_user_role: "hr_admin" | "hr_staff" | "manager" | "employee"
      notification_priority: "low" | "medium" | "high" | "urgent"
      notification_status: "pending" | "sent" | "failed" | "read" | "archived"
      notification_type:
        | "document_expiry_reminder"
        | "document_request"
        | "bulk_notification"
        | "contract_update"
        | "general_message"
        | "urgent_alert"
      promoter_status_enum:
        | "active"
        | "available"
        | "on_leave"
        | "inactive"
        | "terminated"
      service_status: "active" | "inactive" | "draft" | "archived"
      user_role:
        | "admin"
        | "manager"
        | "user"
        | "viewer"
        | "provider"
        | "client"
        | "staff"
        | "moderator"
        | "support"
      user_status: "active" | "inactive" | "pending" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
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
      booking_status: [
        "draft",
        "pending_payment",
        "paid",
        "in_progress",
        "delivered",
        "completed",
        "cancelled",
        "disputed",
      ],
      booking_status_normalized: [
        "not_started",
        "pending_approval",
        "approved",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      company_type: [
        "individual",
        "small_business",
        "enterprise",
        "non_profit",
      ],
      currency_code: ["USD", "OMR", "SAR", "AED", "EUR", "GBP"],
      enhanced_user_role: [
        "admin",
        "manager",
        "user",
        "viewer",
        "client",
        "provider",
        "super_admin",
      ],
      hr_user_role: ["hr_admin", "hr_staff", "manager", "employee"],
      notification_priority: ["low", "medium", "high", "urgent"],
      notification_status: ["pending", "sent", "failed", "read", "archived"],
      notification_type: [
        "document_expiry_reminder",
        "document_request",
        "bulk_notification",
        "contract_update",
        "general_message",
        "urgent_alert",
      ],
      promoter_status_enum: [
        "active",
        "available",
        "on_leave",
        "inactive",
        "terminated",
      ],
      service_status: ["active", "inactive", "draft", "archived"],
      user_role: [
        "admin",
        "manager",
        "user",
        "viewer",
        "provider",
        "client",
        "staff",
        "moderator",
        "support",
      ],
      user_status: ["active", "inactive", "pending", "suspended"],
    },
  },
} as const
