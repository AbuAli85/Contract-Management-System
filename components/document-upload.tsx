'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  Eye,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface DocumentUploadProps {
  promoterId: string;
  promoterName?: string; // Add promoter name prop
  idCardNumber?: string; // Add ID card number
  passportNumber?: string; // Add passport number
  documentType: 'id_card' | 'passport';
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onDelete: () => void;
}

interface UploadedDocument {
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export default function DocumentUpload({
  promoterId,
  promoterName,
  idCardNumber,
  passportNumber,
  documentType,
  currentUrl,
  onUploadComplete,
  onDelete,
}: DocumentUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocument, setUploadedDocument] =
    useState<UploadedDocument | null>(
      currentUrl && currentUrl.trim() !== ''
        ? {
            url: currentUrl,
            name: `${documentType}_document`,
            size: 0,
            type: 'application/pdf',
            uploadedAt: new Date().toISOString(),
          }
        : null
    );

  const documentLabels = {
    id_card: {
      title: 'ID Card Document',
      description: 'Upload a clear copy of the ID card',
      accept: '.jpg,.jpeg,.png,.pdf',
      maxSize: 5 * 1024 * 1024, // 5MB
    },
    passport: {
      title: 'Passport Document',
      description: 'Upload a clear copy of the passport',
      accept: '.jpg,.jpeg,.png,.pdf',
      maxSize: 5 * 1024 * 1024, // 5MB
    },
  };

  const config = documentLabels[documentType];

  // Helper function to create clean filename
  const createCleanFilename = (file: File): string => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';

    // Clean promoter name - remove special characters and spaces
    let cleanPromoterName = 'Unknown_Promoter';

