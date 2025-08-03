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
import { User, FileText, Settings, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { formatDateForDatabase } from "@/lib/date-utils"
import { PROMOTER_NOTIFICATION_DAYS } from "@/constants/notification-days"
import { DateInput } from "@/components/ui/date-input"

interface PromoterFormSimpleProps {
  promoterToEdit?: any | null
  onFormSubmit: () => void
  onCancel?: () => void
}

export default function PromoterFormSimple(props: PromoterFormSimpleProps) {
  const { promoterToEdit, onFormSubmit, onCancel } = props
  const { toast } = useToast()
  const isEditMode = Boolean(promoterToEdit)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")

  // Handle case where component is rendered during build time
  if (typeof window === 'undefined') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const [formData, setFormData] = useState({
    // Personal Information (only fields that exist in database)
    full_name: promoterToEdit?.name_en || "",
    name_en: promoterToEdit?.name_en || "",
    name_ar: promoterToEdit?.name_ar || "",
    email: promoterToEdit?.email || "",
    phone: promoterToEdit?.phone || "",
    mobile_number: promoterToEdit?.mobile_number || "",
    
    // Document Information (only fields that exist in database)
    id_number: promoterToEdit?.id_card_number || "",
    passport_number: promoterToEdit?.passport_number || "",
    id_expiry_date: promoterToEdit?.id_card_expiry_date || "",
    passport_expiry_date: promoterToEdit?.passport_expiry_date || "",
    
    // Status and Preferences (only fields that exist in database)
    status: promoterToEdit?.status || "active",
    
    // Additional Information (only fields that exist in database)
    notes: promoterToEdit?.notes || "",
    profile_picture_url: promoterToEdit?.profile_picture_url || "",
    
    // Notification settings (only fields that exist in database)
    notify_days_before_id_expiry: promoterToEdit?.notify_days_before_id_expiry || PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY,
    notify_days_before_passport_expiry: promoterToEdit?.notify_days_before_passport_expiry || PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY,
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      if (!supabase) {
        throw new Error("Failed to create Supabase client")
      }

      // Map form data to database schema - only include fields that exist in the database
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
                      notify_days_before_id_expiry: parseInt(formData.notify_days_before_id_expiry?.toString() || PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY.toString()),
        notify_days_before_passport_expiry: parseInt(formData.notify_days_before_passport_expiry?.toString() || PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY.toString()),
      }

      let result
      if (isEditMode && promoterToEdit) {
        // Check if ID card number has changed
        const idCardNumberChanged = formData.id_number !== promoterToEdit.id_card_number
        
        if (idCardNumberChanged && formData.id_number) {
          // Check if the new ID card number already exists for another promoter
          const { data: existingPromoter, error: checkError } = await supabase
            .from('promoters')
            .select('id')
            .eq('id_card_number', formData.id_number)
            .neq('id', promoterToEdit.id) // Exclude current promoter
            .single()

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw new Error(checkError.message)
          }

          if (existingPromoter) {
            throw new Error(`ID card number ${formData.id_number} already exists for another promoter`)
          }

          // Add ID card number to update data only if it has changed
          promoterData.id_card_number = formData.id_number
        }

        result = await supabase
          .from('promoters')
          .update(promoterData)
          .eq('id', promoterToEdit.id)
      } else {
        // For new promoters, always include the ID card number
        promoterData.id_card_number = formData.id_number
        
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Basic personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name (English) *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter full name in English"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name_ar">Full Name (Arabic)</Label>
                    <Input
                      id="name_ar"
                      value={formData.name_ar}
                      onChange={(e) => handleInputChange('name_ar', e.target.value)}
                      placeholder="Enter full name in Arabic"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobile_number">Mobile Number</Label>
                    <Input
                      id="mobile_number"
                      value={formData.mobile_number}
                      onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                      placeholder="Enter mobile number"
                    />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="id_number">ID Card Number *</Label>
                    <Input
                      id="id_number"
                      value={formData.id_number}
                      onChange={(e) => handleInputChange('id_number', e.target.value)}
                      placeholder="Enter ID card number"
                      required
                    />
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
                      id="id_expiry_date"
                      label="ID Card Expiry Date"
                      value={formData.id_expiry_date}
                      onChange={(value) => handleInputChange('id_expiry_date', value)}
                      placeholder="DD/MM/YYYY"
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
                  Additional Settings
                </CardTitle>
                <CardDescription>Notification settings and additional information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="notify_days_before_id_expiry">Days Before ID Expiry Notification</Label>
                    <Input
                      id="notify_days_before_id_expiry"
                      type="number"
                      value={formData.notify_days_before_id_expiry}
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
                      value={formData.notify_days_before_passport_expiry}
                      onChange={(e) => handleInputChange('notify_days_before_passport_expiry', e.target.value)}
                      placeholder="30"
                      min="1"
                      max="365"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Enter any additional notes about this promoter"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profile_picture_url">Profile Picture URL</Label>
                    <Input
                      id="profile_picture_url"
                      value={formData.profile_picture_url}
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
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : (isEditMode ? "Update Promoter" : "Add Promoter")}
          </Button>
        </div>
      </form>
    </div>
  )
} 