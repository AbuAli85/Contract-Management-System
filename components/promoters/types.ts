import type { Promoter } from '@/lib/types';

export type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'missing';
export type OverallStatus = 'active' | 'warning' | 'critical' | 'inactive';
export type SortField = 'name' | 'status' | 'created' | 'documents';
export type SortOrder = 'asc' | 'desc';

export interface DocumentHealth {
  status: DocumentStatus;
  daysRemaining: number | null;
  expiresOn?: string | null;
  label: string;
}

export interface DashboardPromoter extends Promoter {
  displayName: string;
  assignmentStatus: 'assigned' | 'unassigned';
  organisationLabel: string;
  idDocument: DocumentHealth;
  passportDocument: DocumentHealth;
  overallStatus: OverallStatus;
  contactEmail: string;
  contactPhone: string;
  createdLabel: string;
  job_title?: string | null;
  work_location?: string | null;
  profile_picture_url?: string | null;
  id_card_expiry_date?: string | null;
  passport_expiry_date?: string | null;
}

export interface DashboardMetrics {
  total: number;
  active: number;
  critical: number;
  expiring: number;
  unassigned: number;
  companies: number;
  recentlyAdded: number;
  complianceRate: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
