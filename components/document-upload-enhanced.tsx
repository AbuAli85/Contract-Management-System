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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  FileText,
  Eye,
  Download,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  Image as ImageIcon,
  FileCheck,
  FileX,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface DocumentUploadEnhancedProps {
  promoterId: string;
  promoterName?: string;
  idCardNumber?: string;
  passportNumber?: string;
  documentType: 'id_card' | 'passport';
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onDelete: () => void;
  onReplace?: (oldUrl: string, newUrl: string) => void;
}

interface UploadedDocument {
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export default function DocumentUploadEnhanced({
  promoterId,
  promoterName,
  idCardNumber,
  passportNumber,
  documentType,
  currentUrl,
  onUploadComplete,
  onDelete,
  onReplace,
}: DocumentUploadEnhancedProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const documentLabels = {
    id_card: {
      title: 'ID Card Document',
      description: 'Upload a clear copy of the ID card',
      accept: '.jpg,.jpeg,.png,.pdf',
      maxSize: 5 * 1024 * 1024, // 5MB
      icon: '🆔',
    },
    passport: {
      title: 'Passport Document',
      description: 'Upload a clear copy of the passport',
      accept: '.jpg,.jpeg,.png,.pdf',
      maxSize: 5 * 1024 * 1024, // 5MB
      icon: '📘',
    },
  };

  const config = documentLabels[documentType];

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

  const createCleanFilename = (file: File): string => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    let cleanPromoterName = 'Unknown_Promoter';

    if (promoterName && promoterName.trim() !== '' && promoterName !== 'Unknown') {
      cleanPromoterName = promoterName
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 50);
    }

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

