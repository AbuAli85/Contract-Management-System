"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  ArrowLeftIcon, 
  SaveIcon, 
  FileTextIcon, 
  CalendarIcon,
  DollarSignIcon,
  UsersIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon
} from "lucide-react"
import { useContract } from "@/hooks/useContract"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorCard } from "@/components/ErrorCard"
import { StatusBadge } from "@/components/StatusBadge"
import { createClient } from "@/lib/supabase/client"
import { AuthenticatedLayout } from "@/components/authenticated-layout"

export default function EditContractPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params?.id as string
  
  // Extract locale from pathname
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const locale = pathname && pathname.startsWith('/en/') ? 'en' : pathname && pathname.startsWith('/ar/') ? 'ar' : 'en'
  
  const { contract, loading, error, refetch } = useContract(contractId)
  
  // Form state - only fields that exist in ContractDetail type
  const [formData, setFormData] = useState({
    // Basic Info
    status: "",
    
    // Dates
    contract_start_date: "",
    contract_end_date: "",
    
    // Financial
    salary: "",
    basic_salary: "",
    allowances: "",
    currency: "USD",
    
    // Party Information
    first_party_name_en: "",
    first_party_name_ar: "",
    second_party_name_en: "",
    second_party_name_ar: "",
    
    // Employment Details
    job_title: "",
    department: "",
    work_location: "",
    email: "",
    
    // Contract Terms
    contract_type: "",
    contract_number: "",
    id_card_number: "",
    
    // Documents
    google_doc_url: "",
    pdf_url: "",
    
    // Special Terms
    special_terms: "",
    // Promoter ID
    promoter_id: ""
  })
  
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load contract data into form when contract is fetched
  useEffect(() => {
    if (contract) {
      setFormData({
        status: contract.status || "draft",
        contract_start_date: contract.contract_start_date || "",
        contract_end_date: contract.contract_end_date || "",
        salary: contract.basic_salary?.toString() || "",
        basic_salary: contract.basic_salary?.toString() || "",
        allowances: contract.allowances?.toString() || "",
        currency: contract.currency || "USD",
        first_party_name_en: contract.first_party_name_en || contract.first_party?.name_en || "",
        first_party_name_ar: contract.first_party_name_ar || contract.first_party?.name_ar || "",
        second_party_name_en: contract.second_party_name_en || contract.second_party?.name_en || "",
        second_party_name_ar: contract.second_party_name_ar || contract.second_party?.name_ar || "",
        job_title: contract.job_title || "",
        department: contract.department || "",
        work_location: contract.work_location || "",
        email: contract.email || "",
        contract_type: contract.contract_type || "",
        contract_number: contract.contract_number || "",
        id_card_number: contract.id_card_number || "",
        pdf_url: contract.pdf_url || "",
        special_terms: contract.special_terms || "",
        google_doc_url: "",
        promoter_id: contract.promoter_id || ""
      })
    }
  }, [contract])

  // Warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear success/error messages when user starts editing
    setSaveSuccess(false)
    setSaveError(null)
    setHasUnsavedChanges(true)
  }

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.contract_number) errors.push('Contract Number is required.');
    if (!formData.first_party_name_en) errors.push('First Party (Employer) name is required.');
    if (!formData.second_party_name_en) errors.push('Second Party (Employee) name is required.');
    if (!formData.contract_start_date) errors.push('Start Date is required.');
    if (!formData.contract_end_date) errors.push('End Date is required.');
    if (formData.salary && parseFloat(formData.salary) < 0) errors.push('Salary cannot be negative.');
    if (formData.contract_start_date && formData.contract_end_date) {
      const startDate = new Date(formData.contract_start_date);
      const endDate = new Date(formData.contract_end_date);
      if (startDate > endDate) {
        errors.push('Contract start date cannot be after end date.');
      }
    }
    return errors;
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    const errors = validateForm();
    setValidationErrors(errors);
    if (errors.length > 0) {
      setSaving(false);
      return;
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Save operation timed out')), 10000)
    })

    try {
      // Basic validation
      if (formData.contract_start_date && formData.contract_end_date) {
        const startDate = new Date(formData.contract_start_date)
        const endDate = new Date(formData.contract_end_date)
        if (startDate > endDate) {
          throw new Error('Contract start date cannot be after end date')
        }
      }

      if (formData.salary && parseFloat(formData.salary) < 0) {
        throw new Error('Salary cannot be negative')
      }

      // Only update fields that actually exist in the contracts table
      const updateData = {
        status: formData.status,
        contract_start_date: formData.contract_start_date || null,
        contract_end_date: formData.contract_end_date || null,
        basic_salary: formData.basic_salary ? parseFloat(formData.basic_salary) : null,
        allowances: formData.allowances ? parseFloat(formData.allowances) : null,
        currency: formData.currency,
        job_title: formData.job_title,
        department: formData.department,
        work_location: formData.work_location,
        email: formData.email,
        contract_type: formData.contract_type,
        contract_number: formData.contract_number,
        id_card_number: formData.id_card_number,
        special_terms: formData.special_terms,
        updated_at: new Date().toISOString()
      }

      const supabase = createClient()
      console.log('🔄 Saving contract with data:', updateData)
      
      // Wrap the save operation with timeout
      const savePromise = supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId)
        .select()

      const result = await Promise.race([savePromise, timeoutPromise]) as any
      const { data, error } = result

      if (error) {
        console.error('❌ Save error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Contract saved successfully:', data)

      setSaveSuccess(true)
      // Refresh contract data
      await refetch()
      setHasUnsavedChanges(false)
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSaveSuccess(false), 5000)
    } catch (err) {
      console.error('❌ Save operation failed:', err)
      setSaveError(err instanceof Error ? err.message : 'Failed to save contract')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorCard message={error} onRetry={refetch} />
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <FileTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contract Not Found</h3>
              <p className="text-gray-600 mb-6">The contract you&apos;re trying to edit doesn&apos;t exist or has been removed.</p>
              <Button asChild>
                <Link href={`/${locale}/contracts`}>
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back to Contracts
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <AuthenticatedLayout locale={locale}>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Link href={`/${locale}/contracts/${contractId}`}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Details
              </Link>
            </Button>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Contracts</span>
              <span>/</span>
              <span>Edit Contract</span>
            </nav>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">Edit Contract</h1>
                  <StatusBadge status={contract.status} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-500">Contract ID</label>
                    <p className="text-gray-900 mt-1 font-mono text-xs">{contractId}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Last Modified</label>
                    <p className="text-gray-900 mt-1">{contract.updated_at ? new Date(contract.updated_at).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-6">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="min-w-24"
                >
                  {saving ? (
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <SaveIcon className="mr-2 h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

            {/* Success/Error Messages */}
            {saveSuccess && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Contract saved successfully!
                </AlertDescription>
              </Alert>
            )}

            {saveError && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircleIcon className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Error saving contract: {saveError}
                </AlertDescription>
              </Alert>
            )}

            {validationErrors.length > 0 && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircleIcon className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-1">
                    <p className="font-medium">Please fix the following errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Form Tabs */}
        <Tabs defaultValue="basic" className="space-y-6 transition-all duration-300">
          <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="parties" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Parties
            </TabsTrigger>
            <TabsTrigger value="employment" className="flex items-center gap-2">
              <DollarSignIcon className="h-4 w-4" />
              Employment
            </TabsTrigger>
            <TabsTrigger value="dates" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Dates & Terms
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card className="shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update the basic contract information and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contract_number">Contract Number</Label>
                    <Input
                      id="contract_number"
                      value={formData.contract_number}
                      onChange={(e) => handleInputChange('contract_number', e.target.value)}
                      placeholder="CON-2024-001"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="signed">Signed</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="id_card_number">ID Card Number</Label>
                    <Input
                      id="id_card_number"
                      value={formData.id_card_number}
                      onChange={(e) => handleInputChange('id_card_number', e.target.value)}
                      placeholder="Employee ID Card Number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="employee@company.com"
                    />
                  </div>
                </div>


              </CardContent>
            </Card>
          </TabsContent>

          {/* Parties Tab */}
          <TabsContent value="parties">
            <Card className="shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Contract Parties</CardTitle>
                <CardDescription>
                  Information about the parties involved in the contract
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* First Party */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">First Party (Employer)</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_party_name_en">Name (English)</Label>
                        <Input
                          id="first_party_name_en"
                          value={formData.first_party_name_en}
                          onChange={(e) => handleInputChange('first_party_name_en', e.target.value)}
                          placeholder="Company Name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="first_party_name_ar">Name (Arabic)</Label>
                        <Input
                          id="first_party_name_ar"
                          value={formData.first_party_name_ar}
                          onChange={(e) => handleInputChange('first_party_name_ar', e.target.value)}
                          placeholder="اسم الشركة"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Second Party */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Second Party (Employee)</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="second_party_name_en">Name (English)</Label>
                        <Input
                          id="second_party_name_en"
                          value={formData.second_party_name_en}
                          onChange={(e) => handleInputChange('second_party_name_en', e.target.value)}
                          placeholder="Employee Name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="second_party_name_ar">Name (Arabic)</Label>
                        <Input
                          id="second_party_name_ar"
                          value={formData.second_party_name_ar}
                          onChange={(e) => handleInputChange('second_party_name_ar', e.target.value)}
                          placeholder="اسم الموظف"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promoter Information */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Promoter</h3>
                  {contract?.promoter ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name (English)</label>
                          <p className="font-semibold text-gray-900 mt-1">
                            {contract.promoter.name_en || "Unnamed Promoter"}
                          </p>
                        </div>
                        
                        {contract.promoter.name_ar && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Name (Arabic)</label>
                            <p className="font-semibold text-gray-900 mt-1" dir="rtl">{contract.promoter.name_ar}</p>
                          </div>
                        )}
                        
                        {contract.promoter.id_card_number && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">ID Number</label>
                            <p className="font-mono text-sm text-gray-700 mt-1">{contract.promoter.id_card_number}</p>
                          </div>
                        )}
                        
                        {contract.promoter.status && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <div className="text-gray-700 mt-1">
                              <StatusBadge status={contract.promoter.status} />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <label className="text-sm font-medium text-gray-500">Promoter ID</label>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono flex-1">
                            {contract.promoter_id}
                          </code>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircleIcon className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">No promoter assigned</p>
                          <p className="text-sm text-yellow-700">This contract doesn't have an assigned promoter.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment">
            <Card className="shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>
                  Job position, salary, and work-related information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      placeholder="Software Developer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="IT Department"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="basic_salary">Basic Salary
                      <span className="ml-1 text-gray-400 cursor-pointer" title="The base salary before allowances.">?</span>
                    </Label>
                    <Input
                      id="basic_salary"
                      type="number"
                      value={formData.basic_salary}
                      onChange={(e) => handleInputChange('basic_salary', e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowances">Allowances
                      <span className="ml-1 text-gray-400 cursor-pointer" title="Additional allowances (e.g., housing, transport).">?</span>
                    </Label>
                    <Input
                      id="allowances"
                      type="number"
                      value={formData.allowances}
                      onChange={(e) => handleInputChange('allowances', e.target.value)}
                      placeholder="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Total Salary
                      <span className="ml-1 text-gray-400 cursor-pointer" title="Total salary including all components.">?</span>
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      placeholder="60000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OMR">OMR</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work_location">Work Location
                      <span className="ml-1 text-gray-400 cursor-pointer" title="Where the employee will work.">?</span>
                    </Label>
                    <Input
                      id="work_location"
                      value={formData.work_location}
                      onChange={(e) => handleInputChange('work_location', e.target.value)}
                      placeholder="Remote / Office Address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dates & Terms Tab */}
          <TabsContent value="dates">
            <Card className="shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Contract Dates & Terms</CardTitle>
                <CardDescription>
                  Important dates and contractual terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contract_start_date">Start Date</Label>
                    <Input
                      id="contract_start_date"
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => handleInputChange('contract_start_date', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contract_end_date">End Date</Label>
                    <Input
                      id="contract_end_date"
                      type="date"
                      value={formData.contract_end_date}
                      onChange={(e) => handleInputChange('contract_end_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_type">Contract Type</Label>
                  <Select value={formData.contract_type} onValueChange={(value) => handleInputChange('contract_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="special_terms">Special Terms
                    <span className="ml-1 text-gray-400 cursor-pointer" title="Any special terms or conditions for this contract.">?</span>
                  </Label>
                  <Textarea
                    id="special_terms"
                    value={formData.special_terms}
                    onChange={(e) => handleInputChange('special_terms', e.target.value)}
                    placeholder="Any special terms or conditions..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card className="shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle>Contract Documents</CardTitle>
                <CardDescription>
                  Links to contract documents and files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_doc_url">Google Document URL</Label>
                    <Input
                      id="google_doc_url"
                      type="url"
                      value={formData.google_doc_url}
                      onChange={(e) => handleInputChange('google_doc_url', e.target.value)}
                      placeholder="https://docs.google.com/document/..."
                    />
                    {formData.google_doc_url && (
                      <p className="text-sm text-gray-500">
                        <a href={formData.google_doc_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View document →
                        </a>
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pdf_url">PDF Document URL</Label>
                    <Input
                      id="pdf_url"
                      type="url"
                      value={formData.pdf_url}
                      onChange={(e) => handleInputChange('pdf_url', e.target.value)}
                      placeholder="https://example.com/contract.pdf"
                    />
                    {formData.pdf_url && (
                      <p className="text-sm text-gray-500">
                        <a href={formData.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View PDF →
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Document Management</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        You can update document URLs here. For security, actual file uploads should be handled through your document management system.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Action Bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-t-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline">
                <Link href={`/${locale}/contracts/${contractId}`}>
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Cancel
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {hasUnsavedChanges ? (
                <Badge variant="destructive" className="text-xs">
                  Unsaved changes
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  All changes saved
                </Badge>
              )}
              <Button 
                onClick={handleSave} 
                disabled={saving || !hasUnsavedChanges}
                size="lg"
                className={hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                {saving ? (
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="mr-2 h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AuthenticatedLayout>
  )
}
