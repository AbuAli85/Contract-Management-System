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

interface ContractFormData {
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
}

export default function SimpleContractGenerator() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [allParties, setAllParties] = useState<Party[]>([]);
  const [clients, setClients] = useState<Party[]>([]);
  const [employers, setEmployers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [allPromoters, setAllPromoters] = useState<Promoter[]>([]);
  const [promoterSearchTerm, setPromoterSearchTerm] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formData, setFormData] = useState<ContractFormData>({
    promoter_id: '',
    first_party_id: '',
    second_party_id: '',
    contract_type: 'full-time-permanent',
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
  });
  const { toast } = useToast();

  const contractTypes = [
    { value: 'full-time-permanent', label: 'Full-Time Permanent Employment' },
    { value: 'part-time-contract', label: 'Part-Time Contract' },
    { value: 'fixed-term-contract', label: 'Fixed-Term Contract' },
    { value: 'consulting-agreement', label: 'Consulting Agreement' },
    { value: 'service-contract', label: 'Service Contract' },
  ];

  // Load saved draft from localStorage
  const loadSavedDraft = () => {
    try {
      const savedDraft = localStorage.getItem('contract-form-draft');
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

  useEffect(() => {
    loadData();
    loadSavedDraft();
  }, []);

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
        .select('id, name_en, name_ar, crn, type')
        .order('name_en');

      if (partiesError) {
        console.error('Error loading parties:', partiesError);
        throw new Error(`Failed to load parties: ${partiesError.message}`);
      }

      // Filter parties by type
      const allPartiesList = partiesData || [];
      const clientsList = allPartiesList.filter(
        (party: any) => party.type === 'Client'
      );
      const employersList = allPartiesList.filter(
        (party: any) => party.type === 'Employer'
      );

      setAllParties(allPartiesList);
      setClients(clientsList);
      setEmployers(employersList);

      // Load promoters
      const { data: promotersData, error: promotersError } = await supabase
        .from('promoters')
        .select(
          'id, name_en, name_ar, mobile_number, id_card_number, employer_id, status, profile_picture_url'
        )
        .order('name_en');

      if (promotersError) {
        console.error('Error loading promoters:', promotersError);
        throw new Error(`Failed to load promoters: ${promotersError.message}`);
      }

      setPromoters(promotersData || []);
      setAllPromoters(promotersData || []);

      console.log(
        `✅ Loaded ${promotersData?.length || 0} promoters, ${clientsList.length} clients, ${employersList.length} employers`
      );
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to load promoters and parties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof ContractFormData,
    value: string | number
  ) => {
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
      localStorage.setItem('contract-form-draft', JSON.stringify(newData));
      setLastSaved(new Date());

      return newData;
    });
  };

  // Get promoters filtered by selected employer and search term
  const getFilteredPromoters = () => {
    console.log('🔍 Filtering promoters:', {
      selectedEmployer: formData.second_party_id,
      searchTerm: promoterSearchTerm,
      totalPromoters: allPromoters.length,
      firstPromoter: allPromoters[0]
        ? {
            id: allPromoters[0].id,
            name: allPromoters[0].name_en,
            employer_id: allPromoters[0].employer_id,
          }
        : null,
    });

    let filteredPromoters = allPromoters;

    // Filter by employer if selected
    if (formData.second_party_id) {
      filteredPromoters = allPromoters.filter((promoter: any) => {
        // If employer_id doesn't exist on promoter object, show all promoters
        if (promoter.employer_id === undefined) {
          console.log(
            '⚠️ employer_id not found on promoter, showing all promoters'
          );
          return true; // Show all promoters if employer_id column doesn't exist
        }
        // If employer_id exists, filter by it
        const matches = promoter.employer_id === formData.second_party_id;
        return matches;
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

    console.log(
      `✅ Filtered promoters: ${filteredPromoters.length} out of ${allPromoters.length}`
    );
    return filteredPromoters;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.promoter_id) errors.push('Please select a promoter');
    if (!formData.first_party_id)
      errors.push('Please select the first party (employer)');
    if (!formData.second_party_id)
      errors.push('Please select the second party (client)');
    if (!formData.job_title) errors.push('Job title is required');
    if (!formData.department) errors.push('Department is required');
    if (!formData.work_location) errors.push('Work location is required');
    if (!formData.basic_salary || formData.basic_salary <= 0)
      errors.push('Basic salary must be greater than 0');
    if (!formData.contract_start_date)
      errors.push('Contract start date is required');
    if (!formData.contract_end_date)
      errors.push('Contract end date is required');

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
      // Try multiple generation methods
      let response;
      let generationMethod = 'html'; // Default to HTML generation

      // First try Make.com integration (recommended)
      try {
        response = await fetch('/api/contracts/makecom/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractType: formData.contract_type,
            contractData: formData,
            triggerMakecom: true,
          }),
        });

        if (response.ok) {
          generationMethod = 'makecom';
        } else {
          throw new Error('Make.com integration not available');
        }
      } catch (makecomError) {
        console.log(
          'Make.com integration not available, trying alternative methods...'
        );

        // Try HTML generation
        try {
          response = await fetch('/api/contracts/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...formData,
              generation_method: 'html',
            }),
          });
          generationMethod = 'html';
        } catch (htmlError) {
          // Try Make.com as fallback
          response = await fetch('/api/contracts/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...formData,
              generation_method: 'makecom',
            }),
          });
          generationMethod = 'makecom';
        }
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate contract');
      }

      if (result.success) {
        // Enhanced success message with Make.com status
        let successMessage = `Contract generated successfully using ${generationMethod} method`;
        
        if (generationMethod === 'makecom' && result.data?.makecom) {
          const makecom = result.data.makecom;
          if (makecom.success) {
            successMessage += ' - Make.com webhook triggered successfully!';
            if (result.data.google_drive_url) {
              successMessage += ` Check your Google Drive: ${result.data.google_drive_url}`;
            }
          } else {
            successMessage += ` - Make.com webhook failed: ${makecom.error || 'Unknown error'}`;
          }
        }

        toast({
          title: 'Success!',
          description: successMessage,
        });

        // Log detailed response for debugging
        console.log('📊 Contract generation response:', {
          method: generationMethod,
          contract: result.data?.contract,
          makecom: result.data?.makecom,
          google_drive_url: result.data?.google_drive_url,
        });

        // Show success message with links
        if (result.data) {
          setTimeout(() => {
            toast({
              title: 'Contract Ready!',
              description: `Document: ${result.data.document_url || 'Processing...'}`,
              variant: 'default',
            });
          }, 1000);
        }

        // Clear saved draft
        localStorage.removeItem('contract-form-draft');
        setLastSaved(null);

        // Reset form
        setFormData({
          promoter_id: '',
          first_party_id: '',
          second_party_id: '',
          contract_type: 'full-time-permanent',
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
        });
      } else {
        throw new Error(result.error || 'Contract generation failed');
      }
    } catch (error) {
      console.error('Contract generation error:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate contract',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateContractNumber = (): string => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `PAC-${day}${month}${year}-${random}`;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p>Loading promoters and parties...</p>
          <p className='text-sm text-muted-foreground mt-2'>
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }

  // Handle case where no data is loaded
  if (promoters.length === 0 || allParties.length === 0) {
    return (
      <div className='max-w-4xl mx-auto space-y-6'>
        <div className='text-center space-y-2'>
          <h1 className='text-3xl font-bold'>Generate Contract</h1>
          <p className='text-muted-foreground'>
            Create professional contracts with automated processing
          </p>
        </div>

        <div className='text-center py-12'>
          <div className='text-center'>
            <AlertTriangle className='h-12 w-12 mx-auto mb-4 text-yellow-500' />
            <h2 className='text-xl font-semibold mb-2'>No Data Available</h2>
            <p className='text-muted-foreground mb-4'>
              {promoters.length === 0 && allParties.length === 0
                ? 'No promoters or parties found. Please add some data first.'
                : promoters.length === 0
                  ? 'No promoters found. Please add some promoters first.'
                  : 'No parties found. Please add some parties first.'}
            </p>
            <Button
              onClick={() => {
                setLoading(true);
                loadData();
              }}
              variant='outline'
            >
              <RefreshCw className='h-4 w-4 mr-2' />
              Retry Loading Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold'>Generate Contract</h1>
        <p className='text-muted-foreground'>
          Create professional contracts with automated processing
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Contract Details
          </CardTitle>
          <CardDescription>
            Fill in the required information to generate your contract
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Step 1: Select Parties */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Select Parties
            </h3>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
              <p className='text-sm text-blue-800'>
                <strong>Note:</strong>
                <br />• <strong>First Party</strong> shows only{' '}
                <strong>Client</strong> type parties
                <br />• <strong>Second Party</strong> shows only{' '}
                <strong>Employer</strong> type parties
                <br />• <strong>Promoters</strong> are filtered by selected
                employer
                <br />• <strong>Auto-save</strong> is enabled - your progress is
                saved automatically
              </p>
            </div>

            {/* Auto-save status indicator */}
            {lastSaved && (
              <div className='flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2'>
                <CheckCircle className='h-4 w-4' />
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Promoter Selection */}
              <div className='space-y-2'>
                <Label htmlFor='promoter'>Promoter *</Label>
                <div className='space-y-2'>
                  <Input
                    placeholder='Search promoters...'
                    value={promoterSearchTerm}
                    onChange={e => setPromoterSearchTerm(e.target.value)}
                    className='text-sm'
                    disabled={generating}
                  />
                  <Select
                    value={formData.promoter_id}
                    onValueChange={value =>
                      handleInputChange('promoter_id', value)
                    }
                    disabled={generating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select promoter' />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredPromoters().map(promoter => (
                        <SelectItem key={promoter.id} value={promoter.id}>
                          <div className='flex items-center gap-3 w-full'>
                            <div className='flex-shrink-0'>
                              {promoter.profile_picture_url ? (
                                <img
                                  src={promoter.profile_picture_url}
                                  alt={promoter.name_en}
                                  className='w-8 h-8 rounded-full object-cover'
                                />
                              ) : (
                                <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center'>
                                  <User className='h-4 w-4 text-blue-600' />
                                </div>
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium text-sm truncate'>
                                {promoter.name_en}
                              </div>
                              <div className='text-xs text-muted-foreground truncate'>
                                {promoter.mobile_number || 'No phone'}
                              </div>
                              {promoter.status && (
                                <div className='text-xs'>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                      promoter.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {promoter.status}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                      {getFilteredPromoters().length === 0 && (
                        <div className='p-2 text-sm text-muted-foreground'>
                          {formData.second_party_id
                            ? 'No promoters found for this employer. All promoters are shown until employer relationships are set up.'
                            : 'Please select an employer first'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* First Party Selection (Client) */}
              <div className='space-y-2'>
                <Label htmlFor='first_party'>First Party (Client) *</Label>
                <Select
                  value={formData.first_party_id}
                  onValueChange={value =>
                    handleInputChange('first_party_id', value)
                  }
                  disabled={generating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select client' />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(party => (
                      <SelectItem key={party.id} value={party.id}>
                        <div className='flex items-center gap-2'>
                          <Building className='h-4 w-4' />
                          <div>
                            <div className='font-medium'>{party.name_en}</div>
                            <div className='text-sm text-muted-foreground'>
                              CRN: {party.crn}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {clients.length === 0 && (
                      <div className='p-2 text-sm text-muted-foreground'>
                        No clients found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Second Party Selection (Employer) */}
              <div className='space-y-2'>
                <Label htmlFor='second_party'>Second Party (Employer) *</Label>
                <Select
                  value={formData.second_party_id}
                  onValueChange={value =>
                    handleInputChange('second_party_id', value)
                  }
                  disabled={generating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select employer' />
                  </SelectTrigger>
                  <SelectContent>
                    {employers.map(party => (
                      <SelectItem key={party.id} value={party.id}>
                        <div className='flex items-center gap-2'>
                          <Building className='h-4 w-4' />
                          <div>
                            <div className='font-medium'>{party.name_en}</div>
                            <div className='text-sm text-muted-foreground'>
                              CRN: {party.crn}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {employers.length === 0 && (
                      <div className='p-2 text-sm text-muted-foreground'>
                        No employers found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Step 2: Contract Details */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold flex items-center gap-2'>
              <FileText className='h-5 w-5' />
              Contract Details
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Contract Type */}
              <div className='space-y-2'>
                <Label htmlFor='contract_type'>Contract Type *</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={value =>
                    handleInputChange('contract_type', value)
                  }
                  disabled={generating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select contract type' />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Job Title */}
              <div className='space-y-2'>
                <Label htmlFor='job_title'>Job Title *</Label>
                <Input
                  id='job_title'
                  value={formData.job_title}
                  onChange={e => handleInputChange('job_title', e.target.value)}
                  placeholder='e.g., Software Engineer'
                  disabled={generating}
                />
              </div>

              {/* Department */}
              <div className='space-y-2'>
                <Label htmlFor='department'>Department *</Label>
                <Input
                  id='department'
                  value={formData.department}
                  onChange={e =>
                    handleInputChange('department', e.target.value)
                  }
                  placeholder='e.g., IT Department'
                  disabled={generating}
                />
              </div>

              {/* Work Location */}
              <div className='space-y-2'>
                <Label htmlFor='work_location'>Work Location *</Label>
                <Select
                  value={formData.work_location}
                  onValueChange={value =>
                    handleInputChange('work_location', value)
                  }
                  disabled={generating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select work location' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Extra Os1'>Extra Os1</SelectItem>
                    <SelectItem value='Extra Os2'>Extra Os2</SelectItem>
                    <SelectItem value='Extra Os3'>Extra Os3</SelectItem>
                    <SelectItem value='Extra Os4'>Extra Os4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Salary */}
              <div className='space-y-2'>
                <Label htmlFor='basic_salary'>Basic Salary (OMR) *</Label>
                <Input
                  id='basic_salary'
                  type='number'
                  value={formData.basic_salary}
                  onChange={e =>
                    handleInputChange(
                      'basic_salary',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder='0'
                  disabled={generating}
                />
              </div>

              {/* Contract Dates */}
              <div className='space-y-2'>
                <Label htmlFor='contract_start_date'>Start Date *</Label>
                <Input
                  id='contract_start_date'
                  type='date'
                  value={formData.contract_start_date}
                  onChange={e =>
                    handleInputChange('contract_start_date', e.target.value)
                  }
                  disabled={generating}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='contract_end_date'>End Date *</Label>
                <Input
                  id='contract_end_date'
                  type='date'
                  value={formData.contract_end_date}
                  onChange={e =>
                    handleInputChange('contract_end_date', e.target.value)
                  }
                  disabled={generating}
                />
              </div>

              {/* Probation Period */}
              <div className='space-y-2'>
                <Label htmlFor='probation_period'>Probation Period *</Label>
                <Select
                  value={formData.probation_period}
                  onValueChange={value =>
                    handleInputChange('probation_period', value)
                  }
                  disabled={generating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select probation period' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='3_months'>3 Months</SelectItem>
                    <SelectItem value='6_months'>6 Months</SelectItem>
                    <SelectItem value='12_months'>12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notice Period */}
              <div className='space-y-2'>
                <Label htmlFor='notice_period'>Notice Period *</Label>
                <Select
                  value={formData.notice_period}
                  onValueChange={value =>
                    handleInputChange('notice_period', value)
                  }
                  disabled={generating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select notice period' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='30_days'>30 Days</SelectItem>
                    <SelectItem value='60_days'>60 Days</SelectItem>
                    <SelectItem value='90_days'>90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Working Hours */}
              <div className='space-y-2'>
                <Label htmlFor='working_hours'>Working Hours per Week *</Label>
                <Select
                  value={formData.working_hours}
                  onValueChange={value =>
                    handleInputChange('working_hours', value)
                  }
                  disabled={generating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select working hours' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='40_hours'>40 Hours/Week</SelectItem>
                    <SelectItem value='45_hours'>45 Hours/Week</SelectItem>
                    <SelectItem value='48_hours'>48 Hours/Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Housing Allowance */}
              <div className='space-y-2'>
                <Label htmlFor='housing_allowance'>
                  Housing Allowance (OMR)
                </Label>
                <Input
                  id='housing_allowance'
                  type='number'
                  value={formData.housing_allowance || 0}
                  onChange={e =>
                    handleInputChange(
                      'housing_allowance',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder='0'
                  disabled={generating}
                />
              </div>

              {/* Transportation Allowance */}
              <div className='space-y-2'>
                <Label htmlFor='transport_allowance'>
                  Transportation Allowance (OMR)
                </Label>
                <Input
                  id='transport_allowance'
                  type='number'
                  value={formData.transport_allowance || 0}
                  onChange={e =>
                    handleInputChange(
                      'transport_allowance',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder='0'
                  disabled={generating}
                />
              </div>
            </div>

            {/* Special Terms */}
            <div className='space-y-2'>
              <Label htmlFor='special_terms'>Special Terms</Label>
              <Textarea
                id='special_terms'
                value={formData.special_terms}
                onChange={e =>
                  handleInputChange('special_terms', e.target.value)
                }
                placeholder='Any special terms or conditions...'
                rows={3}
                disabled={generating}
              />
            </div>
          </div>

          {/* Contract Summary */}
          {(formData.contract_start_date || formData.contract_end_date) && (
            <div className='bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
              <h3 className='font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center'>
                <Calendar className='h-4 w-4 mr-2' />
                Contract Summary
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                {formData.contract_start_date && (
                  <div>
                    <span className='font-medium text-blue-800 dark:text-blue-200'>
                      Start Date:
                    </span>
                    <span className='ml-2 text-blue-700 dark:text-blue-300'>
                      {format(
                        parseISO(formData.contract_start_date),
                        'dd-MM-yyyy'
                      )}
                    </span>
                  </div>
                )}
                {formData.contract_end_date && (
                  <div>
                    <span className='font-medium text-blue-800 dark:text-blue-200'>
                      End Date:
                    </span>
                    <span className='ml-2 text-blue-700 dark:text-blue-300'>
                      {format(
                        parseISO(formData.contract_end_date),
                        'dd-MM-yyyy'
                      )}
                    </span>
                  </div>
                )}
                {formData.contract_start_date && formData.contract_end_date && (
                  <div className='md:col-span-2'>
                    <span className='font-medium text-blue-800 dark:text-blue-200'>
                      Duration:
                    </span>
                    <span className='ml-2 text-blue-700 dark:text-blue-300'>
                      {format(
                        parseISO(formData.contract_start_date),
                        'dd-MM-yyyy'
                      )}{' '}
                      to{' '}
                      {format(
                        parseISO(formData.contract_end_date),
                        'dd-MM-yyyy'
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generating Status Message */}
          {generating && (
            <div className='bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
              <div className='flex items-center justify-center gap-3'>
                <Loader2 className='h-5 w-5 animate-spin text-blue-600' />
                <div>
                  <p className='font-medium text-blue-900 dark:text-blue-100'>
                    Generating contract...
                  </p>
                  <p className='text-sm text-blue-700 dark:text-blue-300'>
                    Please wait while we process your request. This may take a few moments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className='flex justify-center pt-4'>
            <Button
              onClick={handleGenerateContract}
              disabled={generating}
              size='lg'
              className='min-w-[200px]'
            >
              {generating ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className='h-4 w-4 mr-2' />
                  Generate Contract
                </>
              )}
            </Button>
          </div>

          {/* Info Alert */}
          <Alert>
            <CheckCircle className='h-4 w-4' />
            <AlertDescription>
              This will create a contract in the database and trigger the
              Make.com automation to generate a professional PDF document with
              all required signatures and stamps.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
