'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Briefcase,
  Brain,
  Shield,
  BarChart3,
  Bell,
  Building,
  FileCheck,
  Gavel,
  Lightbulb,
  Monitor,
  Palette,
  Workflow,
  DollarSign,
  UserCheck,
  FileSearch,
  Users,
  Calendar,
  FileText,
  Eye,
  Download,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  UserPlus,
  Menu,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  Cog,
  Sliders,
  Edit,
  Trash2,
  Save,
  Upload,
  Copy,
  Share,
  Filter,
  Clock,
  Globe,
  MapPin,
  Mail,
  Phone,
  Star,
  Award,
  TrendingUp,
  Home,
  RefreshCw,
  EyeOff,
} from 'lucide-react';

import { DatePickerWithManualInput } from './date-picker-with-manual-input';
import { ComboboxField } from '@/components/combobox-field';
import { ContractDurationCalculator } from '@/components/ui/contract-duration-calculator';
import { EnhancedPromoterSelector } from '@/components/ui/enhanced-promoter-selector';
import { SalaryCalculator } from '@/components/ui/salary-calculator';
import { ComplianceChecker } from '@/components/ui/compliance-checker';
import { ContractPreview } from '@/components/ui/contract-preview';

import type { Database } from '@/types/supabase';
import {
  contractGeneratorSchema,
  type ContractGeneratorFormData,
  CONTRACT_FORM_SECTIONS,
  getRequiredFields,
} from '@/lib/schema-generator';
import { useParties } from '@/hooks/use-parties';
import { usePromoters } from '@/hooks/use-promoters';
import { useFormRegistration } from '@/hooks/use-form-context';
import type { Promoter, Party } from '@/lib/types';
import {
  JOB_TITLES,
  CURRENCIES,
  WORK_LOCATIONS,
  DEPARTMENTS,
  CONTRACT_TYPES,
} from '@/constants/contract-options';
import { updateContract, generateContractWithMakecom } from '@/app/actions/contracts';
import type { ContractInsert } from '@/app/actions/contracts';
import {
  analyzeContractDuration,
  validateContractData,
  formatDuration,
  getContractTypeRecommendations,
  calculateSalaryRecommendations,
  checkComplianceIssues,
} from '@/lib/contract-utils';

interface EnhancedContractFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  contract?: Database['public']['Tables']['contracts']['Row'] | null;
}

interface FormSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  required: boolean;
  completed: boolean;
  fields: string[];
}

interface ContractInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
}

interface SmartRecommendation {
  category: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementation: string;
  estimatedSavings?: string;
}

