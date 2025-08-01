"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

import { 
  Save, User, Phone, FileText, Settings, Star, X,
  CheckCircle, Shield, Edit3, Plus, Building
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { formatDateForDatabase } from "@/lib/date-utils"
import { DateInput } from "@/components/ui/date-input"

interface PromoterFormProfessionalProps {
  promoterToEdit?: any | null
  onFormSubmit: () => void
  onCancel?: () => void
}

export default function PromoterFormProfessional(props: PromoterFormProfessionalProps) {
  const { promoterToEdit, onFormSubmit, onCancel } = props
  const { toast } = useToast()
  const isEditMode = Boolean(promoterToEdit)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [formProgress, setFormProgress] = useState(0)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isClient, setIsClient] = useState(false)
  const [employers, setEmployers] = useState<{ id: string; name_en: string; name_ar: string }[]>([])
  const [employersLoading, setEmployersLoading] = useState(false)

  // Safe initialization with fallbacks
  const safeGetValue = (obj: any, key: string, defaultValue: string = "") => {
    try {
      if (!obj || typeof obj !== 'object') return defaultValue
      const value = obj[key]
      if (value == null || value === undefined) return defaultValue
      return String(value || "")
    } catch {
      return defaultValue
    }
  }

  const safeGetNumber = (obj: any, key: string, defaultValue: number = 30) => {
    try {
      if (!obj || typeof obj !== 'object') return defaultValue
      const value = obj[key]
      if (value == null || value === undefined) return defaultValue
      const num = Number(value)
      return isNaN(num) ? defaultValue : num
    } catch {
      return defaultValue
    }
  }

  const [formData, setFormData] = useState({
    // Personal Information
    full_name: "",
    name_ar: "",
    email: "",
    phone: "",
    mobile_number: "",
    date_of_birth: "",
    gender: "",
    marital_status: "",
    nationality: "",
    
    // Address Information
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    emergency_contact: "",
    emergency_phone: "",
    
    // Document Information
    id_number: "",
    passport_number: "",
    id_expiry_date: "",
    passport_expiry_date: "",
    visa_number: "",
    visa_expiry_date: "",
    work_permit_number: "",
    work_permit_expiry_date: "",
    
    // Professional Information
    job_title: "",
    company: "",
    department: "",
    specialization: "",
    experience_years: "",
    education_level: "",
    university: "",
    graduation_year: "",
    skills: "",
    certifications: "",
    
    // Financial Information
    bank_name: "",
    account_number: "",
    iban: "",
    swift_code: "",
    tax_id: "",
    
    // Status and Preferences
    status: "active",
    rating: "",
    availability: "",
    preferred_language: "",
    timezone: "",
    special_requirements: "",
    
    // Additional Information
    notes: "",
    profile_picture_url: "",
    
    // Notification settings
    notify_days_before_id_expiry: 30,
    notify_days_before_passport_expiry: 30,
    
    // Employer assignment
    employer_id: "",
  })

  // Fetch employers for dropdown
  const fetchEmployers = useCallback(async () => {
    setEmployersLoading(true)
    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error("Failed to create Supabase client")
      }

      const { data, error } = await supabase
        .from('parties')
        .select('id, name_en, name_ar')
        .eq('type', 'Employer')
        .order('name_en')

      if (error) {
        throw error
      }

      setEmployers(data || [])
    } catch (error) {
      console.error('Error fetching employers:', error)
      toast({
        title: "Error",
        description: "Failed to load employers",
        variant: "destructive",
      })
    } finally {
      setEmployersLoading(false)
    }
  }, [toast])

  // Initialize form data after client-side hydration
  useEffect(() => {
    setIsClient(true)
    fetchEmployers()
    
    if (promoterToEdit) {
      setFormData({
        full_name: safeGetValue(promoterToEdit, 'name_en'),
        name_ar: safeGetValue(promoterToEdit, 'name_ar'),
        email: safeGetValue(promoterToEdit, 'email'),
        phone: safeGetValue(promoterToEdit, 'phone'),
        mobile_number: safeGetValue(promoterToEdit, 'mobile_number'),
        date_of_birth: safeGetValue(promoterToEdit, 'date_of_birth'),
        gender: safeGetValue(promoterToEdit, 'gender'),
        marital_status: safeGetValue(promoterToEdit, 'marital_status'),
        nationality: safeGetValue(promoterToEdit, 'nationality'),
        address: safeGetValue(promoterToEdit, 'address'),
        city: safeGetValue(promoterToEdit, 'city'),
        state: safeGetValue(promoterToEdit, 'state'),
        country: safeGetValue(promoterToEdit, 'country'),
        postal_code: safeGetValue(promoterToEdit, 'postal_code'),
        emergency_contact: safeGetValue(promoterToEdit, 'emergency_contact'),
        emergency_phone: safeGetValue(promoterToEdit, 'emergency_phone'),
        id_number: safeGetValue(promoterToEdit, 'id_card_number'),
        passport_number: safeGetValue(promoterToEdit, 'passport_number'),
        id_expiry_date: safeGetValue(promoterToEdit, 'id_card_expiry_date'),
        passport_expiry_date: safeGetValue(promoterToEdit, 'passport_expiry_date'),
        visa_number: safeGetValue(promoterToEdit, 'visa_number'),
        visa_expiry_date: safeGetValue(promoterToEdit, 'visa_expiry_date'),
        work_permit_number: safeGetValue(promoterToEdit, 'work_permit_number'),
        work_permit_expiry_date: safeGetValue(promoterToEdit, 'work_permit_expiry_date'),
        job_title: safeGetValue(promoterToEdit, 'job_title'),
        company: safeGetValue(promoterToEdit, 'company'),
        department: safeGetValue(promoterToEdit, 'department'),
        specialization: safeGetValue(promoterToEdit, 'specialization'),
        experience_years: safeGetValue(promoterToEdit, 'experience_years'),
        education_level: safeGetValue(promoterToEdit, 'education_level'),
        university: safeGetValue(promoterToEdit, 'university'),
        graduation_year: safeGetValue(promoterToEdit, 'graduation_year'),
        skills: safeGetValue(promoterToEdit, 'skills'),
        certifications: safeGetValue(promoterToEdit, 'certifications'),
        bank_name: safeGetValue(promoterToEdit, 'bank_name'),
        account_number: safeGetValue(promoterToEdit, 'account_number'),
        iban: safeGetValue(promoterToEdit, 'iban'),
        swift_code: safeGetValue(promoterToEdit, 'swift_code'),
        tax_id: safeGetValue(promoterToEdit, 'tax_id'),
        status: safeGetValue(promoterToEdit, 'status', 'active'),
        rating: safeGetValue(promoterToEdit, 'rating'),
        availability: safeGetValue(promoterToEdit, 'availability'),
        preferred_language: safeGetValue(promoterToEdit, 'preferred_language'),
        timezone: safeGetValue(promoterToEdit, 'timezone'),
        special_requirements: safeGetValue(promoterToEdit, 'special_requirements'),
        notes: safeGetValue(promoterToEdit, 'notes'),
        profile_picture_url: safeGetValue(promoterToEdit, 'profile_picture_url'),
        notify_days_before_id_expiry: safeGetNumber(promoterToEdit, 'notify_days_before_id_expiry', 30),
        notify_days_before_passport_expiry: safeGetNumber(promoterToEdit, 'notify_days_before_passport_expiry', 30),
        employer_id: safeGetValue(promoterToEdit, 'employer_id') || "none",
      })
    }
  }, [promoterToEdit, fetchEmployers])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Required fields validation
    if (!formData.full_name?.trim()) {
      errors.full_name = "Full name is required"
    }

    if (!formData.name_ar?.trim()) {
      errors.name_ar = "Arabic name is required"
    }

    if (!formData.id_number?.trim()) {
      errors.id_number = "ID number is required"
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    // Phone validation
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number"
    }

    // Mobile validation
    if (formData.mobile_number && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formData.mobile_number)) {
      errors.mobile_number = "Please enter a valid mobile number"
    }

    // Date validation
    if (formData.id_expiry_date) {
      const idDate = new Date(formData.id_expiry_date)
      if (isNaN(idDate.getTime())) {
        errors.id_expiry_date = "Please enter a valid ID expiry date"
      }
    }

    if (formData.passport_expiry_date) {
      const passportDate = new Date(formData.passport_expiry_date)
      if (isNaN(passportDate.getTime())) {
        errors.passport_expiry_date = "Please enter a valid passport expiry date"
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData) {
      toast({
        title: "Error",
        description: "Form data is not initialized",
        variant: "destructive",
      })
      return
    }
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error("Failed to create Supabase client")
      }

      // Map form data to database schema - include all fields
      const promoterData: any = {
        name_en: formData.full_name?.trim() || "",
        name_ar: formData.name_ar?.trim() || "",
        id_card_number: formData.id_number?.trim() || "",
        passport_number: formData.passport_number?.trim() || "",
        mobile_number: formData.mobile_number?.trim() || "",
        id_card_expiry_date: formData.id_expiry_date ? formatDateForDatabase(formData.id_expiry_date) : null,
        passport_expiry_date: formData.passport_expiry_date ? formatDateForDatabase(formData.passport_expiry_date) : null,
        email: formData.email?.trim() || "",
        phone: formData.phone?.trim() || "",
        status: formData.status || "active",
        notes: formData.notes?.trim() || "",
        profile_picture_url: formData.profile_picture_url?.trim() || "",
        notify_days_before_id_expiry: parseInt(String(formData.notify_days_before_id_expiry || 30)),
        notify_days_before_passport_expiry: parseInt(String(formData.notify_days_before_passport_expiry || 30)),
        
        // Personal Information
        date_of_birth: formData.date_of_birth ? formatDateForDatabase(formData.date_of_birth) : null,
        gender: formData.gender?.trim() || null,
        marital_status: formData.marital_status?.trim() || null,
        nationality: formData.nationality?.trim() || null,
        
        // Address Information
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        country: formData.country?.trim() || null,
        postal_code: formData.postal_code?.trim() || null,
        emergency_contact: formData.emergency_contact?.trim() || null,
        emergency_phone: formData.emergency_phone?.trim() || null,
        
        // Document Information
        visa_number: formData.visa_number?.trim() || null,
        visa_expiry_date: formData.visa_expiry_date ? formatDateForDatabase(formData.visa_expiry_date) : null,
        work_permit_number: formData.work_permit_number?.trim() || null,
        work_permit_expiry_date: formData.work_permit_expiry_date ? formatDateForDatabase(formData.work_permit_expiry_date) : null,
        
        // Professional Information
        job_title: formData.job_title?.trim() || null,
        company: formData.company?.trim() || null,
        department: formData.department?.trim() || null,
        specialization: formData.specialization?.trim() || null,
        experience_years: formData.experience_years ? parseInt(String(formData.experience_years)) : null,
        education_level: formData.education_level?.trim() || null,
        university: formData.university?.trim() || null,
        graduation_year: formData.graduation_year ? parseInt(String(formData.graduation_year)) : null,
        skills: formData.skills?.trim() || null,
        certifications: formData.certifications?.trim() || null,
        
        // Financial Information
        bank_name: formData.bank_name?.trim() || null,
        account_number: formData.account_number?.trim() || null,
        iban: formData.iban?.trim() || null,
        swift_code: formData.swift_code?.trim() || null,
        tax_id: formData.tax_id?.trim() || null,
        
        // Preferences and Ratings
        rating: formData.rating ? parseFloat(String(formData.rating)) : null,
        availability: formData.availability?.trim() || null,
        preferred_language: formData.preferred_language?.trim() || null,
        timezone: formData.timezone?.trim() || null,
        special_requirements: formData.special_requirements?.trim() || null,
      }

      // Add employer_id if selected (but not "none")
      if (formData.employer_id && formData.employer_id !== "none") {
        promoterData.employer_id = formData.employer_id
      } else {
        // Set to null if "none" is selected or no employer is selected
        promoterData.employer_id = null
      }

      let result
      if (isEditMode && promoterToEdit) {
        const idCardNumberChanged = formData.id_number !== safeGetValue(promoterToEdit, 'id_card_number')
        
        if (idCardNumberChanged && formData.id_number) {
          const { data: existingPromoter, error: checkError } = await supabase
            .from('promoters')
            .select('id')
            .eq('id_card_number', formData.id_number)
            .neq('id', promoterToEdit.id)
            .single()

          if (checkError && checkError.code !== 'PGRST116') {
            throw new Error(checkError.message)
          }

          if (existingPromoter) {
            throw new Error(`ID card number ${formData.id_number} already exists for another promoter`)
          }
        }

        result = await supabase
          .from('promoters')
          .update(promoterData)
          .eq('id', promoterToEdit.id)
      } else {
        // For new promoters, check if ID card number already exists
        if (formData.id_number) {
          const { data: existingPromoter, error: checkError } = await supabase
            .from('promoters')
            .select('id')
            .eq('id_card_number', formData.id_number)
            .single()

          if (checkError && checkError.code !== 'PGRST116') {
            throw new Error(checkError.message)
          }

          if (existingPromoter) {
            throw new Error(`ID card number ${formData.id_number} already exists for another promoter`)
          }
        }

        result = await supabase
          .from('promoters')
          .insert([{ ...promoterData, created_at: new Date().toISOString() }])
      }

      if (result.error) {
        throw new Error(result.error.message)
      }

      toast({
        title: isEditMode ? "Promoter Updated" : "Promoter Added",
        description: isEditMode 
          ? "Promoter details have been updated successfully."
          : "New promoter has been added successfully.",
      })

      onFormSubmit()
    } catch (error) {
      console.error('Error saving promoter:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save promoter",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state during SSR or when formData is not initialized
  if (!isClient || !formData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditMode ? "Edit Promoter" : "Add New Promoter"}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode ? "Update promoter information" : "Fill in the promoter details"}
          </p>
        </div>
        <Badge variant={isEditMode ? "secondary" : "default"}>
          {isEditMode ? "Edit Mode" : "New Promoter"}
        </Badge>
      </div>

      {/* Form Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Form Completion</span>
          <span>{formProgress}%</span>
        </div>
        <Progress value={formProgress} className="h-2" />
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                   <TabsList className="grid w-full grid-cols-6">
           <TabsTrigger value="personal" className="flex items-center gap-2">
             <User className="h-4 w-4" />
             Personal
           </TabsTrigger>
           <TabsTrigger value="documents" className="flex items-center gap-2">
             <FileText className="h-4 w-4" />
             Documents
           </TabsTrigger>
           <TabsTrigger value="contact" className="flex items-center gap-2">
             <Phone className="h-4 w-4" />
             Contact
           </TabsTrigger>
           <TabsTrigger value="professional" className="flex items-center gap-2">
             <Building className="h-4 w-4" />
             Professional
           </TabsTrigger>
           <TabsTrigger value="financial" className="flex items-center gap-2">
             <Star className="h-4 w-4" />
             Financial
           </TabsTrigger>
           <TabsTrigger value="settings" className="flex items-center gap-2">
             <Settings className="h-4 w-4" />
             Settings
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
                  Basic personal details and identification information
                </CardDescription>
              </CardHeader>
                             <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="full_name">Full Name (English) *</Label>
                     <Input
                       id="full_name"
                       value={formData.full_name}
                       onChange={(e) => handleInputChange('full_name', e.target.value)}
                       placeholder="Enter full name in English"
                       className={validationErrors.full_name ? "border-red-500" : ""}
                     />
                     {validationErrors.full_name && (
                       <p className="text-sm text-red-500">{validationErrors.full_name}</p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="name_ar">Full Name (Arabic) *</Label>
                     <Input
                       id="name_ar"
                       value={formData.name_ar}
                       onChange={(e) => handleInputChange('name_ar', e.target.value)}
                       placeholder="Enter full name in Arabic"
                       className={validationErrors.name_ar ? "border-red-500" : ""}
                     />
                     {validationErrors.name_ar && (
                       <p className="text-sm text-red-500">{validationErrors.name_ar}</p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="date_of_birth">Date of Birth</Label>
                     <DateInput
                       id="date_of_birth"
                       label=""
                       value={formData.date_of_birth}
                       onChange={(value) => handleInputChange('date_of_birth', value)}
                       placeholder="DD/MM/YYYY"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="gender">Gender</Label>
                     <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select gender" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="male">Male</SelectItem>
                         <SelectItem value="female">Female</SelectItem>
                         <SelectItem value="other">Other</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="marital_status">Marital Status</Label>
                     <Select value={formData.marital_status} onValueChange={(value) => handleInputChange('marital_status', value)}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select marital status" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="single">Single</SelectItem>
                         <SelectItem value="married">Married</SelectItem>
                         <SelectItem value="divorced">Divorced</SelectItem>
                         <SelectItem value="widowed">Widowed</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="nationality">Nationality</Label>
                     <Input
                       id="nationality"
                       value={formData.nationality}
                       onChange={(e) => handleInputChange('nationality', e.target.value)}
                       placeholder="Enter nationality"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="employer_id">Employer</Label>
                     <Select 
                       value={formData.employer_id} 
                       onValueChange={(value) => handleInputChange('employer_id', value)}
                       disabled={employersLoading}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder={employersLoading ? "Loading employers..." : "Select employer"} />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="none">No employer assigned</SelectItem>
                         {employers.map((employer) => (
                           <SelectItem key={employer.id} value={employer.id}>
                             {employer.name_en || employer.name_ar || employer.id}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="status">Status</Label>
                     <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select status" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="active">Active</SelectItem>
                         <SelectItem value="inactive">Inactive</SelectItem>
                         <SelectItem value="suspended">Suspended</SelectItem>
                         <SelectItem value="pending">Pending</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
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
                  Document Information
                </CardTitle>
                <CardDescription>
                  ID and passport details
                </CardDescription>
              </CardHeader>
                             <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="id_number">ID Number *</Label>
                     <Input
                       id="id_number"
                       value={formData.id_number}
                       onChange={(e) => handleInputChange('id_number', e.target.value)}
                       placeholder="Enter ID number"
                       className={validationErrors.id_number ? "border-red-500" : ""}
                     />
                     {validationErrors.id_number && (
                       <p className="text-sm text-red-500">{validationErrors.id_number}</p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <DateInput
                       id="id_expiry_date"
                       label="ID Expiry Date"
                       value={formData.id_expiry_date}
                       onChange={(value) => handleInputChange('id_expiry_date', value)}
                       placeholder="DD/MM/YYYY"
                     />
                     {validationErrors.id_expiry_date && (
                       <p className="text-sm text-red-500">{validationErrors.id_expiry_date}</p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="passport_number">Passport Number</Label>
                     <Input
                       id="passport_number"
                       value={formData.passport_number}
                       onChange={(e) => handleInputChange('passport_number', e.target.value)}
                       placeholder="Enter passport number"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <DateInput
                       id="passport_expiry_date"
                       label="Passport Expiry Date"
                       value={formData.passport_expiry_date}
                       onChange={(value) => handleInputChange('passport_expiry_date', value)}
                       placeholder="DD/MM/YYYY"
                     />
                     {validationErrors.passport_expiry_date && (
                       <p className="text-sm text-red-500">{validationErrors.passport_expiry_date}</p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="visa_number">Visa Number</Label>
                     <Input
                       id="visa_number"
                       value={formData.visa_number}
                       onChange={(e) => handleInputChange('visa_number', e.target.value)}
                       placeholder="Enter visa number"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <DateInput
                       id="visa_expiry_date"
                       label="Visa Expiry Date"
                       value={formData.visa_expiry_date}
                       onChange={(value) => handleInputChange('visa_expiry_date', value)}
                       placeholder="DD/MM/YYYY"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="work_permit_number">Work Permit Number</Label>
                     <Input
                       id="work_permit_number"
                       value={formData.work_permit_number}
                       onChange={(e) => handleInputChange('work_permit_number', e.target.value)}
                       placeholder="Enter work permit number"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <DateInput
                       id="work_permit_expiry_date"
                       label="Work Permit Expiry Date"
                       value={formData.work_permit_expiry_date}
                       onChange={(value) => handleInputChange('work_permit_expiry_date', value)}
                       placeholder="DD/MM/YYYY"
                     />
                   </div>
                 </div>
               </CardContent>
            </Card>
          </TabsContent>

                     {/* Contact Information Tab */}
           <TabsContent value="contact" className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Phone className="h-5 w-5" />
                   Contact Information
                 </CardTitle>
                 <CardDescription>
                   Email, phone, and address contact details
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="email">Email Address</Label>
                     <Input
                       id="email"
                       type="email"
                       value={formData.email}
                       onChange={(e) => handleInputChange('email', e.target.value)}
                       placeholder="Enter email address"
                       className={validationErrors.email ? "border-red-500" : ""}
                     />
                     {validationErrors.email && (
                       <p className="text-sm text-red-500">{validationErrors.email}</p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="phone">Phone Number</Label>
                     <Input
                       id="phone"
                       value={formData.phone}
                       onChange={(e) => handleInputChange('phone', e.target.value)}
                       placeholder="Enter phone number"
                       className={validationErrors.phone ? "border-red-500" : ""}
                     />
                     {validationErrors.phone && (
                       <p className="text-sm text-red-500">{validationErrors.phone}</p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="mobile_number">Mobile Number</Label>
                     <Input
                       id="mobile_number"
                       value={formData.mobile_number}
                       onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                       placeholder="Enter mobile number"
                       className={validationErrors.mobile_number ? "border-red-500" : ""}
                     />
                     {validationErrors.mobile_number && (
                       <p className="text-sm text-red-500">{validationErrors.mobile_number}</p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="emergency_contact">Emergency Contact</Label>
                     <Input
                       id="emergency_contact"
                       value={formData.emergency_contact}
                       onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                       placeholder="Emergency contact person name"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="emergency_phone">Emergency Phone</Label>
                     <Input
                       id="emergency_phone"
                       value={formData.emergency_phone}
                       onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                       placeholder="Emergency contact phone number"
                     />
                   </div>
                 </div>
                 
                 <div className="space-y-4">
                   <h4 className="text-lg font-medium">Address Information</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="address">Full Address</Label>
                       <Textarea
                         id="address"
                         value={formData.address}
                         onChange={(e) => handleInputChange('address', e.target.value)}
                         placeholder="Enter full address"
                         rows={3}
                       />
                     </div>
                     
                     <div className="space-y-2">
                       <Label htmlFor="city">City</Label>
                       <Input
                         id="city"
                         value={formData.city}
                         onChange={(e) => handleInputChange('city', e.target.value)}
                         placeholder="Enter city"
                       />
                     </div>
                     
                     <div className="space-y-2">
                       <Label htmlFor="state">State/Province</Label>
                       <Input
                         id="state"
                         value={formData.state}
                         onChange={(e) => handleInputChange('state', e.target.value)}
                         placeholder="Enter state or province"
                       />
                     </div>
                     
                     <div className="space-y-2">
                       <Label htmlFor="country">Country</Label>
                       <Input
                         id="country"
                         value={formData.country}
                         onChange={(e) => handleInputChange('country', e.target.value)}
                         placeholder="Enter country"
                       />
                     </div>
                     
                     <div className="space-y-2">
                       <Label htmlFor="postal_code">Postal Code</Label>
                       <Input
                         id="postal_code"
                         value={formData.postal_code}
                         onChange={(e) => handleInputChange('postal_code', e.target.value)}
                         placeholder="Enter postal code"
                       />
                     </div>
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
                   <Building className="h-5 w-5" />
                   Professional Information
                 </CardTitle>
                 <CardDescription>
                   Job details, education, and professional background
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="job_title">Job Title</Label>
                     <Input
                       id="job_title"
                       value={formData.job_title}
                       onChange={(e) => handleInputChange('job_title', e.target.value)}
                       placeholder="Enter job title"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="company">Company</Label>
                     <Input
                       id="company"
                       value={formData.company}
                       onChange={(e) => handleInputChange('company', e.target.value)}
                       placeholder="Enter company name"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="department">Department</Label>
                     <Input
                       id="department"
                       value={formData.department}
                       onChange={(e) => handleInputChange('department', e.target.value)}
                       placeholder="Enter department"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="specialization">Specialization</Label>
                     <Input
                       id="specialization"
                       value={formData.specialization}
                       onChange={(e) => handleInputChange('specialization', e.target.value)}
                       placeholder="Enter specialization"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="experience_years">Years of Experience</Label>
                     <Input
                       id="experience_years"
                       type="number"
                       min="0"
                       max="50"
                       value={formData.experience_years}
                       onChange={(e) => handleInputChange('experience_years', e.target.value)}
                       placeholder="Enter years of experience"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="education_level">Education Level</Label>
                     <Select value={formData.education_level} onValueChange={(value) => handleInputChange('education_level', value)}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select education level" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="high_school">High School</SelectItem>
                         <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                         <SelectItem value="master">Master's Degree</SelectItem>
                         <SelectItem value="phd">PhD</SelectItem>
                         <SelectItem value="diploma">Diploma</SelectItem>
                         <SelectItem value="certificate">Certificate</SelectItem>
                         <SelectItem value="other">Other</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="university">University/Institution</Label>
                     <Input
                       id="university"
                       value={formData.university}
                       onChange={(e) => handleInputChange('university', e.target.value)}
                       placeholder="Enter university or institution"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="graduation_year">Graduation Year</Label>
                     <Input
                       id="graduation_year"
                       type="number"
                       min="1950"
                       max={new Date().getFullYear()}
                       value={formData.graduation_year}
                       onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                       placeholder="Enter graduation year"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="skills">Skills</Label>
                     <Textarea
                       id="skills"
                       value={formData.skills}
                       onChange={(e) => handleInputChange('skills', e.target.value)}
                       placeholder="Enter skills (comma-separated)"
                       rows={3}
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="certifications">Certifications</Label>
                     <Textarea
                       id="certifications"
                       value={formData.certifications}
                       onChange={(e) => handleInputChange('certifications', e.target.value)}
                       placeholder="Enter certifications (comma-separated)"
                       rows={3}
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="rating">Performance Rating</Label>
                     <Input
                       id="rating"
                       type="number"
                       min="0"
                       max="5"
                       step="0.1"
                       value={formData.rating}
                       onChange={(e) => handleInputChange('rating', e.target.value)}
                       placeholder="Enter rating (0-5)"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="availability">Availability</Label>
                     <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select availability" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="full_time">Full Time</SelectItem>
                         <SelectItem value="part_time">Part Time</SelectItem>
                         <SelectItem value="contract">Contract</SelectItem>
                         <SelectItem value="freelance">Freelance</SelectItem>
                         <SelectItem value="unavailable">Unavailable</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="preferred_language">Preferred Language</Label>
                     <Input
                       id="preferred_language"
                       value={formData.preferred_language}
                       onChange={(e) => handleInputChange('preferred_language', e.target.value)}
                       placeholder="Enter preferred language"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="timezone">Timezone</Label>
                     <Input
                       id="timezone"
                       value={formData.timezone}
                       onChange={(e) => handleInputChange('timezone', e.target.value)}
                       placeholder="Enter timezone (e.g., UTC+3)"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="special_requirements">Special Requirements</Label>
                     <Textarea
                       id="special_requirements"
                       value={formData.special_requirements}
                       onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                       placeholder="Enter any special requirements or accommodations"
                       rows={3}
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>

           {/* Financial Information Tab */}
           <TabsContent value="financial" className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Star className="h-5 w-5" />
                   Financial Information
                 </CardTitle>
                 <CardDescription>
                   Banking and financial details for payments
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="bank_name">Bank Name</Label>
                     <Input
                       id="bank_name"
                       value={formData.bank_name}
                       onChange={(e) => handleInputChange('bank_name', e.target.value)}
                       placeholder="Enter bank name"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="account_number">Account Number</Label>
                     <Input
                       id="account_number"
                       value={formData.account_number}
                       onChange={(e) => handleInputChange('account_number', e.target.value)}
                       placeholder="Enter account number"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="iban">IBAN</Label>
                     <Input
                       id="iban"
                       value={formData.iban}
                       onChange={(e) => handleInputChange('iban', e.target.value)}
                       placeholder="Enter IBAN"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="swift_code">SWIFT Code</Label>
                     <Input
                       id="swift_code"
                       value={formData.swift_code}
                       onChange={(e) => handleInputChange('swift_code', e.target.value)}
                       placeholder="Enter SWIFT/BIC code"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="tax_id">Tax ID</Label>
                     <Input
                       id="tax_id"
                       value={formData.tax_id}
                       onChange={(e) => handleInputChange('tax_id', e.target.value)}
                       placeholder="Enter tax identification number"
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>

           {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure notification preferences for document expiry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="notify_days_before_id_expiry">Days before ID expiry</Label>
                    <Input
                      id="notify_days_before_id_expiry"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.notify_days_before_id_expiry}
                      onChange={(e) => handleInputChange('notify_days_before_id_expiry', e.target.value)}
                      placeholder="30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notify_days_before_passport_expiry">Days before passport expiry</Label>
                    <Input
                      id="notify_days_before_passport_expiry"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.notify_days_before_passport_expiry}
                      onChange={(e) => handleInputChange('notify_days_before_passport_expiry', e.target.value)}
                      placeholder="30"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter any additional notes"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : (isEditMode ? "Update Promoter" : "Add Promoter")}
          </Button>
        </div>
      </form>
    </div>
  )
} 