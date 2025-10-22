'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Users,
  Building,
  User,
  Calendar,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { FormFieldWithValidation } from '@/components/ui/form-field-with-validation';
import { SelectFieldWithValidation } from '@/components/ui/select-field-with-validation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  contractFormSchema,
  contractFormDefaults,
  type ContractFormData,
} from '@/lib/schemas/contract-form-schema';

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

export default function SimpleContractGeneratorWithValidation() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [allParties, setAllParties] = useState<Party[]>([]);
  const [clients, setClients] = useState<Party[]>([]);
  const [employers, setEmployers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [allPromoters, setAllPromoters] = useState<Promoter[]>([]);
  const [promoterSearchTerm, setPromoterSearchTerm] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  // Initialize react-hook-form with zod validation
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, dirtyFields },
    reset,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: contractFormDefaults,
    mode: 'onChange', // Validate on change for real-time feedback
  });

  const watchedFields = watch();

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
        reset(parsedDraft);
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

  // Auto-save form data
  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem('contract-form-draft', JSON.stringify(data));
      setLastSaved(new Date());
    });
    return () => subscription.unsubscribe();
  }, [watch]);

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

  // Get promoters filtered by selected employer and search term
  const getFilteredPromoters = () => {
    let filteredPromoters = allPromoters;

    // Filter by employer if selected
    if (watchedFields.second_party_id) {
      filteredPromoters = allPromoters.filter((promoter: any) => {
        if (promoter.employer_id === undefined) {
          return true;
        }
        return promoter.employer_id === watchedFields.second_party_id;
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

  const onSubmit = async (data: ContractFormData) => {
    setGenerating(true);
    try {
      // Try multiple generation methods
      let response;
      let generationMethod = 'html';

      // First try Make.com integration
      try {
        response = await fetch('/api/contracts/makecom/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractType: data.contract_type,
            contractData: data,
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
        response = await fetch('/api/contracts/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            generation_method: 'html',
          }),
        });
        generationMethod = 'html';
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

        // Clear saved draft
        localStorage.removeItem('contract-form-draft');
        setLastSaved(null);

        // Reset form
        reset(contractFormDefaults);
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
      <form onSubmit={handleSubmit(onSubmit)}>
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
            {/* Auto-save status indicator */}
            {lastSaved && (
              <div className='flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2'>
                <CheckCircle className='h-4 w-4' />
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}

            {/* Step 1: Select Parties */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Select Parties
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Promoter Selection */}
                <div className='space-y-2'>
                  <Label htmlFor='promoter'>
                    Promoter <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    placeholder='Search promoters...'
                    value={promoterSearchTerm}
                    onChange={e => setPromoterSearchTerm(e.target.value)}
                    className='text-sm mb-2'
                    disabled={generating}
                  />
                  <Controller
                    name='promoter_id'
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={generating}
                      >
                        <SelectTrigger
                          className={errors.promoter_id ? 'border-red-500' : ''}
                        >
                          <SelectValue placeholder='Select promoter' />
                        </SelectTrigger>
                        <SelectContent>
                          {getFilteredPromoters().map(promoter => (
                            <SelectItem key={promoter.id} value={promoter.id}>
                              <div className='flex items-center gap-2'>
                                {promoter.profile_picture_url ? (
                                  <img
                                    src={promoter.profile_picture_url}
                                    alt={promoter.name_en}
                                    className='w-6 h-6 rounded-full object-cover'
                                  />
                                ) : (
                                  <div className='w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center'>
                                    <User className='h-3 w-3 text-blue-600' />
                                  </div>
                                )}
                                <span>{promoter.name_en}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.promoter_id && (
                    <p className='text-sm text-red-500'>
                      {errors.promoter_id.message}
                    </p>
                  )}
                </div>

                {/* First Party (Client) */}
                <Controller
                  name='first_party_id'
                  control={control}
                  render={({ field }) => (
                    <SelectFieldWithValidation
                      label='First Party (Client)'
                      name='first_party_id'
                      value={field.value}
                      onChange={field.onChange}
                      options={clients.map(c => ({
                        value: c.id,
                        label: `${c.name_en} (${c.crn})`,
                      }))}
                      error={errors.first_party_id}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.first_party_id && !errors.first_party_id}
                    />
                  )}
                />

                {/* Second Party (Employer) */}
                <Controller
                  name='second_party_id'
                  control={control}
                  render={({ field }) => (
                    <SelectFieldWithValidation
                      label='Second Party (Employer)'
                      name='second_party_id'
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        setValue('promoter_id', ''); // Clear promoter when employer changes
                      }}
                      options={employers.map(e => ({
                        value: e.id,
                        label: `${e.name_en} (${e.crn})`,
                      }))}
                      error={errors.second_party_id}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.second_party_id && !errors.second_party_id}
                    />
                  )}
                />
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
                <Controller
                  name='contract_type'
                  control={control}
                  render={({ field }) => (
                    <SelectFieldWithValidation
                      label='Contract Type'
                      name='contract_type'
                      value={field.value}
                      onChange={field.onChange}
                      options={contractTypes}
                      error={errors.contract_type}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.contract_type && !errors.contract_type}
                    />
                  )}
                />

                {/* Job Title */}
                <Controller
                  name='job_title'
                  control={control}
                  render={({ field }) => (
                    <FormFieldWithValidation
                      label='Job Title'
                      name='job_title'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.job_title}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.job_title && !errors.job_title}
                      placeholder='e.g., Software Engineer'
                    />
                  )}
                />

                {/* Department */}
                <Controller
                  name='department'
                  control={control}
                  render={({ field }) => (
                    <FormFieldWithValidation
                      label='Department'
                      name='department'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.department}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.department && !errors.department}
                      placeholder='e.g., IT Department'
                    />
                  )}
                />

                {/* Work Location */}
                <Controller
                  name='work_location'
                  control={control}
                  render={({ field }) => (
                    <SelectFieldWithValidation
                      label='Work Location'
                      name='work_location'
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.work_location}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.work_location && !errors.work_location}
                      placeholder='Select work location'
                      options={[
                        { value: 'Extra Os1', label: 'Extra Os1' },
                        { value: 'Extra Os2', label: 'Extra Os2' },
                        { value: 'Extra Os3', label: 'Extra Os3' },
                        { value: 'Extra Os4', label: 'Extra Os4' },
                      ]}
                    />
                  )}
                />

                {/* Basic Salary */}
                <Controller
                  name='basic_salary'
                  control={control}
                  render={({ field }) => (
                    <FormFieldWithValidation
                      label='Basic Salary (OMR)'
                      name='basic_salary'
                      type='number'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.basic_salary}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.basic_salary && !errors.basic_salary}
                      placeholder='0'
                    />
                  )}
                />

                {/* Start Date */}
                <Controller
                  name='contract_start_date'
                  control={control}
                  render={({ field }) => (
                    <FormFieldWithValidation
                      label='Start Date'
                      name='contract_start_date'
                      type='date'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.contract_start_date}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.contract_start_date && !errors.contract_start_date}
                    />
                  )}
                />

                {/* End Date */}
                <Controller
                  name='contract_end_date'
                  control={control}
                  render={({ field }) => (
                    <FormFieldWithValidation
                      label='End Date'
                      name='contract_end_date'
                      type='date'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.contract_end_date}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.contract_end_date && !errors.contract_end_date}
                    />
                  )}
                />

                {/* Probation Period */}
                <Controller
                  name='probation_period'
                  control={control}
                  render={({ field }) => (
                    <SelectFieldWithValidation
                      label='Probation Period'
                      name='probation_period'
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: '3_months', label: '3 Months' },
                        { value: '6_months', label: '6 Months' },
                        { value: '12_months', label: '12 Months' },
                      ]}
                      error={errors.probation_period}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.probation_period && !errors.probation_period}
                    />
                  )}
                />

                {/* Notice Period */}
                <Controller
                  name='notice_period'
                  control={control}
                  render={({ field }) => (
                    <SelectFieldWithValidation
                      label='Notice Period'
                      name='notice_period'
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: '30_days', label: '30 Days' },
                        { value: '60_days', label: '60 Days' },
                        { value: '90_days', label: '90 Days' },
                      ]}
                      error={errors.notice_period}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.notice_period && !errors.notice_period}
                    />
                  )}
                />

                {/* Working Hours */}
                <Controller
                  name='working_hours'
                  control={control}
                  render={({ field }) => (
                    <SelectFieldWithValidation
                      label='Working Hours per Week'
                      name='working_hours'
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: '40_hours', label: '40 Hours/Week' },
                        { value: '45_hours', label: '45 Hours/Week' },
                        { value: '48_hours', label: '48 Hours/Week' },
                      ]}
                      error={errors.working_hours}
                      disabled={generating}
                      required
                      isValid={!!dirtyFields.working_hours && !errors.working_hours}
                    />
                  )}
                />

                {/* Housing Allowance */}
                <Controller
                  name='housing_allowance'
                  control={control}
                  render={({ field }) => (
                    <FormFieldWithValidation
                      label='Housing Allowance (OMR)'
                      name='housing_allowance'
                      type='number'
                      value={field.value || 0}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.housing_allowance}
                      disabled={generating}
                      isValid={!!dirtyFields.housing_allowance && !errors.housing_allowance}
                      placeholder='0'
                    />
                  )}
                />

                {/* Transportation Allowance */}
                <Controller
                  name='transport_allowance'
                  control={control}
                  render={({ field }) => (
                    <FormFieldWithValidation
                      label='Transportation Allowance (OMR)'
                      name='transport_allowance'
                      type='number'
                      value={field.value || 0}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.transport_allowance}
                      disabled={generating}
                      isValid={!!dirtyFields.transport_allowance && !errors.transport_allowance}
                      placeholder='0'
                    />
                  )}
                />
              </div>

              {/* Special Terms */}
              <div className='space-y-2'>
                <Label htmlFor='special_terms'>Special Terms</Label>
                <Controller
                  name='special_terms'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      id='special_terms'
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder='Any special terms or conditions...'
                      rows={3}
                      disabled={generating}
                    />
                  )}
                />
              </div>
            </div>

            {/* Contract Summary */}
            {(watchedFields.contract_start_date || watchedFields.contract_end_date) && (
              <div className='bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
                <h3 className='font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center'>
                  <Calendar className='h-4 w-4 mr-2' />
                  Contract Summary
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                  {watchedFields.contract_start_date && (
                    <div>
                      <span className='font-medium text-blue-800 dark:text-blue-200'>
                        Start Date:
                      </span>
                      <span className='ml-2 text-blue-700 dark:text-blue-300'>
                        {format(
                          parseISO(watchedFields.contract_start_date),
                          'dd-MM-yyyy'
                        )}
                      </span>
                    </div>
                  )}
                  {watchedFields.contract_end_date && (
                    <div>
                      <span className='font-medium text-blue-800 dark:text-blue-200'>
                        End Date:
                      </span>
                      <span className='ml-2 text-blue-700 dark:text-blue-300'>
                        {format(
                          parseISO(watchedFields.contract_end_date),
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
                type='submit'
                disabled={generating || !isValid}
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
            {!isValid && Object.keys(errors).length > 0 && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  Please fix the validation errors above before submitting the form.
                </AlertDescription>
              </Alert>
            )}

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
      </form>
    </div>
  );
}

