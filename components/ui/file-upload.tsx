'use client';

import { useCallback, useState, useRef } from 'react';
import type { DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  FileType,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  onFileSelect: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  description?: string;
  currentFileUrl?: string | null;
  currentFileName?: string | null;
  disabled?: boolean;
  className?: string;
}

/**
 * File Upload Component with Drag-and-Drop
 *
 * Features:
 * - Drag and drop file upload
 * - Click to browse
 * - File type validation
 * - File size validation
 * - Progress indicator
 * - Preview for images
 * - Replace/remove existing file
 */
export function FileUpload({
  onFileSelect,
  accept = 'image/*,.pdf',
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = 'Upload File',
  description = 'Drag and drop or click to browse',
  currentFileUrl,
  currentFileName,
  disabled = false,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    const isImage =
      acceptedTypes.includes('image/*') && file.type.startsWith('image/');
    const isAccepted = acceptedTypes.includes(file.type) || isImage;

    if (!isAccepted) {
      return 'Invalid file type. Please upload a valid file.';
    }

    return null;
  };

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        await onFileSelect(file);

        clearInterval(progressInterval);
        setProgress(100);
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type,
        });

        setTimeout(() => {
          setProgress(0);
          setUploading(false);
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setProgress(0);
        setUploading(false);
      }
    },
    [onFileSelect, accept, maxSize]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const getFileIcon = (type?: string) => {
    if (!type) return <FileText className='h-8 w-8' />;
    if (type.startsWith('image/')) return <ImageIcon className='h-8 w-8' />;
    if (type === 'application/pdf') return <FileType className='h-8 w-8' />;
    return <FileText className='h-8 w-8' />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const hasCurrentFile = currentFileUrl || uploadedFile;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type='file'
        accept={accept}
        onChange={handleFileChange}
        className='hidden'
        disabled={disabled || uploading}
      />

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer',
          isDragActive && 'border-primary bg-primary/5',
          !isDragActive &&
            !disabled &&
            'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
          disabled && 'cursor-not-allowed opacity-50 bg-muted',
          error && 'border-destructive bg-destructive/5'
        )}
      >
        <div className='flex flex-col items-center justify-center space-y-3 text-center'>
          {uploading ? (
            <>
              <Upload className='h-10 w-10 text-primary animate-bounce' />
              <div className='space-y-2 w-full max-w-xs'>
                <p className='text-sm font-medium'>Uploading...</p>
                <Progress value={progress} className='h-2' />
                <p className='text-xs text-muted-foreground'>{progress}%</p>
              </div>
            </>
          ) : hasCurrentFile ? (
            <>
              <CheckCircle className='h-10 w-10 text-green-600' />
              <div className='space-y-1'>
                <p className='text-sm font-medium text-green-700'>
                  File uploaded successfully
                </p>
                <p className='text-xs text-muted-foreground'>
                  {uploadedFile?.name || currentFileName || 'Current file'}
                </p>
                {uploadedFile && (
                  <Badge variant='secondary' className='text-xs'>
                    {formatFileSize(uploadedFile.size)}
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <>
              {error ? (
                <AlertCircle className='h-10 w-10 text-destructive' />
              ) : (
                <Upload className='h-10 w-10 text-muted-foreground' />
              )}
              <div className='space-y-1'>
                <p className='text-sm font-medium'>
                  {isDragActive ? 'Drop file here' : label}
                </p>
                <p className='text-xs text-muted-foreground'>{description}</p>
                <p className='text-xs text-muted-foreground'>
                  Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className='flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg'>
          <AlertCircle className='h-4 w-4 text-destructive flex-shrink-0' />
          <p className='text-sm text-destructive'>{error}</p>
        </div>
      )}

      {/* Current File Preview */}
      {hasCurrentFile && !uploading && (
        <div className='flex items-center justify-between p-3 bg-muted/50 border rounded-lg'>
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            <div className='text-muted-foreground flex-shrink-0'>
              {getFileIcon(uploadedFile?.type)}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium truncate'>
                {uploadedFile?.name || currentFileName || 'Uploaded file'}
              </p>
              <div className='flex items-center gap-2 mt-1'>
                {uploadedFile && (
                  <span className='text-xs text-muted-foreground'>
                    {formatFileSize(uploadedFile.size)}
                  </span>
                )}
                {currentFileUrl && (
                  <Button
                    variant='link'
                    size='sm'
                    className='h-auto p-0 text-xs'
                    onClick={e => {
                      e.stopPropagation();
                      window.open(currentFileUrl, '_blank');
                    }}
                  >
                    View
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 flex-shrink-0'
            onClick={e => {
              e.stopPropagation();
              setUploadedFile(null);
              setError(null);
            }}
            disabled={disabled || uploading}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
