import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CompanyDocument {
  id: string;
  company_id: string;
  document_type:
    | 'commercial_registration'
    | 'business_license'
    | 'tax_certificate'
    | 'insurance'
    | 'logo'
    | 'other';
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  expiry_date?: string;
  uploaded_by: string;
  status: 'active' | 'expired' | 'expiring' | 'invalid';
  created_at: string;
  updated_at: string;
  metadata?: {
    document_number?: string;
    issuing_authority?: string;
    description?: string;
  };
  // Flattened metadata properties for easier access
  document_number?: string;
  issuing_authority?: string;
  description?: string;
}

// Document expiry status type
export type DocumentExpiryStatus =
  | 'expired'
  | 'expiring_soon'
  | 'expiring'
  | 'valid'
  | 'no_expiry';

// Expiry statistics interface
export interface ExpiryStatistics {
  total: number;
  expired: number;
  expiringSoon: number;
  expiring: number;
  valid: number;
  noExpiry: number;
}

export interface DocumentUploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

export interface DocumentServiceResponse {
  data?: CompanyDocument | CompanyDocument[];
  error?: string;
  message?: string;
}

/**
 * Document Service for managing company documents, uploads, and expiry tracking
 */
export class DocumentService {
  /**
   * Upload document to Supabase Storage with metadata
   */
  static async uploadDocument(
    file: File,
    companyId: string,
    documentType: CompanyDocument['document_type'],
    metadata?: {
      expiryDate?: Date;
      documentNumber?: string;
      issuingAuthority?: string;
      description?: string;
    },
    onProgress?: (progress: DocumentUploadProgress) => void
  ): Promise<DocumentServiceResponse> {
    try {
      // Input validation
      if (!file || !companyId || !documentType) {
        throw new Error('File, company ID, and document type are required');
      }

      // File size validation (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      // File type validation
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          'Invalid file type. Only PDF and image files are allowed'
        );
      }

      onProgress?.({
        progress: 10,
        status: 'uploading',
        message: 'Starting upload...',
      });

      // Generate unique file name
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${companyId}/${documentType}/${timestamp}_${cleanFileName}`;

      onProgress?.({
        progress: 20,
        status: 'uploading',
        message: 'Uploading file...',
      });

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      onProgress?.({
        progress: 60,
        status: 'processing',
        message: 'Processing file...',
      });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-documents')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get file URL');
      }

      onProgress?.({
        progress: 80,
        status: 'processing',
        message: 'Saving document record...',
      });

      // Prepare document metadata
      const documentMetadata = {
        document_number: metadata?.documentNumber,
        issuing_authority: metadata?.issuingAuthority,
        description: metadata?.description,
      };

      // Save document record to database
      const { data: docData, error: docError } = await supabase
        .from('company_documents')
        .insert({
          company_id: companyId,
          document_type: documentType,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          expiry_date: metadata?.expiryDate?.toISOString() || null,
          metadata: documentMetadata,
          status: 'active',
          uploaded_by: 'current_user', // This should be replaced with actual user ID
        })
        .select()
        .single();

      if (docError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('company-documents').remove([fileName]);

        throw docError;
      }

      onProgress?.({
        progress: 100,
        status: 'completed',
        message: 'Upload completed successfully!',
      });

      return {
        data: {
          ...docData,
          document_number: documentMetadata.document_number,
          issuing_authority: documentMetadata.issuing_authority,
          description: documentMetadata.description,
        },
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      onProgress?.({
        progress: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });

      return {
        error:
          error instanceof Error ? error.message : 'Failed to upload document',
      };
    }
  }

  /**
   * Get documents by company ID
   */
  static async getDocumentsByCompany(
    companyId: string
  ): Promise<DocumentServiceResponse> {
    try {
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Flatten metadata for easier access
      const documentsWithMetadata =
        data?.map(doc => ({
          ...doc,
          document_number: doc.metadata?.document_number,
          issuing_authority: doc.metadata?.issuing_authority,
          description: doc.metadata?.description,
        })) || [];

      return { data: documentsWithMetadata };
    } catch (error) {
      console.error('Error fetching documents by company:', error);
      return {
        error:
          error instanceof Error ? error.message : 'Failed to fetch documents',
      };
    }
  }

  /**
   * Get all documents with expiry information (admin view)
   */
  static async getAllDocumentsWithExpiry(): Promise<DocumentServiceResponse> {
    try {
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .order('expiry_date', { ascending: true, nullsFirst: false });

      if (error) {
        throw error;
      }

      // Flatten metadata for easier access
      const documentsWithMetadata =
        data?.map(doc => ({
          ...doc,
          document_number: doc.metadata?.document_number,
          issuing_authority: doc.metadata?.issuing_authority,
          description: doc.metadata?.description,
        })) || [];

      return { data: documentsWithMetadata };
    } catch (error) {
      console.error('Error fetching all documents with expiry:', error);
      return {
        error:
          error instanceof Error ? error.message : 'Failed to fetch documents',
      };
    }
  }

  /**
   * Get expiry status based on expiry date
   */
  static getExpiryStatus(expiryDate: string | null): DocumentExpiryStatus {
    if (!expiryDate) return 'no_expiry';

    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'expiring_soon';
    if (diffDays <= 30) return 'expiring';
    return 'valid';
  }

  /**
   * Get expiry statistics
   */
  static async getExpiryStatistics(
    companyId?: string
  ): Promise<{ data?: ExpiryStatistics; error?: string }> {
    try {
      let query = supabase.from('company_documents').select('expiry_date');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const stats: ExpiryStatistics = {
        total: data?.length || 0,
        expired: 0,
        expiringSoon: 0,
        expiring: 0,
        valid: 0,
        noExpiry: 0,
      };

      data?.forEach(doc => {
        const status = this.getExpiryStatus(doc.expiry_date);
        switch (status) {
          case 'expired':
            stats.expired++;
            break;
          case 'expiring_soon':
            stats.expiringSoon++;
            break;
          case 'expiring':
            stats.expiring++;
            break;
          case 'valid':
            stats.valid++;
            break;
          case 'no_expiry':
            stats.noExpiry++;
            break;
        }
      });

      return { data: stats };
    } catch (error) {
      console.error('Error getting expiry statistics:', error);
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get expiry statistics',
      };
    }
  }

  /**
   * Send expiry notification
   */
  static async sendExpiryNotification(
    documentId: string
  ): Promise<DocumentServiceResponse> {
    try {
      // This would integrate with your notification system
      return { message: 'Notification sent successfully' };
    } catch (error) {
      console.error('Error sending expiry notification:', error);
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send notification',
      };
    }
  }

  /**
   * Download document
   */
  static async downloadDocument(documentId: string): Promise<void> {
    try {
      const { data: doc, error: docError } = await supabase
        .from('company_documents')
        .select('file_url, file_name')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        throw new Error('Document not found');
      }

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = doc.file_url;
      link.download = doc.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }
}
