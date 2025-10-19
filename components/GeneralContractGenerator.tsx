'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Users,
  Building,
  User,
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Briefcase,
  MapPin,
  Clock,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface Promoter {
  id: string;
  name_en: string;
  name_ar: string;
  mobile_number: string | null;
  id_card_number: string;
  employer_id?: string | null;
  status?: string;
  profile_picture_url?: string | null;
}

interface Party {
  id: string;
  name_en: string;
  name_ar: string;
  crn: string;
  logo_url?: string | null;
  status?: string;
}

interface GeneralContractFormData {
  promoter_id: string;
  first_party_id: string;
  second_party_id: string;
  contract_type: string;
  job_title: string;
  department: string;
  work_location: string;
  basic_salary: number;
  contract_start_date: string;
  contract_end_date: string;
  special_terms: string;
  probation_period: string;
  notice_period: string;
  working_hours: string;
  housing_allowance?: number;
  transport_allowance?: number;
  // Additional fields for general contracts
  product_name?: string;
  service_description?: string;
  project_duration?: string;
  deliverables?: string;
  payment_terms?: string;
  termination_clause?: string;
  confidentiality_clause?: string;
  intellectual_property?: string;
  liability_insurance?: string;
  force_majeure?: string;
}

export default function GeneralContractGenerator() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [allParties, setAllParties] = useState<Party[]>([]);
  const [clients, setClients] = useState<Party[]>([]);
  const [employers, setEmployers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [allPromoters, setAllPromoters] = useState<Promoter[]>([]);
  const [promoterSearchTerm, setPromoterSearchTerm] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formData, setFormData] = useState<GeneralContractFormData>({
    promoter_id: '',
    first_party_id: '',
    second_party_id: '',
    contract_type: 'general-service',
    job_title: '',
    department: '',
    work_location: '',
    basic_salary: 0,
    contract_start_date: '',
    contract_end_date: '',
    special_terms: '',
    probation_period: '3_months',
    notice_period: '30_days',
    working_hours: '40_hours',
    housing_allowance: 0,
    transport_allowance: 0,
    product_name: '',
    service_description: '',
    project_duration: '',
    deliverables: '',
    payment_terms: '',
    termination_clause: '',
    confidentiality_clause: '',
    intellectual_property: '',
    liability_insurance: '',
    force_majeure: '',
  });
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadData();
    loadSavedDraft();
  }, []);

  const contractTypes = [
    { value: 'general-service', label: 'General Service Contract' },
    { value: 'consulting-agreement', label: 'Consulting Agreement' },
    { value: 'service-contract', label: 'Service Contract' },
    { value: 'partnership-agreement', label: 'Partnership Agreement' },
    { value: 'vendor-agreement', label: 'Vendor Agreement' },
    { value: 'maintenance-contract', label: 'Maintenance Contract' },
    { value: 'supply-agreement', label: 'Supply Agreement' },
    { value: 'distribution-agreement', label: 'Distribution Agreement' },
    { value: 'franchise-agreement', label: 'Franchise Agreement' },
    { value: 'licensing-agreement', label: 'Licensing Agreement' },
  ];

  // Load saved draft from localStorage
  const loadSavedDraft = () => {
    try {
      const savedDraft = localStorage.getItem('general-contract-form-draft');
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
        setLastSaved(new Date());
        toast({
          title: 'Draft Restored',
          description: 'Your previous form data has been restored.',
        });
      }
    } catch (error) {
      console.error('Error loading saved draft:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      // Load all parties first
      const { data: partiesData, error: partiesError } = await supabase
        .from('parties')
        .select('id, name_en, name_ar, crn, type, logo_url, status')
        .order('name_en');

      if (partiesError) {
        console.error('Error loading parties:', partiesError);
        throw new Error(`Failed to load parties: ${partiesError.message}`);
      }

      // Filter parties by type
      const allPartiesList = partiesData || [];
      const clientsList = allPartiesList.filter((party: any) => party.type === 'Client');
      const employersList = allPartiesList.filter((party: any) => party.type === 'Employer');

      setAllParties(allPartiesList);
      setClients(clientsList);
      setEmployers(employersList);

      // Load promoters
      const { data: promotersData, error: promotersError } = await supabase
        .from('promoters')
        .select('id, name_en, name_ar, mobile_number, id_card_number, employer_id, status, profile_picture_url')
        .order('name_en');

      if (promotersError) {
        console.error('Error loading promoters:', promotersError);
        throw new Error(`Failed to load promoters: ${promotersError.message}`);
      }

      setPromoters(promotersData || []);
      setAllPromoters(promotersData || []);
      
      console.log(`✅ Loaded ${promotersData?.length || 0} promoters, ${clientsList.length} clients, ${employersList.length} employers`);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load promoters and parties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof GeneralContractFormData, value: string | number) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // If employer (second_party_id) changes, clear the promoter selection
      if (field === 'second_party_id') {
        newData.promoter_id = '';
      }

      // Auto-save to localStorage
      localStorage.setItem('general-contract-form-draft', JSON.stringify(newData));
      setLastSaved(new Date());

      return newData;
    });
  };

  // Get promoters filtered by selected employer and search term
  const getFilteredPromoters = () => {
    let filteredPromoters = allPromoters;

    // Filter by employer if selected
    if (formData.second_party_id) {
      filteredPromoters = allPromoters.filter((promoter: any) => {
        if (promoter.employer_id === undefined) {
          return true; // Show all promoters if employer_id column doesn't exist
        }
        return promoter.employer_id === formData.second_party_id;
      });
    }
    
    // Filter by search term if provided
    if (promoterSearchTerm.trim()) {
      const searchLower = promoterSearchTerm.toLowerCase();
      filteredPromoters = filteredPromoters.filter((promoter: any) => {
        return (
          promoter.name_en.toLowerCase().includes(searchLower) ||
          promoter.name_ar.toLowerCase().includes(searchLower) ||
          promoter.mobile_number?.toLowerCase().includes(searchLower) ||
          promoter.id_card_number.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return filteredPromoters;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.promoter_id) errors.push('Please select a promoter');
    if (!formData.first_party_id) errors.push('Please select the first party (client)');
    if (!formData.second_party_id) errors.push('Please select the second party (employer)');
    if (!formData.job_title) errors.push('Job title is required');
    if (!formData.department) errors.push('Department is required');
    if (!formData.work_location) errors.push('Work location is required');
    if (!formData.basic_salary || formData.basic_salary <= 0) errors.push('Basic salary must be greater than 0');
    if (!formData.contract_start_date) errors.push('Contract start date is required');
    if (!formData.contract_end_date) errors.push('Contract end date is required');
    
    return errors;
  };

  const handleGenerateContract = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      // Use the general contract generation API endpoint
      const response = await fetch('/api/contracts/general/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_type: formData.contract_type,
          promoter_id: formData.promoter_id,
          first_party_id: formData.first_party_id,
          second_party_id: formData.second_party_id,
          job_title: formData.job_title,
          department: formData.department,
          work_location: formData.work_location,
          basic_salary: formData.basic_salary,
          contract_start_date: formData.contract_start_date,
          contract_end_date: formData.contract_end_date,
          special_terms: formData.special_terms,
          probation_period: formData.probation_period,
          notice_period: formData.notice_period,
          working_hours: formData.working_hours,
          housing_allowance: formData.housing_allowance,
          transport_allowance: formData.transport_allowance,
          product_name: formData.product_name,
          service_description: formData.service_description,
          project_duration: formData.project_duration,
          deliverables: formData.deliverables,
          payment_terms: formData.payment_terms,
          termination_clause: formData.termination_clause,
          confidentiality_clause: formData.confidentiality_clause,
          intellectual_property: formData.intellectual_property,
          liability_insurance: formData.liability_insurance,
          force_majeure: formData.force_majeure,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate contract');
      }

      if (result.success) {
        toast({
          title: 'Success!',
          description: 'General contract generated successfully',
        });

        // Show success message with links
        if (result.contract_id) {
          setTimeout(() => {
            toast({
              title: 'Contract Ready!',
              description: `Contract ID: ${result.contract_id} - Processing with Make.com...`,
              variant: 'default',
            });
          }, 1000);
        }
        
        // Clear saved draft
        localStorage.removeItem('general-contract-form-draft');
        setLastSaved(null);
        
        // Reset form
        setFormData({
          promoter_id: '',
          first_party_id: '',
          second_party_id: '',
          contract_type: 'general-service',
          job_title: '',
          department: '',
          work_location: '',
          basic_salary: 0,
          contract_start_date: '',
          contract_end_date: '',
          special_terms: '',
          probation_period: '3_months',
          notice_period: '30_days',
          working_hours: '40_hours',
          housing_allowance: 0,
          transport_allowance: 0,
          product_name: '',
          service_description: '',
          project_duration: '',
          deliverables: '',
          payment_terms: '',
          termination_clause: '',
          confidentiality_clause: '',
          intellectual_property: '',
          liability_insurance: '',
          force_majeure: '',
        });
      } else {
        throw new Error(result.error || 'Contract generation failed');
      }
    } catch (error) {
      console.error('Contract generation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate contract',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading promoters and parties...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }

  // Handle case where no data is loaded
  if (promoters.length === 0 || allParties.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Generate General Contract</h1>
          <p className="text-muted-foreground">
            Create professional general contracts with automated processing
          </p>
        </div>
        
        <div className="text-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
            <p className="text-muted-foreground mb-4">
              {promoters.length === 0 && allParties.length === 0 
                ? "No promoters or parties found. Please add some data first."
                : promoters.length === 0 
                ? "No promoters found. Please add some promoters first."
                : "No parties found. Please add some parties first."
              }
            </p>
            <Button onClick={() => {
              setLoading(true);
              loadData();
            }} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Generate General Contract</h1>
        <p className="text-muted-foreground">
          Create professional general contracts with automated processing via Make.com
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            General Contract Details
          </CardTitle>
          <CardDescription>
            Fill in the required information to generate your general contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Parties */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Parties
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> 
                <br />• <strong>First Party</strong> shows only <strong>Client</strong> type parties
                <br />• <strong>Second Party</strong> shows only <strong>Employer</strong> type parties  
                <br />• <strong>Promoters</strong> are filtered by selected employer
                <br />• <strong>Auto-save</strong> is enabled - your progress is saved automatically
              </p>
            </div>
            
            {/* Auto-save status indicator */}
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2">
                <CheckCircle className="h-4 w-4" />
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Promoter Selection */}
              <div className="space-y-2">
                <Label htmlFor="promoter">Promoter *</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Search promoters..."
                    value={promoterSearchTerm}
                    onChange={(e) => setPromoterSearchTerm(e.target.value)}
                    className="text-sm"
                  />
                  <Select
                    value={formData.promoter_id}
                    onValueChange={(value) => handleInputChange('promoter_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select promoter" />
                    </SelectTrigger>
                    <SelectContent>
                    {getFilteredPromoters().map((promoter) => (
                      <SelectItem key={promoter.id} value={promoter.id}>
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-shrink-0">
                            {promoter.profile_picture_url ? (
                              <img 
                                src={promoter.profile_picture_url} 
                                alt={promoter.name_en}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{promoter.name_en}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {promoter.mobile_number || 'No phone'}
                            </div>
                            {promoter.status && (
                              <div className="text-xs">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  promoter.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {promoter.status}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                      {getFilteredPromoters().length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          {formData.second_party_id 
                            ? "No promoters found for this employer. All promoters are shown until employer relationships are set up." 
                            : "Please select an employer first"
                          }
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* First Party Selection (Client) */}
              <div className="space-y-2">
                <Label htmlFor="first_party">First Party (Client) *</Label>
                <Select
                  value={formData.first_party_id}
                  onValueChange={(value) => handleInputChange('first_party_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{party.name_en}</div>
                            <div className="text-sm text-muted-foreground">
                              CRN: {party.crn}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {clients.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">
                        No clients found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Second Party Selection (Employer) */}
              <div className="space-y-2">
                <Label htmlFor="second_party">Second Party (Employer) *</Label>
                <Select
                  value={formData.second_party_id}
                  onValueChange={(value) => handleInputChange('second_party_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employer" />
                  </SelectTrigger>
                  <SelectContent>
                    {employers.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{party.name_en}</div>
                            <div className="text-sm text-muted-foreground">
                              CRN: {party.crn}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {employers.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">
                        No employers found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Step 2: Contract Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contract Type */}
              <div className="space-y-2">
                <Label htmlFor="contract_type">Contract Type *</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={(value) => handleInputChange('contract_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => handleInputChange('job_title', e.target.value)}
                  placeholder="e.g., Software Engineer"
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="e.g., IT Department"
                />
              </div>

              {/* Work Location */}
              <div className="space-y-2">
                <Label htmlFor="work_location">Work Location *</Label>
                <Input
                  id="work_location"
                  value={formData.work_location}
                  onChange={(e) => handleInputChange('work_location', e.target.value)}
                  placeholder="e.g., Muscat, Oman"
                />
              </div>

              {/* Basic Salary */}
              <div className="space-y-2">
                <Label htmlFor="basic_salary">Basic Salary (OMR) *</Label>
                <Input
                  id="basic_salary"
                  type="number"
                  value={formData.basic_salary}
                  onChange={(e) => handleInputChange('basic_salary', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              {/* Contract Dates */}
              <div className="space-y-2">
                <Label htmlFor="contract_start_date">Start Date *</Label>
                <Input
                  id="contract_start_date"
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => handleInputChange('contract_start_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_end_date">End Date *</Label>
                <Input
                  id="contract_end_date"
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => handleInputChange('contract_end_date', e.target.value)}
                />
              </div>

              {/* Probation Period */}
              <div className="space-y-2">
                <Label htmlFor="probation_period">Probation Period *</Label>
                <Select
                  value={formData.probation_period}
                  onValueChange={(value) => handleInputChange('probation_period', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select probation period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3_months">3 Months</SelectItem>
                    <SelectItem value="6_months">6 Months</SelectItem>
                    <SelectItem value="12_months">12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notice Period */}
              <div className="space-y-2">
                <Label htmlFor="notice_period">Notice Period *</Label>
                <Select
                  value={formData.notice_period}
                  onValueChange={(value) => handleInputChange('notice_period', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select notice period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30_days">30 Days</SelectItem>
                    <SelectItem value="60_days">60 Days</SelectItem>
                    <SelectItem value="90_days">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Working Hours */}
              <div className="space-y-2">
                <Label htmlFor="working_hours">Working Hours per Week *</Label>
                <Select
                  value={formData.working_hours}
                  onValueChange={(value) => handleInputChange('working_hours', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select working hours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="40_hours">40 Hours/Week</SelectItem>
                    <SelectItem value="45_hours">45 Hours/Week</SelectItem>
                    <SelectItem value="48_hours">48 Hours/Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Housing Allowance */}
              <div className="space-y-2">
                <Label htmlFor="housing_allowance">Housing Allowance (OMR)</Label>
                <Input
                  id="housing_allowance"
                  type="number"
                  value={formData.housing_allowance || 0}
                  onChange={(e) => handleInputChange('housing_allowance', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              {/* Transportation Allowance */}
              <div className="space-y-2">
                <Label htmlFor="transport_allowance">Transportation Allowance (OMR)</Label>
                <Input
                  id="transport_allowance"
                  type="number"
                  value={formData.transport_allowance || 0}
                  onChange={(e) => handleInputChange('transport_allowance', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Step 3: General Contract Specific Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              General Contract Specific Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="product_name">Product/Service Name</Label>
                <Input
                  id="product_name"
                  value={formData.product_name || ''}
                  onChange={(e) => handleInputChange('product_name', e.target.value)}
                  placeholder="e.g., Software Development Services"
                />
              </div>

              {/* Project Duration */}
              <div className="space-y-2">
                <Label htmlFor="project_duration">Project Duration</Label>
                <Input
                  id="project_duration"
                  value={formData.project_duration || ''}
                  onChange={(e) => handleInputChange('project_duration', e.target.value)}
                  placeholder="e.g., 6 months"
                />
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms || ''}
                  onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                  placeholder="e.g., Net 30 days"
                />
              </div>

              {/* Liability Insurance */}
              <div className="space-y-2">
                <Label htmlFor="liability_insurance">Liability Insurance</Label>
                <Input
                  id="liability_insurance"
                  value={formData.liability_insurance || ''}
                  onChange={(e) => handleInputChange('liability_insurance', e.target.value)}
                  placeholder="e.g., $1,000,000 coverage"
                />
              </div>
            </div>

            {/* Service Description */}
            <div className="space-y-2">
              <Label htmlFor="service_description">Service Description</Label>
              <Textarea
                id="service_description"
                value={formData.service_description || ''}
                onChange={(e) => handleInputChange('service_description', e.target.value)}
                placeholder="Detailed description of the services to be provided..."
                rows={3}
              />
            </div>

            {/* Deliverables */}
            <div className="space-y-2">
              <Label htmlFor="deliverables">Deliverables</Label>
              <Textarea
                id="deliverables"
                value={formData.deliverables || ''}
                onChange={(e) => handleInputChange('deliverables', e.target.value)}
                placeholder="List of specific deliverables and milestones..."
                rows={3}
              />
            </div>

            {/* Termination Clause */}
            <div className="space-y-2">
              <Label htmlFor="termination_clause">Termination Clause</Label>
              <Textarea
                id="termination_clause"
                value={formData.termination_clause || ''}
                onChange={(e) => handleInputChange('termination_clause', e.target.value)}
                placeholder="Terms and conditions for contract termination..."
                rows={2}
              />
            </div>

            {/* Confidentiality Clause */}
            <div className="space-y-2">
              <Label htmlFor="confidentiality_clause">Confidentiality Clause</Label>
              <Textarea
                id="confidentiality_clause"
                value={formData.confidentiality_clause || ''}
                onChange={(e) => handleInputChange('confidentiality_clause', e.target.value)}
                placeholder="Confidentiality and non-disclosure terms..."
                rows={2}
              />
            </div>

            {/* Intellectual Property */}
            <div className="space-y-2">
              <Label htmlFor="intellectual_property">Intellectual Property</Label>
              <Textarea
                id="intellectual_property"
                value={formData.intellectual_property || ''}
                onChange={(e) => handleInputChange('intellectual_property', e.target.value)}
                placeholder="Intellectual property rights and ownership terms..."
                rows={2}
              />
            </div>

            {/* Force Majeure */}
            <div className="space-y-2">
              <Label htmlFor="force_majeure">Force Majeure</Label>
              <Textarea
                id="force_majeure"
                value={formData.force_majeure || ''}
                onChange={(e) => handleInputChange('force_majeure', e.target.value)}
                placeholder="Force majeure and act of God clauses..."
                rows={2}
              />
            </div>

            {/* Special Terms */}
            <div className="space-y-2">
              <Label htmlFor="special_terms">Special Terms</Label>
              <Textarea
                id="special_terms"
                value={formData.special_terms}
                onChange={(e) => handleInputChange('special_terms', e.target.value)}
                placeholder="Any special terms or conditions..."
                rows={3}
              />
            </div>
          </div>

          {/* Contract Summary */}
          {(formData.contract_start_date || formData.contract_end_date) && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Contract Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {formData.contract_start_date && (
                  <div>
                    <span className="font-medium text-blue-800 dark:text-blue-200">Start Date:</span>
                    <span className="ml-2 text-blue-700 dark:text-blue-300">
                      {format(parseISO(formData.contract_start_date), 'dd-MM-yyyy')}
                    </span>
                  </div>
                )}
                {formData.contract_end_date && (
                  <div>
                    <span className="font-medium text-blue-800 dark:text-blue-200">End Date:</span>
                    <span className="ml-2 text-blue-700 dark:text-blue-300">
                      {format(parseISO(formData.contract_end_date), 'dd-MM-yyyy')}
                    </span>
                  </div>
                )}
                {formData.contract_start_date && formData.contract_end_date && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-blue-800 dark:text-blue-200">Duration:</span>
                    <span className="ml-2 text-blue-700 dark:text-blue-300">
                      {format(parseISO(formData.contract_start_date), 'dd-MM-yyyy')} to {format(parseISO(formData.contract_end_date), 'dd-MM-yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleGenerateContract}
              disabled={generating}
              size="lg"
              className="min-w-[200px]"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate General Contract
                </>
              )}
            </Button>
          </div>

          {/* Info Alert */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This will create a general contract in the database and trigger the Make.com automation 
              to generate a professional PDF document with all required signatures and stamps using the general contract template.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
