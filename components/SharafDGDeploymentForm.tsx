'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  MapPin,
  Briefcase,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Package,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Promoter {
  id: string;
  name_en: string;
  name_ar: string;
  mobile_number: string | null;
  email: string | null;
  id_card_number: string;
  passport_number: string | null;
  id_card_url: string | null;
  passport_url: string | null;
  employer_id?: string | null;
  status?: string;
  status_enum?: string;
}

interface Party {
  id: string;
  name_en: string;
  name_ar: string;
  crn: string | null;
  logo_url?: string | null;
  type: string;
  status?: string;
}

interface SharafDGFormData {
  // Parties - Three selections
  promoter_id: string;
  first_party_id: string;      // Client (Sharaf DG)
  second_party_id: string;     // Employer
  supplier_brand_id: string;   // Supplier/Brand (from parties, shows only names)
  
  // Contract basics
  contract_number: string;
  contract_type: string;
  contract_name: string;
  
  // Dates
  contract_start_date: string;
  contract_end_date: string;
  
  // Employment details
  job_title: string;
  department: string;
  work_location: string;
  basic_salary: number | undefined;
  
  // Employment terms (matching eXtra form)
  probation_period: string;
  notice_period: string;
  working_hours: string;
  housing_allowance: number | undefined;
  transport_allowance: number | undefined;
  
  // Additional terms
  special_terms: string | undefined;
}

interface SharafDGDeploymentFormProps {
  pageTitle?: string;
}

