"use client"

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Shield, 
  Award,
  Calendar,
  Building,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Eye
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { DocumentService, type CompanyDocument, type DocumentUploadProgress } from '@/lib/document-service'

interface DocumentUploadProps {
  companyId: string
  onUploadComplete?: (document: CompanyDocument) => void
  onError?: (error: string) => void
  allowedTypes?: CompanyDocument['document_type'][]
  maxFiles?: number
  showPreview?: boolean
}

interface UploadingFile {
  file: File
  documentType: CompanyDocument['document_type']
  expiryDate?: Date
  documentNumber?: string
  issuingAuthority?: string
  description?: string
  progress: DocumentUploadProgress
  id: string
}

const DOCUMENT_TYPES: Array<{
  value: CompanyDocument['document_type']
  label: string
  description: string
  icon: React.ReactNode
  required?: boolean
}> = [
  {
    value: 'commercial_registration',
    label: 'Commercial Registration',
    description: 'Business registration certificate',
    icon: <Building className="h-4 w-4" />,
    required: true
  },
  {
    value: 'business_license',
    label: 'Business License',
    description: 'Operating license from relevant authority',
    icon: <Award className="h-4 w-4" />,
    required: true
  },
  {
    value: 'tax_certificate',
    label: 'Tax Certificate',
    description: 'Tax registration certificate',
    icon: <FileText className="h-4 w-4" />
  },
  {
    value: 'insurance',
    label: 'Insurance Certificate',
    description: 'Business insurance coverage',
    icon: <Shield className="h-4 w-4" />
  },
  {
    value: 'logo',
    label: 'Company Logo',
    description: 'Official company logo',
    icon: <Image className="h-4 w-4" />
  },
  {
    value: 'other',
    label: 'Other Documents',
    description: 'Additional business documents',
    icon: <File className="h-4 w-4" />
  }
]

