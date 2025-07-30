"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface PromoterFormProps {
  promoterToEdit?: any | null
  onFormSubmit: () => void
  onCancel?: () => void
}

export default function PromoterForm(props: PromoterFormProps) {
  const { promoterToEdit, onFormSubmit, onCancel } = props
  const { toast } = useToast()
  const isEditMode = Boolean(promoterToEdit)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: promoterToEdit?.full_name || "",
    email: promoterToEdit?.email || "",
    phone: promoterToEdit?.phone || "",
    address: promoterToEdit?.address || "",
    date_of_birth: promoterToEdit?.date_of_birth || "",
    nationality: promoterToEdit?.nationality || "",
    id_number: promoterToEdit?.id_number || "",
    passport_number: promoterToEdit?.passport_number || "",
    id_expiry_date: promoterToEdit?.id_expiry_date || "",
    passport_expiry_date: promoterToEdit?.passport_expiry_date || "",
    status: promoterToEdit?.status || "active",
    notes: promoterToEdit?.notes || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const promoterData = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      let result
      if (isEditMode) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
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
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            />
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
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter full address"
            rows={3}
          />
        </div>
      </div>

      {/* Document Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="id_number">ID Number</Label>
            <Input
              id="id_number"
              value={formData.id_number}
              onChange={(e) => handleInputChange('id_number', e.target.value)}
              placeholder="Enter ID number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="id_expiry_date">ID Expiry Date</Label>
            <Input
              id="id_expiry_date"
              type="date"
              value={formData.id_expiry_date}
              onChange={(e) => handleInputChange('id_expiry_date', e.target.value)}
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
            <Label htmlFor="passport_expiry_date">Passport Expiry Date</Label>
            <Input
              id="passport_expiry_date"
              type="date"
              value={formData.passport_expiry_date}
              onChange={(e) => handleInputChange('passport_expiry_date', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Additional Information
        </h3>
        
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
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
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
  )
}
