'use client';
// CORE INPUT COMPONENT: Does NOT render FormLabel, FormMessage by itself.
// These will be provided by the parent FormField.
import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { SafeImage } from '@/components/ui/safe-image';

// Use a direct path string so Next.js doesn't try to read from the filesystem
// during the build phase. Importing the file caused errors like
// `EISDIR: illegal operation on a directory` in some environments.
const placeholderSrc = '/placeholder.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Removed Label import from here, will be used from parent
// Removed FormMessage import from here, will be used from parent
import { UploadCloudIcon, Trash2Icon, FileIcon } from 'lucide-react';

interface ImageUploadFieldProps {
  field: {
    name: string;
    value: unknown; // React Hook Form field value
    onChange: (file: File | null) => void;
    onBlur: () => void;
    ref: React.Ref<any>; // RHF provides a ref for the input
  };
  initialImageUrl?: string | null;
  disabled?: boolean;
  onImageRemove?: () => void;
  id?: string; // To connect with FormLabel from parent
}

export { ImageUploadField };

export default function ImageUploadField({
  field,
  initialImageUrl,
  disabled,
  onImageRemove,
  id,
}: ImageUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(
    initialImageUrl || null
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Keep this for triggering click

  useEffect(() => {
    if (field.value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(field.value);
      setFileName(field.value.name);
    } else if (initialImageUrl !== preview) {
      setPreview(initialImageUrl || null);
      setFileName(null);
    } else if (!field.value && !initialImageUrl) {
      setPreview(null);
      setFileName(null);
    }
  }, [field.value, initialImageUrl, preview]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    field.onChange(file || null);
  };

  const handleRemoveImage = () => {
    field.onChange(null);
    onImageRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayPreviewUrl =
    field.value instanceof File ? preview : initialImageUrl;

  return (
    <div className='space-y-2'>
      {/* Label will be rendered by FormLabel in the parent FormField */}
      <div
        className={`group relative flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${disabled ? 'cursor-not-allowed bg-muted/50 opacity-50' : 'cursor-pointer border-muted-foreground/30 hover:border-primary'}`}
        onClick={triggerFileInput}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled)
            triggerFileInput();
        }}
        tabIndex={disabled ? -1 : 0}
        role='button'
        aria-label={`Upload file`} // Generic, specific label will be outside
      >
        {displayPreviewUrl ? (
          // If the file is a PDF, show PDF icon and link
          typeof displayPreviewUrl === 'string' &&
          displayPreviewUrl.endsWith('.pdf') ? (
            <a
              href={displayPreviewUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='flex flex-col items-center justify-center'
            >
              <FileIcon className='mb-2 h-12 w-12 text-gray-400' />
              <span className='text-xs text-blue-600 underline'>View PDF</span>
            </a>
          ) : (
            <SafeImage
              src={displayPreviewUrl || placeholderSrc}
              alt={`Preview`}
              className='h-32 w-32 rounded object-contain'
            />
          )
        ) : (
          <>
            <UploadCloudIcon className='mb-2 h-10 w-10 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>
              Click or drag file to upload
              <br />
              (PNG, JPG, WEBP, PDF up to 5MB)
            </span>
          </>
        )}
        <input
          ref={fileInputRef}
          id={id}
          name={field.name}
          type='file'
          accept='image/*,application/pdf'
          className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
          disabled={disabled}
          onChange={handleFileChange}
          tabIndex={-1}
          aria-label='Upload file'
        />
        {field.value instanceof File && !disabled && (
          <Button
            type='button'
            size='icon'
            variant='ghost'
            className='absolute right-2 top-2 z-10'
            onClick={e => {
              e.stopPropagation();
              handleRemoveImage();
            }}
            tabIndex={-1}
          >
            <Trash2Icon className='h-4 w-4 text-red-500' />
          </Button>
        )}
      </div>
      {fileName && (
        <div className='mt-1 text-center text-xs text-muted-foreground'>
          {fileName}
        </div>
      )}
    </div>
  );
}
