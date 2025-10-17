'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface Promoter {
  id: string;
  name_en: string;
  name_ar: string;
  email: string;
  mobile_number: string;
  id_card_number: string;
}

interface Party {
  id: string;
  name_en: string;
  name_ar: string;
  crn: string;
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
}

export default function SimpleContractGenerator() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
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
  });
  const { toast } = useToast();

  const contractTypes = [
    { value: 'full-time-permanent', label: 'Full-Time Permanent Employment' },
    { value: 'part-time-contract', label: 'Part-Time Contract' },
    { value: 'fixed-term-contract', label: 'Fixed-Term Contract' },
    { value: 'consulting-agreement', label: 'Consulting Agreement' },
    { value: 'service-contract', label: 'Service Contract' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      // Load promoters
      const { data: promotersData, error: promotersError } = await supabase
        .from('promoters')
        .select('id, name_en, name_ar, email, mobile_number, id_card_number')
        .order('name_en');

      if (promotersError) {
        console.error('Error loading promoters:', promotersError);
        throw new Error(`Failed to load promoters: ${promotersError.message}`);
      }

      // Load parties
      const { data: partiesData, error: partiesError } = await supabase
        .from('parties')
        .select('id, name_en, name_ar, crn')
        .order('name_en');

      if (partiesError) {
        console.error('Error loading parties:', partiesError);
        throw new Error(`Failed to load parties: ${partiesError.message}`);
      }

      setPromoters(promotersData || []);
      setParties(partiesData || []);
      
      console.log(`✅ Loaded ${promotersData?.length || 0} promoters and ${partiesData?.length || 0} parties`);
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

  const handleInputChange = (field: keyof ContractFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.promoter_id) errors.push('Please select a promoter');
    if (!formData.first_party_id) errors.push('Please select the first party (employer)');
    if (!formData.second_party_id) errors.push('Please select the second party (client)');
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
      // Call the simple contract generation API
      const response = await fetch('/api/contracts/simple-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate contract');
      }

      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Contract generated and sent to Make.com for processing',
        });
        
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

  const generateContractNumber = (): string => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PAC-${day}${month}${year}-${random}`;
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
  if (promoters.length === 0 || parties.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Generate Contract</h1>
          <p className="text-muted-foreground">
            Create professional contracts with automated processing
          </p>
        </div>
        
        <div className="text-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
            <p className="text-muted-foreground mb-4">
              {promoters.length === 0 && parties.length === 0 
                ? "No promoters or parties found. Please add some data first."
                : promoters.length === 0 
                ? "No promoters found. Please add some promoters first."
                : "No parties found. Please add some parties first."
              }
            </p>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Generate Contract</h1>
        <p className="text-muted-foreground">
          Create professional contracts with automated processing
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Details
          </CardTitle>
          <CardDescription>
            Fill in the required information to generate your contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Parties */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Parties
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Promoter Selection */}
              <div className="space-y-2">
                <Label htmlFor="promoter">Promoter *</Label>
                <Select
                  value={formData.promoter_id}
                  onValueChange={(value) => handleInputChange('promoter_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select promoter" />
                  </SelectTrigger>
                  <SelectContent>
                    {promoters.map((promoter) => (
                      <SelectItem key={promoter.id} value={promoter.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{promoter.name_en}</div>
                            <div className="text-sm text-muted-foreground">
                              {promoter.email}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* First Party Selection */}
              <div className="space-y-2">
                <Label htmlFor="first_party">First Party (Employer) *</Label>
                <Select
                  value={formData.first_party_id}
                  onValueChange={(value) => handleInputChange('first_party_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select first party" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((party) => (
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
                  </SelectContent>
                </Select>
              </div>

              {/* Second Party Selection */}
              <div className="space-y-2">
                <Label htmlFor="second_party">Second Party (Client) *</Label>
                <Select
                  value={formData.second_party_id}
                  onValueChange={(value) => handleInputChange('second_party_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select second party" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((party) => (
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
                  Generate Contract
                </>
              )}
            </Button>
          </div>

          {/* Info Alert */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This will create a contract in the database and trigger the Make.com automation 
              to generate a professional PDF document with all required signatures and stamps.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
