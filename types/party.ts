// Enhanced Party types with comprehensive error handling
export interface Party {
  id: string;
  name_en: string;
  name_ar: string;
  crn?: string;
  type: 'Employer' | 'Client' | 'Generic';
  role?: string;
  cr_expiry?: string; // Database field name
  cr_expiry_date?: string; // Deprecated - use cr_expiry
  cr_status?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  address_en?: string;
  address_ar?: string;
  tax_number?: string;
  license_number?: string;
  license_expiry?: string; // Database field name
  license_expiry_date?: string; // Deprecated - use license_expiry
  license_status?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  overall_status?: string;
  notes?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  total_contracts?: number;
  active_contracts?: number;
}

// Enhanced error types for better error handling
export interface ApiError {
  message: string;
  status?: number;
  details?: any;
  isTimeout?: boolean;
  isNetworkError?: boolean;
  isAuthError?: boolean;
  isServerError?: boolean;
  isDatabaseError?: boolean;
  originalError?: any;
}

// Enhanced response types
export interface PartiesResponse {
  success: boolean;
  parties: Party[];
  count: number;
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
  _meta?: {
    requestId?: string;
    duration?: string;
    authAttempts?: number;
    queryAttempts?: number;
    breakdown?: {
      auth?: string;
      query?: string;
    };
  };
}

export interface PartyResponse {
  success: boolean;
  party: Party;
  timestamp: string;
}

// Error response types
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
  _meta?: {
    requestId?: string;
    duration?: string;
    timestamp?: string;
  };
}

// Query options for React Query
export interface PartiesQueryOptions {
  retry?: boolean | number | ((failureCount: number, error: Error) => boolean);
  retryDelay?: number | ((retryAttempt: number, error: Error) => number);
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}

// Party input types for forms
export interface PartyInput {
  name_en: string;
  name_ar: string;
  crn?: string;
  type?: 'Employer' | 'Client' | 'Generic';
  role?: string;
  cr_expiry?: string;
  cr_expiry_date?: string; // Deprecated - use cr_expiry
  cr_status?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  address_en?: string;
  address_ar?: string;
  tax_number?: string;
  license_number?: string;
  license_expiry?: string;
  license_expiry_date?: string; // Deprecated - use license_expiry
  license_status?: string;
  status?: 'Active' | 'Inactive' | 'Suspended';
  overall_status?: string;
  notes?: string;
}

// Enhanced Party interface for UI
export interface EnhancedParty extends Party {
  cr_status: 'valid' | 'expiring' | 'expired' | 'missing';
  license_status: 'valid' | 'expiring' | 'expired' | 'missing';
  overall_status: 'active' | 'warning' | 'critical' | 'inactive';
  days_until_cr_expiry?: number;
  days_until_license_expiry?: number;
  contract_count?: number;
}

// Statistics interface
export interface PartyStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  expiring_documents: number;
  expired_documents: number;
  employers: number;
  clients: number;
  total_contracts: number;
}

// Mutation result types
export interface CreatePartyResult {
  success: boolean;
  party: Party;
  error?: string;
}

export interface UpdatePartyResult {
  success: boolean;
  party: Party;
  error?: string;
}

export interface DeletePartyResult {
  success: boolean;
  error?: string;
}

// Bulk operation types
export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

export interface BulkDeleteResult extends BulkOperationResult {
  deletedIds: string[];
}

// Filter and sort types
export interface PartyFilters {
  search?: string;
  status?: string;
  type?: string;
  documentStatus?: string;
}

export interface PartySortOptions {
  field: 'name' | 'cr_expiry_date' | 'license_expiry_date' | 'contracts' | 'created_at';
  order: 'asc' | 'desc';
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: PartyFilters;
  sort?: PartySortOptions;
  fields?: (keyof Party)[];
}

export interface ExportResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}
