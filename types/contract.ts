export interface ContractDetail {
  id: string;
  status: string; // Make required to match usage
  created_at?: string;
  updated_at?: string;
  contract_start_date?: string | null; // Allow null to match ContractWithRelations
  contract_end_date?: string | null; // Allow null to match ContractWithRelations
  job_title?: string | null;
  work_location?: string | null;
  email?: string | null;
  contract_number?: string | null;
  id_card_number?: string | null;
  first_party_id?: string | null;
  second_party_id?: string | null;
  promoter_id?: string | null;
  first_party_name_en?: string | null;
  first_party_name_ar?: string | null;
  second_party_name_en?: string | null;
  second_party_name_ar?: string | null;
  google_doc_url?: string | null;
  pdf_url?: string | null;
  error_details?: string | null;
  salary?: number | null;
  currency?: string | null;
  contract_type?: string | null;
  department?: string | null;
  // Additional fields for compatibility
  approval_status?: string | null;
  contract_value?: number | null;
  // New structure from query with relationships
  first_party?: {
    id: string;
    name_en: string;
    name_ar: string | null;
    crn?: string | null;
    type?: 'Employer' | 'Client' | 'Generic' | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  second_party?: {
    id: string;
    name_en: string;
    name_ar: string | null;
    crn?: string | null;
    type?: 'Employer' | 'Client' | 'Generic' | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  promoters?: {
    id: string;
    name_en: string;
    name_ar: string | null;
    id_card_number: string | null;
    id_card_url?: string | null;
    passport_url?: string | null;
    status?: string | null;
    email?: string | null;
    mobile_number?: string | null;
    job_title?: string | null;
  } | null;
  // Single promoter for backward compatibility
  promoter?: {
    id: string;
    name_en: string;
    name_ar?: string | null;
    email?: string | null;
    phone?: string | null;
    id_card_number?: string | null;
    id_card_url?: string | null;
    passport_url?: string | null;
    status?: string | null;
  } | null;
  // Legacy fields for backward compatibility
  employer?: Party;
  client?: Party;
}

export interface Party {
  id?: string;
  name_en: string;
  name_ar?: string;
  crn?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Promoter {
  id: string;
  name_en: string;
  name_ar?: string;
  id_card_number?: string;
  email?: string;
  phone?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
  user_id?: string;
  metadata?: unknown;
}
