"use client"
import React from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Mail, Phone, User, Globe, Calendar } from "lucide-react"
import { validateEmail, validatePhone, validateNationality } from "@/lib/promoter-profile-schema"
import type { PromoterProfileFormData } from "@/lib/promoter-profile-schema"

interface PromoterFormFieldsProps {
  showValidation?: boolean
  disabled?: boolean
}

export function PromoterFormFields({
  showValidation = true,
  disabled = false,
}: PromoterFormFieldsProps) {
  const form = useFormContext<PromoterProfileFormData>()
  const [emailValidation, setEmailValidation] = React.useState<{
    isValid: boolean
    error?: string
  }>({ isValid: true })
  const [phoneValidation, setPhoneValidation] = React.useState<{
    isValid: boolean
    error?: string
  }>({ isValid: true })
  const [nationalityValidation, setNationalityValidation] = React.useState<{
    isValid: boolean
    error?: string
  }>({ isValid: true })

  // Real-time validation
  const handleEmailChange = (value: string) => {
    if (showValidation && value) {
      const validation = validateEmail(value)
      setEmailValidation(validation)
    } else {
      setEmailValidation({ isValid: true })
    }
  }

  const handlePhoneChange = (value: string) => {
    if (showValidation && value) {
      const validation = validatePhone(value)
      setPhoneValidation(validation)
    } else {
      setPhoneValidation({ isValid: true })
    }
  }

  const handleNationalityChange = (value: string) => {
    if (showValidation && value) {
      const validation = validateNationality(value)
      setNationalityValidation(validation)
    } else {
      setNationalityValidation({ isValid: true })
    }
  }

  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  First Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter first name"
                    {...field}
                    disabled={disabled}
                    className={
                      showValidation && field.value && !form.formState.errors.firstName
                        ? "border-green-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Last Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter last name"
                    {...field}
                    disabled={disabled}
                    className={
                      showValidation && field.value && !form.formState.errors.lastName
                        ? "border-green-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Nationality *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter nationality"
                    {...field}
                    disabled={disabled}
                    onChange={(e) => {
                      field.onChange(e)
                      handleNationalityChange(e.target.value)
                    }}
                    className={
                      showValidation && field.value && !form.formState.errors.nationality
                        ? "border-green-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
                {showValidation && nationalityValidation.error && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {nationalityValidation.error}
                  </div>
                )}
                {showValidation && field.value && nationalityValidation.isValid && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Valid nationality
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Badge variant="outline" className="h-4 w-4 p-0" />
                  Status *
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="probation">Probation</SelectItem>
                    <SelectItem value="resigned">Resigned</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Mail className="h-5 w-5" />
          Contact Information
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    {...field}
                    disabled={disabled}
                    onChange={(e) => {
                      field.onChange(e)
                      handleEmailChange(e.target.value)
                    }}
                    className={
                      showValidation && field.value && !form.formState.errors.email
                        ? "border-green-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
                {showValidation && emailValidation.error && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {emailValidation.error}
                  </div>
                )}
                {showValidation && field.value && emailValidation.isValid && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Valid email address
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Mobile Number *
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Enter mobile number"
                    {...field}
                    disabled={disabled}
                    onChange={(e) => {
                      field.onChange(e)
                      handlePhoneChange(e.target.value)
                    }}
                    className={
                      showValidation && field.value && !form.formState.errors.mobile_number
                        ? "border-green-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
                {showValidation && phoneValidation.error && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {phoneValidation.error}
                  </div>
                )}
                {showValidation && field.value && phoneValidation.isValid && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Valid phone number
                  </div>
                )}
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Document Information Section */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Calendar className="h-5 w-5" />
          Document Information
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="id_card_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Card Number *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter ID card number" {...field} disabled={disabled} />
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
                  <Input placeholder="Enter passport number" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="id_card_expiry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Card Expiry Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    disabled={disabled}
                    value={
                      field.value
                        ? typeof field.value === "string"
                          ? field.value
                          : field.value.toISOString().split("T")[0]
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passport_expiry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passport Expiry Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    disabled={disabled}
                    value={
                      field.value
                        ? typeof field.value === "string"
                          ? field.value
                          : field.value.toISOString().split("T")[0]
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Information</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter job title" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="work_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter work location" {...field} disabled={disabled} />
                </FormControl>
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter additional notes"
                  {...field}
                  disabled={disabled}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
