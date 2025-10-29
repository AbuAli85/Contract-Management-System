'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promoterId: string;
  documentType: 'id_card' | 'passport' | 'work_permit' | 'health_certificate' | 'criminal_record' | 'contract' | 'training_certificate' | 'insurance';
  currentDocument?: {
    number?: string;
    expiryDate?: string;
    url?: string;
  };
  onUploadSuccess?: () => void;
}

const DOCUMENT_LABELS: Record<string, string> = {
  id_card: 'National ID Card',
  passport: 'Passport',
  work_permit: 'Work Permit',
  health_certificate: 'Health Certificate',
  criminal_record: 'Criminal Record',
  contract: 'Employment Contract',
  training_certificate: 'Training Certificate',
  insurance: 'Insurance Document',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PromoterDocumentUploadDialog({
  isOpen,
  onClose,
  promoterId,
  documentType,
  currentDocument,
  onUploadSuccess,
}: DocumentUploadDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [documentNumber, setDocumentNumber] = useState(currentDocument?.number || '');
  const [expiryDate, setExpiryDate] = useState(currentDocument?.expiryDate || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentLabel = DOCUMENT_LABELS[documentType] || 'Document';

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors?.[0]?.code === 'file-too-large') {
        setError('File size must be less than 10MB');
      } else if (rejection.errors?.[0]?.code === 'file-invalid-type') {
        setError('Please select a PDF, JPG, or PNG file');
      } else {
        setError('Invalid file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0 && acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    multiple: false,
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    if (!fileExt || !validExtensions.includes(fileExt)) {
      setError('Please select a PDF, JPG, or PNG file');
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
  }, []);

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!documentNumber && (documentType === 'id_card' || documentType === 'passport')) {
      setError('Document number is required');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const supabase = createClient();
      
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      // Create file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${promoterId}/${documentType}_${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('promoter-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('promoter-documents')
        .getPublicUrl(fileName);

      setUploadProgress(75);

      // Update promoter record with document info
      const updateData: any = {};
      
      if (documentType === 'id_card') {
        updateData.id_card_url = publicUrl;
        if (documentNumber) updateData.id_card_number = documentNumber;
        if (expiryDate) updateData.id_card_expiry_date = expiryDate;
      } else if (documentType === 'passport') {
        updateData.passport_url = publicUrl;
        if (documentNumber) updateData.passport_number = documentNumber;
        if (expiryDate) updateData.passport_expiry_date = expiryDate;
      } else {
        // For other document types, store in documents JSONB column
        updateData.documents = {
          [documentType]: {
            url: publicUrl,
            number: documentNumber,
            expiryDate,
            uploadedAt: new Date().toISOString(),
          },
        };
      }

      const { error: updateError } = await supabase
        .from('promoters')
        .update(updateData)
        .eq('id', promoterId);

      if (updateError) throw updateError;

      setUploadProgress(100);

      toast({
        title: 'Upload Successful',
        description: `${documentLabel} has been uploaded successfully.`,
      });

      // Call success callback
      onUploadSuccess?.();

      // Close dialog after short delay
      setTimeout(() => {
        onClose();
        resetForm();
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to upload document. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setDocumentNumber(currentDocument?.number || '');
    setExpiryDate(currentDocument?.expiryDate || '');
    setUploadProgress(0);
    setError(null);
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload {documentLabel}</DialogTitle>
          <DialogDescription>
            Upload a PDF, JPG, or PNG file (max 10MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload Area */}
          <div>
            <Label className="mb-2 block">Document File *</Label>
            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className={`mx-auto h-12 w-12 mb-3 ${
                  isDragActive ? 'text-primary' : 'text-gray-400'
                }`} />
                <p className="text-sm text-gray-600 font-medium">
                  {isDragActive ? 'Drop file here' : 'Drag & drop or click to select'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF, JPG, or PNG (max 10MB)
                </p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Document Number */}
          {(documentType === 'id_card' || documentType === 'passport') && (
            <div>
              <Label htmlFor="documentNumber">Document Number *</Label>
              <Input
                id="documentNumber"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Enter document number"
                disabled={isUploading}
              />
            </div>
          )}

          {/* Expiry Date */}
          <div>
            <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={isUploading}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div>
              <Label className="mb-2 block">Uploading...</Label>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {uploadProgress}% complete
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Document Info */}
          {currentDocument?.url && !isUploading && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                A document is already uploaded. Uploading a new file will replace
                it.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