    if (
      promoterName &&
      promoterName.trim() !== '' &&
      promoterName !== 'Unknown'
    ) {
      cleanPromoterName = promoterName
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, '_') // Replace special chars with underscore
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, '') // Remove leading/trailing underscores
        .substring(0, 50); // Increased length limit for full names
    }

    // Create filename based on document type: {name_en}_{id_card_number/passport_number}.ext
    let documentNumber = '';

    if (documentType === 'id_card') {
      documentNumber =
        idCardNumber && idCardNumber.trim() !== ''
          ? idCardNumber.trim().replace(/[^a-zA-Z0-9]/g, '_')
          : 'NO_ID';
    } else if (documentType === 'passport') {
      documentNumber =
        passportNumber && passportNumber.trim() !== ''
          ? passportNumber.trim().replace(/[^a-zA-Z0-9]/g, '_')
          : 'NO_PASSPORT';
    }

    // User requested exact format: {name_en}_{document_number}.ext (no timestamp)
    return `${cleanPromoterName}_${documentNumber}.${fileExt}`;
  };

  // Update uploadedDocument when currentUrl changes
  useEffect(() => {
    if (currentUrl && currentUrl.trim() !== '') {
      setUploadedDocument({
        url: currentUrl,
        name: `${documentType}_document`,
        size: 0,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      });
    } else {
      setUploadedDocument(null);
    }
  }, [currentUrl, documentType]);

  // Fetch promoter name if not provided and we have a valid promoter ID
  useEffect(() => {
    const fetchPromoterName = async () => {
      if (!promoterName || promoterName === 'Unknown') {
        if (promoterId && promoterId !== 'new' && promoterId !== '') {
          try {
            const supabase = createClient();
            const { data, error } = await supabase
              .from('promoters')
              .select('name_en, id_card_number')
              .eq('id', promoterId)
              .single();

            if (data && !error) {
              // We'll store this in a ref or state for use in filename generation
              // For now, we'll log it and use it when creating filenames
            } else {
            }
          } catch (err) {}
        }
      }
    };

    fetchPromoterName();
  }, [promoterId, promoterName]);

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or PDF file';
    }

    // Check file size
    if (file.size > config.maxSize) {
      return `File size must be less than ${config.maxSize / (1024 * 1024)}MB`;
    }

    return null;
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      // Prevent multiple simultaneous uploads
      if (uploading) {
        return;
      }

      // Debug: Log the values being used for filename generation

      // Additional debug: Check if values are empty/undefined/null

      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: 'Invalid file',
          description: validationError,
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);
      setUploadProgress(5); // Start at 5% to show upload has begun

      // Start progress simulation immediately for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) {
            return 85; // Cap at 85% until upload completes
          }
          return prev + 5;
        });
      }, 200);

      try {
        const supabase = createClient();
        if (!supabase) {
          clearInterval(progressInterval);
          throw new Error(
            'Database connection unavailable. Please refresh the page.'
          );
        }

        // Check if user is authenticated
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          clearInterval(progressInterval);
          throw new Error(
            'Your session has expired. Please log in again to upload files.'
          );
        }

        // Create a unique filename with promoter name and ID
        const fileName = createCleanFilename(file);
        const filePath = `${fileName}`; // Store directly in bucket root for now

        // Upload file to Supabase Storage with explicit content type
        const { data, error } = await supabase.storage
          .from('promoter-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Allow overwriting files
            contentType: file.type, // Explicitly set the content type
          });

        clearInterval(progressInterval);

        if (error) {
          // If direct upload fails, try using the upload API route

          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('promoterId', promoterId);
            formData.append('promoterName', promoterName || 'Unknown');
            formData.append('idCardNumber', idCardNumber || '');
            formData.append('passportNumber', passportNumber || '');
            formData.append('documentType', documentType);

            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response
                .json()
                .catch(() => ({ error: 'Network error' }));
              throw new Error(
                errorData.error ||
                  `Upload failed with status ${response.status}`
              );
            }

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.error || 'Upload failed');
            }

            setUploadProgress(100);

            const uploadedDoc: UploadedDocument = {
              url: result.url,
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString(),
            };

            setUploadedDocument(uploadedDoc);
            onUploadComplete(result.url);

            toast({
              title: 'Document uploaded successfully',
              description: `${file.name} has been uploaded via secure API`,
            });

            return;
          } catch (apiError) {
            console.error('API upload also failed:', apiError);
            // Continue to the original error handling below
            throw apiError;
          }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('promoter-documents')
          .getPublicUrl(filePath);

        setUploadProgress(100);

        const uploadedDoc: UploadedDocument = {
          url: urlData.publicUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        };

        setUploadedDocument(uploadedDoc);
        onUploadComplete(urlData.publicUrl);

        toast({
          title: 'Document uploaded successfully',
          description: `${file.name} has been uploaded`,
        });
      } catch (error) {
        clearInterval(progressInterval);
        console.error('Error uploading document:', error);

        let errorMessage = 'Failed to upload document';
        let helpMessage = '';

        if (error instanceof Error) {
          if (
            error.message.includes('bucket') &&
            error.message.includes('not found')
          ) {
            errorMessage = "Storage bucket 'promoter-documents' not found";
            helpMessage = `⚠️ SETUP REQUIRED: Please create the storage bucket manually:

1. Go to Supabase Dashboard > Storage
2. Click "New bucket" 
3. Name: "promoter-documents"
4. Public: false (unchecked)
5. File size limit: 5MB
6. Allowed types: image/jpeg, image/png, application/pdf
7. Click "Create bucket"

Alternatively, run this SQL in SQL Editor:
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('promoter-documents', 'promoter-documents', false, 5242880);`;
          } else if (
            error.message.includes('bucket') ||
            error.message.includes('storage')
          ) {
            errorMessage = 'Storage configuration issue';
            helpMessage =
              'Please contact administrator to set up document storage properly.';
          } else if (
            error.message.includes('permission') ||
            error.message.includes('unauthorized')
          ) {
            errorMessage = 'Permission denied';
            helpMessage =
              'Please check your access rights or contact administrator.';
          } else if (
            error.message.includes('row-level security') ||
            error.message.includes('RLS')
          ) {
            errorMessage = 'Access denied due to security policy';
            helpMessage =
              'Please ensure you are properly authenticated or contact administrator to configure storage policies.';
          } else if (error.message.includes('new row violates')) {
            errorMessage = 'Storage access denied';
            helpMessage =
              'Please contact administrator to configure storage permissions properly.';
          } else if (
            error.message.includes('mime type') &&
            error.message.includes('not supported')
          ) {
            errorMessage = 'File type not supported';
            helpMessage =
              'Please upload only: JPEG, PNG, PDF files. Current file type is not allowed.';
          } else {
            errorMessage = error.message;
          }
        }

        toast({
          title: 'Upload failed',
          description: helpMessage
            ? `${errorMessage}. ${helpMessage}`
            : errorMessage,
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [promoterId, documentType, config.maxSize, toast, onUploadComplete]
  );

  const handleDelete = async () => {
    if (!uploadedDocument) return;

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to create Supabase client');
      }

      // Extract file path from URL
      const urlParts = uploadedDocument.url.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get the last two parts

      // Delete from storage
      const { error } = await supabase.storage
        .from('promoter-documents')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      setUploadedDocument(null);
      onDelete();

      toast({
        title: 'Document deleted',
        description: 'Document has been removed successfully',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Delete failed',
        description:
          error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault(); // Prevent any form submission
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleUploadClick = (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent form submission
    event.stopPropagation(); // Stop event bubbling

    // Try using ref first, then fallback to getElementById
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      const fileInput = document.getElementById(
        `${documentType}-upload`
      ) as HTMLInputElement;

      if (fileInput) {
        fileInput.click();
      } else {
        console.error(`File input not found for ID: ${documentType}-upload`);
      }
    }
  };

  const handleReplaceClick = (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent form submission
    event.stopPropagation(); // Stop event bubbling

    // Try using ref first, then fallback to getElementById
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      const fileInput = document.getElementById(
        `${documentType}-upload`
      ) as HTMLInputElement;

      if (fileInput) {
        fileInput.click();
      } else {
        console.error(`File input not found for ID: ${documentType}-upload`);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5' />
              {config.title}
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <Badge variant={uploadedDocument ? 'default' : 'secondary'}>
            {uploadedDocument ? 'Uploaded' : 'Not Uploaded'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {uploadedDocument ? (
          // Show uploaded document
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 border rounded-lg bg-gray-50'>
              <div className='flex items-center gap-3'>
                <FileText className='h-8 w-8 text-blue-600' />
                <div>
                  <p className='font-medium'>{uploadedDocument.name}</p>
                  <p className='text-sm text-gray-500'>
                    {formatFileSize(uploadedDocument.size)} •{' '}
                    {uploadedDocument.type}
                  </p>
                  <p className='text-xs text-gray-400'>
                    Uploaded:{' '}
                    {new Date(uploadedDocument.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => window.open(uploadedDocument.url, '_blank')}
                >
                  <Eye className='h-4 w-4 mr-1' />
                  View
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = uploadedDocument.url;
                    link.download = uploadedDocument.name;
                    link.click();
                  }}
                >
                  <Download className='h-4 w-4 mr-1' />
                  Download
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleDelete}
                  className='text-red-600 hover:text-red-700'
                >
                  <Trash2 className='h-4 w-4 mr-1' />
                  Delete
                </Button>
              </div>
            </div>

            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={handleReplaceClick}
                disabled={uploading}
              >
                <Upload className='h-4 w-4 mr-2' />
                Replace Document
              </Button>
            </div>
          </div>
        ) : (
          // Show upload area
          <div className='space-y-4'>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type='file'
              accept={config.accept}
              onChange={handleFileSelect}
              className='hidden'
              id={`${documentType}-upload`}
              disabled={uploading}
              aria-label={`Upload ${config.title}`}
              title={`Upload ${config.title}`}
            />

            <div
              className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer'
              onClick={handleUploadClick}
              onDragOver={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragEnter={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragLeave={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={e => {
                e.preventDefault();
                e.stopPropagation();
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  handleFileUpload(files[0]);
                }
              }}
            >
              <Upload className='mx-auto h-12 w-12 text-gray-400 mb-4' />
              <div className='space-y-2'>
                <p className='text-lg font-medium text-gray-900'>
                  Upload {config.title}
                </p>
                <p className='text-sm text-gray-600'>
                  Drag and drop your file here, or click to browse
                </p>
                <p className='text-xs text-gray-500'>
                  Accepted formats: JPEG, PNG, PDF • Max size:{' '}
                  {config.maxSize / (1024 * 1024)}MB
                </p>
              </div>

              <Button
                type='button'
                onClick={handleUploadClick}
                disabled={uploading}
                className='mt-4'
              >
                {uploading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className='h-4 w-4 mr-2' />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className='h-2' />
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            <strong>Important:</strong> Please ensure the document is clearly
            visible and all information is legible. The document will be used
            for verification purposes.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
