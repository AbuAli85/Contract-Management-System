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
      alert_on_failed_webhooks: { Args: never; Returns: undefined }
      auto_generate_daily_attendance_links: { Args: never; Returns: undefined }
      can_view_profile: { Args: { profile_id: string }; Returns: boolean }
      check_email_exists: { Args: { email_to_check: string }; Returns: boolean }
      check_overdue_milestones: { Args: never; Returns: undefined }
      cleanup_expired_sessions: { Args: never; Returns: number }
      cleanup_old_notifications: { Args: never; Returns: number }
      count_promoters_with_active_contracts: { Args: never; Returns: number }
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
      delete_milestone: { Args: { milestone_id: string }; Returns: undefined }
      delete_task: { Args: { task_id: string }; Returns: undefined }
      ensure_user_profile: { Args: { user_id: string }; Returns: undefined }
      fn_auto_generate_insights: { Args: never; Returns: undefined }
      generate_attendance_link_code: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_work_permit_application_number: { Args: never; Returns: string }
      generate_work_permit_renewal_number: { Args: never; Returns: string }
      get_invoice_details: { Args: { p_invoice_id: string }; Returns: Json }
      get_status_display_info: { Args: { status: string }; Returns: Json }
      get_user_dashboard_layout: { Args: { p_user_id: string }; Returns: Json }
      get_user_primary_role: { Args: { user_uuid: string }; Returns: string }
      get_user_primary_role_v2: { Args: { user_uuid: string }; Returns: string }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_booking_approved: { Args: { booking_id: string }; Returns: boolean }
      is_booking_requester: { Args: { p_booking_id: string }; Returns: boolean }
      is_client: { Args: never; Returns: boolean }
      is_client_of_booking: { Args: { b_id: string }; Returns: boolean }
      is_invoiceable_status: { Args: { s: string }; Returns: boolean }
      is_provider: { Args: never; Returns: boolean }
      is_provider_of_booking: { Args: { b_id: string }; Returns: boolean }
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
      process_profile_creation_webhooks: { Args: never; Returns: number }
      prune_webhook_logs: { Args: never; Returns: undefined }
      rbac_refresh_user_permissions_mv: { Args: never; Returns: undefined }
      record_daily_metrics: { Args: never; Returns: undefined }
      refresh_booking_progress_analytics: { Args: never; Returns: undefined }
      refresh_mv_bucket_kpis: { Args: never; Returns: undefined }
      refresh_mv_buckets: { Args: never; Returns: undefined }
      refresh_user_permissions: { Args: never; Returns: undefined }
      refresh_user_permissions_cache: { Args: never; Returns: undefined }
      slugify: { Args: { src: string }; Returns: string }
      start_time_tracking: { Args: { p_task_id: string }; Returns: Json }
      stop_time_tracking: { Args: { p_task_id: string }; Returns: Json }
      sync_party_to_company: { Args: { p_party_id: string }; Returns: string }
      test_webhook: { Args: { webhook_name: string }; Returns: string }
      trigger_manual_insight_generation: { Args: never; Returns: Json }
      unaccent: { Args: { "": string }; Returns: string }
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
      update_overdue_status: { Args: never; Returns: undefined }
      update_overdue_tasks: { Args: never; Returns: undefined }
      verify_invoice_system: { Args: never; Returns: Json }
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
