"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Loader2, 
  User, 
  FileText, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase,
  Shield,
  Settings,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  Star,
  Award,
  TrendingUp,
  Users,
  FileCheck,
  Clock,
  Zap
} from "lucide-react"
import { format, parseISO, differenceInDays, isPast, isValid, addYears } from "date-fns"
import { cn } from "@/lib/utils"
import { SORTED_NATIONALITIES } from "@/lib/nationalities"
import { NationalitySelect } from "@/components/ui/nationality-select"
import { useFormRegistration } from "@/hooks/use-form-context"
import type { Promoter } from "@/lib/types"
import { useParties } from "@/hooks/use-parties"
import { JOB_TITLES, DEPARTMENTS, WORK_LOCATIONS } from "@/constants/contract-options"

// Enhanced Select Component with Add Option and Descriptions
const EnhancedSelect = ({ 
  options, 
  value, 
  onValueChange, 
  placeholder, 
  onAddCustom 
}: {
  options: readonly { value: string; label: string; description?: string }[]
  value?: string | null
  onValueChange: (value: string) => void
  placeholder: string
  onAddCustom?: (value: string) => void
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [customValue, setCustomValue] = useState("")

  // Ensure value is always string or undefined, never null
  const selectValue = value || undefined

  const handleAddCustom = () => {
    if (customValue.trim() && onAddCustom) {
      onAddCustom(customValue.trim())
      setCustomValue("")
      setIsAdding(false)
    }
  }

  const handleValueChange = (newValue: string) => {
    // Don't call onValueChange for the add custom option
    if (newValue === "__add_custom__") {
      setIsAdding(true)
      return
    }
    onValueChange(newValue)
  }

  return (
    <Select onValueChange={handleValueChange} value={selectValue}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              {option.description && (
                <span className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
        
        {onAddCustom && (
          <>
            <SelectSeparator />
            {isAdding ? (
              <div className="p-2">
                <Input
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="Enter custom value"
                  className="mb-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustom()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddCustom}
                    disabled={!customValue.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false)
                      setCustomValue("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <SelectItem
                value="__add_custom__"
                className="text-primary cursor-pointer"
              >
                + Add Custom Value
              </SelectItem>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  )
}

// Enhanced validation schema
const advancedPromoterSchema = z.object({
  // Personal Information
  name_en: z.string().min(2, "English name must be at least 2 characters").max(100, "English name must be less than 100 characters"),
  name_ar: z.string().min(2, "Arabic name must be at least 2 characters").max(100, "Arabic name must be less than 100 characters"),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  mobile_number: z.string().min(8, "Mobile number must be at least 8 digits").max(20, "Mobile number must be less than 20 digits"),
  phone_number: z.string().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable().or(z.literal("")),
  city: z.string().optional().nullable().or(z.literal("")),
  country: z.string().optional().nullable().or(z.literal("")),
  
  // Identity Documents
  id_card_number: z.string().min(5, "ID card number must be at least 5 characters").max(50, "ID card number must be less than 50 characters"),
  passport_number: z.string().optional().nullable().or(z.literal("")),
  nationality: z.string().optional().nullable().or(z.literal("")),
  date_of_birth: z.string().optional().nullable().or(z.literal("")),
  
  // Professional Information
  job_title: z.string().optional().nullable().or(z.literal("")),
  department: z.string().optional().nullable().or(z.literal("")),
  work_location: z.string().optional().nullable().or(z.literal("")),
  employer_id: z.string().optional().nullable().or(z.literal("")),
  outsourced_to_id: z.string().optional().nullable().or(z.literal("")),
  
  // Status and Contracts
  status: z.enum(["active", "inactive", "pending", "suspended"]),
  
  // Document Expiry Dates
  id_card_expiry_date: z.string().optional().nullable().or(z.literal("")),
  passport_expiry_date: z.string().optional().nullable().or(z.literal("")),
  
  // Notification Settings
  notify_days_before_id_expiry: z.number().min(1, "Must be at least 1 day").max(365, "Must be at most 365 days"),
  notify_days_before_passport_expiry: z.number().min(1, "Must be at least 1 day").max(365, "Must be at most 365 days"),
  
  // Documents
  profile_picture_url: z.string().optional().nullable().or(z.literal("")),
  id_card_image: z.any().optional().nullable(),
  passport_image: z.any().optional().nullable(),
  cv_document: z.any().optional().nullable(),
  
  // Additional Information
  notes: z.string().optional().nullable().or(z.literal("")),
  skills: z.array(z.string()).optional().default([]),
  experience_years: z.number().min(0, "Experience years cannot be negative").max(50, "Experience years cannot exceed 50").optional().default(0),
  education_level: z.string().optional().nullable().or(z.literal("")),
  
  // Settings
  is_editable: z.boolean(),
  auto_notifications: z.boolean(),
  require_approval: z.boolean()
})

type AdvancedPromoterFormData = z.infer<typeof advancedPromoterSchema>

interface AdvancedPromoterFormProps {
  promoterToEdit?: Promoter | null
  onFormSubmit: () => void
  onCancel?: () => void
}

const BUCKET_NAME = "promoter-documents"

// Helper functions
const getDocumentStatus = (expiryDate: string | null | undefined) => {
  if (!expiryDate) return { status: "missing", color: "text-gray-500", icon: XCircle, text: "Missing" }
  
  try {
    const parsedDate = parseISO(expiryDate)
    if (isNaN(parsedDate.getTime())) {
      return { status: "invalid", color: "text-red-500", icon: XCircle, text: "Invalid Date" }
    }
    
    const daysUntilExpiry = differenceInDays(parsedDate, new Date())
    
    if (daysUntilExpiry < 0) {
      return { status: "expired", color: "text-red-500", icon: XCircle, text: "Expired" }
    } else if (daysUntilExpiry <= 30) {
      return { status: "expiring", color: "text-yellow-500", icon: AlertTriangle, text: "Expiring Soon" }
    } else {
      return { status: "valid", color: "text-green-500", icon: CheckCircle, text: "Valid" }
    }
  } catch (error) {
    console.error('Error parsing expiry date:', error)
    return { status: "invalid", color: "text-red-500", icon: XCircle, text: "Invalid Date" }
  }
}

const getFormProgress = (formData: Partial<AdvancedPromoterFormData>) => {
  const requiredFields = [
    'name_en', 'name_ar', 'id_card_number', 'mobile_number', 'status'
  ]
  
  const completedFields = requiredFields.filter(field => 
    formData[field as keyof AdvancedPromoterFormData] && 
    String(formData[field as keyof AdvancedPromoterFormData]).trim() !== ''
  )
  
  return Math.round((completedFields.length / requiredFields.length) * 100)
}

// Custom Date Input Component with dd/mm/yyyy format
const CustomDateInput = ({ 
  value, 
  onChange, 
  placeholder = "dd/mm/yyyy",
  ...props 
}: {
  value?: string | null
  onChange: (value: string) => void
  placeholder?: string
  [key: string]: any
}) => {
  const formatDateForDisplay = (dateString: string | null | undefined) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return ""
    }
  }

  const parseDateFromInput = (inputValue: string) => {
    if (!inputValue) return ""
    
    // Remove any non-digit characters except /
    const cleaned = inputValue.replace(/[^\d/]/g, '')
    
    // Handle dd/mm/yyyy format
    const parts = cleaned.split('/')
    if (parts.length === 3) {
      const day = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1 // Month is 0-indexed
      const year = parseInt(parts[2])
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
          day >= 1 && day <= 31 && 
          month >= 0 && month <= 11 && 
          year >= 1900 && year <= 2100) {
        const date = new Date(year, month, day)
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0] // Return YYYY-MM-DD for database
        }
      }
    }
    
    return ""
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Allow typing and formatting
    if (inputValue.length <= 10) {
      // Format as user types (dd/mm/yyyy)
      let formatted = inputValue.replace(/[^\d]/g, '')
      if (formatted.length >= 2) {
        formatted = formatted.slice(0, 2) + '/' + formatted.slice(2)
      }
      if (formatted.length >= 5) {
        formatted = formatted.slice(0, 5) + '/' + formatted.slice(5)
      }
      formatted = formatted.slice(0, 10)
      
      // Update the input value for display
      e.target.value = formatted
      
      // Parse and update the form value
      const parsedDate = parseDateFromInput(formatted)
      onChange(parsedDate)
    }
  }

  return (
    <Input
      {...props}
      type="text"
      defaultValue={formatDateForDisplay(value)}
      onChange={handleInputChange}
      placeholder={placeholder}
      maxLength={10}
    />
  )
}

export default function AdvancedPromoterForm({ 
  promoterToEdit, 
  onFormSubmit, 
  onCancel 
}: AdvancedPromoterFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("personal")
  const [formError, setFormError] = useState<string | null>(null)
  const isEditMode = !!promoterToEdit
  
  // Register this form to disable auto-refresh during form interactions
  useFormRegistration()

  const form = useForm<AdvancedPromoterFormData>({
    resolver: zodResolver(advancedPromoterSchema),
    defaultValues: {
      name_en: promoterToEdit?.name_en || "",
      name_ar: promoterToEdit?.name_ar || "",
      // email: promoterToEdit?.email || null, // Removed - not in database schema
      mobile_number: promoterToEdit?.mobile_number || "",
      // phone_number: promoterToEdit?.phone || null, // Removed - not in database schema
      // address: promoterToEdit?.address || null, // Removed - not in database schema
      // city: null, // Removed - not in database schema
      // country: null, // Removed - not in database schema
      id_card_number: promoterToEdit?.id_card_number || "",
      passport_number: promoterToEdit?.passport_number || null,
      nationality: promoterToEdit?.nationality || null,
      // date_of_birth: null, // Removed - not in database schema
      // job_title: promoterToEdit?.job_title || null, // Removed - not in database schema
      // department: null, // Removed - not in database schema
      // work_location: promoterToEdit?.work_location || null, // Removed - not in database schema
      // employer_id: promoterToEdit?.employer_id || null, // Removed - not in database schema
      // outsourced_to_id: promoterToEdit?.outsourced_to_id || null, // Removed - not in database schema
      status: (promoterToEdit?.status as any) || "active",
      id_card_expiry_date: promoterToEdit?.id_card_expiry_date || null,
      passport_expiry_date: promoterToEdit?.passport_expiry_date || null,
      notify_days_before_id_expiry: promoterToEdit?.notify_days_before_id_expiry ?? 30,
      notify_days_before_passport_expiry: promoterToEdit?.notify_days_before_passport_expiry ?? 90,
      profile_picture_url: promoterToEdit?.profile_picture_url || null,
      notes: promoterToEdit?.notes || null,
      // skills: [], // Removed - not in database schema
      // experience_years: 0, // Removed - not in database schema
      // education_level: null, // Removed - not in database schema
      // is_editable: true, // Removed - not in database schema
      // auto_notifications: true, // Removed - not in database schema
      // require_approval: false // Removed - not in database schema
    }
  })

  // Handle form errors
  useEffect(() => {
    if (form.formState.errors && Object.keys(form.formState.errors).length > 0) {
      console.error('Form validation errors:', form.formState.errors)
      setFormError('Please fix the validation errors in the form')
    } else {
      setFormError(null)
    }
  }, [form.formState.errors])

  // Watch form data for progress calculation
  const watchedData = useWatch({ control: form.control })
  const formProgress = getFormProgress(watchedData)

  // Document status calculations
  const idCardStatus = getDocumentStatus(watchedData.id_card_expiry_date)
  const passportStatus = getDocumentStatus(watchedData.passport_expiry_date)

  // File upload handler
  const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB')
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please upload JPEG, PNG, GIF, WebP, or PDF files only.')
    }

    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const supabase = createClient()
      
      if (!supabase) {
        throw new Error('Database connection not available')
      }
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (error) {
        console.error('Supabase upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      if (!data?.path) {
        throw new Error('Upload completed but no file path returned')
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path)

      if (!publicUrl) {
        throw new Error('Failed to generate public URL for uploaded file')
      }

      return publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      throw error instanceof Error ? error : new Error('Failed to upload file')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [])

  // Handle file input changes
  const handleFileChange = useCallback(async (
    file: File | null, 
    fieldName: keyof AdvancedPromoterFormData,
    path: string
  ) => {
    if (!file) return

    try {
      const url = await uploadFile(file, path)
      form.setValue(fieldName, url)
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded`,
        variant: "default"
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file. Please try again."
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [uploadFile, form, toast])

  // Form submission
  const onSubmit = async (values: AdvancedPromoterFormData) => {
    console.log('🚀 Form submission started with values:', values)
    console.log('📋 Form errors:', form.formState.errors)
    console.log('✅ Form is valid:', form.formState.isValid)
    console.log('🔄 Form is submitting:', form.formState.isSubmitting)
    
    // Additional validation before submission
    if (!values.name_en?.trim() || !values.name_ar?.trim() || !values.mobile_number?.trim() || !values.id_card_number?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (English name, Arabic name, mobile number, and ID card number)",
        variant: "destructive"
      })
      return
    }
    
    // Check if already submitting to prevent double submission
    if (isSubmitting) {
      console.log('⚠️ Form is already submitting, ignoring duplicate submission')
      return
    }
    
    setIsSubmitting(true)
    
    // Increase timeout for slow database connections
    const timeoutId = setTimeout(() => {
      console.log('⏰ Form submission timeout - forcing reset')
      setIsSubmitting(false)
      toast({
        title: "Timeout Error",
        description: "Form submission took too long. Please try again.",
        variant: "destructive"
      })
    }, 20000) // Increased to 20 seconds
    
    try {
      const supabase = createClient()
      
      // Check if supabase client is available
      if (!supabase) {
        throw new Error('Database connection not available')
      }
      
      console.log('✅ Supabase client created successfully')
      
      // Filter form data to only include database fields
      const promoterData = {
        name_en: values.name_en.trim(),
        name_ar: values.name_ar.trim(),
        id_card_number: values.id_card_number.trim(),
        id_card_url: null, // Will be set when file is uploaded
        passport_url: null, // Will be set when file is uploaded
        status: values.status,
        // contract_valid_until: null, // Removed - not in database schema
        id_card_expiry_date: values.id_card_expiry_date?.trim() || null,
        passport_expiry_date: values.passport_expiry_date?.trim() || null,
        notify_days_before_id_expiry: values.notify_days_before_id_expiry,
        notify_days_before_passport_expiry: values.notify_days_before_passport_expiry,
        notify_days_before_contract_expiry: 30, // Default value
        notes: values.notes?.trim() || null,
        passport_number: values.passport_number?.trim() || null,
        mobile_number: values.mobile_number.trim(),
        profile_picture_url: values.profile_picture_url?.trim() || null,
        nationality: values.nationality?.trim() || null,
        employer_id: values.employer_id || null // Link to employer
      }

      // Remove any undefined or null values that might cause issues
      Object.keys(promoterData).forEach(key => {
        if (promoterData[key as keyof typeof promoterData] === undefined) {
          delete promoterData[key as keyof typeof promoterData]
        }
      })

      console.log('📊 Preparing promoter data:', promoterData)
      
      // Increase timeout for database operations
      const dbTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout')), 15000) // Increased to 15 seconds
      )
      
      let result
      if (isEditMode && promoterToEdit?.id) {
        console.log('🔄 Updating existing promoter with ID:', promoterToEdit.id)
        const updatePromise = supabase
          .from('promoters')
          .update(promoterData)
          .eq('id', promoterToEdit.id)
          .select()
        
        result = await Promise.race([updatePromise, dbTimeoutPromise]) as any
      } else {
        console.log('➕ Creating new promoter')
        const insertPromise = supabase
          .from('promoters')
          .insert([{ ...promoterData, created_at: new Date().toISOString() }])
          .select()
        
        result = await Promise.race([insertPromise, dbTimeoutPromise]) as any
      }

      console.log('📊 Database operation result:', result)
      
      if (result.error) {
        console.error('❌ Database error:', result.error)
        throw new Error(`Database error: ${result.error.message}`)
      }

      if (!result.data || result.data.length === 0) {
        console.error('❌ No data returned from database operation')
        throw new Error('No data returned from database operation')
      }

      console.log('✅ Database operation successful:', result.data)

      // Clear timeout since operation completed successfully
      clearTimeout(timeoutId)

      toast({
        title: isEditMode ? "Promoter updated" : "Promoter created",
        description: isEditMode 
          ? "Promoter information has been updated successfully"
          : "New promoter has been added successfully",
        variant: "default"
      })

      console.log('🎉 Form submission completed successfully')
      onFormSubmit()
    } catch (error) {
      console.error('❌ Form submission error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save promoter information. Please try again."
      
      // Clear timeout since operation failed
      clearTimeout(timeoutId)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      console.log('🏁 Form submission finished, setting isSubmitting to false')
      setIsSubmitting(false)
    }
  }

  const { data: parties, isLoading: partiesLoading, error: partiesError } = useParties("Employer")

  // Handle parties loading error
  useEffect(() => {
    if (partiesError) {
      console.error('Error loading parties:', partiesError)
      toast({
        title: "Error Loading Companies",
        description: "Failed to load company/employer data. Please refresh the page.",
        variant: "destructive"
      })
    }
  }, [partiesError, toast])

  // Error boundary for the entire component
  if (formError && !isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="mx-auto max-w-6xl">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {formError}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={onCancel}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {isEditMode ? "Edit Promoter" : "Add New Promoter"}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {isEditMode 
                    ? "Update promoter information and documents"
                    : "Create a new promoter profile with comprehensive details"
                  }
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Form Progress
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formProgress}% Complete
                </p>
              </div>
              <div className="w-32">
                <Progress value={formProgress} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Document Status Overview */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Document Status Overview
                </CardTitle>
                <CardDescription>
                  Monitor the validity of important documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <idCardStatus.icon className={cn("h-6 w-6", idCardStatus.color)} />
                    <div>
                      <p className="font-medium">ID Card</p>
                      <p className={cn("text-sm", idCardStatus.color)}>{idCardStatus.text}</p>
                      {watchedData.id_card_expiry_date && (
                        <p className="text-xs text-slate-500">
                          Expires: {(() => {
                            try {
                              return format(parseISO(watchedData.id_card_expiry_date), "dd/MM/yyyy")
                            } catch (error) {
                              console.error('Error parsing ID card expiry date:', error)
                              return 'Invalid date'
                            }
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <passportStatus.icon className={cn("h-6 w-6", passportStatus.color)} />
                    <div>
                      <p className="font-medium">Passport</p>
                      <p className={cn("text-sm", passportStatus.color)}>{passportStatus.text}</p>
                      {watchedData.passport_expiry_date && (
                        <p className="text-xs text-slate-500">
                          Expires: {(() => {
                            try {
                              return format(parseISO(watchedData.passport_expiry_date), "dd/MM/yyyy")
                            } catch (error) {
                              console.error('Error parsing passport expiry date:', error)
                              return 'Invalid date'
                            }
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Form Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="professional" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Professional
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Basic personal details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        {watchedData.profile_picture_url && (
                          <AvatarImage src={watchedData.profile_picture_url} />
                        )}
                        <AvatarFallback>
                          {watchedData.name_en?.charAt(0) || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name="profile_picture_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Picture</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Enter image URL or upload file"
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const input = document.createElement('input')
                                      input.type = 'file'
                                      input.accept = 'image/*'
                                      input.onchange = (e) => {
                                        const target = e.target as HTMLInputElement
                                        const file = target.files?.[0]
                                        if (file) {
                                          handleFileChange(file, 'profile_picture_url', `profile-pictures/${Date.now()}-${file.name}`)
                                        }
                                        // Clean up the input element
                                        input.remove()
                                      }
                                      input.click()
                                    }}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name_en"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name (English) *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter English name" value={field.value ?? ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="name_ar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name (Arabic) *</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل الاسم بالعربية" value={field.value ?? ""} onChange={field.onChange} dir="rtl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" type="email" value={field.value ?? ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mobile_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="12345678 (minimum 8 digits)" value={field.value ?? ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Address Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" value={field.value ?? ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" value={field.value ?? ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="Country" value={field.value ?? ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Identity Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="id_card_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Card Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="1234567890" value={field.value ?? ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="passport_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Passport Number</FormLabel>
                            <FormControl>
                              <Input placeholder="A12345678" value={field.value ?? ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality</FormLabel>
                            <FormControl>
                              <NationalitySelect
                                value={field.value ?? undefined}
                                onValueChange={field.onChange}
                                placeholder="Select nationality"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document Management
                    </CardTitle>
                    <CardDescription>
                      Upload and manage important documents with expiry tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* ID Card Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">ID Card</h3>
                        <Badge variant={idCardStatus.status === 'valid' ? 'default' : 'destructive'}>
                          {idCardStatus.text}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="id_card_expiry_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <CustomDateInput
                                  value={field.value ?? ""}
                                  onChange={field.onChange}
                                  placeholder="dd/mm/yyyy"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = 'image/*,.pdf'
                              input.onchange = (e) => {
                                const target = e.target as HTMLInputElement
                                const file = target.files?.[0]
                                if (file) {
                                  handleFileChange(file, 'id_card_image', `id-cards/${Date.now()}-${file.name}`)
                                }
                                // Clean up the input element
                                input.remove()
                              }
                              input.click()
                            }}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload ID Card
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Passport Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Passport</h3>
                        <Badge variant={passportStatus.status === 'valid' ? 'default' : 'destructive'}>
                          {passportStatus.text}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="passport_expiry_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <CustomDateInput
                                  value={field.value ?? ""}
                                  onChange={field.onChange}
                                  placeholder="dd/mm/yyyy"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = 'image/*,.pdf'
                              input.onchange = (e) => {
                                const target = e.target as HTMLInputElement
                                const file = target.files?.[0]
                                if (file) {
                                  handleFileChange(file, 'passport_image', `passports/${Date.now()}-${file.name}`)
                                }
                                // Clean up the input element
                                input.remove()
                              }
                              input.click()
                            }}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Passport
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Notification Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="notify_days_before_id_expiry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID Card Expiry Alert (days)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="365"
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Days before expiry to send notification
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="notify_days_before_passport_expiry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Passport Expiry Alert (days)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="365"
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Days before expiry to send notification
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Professional Information Tab */}
              <TabsContent value="professional" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Professional Information
                    </CardTitle>
                    <CardDescription>
                      Work-related details and contract information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Employer/Company Select */}
                    <FormField
                      control={form.control}
                      name="employer_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company / Employer (Second Party)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? undefined}
                            disabled={partiesLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={partiesLoading ? "Loading companies..." : "Select company/employer"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {parties && parties.length > 0 ? (
                                parties.map((party) => (
                                  <SelectItem key={party.id} value={party.id}>
                                    {party.name_en} / {party.name_ar}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>
                                  {partiesLoading ? "Loading..." : "No companies found"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                          {/* Optionally, add a link/button to add a new company */}
                          <div className="mt-2">
                            <a href="/manage-parties" target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                              Add new company/party
                            </a>
                          </div>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="job_title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <EnhancedSelect
                                options={JOB_TITLES}
                                value={field.value || undefined}
                                onValueChange={field.onChange}
                                placeholder="Select job title or add custom"
                                onAddCustom={(value) => field.onChange(value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <EnhancedSelect
                                options={DEPARTMENTS}
                                value={field.value || undefined}
                                onValueChange={field.onChange}
                                placeholder="Select department or add custom"
                                onAddCustom={(value) => field.onChange(value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="work_location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Location</FormLabel>
                            <FormControl>
                              <EnhancedSelect
                                options={WORK_LOCATIONS}
                                value={field.value || undefined}
                                onValueChange={field.onChange}
                                placeholder="Select work location or add custom"
                                onAddCustom={(value) => field.onChange(value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any additional information about the promoter..."
                              className="min-h-[100px]"
                              value={field.value ?? ""}
                              onChange={field.onChange} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Form Settings
                    </CardTitle>
                    <CardDescription>
                      Configure form behavior and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="is_editable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Editable Mode</FormLabel>
                              <FormDescription>
                                Allow editing of promoter information after creation
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="auto_notifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Auto Notifications</FormLabel>
                              <FormDescription>
                                Automatically send notifications for document expiry
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="require_approval"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Require Approval</FormLabel>
                              <FormDescription>
                                Require admin approval for changes to this promoter
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Promoter Preview
                    </CardTitle>
                    <CardDescription>
                      Review all information before saving
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Info Preview */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Name (EN):</span>
                            <span className="font-medium">{watchedData.name_en || "Not provided"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Name (AR):</span>
                            <span className="font-medium" dir="rtl">{watchedData.name_ar || "Not provided"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Mobile:</span>
                            <span className="font-medium">{watchedData.mobile_number || "Not provided"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Email:</span>
                            <span className="font-medium">{watchedData.email || "Not provided"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Document Status Preview */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Document Status</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">ID Card:</span>
                            <Badge variant={idCardStatus.status === 'valid' ? 'default' : 'destructive'}>
                              {idCardStatus.text}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Passport:</span>
                            <Badge variant={passportStatus.status === 'valid' ? 'default' : 'destructive'}>
                              {passportStatus.text}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Status:</span>
                            <Badge variant="outline">{watchedData.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Form Error Display */}
            {formError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {/* Debug Form Errors */}
            {Object.keys(form.formState.errors).length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800">Form Validation Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <div key={field} className="text-sm text-red-700">
                        <strong>{field}:</strong> {typeof error?.message === 'string' ? error.message : 'Unknown error'}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Progress Indicator */}
            {isUploading && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">Uploading file...</p>
                      <Progress value={uploadProgress} className="h-2 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentIndex = ['personal', 'documents', 'professional', 'settings', 'preview'].indexOf(activeTab)
                    if (currentIndex > 0) {
                      setActiveTab(['personal', 'documents', 'professional', 'settings', 'preview'][currentIndex - 1])
                    }
                  }}
                  disabled={activeTab === 'personal'}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentIndex = ['personal', 'documents', 'professional', 'settings', 'preview'].indexOf(activeTab)
                    if (currentIndex < 4) {
                      setActiveTab(['personal', 'documents', 'professional', 'settings', 'preview'][currentIndex + 1])
                    }
                  }}
                  disabled={activeTab === 'preview'}
                >
                  Next
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      console.log('🧪 Testing database insert...')
                      const response = await fetch('/api/test-promoter-insert', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        }
                      })
                      const data = await response.json()
                      console.log('📊 Database test result:', data)
                      
                      if (data.success) {
                        toast({
                          title: "Database Test Success",
                          description: "Database insert is working correctly",
                          variant: "default"
                        })
                      } else {
                        toast({
                          title: "Database Test Failed",
                          description: data.error || "Database insert failed",
                          variant: "destructive"
                        })
                      }
                    } catch (err) {
                      console.error('❌ Database test error:', err)
                      toast({
                        title: "Database Test Error",
                        description: "Failed to test database connection",
                        variant: "destructive"
                      })
                    }
                  }}
                >
                  Test DB
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading || !form.formState.isValid}
                  className="min-w-[120px]"
                  onClick={() => {
                    console.log('🔘 Create Promoter button clicked')
                    console.log('📋 Form state:', {
                      isSubmitting,
                      isUploading,
                      isValid: form.formState.isValid,
                      errors: form.formState.errors,
                      isDirty: form.formState.isDirty,
                      values: form.getValues()
                    })
                    
                    // Trigger form validation
                    form.trigger().then((isValid) => {
                      console.log('✅ Form validation result:', isValid)
                      if (!isValid) {
                        console.log('❌ Form validation errors:', form.formState.errors)
                        // Show validation errors to user
                        const errorMessages = Object.entries(form.formState.errors)
                          .map(([field, error]) => `${field}: ${error?.message}`)
                          .join(', ')
                        toast({
                          title: "Validation Errors",
                          description: errorMessages,
                          variant: "destructive"
                        })
                      } else {
                        console.log('✅ Form is valid, proceeding with submission...')
                      }
                    }).catch((error) => {
                      console.error('❌ Form validation error:', error)
                      toast({
                        title: "Validation Error",
                        description: "An error occurred during form validation",
                        variant: "destructive"
                      })
                    })
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditMode ? "Update Promoter" : "Create Promoter"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 