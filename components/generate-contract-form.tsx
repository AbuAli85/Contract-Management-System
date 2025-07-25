// components/generate-contract-form.tsx
"use client"

import { useEffect, useState, lazy, Suspense } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { motion } from "framer-motion"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/supabase"
import {
  contractGeneratorSchema,
  type ContractGeneratorFormData,
} from "@/lib/schema-generator"
import type { Promoter, Party } from "@/lib/types"
import { 
  JOB_TITLES, 
  DEPARTMENTS, 
  CONTRACT_TYPES, 
  CURRENCIES, 
  WORK_LOCATIONS,
  getOptionLabel 
} from "@/constants/contract-options"
import { validateContractData } from "@/lib/contract-utils"
import { useParties } from "@/hooks/use-parties"
import { usePromoters } from "@/hooks/use-promoters"
import { useFormRegistration } from "@/hooks/use-form-context"

// Lazy load heavy components
const DatePickerWithManualInput = lazy(() => import("./date-picker-with-manual-input"))
const ComboboxField = lazy(() => import("@/components/combobox-field"))

// Lazy load hooks


interface ContractGeneratorFormProps {
  /** Existing contract when editing; new contract if undefined. */
  contract?: Database["public"]["Tables"]["contracts"]["Row"] | null
  /** Callback when the form is successfully saved. */
  onFormSubmit?: () => void
}

const sectionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
}

