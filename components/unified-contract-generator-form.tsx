"use client"

import { useEffect, useState, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { differenceInDays } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Client-side check to prevent SSR issues
const isClient = typeof window !== 'undefined'

// Error Boundary Component
import React from "react"

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("UnifiedContractGeneratorForm Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">The contract form encountered an error.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  AlertTriangle,
  FileText,
  Settings,        // ← PRIMARY SETTINGS ICON
  Cog,             // ← ALTERNATIVE SETTINGS ICON
  Sliders,         // ← ALTERNATIVE SETTINGS ICON
  Sparkles,
  Calculator,
  Users,
  Briefcase,
  Search,
  UserPlus,
  Menu,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Copy,
  Share,
  Filter,
  CheckCircle,
  Info,
  Calendar,
  Clock,
  Globe,
  Shield,
  Zap,
  Star,
  Award,
  TrendingUp,
  Eye,
  EyeOff,
  Bell,
  Mail,
  Phone,
  MapPin,
  Building,
} from "lucide-react"
import { DatePickerWithManualInput } from "./date-picker-with-manual-input"
import { ComboboxField } from "@/components/combobox-field"
import type { Database } from "@/types/supabase"
import {
  contractGeneratorSchema,
  type ContractGeneratorFormData,
  CONTRACT_FORM_SECTIONS,
  getRequiredFields,
} from "@/lib/schema-generator"
import { useParties } from "@/hooks/use-parties"
import { usePromoters } from "@/hooks/use-promoters"
import { useFormRegistration } from "@/hooks/use-form-context"
import type { Promoter } from "@/lib/types"
import { JOB_TITLES, CURRENCIES, WORK_LOCATIONS, DEPARTMENTS, CONTRACT_TYPES } from "@/constants/contract-options"
import {
  createContract,
  updateContract,
  ContractInsert,
  generateContractWithMakecom,
} from "@/app/actions/contracts"

interface UnifiedContractGeneratorFormProps {
  /** Existing contract when editing; new contract if undefined. */
  contract?: Database["public"]["Tables"]["contracts"]["Row"] | null
  /** Callback when the form is successfully saved. */
  onFormSubmit?: () => void
  /** Show advanced fields by default */
  showAdvanced?: boolean
  /** Mode: 'simple' for basic form, 'advanced' for full features */
  mode?: "simple" | "advanced"
  /** Auto-redirect after successful submission */
  autoRedirect?: boolean
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
}

function UnifiedContractGeneratorForm({
  contract,
  onFormSubmit,
  showAdvanced = false,
  mode = "advanced",
  autoRedirect = true,
}: UnifiedContractGeneratorFormProps) {
  // Client-side guard to prevent SSR issues
  if (!isClient) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Initializing contract form...</p>
        </div>
      </div>
    )
  }

  // Register this form to disable auto-refresh during form interactions
  useFormRegistration()
  const router = useRouter()
  const queryClient = useQueryClient()
  // const { toast } = useToast()

    // State management with hydration safety
  const [mounted, setMounted] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [showAdvancedFields, setShowAdvancedFields] = useState(showAdvanced)
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Hydration check
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load parties & promoters with error handling and auth safety
  const { data: clientParties, isLoading: isLoadingClientParties, error: clientError } = useParties("Client")
  const { data: employerParties, isLoading: isLoadingEmployerParties, error: employerError } = useParties("Employer")
  const { data: promoters, isLoading: isLoadingPromoters, error: promotersError } = usePromoters()

  // Handle data loading errors with auth context
  useEffect(() => {
    if (clientError) {
      console.error("Error loading client parties:", clientError)
      // Only show error toast if not an auth error
      if (!clientError.message.includes('Auth') && !clientError.message.includes('session')) {
        toast.error("Failed to load client parties")
      }
    }
    if (employerError) {
      console.error("Error loading employer parties:", employerError)
      if (!employerError.message.includes('Auth') && !employerError.message.includes('session')) {
        toast.error("Failed to load employer parties")
      }
    }
    if (promotersError) {
      console.error("Error loading promoters:", promotersError)
      if (!promotersError.message.includes('Auth') && !promotersError.message.includes('session')) {
        toast.error("Failed to load promoters")
      }
    }
  }, [clientError, employerError, promotersError])

  // Form setup with enhanced defaults
  const form = useForm<ContractGeneratorFormData>({
    resolver: zodResolver(contractGeneratorSchema),
    mode: "onTouched",
    defaultValues: {
      first_party_id: contract?.first_party_id || "",
      second_party_id: contract?.second_party_id || "",
      promoter_id: contract?.promoter_id || "",
      contract_start_date: contract?.contract_start_date
        ? new Date(contract.contract_start_date)
        : undefined,
      contract_end_date: contract?.contract_end_date
        ? new Date(contract.contract_end_date)
        : undefined,
      email: contract?.email || "",
      job_title: contract?.job_title || "",
      work_location: contract?.work_location || "",
      department: contract?.department || "",
      contract_type: contract?.contract_type || "unlimited-contract", // Set default to unlimited contract
      currency: "OMR", // Default to OMR for Oman market
      basic_salary: contract?.contract_value || undefined,
      allowances: undefined,
      probation_period_months: undefined, // Changed from 3 to undefined for consistency
      notice_period_days: undefined, // Changed from 30 to undefined for consistency
      working_hours_per_week: undefined, // Changed from 40 to undefined for consistency
      special_terms: "",
    },
  })

  // Performance optimization: Direct number input handling to prevent UI blocking
  // Watch form values for calculations and validation (MUST BE DECLARED BEFORE USAGE)
  const watchedValues = useWatch({ control: form.control })
  const watchedPromoterId = useWatch({ control: form.control, name: "promoter_id" })
  const watchedSecondPartyId = useWatch({ control: form.control, name: "second_party_id" })
  const watchedStartDate = useWatch({ control: form.control, name: "contract_start_date" })
  const watchedEndDate = useWatch({ control: form.control, name: "contract_end_date" })
  const watchedSalary = useWatch({ control: form.control, name: "basic_salary" })
  const watchedAllowances = useWatch({ control: form.control, name: "allowances" })

  // Build combobox options
  const partyOptions = useMemo(() => {
    const allParties = [...(clientParties || []), ...(employerParties || [])]
    return allParties.map((party) => ({
      value: party.id.toString(),
      label: party.name_en,
    }))
  }, [clientParties, employerParties])

  const promoterOptions = useMemo(() => {
    if (!promoters || !Array.isArray(promoters)) return []
    
    // Filter promoters based on selected employer
    let filteredPromoters = promoters as Promoter[]
    
    if (watchedSecondPartyId) {
      filteredPromoters = (promoters as Promoter[]).filter((p: Promoter) => {
        // Check if promoter is associated with the selected employer
        return p.employer_id?.toString() === watchedSecondPartyId || 
               p.outsourced_to_id?.toString() === watchedSecondPartyId
      })
    }
    
    return filteredPromoters.map((p: Promoter) => ({
      value: p.id.toString(),
      label: `${p.name_en} / ${p.name_ar} (ID: ${p.id_card_number ?? "N/A"})`,
    }))
  }, [promoters, watchedSecondPartyId])

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    const requiredFields = getRequiredFields()
    if (requiredFields.length === 0) return 0
    
    const completedFields = requiredFields.filter((field) => {
      const value = form.getValues(field as keyof ContractGeneratorFormData)
      return value !== undefined && value !== null && value !== ""
    }).length
    return Math.round((completedFields / requiredFields.length) * 100)
  }, [form, watchedValues])

  // Calculate contract duration and insights
  const contractInsights = useMemo(() => {
    if (!watchedStartDate || !watchedEndDate) return null

    const duration = differenceInDays(watchedEndDate, watchedStartDate)
    const totalCompensation = (watchedSalary || 0) + (watchedAllowances || 0)

    return {
      duration,
      durationText: duration === 1 ? "1 day" : `${duration} days`,
      isShortTerm: duration <= 90,
      isLongTerm: duration >= 365,
      totalCompensation,
      monthlyRate: totalCompensation > 0 ? totalCompensation : null,
    }
  }, [watchedStartDate, watchedEndDate, watchedSalary, watchedAllowances])

  // Auto-fill promoter data when selected
  useEffect(() => {
    if (watchedPromoterId && promoters && Array.isArray(promoters)) {
      const selectedPromoter = (promoters as Promoter[]).find((p: Promoter) => p.id.toString() === watchedPromoterId)
      if (selectedPromoter) {
        setSelectedPromoter(selectedPromoter)
        // Auto-fill email if not already set
        if (!form.getValues("email") && selectedPromoter.email) {
          form.setValue("email", selectedPromoter.email)
        }
      }
    }
  }, [watchedPromoterId, promoters, form])

  // Watch for contract type changes to pre-fill template data
  const watchedContractType = useWatch({ control: form.control, name: "contract_type" })
  
  // Auto-fill form based on selected contract template
  useEffect(() => {
    if (watchedContractType && watchedContractType !== form.getValues("contract_type")) {
      // Get template configuration based on contract type
      const selectedTemplate = CONTRACT_TYPES.find(type => type.value === watchedContractType)
      
      if (selectedTemplate) {
        // Clear existing template-specific values first
        const currentValues = form.getValues()
        
        // Apply template-specific defaults based on contract type
        switch (watchedContractType) {
          case "unlimited-contract":
            // Unlimited contract - no end date, standard settings
            form.setValue("contract_end_date", undefined)
            if (!currentValues.probation_period_months) form.setValue("probation_period_months", 3)
            if (!currentValues.notice_period_days) form.setValue("notice_period_days", 30)
            if (!currentValues.working_hours_per_week) form.setValue("working_hours_per_week", 40)
            break
            
          case "limited-contract":
          case "oman-fixed-term-makecom":
            // Fixed-term contract - requires end date
            if (!currentValues.contract_end_date && currentValues.contract_start_date) {
              const startDate = new Date(currentValues.contract_start_date)
              const endDate = new Date(startDate)
              endDate.setFullYear(startDate.getFullYear() + 1) // Default 1 year
              form.setValue("contract_end_date", endDate)
            }
            if (!currentValues.probation_period_months) form.setValue("probation_period_months", 2)
            if (!currentValues.notice_period_days) form.setValue("notice_period_days", 14)
            if (!currentValues.working_hours_per_week) form.setValue("working_hours_per_week", 40)
            break
            
          case "part-time-contract":
          case "oman-part-time-makecom":
            // Part-time contract - reduced hours
            if (!currentValues.working_hours_per_week) form.setValue("working_hours_per_week", 20)
            if (!currentValues.probation_period_months) form.setValue("probation_period_months", 1)
            if (!currentValues.notice_period_days) form.setValue("notice_period_days", 14)
            break
            
          case "probationary":
            // Probationary contract - short term with specific settings
            if (!currentValues.contract_end_date && currentValues.contract_start_date) {
              const startDate = new Date(currentValues.contract_start_date)
              const endDate = new Date(startDate)
              endDate.setMonth(startDate.getMonth() + 3) // 3 months probation
              form.setValue("contract_end_date", endDate)
            }
            form.setValue("probation_period_months", 0) // No additional probation
            if (!currentValues.notice_period_days) form.setValue("notice_period_days", 7)
            if (!currentValues.working_hours_per_week) form.setValue("working_hours_per_week", 40)
            break
            
          case "internship":
          case "training-contract":
            // Internship/Training - typically short-term with minimal salary
            if (!currentValues.contract_end_date && currentValues.contract_start_date) {
              const startDate = new Date(currentValues.contract_start_date)
              const endDate = new Date(startDate)
              endDate.setMonth(startDate.getMonth() + 6) // 6 months default
              form.setValue("contract_end_date", endDate)
            }
            form.setValue("probation_period_months", 0)
            if (!currentValues.notice_period_days) form.setValue("notice_period_days", 7)
            if (!currentValues.working_hours_per_week) form.setValue("working_hours_per_week", 35)
            if (!currentValues.basic_salary) form.setValue("basic_salary", 300) // Minimum training allowance
            break
            
          case "consulting":
          case "freelance":
          case "project-based":
            // Consulting/Freelance - project-based with flexible terms
            if (!currentValues.notice_period_days) form.setValue("notice_period_days", 7)
            if (!currentValues.working_hours_per_week) form.setValue("working_hours_per_week", 30)
            form.setValue("probation_period_months", 0)
            break
            
          case "seasonal":
          case "temporary":
            // Seasonal/Temporary - short-term with minimal commitments
            if (!currentValues.contract_end_date && currentValues.contract_start_date) {
              const startDate = new Date(currentValues.contract_start_date)
              const endDate = new Date(startDate)
              endDate.setMonth(startDate.getMonth() + 4) // 4 months default
              form.setValue("contract_end_date", endDate)
            }
            form.setValue("probation_period_months", 0)
            if (!currentValues.notice_period_days) form.setValue("notice_period_days", 3)
            if (!currentValues.working_hours_per_week) form.setValue("working_hours_per_week", 25)
            break
            
          case "executive":
          case "management":
          case "director":
            // Executive contracts - enhanced terms
            if (!currentValues.probation_period_months) form.setValue("probation_period_months", 6)
            if (!currentValues.notice_period_days) form.setValue("notice_period_days", 60)
            if (!currentValues.working_hours_per_week) form.setValue("working_hours_per_week", 45)
            if (!currentValues.basic_salary) form.setValue("basic_salary", 2000) // Higher base salary
            break
            
          case "remote-work":
            // Remote work contract - flexible arrangements
            if (!currentValues.work_location) form.setValue("work_location", "remote")
            if (!currentValues.working_hours_per_week) form.setValue("working_hours_per_week", 40)
            if (!currentValues.probation_period_months) form.setValue("probation_period_months", 2)
            if (!currentValues.notice_period_days) form.setValue("notice_period_days", 30)
            break
            
          default:
            // Default template values for other contract types
            if (!currentValues.probation_period_months) form.setValue("probation_period_months", 3)
            if (!currentValues.notice_period_days) form.setValue("notice_period_days", 30)
            if (!currentValues.working_hours_per_week) form.setValue("working_hours_per_week", 40)
            break
        }
        
        // Show notification about template application
        toast.success(`Template applied: ${selectedTemplate.label}`, {
          description: "Form fields have been pre-filled based on the selected contract type.",
          duration: 3000,
        })
      }
    }
  }, [watchedContractType, form, toast])

  // Clear promoter selection when employer changes
  useEffect(() => {
    if (watchedSecondPartyId) {
      // Clear promoter selection when employer changes
      form.setValue("promoter_id", "")
      setSelectedPromoter(null)
    }
  }, [watchedSecondPartyId, form])

  // Mutation for form submission
  const submitMutation = useMutation({
    mutationFn: async (data: ContractGeneratorFormData) => {
      if (contract) {
        // Update existing contract
        const payload: Partial<ContractInsert> = {
          ...data,
          contract_start_date: data.contract_start_date?.toISOString(),
          contract_end_date: data.contract_end_date?.toISOString(),
          contract_value: data.basic_salary,
        }
        return await updateContract(contract.id, payload)
      } else {
        // Generate new contract with Make.com integration
        return await generateContractWithMakecom({
          first_party_id: data.first_party_id || "",
          second_party_id: data.second_party_id || "",
          promoter_id: data.promoter_id || "",
          contract_start_date: data.contract_start_date!,
          contract_end_date: data.contract_end_date,
          email: data.email || "",
          job_title: data.job_title || "",
          work_location: data.work_location || "",
          department: data.department || "",
          contract_type: data.contract_type || "",
          currency: data.currency || "OMR",
          basic_salary: data.basic_salary,
          allowances: data.allowances,
          special_terms: data.special_terms,
        })
      }
    },
    onSuccess: (result) => {
      if (contract) {
        toast.success("Contract updated successfully!")
      } else {
        // Handle Make.com integration result
        const makecomResult = result as any // Type assertion for Make.com result
        const message = makecomResult.message || "Contract created successfully!"
        toast.success(message)

        // Show additional info if available
        if (makecomResult.google_drive_url) {
          toast.info("Contract sent to Google Drive for processing")
        }
        if (makecomResult.status === "processing") {
          toast.info("Contract is being processed by Make.com")
        }
      }

      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      onFormSubmit?.()
      if (autoRedirect) {
        router.push("/contracts")
        router.refresh()
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
      setValidationErrors([errorMessage])
      toast.error(errorMessage)
    },
  })

  const onSubmit = (data: ContractGeneratorFormData) => {
    console.log("Form submission attempted with data:", data)
    console.log("Form errors:", form.formState.errors)
    console.log("Form is valid:", form.formState.isValid)
    console.log("Required fields:", getRequiredFields())
    console.log("Form touched fields:", form.formState.touchedFields)
    
    // Log each required field and its value for debugging
    const requiredFields = getRequiredFields()
    requiredFields.forEach(field => {
      const value = form.getValues(field as keyof ContractGeneratorFormData)
      console.log(`Field ${field}:`, value, typeof value, value === null, value === undefined, value === "")
    })
    
    // Check if form is valid before submitting
    if (!form.formState.isValid) {
      console.log("Form validation failed, but attempting to trigger validation and retry...")
      
      // Force trigger validation on all fields
      form.trigger().then(isValid => {
        console.log("Manual validation result:", isValid)
        if (isValid) {
          console.log("Manual validation passed, proceeding with submission")
          setValidationErrors([])
          submitMutation.mutate(data)
        } else {
          console.log("Manual validation also failed")
          toast.error("Please fix the validation errors before submitting")
        }
      })
      return
    }
    
    setValidationErrors([])
    submitMutation.mutate(data)
  }

  // Navigation functions
  const goToNextSection = () => {
    if (currentSection < CONTRACT_FORM_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1)
    }
  }

  const goToPreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const getInputStateClasses = (fieldName: keyof ContractGeneratorFormData) => {
    const hasError = form.formState.errors[fieldName]
    const isTouched = form.formState.touchedFields[fieldName]

    if (hasError) return "border-red-500 focus:border-red-500"
    if (isTouched) return "border-green-500 focus:border-green-500"
    return ""
  }

  // Loading states with error handling
  const isLoading =
    isLoadingClientParties ||
    isLoadingEmployerParties ||
    isLoadingPromoters ||
    submitMutation.isPending

  // Show loading if not mounted yet (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading contract form...</p>
        </div>
      </div>
    )
  }

  // Show loading if data is still being fetched
  if (isLoadingClientParties || isLoadingEmployerParties || isLoadingPromoters) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading contract form...</p>
        </div>
      </div>
    )
  }

  // Show error if any critical data failed to load (but not auth errors)
  const hasNonAuthErrors = (clientError && !clientError.message.includes('Auth') && !clientError.message.includes('session')) ||
                          (employerError && !employerError.message.includes('Auth') && !employerError.message.includes('session')) ||
                          (promotersError && !promotersError.message.includes('Auth') && !promotersError.message.includes('session'))

  if (hasNonAuthErrors) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">Failed to Load Data</h2>
        <p className="text-gray-600 mb-4">Unable to load required data for the contract form.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    )
  }

  // Simple mode form
  if (mode === "simple") {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
        <h1 className="mb-6 text-2xl font-bold">
          {contract ? "Edit Contract" : "Generate New Contract"}
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="first_party_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Party (e.g., Client)</FormLabel>
                  <FormControl>
                    <ComboboxField
                      field={field}
                      options={partyOptions}
                      placeholder="Select a party"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="second_party_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Second Party (e.g., Employer)</FormLabel>
                  <FormControl>
                    <ComboboxField
                      field={field}
                      options={partyOptions}
                      placeholder="Select a party"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promoter_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promoter *</FormLabel>
                  <FormControl>
                    <ComboboxField
                      field={field}
                      options={promoterOptions}
                      placeholder="Select a promoter"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Email address for contract notifications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePickerWithManualInput date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <DatePickerWithManualInput date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="basic_salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter contract value"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          field.onChange(undefined);
                        } else {
                          const numValue = Number(value);
                          if (!isNaN(numValue)) {
                            field.onChange(numValue);
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter job title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Type *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contract type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTRACT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Choose the type of employment contract
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
                  <FormLabel>Work Location *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter work location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {contract ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  {contract ? "Update Contract" : "Create Contract"}
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    )
  }

  // Advanced mode form
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {contract ? "Edit Contract" : "Generate New Contract"}
            </h1>
            <p className="mt-2 text-gray-600">
              {contract
                ? "Update contract details and settings"
                : "Create a comprehensive contract with advanced features"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced-mode"
                checked={showAdvancedFields}
                onCheckedChange={setShowAdvancedFields}
              />
              <Label htmlFor="advanced-mode">Advanced Mode</Label>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Form Completion</span>
            <span className="text-sm text-gray-500">{isNaN(formProgress) ? 0 : formProgress}%</span>
          </div>
          <Progress value={isNaN(formProgress) ? 0 : formProgress} className="h-2" />
        </div>

        {/* Contract Insights */}
        {contractInsights && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Calculator className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Contract Insights</h3>
                  <div className="mt-1 flex gap-4 text-sm text-blue-700">
                    <span>Duration: {contractInsights.durationText}</span>
                    {contractInsights.totalCompensation > 0 && !isNaN(contractInsights.totalCompensation) && (
                      <span>Total: {contractInsights.totalCompensation} OMR</span>
                    )}
                    <Badge variant={contractInsights.isShortTerm ? "secondary" : "default"}>
                      {contractInsights.isShortTerm
                        ? "Short Term"
                        : contractInsights.isLongTerm
                          ? "Long Term"
                          : "Medium Term"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Essential contract details and parties involved</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_party_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Party (Client)</FormLabel>
                        <FormControl>
                          <ComboboxField
                            field={field}
                            options={partyOptions}
                            placeholder="Select first party"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="second_party_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Second Party (Employer)</FormLabel>
                        <FormControl>
                          <ComboboxField
                            field={field}
                            options={partyOptions}
                            placeholder="Select second party"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="promoter_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promoter</FormLabel>
                      <FormControl>
                        <ComboboxField
                          field={field}
                          options={promoterOptions}
                          placeholder="Select a promoter"
                        />
                      </FormControl>
                      <FormMessage />
                      {watchedSecondPartyId && promoterOptions.length === 0 && (
                        <p className="text-sm text-amber-600 mt-2">
                          ⚠️ No promoters found for the selected employer. Please select a different employer or add promoters to this employer.
                        </p>
                      )}
                      {watchedSecondPartyId && promoterOptions.length > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          ✅ {promoterOptions.length} promoter(s) available for this employer
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter email address" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Email address for contract notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contract_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <DatePickerWithManualInput date={field.value} setDate={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contract_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <DatePickerWithManualInput date={field.value} setDate={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Employment Details Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment Details
                </CardTitle>
                <CardDescription>Job specifications and compensation details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select job title" />
                            </SelectTrigger>
                            <SelectContent>
                              {JOB_TITLES.map((title) => (
                                <SelectItem key={title.value} value={title.value}>
                                  {title.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <FormLabel>Department *</FormLabel>
                        <FormControl>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map((dept) => (
                                <SelectItem key={dept.value} value={dept.value}>
                                  {dept.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select work location" />
                            </SelectTrigger>
                            <SelectContent>
                              {WORK_LOCATIONS.map((location) => (
                                <SelectItem key={location.value} value={location.value}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{location.label}</span>
                                    {location.description && (
                                      <span className="mt-0.5 text-xs text-muted-foreground">
                                        {location.description}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Type *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contract type" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTRACT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Choose the type of employment contract
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="basic_salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Basic Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                field.onChange(undefined);
                              } else {
                                const numValue = Number(value);
                                if (!isNaN(numValue)) {
                                  field.onChange(numValue);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowances"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allowances</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                field.onChange(undefined);
                              } else {
                                const numValue = Number(value);
                                if (!isNaN(numValue)) {
                                  field.onChange(numValue);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency *</FormLabel>
                        <FormControl>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((currency) => (
                                <SelectItem key={currency.value} value={currency.value}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Fields */}
            {showAdvancedFields && (
              <AnimatePresence>
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Advanced Settings
                      </CardTitle>
                      <CardDescription>Additional contract terms and conditions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="probation_period_months"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Probation Period (Months)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="3"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                      field.onChange(undefined);
                                    } else {
                                      const numValue = Number(value);
                                      if (!isNaN(numValue)) {
                                        field.onChange(numValue);
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="notice_period_days"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notice Period (Days)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="30"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                      field.onChange(undefined);
                                    } else {
                                      const numValue = Number(value);
                                      if (!isNaN(numValue)) {
                                        field.onChange(numValue);
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="working_hours_per_week"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Working Hours/Week</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="40"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                      field.onChange(undefined);
                                    } else {
                                      const numValue = Number(value);
                                      if (!isNaN(numValue)) {
                                        field.onChange(numValue);
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="special_terms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Terms</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any special terms or conditions..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>

          {/* Form Validation Debugging */}
          {process.env.NODE_ENV === "development" && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                <div className="text-xs space-y-1">
                  <div>Form Valid: {form.formState.isValid ? "✅" : "❌"}</div>
                  <div>Is Loading: {isLoading ? "🔄" : "✅"}</div>
                  <div>Submit Pending: {submitMutation.isPending ? "🔄" : "✅"}</div>
                  {Object.keys(form.formState.errors).length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium">Validation Errors:</div>
                      {Object.entries(form.formState.errors).map(([field, error]) => (
                        <div key={field} className="text-red-600">
                          {field}: {typeof error === 'object' && error?.message ? error.message : 'Validation error'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-inside list-disc">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            
            {/* Debug button in development */}
            {process.env.NODE_ENV === "development" && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  console.log("Current form values:", form.getValues())
                  console.log("Form errors:", form.formState.errors)
                  form.trigger() // Trigger validation
                }}
              >
                Debug Form
              </Button>
            )}
            
            {/* Force Submit button for debugging */}
            {process.env.NODE_ENV === "development" && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => {
                  console.log("Force submit bypassing validation")
                  const data = form.getValues()
                  console.log("Force submit data:", data)
                  setValidationErrors([])
                  submitMutation.mutate(data)
                }}
              >
                Force Submit (Debug)
              </Button>
            )}
            
            <Button type="submit" disabled={isLoading} className="min-w-[200px]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {contract ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {contract ? "Update Contract" : "Create Contract"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

// Wrapped component with error boundary and additional safety
function UnifiedContractGeneratorFormSafe(props: UnifiedContractGeneratorFormProps) {
  return (
    <ErrorBoundary>
      <UnifiedContractGeneratorForm {...props} />
    </ErrorBoundary>
  )
}

// Export the safe version by default
export default UnifiedContractGeneratorFormSafe
