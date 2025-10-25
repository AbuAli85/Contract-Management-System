export interface Party {
  id: string;
  name_en: string;
  name_ar: string;
  crn: string;
  type?: 'Employer' | 'Client' | 'Generic' | null;
  role?: string | null;
  cr_expiry?: string | null; // Changed from cr_expiry_date to match database
  cr_expiry_date?: string | null; // Keep for backward compatibility
  cr_status?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address_en?: string | null;
  tax_number?: string | null;
  license_number?: string | null;
  license_expiry?: string | null;
  license_status?: string | null;
  status?: string | null;
  overall_status?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  owner_id?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  total_contracts?: number;
  active_contracts?: number;
}

export interface Promoter {
  id: string;
  name_en: string;
  name_ar: string;
  id_card_number: string;
  id_card_url?: string | null;
  passport_url?: string | null;
  status?: string | null;
  id_card_expiry_date?: string | null;
  passport_expiry_date?: string | null;
  notify_days_before_id_expiry?: number | null;
  notify_days_before_passport_expiry?: number | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  active_contracts_count?: number;
  employer_id?: string | null;
  outsourced_to_id?: string | null;
  job_title?: string | null;
  work_location?: string | null;
  contract_valid_until?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile_number?: string | null;
  nationality?: string | null;
  profile_picture_url?: string | null;
  passport_number?: string | null;

  // Personal Information
  date_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;

  // Document Information
  visa_number?: string | null;
  visa_expiry_date?: string | null;
  work_permit_number?: string | null;
  work_permit_expiry_date?: string | null;

  // Professional Information
  company?: string | null;
  department?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  education_level?: string | null;
  university?: string | null;
  graduation_year?: number | null;
  skills?: string | null;
  certifications?: string | null;

  // Financial Information
  bank_name?: string | null;
  account_number?: string | null;
  iban?: string | null;
  swift_code?: string | null;
  tax_id?: string | null;

  // Preferences and Ratings
  rating?: number | null;
  availability?: string | null;
  preferred_language?: string | null;
  timezone?: string | null;
  special_requirements?: string | null;

  // Address Information
  address?: string | null;
  national_id?: string | null;
  crn?: string | null;

  // Legacy fields for backward compatibility
  name?: string;
  zip_code?: string;
  bio?: string;
  tags?: string[];
  parties?: { name_en: string; name_ar: string } | null;
}

export interface Contract {
  id: string;
  created_at: string;
  updated_at?: string | null;
  contract_number?: string | null;
  is_current?: boolean | null;
  pdf_url?: string | null;
  google_doc_url?: string | null;
  error_details?: string | null;
  user_id?: string | null;
  first_party_id: string;
  second_party_id: string;
  promoter_id: string;
  contract_valid_from?: string | null;
  contract_valid_until?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  contract_value?: number | null;
  job_title?: string | null;
  status?: string | null;
  work_location?: string | null;
  email?: string | null;
  contract_name?: string | null;
  party_a?: string | null;
  party_b?: string | null;
  contract_type?: string | null;
  terms?: string | null;
  department?: string | null;
  currency?: 'USD' | 'OMR' | 'SAR' | 'AED' | 'EUR' | 'GBP' | null;
  end_date?: string | null;
  duration?: string | null;
  parties?: Party[] | null;
  party?: Party | null;
  promoter?: Promoter | null;
  promoters?: Promoter[] | null;
  first_party?: Party | null;
  second_party?: Party | null;
  employer?: Party | null;
  client?: Party | null;
  title?: string | null;
  start_date?: string | null;
  total_value?: number | null;
  promoter_name_ar?: string | null;
  promoter_name_en?: string | null;
  first_party_name_en?: string | null;
  first_party_name_ar?: string | null;
  second_party_name_en?: string | null;
  second_party_name_ar?: string | null;
  id_card_number?: string | null;
  salary?: number | null;
  employer_id?: string | null;
  client_id?: string | null;
}

export interface ContractDetail extends Contract {
  // This can be used to enforce non-optional properties for detail views
  // For now, it will just be an alias for Contract
}

export interface SimpleContract extends Contract {
  // This can be used for simpler contract views
  // For now, it will just be an alias for Contract
}

export interface PromoterProfile extends Promoter {}

export interface ContractRecord {
  id: string;
  created_at?: string | null;
  first_party_name_en?: string | null;
  second_party_name_en?: string | null;
  promoter_name_en?: string | null;
  status?: string | null;
  google_doc_url?: string | null;
  error_details?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
}

