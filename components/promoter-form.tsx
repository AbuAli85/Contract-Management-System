"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useForm, useWatch } from "react-hook-form"
import { promoterProfileSchema, type PromoterProfileFormData, type PromoterStatus } from "@/lib/promoter-profile-schema"
import { promoterStatusesList } from "@/types/custom"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel as ShadcnFormLabel, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Edit3Icon, LockIcon, FileWarningIcon as WarningIcon } from "lucide-react"
import type { Promoter } from "@/lib/types"
import { format, parseISO, differenceInDays, isPast, isValid } from "date-fns"
import ImageUploadField from "@/components/image-upload-field"
import DatePickerWithPresetsField from "@/components/date-picker-with-presets-field"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod";
import { useParties } from "@/hooks/use-parties"
import { JOB_TITLES, DEPARTMENTS, WORK_LOCATIONS } from "@/constants/contract-options"

const BUCKET_NAME = "promoter-documents"

interface PromoterFormProps {
  promoterToEdit?: Promoter | null
  onFormSubmit: () => void
}

// Helper for expiry alerts
const getExpiryAlert = (
  dateString: string | Date | null | undefined,
  alertDays: number | null | undefined,
  itemName: string,
): { message: string; className: string } | null => {
  if (!dateString || !alertDays || alertDays <= 0) return null

  const date = dateString instanceof Date ? dateString : parseISO(dateString as string)
  if (!isValid(date)) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize today to start of day for consistent comparison

  const daysToExpiry = differenceInDays(date, today)

  if (isPast(date)) {
    return {
      message: `🚫 ${itemName} expired on ${format(date, "MMM d, yyyy")}`,
      className: "text-red-600 dark:text-red-500",
    }
  }
  if (daysToExpiry <= alertDays) {
    return {
      message: `⚠️ ${itemName} expires in ${daysToExpiry} day${daysToExpiry === 1 ? "" : "s"} (on ${format(date, "MMM d, yyyy")})`,
      className: "text-amber-600 dark:text-amber-500",
    }
  }
  return null
}

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

  // Always use null for unselected value
  const selectValue = value ?? null

  const handleAddCustom = () => {
    if (customValue.trim() && onAddCustom) {
      onAddCustom(customValue.trim())
      setCustomValue("")
      setIsAdding(false)
    }
  }

  return (
    <Select onValueChange={onValueChange} value={selectValue ?? undefined}>
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

export default function PromoterForm({ promoterToEdit, onFormSubmit }: PromoterFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditScreen = !!promoterToEdit
  const [isEditable, setIsEditable] = useState(!isEditScreen)

  const form = useForm<PromoterProfileFormData>({
    resolver: zodResolver(promoterProfileSchema),
    defaultValues: {
      name_en: "",
      name_ar: "",
      id_card_number: "",
      employer_id: null,
      outsourced_to_id: null,
      job_title: null,
      work_location: null,
      status: "active",
      contract_valid_until: null,
      id_card_image: null,
      passport_image: null,
      existing_id_card_url: null,
      existing_passport_url: null,
      id_card_expiry_date: null,
      passport_expiry_date: null,
      notify_days_before_id_expiry: 30,
      notify_days_before_passport_expiry: 90,
      notes: null,
      passport_number: "",
      mobile_number: "",
      profile_picture_url: "",
    },
  })

  // Watch relevant fields for expiry alerts
  const idCardExpiryDate = useWatch({ control: form.control, name: "id_card_expiry_date" })
  const notifyIdDays = useWatch({ control: form.control, name: "notify_days_before_id_expiry" })
  const passportExpiryDate = useWatch({ control: form.control, name: "passport_expiry_date" })
  const notifyPassportDays = useWatch({
    control: form.control,
    name: "notify_days_before_passport_expiry",
  })

  const idCardAlert = getExpiryAlert(idCardExpiryDate, notifyIdDays, "ID Card")
  const passportAlert = getExpiryAlert(passportExpiryDate, notifyPassportDays, "Passport")

  const { data: parties, isLoading: partiesLoading } = useParties("Employer")

  useEffect(() => {
    if (promoterToEdit) {
      form.reset({
        name_en: promoterToEdit.name_en || "",
        name_ar: promoterToEdit.name_ar || "",
        id_card_number: promoterToEdit.id_card_number || "",
        id_card_image: null,
        passport_image: null,
        existing_id_card_url: promoterToEdit.id_card_url || null,
        existing_passport_url: promoterToEdit.passport_url || null,
        id_card_expiry_date: promoterToEdit.id_card_expiry_date ? parseISO(promoterToEdit.id_card_expiry_date) : null,
        passport_expiry_date: promoterToEdit.passport_expiry_date
          ? parseISO(promoterToEdit.passport_expiry_date)
          : null,
        status: (promoterToEdit.status as PromoterStatus) || "active",
        notify_days_before_id_expiry: promoterToEdit.notify_days_before_id_expiry ?? 30,
        notify_days_before_passport_expiry: promoterToEdit.notify_days_before_passport_expiry ?? 90,
        notes: promoterToEdit.notes || "",
        passport_number: promoterToEdit?.passport_number || "",
        mobile_number: promoterToEdit?.mobile_number || "",
        profile_picture_url: promoterToEdit?.profile_picture_url || "",
      })
    } else {
      form.reset({
        name_en: "",
        name_ar: "",
        id_card_number: "",
        id_card_image: null,
        passport_image: null,
        existing_id_card_url: null,
        existing_passport_url: null,
        id_card_expiry_date: null,
        passport_expiry_date: null,
        status: "active",
        notify_days_before_id_expiry: 30,
        notify_days_before_passport_expiry: 90,
        notes: "",
        passport_number: "",
        mobile_number: "",
        profile_picture_url: "",
      })
    }
  }, [promoterToEdit, form.reset])

  const uploadFile = async (
    file: File | null | undefined,
    currentUrl?: string | null | undefined,
  ): Promise<string | null | undefined> => {
    if (file) {
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, "_")}`
      const filePath = `${fileName}`

      if (currentUrl) {
        try {
          const oldFileName = currentUrl.substring(currentUrl.lastIndexOf("/") + 1)
          await getSupabaseClient().storage.from(BUCKET_NAME).remove([oldFileName])
        } catch (e) {
          console.warn("Could not remove old file from storage:", e)
        }
      }

      const { data, error } = await getSupabaseClient().storage.from(BUCKET_NAME).upload(filePath, file)
      if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`)
      const { data: urlData } = getSupabaseClient().storage.from(BUCKET_NAME).getPublicUrl(data.path)
      return urlData.publicUrl
    }
    return currentUrl
  }

  async function onSubmit(values: PromoterProfileFormData) {
    if (!isEditable) {
      toast({
        title: "Form Locked",
        description: "Enable 'Editable Mode' to make changes.",
        variant: "default",
      })
      return
    }
    setIsSubmitting(true)
    try {
      let idCardUrlResult = values.existing_id_card_url
      if (values.id_card_image instanceof File) {
        idCardUrlResult = await uploadFile(values.id_card_image, values.existing_id_card_url)
      } else if (!values.existing_id_card_url) {
        idCardUrlResult = null
      }

      let passportUrlResult = values.existing_passport_url
      if (values.passport_image instanceof File) {
        passportUrlResult = await uploadFile(values.passport_image, values.existing_passport_url)
      } else if (!values.existing_passport_url) {
        passportUrlResult = null
      }

      const promoterData = {
        name_en: values.name_en,
        name_ar: values.name_ar,
        id_card_number: values.id_card_number,
        id_card_url: idCardUrlResult,
        passport_url: passportUrlResult,
        id_card_expiry_date: values.id_card_expiry_date ? format(values.id_card_expiry_date, "yyyy-MM-dd") : null,
        passport_expiry_date: values.passport_expiry_date ? format(values.passport_expiry_date, "yyyy-MM-dd") : null,
        status: values.status,
        notify_days_before_id_expiry: values.notify_days_before_id_expiry,
        notify_days_before_passport_expiry: values.notify_days_before_passport_expiry,
        notes: values.notes,
        passport_number: values.passport_number,
        mobile_number: values.mobile_number,
        profile_picture_url: values.profile_picture_url,
      }

      if (promoterToEdit?.id) {
        const { error } = await getSupabaseClient().from("promoters").update(promoterData).eq("id", promoterToEdit.id).select()
        if (error) throw error
        toast({ title: "Success!", description: "Promoter updated successfully." })
      } else {
        const { error } = await getSupabaseClient().from("promoters").insert([promoterData]).select()
        if (error) throw error
        toast({ title: "Success!", description: "Promoter added successfully." })
      }
      onFormSubmit()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formActuallyDisabled = !isEditable || isSubmitting

  const sectionClasses = "space-y-6 p-5 border rounded-lg shadow-sm bg-card-foreground/5 dark:bg-card-foreground/5"
  const sectionHeaderClasses = "text-xl font-semibold text-foreground border-b border-border pb-3 mb-6"

  const PROMOTER_STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'retired', label: 'Retired' },
    { value: 'probation', label: 'Probation' },
    { value: 'resigned', label: 'Resigned' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="mx-auto max-w-3xl rounded-lg bg-card p-4 text-card-foreground shadow-xl sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {promoterToEdit ? "Edit Promoter / تعديل المروج" : "Add New Promoter / إضافة مروج جديد"}
        </h1>
        <div className="flex items-center space-x-3">
          {isEditable ? (
            <Edit3Icon className="h-5 w-5 text-primary" />
          ) : (
            <LockIcon className="h-5 w-5 text-muted-foreground" />
          )}
          <Switch
            id="editable-mode"
            checked={isEditable}
            onCheckedChange={setIsEditable}
            aria-label="Toggle editable mode"
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
          />
          <Label htmlFor="editable-mode" className="cursor-pointer select-none text-sm font-medium">
            {isEditable ? "Editable Mode / وضع التعديل" : "Locked / مقفل"}
          </Label>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          {/* Personal Information Section */}
          <div className={sectionClasses}>
            <h2 className={sectionHeaderClasses}>Personal Information / المعلومات الشخصية</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }: { field: React.ComponentProps<typeof Input> }) => (
                  <FormItem>
                    <ShadcnFormLabel>Name (English)</ShadcnFormLabel>
                    <FormControl>
                      <Input placeholder="Promoter Name (EN)" {...field} disabled={formActuallyDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name_ar"
                render={({ field }: { field: React.ComponentProps<typeof Input> }) => (
                  <FormItem>
                    <ShadcnFormLabel>الاسم (عربي)</ShadcnFormLabel>
                    <FormControl>
                      <Input
                        placeholder="اسم المروج (AR)"
                        {...field}
                        dir="rtl"
                        className="text-right"
                        disabled={formActuallyDisabled}
                      />
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
                    <ShadcnFormLabel>Passport Number</ShadcnFormLabel>
                    <FormControl>
                      <Input placeholder="Passport Number" {...field} value={field.value ?? ""} disabled={formActuallyDisabled} />
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
                    <ShadcnFormLabel>Mobile Number</ShadcnFormLabel>
                    <FormControl>
                      <Input placeholder="Mobile Number" {...field} value={field.value ?? ""} disabled={formActuallyDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profile_picture_url"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>Photograph (URL or Upload)</ShadcnFormLabel>
                    <FormControl>
                      <Input placeholder="Photo URL or upload below" {...field} value={field.value ?? ""} disabled={formActuallyDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profile_picture_url"
                render={({ field }) => (
                  <ImageUploadField
                    field={field}
                    initialImageUrl={field.value ?? undefined}
                    disabled={formActuallyDisabled}
                  />
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="id_card_number"
              render={({ field }: { field: React.ComponentProps<typeof Input> }) => (
                <FormItem>
                  <ShadcnFormLabel>ID Card Number / رقم البطاقة الشخصية</ShadcnFormLabel>
                  <FormControl>
                    <Input placeholder="1029384756" {...field} disabled={formActuallyDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Employment Details Section */}
          <div className={sectionClasses}>
            <h2 className={sectionHeaderClasses}>Employment Details / تفاصيل التوظيف</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
              <FormField
                control={form.control}
                name="employer_id"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>Company / Employer (Second Party)</ShadcnFormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                      disabled={formActuallyDisabled || partiesLoading}
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
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>Status / الحالة</ShadcnFormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={formActuallyDisabled}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROMOTER_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="job_title"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>Job Title</ShadcnFormLabel>
                    <EnhancedSelect
                      options={JOB_TITLES}
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                      placeholder="Select job title or add custom"
                      onAddCustom={(value) => field.onChange(value)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>Department</ShadcnFormLabel>
                    <EnhancedSelect
                      options={DEPARTMENTS}
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                      placeholder="Select department or add custom"
                      onAddCustom={(value) => field.onChange(value)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="work_location"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>Work Location</ShadcnFormLabel>
                    <EnhancedSelect
                      options={WORK_LOCATIONS}
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                      placeholder="Select work location or add custom"
                      onAddCustom={(value) => field.onChange(value)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Documents Section */}
          <div className={sectionClasses}>
            <h2 className={sectionHeaderClasses}>Documents / المستندات</h2>
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
              <FormField
                control={form.control}
                name="id_card_image"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel htmlFor={field.name}>ID Card Image / صورة البطاقة</ShadcnFormLabel>
                    <FormControl>
                      <ImageUploadField
                        field={field}
                        initialImageUrl={form.watch("existing_id_card_url")}
                        disabled={formActuallyDisabled}
                        onImageRemove={() => form.setValue("existing_id_card_url", null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="id_card_expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>ID Card Expiry Date / تاريخ انتهاء البطاقة</ShadcnFormLabel>
                    <FormControl>
                      <DatePickerWithPresetsField
                        field={field}
                        placeholder="Select ID expiry"
                        disabled={formActuallyDisabled}
                      />
                    </FormControl>
                    {idCardAlert && !form.formState.errors.id_card_expiry_date && (
                      <p className={cn("mt-1.5 flex items-center text-xs font-medium", idCardAlert.className)}>
                        <WarningIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" /> {idCardAlert.message}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passport_image"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel htmlFor={field.name}>Passport Image / صورة الجواز</ShadcnFormLabel>
                    <FormControl>
                      <ImageUploadField
                        field={field}
                        initialImageUrl={form.watch("existing_passport_url")}
                        disabled={formActuallyDisabled}
                        onImageRemove={() => form.setValue("existing_passport_url", null)}
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
                    <ShadcnFormLabel>Passport Expiry Date / تاريخ انتهاء الجواز</ShadcnFormLabel>
                    <FormControl>
                      <DatePickerWithPresetsField
                        field={field}
                        placeholder="Select passport expiry"
                        disabled={formActuallyDisabled}
                      />
                    </FormControl>
                    {passportAlert && !form.formState.errors.passport_expiry_date && (
                      <p className={cn("mt-1.5 flex items-center text-xs font-medium", passportAlert.className)}>
                        <WarningIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" /> {passportAlert.message}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Notification Settings Section */}
          <div className={sectionClasses}>
            <h2 className={sectionHeaderClasses}>Notification Settings / إعدادات الإشعارات</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
              <FormField
                control={form.control}
                name="notify_days_before_id_expiry"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>ID Expiry Alert (Days) / تنبيه انتهاء البطاقة (أيام)</ShadcnFormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 30"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          field.onChange(e.target.value === "" ? null : Number.parseInt(e.target.value, 10))
                        }
                        disabled={formActuallyDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notify_days_before_passport_expiry"
                render={({ field }) => (
                  <FormItem>
                    <ShadcnFormLabel>Passport Expiry Alert (Days) / تنبيه انتهاء الجواز (أيام)</ShadcnFormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 90"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          field.onChange(e.target.value === "" ? null : Number.parseInt(e.target.value, 10))
                        }
                        disabled={formActuallyDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Notes Section */}
          <div className={sectionClasses}>
            <h2 className={sectionHeaderClasses}>Notes / ملاحظات</h2>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <ShadcnFormLabel>Internal Notes / ملاحظات داخلية</ShadcnFormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal notes about this promoter..."
                      className="min-h-[120px] resize-y"
                      {...field}
                      value={field.value ?? ""}
                      disabled={formActuallyDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={formActuallyDisabled || isSubmitting}
              className="min-w-[200px] py-3 text-base font-semibold"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : promoterToEdit ? (
                "Update Promoter / تحديث المروج"
              ) : (
                "Add Promoter / إضافة مروج"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
