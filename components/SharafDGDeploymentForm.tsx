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
  Loader2,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Briefcase,
  Image as ImageIcon,
  Download,
  ExternalLink,
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
  // IDs
  promoter_id: string;
  first_party_id: string; // Employer (Falcon Eye Group)
  second_party_id: string; // Client (Sharaf DG)
  
  // Contract basics
  contract_number: string;
  contract_type: string;
  
  // Dates
  contract_start_date: string;
  contract_end_date: string;
  
  // Employment details
  job_title: string;
  department: string;
  work_location: string;
  basic_salary: number | undefined;
  
  // Additional terms
  special_terms: string | undefined;
}

export default function SharafDGDeploymentForm() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [employers, setEmployers] = useState<Party[]>([]);
  const [clients, setClients] = useState<Party[]>([]);
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<Party | null>(null);
  const [selectedClient, setSelectedClient] = useState<Party | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [contractCreated, setContractCreated] = useState(false);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [googleDriveUrl, setGoogleDriveUrl] = useState<string | null>(null);

  const { toast } = useToast();
  const supabase = createClient();
  
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const [formData, setFormData] = useState<SharafDGFormData>({
    promoter_id: '',
    first_party_id: '',
    second_party_id: '',
    contract_number: '',
    contract_type: 'sharaf-dg-deployment',
    contract_start_date: '',
    contract_end_date: '',
    job_title: '',
    department: '',
    work_location: '',
    basic_salary: undefined,
    special_terms: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchPromoters();
    fetchParties();
  }, []);

  const fetchPromoters = async () => {
    try {
      const { data, error } = await supabase
        .from('promoters')
        .select('*')
        .in('status_enum', ['available', 'active'])
        .order('name_en');

      if (error) throw error;
      setPromoters(data || []);
    } catch (error) {
      console.error('Error fetching promoters:', error);
      toast({
        title: 'Error',
        description: 'Failed to load promoters',
        variant: 'destructive',
      });
    }
  };

  const fetchParties = async () => {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('status', 'Active')
        .order('name_en');

      if (error) throw error;

      const allParties = data || [];
      setEmployers(allParties.filter(p => p.type === 'Employer'));
      setClients(allParties.filter(p => p.type === 'Client'));
    } catch (error) {
      console.error('Error fetching parties:', error);
      toast({
        title: 'Error',
        description: 'Failed to load parties',
        variant: 'destructive',
      });
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
    setFormData(prev => ({ ...prev, first_party_id: employerId }));
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    setFormData(prev => ({ ...prev, second_party_id: clientId }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Required fields
    if (!formData.promoter_id) errors.push('Promoter');
    if (!formData.first_party_id) errors.push('Employer (First Party)');
    if (!formData.second_party_id) errors.push('Client (Second Party)');
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
    if (selectedEmployer) {
      if (!selectedEmployer.name_ar) errors.push('Employer Arabic Name');
      if (!selectedEmployer.crn) errors.push('Employer CRN');
    }

    if (selectedClient) {
      if (!selectedClient.name_ar) errors.push('Client Arabic Name');
      if (!selectedClient.crn) errors.push('Client CRN');
    }

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

    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. Create contract in database
      const { data: newContract, error: createError } = await supabase
        .from('contracts')
        .insert({
          contract_number: formData.contract_number,
          title: `Sharaf DG Deployment - ${selectedPromoter?.name_en}`,
          contract_type: formData.contract_type,
          status: 'draft',
          promoter_id: formData.promoter_id,
          first_party_id: formData.first_party_id,
          second_party_id: formData.second_party_id,
          employer_id: formData.first_party_id,
          client_id: formData.second_party_id,
          start_date: formData.contract_start_date,
          end_date: formData.contract_end_date,
          job_title: formData.job_title,
          department: formData.department,
          work_location: formData.work_location,
          value: formData.basic_salary || 0,
          currency: 'OMR',
          special_terms: formData.special_terms,
          pdf_status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      setCreatedContractId(newContract.id);
      setContractCreated(true);

      toast({
        title: 'Contract Created',
        description: 'Contract saved successfully. Generate PDF to create deployment letter.',
      });

      // Auto-scroll to PDF section
      setTimeout(() => {
        document.getElementById('pdf-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create contract',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!createdContractId) return;

    setGenerating(true);
    setPdfStatus('generating');

    try {
      const response = await fetch(`/api/contracts/${createdContractId}/generate-pdf`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate PDF');
      }

      toast({
        title: 'PDF Generation Started',
        description: 'Your deployment letter is being generated. This will take about 30 seconds.',
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
            action: {
              label: 'Download',
              onClick: () => window.open(contract.pdf_url!, '_blank'),
            } as any,
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

    setTimeout(() => clearInterval(interval), 120000); // Stop after 2 minutes
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-6 w-6" />
            Sharaf DG Deployment Letter Generator
          </CardTitle>
          <CardDescription>
            Create deployment letters for promoters assigned to Sharaf DG contracts.
            The system will automatically generate a bilingual PDF document.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Promoter Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Step 1: Select Promoter
            </CardTitle>
            <CardDescription>
              Choose the promoter to be deployed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promoter">Promoter *</Label>
              <Select
                value={formData.promoter_id}
                onValueChange={handlePromoterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select promoter..." />
                </SelectTrigger>
                <SelectContent>
                  {promoters.map(promoter => (
                    <SelectItem key={promoter.id} value={promoter.id}>
                      <div className="flex items-center gap-2">
                        <span>{promoter.name_en}</span>
                        <span className="text-muted-foreground">
                          ({promoter.name_ar})
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {promoter.status || 'available'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Promoter Details Preview */}
            {selectedPromoter && (
              <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name (EN):</strong> {selectedPromoter.name_en}</div>
                    <div><strong>Name (AR):</strong> {selectedPromoter.name_ar}</div>
                    <div><strong>ID Card:</strong> {selectedPromoter.id_card_number}</div>
                    <div><strong>Passport:</strong> {selectedPromoter.passport_number || 'Not provided'}</div>
                    <div className="flex items-center gap-2 mt-2">
                      {selectedPromoter.id_card_url ? (
                        <Badge variant="default" className="gap-1">
                          <ImageIcon className="h-3 w-3" />
                          ID Card ✓
                        </Badge>
                      ) : (
                        <Badge variant="destructive">ID Card Missing</Badge>
                      )}
                      {selectedPromoter.passport_url ? (
                        <Badge variant="default" className="gap-1">
                          <ImageIcon className="h-3 w-3" />
                          Passport ✓
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Passport Missing</Badge>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Parties Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              Step 2: Select Parties
            </CardTitle>
            <CardDescription>
              Choose employer (first party) and client (second party - Sharaf DG)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Employer */}
            <div className="space-y-2">
              <Label htmlFor="employer">Employer (First Party) *</Label>
              <Select
                value={formData.first_party_id}
                onValueChange={handleEmployerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employer..." />
                </SelectTrigger>
                <SelectContent>
                  {employers.map(employer => (
                    <SelectItem key={employer.id} value={employer.id}>
                      {employer.name_en} ({employer.name_ar})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client (Sharaf DG) */}
            <div className="space-y-2">
              <Label htmlFor="client">Client (Sharaf DG) *</Label>
              <Select
                value={formData.second_party_id}
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Sharaf DG..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name_en} ({client.name_ar})
                      {client.name_en.toLowerCase().includes('sharaf') && (
                        <Badge className="ml-2" variant="default">Sharaf DG</Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Party Preview */}
            {(selectedEmployer || selectedClient) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {selectedEmployer && (
                  <Alert>
                    <Building className="h-4 w-4" />
                    <AlertDescription>
                      <div className="text-sm space-y-1">
                        <div className="font-semibold">Employer</div>
                        <div>{selectedEmployer.name_en}</div>
                        <div className="text-right">{selectedEmployer.name_ar}</div>
                        <div className="text-muted-foreground">
                          CRN: {selectedEmployer.crn || 'Not provided'}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {selectedClient && (
                  <Alert>
                    <Building className="h-4 w-4" />
                    <AlertDescription>
                      <div className="text-sm space-y-1">
                        <div className="font-semibold">Client</div>
                        <div>{selectedClient.name_en}</div>
                        <div className="text-right">{selectedClient.name_ar}</div>
                        <div className="text-muted-foreground">
                          CRN: {selectedClient.crn || 'Not provided'}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Contract Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Step 3: Contract Details
            </CardTitle>
            <CardDescription>
              Enter deployment and contract information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contract Number */}
            <div className="space-y-2">
              <Label htmlFor="contract_number">Contract Number *</Label>
              <Input
                id="contract_number"
                value={formData.contract_number}
                onChange={e =>
                  setFormData(prev => ({ ...prev, contract_number: e.target.value }))
                }
                placeholder="e.g., SDG-2025-001"
                required
              />
              <p className="text-sm text-muted-foreground">
                Format: SDG-YYYY-XXX (SDG = Sharaf DG)
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Deployment Start Date *</Label>
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
                <Label htmlFor="end_date">Deployment End Date *</Label>
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
                <Label htmlFor="job_title">Job Title / Position *</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, job_title: e.target.value }))
                  }
                  placeholder="e.g., Sales Promoter, Brand Ambassador"
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
                  placeholder="e.g., Electronics, Consumer Goods"
                />
              </div>
            </div>

            {/* Work Location */}
            <div className="space-y-2">
              <Label htmlFor="work_location">Work Location *</Label>
              <Input
                id="work_location"
                value={formData.work_location}
                onChange={e =>
                  setFormData(prev => ({ ...prev, work_location: e.target.value }))
                }
                placeholder="e.g., Sharaf DG Mall of Oman, Sharaf DG Muscat City Centre"
                required
              />
            </div>

            {/* Basic Salary (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="basic_salary">Basic Salary (Optional)</Label>
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

            {/* Special Terms */}
            <div className="space-y-2">
              <Label htmlFor="special_terms">Special Terms / Notes</Label>
              <Textarea
                id="special_terms"
                value={formData.special_terms}
                onChange={e =>
                  setFormData(prev => ({ ...prev, special_terms: e.target.value }))
                }
                placeholder="Any special terms, conditions, or notes for this deployment..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        {!contractCreated && (
          <Card>
            <CardContent className="pt-6">
              <Button
                type="submit"
                size="lg"
                className="w-full"
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
            </CardContent>
          </Card>
        )}
      </form>

      {/* PDF Generation Section */}
      {contractCreated && (
        <Card id="pdf-section" className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              Contract Created Successfully
            </CardTitle>
            <CardDescription>
              Now generate the deployment letter PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pdfStatus === 'idle' && (
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
            )}

            {pdfStatus === 'generating' && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold">Generating deployment letter...</div>
                    <div className="text-sm text-muted-foreground">
                      This process includes:
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Fetching template from Google Drive</li>
                        <li>Filling promoter and party information</li>
                        <li>Embedding ID card and passport images</li>
                        <li>Generating bilingual PDF</li>
                        <li>Uploading to storage</li>
                      </ul>
                      <div className="mt-2">Estimated time: 30-40 seconds</div>
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
                    <div className="font-semibold text-green-900">
                      Deployment Letter Ready!
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => window.open(pdfUrl, '_blank')}
                        variant="default"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                      {googleDriveUrl && (
                        <Button
                          onClick={() => window.open(googleDriveUrl, '_blank')}
                          variant="outline"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in Google Drive
                        </Button>
                      )}
                      <Button
                        onClick={handleGeneratePDF}
                        variant="ghost"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Regenerate
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
                    </div>
                    <Button
                      onClick={handleGeneratePDF}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Retry Generation
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
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
              This form creates formal deployment letters for promoters assigned to Sharaf DG locations.
              The generated document includes:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Bilingual content (English and Arabic)</li>
              <li>Company logos (both parties)</li>
              <li>Promoter identification documents (ID card & passport)</li>
              <li>Contract terms and conditions</li>
              <li>Official stamps and signatures area</li>
            </ul>
            <p className="mt-3">
              <strong>Requirements:</strong> Promoter must have valid ID card and passport images uploaded.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