export interface BilingualPdfData {
  first_party_name_en?: string | null;
  first_party_name_ar?: string | null;
  first_party_crn?: string | null;
  second_party_name_en?: string | null;
  second_party_name_ar?: string | null;
  second_party_crn?: string | null;
  promoter_name_en?: string | null;
  promoter_name_ar?: string | null;
  id_card_number?: string | null;
  promoter_id_card_url?: string | null;
  promoter_passport_url?: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  job_title?: string | null;
  work_location?: string | null;
  email: string | null;
  contract_number?: string | null;
  pdf_url?: string | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
  user_id?: string;
  metadata?: unknown;
}

export interface PartyNote {
  id: string;
  party_id: string;
  user_id: string;
  note: string;
  created_at: string;
}

export interface PartyTag {
  id: string;
  party_id: string;
  tag: string;
  created_at: string;
}

export interface PartyActivity {
  id: string;
  party_id: string;
  user_id?: string;
  activity_type: string;
  details: string;
  created_at: string;
}

export interface PartyFile {
  id: string;
  party_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export type ContractStatus =
  | 'draft'
  | 'pending'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'failed'
  | 'generating';

export interface PromoterSkill {
  id: string;
  promoter_id: string;
  skill: string;
  level?: string | null;
  created_at?: string;
}

export interface PromoterExperience {
  id: string;
  promoter_id: string;
  company: string;
  role: string;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  created_at?: string;
}

export interface PromoterEducation {
  id: string;
  promoter_id: string;
  degree: string;
  institution: string;
  year?: number | null;
  created_at?: string;
}

export interface PromoterDocument {
  id: string;
  promoter_id: string;
  type: string;
  url: string;
  description?: string | null;
  uploaded_on?: string;
  version?: number;
}

export interface PromoterAttendanceLog {
  id: string;
  promoter_id: string;
  date: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  status: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PromoterLeaveRequest {
  id: string;
  promoter_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PromoterAttendanceSettings {
  id: string;
  promoter_id: string;
  work_schedule?: any; // JSONB object
  timezone?: string;
  auto_checkout_hours?: number;
  late_threshold_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PromoterPerformanceMetric {
  id: string;
  promoter_id: string;
  metric_type: string;
  value: number;
  period_start: string;
  period_end: string;
  target_value?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string | null;
  template_type: string;
  query_template?: string | null;
  parameters?: any;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GeneratedReport {
  id: string;
  template_id?: string | null;
  promoter_id?: string | null;
  report_name: string;
  report_data?: any;
  file_url?: string | null;
  generated_by?: string | null;
  generated_at?: string;
  parameters?: any;
}

export interface ReportSchedule {
  id: string;
  template_id?: string | null;
  promoter_id?: string | null;
  schedule_type: string;
  schedule_config?: any;
  is_active?: boolean;
  last_run?: string | null;
  next_run?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PromoterScore {
  id: string;
  promoter_id: string;
  score_type: string;
  score_value: number;
  max_score?: number;
  period_start: string;
  period_end: string;
  calculated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PromoterBadge {
  id: string;
  promoter_id: string;
  badge_type: string;
  badge_name: string;
  badge_description?: string | null;
  badge_icon?: string | null;
  earned_at?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface PromoterFeedback {
  id: string;
  promoter_id: string;
  reviewer_id?: string | null;
  feedback_type: string;
  rating?: number | null;
  feedback_text?: string | null;
  strengths?: string[] | null;
  areas_for_improvement?: string[] | null;
  is_anonymous?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PromoterLeaderboard {
  id: string;
  leaderboard_type: string;
  period_start: string;
  period_end: string;
  leaderboard_data?: any;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AchievementRule {
  id: string;
  rule_name: string;
  rule_description?: string | null;
  badge_type: string;
  criteria?: any;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PromoterScoreHistory {
  id: string;
  promoter_id: string;
  score_type: string;
  old_score?: number | null;
  new_score?: number | null;
  change_reason?: string | null;
  changed_at?: string;
  created_at?: string;
}

export interface PromoterCommunication {
  id: string;
  promoter_id: string;
  type: string;
  subject?: string | null;
  description?: string | null;
  communication_time: string;
  participants?: any[];
  outcome?: string | null;
  status?: string;
  attachments?: { file_url: string; file_name: string }[];
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PromoterTask {
  id: string;
  promoter_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status?: string;
  priority?: string;
  assigned_to?: string | null;
  related_communication?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PromoterNote {
  id: string;
  promoter_id: string;
  content: string;
  note_time?: string;
  author?: string | null;
  related_communication?: string | null;
  related_task?: string | null;
  visibility?: string;
  created_at?: string;
  updated_at?: string;
}
