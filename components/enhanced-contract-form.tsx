"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contractGeneratorSchema } from "@/lib/schema-generator"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { useParties } from "@/hooks/use-parties"
import { usePromoters } from "@/hooks/use-promoters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Download, RefreshCw, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { format } from "date-fns"
import type { Database } from "@/types/supabase"

// Types
interface ContractFormData {
  first_party_id: string
  second_party_id: string
  promoter_id: string
  contract_start_date: Date
  contract_end_date: Date
  email: string
  job_title: string
  work_location: string
  department: string
  contract_type: string
  currency: string
  basic_salary?: number
  allowances?: number
  special_terms?: string
}

type ContractFormDataWithDefaults = {
  [K in keyof ContractFormData]: ContractFormData[K] extends string | undefined ? string : ContractFormData[K]
}

interface ContractStatus {
  contract_id: string
  status: 'draft' | 'processing' | 'generated' | 'failed'
  pdf_url?: string
  generated_at?: string
  error_message?: string
}

interface EnhancedContractFormProps {
  onSuccess?: (contractId: string) => void
  onError?: (error: string) => void
}

export default function EnhancedContractForm({ onSuccess, onError }: EnhancedContractFormProps) {
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Data hooks
  const { data: parties, isLoading: isLoadingParties } = useParties()
  const { data: promoters, isLoading: isLoadingPromoters } = usePromoters()

  // Filter parties by type
  const clientParties = parties?.filter(party => party.type === 'Client') || []
  const employerParties = parties?.filter(party => party.type === 'Employer') || []

  // Form setup
  const form = useForm({
    resolver: zodResolver(contractGeneratorSchema),
    defaultValues: {
      first_party_id: "",
      second_party_id: "",
      promoter_id: "",
      email: "",
      job_title: "",
      work_location: "",
      department: "",
      contract_type: "",
      currency: "OMR",
      basic_salary: 0,
      allowances: 0,
      special_terms: ""
    }
  })

  // Contract generation mutation
  const generateMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate contract')
      }

      return response.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        setContractStatus({
          contract_id: data.data.contract_id,
          status: data.data.status
        })
        
        toast({
          title: "Contract Generated!",
          description: data.data.message,
        })

        // Start polling for status if processing
        if (data.data.status === 'processing') {
          setIsPolling(true)
          pollContractStatus(data.data.contract_id)
        }

        onSuccess?.(data.data.contract_id)
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      })
      onError?.(error.message)
    }
  })

  // Poll contract status
  const pollContractStatus = async (contractId: string) => {
    if (!isPolling) return

    try {
      const response = await fetch(`/api/contracts/generate?contract_id=${contractId}&action=status`)
      const data = await response.json()

      if (data.success) {
        setContractStatus(data.data)
        
        if (data.data.status === 'generated') {
          setIsPolling(false)
          toast({
            title: "PDF Ready!",
            description: "Your contract PDF has been generated successfully.",
          })
          queryClient.invalidateQueries({ queryKey: ['contracts'] })
        } else if (data.data.status === 'failed') {
          setIsPolling(false)
          toast({
            title: "Generation Failed",
            description: data.data.error_message || "PDF generation failed",
            variant: "destructive"
          })
        } else {
          // Continue polling
          setTimeout(() => pollContractStatus(contractId), 5000)
        }
      }
    } catch (error) {
      console.error('Polling error:', error)
    }
  }

  // Retry generation
  const retryMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const response = await fetch('/api/contracts/generate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: contractId, action: 'retry' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to retry generation')
      }

      return response.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        setContractStatus(prev => prev ? { ...prev, status: 'processing' } : null)
        setIsPolling(true)
        pollContractStatus(contractStatus!.contract_id)
        
        toast({
          title: "Retry Initiated",
          description: "Contract generation has been restarted.",
        })
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Retry Failed",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Download PDF
  const downloadPDF = async (contractId: string) => {
    try {
      const response = await fetch(`/api/contracts/generate?contract_id=${contractId}&action=download`)
      const data = await response.json()

      if (data.success && data.data.download_url) {
        // Open PDF in new tab
        window.open(data.data.download_url, '_blank')
      } else {
        toast({
          title: "Download Failed",
          description: data.error || "PDF not available",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download PDF",
        variant: "destructive"
      })
    }
  }

  // Form submission
  const onSubmit = (data: any) => {
    generateMutation.mutate(data as ContractFormData)
  }

  // Loading states
  const isLoading = isLoadingParties || isLoadingPromoters || generateMutation.isPending

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500', icon: FileText },
      processing: { color: 'bg-blue-500', icon: Loader2 },
      generated: { color: 'bg-green-500', icon: CheckCircle },
      failed: { color: 'bg-red-500', icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contract Status Card */}
      {contractStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Contract Status
              <StatusBadge status={contractStatus.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Contract ID:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {contractStatus.contract_id}
              </code>
            </div>

            {contractStatus.status === 'processing' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generating PDF...</span>
                </div>
                <Progress value={0} className="w-full" />
              </div>
            )}

            {contractStatus.status === 'generated' && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => downloadPDF(contractStatus.contract_id)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                {contractStatus.generated_at && (
                  <span className="text-xs text-muted-foreground">
                    Generated: {format(new Date(contractStatus.generated_at), 'PPp')}
                  </span>
                )}
              </div>
            )}

            {contractStatus.status === 'failed' && (
              <div className="space-y-2">
                <p className="text-sm text-red-600">
                  {contractStatus.error_message || 'Generation failed'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => retryMutation.mutate(contractStatus.contract_id)}
                  disabled={retryMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Generation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contract Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Contract</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Contracting Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="first_party_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client (Party A)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger disabled={isLoading}>
                            <SelectValue placeholder={isLoading ? "Loading..." : "Select Client"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientParties.map((party) => (
                            <SelectItem key={party.id} value={party.id}>
                              {party.name_en} / {party.name_ar}
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
                      <FormLabel>Employer (Party B)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger disabled={isLoading}>
                            <SelectValue placeholder={isLoading ? "Loading..." : "Select Employer"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employerParties.map((party) => (
                            <SelectItem key={party.id} value={party.id}>
                              {party.name_en} / {party.name_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Promoter */}
              <FormField
                control={form.control}
                name="promoter_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promoter</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger disabled={isLoading}>
                          <SelectValue placeholder={isLoading ? "Loading..." : "Select Promoter"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {promoters?.map((promoter) => (
                          <SelectItem key={promoter.id} value={promoter.id}>
                            {promoter.name_en} / {promoter.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contract Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contract_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          disabled={isLoading}
                        />
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
                        <Input
                          type="date"
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} />
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
                        <Input {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="work_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Location</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact & Contract Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled={isLoading} />
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
                      <FormLabel>Contract Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger disabled={isLoading}>
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time-permanent">Full Time Permanent</SelectItem>
                          <SelectItem value="part-time">Part Time</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectTrigger disabled={isLoading}>
                            <SelectValue placeholder="Select Currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="OMR">OMR (Omani Rial)</SelectItem>
                          <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Salary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="basic_salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Basic Salary</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          disabled={isLoading}
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
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Special Terms */}
              <FormField
                control={form.control}
                name="special_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Terms (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Any special terms or conditions..."
                        disabled={isLoading}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Contract...
                  </>
                ) : (
                  'Generate Contract'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 