export function CompanyDocumentUpload({
  companyId,
  onUploadComplete,
  onError,
  allowedTypes,
  maxFiles = 10,
  showPreview = true
}: DocumentUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<CompanyDocument['document_type']>('commercial_registration')
  const [documentMetadata, setDocumentMetadata] = useState({
    expiryDate: '',
    documentNumber: '',
    issuingAuthority: '',
    description: ''
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredDocumentTypes = allowedTypes 
    ? DOCUMENT_TYPES.filter(type => allowedTypes.includes(type.value))
    : DOCUMENT_TYPES

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return

    // Check max files limit
    if (selectedFiles.length + files.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`)
      return
    }

    setSelectedFiles(prev => [...prev, ...files])
    
    // If only one file and one document type, start upload immediately
    if (files.length === 1 && filteredDocumentTypes.length === 1) {
      startUpload(files[0], filteredDocumentTypes[0].value)
    } else {
      setIsDialogOpen(true)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [selectedFiles.length, maxFiles, onError, filteredDocumentTypes])

  const startUpload = async (
    file: File, 
    documentType: CompanyDocument['document_type'],
    metadata?: {
      expiryDate?: Date
      documentNumber?: string
      issuingAuthority?: string
      description?: string
    }
  ) => {
    const uploadId = Math.random().toString(36).substr(2, 9)
    
    const uploadingFile: UploadingFile = {
      file,
      documentType,
      expiryDate: metadata?.expiryDate,
      documentNumber: metadata?.documentNumber,
      issuingAuthority: metadata?.issuingAuthority,
      description: metadata?.description,
      progress: { progress: 0, status: 'uploading' },
      id: uploadId
    }

    setUploadingFiles(prev => [...prev, uploadingFile])

    try {
      const result = await DocumentService.uploadDocument(
        file,
        companyId,
        documentType,
        metadata,
        (progress) => {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadId 
                ? { ...f, progress }
                : f
            )
          )
        }
      )

      if (result.error) {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadId 
              ? { ...f, progress: { progress: 0, status: 'error', message: result.error } }
              : f
          )
        )
        onError?.(result.error)
      } else if (result.data) {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadId 
              ? { ...f, progress: { progress: 100, status: 'completed', message: 'Upload successful!' } }
              : f
          )
        )
        // Handle both single document and array responses
        if (Array.isArray(result.data)) {
          result.data.forEach(doc => onUploadComplete?.(doc))
        } else {
          onUploadComplete?.(result.data)
        }

        // Remove completed upload after 3 seconds
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== uploadId))
        }, 3000)
      }
    } catch (error) {
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === uploadId 
            ? { ...f, progress: { progress: 0, status: 'error', message: 'Upload failed' } }
            : f
        )
      )
      onError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  const handleBatchUpload = () => {
    if (selectedFiles.length === 0 || !selectedDocumentType) return

    const metadata = {
      expiryDate: documentMetadata.expiryDate ? new Date(documentMetadata.expiryDate) : undefined,
      documentNumber: documentMetadata.documentNumber || undefined,
      issuingAuthority: documentMetadata.issuingAuthority || undefined,
      description: documentMetadata.description || undefined
    }

    selectedFiles.forEach(file => {
      startUpload(file, selectedDocumentType, metadata)
    })

    // Reset state
    setSelectedFiles([])
    setDocumentMetadata({
      expiryDate: '',
      documentNumber: '',
      issuingAuthority: '',
      description: ''
    })
    setIsDialogOpen(false)
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id))
  }

  const getDocumentTypeInfo = (type: CompanyDocument['document_type']) => {
    return DOCUMENT_TYPES.find(dt => dt.value === type)
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload
          </CardTitle>
          <CardDescription>
            Upload company documents such as commercial registration, licenses, and certificates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault()
              const files = Array.from(e.dataTransfer.files)
              if (fileInputRef.current) {
                const dt = new DataTransfer()
                files.forEach(file => dt.items.add(file))
                fileInputRef.current.files = dt.files
                handleFileSelect({ target: { files: dt.files } } as any)
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop files here or click to browse</h3>
            <p className="text-muted-foreground mb-4">
              Supports PDF, JPG, PNG files up to 10MB each
            </p>
            <Button variant="outline">
              Choose Files
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Required Documents Info */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Required Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDocumentTypes
                .filter(type => type.required)
                .map((docType) => (
                  <div key={docType.value} className="flex items-center gap-2 p-3 border rounded-lg">
                    {docType.icon}
                    <div>
                      <p className="font-medium text-sm">{docType.label}</p>
                      <p className="text-xs text-muted-foreground">{docType.description}</p>
                    </div>
                    <Badge variant="destructive" className="ml-auto text-xs">Required</Badge>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Upload Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadingFiles.map((upload) => {
                  const docType = getDocumentTypeInfo(upload.documentType)
                  return (
                    <div key={upload.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {docType?.icon}
                          <div>
                            <p className="font-medium">{upload.file.name}</p>
                            <p className="text-sm text-muted-foreground">{docType?.label}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadingFile(upload.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{upload.progress.message || 'Uploading...'}</span>
                          <span>{upload.progress.progress}%</span>
                        </div>
                        <Progress value={upload.progress.progress} className="h-2" />
                      </div>

                      {upload.progress.status === 'error' && (
                        <Alert className="mt-2 border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            {upload.progress.message}
                          </AlertDescription>
                        </Alert>
                      )}

                      {upload.progress.status === 'completed' && (
                        <Alert className="mt-2 border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700">
                            Upload completed successfully!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Document Upload</DialogTitle>
            <DialogDescription>
              Set document type and metadata for the selected files
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Selected Files */}
            <div>
              <Label className="text-sm font-medium">Selected Files ({selectedFiles.length})</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Type */}
            <div>
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={selectedDocumentType} onValueChange={(value: CompanyDocument['document_type']) => setSelectedDocumentType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDocumentTypes.map((docType) => (
                    <SelectItem key={docType.value} value={docType.value}>
                      <div className="flex items-center gap-2">
                        {docType.icon}
                        <span>{docType.label}</span>
                        {docType.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={documentMetadata.expiryDate}
                  onChange={(e) => setDocumentMetadata(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="documentNumber">Document Number (Optional)</Label>
                <Input
                  id="documentNumber"
                  placeholder="e.g., CR-123456"
                  value={documentMetadata.documentNumber}
                  onChange={(e) => setDocumentMetadata(prev => ({ ...prev, documentNumber: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="issuingAuthority">Issuing Authority (Optional)</Label>
                <Input
                  id="issuingAuthority"
                  placeholder="e.g., Ministry of Commerce"
                  value={documentMetadata.issuingAuthority}
                  onChange={(e) => setDocumentMetadata(prev => ({ ...prev, issuingAuthority: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional notes about this document"
                  value={documentMetadata.description}
                  onChange={(e) => setDocumentMetadata(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBatchUpload} disabled={selectedFiles.length === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
