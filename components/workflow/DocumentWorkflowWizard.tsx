'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Users,
  Zap,
  CheckCircle,
  AlertTriangle,
  Play,
  Download,
  Eye,
  Settings,
  Clock,
  User,
  Building,
  FileImage,
  Send,
  RefreshCw,
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
  passport_number: string;
  id_card_url?: string;
  passport_url?: string;
}

interface Party {
  id: string;
  name_en: string;
  name_ar: string;
  crn: string;
  email: string;
  phone: string;
}

interface ContractType {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  category: string;
  fields: any[];
  makecomTemplateId?: string;
  googleDocsTemplateId?: string;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
}

export default function DocumentWorkflowWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [selectedPromoter, setSelectedPromoter] = useState<string>('');
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [selectedContractType, setSelectedContractType] = useState<string>('');
  const [contractData, setContractData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'select-promoter',
      title: 'Select Promoter',
      description: 'Choose the promoter for the contract',
      icon: <User className='h-5 w-5' />,
      completed: currentStep > 0,
      current: currentStep === 0,
    },
    {
      id: 'select-party',
      title: 'Select Party',
      description: 'Choose the contracting party',
      icon: <Building className='h-5 w-5' />,
      completed: currentStep > 1,
      current: currentStep === 1,
    },
    {
      id: 'select-contract',
      title: 'Select Contract Type',
      description: 'Choose the type of contract to generate',
      icon: <FileText className='h-5 w-5' />,
      completed: currentStep > 2,
      current: currentStep === 2,
    },
    {
      id: 'fill-details',
      title: 'Fill Details',
      description: 'Complete contract-specific information',
      icon: <Settings className='h-5 w-5' />,
      completed: currentStep > 3,
      current: currentStep === 3,
    },
    {
      id: 'generate',
      title: 'Generate Document',
      description: 'Create and process the contract',
      icon: <Zap className='h-5 w-5' />,
      completed: currentStep > 4,
      current: currentStep === 4,
    },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Load promoters
      const { data: promotersData } = (await supabase
        ?.from('promoters')
        .select(
          'id, name_en, name_ar, email, mobile_number, id_card_number, passport_number, id_card_url, passport_url, employer_id'
        )
        .order('name_en')) || { data: null };

      // Load parties
      const { data: partiesData } = (await supabase
        ?.from('parties')
        .select('id, name_en, name_ar, crn, email, phone')
        .order('name_en')) || { data: null };

      // Load contract types
      const response = await fetch(
        '/api/contracts/makecom/generate?action=types'
      );
      const result = await response.json();

      setPromoters(promotersData || []);
      setParties(partiesData || []);
      setContractTypes(result.success ? result.data : []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < workflowSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerateContract = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/contracts/makecom/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          contractType: selectedContractType,
          contractData: {
            ...contractData,
            promoter_id: selectedPromoter,
            first_party_id: selectedParty,
            contract_start_date: new Date().toISOString().split('T')[0],
            contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          },
          triggerMakecom: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success!',
          description:
            'Contract generated successfully and sent to Make.com for processing',
        });
        setCurrentStep(workflowSteps.length - 1);
      } else {
        throw new Error(result.error || 'Failed to generate contract');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate contract',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h3 className='text-lg font-semibold'>Select Promoter</h3>
              <p className='text-muted-foreground'>
                Choose the promoter for this contract
              </p>
            </div>
            <Select
              value={selectedPromoter}
              onValueChange={setSelectedPromoter}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a promoter' />
              </SelectTrigger>
              <SelectContent>
                {promoters.map(promoter => (
                  <SelectItem key={promoter.id} value={promoter.id}>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      <div>
                        <div className='font-medium'>{promoter.name_en}</div>
                        <div className='text-sm text-muted-foreground'>
                          {promoter.email} • {promoter.mobile_number}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPromoter && (
              <Card>
                <CardContent className='pt-4'>
                  <div className='flex items-center gap-4'>
                    <div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
                      <User className='h-6 w-6 text-primary' />
                    </div>
                    <div>
                      <h4 className='font-medium'>
                        {
                          promoters.find(p => p.id === selectedPromoter)
                            ?.name_en
                        }
                      </h4>
                      <p className='text-sm text-muted-foreground'>
                        ID:{' '}
                        {
                          promoters.find(p => p.id === selectedPromoter)
                            ?.id_card_number
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 1:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h3 className='text-lg font-semibold'>
                Select Contracting Party
              </h3>
              <p className='text-muted-foreground'>
                Choose the company or organization
              </p>
            </div>
            <Select value={selectedParty} onValueChange={setSelectedParty}>
              <SelectTrigger>
                <SelectValue placeholder='Select a party' />
              </SelectTrigger>
              <SelectContent>
                {parties.map(party => (
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
              </SelectContent>
            </Select>
            {selectedParty && (
              <Card>
                <CardContent className='pt-4'>
                  <div className='flex items-center gap-4'>
                    <div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
                      <Building className='h-6 w-6 text-primary' />
                    </div>
                    <div>
                      <h4 className='font-medium'>
                        {parties.find(p => p.id === selectedParty)?.name_en}
                      </h4>
                      <p className='text-sm text-muted-foreground'>
                        CRN: {parties.find(p => p.id === selectedParty)?.crn}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h3 className='text-lg font-semibold'>Select Contract Type</h3>
              <p className='text-muted-foreground'>
                Choose the type of document to generate
              </p>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {contractTypes.map(type => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all ${
                    selectedContractType === type.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedContractType(type.id)}
                >
                  <CardContent className='pt-4'>
                    <div className='flex items-start gap-3'>
                      <div className='h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center'>
                        <FileText className='h-5 w-5 text-primary' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-medium'>{type.name}</h4>
                        <p className='text-sm text-muted-foreground mt-1'>
                          {type.description}
                        </p>
                        <div className='flex gap-2 mt-2'>
                          <Badge variant='secondary' className='text-xs'>
                            {type.category}
                          </Badge>
                          {type.makecomTemplateId && (
                            <Badge variant='outline' className='text-xs'>
                              <Zap className='h-3 w-3 mr-1' />
                              Automated
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        const selectedType = contractTypes.find(
          t => t.id === selectedContractType
        );
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h3 className='text-lg font-semibold'>Contract Details</h3>
              <p className='text-muted-foreground'>
                Fill in the required information for {selectedType?.name}
              </p>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {selectedType?.fields?.map(field => (
                <div key={field.id} className='space-y-2'>
                  <Label htmlFor={field.id}>
                    {field.name}
                    {field.required && (
                      <span className='text-red-500 ml-1'>*</span>
                    )}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.id}
                      placeholder={field.placeholder}
                      value={contractData[field.id] || ''}
                      onChange={e =>
                        setContractData(prev => ({
                          ...prev,
                          [field.id]: e.target.value,
                        }))
                      }
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={contractData[field.id] || ''}
                      onValueChange={value =>
                        setContractData(prev => ({
                          ...prev,
                          [field.id]: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option: any) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={contractData[field.id] || ''}
                      onChange={e =>
                        setContractData(prev => ({
                          ...prev,
                          [field.id]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h3 className='text-lg font-semibold'>Generate Document</h3>
              <p className='text-muted-foreground'>
                Review and generate your contract document
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Eye className='h-5 w-5' />
                  Document Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='font-medium'>Promoter:</span>
                      <p>
                        {
                          promoters.find(p => p.id === selectedPromoter)
                            ?.name_en
                        }
                      </p>
                    </div>
                    <div>
                      <span className='font-medium'>Party:</span>
                      <p>
                        {parties.find(p => p.id === selectedParty)?.name_en}
                      </p>
                    </div>
                    <div>
                      <span className='font-medium'>Contract Type:</span>
                      <p>
                        {
                          contractTypes.find(t => t.id === selectedContractType)
                            ?.name
                        }
                      </p>
                    </div>
                    <div>
                      <span className='font-medium'>Status:</span>
                      <Badge variant='outline'>Ready to Generate</Badge>
                    </div>
                  </div>

                  <Alert>
                    <Zap className='h-4 w-4' />
                    <AlertDescription>
                      This contract will be automatically processed through
                      Make.com and generated as a professional PDF document with
                      all required signatures and stamps.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <RefreshCw className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p>Loading workflow data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold'>Document Generation Workflow</h1>
        <p className='text-muted-foreground'>
          Create contracts, letters, and offers with automated processing
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-between'>
            {workflowSteps.map((step, index) => (
              <div key={step.id} className='flex items-center'>
                <div className='flex items-center'>
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      step.completed
                        ? 'bg-green-500 text-white'
                        : step.current
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className='h-5 w-5' />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className='ml-3 hidden sm:block'>
                    <p
                      className={`text-sm font-medium ${
                        step.current ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className='flex-1 h-px bg-muted mx-4' />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardContent className='pt-6'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {getCurrentStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className='flex justify-between'>
        <Button
          variant='outline'
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <div className='flex gap-2'>
          {currentStep === workflowSteps.length - 1 ? (
            <Button
              onClick={handleGenerateContract}
              disabled={generating}
              className='min-w-[140px]'
            >
              {generating ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className='h-4 w-4 mr-2' />
                  Generate Contract
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 0 && !selectedPromoter) ||
                (currentStep === 1 && !selectedParty) ||
                (currentStep === 2 && !selectedContractType)
              }
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