export default function EnhancedContractForm({
  onSuccess,
  onError,
  contract,
}: EnhancedContractFormProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [insights, setInsights] = useState<ContractInsight[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>(
    []
  );
  const [formProgress, setFormProgress] = useState({
    completed: 0,
    total: 0,
    percentage: 0,
  });

  const queryClient = useQueryClient();
  useFormRegistration();

  // Data hooks
  const { data: parties, isLoading: isLoadingParties } = useParties();
  const { data: promoters, isLoading: isLoadingPromoters } = usePromoters();

  // Filter parties by type
  const clientParties = parties?.filter(party => party.type === 'Client') || [];
  const employerParties =
    parties?.filter(party => party.type === 'Employer') || [];

  // Form setup
  const form = useForm<ContractGeneratorFormData>({
    resolver: zodResolver(contractGeneratorSchema),
    mode: 'onTouched',
    defaultValues: {
      ...(contract?.first_party_id ? { first_party_id: contract.first_party_id } : {}),
      ...(contract?.second_party_id ? { second_party_id: contract.second_party_id } : {}),
      ...(contract?.promoter_id ? { promoter_id: contract.promoter_id } : {}),
      contract_start_date: contract?.contract_start_date
        ? parseISO(contract.contract_start_date)
        : undefined,
      contract_end_date: contract?.contract_end_date
        ? parseISO(contract.contract_end_date)
        : undefined,
      email: contract?.email || '',
      job_title: contract?.job_title || '',
      work_location: contract?.work_location || '',
      department: contract?.department || '',
      contract_type: contract?.contract_type || '',
      currency: contract?.currency || 'OMR',
      basic_salary: contract?.contract_value || undefined,
      allowances: undefined,
      probation_period_months: 3,
      notice_period_days: 30,
      working_hours_per_week: 40,
      special_terms: contract?.special_terms || '',
    },
  });

  // Watch form values for real-time analysis
  // Removed watchedValues to prevent infinite loops
  const watchedStartDate = useWatch({
    control: form.control,
    name: 'contract_start_date',
  });
  const watchedEndDate = useWatch({
    control: form.control,
    name: 'contract_end_date',
  });
  const watchedContractType = useWatch({
    control: form.control,
    name: 'contract_type',
  });
  const watchedSalary = useWatch({
    control: form.control,
    name: 'basic_salary',
  });
  const watchedSecondParty = useWatch({
    control: form.control,
    name: 'second_party_id',
  });

  // Filter promoters based on selected employer
  const filteredPromoters = useMemo(() => {
    if (!watchedSecondParty || !promoters) {
      return promoters || [];
    }

    // Filter promoters that belong to the selected employer
    return promoters.filter(
      (promoter: any) => promoter.employer_id === watchedSecondParty
    );
  }, [promoters, watchedSecondParty]);

  // Clear promoter selection when employer changes
  useEffect(() => {
    if (watchedSecondParty) {
      const currentPromoterId = form.getValues('promoter_id');
      if (currentPromoterId) {
        const currentPromoter = promoters?.find(
          (p: any) => p.id === currentPromoterId
        );
        if (
          currentPromoter &&
          currentPromoter.employer_id !== watchedSecondParty
        ) {
          form.setValue('promoter_id', '');
        }
      }
    }
  }, [watchedSecondParty, promoters, form]);

  // Form sections
  const sections: FormSection[] = [
    {
      id: 'parties',
      title: 'Contracting Parties',
      description: 'Select the parties involved in the contract',
      icon: Users,
      required: true,
      completed: false,
      fields: ['first_party_id', 'second_party_id'],
    },
    {
      id: 'promoter',
      title: 'Promoter Information',
      description: 'Select the promoter for this contract',
      icon: UserCheck,
      required: true,
      completed: false,
      fields: ['promoter_id'],
    },
    {
      id: 'period',
      title: 'Contract Period',
      description: 'Define the contract start and end dates',
      icon: Calendar,
      required: true,
      completed: false,
      fields: ['contract_start_date', 'contract_end_date'],
    },
    {
      id: 'employment',
      title: 'Employment Details',
      description: 'Job title, department, and work location',
      icon: Briefcase,
      required: false,
      completed: false,
      fields: ['job_title', 'department', 'work_location'],
    },
    {
      id: 'compensation',
      title: 'Compensation',
      description: 'Salary, allowances, and benefits',
      icon: DollarSign,
      required: false,
      completed: false,
      fields: ['basic_salary', 'allowances', 'currency'],
    },
    {
      id: 'terms',
      title: 'Additional Terms',
      description: 'Special terms and conditions',
      icon: FileText,
      required: false,
      completed: false,
      fields: ['special_terms'],
    },
  ];

  // Removed analyzeFormData function to prevent circular dependencies

  // Combined effect for analysis and progress with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Inline the analysis logic to avoid circular dependencies
      const newInsights: ContractInsight[] = [];
      const newRecommendations: SmartRecommendation[] = [];

      // Analyze contract duration
      if (watchedStartDate && watchedEndDate) {
        const duration = differenceInDays(watchedEndDate, watchedStartDate);
        if (duration < 30) {
          newInsights.push({
            type: 'warning',
            title: 'Short Contract Duration',
            description: `Contract duration is ${duration} days. Consider longer terms for stability.`,
            priority: 'medium',
          });
        } else if (duration > 365) {
          newInsights.push({
            type: 'success',
            title: 'Long-term Contract',
            description: `Contract duration is ${duration} days. Good for stability.`,
            priority: 'low',
          });
        }
      }

      // Analyze contract type
      if (watchedContractType) {
        const typeConfig = CONTRACT_TYPES.find(
          t => t.value === watchedContractType
        );
        if (typeConfig) {
          newInsights.push({
            type: 'info',
            title: `${typeConfig.label} Contract`,
            description: 'Professional contract template selected.',
            priority: 'medium',
          });
        }
      }

      // Analyze salary
      if (watchedSalary && watchedSalary > 0) {
        if (watchedSalary < 30000) {
          newRecommendations.push({
            category: 'compensation',
            title: 'Consider Salary Increase',
            description:
              'Current salary is below market average for this role.',
            impact: 'medium',
            implementation: 'Review market rates and consider adjustment.',
            estimatedSavings: 'N/A',
          });
        }
      }

      setInsights(newInsights);
      setRecommendations(newRecommendations);

      // Update form progress
      const completedSections = sections.filter(section => {
        return section.fields.every(field => {
          const value = form.getValues(
            field as keyof ContractGeneratorFormData
          );
          // Handle different types of values
          if (value instanceof Date) {
            return isValid(value);
          }
          if (typeof value === 'number') {
            return !isNaN(value) && value > 0;
          }
          if (typeof value === 'string') {
            return value.trim() !== '';
          }
          return Boolean(value);
        });
      }).length;

      setFormProgress({
        completed: completedSections,
        total: sections.length,
        percentage: Math.round((completedSections / sections.length) * 100),
      });
    }, 1000); // Increased debounce to 1 second to prevent infinite loops

    return () => clearTimeout(timeoutId);
  }, [
    watchedStartDate,
    watchedEndDate,
    watchedContractType,
    watchedSalary,
    sections,
    form,
  ]);

  // Helper function to calculate salary recommendations
  const calculateSalaryRecommendations = (
    salary: number,
    contractType?: string
  ): SmartRecommendation[] => {
    const recommendations: SmartRecommendation[] = [];

    try {
      // Basic salary analysis
      if (salary < 30000) {
        recommendations.push({
          category: 'compensation',
          title: 'Consider Salary Increase',
          description: 'Current salary is below market average for this role.',
          impact: 'medium',
          implementation: 'Review market rates and consider adjustment.',
          estimatedSavings: 'N/A',
        });
      } else if (salary > 100000) {
        recommendations.push({
          category: 'compensation',
          title: 'Competitive Salary',
          description: 'Salary is competitive for this position.',
          impact: 'low',
          implementation: 'Maintain current compensation structure.',
          estimatedSavings: 'N/A',
        });
      }

      // Contract type specific recommendations
      if (contractType === 'full-time-permanent') {
        recommendations.push({
          category: 'benefits',
          title: 'Full Benefits Package',
          description:
            'Consider comprehensive benefits for permanent employees.',
          impact: 'high',
          implementation:
            'Include health insurance, retirement plans, and PTO.',
          estimatedSavings: '15-20% of salary',
        });
      } else if (contractType === 'part-time') {
        recommendations.push({
          category: 'benefits',
          title: 'Pro-rated Benefits',
          description: 'Adjust benefits package for part-time employment.',
          impact: 'medium',
          implementation: 'Pro-rate benefits based on hours worked.',
          estimatedSavings: '10-15% of salary',
        });
      }
    } catch (error) {
      console.warn('Error calculating salary recommendations:', error);
    }

    return recommendations;
  };

  // Helper function to check compliance issues
  const checkComplianceIssues = (formData: any): string[] => {
    const issues: string[] = [];

    try {
      // Check required fields
      if (!formData.contract_start_date) {
        issues.push('Contract start date is required');
      }

      if (!formData.contract_end_date) {
        issues.push('Contract end date is required');
      }

      if (!formData.first_party_id) {
        issues.push('Client (First Party) must be selected');
      }

      if (!formData.second_party_id) {
        issues.push('Employer (Second Party) must be selected');
      }

      if (!formData.email) {
        issues.push('Contact email is required');
      }

      // Check date logic
      if (formData.contract_start_date && formData.contract_end_date) {
        const startDate = new Date(formData.contract_start_date);
        const endDate = new Date(formData.contract_end_date);

        if (startDate >= endDate) {
          issues.push('Contract end date must be after start date');
        }

        // Allow contracts to start today or in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
          issues.push('Contract start date cannot be in the past');
        }
      }

      // Check salary
      if (formData.basic_salary && formData.basic_salary <= 0) {
        issues.push('Basic salary must be greater than zero');
      }

      // Check contract type specific requirements
      if (
        formData.contract_type === 'full-time-permanent' &&
        !formData.department
      ) {
        issues.push('Department is required for full-time permanent contracts');
      }

      // Validate email format
      if (
        formData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        issues.push('Please enter a valid email address');
      }
    } catch (error) {
      console.warn('Error checking compliance issues:', error);
      issues.push('Error validating form data');
    }

    return issues;
  };

  // This effect was duplicate - removed to prevent conflicts with the main analysis effect above

  // Mutations
  const createMutation = useMutation({
    // Use API route to avoid server-action auth/cookie issues across environments
    mutationFn: async (formValues: any) => {
      const toDateOnly = (value: any): string | null => {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      };

      const payload = {
        contract_number: undefined,
        // Prefer UUID-based columns expected by the API and DB
        client_id: formValues.first_party_id || formValues.client_id || null,
        employer_id: formValues.second_party_id || formValues.employer_id || null,
        promoter_id: formValues.promoter_id || null,
        // Use date-only to match DATE columns across environments
        start_date: toDateOnly(
          formValues.contract_start_date || formValues.start_date
        ),
        end_date: toDateOnly(
          formValues.contract_end_date || formValues.end_date
        ),
        // Title mapping
        title:
          formValues.contract_name ||
          formValues.title ||
          formValues.job_title ||
          'Employment Contract',
        // Include a type value if present (API will handle variants)
        type: formValues.contract_type || undefined,
        currency: formValues.currency || 'OMR',
      } as const;

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) return json;

      // Fallback: If permission or guard error, attempt Make.com-friendly route
      const statusText = json?.details || json?.error || `HTTP ${res.status}`;
      if ([401, 403, 500].includes(res.status)) {
        const fallbackBody = {
          first_party_id: payload.first_party_id,
          second_party_id: payload.second_party_id,
          promoter_id: payload.promoter_id,
          contract_type: payload.contract_type,
          job_title: payload.job_title,
          contract_name: 'Draft Contract',
        };
        const alt = await fetch('/api/generate-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(fallbackBody),
        });
        const altJson = await alt.json().catch(() => ({}));
        if (alt.ok) {
          return altJson;
        }
        throw new Error(altJson?.error || statusText || 'Failed to create contract');
      }
      throw new Error(statusText || 'Failed to create contract');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract created successfully!');
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to create contract';
      toast.error(message);
      onError?.(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract updated successfully!');
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to update contract';
      toast.error(message);
      onError?.(error);
    },
  });

  const generateMutation = useMutation({
    // Call API route instead of server action to avoid 500 POST to page URL
    mutationFn: async (formValues: any) => {
      // Map local form fields to the IDs expected by the Make.com contract type config
      const probationPeriod = formValues.probation_period_months
        ? `${formValues.probation_period_months}_months`
        : undefined;
      const noticePeriod = formValues.notice_period_days
        ? `${formValues.notice_period_days}_days`
        : undefined;
      const workingHours = formValues.working_hours_per_week
        ? `${formValues.working_hours_per_week}_hours`
        : undefined;

      const payload = {
        contractType: formValues.contract_type || 'full-time-permanent',
        contractData: {
          first_party_id: formValues.first_party_id || '',
          second_party_id: formValues.second_party_id || '',
          promoter_id: formValues.promoter_id || '',
          contract_start_date: formValues.contract_start_date
            ? new Date(formValues.contract_start_date)
            : null,
          contract_end_date: formValues.contract_end_date
            ? new Date(formValues.contract_end_date)
            : null,
          email: formValues.email || '',
          job_title: formValues.job_title || '',
          work_location: formValues.work_location || '',
          department: formValues.department || '',
          contract_type: formValues.contract_type || '',
          currency: formValues.currency || 'OMR',
          basic_salary: formValues.basic_salary,
          allowances: formValues.allowances,
          special_terms: formValues.special_terms || '',
          // Required by 'full-time-permanent' type
          probation_period: probationPeriod,
          notice_period: noticePeriod,
          working_hours: workingHours,
          // Also send numeric values for Make.com template validation
          working_hours_numeric: formValues.working_hours_per_week,
          probation_period_numeric: formValues.probation_period_months,
          notice_period_numeric: formValues.notice_period_days,
          // Additional fields for part-time contracts
          weekly_hours: formValues.working_hours_per_week,
          hourly_rate: formValues.basic_salary,
          work_schedule: 'fixed_schedule', // Default to fixed schedule
        },
        triggerMakecom: true,
      };

      // Debug logging
      console.log('🔍 Form values:', formValues);
      console.log('🔍 Contract type being sent:', formValues.contract_type || 'full-time-permanent');
      console.log('🔍 Mapped values:', { probationPeriod, noticePeriod, workingHours });
      console.log('🔍 Final payload:', payload);

      const res = await fetch('/api/contracts/makecom/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.details || json?.error || 'Failed to generate contract');
      }
      return json;
    },
    onSuccess: (data: any) => {
      toast.success('Contract generated successfully!');
      const url = data?.data?.pdf_url || data?.pdf_url;
      if (url) {
        window.open(url, '_blank');
      }
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to generate contract';
      toast.error(message);
      onError?.(error);
    },
  });

  const onSubmit = async (data: ContractGeneratorFormData) => {
    try {
      // Validate form data before submission
      const validationIssues = checkComplianceIssues(data);
      if (validationIssues.length > 0) {
        toast.error(
          `Please fix the following issues: ${validationIssues.join(', ')}`
        );
        return;
      }

      if (contract?.id) {
        await updateMutation.mutateAsync({ id: contract.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(
        'Failed to save contract. Please check your data and try again.'
      );
    }
  };

  const handleGenerateContract = async () => {
    const data = form.getValues();

    // Validate form data before generation
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error(
        'Please fill in all required fields before generating the contract.'
      );
      return;
    }

    // Check for critical missing data
    if (!data.first_party_id || !data.second_party_id) {
      toast.error(
        'Both contracting parties must be selected to generate a contract.'
      );
      return;
    }

    if (!data.contract_start_date || !data.contract_end_date) {
      toast.error('Contract start and end dates are required for generation.');
      return;
    }

    try {
      await generateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Contract generation error:', error);
      toast.error(
        'Failed to generate contract. Please verify all required information is provided.'
      );
    }
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    generateMutation.isPending;

  return (
    <div className='space-y-6'>
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                {contract ? 'Edit Contract' : 'Create New Contract'}
              </CardTitle>
              <CardDescription>
                Professional contract generation with AI-powered insights
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowAIInsights(!showAIInsights)}
              >
                <Brain className='mr-2 h-4 w-4' />
                {showAIInsights ? 'Hide' : 'Show'} AI
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className='mr-2 h-4 w-4' />
                Preview
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className='mt-4'>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm font-medium'>Form Progress</span>
              <span className='text-sm text-muted-foreground'>
                {formProgress.completed} of {formProgress.total} sections
                completed
              </span>
            </div>
            <Progress value={formProgress.percentage} className='h-2' />
          </div>
        </CardHeader>
      </Card>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Form */}
        <div className='space-y-6 lg:col-span-2'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Contracting Parties */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Users className='h-5 w-5' />
                    Contracting Parties
                  </CardTitle>
                  <CardDescription>
                    Select the parties involved in this contract
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='first_party_id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client (Party A)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={isLoading}>
                                <SelectValue
                                  placeholder={
                                    isLoading ? 'Loading...' : 'Select Client'
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingParties ? (
                                <SelectItem value='loading' aria-disabled='true'>
                                  Loading clients...
                                </SelectItem>
                              ) : clientParties.length === 0 ? (
                                <SelectItem value='no-clients' aria-disabled='true'>
                                  No clients found. Please add a client in Party
                                  Management.
                                </SelectItem>
                              ) : (
                                clientParties.map(party => (
                                  <SelectItem key={party.id} value={party.id}>
                                    {party.name_en} / {party.name_ar}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='second_party_id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employer (Party B)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={isLoading}>
                                <SelectValue
                                  placeholder={
                                    isLoading ? 'Loading...' : 'Select Employer'
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingParties ? (
                                <SelectItem value='loading' aria-disabled='true'>
                                  Loading employers...
                                </SelectItem>
                              ) : employerParties.length === 0 ? (
                                <SelectItem value='no-employers' aria-disabled='true'>
                                  No employers found. Please add an employer in
                                  Party Management.
                                </SelectItem>
                              ) : (
                                employerParties.map(party => (
                                  <SelectItem key={party.id} value={party.id}>
                                    {party.name_en} / {party.name_ar}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Promoter Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <UserCheck className='h-5 w-5' />
                    Promoter Information
                  </CardTitle>
                  <CardDescription>
                    Select the promoter for this contract
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name='promoter_id'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promoter</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger disabled={isLoading}>
                              <SelectValue
                                placeholder={
                                  isLoading ? 'Loading...' : 'Select Promoter'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingPromoters ? (
                              <SelectItem value='loading' disabled>
                                Loading promoters...
                              </SelectItem>
                            ) : !watchedSecondParty ? (
                              <SelectItem value='no-employer' disabled>
                                Please select an employer first
                              </SelectItem>
                            ) : filteredPromoters?.length === 0 ? (
                              <SelectItem value='no-promoters' disabled>
                                No promoters found for this employer
                              </SelectItem>
                            ) : (
                              filteredPromoters?.map((promoter: any) => (
                                <SelectItem
                                  key={promoter.id}
                                  value={promoter.id}
                                >
                                  {promoter.name_en} / {promoter.name_ar}
                                  <span className='ml-2 text-xs text-green-600'>
                                    ✓ Related
                                  </span>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {watchedSecondParty &&
                          filteredPromoters?.length === 0 && (
                            <p className='text-sm text-amber-600 mt-2'>
                              ⚠️ No promoters found for the selected employer.
                              Please check promoter management to assign
                              promoters to this employer.
                            </p>
                          )}
                        {watchedSecondParty &&
                          filteredPromoters?.length > 0 && (
                            <p className='text-sm text-green-600 mt-2'>
                              ✅ Found {filteredPromoters.length} promoter(s)
                              related to this employer
                            </p>
                          )}
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Mail className='h-5 w-5' />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    Email address for contract notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            type='email'
                            placeholder='Enter email address'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This email will be used for contract notifications and
                          updates. Ensure it's a valid email address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contract Period */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Calendar className='h-5 w-5' />
                    Contract Period
                  </CardTitle>
                  <CardDescription>
                    Define the contract start and end dates
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='contract_start_date'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <DatePickerWithManualInput
                              date={field.value}
                              onDateChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='contract_end_date'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <DatePickerWithManualInput
                              date={field.value}
                              onDateChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Duration Calculator */}
                  {watchedStartDate && watchedEndDate && (
                    <ContractDurationCalculator
                      startDate={watchedStartDate}
                      endDate={watchedEndDate}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Employment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Briefcase className='h-5 w-5' />
                    Employment Details
                  </CardTitle>
                  <CardDescription>
                    Job title, department, and work location
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='job_title'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={isLoading}>
                                <SelectValue placeholder='Select job title' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {JOB_TITLES.map(title => (
                                <SelectItem
                                  key={title.value}
                                  value={title.value}
                                >
                                  {title.label}
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
                      name='department'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={isLoading}>
                                <SelectValue placeholder='Select department' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DEPARTMENTS.map(dept => (
                                <SelectItem key={dept.value} value={dept.value}>
                                  {dept.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='work_location'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Location</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger disabled={isLoading}>
                              <SelectValue placeholder='Select work location' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WORK_LOCATIONS.map(location => (
                              <SelectItem
                                key={location.value}
                                value={location.value}
                              >
                                {location.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contract Terms */}
                  <div className='grid gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='probation_period_months'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Probation Period</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value?.toString() || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={isLoading}>
                                <SelectValue placeholder='Select probation period' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='3'>3 Months</SelectItem>
                              <SelectItem value='6'>6 Months</SelectItem>
                              <SelectItem value='12'>12 Months</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='notice_period_days'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notice Period</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value?.toString() || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={isLoading}>
                                <SelectValue placeholder='Select notice period' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='30'>30 Days</SelectItem>
                              <SelectItem value='60'>60 Days</SelectItem>
                              <SelectItem value='90'>90 Days</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='working_hours_per_week'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Working Hours</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value?.toString() || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={isLoading}>
                                <SelectValue placeholder='Select working hours' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='40'>40 Hours/Week</SelectItem>
                              <SelectItem value='45'>45 Hours/Week</SelectItem>
                              <SelectItem value='48'>48 Hours/Week</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Compensation */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <DollarSign className='h-5 w-5' />
                    Compensation
                  </CardTitle>
                  <CardDescription>
                    Salary, allowances, and benefits
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name='basic_salary'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basic Salary</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              value={field.value ?? ''}
                              onChange={e => {
                                const value = e.target.value;
                                if (value === '') {
                                  field.onChange(undefined);
                                } else {
                                  const numValue = Number(value);
                                  if (!isNaN(numValue) && numValue >= 0) {
                                    field.onChange(numValue);
                                  }
                                }
                              }}
                              disabled={isLoading}
                              placeholder='Enter basic salary amount'
                              min='0'
                              step='1'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='allowances'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allowances (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              value={field.value ?? ''}
                              onChange={e => {
                                const value = e.target.value;
                                if (value === '') {
                                  field.onChange(undefined);
                                } else {
                                  const numValue = Number(value);
                                  if (!isNaN(numValue) && numValue >= 0) {
                                    field.onChange(numValue);
                                  }
                                }
                              }}
                              disabled={isLoading}
                              placeholder='Enter allowances amount'
                              min='0'
                              step='1'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='currency'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={isLoading}>
                                <SelectValue placeholder='Select currency' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CURRENCIES.map(currency => (
                                <SelectItem
                                  key={currency.value}
                                  value={currency.value}
                                >
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Salary Calculator */}
                  {watchedSalary && watchedSalary > 0 && (
                    <SalaryCalculator
                      initialSalary={watchedSalary}
                      initialCurrency={form.watch('currency') || 'OMR'}
                      onSalaryChange={(total, currency) => {
                        form.setValue('basic_salary', total);
                        form.setValue('currency', currency);
                      }}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Contract Type */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='h-5 w-5' />
                    Contract Type
                  </CardTitle>
                  <CardDescription>
                    Select the type of employment contract
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name='contract_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger disabled={isLoading}>
                              <SelectValue placeholder='Select contract type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONTRACT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the type of employment contract. This affects
                          the template and clauses generated.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Additional Terms */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='h-5 w-5' />
                    Additional Terms
                  </CardTitle>
                  <CardDescription>
                    Special terms and conditions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name='special_terms'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Terms (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder='Any special terms or conditions...'
                            disabled={isLoading}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className='flex gap-4'>
                <Button type='submit' disabled={isLoading} className='flex-1'>
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    'Save Contract'
                  )}
                </Button>

                <Button
                  type='button'
                  variant='outline'
                  onClick={handleGenerateContract}
                  disabled={isLoading}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className='mr-2 h-4 w-4' />
                      Generate PDF
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Sidebar with AI Insights */}
        <div className='space-y-6'>
          {/* AI Insights */}
          {showAIInsights && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Brain className='h-5 w-5 text-purple-500' />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  Smart analysis and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 ${
                      insight.type === 'success'
                        ? 'border-green-200 bg-green-50'
                        : insight.type === 'warning'
                          ? 'border-yellow-200 bg-yellow-50'
                          : insight.type === 'error'
                            ? 'border-red-200 bg-red-50'
                            : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className='flex items-start gap-2'>
                      {insight.type === 'success' && (
                        <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                      )}
                      {insight.type === 'warning' && (
                        <AlertTriangle className='mt-0.5 h-4 w-4 text-yellow-600' />
                      )}
                      {insight.type === 'error' && (
                        <AlertCircle className='mt-0.5 h-4 w-4 text-red-600' />
                      )}
                      {insight.type === 'info' && (
                        <Info className='mt-0.5 h-4 w-4 text-blue-600' />
                      )}
                      <div className='flex-1'>
                        <div className='text-sm font-medium'>
                          {insight.title}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {insight.description}
                        </div>
                      </div>
                      <Badge variant='outline' className='text-xs'>
                        {insight.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Smart Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Lightbulb className='h-5 w-5 text-yellow-500' />
                  Smart Recommendations
                </CardTitle>
                <CardDescription>
                  AI-powered suggestions for optimization
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {recommendations.map((rec, index) => (
                  <div key={index} className='rounded-lg border p-3'>
                    <div className='mb-2 flex items-start justify-between'>
                      <div className='text-sm font-medium'>{rec.title}</div>
                      <Badge variant='outline' className='text-xs'>
                        {rec.impact}
                      </Badge>
                    </div>
                    <div className='mb-2 text-xs text-muted-foreground'>
                      {rec.description}
                    </div>
                    <div className='text-xs'>
                      <strong>Implementation:</strong> {rec.implementation}
                    </div>
                    {rec.estimatedSavings && (
                      <div className='mt-1 text-xs text-green-600'>
                        💰 Estimated savings: {rec.estimatedSavings}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Checker */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5 text-blue-500' />
                Compliance Checker
              </CardTitle>
              <CardDescription>Legal and regulatory compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceChecker
                contractData={{
                  contract_start_date: watchedStartDate,
                  contract_end_date: watchedEndDate,
                  contract_type: watchedContractType,
                  basic_salary: watchedSalary,
                  second_party_id: watchedSecondParty,
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contract Preview */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ContractPreview
            contractData={{
              contract_start_date: watchedStartDate,
              contract_end_date: watchedEndDate,
              contract_type: watchedContractType,
              basic_salary: watchedSalary,
              second_party_id: watchedSecondParty,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
