/**
 * Promoter Documents Service
 * Handles CRUD operations for promoter documents via API
 */

export interface PromoterDocument {
  id: string;
  promoter_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentPayload {
  document_type: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
}

export interface UpdateDocumentPayload {
  documentId: string;
  document_type?: string;
  file_name?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
}

export class PromoterDocumentsService {
  /**
   * Fetch all documents for a promoter
   */
  static async getDocuments(promoterId: string): Promise<PromoterDocument[]> {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch documents');
      }

      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  /**
   * Create a new document
   */
  static async createDocument(
    promoterId: string,
    payload: CreateDocumentPayload
  ): Promise<PromoterDocument> {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create document');
      }

      const data = await response.json();
      return data.document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Update an existing document
   */
  static async updateDocument(
    promoterId: string,
    payload: UpdateDocumentPayload
  ): Promise<PromoterDocument> {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/documents`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update document');
      }

      const data = await response.json();
      return data.document;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(
    promoterId: string,
    documentId: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `/api/promoters/${promoterId}/documents?documentId=${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Delete a document (alternative with body payload)
   */
  static async deleteDocumentWithBody(
    promoterId: string,
    documentId: string
  ): Promise<void> {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/documents`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Upload a file to Supabase storage and create document record
   */
  static async uploadDocument(
    promoterId: string,
    file: File,
    documentType: string,
    notes?: string
  ): Promise<PromoterDocument> {
    try {
      // Import dynamically to avoid SSR issues
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      if (!supabase) {
        throw new Error('Failed to create Supabase client');
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${promoterId}/${documentType}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('promoter-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('promoter-documents').getPublicUrl(fileName);

      // Create document record with proper type handling
      const payload: CreateDocumentPayload = {
        document_type: documentType,
        file_name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
      };

      // Only add notes if provided
      if (notes !== undefined) {
        payload.notes = notes;
      }

      const document = await this.createDocument(promoterId, payload);

      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Delete document and its file from storage
   */
  static async deleteDocumentWithFile(
    promoterId: string,
    documentId: string,
    filePath?: string
  ): Promise<void> {
    try {
      // Delete from database first
      await this.deleteDocument(promoterId, documentId);

      // Try to delete file from storage (if path is provided)
      if (filePath) {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();

          if (!supabase) {
            console.warn(
              'Failed to create Supabase client for storage deletion'
            );
            return;
          }

          // Extract file path from URL
          const urlParts = filePath.split('/');
          const storageFileName = urlParts[urlParts.length - 1];

          if (storageFileName) {
            await supabase.storage
              .from('promoter-documents')
              .remove([storageFileName]);
          }
        } catch (storageError) {
          console.warn('Could not delete file from storage:', storageError);
          // Don't throw error if storage deletion fails
        }
      }
    } catch (error) {
      console.error('Error deleting document with file:', error);
      throw error;
    }
  }
}

// Export convenience functions
export const getPromoterDocuments = PromoterDocumentsService.getDocuments;
export const createPromoterDocument = PromoterDocumentsService.createDocument;
export const updatePromoterDocument = PromoterDocumentsService.updateDocument;
export const deletePromoterDocument = PromoterDocumentsService.deleteDocument;
export const uploadPromoterDocument = PromoterDocumentsService.uploadDocument;
