"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface DocumentUploadProps {
  promoterId: string
  documentType: 'id_card' | 'passport'
  currentUrl?: string | null
  onUploadComplete: (url: string) => void
  onDelete: () => void
}

interface UploadedDocument {
  url: string
  name: string
  size: number
  type: string
  uploadedAt: string
}

export default function DocumentUpload({
  promoterId,
  documentType,
  currentUrl,
  onUploadComplete,
  onDelete
}: DocumentUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(
    currentUrl ? {
      url: currentUrl,
      name: `${documentType}_document`,
      size: 0,
      type: 'application/pdf',
      uploadedAt: new Date().toISOString()
    } : null
  )

  const documentLabels = {
    id_card: {
      title: "ID Card Document",
      description: "Upload a clear copy of the ID card",
      accept: ".jpg,.jpeg,.png,.pdf",
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    passport: {
      title: "Passport Document", 
      description: "Upload a clear copy of the passport",
      accept: ".jpg,.jpeg,.png,.pdf",
      maxSize: 5 * 1024 * 1024 // 5MB
    }
  }

  const config = documentLabels[documentType]

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return "Please upload a JPEG, PNG, or PDF file"
    }

    // Check file size
    if (file.size > config.maxSize) {
      return `File size must be less than ${config.maxSize / (1024 * 1024)}MB`
    }

    return null
  }

  const handleFileUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error("Failed to create Supabase client")
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${promoterId}_${documentType}_${Date.now()}.${fileExt}`
      const filePath = `promoter-documents/${promoterId}/${fileName}`

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('promoter-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('promoter-documents')
        .getPublicUrl(filePath)

      setUploadProgress(100)

      const uploadedDoc: UploadedDocument = {
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }

      setUploadedDocument(uploadedDoc)
      onUploadComplete(urlData.publicUrl)

      toast({
        title: "Document uploaded successfully",
        description: `${file.name} has been uploaded`,
      })

    } catch (error) {
      console.error('Error uploading document:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [promoterId, documentType, config.maxSize, toast, onUploadComplete])

  const handleDelete = async () => {
    if (!uploadedDocument) return

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error("Failed to create Supabase client")
      }

      // Extract file path from URL
      const urlParts = uploadedDocument.url.split('/')
      const filePath = urlParts.slice(-2).join('/') // Get the last two parts

      // Delete from storage
      const { error } = await supabase.storage
        .from('promoter-documents')
        .remove([filePath])

      if (error) {
        throw error
      }

      setUploadedDocument(null)
      onDelete()

      toast({
        title: "Document deleted",
        description: "Document has been removed successfully",
      })

    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ''
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {config.title}
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <Badge variant={uploadedDocument ? "default" : "secondary"}>
            {uploadedDocument ? "Uploaded" : "Not Uploaded"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadedDocument ? (
          // Show uploaded document
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">{uploadedDocument.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(uploadedDocument.size)} • {uploadedDocument.type}
                  </p>
                  <p className="text-xs text-gray-400">
                    Uploaded: {new Date(uploadedDocument.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(uploadedDocument.url, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = uploadedDocument.url
                    link.download = uploadedDocument.name
                    link.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
            
                         <div className="flex gap-2">
               <input
                 type="file"
                 accept={config.accept}
                 onChange={handleFileSelect}
                 className="hidden"
                 id={`${documentType}-upload`}
                 disabled={uploading}
                 aria-label={`Upload ${config.title}`}
                 title={`Upload ${config.title}`}
               />
               <Button
                 variant="outline"
                 onClick={() => document.getElementById(`${documentType}-upload`)?.click()}
                 disabled={uploading}
               >
                 <Upload className="h-4 w-4 mr-2" />
                 Replace Document
               </Button>
             </div>
          </div>
        ) : (
          // Show upload area
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  Upload {config.title}
                </p>
                <p className="text-sm text-gray-600">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Accepted formats: JPEG, PNG, PDF • Max size: {config.maxSize / (1024 * 1024)}MB
                </p>
              </div>
              
                             <input
                 type="file"
                 accept={config.accept}
                 onChange={handleFileSelect}
                 className="hidden"
                 id={`${documentType}-upload`}
                 disabled={uploading}
                 aria-label={`Upload ${config.title}`}
                 title={`Upload ${config.title}`}
               />
              <Button
                onClick={() => document.getElementById(`${documentType}-upload`)?.click()}
                disabled={uploading}
                className="mt-4"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Please ensure the document is clearly visible and all information is legible. 
            The document will be used for verification purposes.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
} 