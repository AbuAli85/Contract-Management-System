// Document Management Components
export { CompanyDocumentUpload } from './company-document-upload';
export { ExpiryTracker } from './expiry-tracker';
export { DocumentDashboard } from './document-dashboard';

// Re-export document service types for convenience
export type {
  CompanyDocument,
  DocumentExpiryStatus,
  ExpiryStatistics,
  DocumentUploadProgress,
  DocumentServiceResponse,
} from '@/lib/document-service';