export default function ContractGeneratorForm({
  contract,
  onFormSubmit,
}: ContractGeneratorFormProps) {
  // Register this form to disable auto-refresh during form interactions
  useFormRegistration()
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Use the proper hooks to fetch data
  const { data: allParties, isLoading: isLoadingParties } = useParties()
  const { data: promoters, isLoading: isLoadingPromoters } = usePromoters()

  // Filter parties by type
  const clientParties = allParties?.filter(party => party.type === 'Client') || []
  const employerParties = allParties?.filter(party => party.type === 'Employer') || []

  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null)
  const [promoterOptions, setPromoterOptions] = useState<
    { value: string; label: string }[]
  >([])

  const { reset, ...form } = useForm<ContractGeneratorFormData>({
    resolver: zodResolver(contractGeneratorSchema),
    mode: "onTouched",
    defaultValues: {
      first_party_id: "",
      second_party_id: "",
      promoter_id: "",
      contract_start_date: undefined,
      contract_end_date: undefined,
      email: "",
      job_title: "",
      work_location: "",
      department: "",
      contract_type: "",
      currency: "OMR",
    },
    // Add error handling for validation errors
    shouldFocusError: false,
  })

  const [selectedClient, setSelectedClient] = useState<Party | null>(null) // Party A
  const [selectedEmployer, setSelectedEmployer] = useState<Party | null>(null) // Party B

  // Build combobox options
  useEffect(() => {
    try {
      if (promoters) {
        setPromoterOptions(
          promoters.map((p) => ({
            value: p.id,
            label: `${p.name_en} / ${p.name_ar} (ID: ${p.id_card_number ?? "N/A"})`,
          }))
        )
      }
    } catch (error) {
      console.error("Error building promoter options:", error)
      setPromoterOptions([])
    }
  }, [promoters])

  // Prefill when editing
  useEffect(() => {
    try {
      if (contract) {
        reset({
          first_party_id: contract.first_party_id ?? undefined,
          second_party_id: contract.second_party_id ?? undefined,
          promoter_id: contract.promoter_id ?? undefined,
          contract_start_date: contract.contract_start_date
            ? parseISO(contract.contract_start_date)
            : undefined,
          contract_end_date: contract.contract_end_date
            ? parseISO(contract.contract_end_date)
            : undefined,
          email: contract.email ?? "",
          job_title: contract.job_title ?? "",
          work_location: contract.work_location ?? "",
          department: contract.department ?? "",
          contract_type: contract.contract_type ?? "",
          currency: contract.currency ?? "",
        })
      }
    } catch (error) {
      console.error("Error prefilling form:", error)
    }
  }, [contract, reset])

  // Watch promoter id → show preview
  const watchedPromoterId = useWatch({
    control: form.control,
    name: "promoter_id",
  })
  useEffect(() => {
    try {
      if (watchedPromoterId && promoters) {
        const sel = promoters.find((p) => p.id === watchedPromoterId) || null
        setSelectedPromoter(sel)
      } else {
        setSelectedPromoter(null)
      }
    } catch (error) {
      console.error("Error setting selected promoter:", error)
      setSelectedPromoter(null)
    }
  }, [watchedPromoterId, promoters])

  // When Party A (Client) is selected, auto-fill fields
  useEffect(() => {
    try {
      if (form.watch('first_party_id') && clientParties) {
        const party = clientParties.find(p => p.id === form.watch('first_party_id'))
        setSelectedClient(party || null)
        if (party) {
          form.setValue('first_party_name_en', party.name_en)
          form.setValue('first_party_name_ar', party.name_ar)
          form.setValue('first_party_crn', party.crn)
        }
      }
    } catch (error) {
      console.error("Error setting client party:", error)
    }
  }, [form.watch('first_party_id'), clientParties, form])

  // When Party B (Employer) is selected, auto-fill fields
  useEffect(() => {
    try {
      if (form.watch('second_party_id') && employerParties) {
        const party = employerParties.find(p => p.id === form.watch('second_party_id'))
        setSelectedEmployer(party || null)
        if (party) {
          form.setValue('second_party_name_en', party.name_en)
          form.setValue('second_party_name_ar', party.name_ar)
          form.setValue('second_party_crn', party.crn)
        }
      }
    } catch (error) {
      console.error("Error setting employer party:", error)
    }
  }, [form.watch('second_party_id'), employerParties, form])

  // When promoter is selected, auto-fill fields
  useEffect(() => {
    try {
      if (selectedPromoter) {
        form.setValue('promoter_name_en', selectedPromoter.name_en)
        form.setValue('promoter_name_ar', selectedPromoter.name_ar)
        form.setValue('id_card_number', selectedPromoter.id_card_number)
        form.setValue('promoter_id_card_url', selectedPromoter.id_card_url || '')
        form.setValue('promoter_passport_url', selectedPromoter.passport_url || '')
      }
    } catch (error) {
      console.error("Error setting promoter fields:", error)
    }
  }, [selectedPromoter, form])

  // Mutation: call your API routes instead of supabase.from(...)
  const mutation = useMutation({
    mutationFn: async (values: ContractGeneratorFormData) => {
      try {
        const payload = {
          first_party_id: values.first_party_id,
          second_party_id: values.second_party_id,
          promoter_id: values.promoter_id,
          contract_start_date: values.contract_start_date,
          contract_end_date: values.contract_end_date,
          email: values.email,
          job_title: values.job_title,
          work_location: values.work_location,
          department: values.department,
          contract_type: values.contract_type,
          currency: values.currency,
        }

        // UPDATE
        if (contract?.id) {
          const res = await fetch(`/api/contracts/${contract.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || err.message || res.statusText)
          }
          const { contract: updated } = await res.json()
          return updated
        }

        // CREATE
        const res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || err.message || res.statusText)
        }
        const { contract: created } = await res.json()
        return created
      } catch (error) {
        console.error("Mutation error:", error)
        throw error
      }
    },
    onSuccess: async (data) => {
      try {
        toast({
          title: contract?.id ? "Contract Updated!" : "Contract Created!",
          description: data.pdf_url
            ? `PDF: ${data.pdf_url}`
            : "PDF generation pending.",
        })
        reset()
        queryClient.invalidateQueries({ queryKey: ["contracts"] })
        onFormSubmit?.()

        // trigger webhook processing using the new service
        try {
          // Import the webhook service dynamically to avoid SSR issues
          const { WebhookService } = await import('@/lib/webhook-service')
          
          // Process contract through both webhooks
          await WebhookService.processContract({
            contract_id: data.id,
            contract_number: data.contract_number,
            client_name: data.client_name || 'N/A',
            employer_name: data.employer_name || 'N/A',
            status: 'processing'
          })
          
          console.log('✅ Webhook processing initiated for contract:', data.id)
        } catch (err) {
          console.error('❌ Webhook processing error:', err)
          // Don't fail the contract creation, just log the error
        }
      } catch (error) {
        console.error("Error in mutation success handler:", error)
      }
    },
    onError: (error: Error | unknown) => {
      try {
        const errorMessage = error instanceof Error ? error.message : "Unexpected error"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } catch (toastError) {
        console.error("Error showing error toast:", toastError)
      }
    },
  })
  const { mutate: saveContract } = mutation
  const isSubmitting = mutation.status === "pending"

  const onSubmit = (values: ContractGeneratorFormData) => {
    try {
      // Validate contract data before submission
      const validation = validateContractData(values)
      if (!validation.isValid) {
        return toast({
          title: "Validation Error",
          description: validation.errors?.join("; ") || "Invalid contract data.",
          variant: "destructive",
        })
      }

      // Proceed with contract submission (no duration analysis)
      saveContract({
        ...values,
      })
    } catch (error) {
      console.error("Error in form submission:", error)
      
      // Handle ZodError specifically
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        toast({
          title: "Validation Error",
          description: "Please check all required fields and ensure data is valid.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Submission Error",
          description: "An unexpected error occurred while submitting the form.",
          variant: "destructive",
        })
      }
    }
  }

  const isLoadingInitialData =
    isLoadingParties || isLoadingPromoters

  // show spinner until selects are loaded
  if (
    isLoadingInitialData &&
    !form.formState.isDirty &&
    !employerParties &&
    !clientParties &&
    !promoters
  ) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-4 text-lg text-muted-foreground">
          Loading form data...
        </p>
      </div>
    )
  }

  // validation ring classes
  const getInputStateClasses = (fieldName: keyof ContractGeneratorFormData) => {
    try {
      const fieldState = form.getFieldState(fieldName)
      if (fieldState.error) return "ring-destructive ring-2"
      if (fieldState.isDirty && !fieldState.error && fieldState.isTouched)
        return "ring-success ring-2"
      return ""
    } catch (error) {
      console.error("Error getting input state classes:", error)
      return ""
    }
  }

  return (
    <Form {...form} reset={reset}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* Contracting Parties */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <h3 className="mb-6 border-b-2 border-primary pb-2 font-heading text-xl font-semibold">
            Contracting Parties
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="first_party_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party A (Client)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={isSubmitting || isLoadingParties}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={getInputStateClasses("first_party_id")}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingParties
                              ? "Loading Clients..."
                              : "Select Client"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingParties && (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                      {!isLoadingParties &&
                        clientParties?.length === 0 && (
                          <SelectItem value="no-data" disabled>
                            No clients found
                          </SelectItem>
                        )}
                                              {!isLoadingParties &&
                         clientParties?.map((party: Party) => (
                          <SelectItem key={party.id} value={party.id}>
                            {party.name_en} / {party.name_ar}{" "}
                            {party.crn && `(CRN: ${party.crn})`}
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
              name="second_party_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party B (Employer)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    disabled={isSubmitting || isLoadingParties}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={getInputStateClasses("second_party_id")}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingParties
                              ? "Loading Employers..."
                              : "Select Employer"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingParties && (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                      {!isLoadingParties &&
                        employerParties?.length === 0 && (
                          <SelectItem value="no-data" disabled>
                            No employers found
                          </SelectItem>
                        )}
                                              {!isLoadingParties &&
                         employerParties?.map((party: Party) => (
                          <SelectItem key={party.id} value={party.id}>
                            {party.name_en} / {party.name_ar}{" "}
                            {party.crn && `(CRN: ${party.crn})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </motion.div>

        {/* Promoter Information */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <h3 className="mb-6 border-b-2 border-primary pb-2 font-heading text-xl font-semibold">
            Promoter Information
          </h3>
          <FormField
            control={form.control}
            name="promoter_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promoter</FormLabel>
                <ComboboxField
                  field={field}
                  options={promoterOptions}
                  placeholder={
                    isLoadingPromoters
                      ? "Loading Promoters..."
                      : "Select a promoter"
                  }
                  searchPlaceholder="Search promoters..."
                  emptyStateMessage="No promoter found."
                  disabled={isSubmitting || isLoadingPromoters}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {selectedPromoter ? (
            <div className="space-y-1 rounded-md border bg-muted/50 p-3 text-sm">
              <p>
                <span className="font-medium">Name (EN):</span>{" "}
                {selectedPromoter.name_en}
              </p>
              <p dir="rtl">
                <span className="font-medium">Name (AR):</span>{" "}
                {selectedPromoter.name_ar}
              </p>
              <p>
                <span className="font-medium">ID Card:</span>{" "}
                {selectedPromoter.id_card_number}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a promoter to view details.
            </p>
          )}
        </motion.div>

        {/* Contract Period */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <h3 className="mb-6 border-b-2 border-primary pb-2 font-heading text-xl font-semibold">
            Contract Period
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="contract_start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Contract Start Date</FormLabel>
                  <DatePickerWithManualInput
                    date={field.value}
                    setDate={field.onChange}
                    dateFormat="dd-MM-yyyy"
                    placeholder="dd-MM-yyyy"
                    disabled={isSubmitting}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Contract End Date</FormLabel>
                  <DatePickerWithManualInput
                    date={field.value}
                    setDate={field.onChange}
                    dateFormat="dd-MM-yyyy"
                    placeholder="dd-MM-yyyy"
                    disabled={
                      (form.getValues("contract_start_date")
                        ? field.value! <=
                          form.getValues("contract_start_date")!
                        : false) || isSubmitting
                    }
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </motion.div>

        {/* Additional Details */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <h3 className="mb-6 border-b-2 border-primary pb-2 font-heading text-xl font-semibold">
            Additional Details
          </h3>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notification Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="contact@example.com"
                    {...field}
                    disabled={isSubmitting}
                    className={getInputStateClasses("email") || ""}
                  />
                </FormControl>
                <FormDescription>
                  Email address for contract-related notifications.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className={getInputStateClasses("job_title")}>
                      <SelectValue placeholder="Select a job title" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {JOB_TITLES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the job title for this contract position
                </FormDescription>
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
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className={getInputStateClasses("department")}>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEPARTMENTS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the department this position belongs to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contract_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className={getInputStateClasses("contract_type")}>
                      <SelectValue placeholder="Select contract type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONTRACT_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the type of employment contract
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className={getInputStateClasses("currency")}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the currency for this contract
                </FormDescription>
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
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className={getInputStateClasses("work_location")}>
                      <SelectValue placeholder="Select work location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WORK_LOCATIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the primary work location for this position
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="h-12 w-full text-base font-semibold"
            disabled={isSubmitting || isLoadingInitialData}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="me-2 h-5 w-5 animate-spin" /> Submitting…
              </>
            ) : contract?.id ? (
              "Update Contract"
            ) : (
              "Generate & Save Contract"
            )}
          </Button>
        </motion.div>

        {/* Add hidden fields to the form */}
        <input type="hidden" {...form.register('first_party_name_en')} />
        <input type="hidden" {...form.register('first_party_name_ar')} />
        <input type="hidden" {...form.register('first_party_crn')} />
        <input type="hidden" {...form.register('second_party_name_en')} />
        <input type="hidden" {...form.register('second_party_name_ar')} />
        <input type="hidden" {...form.register('second_party_crn')} />
        <input type="hidden" {...form.register('promoter_name_en')} />
        <input type="hidden" {...form.register('promoter_name_ar')} />
        <input type="hidden" {...form.register('id_card_number')} />
        <input type="hidden" {...form.register('promoter_id_card_url')} />
        <input type="hidden" {...form.register('promoter_passport_url')} />
      </form>
    </Form>
  )
}