export default function SharafDGDeploymentForm({ 
  pageTitle = "Sharaf DG Deployment Contracts" 
}: SharafDGDeploymentFormProps) {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [allParties, setAllParties] = useState<Party[]>([]);
  const [employers, setEmployers] = useState<Party[]>([]);
  const [clients, setClients] = useState<Party[]>([]);
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [allPromoters, setAllPromoters] = useState<Promoter[]>([]);
  const [promoterSearchTerm, setPromoterSearchTerm] = useState('');
  
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<Party | null>(null);
  const [selectedClient, setSelectedClient] = useState<Party | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Party | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [contractCreated, setContractCreated] = useState(false);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [googleDriveUrl, setGoogleDriveUrl] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { toast } = useToast();

  const [formData, setFormData] = useState<SharafDGFormData>({
    promoter_id: '',
    first_party_id: '',
    second_party_id: '',
    supplier_brand_id: '',
    contract_number: '',
    contract_type: 'employment', // Use database-compliant value
    contract_name: '',
    contract_start_date: '',
    contract_end_date: '',
    job_title: '',
    department: '',
    work_location: '',
    basic_salary: undefined,
    probation_period: '3_months',
    notice_period: '30_days',
    working_hours: '40_hours',
    housing_allowance: undefined,
    transport_allowance: undefined,
    special_terms: undefined,
  });

  const contractTypes = [
    { value: 'employment', label: 'Sharaf DG Deployment Letter' },
    { value: 'service', label: 'Sharaf DG Service Contract' },
    { value: 'consultancy', label: 'Sharaf DG Consultancy' },
  ];

  const probationPeriods = [
    { value: '0_months', label: 'No Probation' },
    { value: '1_month', label: '1 Month' },
    { value: '3_months', label: '3 Months' },
    { value: '6_months', label: '6 Months' },
  ];

  const noticePeriods = [
    { value: '0_days', label: 'No Notice' },
    { value: '30_days', label: '30 Days' },
    { value: '60_days', label: '60 Days' },
    { value: '90_days', label: '90 Days' },
  ];

  const workingHoursOptions = [
    { value: '40_hours', label: '40 Hours/Week (Full-time)' },
    { value: '30_hours', label: '30 Hours/Week' },
    { value: '20_hours', label: '20 Hours/Week (Part-time)' },
    { value: 'flexible', label: 'Flexible Hours' },
  ];

  // Auto-generate contract number
  const generateContractNumber = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SDG-${year}${month}${day}-${random}`;
  };

  const handleGenerateContractNumber = () => {
    const newNumber = generateContractNumber();
    setFormData(prev => ({ ...prev, contract_number: newNumber }));
    toast({
      title: 'Contract Number Generated',
      description: `Generated: ${newNumber}`,
    });
  };

  useEffect(() => {
    loadData();
    loadSavedDraft();
    
    // Auto-generate contract number on first load if empty
    if (!formData.contract_number) {
      const newNumber = generateContractNumber();
      setFormData(prev => ({ ...prev, contract_number: newNumber }));
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.promoter_id || formData.contract_number) {
        localStorage.setItem('sharaf-dg-form-draft', JSON.stringify(formData));
        setLastSaved(new Date());
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData]);

  const loadSavedDraft = () => {
    try {
      const savedDraft = localStorage.getItem('sharaf-dg-form-draft');
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

      // Load all parties
      const { data: partiesData, error: partiesError } = await supabase
        .from('parties')
        .select('id, name_en, name_ar, crn, type, logo_url, status')
        .eq('status', 'Active')
        .order('name_en');

      if (partiesError) {
        console.error('Error loading parties:', partiesError);
        throw new Error(`Failed to load parties: ${partiesError.message}`);
      }

      const allPartiesList = partiesData || [];
      const clientsList = allPartiesList.filter(p => p.type === 'Client');
      const employersList = allPartiesList.filter(p => p.type === 'Employer');
      
      // Suppliers/Brands should be Client type (same as First Party)
      const suppliersList = allPartiesList.filter(
        p => p.type === 'Client' || p.type === 'Supplier'
      );

      setAllParties(allPartiesList);
      setClients(clientsList);
      setEmployers(employersList);
      setSuppliers(suppliersList);

      // Load promoters with images
      const { data: promotersData, error: promotersError } = await supabase
        .from('promoters')
        .select('*')
        .in('status_enum', ['available', 'active'])
        .order('name_en');

      if (promotersError) {
        console.error('Error loading promoters:', promotersError);
        throw new Error(`Failed to load promoters: ${promotersError.message}`);
      }

      setPromoters(promotersData || []);
      setAllPromoters(promotersData || []);

      console.log(`✅ Loaded ${promotersData?.length || 0} promoters, ${clientsList.length} clients, ${employersList.length} employers, ${suppliersList.length} suppliers`);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load form data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromoterChange = (promoterId: string) => {
    const promoter = promoters.find(p => p.id === promoterId);
    setSelectedPromoter(promoter || null);
    setFormData(prev => ({ ...prev, promoter_id: promoterId }));
  };

  const handleEmployerChange = (employerId: string) => {
    const employer = employers.find(e => e.id === employerId);
    setSelectedEmployer(employer || null);
    setFormData(prev => ({ 
      ...prev, 
      second_party_id: employerId,
      // Clear promoter selection when employer changes
      promoter_id: '',
    }));
    setSelectedPromoter(null);
    
    toast({
      title: 'Employer Selected',
      description: 'Promoters filtered by selected employer',
    });
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    setFormData(prev => ({ ...prev, first_party_id: clientId }));
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setSelectedSupplier(supplier || null);
    setFormData(prev => ({ ...prev, supplier_brand_id: supplierId }));
  };

  // Filter promoters by selected employer AND search term
  const filteredPromoters = allPromoters.filter(p => {
    // Filter by employer if one is selected
    const matchesEmployer = formData.second_party_id 
      ? p.employer_id === formData.second_party_id 
      : true; // Show all if no employer selected yet
    
    // Filter by search term
    const matchesSearch = promoterSearchTerm
      ? p.name_en?.toLowerCase().includes(promoterSearchTerm.toLowerCase()) ||
        p.name_ar?.toLowerCase().includes(promoterSearchTerm.toLowerCase()) ||
        p.id_card_number?.toLowerCase().includes(promoterSearchTerm.toLowerCase())
      : true;
    
    return matchesEmployer && matchesSearch;
  });

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.promoter_id) errors.push('Promoter');
    if (!formData.first_party_id) errors.push('First Party (Client)');
    if (!formData.second_party_id) errors.push('Second Party (Employer)');
    if (!formData.supplier_brand_id) errors.push('Supplier/Brand');
    if (!formData.contract_number) errors.push('Contract Number');
    if (!formData.contract_start_date) errors.push('Start Date');
    if (!formData.contract_end_date) errors.push('End Date');
    if (!formData.job_title) errors.push('Job Title');
    if (!formData.work_location) errors.push('Work Location');

    // Validate promoter has required documents
    if (selectedPromoter) {
      if (!selectedPromoter.id_card_url) errors.push('Promoter ID Card Image');
      if (!selectedPromoter.passport_url) errors.push('Promoter Passport Image');
      if (!selectedPromoter.id_card_number) errors.push('Promoter ID Card Number');
      if (!selectedPromoter.passport_number) errors.push('Promoter Passport Number');
    }

    // Validate parties have required data
    if (selectedClient && !selectedClient.name_ar) errors.push('Client Arabic Name');
    if (selectedClient && !selectedClient.crn) errors.push('Client CRN');
    if (selectedEmployer && !selectedEmployer.name_ar) errors.push('Employer Arabic Name');
    if (selectedEmployer && !selectedEmployer.crn) errors.push('Employer CRN');
    if (selectedSupplier && !selectedSupplier.name_ar) errors.push('Supplier/Brand Arabic Name');

    if (errors.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please provide: ${errors.join(', ')}`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Form submitted, validating...', formData);

    if (!validateForm()) {
      console.error('❌ Validation failed');
      return;
    }
    
    console.log('✅ Validation passed, creating contract...');

    setLoading(true);

    try {
      const supabase = createClient();

      if (!supabase) {
        console.error('❌ Supabase client not available');
        throw new Error('Supabase client not available');
      }

      // Create contract in database (only using columns that exist in contracts table)
      const contractData = {
        contract_number: formData.contract_number,
        title: formData.contract_name || `Sharaf DG Deployment - ${selectedPromoter?.name_en}`,
        description: formData.special_terms || `${formData.job_title} at ${formData.work_location}`,
        contract_type: formData.contract_type,
        status: 'draft',
        promoter_id: formData.promoter_id,
        employer_id: formData.second_party_id, // Employer is second party
        client_id: formData.first_party_id, // Client is first party
        start_date: formData.contract_start_date,
        end_date: formData.contract_end_date,
        value: formData.basic_salary || 0,
        currency: 'OMR',
        // Store all additional data as JSON in the 'terms' field (TEXT column that exists)
        terms: JSON.stringify({
          // Contract subtype
          contract_subtype: 'sharaf-dg-deployment',
          // Employment details
          job_title: formData.job_title,
          department: formData.department,
          work_location: formData.work_location,
          special_terms: formData.special_terms,
          // Supplier/brand info
          supplier_brand_id: formData.supplier_brand_id,
          supplier_brand_name_en: selectedSupplier?.name_en,
          supplier_brand_name_ar: selectedSupplier?.name_ar,
          // Employment terms
          probation_period: formData.probation_period,
          notice_period: formData.notice_period,
          working_hours: formData.working_hours,
          // Allowances
          housing_allowance: formData.housing_allowance,
          transport_allowance: formData.transport_allowance,
        }),
      };

      // Insert contract into database (without pdf_status - column doesn't exist)
      console.log('📤 Inserting contract:', contractData);
      
      const { data: newContract, error: createError } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (createError) {
        console.error('❌ Database error:', createError);
        throw createError;
      }
      
      console.log('✅ Contract created successfully:', newContract);

      setCreatedContractId(newContract.id);
      setContractCreated(true);

      // Clear draft
      localStorage.removeItem('sharaf-dg-form-draft');

      toast({
        title: 'Contract Created Successfully',
        description: `Contract ${formData.contract_number} has been saved. Now generate the PDF.`,
      });

      // Auto-scroll to PDF section
      setTimeout(() => {
        document.getElementById('pdf-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (error) {
      console.error('❌ Error creating contract:', error);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create contract';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      toast({
        title: 'Error Creating Contract',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!createdContractId) return;

    // Validate required images before proceeding
    if (!selectedPromoter?.id_card_url || !selectedPromoter?.passport_url) {
      toast({
        title: 'Missing Required Images',
        description: 'Promoter must have both ID card and passport images uploaded.',
        variant: 'destructive',
      });
      setPdfStatus('error');
      return;
    }

    setGenerating(true);
    setPdfStatus('generating');

    try {
      // Prepare data for Make.com webhook
      const webhookData = {
        contract_id: createdContractId,
        contract_number: formData.contract_number,
        contract_type: formData.contract_type,
        contract_name: formData.contract_name || `Sharaf DG Deployment - ${selectedPromoter?.name_en}`,
        
        // Promoter details
        promoter: {
          id: formData.promoter_id,
          name_en: selectedPromoter?.name_en || '',
          name_ar: selectedPromoter?.name_ar || '',
          id_card_number: selectedPromoter?.id_card_number || '',
          passport_number: selectedPromoter?.passport_number || '',
          email: selectedPromoter?.email || '',
          mobile_number: selectedPromoter?.mobile_number || '',
          id_card_url: selectedPromoter?.id_card_url || '',
          passport_url: selectedPromoter?.passport_url || '',
        },
        
        // Parties
        employer: {
          id: formData.first_party_id,
          name_en: selectedEmployer?.name_en || '',
          name_ar: selectedEmployer?.name_ar || '',
          crn: selectedEmployer?.crn || '',
          logo_url: selectedEmployer?.logo_url || '',
        },
        
        client: {
          id: formData.second_party_id,
          name_en: selectedClient?.name_en || '',
          name_ar: selectedClient?.name_ar || '',
          crn: selectedClient?.crn || '',
          logo_url: selectedClient?.logo_url || '',
        },
        
        supplier: {
          id: formData.supplier_brand_id,
          name_en: selectedSupplier?.name_en || '',
          name_ar: selectedSupplier?.name_ar || '',
        },
        
        // Contract dates
        start_date: formData.contract_start_date || '',
        end_date: formData.contract_end_date || '',
        
        // Employment details
        job_title: formData.job_title || '',
        department: formData.department || '',
        work_location: formData.work_location || '',
        
        // Compensation
        basic_salary: formData.basic_salary || 0,
        housing_allowance: formData.housing_allowance || 0,
        transport_allowance: formData.transport_allowance || 0,
        currency: 'OMR',
        
        // Terms
        probation_period: formData.probation_period || '3_months',
        notice_period: formData.notice_period || '30_days',
        working_hours: formData.working_hours || '40_hours',
        special_terms: formData.special_terms || '',
        
        // Metadata
        created_at: new Date().toISOString(),
      };

      console.log('📤 Sending to Make.com webhook:', {
        contract_id: webhookData.contract_id,
        contract_number: webhookData.contract_number,
        has_id_card: !!webhookData.promoter.id_card_url,
        has_passport: !!webhookData.promoter.passport_url,
        has_employer_logo: !!webhookData.employer.logo_url,
        has_client_logo: !!webhookData.client.logo_url,
      });

      // Send to Make.com webhook
      const webhookResponse = await fetch('https://hook.eu2.make.com/4g8e8c9yru1uej21vo0vv8zapk739lvn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('❌ Webhook error response:', errorText);
        throw new Error(`Make.com webhook failed: ${errorText}`);
      }

      const webhookResult = await webhookResponse.text();
      console.log('✅ Make.com webhook response:', webhookResult);

      toast({
        title: 'PDF Generation Started',
        description: 'Your deployment letter is being generated via Make.com. This will take about 30 seconds.',
      });

      // Poll for status
      pollPDFStatus();
    } catch (error) {
      console.error('PDF generation error:', error);
      setPdfStatus('error');
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const pollPDFStatus = () => {
    const interval = setInterval(async () => {
      try {
        const supabase = createClient();
        
        if (!supabase || !createdContractId) return;
        
        const { data: contract } = await supabase
          .from('contracts')
          .select('pdf_status, pdf_url, google_drive_url, pdf_error_message')
          .eq('id', createdContractId)
          .single();

        if (contract?.pdf_status === 'generated') {
          clearInterval(interval);
          setPdfStatus('ready');
          setPdfUrl(contract.pdf_url);
          setGoogleDriveUrl(contract.google_drive_url);
          
          toast({
            title: 'PDF Ready!',
            description: 'Your deployment letter has been generated successfully.',
          });
        } else if (contract?.pdf_status === 'error') {
          clearInterval(interval);
          setPdfStatus('error');
          toast({
            title: 'Generation Failed',
            description: contract.pdf_error_message || 'An error occurred',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 3000);

    setTimeout(() => clearInterval(interval), 120000);
  };

  const clearForm = () => {
    if (confirm('Are you sure you want to clear all form data?')) {
      setFormData({
        promoter_id: '',
        first_party_id: '',
        second_party_id: '',
        supplier_brand_id: '',
        contract_number: '',
        contract_type: 'employment', // Use database-compliant value
        contract_name: '',
        contract_start_date: '',
        contract_end_date: '',
        job_title: '',
        department: '',
        work_location: '',
        basic_salary: undefined,
        probation_period: '3_months',
        notice_period: '30_days',
        working_hours: '40_hours',
        housing_allowance: undefined,
        transport_allowance: undefined,
        special_terms: undefined,
      });
      setSelectedPromoter(null);
      setSelectedEmployer(null);
      setSelectedClient(null);
      setSelectedSupplier(null);
      setContractCreated(false);
      setCreatedContractId(null);
      setPdfStatus('idle');
      localStorage.removeItem('sharaf-dg-form-draft');
      
      toast({
        title: 'Form Cleared',
        description: 'All data has been reset.',
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Header - Matching eXtra style */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Building className="h-6 w-6" />
                {pageTitle}
              </CardTitle>
              <CardDescription className="mt-2">
                Generate professional bilingual deployment letters for Sharaf DG with automated PDF creation
              </CardDescription>
            </div>
            {lastSaved && (
              <div className="text-sm text-muted-foreground">
                Draft saved: {format(lastSaved, 'HH:mm:ss')}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Promoter Selection - Matching eXtra style */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Promoter Information
            </CardTitle>
            <CardDescription>
              Select employer first, then choose promoter from that employer's list (must have ID card and passport images)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Employer selection notice */}
            {!formData.second_party_id && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  Please select <strong>Second Party (Employer)</strong> first to see promoters from that employer.
                </AlertDescription>
              </Alert>
            )}

            {/* Search promoters */}
            <div className="space-y-2">
              <Label htmlFor="promoter-search">Search Promoter</Label>
              <Input
                id="promoter-search"
                placeholder="Search by name or ID card number..."
                value={promoterSearchTerm}
                onChange={e => setPromoterSearchTerm(e.target.value)}
                disabled={!formData.second_party_id}
              />
            </div>

            {/* Promoter dropdown */}
            <div className="space-y-2">
              <Label htmlFor="promoter">Select Promoter *</Label>
              <Select
                value={formData.promoter_id}
                onValueChange={handlePromoterChange}
                disabled={!formData.second_party_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.second_party_id 
                      ? "Select employer first..." 
                      : "Choose a promoter..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredPromoters.length > 0 ? (
                    filteredPromoters.map(promoter => (
                      <SelectItem key={promoter.id} value={promoter.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{promoter.name_en}</span>
                          <span className="text-sm text-muted-foreground">
                            {promoter.name_ar} • ID: {promoter.id_card_number}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {formData.second_party_id 
                        ? "No promoters found for selected employer" 
                        : "Select employer first"}
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {formData.second_party_id 
                  ? `${filteredPromoters.length} promoters from ${selectedEmployer?.name_en || 'selected employer'}`
                  : 'Select employer to see promoters'}
              </p>
            </div>

            {/* Promoter preview */}
            {selectedPromoter && (
              <Alert className={selectedPromoter.id_card_url && selectedPromoter.passport_url ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
                <User className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div><strong>Name (EN):</strong> {selectedPromoter.name_en}</div>
                      <div className="text-right"><strong>الاسم:</strong> {selectedPromoter.name_ar}</div>
                    </div>
                    <div><strong>ID Card:</strong> {selectedPromoter.id_card_number}</div>
                    <div><strong>Passport:</strong> {selectedPromoter.passport_number || 'Not provided'}</div>
                    <div><strong>Email:</strong> {selectedPromoter.email || 'Not provided'}</div>
                    <div><strong>Mobile:</strong> {selectedPromoter.mobile_number || 'Not provided'}</div>
                    
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                      {selectedPromoter.id_card_url ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          ID Card Image ✓
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          ID Card Missing!
                        </Badge>
                      )}
                      {selectedPromoter.passport_url ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Passport Image ✓
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Passport Missing!
                        </Badge>
                      )}
                    </div>
                    
                    {(!selectedPromoter.id_card_url || !selectedPromoter.passport_url) && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This promoter is missing required images. Please upload ID card and passport before proceeding.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Parties Selection - With Supplier/Brand */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Party Information
            </CardTitle>
            <CardDescription>
              Select client, employer, and supplier/brand
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* First Party (Client - Sharaf DG) */}
            <div className="space-y-2">
              <Label htmlFor="client">First Party (Client) *</Label>
              <Select
                value={formData.first_party_id}
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client (Sharaf DG)..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span>{client.name_en}</span>
                          <span className="text-sm text-muted-foreground">
                            {client.name_ar} • CRN: {client.crn || 'N/A'}
                          </span>
                        </div>
                        {client.name_en.toLowerCase().includes('sharaf') && (
                          <Badge variant="default" className="ml-auto">Sharaf DG</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Second Party (Employer) */}
            <div className="space-y-2">
              <Label htmlFor="employer">Second Party (Employer) *</Label>
              <Select
                value={formData.second_party_id}
                onValueChange={handleEmployerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employer..." />
                </SelectTrigger>
                <SelectContent>
                  {employers.map(employer => (
                    <SelectItem key={employer.id} value={employer.id}>
                      <div className="flex flex-col">
                        <span>{employer.name_en}</span>
                        <span className="text-sm text-muted-foreground">
                          {employer.name_ar} • CRN: {employer.crn || 'N/A'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier/Brand (From Parties - Shows Client type) */}
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier/Brand Name *</Label>
              <Select
                value={formData.supplier_brand_id}
                onValueChange={handleSupplierChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier/brand..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex flex-col">
                        <span>{supplier.name_en}</span>
                        <span className="text-sm text-muted-foreground">{supplier.name_ar}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                The brand/supplier (Client type) - can be same as First Party
              </p>
            </div>

            {/* Parties Preview */}
            {(selectedEmployer || selectedClient || selectedSupplier) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {selectedClient && (
                  <Alert>
                    <Building className="h-4 w-4" />
                    <AlertDescription>
                      <div className="text-sm space-y-1">
                        <div className="font-semibold">Client (First Party)</div>
                        <div>{selectedClient.name_en}</div>
                        <div className="text-right text-xs">{selectedClient.name_ar}</div>
                        <div className="text-xs text-muted-foreground">
                          CRN: {selectedClient.crn || 'Not provided'}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {selectedEmployer && (
                  <Alert>
                    <Building className="h-4 w-4" />
                    <AlertDescription>
                      <div className="text-sm space-y-1">
                        <div className="font-semibold">Employer (Second Party)</div>
                        <div>{selectedEmployer.name_en}</div>
                        <div className="text-right text-xs">{selectedEmployer.name_ar}</div>
                        <div className="text-xs text-muted-foreground">
                          CRN: {selectedEmployer.crn || 'Not provided'}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {selectedSupplier && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Package className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      <div className="text-sm space-y-1">
                        <div className="font-semibold text-blue-900">Supplier/Brand</div>
                        <div>{selectedSupplier.name_en}</div>
                        <div className="text-right text-xs">{selectedSupplier.name_ar}</div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Details - Matching eXtra layout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contract Number and Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_number">Contract Number *</Label>
                <div className="flex gap-2">
                  <Input
                    id="contract_number"
                    value={formData.contract_number}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, contract_number: e.target.value }))
                    }
                    placeholder="SDG-20250126-001"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateContractNumber}
                    className="shrink-0"
                    title="Generate new contract number"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-generated or enter manually. Format: SDG-YYYYMMDD-XXX
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_type">Contract Type *</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, contract_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            {/* Contract Name */}
            <div className="space-y-2">
              <Label htmlFor="contract_name">Contract Title</Label>
              <Input
                id="contract_name"
                value={formData.contract_name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, contract_name: e.target.value }))
                }
                placeholder="e.g., Sharaf DG Promoter Deployment Agreement"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Date *
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.contract_start_date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, contract_start_date: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  End Date *
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.contract_end_date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, contract_end_date: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            {/* Employment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Job Title *
                </Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, job_title: e.target.value }))
                  }
                  placeholder="Sales Promoter, Brand Ambassador, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, department: e.target.value }))
                  }
                  placeholder="Electronics, Consumer Goods, etc."
                />
              </div>
            </div>

            {/* Work Location */}
            <div className="space-y-2">
              <Label htmlFor="work_location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Work Location *
              </Label>
              <Input
                id="work_location"
                value={formData.work_location}
                onChange={e =>
                  setFormData(prev => ({ ...prev, work_location: e.target.value }))
                }
                placeholder="Sharaf DG Mall of Oman, Muscat City Centre, etc."
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Salary & Allowances - Matching eXtra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Compensation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basic_salary">Basic Salary</Label>
                <div className="flex gap-2">
                  <Input
                    id="basic_salary"
                    type="number"
                    value={formData.basic_salary || ''}
                    onChange={e => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setFormData(prev => ({
                        ...prev,
                        basic_salary: value,
                      }));
                    }}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <Badge variant="outline" className="px-4">OMR</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="housing_allowance">Housing Allowance</Label>
                <div className="flex gap-2">
                  <Input
                    id="housing_allowance"
                    type="number"
                    value={formData.housing_allowance || ''}
                    onChange={e => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setFormData(prev => ({
                        ...prev,
                        housing_allowance: value,
                      }));
                    }}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <Badge variant="outline" className="px-4">OMR</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transport_allowance">Transport Allowance</Label>
                <div className="flex gap-2">
                  <Input
                    id="transport_allowance"
                    type="number"
                    value={formData.transport_allowance || ''}
                    onChange={e => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setFormData(prev => ({
                        ...prev,
                        transport_allowance: value,
                      }));
                    }}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <Badge variant="outline" className="px-4">OMR</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Terms - Matching eXtra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Employment Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="probation_period">Probation Period</Label>
                <Select
                  value={formData.probation_period}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, probation_period: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {probationPeriods.map(period => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notice_period">Notice Period</Label>
                <Select
                  value={formData.notice_period}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, notice_period: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noticePeriods.map(period => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="working_hours">Working Hours</Label>
                <Select
                  value={formData.working_hours}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, working_hours: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workingHoursOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Special Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="special_terms"
              value={formData.special_terms || ''}
              onChange={e =>
                setFormData(prev => ({ ...prev, special_terms: e.target.value }))
              }
              placeholder="Any special terms, conditions, or notes for this deployment..."
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!contractCreated && (
          <div className="flex gap-4">
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Contract...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Create Contract
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={clearForm}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear Form
            </Button>
          </div>
        )}
      </form>

      {/* PDF Generation Section */}
      {contractCreated && (
        <Card id="pdf-section" className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              Contract Created Successfully!
            </CardTitle>
            <CardDescription className="text-green-800">
              Contract Number: <strong>{formData.contract_number}</strong> has been saved.
              Now generate the deployment letter PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pdfStatus === 'idle' && (
              <div className="space-y-3">
                <Alert className="border-blue-200 bg-blue-50">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <div className="space-y-2">
                      <div className="font-semibold">Ready to generate PDF deployment letter</div>
                      <div className="text-sm">
                        This will create a professional bilingual document with:
                        <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                          <li>Company logos</li>
                          <li>Employee details (English & Arabic)</li>
                          <li>ID card and passport images</li>
                          <li>Contract terms and conditions</li>
                          <li>Official stamps and signatures section</li>
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={handleGeneratePDF}
                  size="lg"
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5" />
                      Generate Deployment Letter PDF
                    </>
                  )}
                </Button>
              </div>
            )}

            {pdfStatus === 'generating' && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold">Generating deployment letter...</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>⏳ Fetching template from Google Drive</div>
                      <div>📝 Filling employee and company information</div>
                      <div>🖼️ Embedding ID card and passport images</div>
                      <div>📄 Generating bilingual PDF document</div>
                      <div>☁️ Uploading to secure storage</div>
                      <div className="mt-2 font-medium">Estimated time: 30-40 seconds</div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {pdfStatus === 'ready' && pdfUrl && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div className="font-semibold text-green-900 text-lg">
                      ✅ Deployment Letter Ready!
                    </div>
                    <div className="text-sm text-green-800">
                      Your bilingual PDF has been generated with employee images embedded.
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => window.open(pdfUrl, '_blank')}
                        variant="default"
                        size="lg"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                      {googleDriveUrl && (
                        <Button
                          onClick={() => window.open(googleDriveUrl, '_blank')}
                          variant="outline"
                          size="lg"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in Google Drive
                        </Button>
                      )}
                      <Button
                        onClick={handleGeneratePDF}
                        variant="ghost"
                        size="lg"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate PDF
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {pdfStatus === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold">PDF Generation Failed</div>
                    <div className="text-sm">
                      Please check that all required data is present and try again.
                      Ensure promoter has valid ID card and passport images.
                    </div>
                    <Button
                      onClick={handleGeneratePDF}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Generation
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
            <FileText className="h-4 w-4" />
            About Sharaf DG Deployment Letters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-900/80 space-y-2">
            <p>
              This form creates official deployment letters for promoters assigned to Sharaf DG locations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <div className="font-semibold mb-1">Document includes:</div>
                <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                  <li>Bilingual content (English & Arabic)</li>
                  <li>Company logos (employer, client, supplier)</li>
                  <li>Employee ID card & passport images</li>
                  <li>Complete contract terms</li>
                  <li>Official signatures section</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-1">Requirements:</div>
                <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                  <li>Promoter with uploaded ID card image</li>
                  <li>Promoter with uploaded passport image</li>
                  <li>All parties with Arabic names</li>
                  <li>Valid CRN numbers for companies</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
