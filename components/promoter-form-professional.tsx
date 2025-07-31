"use client"

import { useState, useEffect } from "react"
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
  CheckCircle, Shield, Edit3, Plus
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

  // Safe initialization with fallbacks
  const safeGetValue = (obj: any, key: string, defaultValue: string = "") => {
    try {
      const value = obj?.[key]
      return value != null ? String(value) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const safeGetNumber = (obj: any, key: string, defaultValue: number = 30) => {
    try {
      const value = obj?.[key]
      return value != null ? Number(value) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const [formData, setFormData] = useState({
    // Personal Information
    full_name: safeGetValue(promoterToEdit, 'name_en'),
    name_ar: safeGetValue(promoterToEdit, 'name_ar'),
    email: safeGetValue(promoterToEdit, 'email'),
    phone: safeGetValue(promoterToEdit, 'phone'),
    mobile_number: safeGetValue(promoterToEdit, 'mobile_number'),
    
    // Document Information
    id_number: safeGetValue(promoterToEdit, 'id_card_number'),
    passport_number: safeGetValue(promoterToEdit, 'passport_number'),
    id_expiry_date: safeGetValue(promoterToEdit, 'id_card_expiry_date'),
    passport_expiry_date: safeGetValue(promoterToEdit, 'passport_expiry_date'),
    
    // Status and Preferences
    status: safeGetValue(promoterToEdit, 'status', 'active'),
    
    // Additional Information
    notes: safeGetValue(promoterToEdit, 'notes'),
    profile_picture_url: safeGetValue(promoterToEdit, 'profile_picture_url'),
    
    // Notification settings
    notify_days_before_id_expiry: safeGetNumber(promoterToEdit, 'notify_days_before_id_expiry'),
    notify_days_before_passport_expiry: safeGetNumber(promoterToEdit, 'notify_days_before_passport_expiry'),
  })

  // Predefined lists for professional dropdowns
  const statusOptions = [
    { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
    { value: "inactive", label: "Inactive", color: "bg-gray-100 text-gray-800" },
    { value: "suspended", label: "Suspended", color: "bg-red-100 text-red-800" },
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    { value: "terminated", label: "Terminated", color: "bg-red-100 text-red-800" }
  ]

  // Calculate form completion progress
  useEffect(() => {
    try {
      const requiredFields = ['full_name', 'email', 'id_number']
      const completedFields = requiredFields.filter(field => {
        const value = formData[field as keyof typeof formData]
        return value && typeof value === 'string' && value.trim().length > 0
      }).length
      const progress = Math.round((completedFields / requiredFields.length) * 100)
      setFormProgress(progress)
    } catch (error) {
      setFormProgress(0)
    }
  }, [formData])

  const handleInputChange = (field: string, value: string) => {
    try {
      setFormData(prev => ({
        ...prev,
        [field]: value || ""
      }))
      
      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: ""
        }))
      }
    } catch (error) {
      console.error('Error updating form data:', error)
    }
  }

  const validateForm = () => {
    try {
      const errors: Record<string, string> = {}

      if (!formData.full_name || !formData.full_name.trim()) {
        errors.full_name = "Full name is required"
      }

      if (!formData.email || !formData.email.trim()) {
        errors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Please enter a valid email address"
      }

      if (!formData.id_number || !formData.id_number.trim()) {
        errors.id_number = "ID card number is required"
      }

      if (formData.phone && formData.phone.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = "Please enter a valid phone number"
      }

      setValidationErrors(errors)
      return Object.keys(errors).length === 0
    } catch (error) {
      console.error('Validation error:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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

      const promoterData: any = {
        name_en: formData.full_name || "",
        name_ar: formData.name_ar || "",
        id_card_number: formData.id_number || "",
        passport_number: formData.passport_number || "",
        mobile_number: formData.mobile_number || "",
        id_card_expiry_date: formData.id_expiry_date ? formatDateForDatabase(formData.id_expiry_date) : null,
        passport_expiry_date: formData.passport_expiry_date ? formatDateForDatabase(formData.passport_expiry_date) : null,
        email: formData.email || "",
        phone: formData.phone || "",
        status: formData.status || "active",
        notes: formData.notes || "",
        profile_picture_url: formData.profile_picture_url || "",
        notify_days_before_id_expiry: parseInt(String(formData.notify_days_before_id_expiry || 30)),
        notify_days_before_passport_expiry: parseInt(String(formData.notify_days_before_passport_expiry || 30)),
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

  // Safe render check
  if (typeof window === 'undefined') {
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
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isEditMode ? "Edit Promoter Profile" : "Add New Promoter"}
              </h2>
              <p className="text-muted-foreground">
                {isEditMode ? "Update promoter information and settings" : "Create a new promoter profile with comprehensive details"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isEditMode ? "secondary" : "default"} className="flex items-center gap-1">
            {isEditMode ? <Edit3 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {isEditMode ? "Edit Mode" : "New Promoter"}
          </Badge>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Form Completion</span>
          <span>{formProgress}%</span>
        </div>
        <Progress value={formProgress} className="h-2" />
        {formProgress === 100 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All required fields are completed. You can now save the promoter.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
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
                <CardDescription>Basic personal details and identification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="flex items-center gap-2">
                      Full Name (English) *
                      <Star className="h-3 w-3 text-red-500" />
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name || ""}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter full name in English"
                      className={validationErrors.full_name ? "border-red-500" : ""}
                    />
                    {validationErrors.full_name && (
                      <p className="text-sm text-red-500">{validationErrors.full_name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name_ar">Full Name (Arabic)</Label>
                    <Input
                      id="name_ar"
                      value={formData.name_ar || ""}
                      onChange={(e) => handleInputChange('name_ar', e.target.value)}
                      placeholder="Enter full name in Arabic"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      Email Address *
                      <Star className="h-3 w-3 text-red-500" />
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500">{validationErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status || "active"} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]}`}></div>
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
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
                <CardDescription>Identity documents and their expiry dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="id_number" className="flex items-center gap-2">
                      ID Card Number *
                      <Star className="h-3 w-3 text-red-500" />
                    </Label>
                    <Input
                      id="id_number"
                      value={formData.id_number || ""}
                      onChange={(e) => handleInputChange('id_number', e.target.value)}
                      placeholder="Enter ID card number"
                      className={validationErrors.id_number ? "border-red-500" : ""}
                    />
                    {validationErrors.id_number && (
                      <p className="text-sm text-red-500">{validationErrors.id_number}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="passport_number">Passport Number</Label>
                    <Input
                      id="passport_number"
                      value={formData.passport_number || ""}
                      onChange={(e) => handleInputChange('passport_number', e.target.value)}
                      placeholder="Enter passport number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <DateInput
                      id="id_expiry_date"
                      label="ID Card Expiry Date"
                      value={formData.id_expiry_date || ""}
                      onChange={(value) => handleInputChange('id_expiry_date', value)}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <DateInput
                      id="passport_expiry_date"
                      label="Passport Expiry Date"
                      value={formData.passport_expiry_date || ""}
                      onChange={(value) => handleInputChange('passport_expiry_date', value)}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>Phone numbers and additional contact details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ""}
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
                      value={formData.mobile_number || ""}
                      onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                      placeholder="Enter mobile number"
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
                <CardDescription>Configure notification preferences for document expiry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="notify_days_before_id_expiry">Days Before ID Expiry Notification</Label>
                    <Input
                      id="notify_days_before_id_expiry"
                      type="number"
                      value={String(formData.notify_days_before_id_expiry || 30)}
                      onChange={(e) => handleInputChange('notify_days_before_id_expiry', e.target.value)}
                      placeholder="30"
                      min="1"
                      max="365"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notify_days_before_passport_expiry">Days Before Passport Expiry Notification</Label>
                    <Input
                      id="notify_days_before_passport_expiry"
                      type="number"
                      value={String(formData.notify_days_before_passport_expiry || 30)}
                      onChange={(e) => handleInputChange('notify_days_before_passport_expiry', e.target.value)}
                      placeholder="30"
                      min="1"
                      max="365"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Additional Information
                </CardTitle>
                <CardDescription>Notes and profile picture URL</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Enter any additional notes about this promoter"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile_picture_url">Profile Picture URL</Label>
                    <Input
                      id="profile_picture_url"
                      value={formData.profile_picture_url || ""}
                      onChange={(e) => handleInputChange('profile_picture_url', e.target.value)}
                      placeholder="Enter profile picture URL"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>All data is encrypted and securely stored</span>
          </div>
          
          <div className="flex gap-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading || formProgress < 100}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving..." : (isEditMode ? "Update Promoter" : "Add Promoter")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
} 