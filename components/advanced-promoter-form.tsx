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

// Enhanced Select Component with Add Option
const EnhancedSelect = ({ 
  options, 
  value, 
  onValueChange, 
  placeholder, 
  onAddCustom 
}: {
  options: readonly { value: string; label: string }[]
  value?: string | null
  onValueChange: (value: string) => void
  placeholder: string
  onAddCustom?: (value: string) => void
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [customValue, setCustomValue] = useState("")

  const handleAddCustom = () => {
    if (customValue.trim() && onAddCustom) {
      onAddCustom(customValue.trim())
      setCustomValue("")
      setIsAdding(false)
    }
  }

  return (
    <Select onValueChange={onValueChange} value={value ?? undefined}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        
        {onAddCustom && (
          <>
            <SelectSeparator />
            {isAdding ? (
              <div className="p-2 space-y-2">
                <Input
                  placeholder="Enter custom value..."
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
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
                onSelect={(e) => {
                  e.preventDefault()
                  setIsAdding(true)
                }}
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
  name_en: z.string().min(2, "English name must be at least 2 characters"),
  name_ar: z.string().min(2, "Arabic name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().nullable(),
  mobile_number: z.string().min(10, "Mobile number must be at least 10 digits"),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  
  // Identity Documents
  id_card_number: z.string().min(5, "ID card number must be at least 5 characters"),
  passport_number: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  
  // Professional Information
  job_title: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  work_location: z.string().optional().nullable(),
  employer_id: z.string().optional().nullable(),
  outsourced_to_id: z.string().optional().nullable(),
  
  // Status and Contracts
  status: z.enum(["active", "inactive", "pending", "suspended"]),
  contract_valid_until: z.string().optional().nullable(),
  
  // Document Expiry Dates
  id_card_expiry_date: z.string().optional().nullable(),
  passport_expiry_date: z.string().optional().nullable(),
  
  // Notification Settings
  notify_days_before_id_expiry: z.number().min(1).max(365),
  notify_days_before_passport_expiry: z.number().min(1).max(365),
  
  // Documents
  profile_picture_url: z.string().optional().nullable(),
  id_card_image: z.any().optional().nullable(),
  passport_image: z.any().optional().nullable(),
  cv_document: z.any().optional().nullable(),
  
  // Additional Information
  notes: z.string().optional().nullable(),
  skills: z.array(z.string()).optional().default([]),
  experience_years: z.number().min(0).max(50).optional().default(0),
  education_level: z.string().optional().nullable(),
  
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
  
  const daysUntilExpiry = differenceInDays(parseISO(expiryDate), new Date())
  
  if (daysUntilExpiry < 0) {
    return { status: "expired", color: "text-red-500", icon: XCircle, text: "Expired" }
  } else if (daysUntilExpiry <= 30) {
    return { status: "expiring", color: "text-yellow-500", icon: AlertTriangle, text: "Expiring Soon" }
  } else {
    return { status: "valid", color: "text-green-500", icon: CheckCircle, text: "Valid" }
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
  const isEditMode = !!promoterToEdit
  
  // Register this form to disable auto-refresh during form interactions
  useFormRegistration()

  const form = useForm<AdvancedPromoterFormData>({
    resolver: zodResolver(advancedPromoterSchema),
    defaultValues: {
      name_en: promoterToEdit?.name_en || "",
      name_ar: promoterToEdit?.name_ar || "",
      email: promoterToEdit?.email || null,
      mobile_number: promoterToEdit?.mobile_number || "",
      phone_number: promoterToEdit?.phone || null,
      address: promoterToEdit?.address || null,
      city: null,
      country: null,
      id_card_number: promoterToEdit?.id_card_number || "",
      passport_number: promoterToEdit?.passport_number || null,
      nationality: promoterToEdit?.nationality || null,
      date_of_birth: null,
      job_title: promoterToEdit?.job_title || null,
      department: null,
      work_location: promoterToEdit?.work_location || null,
      employer_id: promoterToEdit?.employer_id || null,
      outsourced_to_id: promoterToEdit?.outsourced_to_id || null,
      status: (promoterToEdit?.status as any) || "active",
      contract_valid_until: promoterToEdit?.contract_valid_until || null,
      id_card_expiry_date: promoterToEdit?.id_card_expiry_date || null,
      passport_expiry_date: promoterToEdit?.passport_expiry_date || null,
      notify_days_before_id_expiry: promoterToEdit?.notify_days_before_id_expiry ?? 30,
      notify_days_before_passport_expiry: promoterToEdit?.notify_days_before_passport_expiry ?? 90,
      profile_picture_url: promoterToEdit?.profile_picture_url || null,
      notes: promoterToEdit?.notes || null,
      skills: [],
      experience_years: 0,
      education_level: null,
      is_editable: true,
      auto_notifications: true,
      require_approval: false
    }
  })

  // Watch form data for progress calculation
  const watchedData = useWatch({ control: form.control })
  const formProgress = getFormProgress(watchedData)

  // Document status calculations
  const idCardStatus = getDocumentStatus(watchedData.id_card_expiry_date)
  const passportStatus = getDocumentStatus(watchedData.passport_expiry_date)

  // File upload handler
  const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const supabase = createClient()
      
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

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      throw new Error('Failed to upload file')
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
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    }
  }, [uploadFile, form, toast])

  // Form submission
  const onSubmit = async (values: AdvancedPromoterFormData) => {
    console.log('Form submission started with values:', values)
    console.log('Form errors:', form.formState.errors)
    setIsSubmitting(true)
    
    try {
      const supabase = createClient()
      
      // Check if supabase client is available
      if (!supabase) {
        throw new Error('Database connection not available')
      }
      
      console.log('Supabase client created successfully')
      
      const promoterData = {
        name_en: values.name_en,
        name_ar: values.name_ar,
        email: values.email,
        mobile_number: values.mobile_number,
        phone: values.phone_number,
        address: values.address,
        id_card_number: values.id_card_number,
        passport_number: values.passport_number,
        job_title: values.job_title,
        work_location: values.work_location,
        employer_id: values.employer_id,
        outsourced_to_id: values.outsourced_to_id,
        status: values.status,
        contract_valid_until: values.contract_valid_until,
        id_card_expiry_date: values.id_card_expiry_date,
        passport_expiry_date: values.passport_expiry_date,
        profile_picture_url: values.profile_picture_url,
        notes: values.notes,
        updated_at: new Date().toISOString()
      }

      console.log('Preparing promoter data:', promoterData)
      
      let result
      if (isEditMode && promoterToEdit?.id) {
        console.log('Updating existing promoter with ID:', promoterToEdit.id)
        result = await supabase
          .from('promoters')
          .update(promoterData)
          .eq('id', promoterToEdit.id)
          .select()
      } else {
        console.log('Creating new promoter')
        result = await supabase
          .from('promoters')
          .insert([{ ...promoterData, created_at: new Date().toISOString() }])
          .select()
      }

      console.log('Database operation result:', result)
      if (result.error) throw result.error

      toast({
        title: isEditMode ? "Promoter updated" : "Promoter created",
        description: isEditMode 
          ? "Promoter information has been updated successfully"
          : "New promoter has been added successfully",
        variant: "default"
      })

      onFormSubmit()
    } catch (error) {
      console.error('Form submission error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save promoter information. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const { data: parties, isLoading: partiesLoading } = useParties("Employer")

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
                          Expires: {format(parseISO(watchedData.id_card_expiry_date), "dd/MM/yyyy")}
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
                          Expires: {format(parseISO(watchedData.passport_expiry_date), "dd/MM/yyyy")}
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
                                        const file = (e.target as HTMLInputElement).files?.[0]
                                        if (file) {
                                          handleFileChange(file, 'profile_picture_url', `profile-pictures/${Date.now()}-${file.name}`)
                                        }
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
                              <Input placeholder="+966 50 123 4567" value={field.value ?? ""} onChange={field.onChange} />
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
                                <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
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
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (file) {
                                  handleFileChange(file, 'id_card_image', `id-cards/${Date.now()}-${file.name}`)
                                }
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
                                <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
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
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (file) {
                                  handleFileChange(file, 'passport_image', `passports/${Date.now()}-${file.name}`)
                                }
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
                                value={field.value ?? undefined}
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
                                value={field.value ?? undefined}
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
                                value={field.value ?? undefined}
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
                        name="contract_valid_until"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract Valid Until</FormLabel>
                            <FormControl>
                              <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="min-w-[120px]"
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