    return `${cleanPromoterName}_${documentNumber}.${fileExt}`;
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or PDF file';
    }

    if (file.size > config.maxSize) {
      return `File size must be less than ${config.maxSize / (1024 * 1024)}MB`;
    }

    return null;
  };

  const handleFileUpload = useCallback(
    async (file: File, isReplacement = false) => {
      if (uploading) {
        return;
      }

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
      setUploadProgress(0);
      setIsReplacing(isReplacement);

      try {
        const supabase = createClient();
        if (!supabase) {
          throw new Error('Failed to create Supabase client');
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('You must be logged in to upload files');
        }

        const fileName = createCleanFilename(file);
        const filePath = `${fileName}`;

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        // Delete old file if replacing
        if (isReplacement && uploadedDocument?.url) {
          try {
            const urlParts = uploadedDocument.url.split('/');
            const oldFilePath = urlParts.slice(-2).join('/');
            await supabase.storage
              .from('promoter-documents')
              .remove([oldFilePath]);
          } catch (deleteError) {
            // Could not delete old file - non-critical, continue with upload
          }
        }

        // Upload new file
        const { data, error } = await supabase.storage
          .from('promoter-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type,
          });

        clearInterval(progressInterval);

        if (error) {
          // Try API route as fallback
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
              throw new Error(`Upload failed with status ${response.status}`);
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

            const oldUrl = uploadedDocument?.url;
            setUploadedDocument(uploadedDoc);
            
            if (isReplacement && oldUrl && onReplace) {
              onReplace(oldUrl, result.url);
            } else {
              onUploadComplete(result.url);
            }

            toast({
              title: isReplacement ? 'Document replaced successfully' : 'Document uploaded successfully',
              description: `${file.name} has been ${isReplacement ? 'replaced' : 'uploaded'}`,
            });

            return;
          } catch (apiError) {
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

        const oldUrl = uploadedDocument?.url;
        setUploadedDocument(uploadedDoc);

        if (isReplacement && oldUrl && onReplace) {
          onReplace(oldUrl, urlData.publicUrl);
        } else {
          onUploadComplete(urlData.publicUrl);
        }

        toast({
          title: isReplacement ? 'Document replaced successfully' : 'Document uploaded successfully',
          description: `${file.name} has been ${isReplacement ? 'replaced' : 'uploaded'}`,
        });
      } catch (error) {
        console.error('Error uploading document:', error);
        toast({
          title: 'Upload failed',
          description:
            error instanceof Error ? error.message : 'Failed to upload document',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
        setUploadProgress(0);
        setIsReplacing(false);
      }
    },
    [
      promoterId,
      documentType,
      config.maxSize,
      toast,
      onUploadComplete,
      onReplace,
      promoterName,
      idCardNumber,
      passportNumber,
      uploadedDocument,
    ]
  );

  const handleDelete = async () => {
    if (!uploadedDocument) return;

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to create Supabase client');
      }

      const urlParts = uploadedDocument.url.split('/');
      const filePath = urlParts.slice(-2).join('/');

      const { error } = await supabase.storage
        .from('promoter-documents')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      setUploadedDocument(null);
      onDelete();
      setShowDeleteDialog(false);

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

  const handleReplace = (file: File) => {
    handleFileUpload(file, true);
  };

  const handleEdit = () => {
    if (uploadedDocument) {
      setEditingName(uploadedDocument.name);
      setShowEditDialog(true);
    }
  };

  const handleSaveEdit = () => {
    if (uploadedDocument) {
      setUploadedDocument({
        ...uploadedDocument,
        name: editingName,
      });
      setShowEditDialog(false);
      toast({
        title: 'Document name updated',
        description: 'Document name has been updated',
      });
    }
  };

  const handlePreview = () => {
    if (uploadedDocument) {
      setPreviewUrl(uploadedDocument.url);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const file = event.target.files?.[0];
    if (file) {
      if (uploadedDocument) {
        handleReplace(file);
      } else {
        handleFileUpload(file, false);
      }
    }
    event.target.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) {
      return <ImageIcon className='h-8 w-8 text-blue-500' />;
    }
    return <FileText className='h-8 w-8 text-blue-500' />;
  };

  return (
    <>
      <Card className='border-2 border-primary/20 shadow-lg'>
        <CardHeader className='bg-gradient-to-r from-primary/5 to-blue-50/50 border-b'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-primary/10'>
                {getFileIcon(uploadedDocument?.type || 'application/pdf')}
              </div>
              <div>
                <CardTitle className='text-lg'>{config.title}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </div>
            </div>
            <Badge
              variant={uploadedDocument ? 'default' : 'secondary'}
              className={
                uploadedDocument
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }
            >
              {uploadedDocument ? (
                <>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Uploaded
                </>
              ) : (
                <>
                  <FileX className='h-3 w-3 mr-1' />
                  Not Uploaded
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          {uploadedDocument ? (
            // Document exists - show full control panel
            <div className='space-y-4'>
              {/* Document Info Card */}
              <div className='p-4 border-2 border-green-200 rounded-lg bg-gradient-to-br from-green-50 to-white'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                    {getFileIcon(uploadedDocument.type)}
                    <div className='flex-1 min-w-0'>
                      <p className='font-semibold text-green-900 truncate'>
                        {uploadedDocument.name}
                      </p>
                      <div className='flex items-center gap-3 mt-1 text-sm text-green-700'>
                        <span>{formatFileSize(uploadedDocument.size)}</span>
                        <span>•</span>
                        <span className='capitalize'>
                          {uploadedDocument.type.split('/')[1]}
                        </span>
                        <span>•</span>
                        <span>
                          Uploaded:{' '}
                          {new Date(uploadedDocument.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handlePreview}
                    className='w-full'
                  >
                    <Eye className='h-4 w-4 mr-2' />
                    Preview
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
                    className='w-full'
                  >
                    <Download className='h-4 w-4 mr-2' />
                    Download
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleEdit}
                    className='w-full'
                  >
                    <Edit className='h-4 w-4 mr-2' />
                    Edit
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className='w-full'
                  >
                    <RefreshCw className='h-4 w-4 mr-2' />
                    Replace
                  </Button>
                </div>

                {/* Delete Button */}
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => setShowDeleteDialog(true)}
                  className='w-full mt-2'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete Document
                </Button>
              </div>
            </div>
          ) : (
            // No document - show upload area
            <div className='space-y-4'>
              <input
                ref={fileInputRef}
                type='file'
                accept={config.accept}
                onChange={handleFileSelect}
                className='hidden'
                id={`${documentType}-upload-enhanced`}
                disabled={uploading}
              />

              <div
                className='border-2 border-dashed border-primary/30 rounded-xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group'
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragEnter={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = e.dataTransfer.files;
                  const file = files[0];
                  if (file) {
                    handleFileUpload(file, false);
                  }
                }}
              >
                <div className='flex flex-col items-center gap-4'>
                  <div className='p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors'>
                    <Upload className='h-12 w-12 text-primary' />
                  </div>
                  <div className='space-y-2'>
                    <p className='text-lg font-semibold text-gray-900'>
                      Upload {config.title}
                    </p>
                    <p className='text-sm text-gray-600'>
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className='text-xs text-gray-500'>
                      Accepted: JPEG, PNG, PDF • Max size: {config.maxSize / (1024 * 1024)}MB
                    </p>
                  </div>
                  <Button
                    type='button'
                    onClick={e => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                    className='mt-2'
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
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='font-medium'>
                  {isReplacing ? 'Replacing document...' : 'Uploading...'}
                </span>
                <span className='font-semibold'>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className='h-2' />
            </div>
          )}

          {/* Instructions */}
          <Alert className='bg-blue-50 border-blue-200'>
            <AlertCircle className='h-4 w-4 text-blue-600' />
            <AlertDescription className='text-blue-800'>
              <strong>Important:</strong> Ensure the document is clearly visible and all
              information is legible. The document will be used for verification purposes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Trash2 className='h-5 w-5 text-red-500' />
              Delete Document?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
              The document will be permanently removed from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-red-600 hover:bg-red-700'
            >
              <Trash2 className='h-4 w-4 mr-2' />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Edit className='h-5 w-5' />
              Edit Document Name
            </DialogTitle>
            <DialogDescription>
              Update the display name for this document
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='document-name'>Document Name</Label>
              <Input
                id='document-name'
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                placeholder='Enter document name'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <CheckCircle className='h-4 w-4 mr-2' />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className='max-w-4xl max-h-[90vh]'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Eye className='h-5 w-5' />
                Document Preview
              </DialogTitle>
            </DialogHeader>
            <div className='relative w-full h-[70vh] overflow-auto border rounded-lg bg-gray-100'>
              {previewUrl.includes('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className='w-full h-full'
                  title='Document preview'
                />
              ) : (
                <img
                  src={previewUrl}
                  alt='Document preview'
                  className='w-full h-auto object-contain'
                />
              )}
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setPreviewUrl(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewUrl;
                  link.download = uploadedDocument?.name || 'document';
                  link.click();
                }}
              >
                <Download className='h-4 w-4 mr-2' />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

