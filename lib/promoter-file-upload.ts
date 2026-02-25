/**
 * Promoter File Upload Service
 *
 * Handles file uploads for promoter documents including:
 * - ID card images
 * - Passport images
 * - Profile pictures
 *
 * Features:
 * - File validation (type, size)
 * - Automatic file naming with timestamps
 * - Organized storage structure
 * - File deletion support
 * - Batch upload capabilities
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string | undefined;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string | undefined;
}

export type DocumentType = 'id_card' | 'passport' | 'profile_picture' | 'other';

// ============================================================================
// CONFIGURATION
// ============================================================================

const STORAGE_BUCKET = 'promoter-documents';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a file before upload
 */
export function validateFile(file: File): FileValidationResult {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates multiple files
 */
export function validateFiles(files: File[]): FileValidationResult {
  if (!files || files.length === 0) {
    return { valid: false, error: 'No files provided' };
  }

  for (const file of files) {
    const result = validateFile(file);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

// ============================================================================
// FILE NAMING & PATH FUNCTIONS
// ============================================================================

/**
 * Generates a unique file name with timestamp
 */
function generateFileName(
  originalName: string,
  documentType: DocumentType
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  return `${documentType}_${timestamp}_${randomStr}${extension}`;
}

/**
 * Generates the storage path for a file
 */
function generateFilePath(
  promoterId: string,
  documentType: DocumentType,
  fileName: string
): string {
  return `${promoterId}/${documentType}/${fileName}`;
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Generic document upload function
 */
export async function uploadPromoterDocument(
  file: File,
  promoterId: string,
  documentType: DocumentType
): Promise<FileUploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Initialize Supabase client
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize storage client' };
    }

    // Generate file name and path
    const fileName = generateFileName(file.name, documentType);
    const filePath = generateFilePath(promoterId, documentType, fileName);

    // Upload file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload ID card image
 */
export async function uploadIdCard(
  file: File,
  promoterId: string
): Promise<FileUploadResult> {
  return uploadPromoterDocument(file, promoterId, 'id_card');
}

/**
 * Upload passport image
 */
export async function uploadPassport(
  file: File,
  promoterId: string
): Promise<FileUploadResult> {
  return uploadPromoterDocument(file, promoterId, 'passport');
}

/**
 * Upload profile picture
 * Note: This will replace the existing profile picture
 */
export async function uploadProfilePicture(
  file: File,
  promoterId: string,
  existingUrl?: string
): Promise<FileUploadResult> {
  try {
    // Delete existing profile picture if it exists
    if (existingUrl) {
      await deletePromoterDocumentByUrl(existingUrl);
    }

    // Upload new profile picture
    return uploadPromoterDocument(file, promoterId, 'profile_picture');
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to upload profile picture',
    };
  }
}

// ============================================================================
// BATCH UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload multiple files at once
 */
export async function uploadMultipleDocuments(
  files: File[],
  promoterId: string,
  documentType: DocumentType
): Promise<FileUploadResult[]> {
  const uploadPromises = files.map(file =>
    uploadPromoterDocument(file, promoterId, documentType)
  );
  return Promise.all(uploadPromises);
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete a document by its storage path
 */
export async function deletePromoterDocument(
  filePath: string
): Promise<FileUploadResult> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize storage client' };
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete a document by its public URL
 */
export async function deletePromoterDocumentByUrl(
  publicUrl: string
): Promise<FileUploadResult> {
  try {
    // Extract the file path from the public URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const urlParts = publicUrl.split(`${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' };
    }

    const filePath = urlParts[1];
    if (!filePath) {
      return { success: false, error: 'Could not extract file path from URL' };
    }
    return deletePromoterDocument(filePath);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete document',
    };
  }
}

/**
 * Delete all documents for a promoter in a specific category
 */
export async function deletePromoterDocuments(
  promoterId: string,
  documentType: DocumentType
): Promise<FileUploadResult> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize storage client' };
    }

    // List all files in the directory
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`${promoterId}/${documentType}`);

    if (listError) {
      return { success: false, error: listError.message };
    }

    if (!files || files.length === 0) {
      return { success: true }; // No files to delete
    }

    // Delete all files
    const filePaths = files.map(
      file => `${promoterId}/${documentType}/${file.name}`
    );
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete documents',
    };
  }
}

/**
 * Delete all documents for a promoter
 */
export async function deleteAllPromoterDocuments(
  promoterId: string
): Promise<FileUploadResult> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize storage client' };
    }

    // List all files in the promoter's directory
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(promoterId, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      return { success: false, error: listError.message };
    }

    if (!files || files.length === 0) {
      return { success: true }; // No files to delete
    }

    // Recursively get all file paths
    const getAllFilePaths = async (prefix: string): Promise<string[]> => {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(prefix, { limit: 1000 });

      if (error || !data) return [];

      const paths: string[] = [];
      for (const item of data) {
        const itemPath = `${prefix}/${item.name}`;
        // Check if it's a file (has id property) vs folder
        if ((item as any).id) {
          // It's a file
          paths.push(itemPath);
        } else {
          // It's a folder, recurse
          const subPaths = await getAllFilePaths(itemPath);
          paths.push(...subPaths);
        }
      }
      return paths;
    };

    const filePaths = await getAllFilePaths(promoterId);

    if (filePaths.length === 0) {
      return { success: true };
    }

    // Delete all files
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete all documents',
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if storage bucket is accessible
 */
export async function checkStorageAccess(): Promise<boolean> {
  try {
    const supabase = createClient();
    if (!supabase) return false;
    const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET);

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(filePath: string) {
  try {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize storage client' };
    }
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(filePath);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get file metadata',
    };
  }
}
