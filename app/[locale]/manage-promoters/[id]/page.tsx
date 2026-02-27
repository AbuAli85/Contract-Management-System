'use client'; // Using client component for potential future interactions and hooks

import type React from 'react';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PROMOTER_NOTIFICATION_DAYS } from '@/constants/notification-days';
import type {
  Promoter,
  Contract,
  PromoterSkill,
  PromoterExperience,
  PromoterEducation,
  PromoterDocument,
} from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import _Link from 'next/link';
import {
  UserCircle2Icon,
  FileTextIcon,
  BriefcaseIcon,
  ExternalLinkIcon,
  Loader2,
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  Upload,
  Eye,
  Download,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  AlertTriangle,
  Send,
  Archive,
  Building2,
  Activity,
} from 'lucide-react';
import { format, parseISO, isValid, parse } from 'date-fns';
import { getDocumentStatus } from '@/lib/document-status';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PromoterCVResume } from '@/components/promoter-cv-resume';
import { PromoterAttendance } from '@/components/promoter-attendance';
import { PromoterReports } from '@/components/promoter-reports';
import { PromoterRanking } from '@/components/promoter-ranking';
import { PromoterCRM } from '@/components/promoter-crm';
import DocumentUpload from '@/components/document-upload';

// Import enhanced components
import { PromoterDetailsEnhanced } from '@/components/promoters/promoter-details-enhanced';
import { PromoterDetailsSkeleton } from '@/components/promoters/promoter-details-skeleton';
import { PromoterGoalWidget } from '@/components/promoters/promoter-goal-widget';
import { PromoterPredictiveScore } from '@/components/promoters/promoter-predictive-score';
import { PromoterFinancialSummary } from '@/components/promoters/promoter-financial-summary';
import { PromoterDocumentHealth } from '@/components/promoters/promoter-document-health';
import { EmployerEmployeeManagementPanel } from '@/components/promoters/employer-employee-management-panel';
import { EmployeeTeamComparison } from '@/components/promoters/employee-team-comparison';
import { EmployeeSelfServicePortal } from '@/components/promoters/employee-self-service-portal';
import { logger } from '@/lib/utils/logger';

// Safe date parsing functions to prevent "Invalid time value" errors
const safeParseISO = (dateString: string | null | undefined): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;

  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  } catch (error) {
    logger.warn('Invalid ISO date string:', dateString, error);
  }

  // Try alternative parsing for common formats
  try {
    const formats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy'];
    for (const formatStr of formats) {
      const parsed = parse(dateString, formatStr, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    logger.warn(
      'Failed to parse date with alternative formats:',
      dateString,
      error
    );
  }

  return null;
};

const safeFormatDate = (
  dateString: string | null | undefined,
  formatStr: string = 'MMM dd, yyyy'
): string => {
  const date = safeParseISO(dateString);
  if (!date) return 'Invalid date';

  try {
    return format(date, formatStr);
  } catch (error) {
    logger.warn('Failed to format date:', date, error);
    return 'Invalid date';
  }
};

interface PromoterDetails extends Promoter {
  contracts: Contract[];
  employer?: {
    id: string;
    name_en: string;
    name_ar?: string;
    type: string;
  } | null;
}

function DetailItem({
  label,
  value,
  isRtl = false,
  className = '',
  labelClassName = 'text-sm text-muted-foreground',
  valueClassName = 'text-sm font-medium',
}: {
  label: string;
  value?: string | null | React.ReactNode;
  isRtl?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return null;
  }
  return (
    <div className={`flex flex-col gap-0.5 ${className || ''}`}>
      <p className={labelClassName}>{label}</p>
      {typeof value === 'string' ? (
        <p
          className={`${valueClassName} ${isRtl ? 'text-right' : ''}`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {value}
        </p>
      ) : (
        <div className={valueClassName}>{value}</div>
      )}
    </div>
  );
}

// Custom Document Status Component
function DocumentStatusDisplay({
  expiryDate,
  documentUrl,
  documentNumber,
  documentType: _documentType,
}: {
  expiryDate: string | null | undefined;
  documentUrl: string | null | undefined;
  documentNumber: string | null | undefined;
  documentType: 'id_card' | 'passport';
}) {
  const statusInfo = getDocumentStatus(expiryDate);

  // Determine if document is available (has URL or number)
  const hasDocument = documentUrl || documentNumber;

  return (
    <div className='flex items-center space-x-2 rounded-md border p-2 bg-gray-50'>
      <statusInfo.Icon
        className='h-5 w-5'
        style={{ color: statusInfo.colorClass }}
      />
      <div className='flex flex-col'>
        <span className='text-sm font-semibold'>
          {hasDocument ? statusInfo.text : 'No Document'}
        </span>
        <span className='text-xs text-gray-600'>
          {expiryDate
            ? `Expires: ${safeFormatDate(expiryDate, 'MMM dd, yyyy')}`
            : 'No expiry date'}
        </span>
      </div>
    </div>
  );
}

export default function PromoterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const promoterId = params?.id as string;
  const locale = params?.locale as string;

  const [promoterDetails, setPromoterDetails] =
    useState<PromoterDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [skills, setSkills] = useState<PromoterSkill[]>([]);
  const [experience, setExperience] = useState<PromoterExperience[]>([]);
  const [education, setEducation] = useState<PromoterEducation[]>([]);
  const [documents, setDocuments] = useState<PromoterDocument[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useEnhancedView, setUseEnhancedView] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  );
  const role = useUserRole();
  const { toast } = useToast();
  const [_currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isViewingOwnProfile, setIsViewingOwnProfile] = useState(false);



  // Get current user ID and check if viewing own profile
  useEffect(() => {
    async function getCurrentUser() {
      const supabase = createClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // Check if user is viewing their own profile
        const isOwnProfile =
          user.id === promoterId ||
          (promoterId &&
            user.id &&
            promoterId.startsWith(user.id.substring(0, 8))) ||
          (promoterId && user.id && user.id.startsWith(promoterId));
        setIsViewingOwnProfile(!!isOwnProfile);
      }
    }
    if (promoterId) {
      getCurrentUser();
    }
  }, [promoterId]);

  // Detect viewport size for responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewMode('mobile');
      } else if (width < 1024) {
        setViewMode('tablet');
      } else {
        setViewMode('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);




  async function handleDeletePromoter() {
    if (
      !confirm(
        'Are you sure you want to delete this promoter? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      // Use the API route which handles cascade deletion and auth
      const response = await fetch(`/api/promoters/${promoterId}`, {
        method: 'DELETE',
      });
      if (response.status === 401) {
        router.push(`/${locale}/auth/login`);
        return;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Delete failed: ${response.statusText}`);
      }
      // Redirect to promoters list
      router.push(`/${locale}/promoters`);
    }
  }

  async function handleToggleStatus() {
    if (!promoterDetails) return;

    setIsUpdatingStatus(true);
    try {
      const newStatus =
        promoterDetails.status === 'active' ? 'inactive' : 'active';
      // Use the API route which handles auth and audit logging
      const response = await fetch(`/api/promoters/${promoterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.status === 401) {
        router.push(`/${locale}/auth/login`);
        return;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Update failed: ${response.statusText}`);
      }
      // Update local state
      setPromoterDetails(prev =>
        prev ? { ...prev, status: newStatus } : null
      );
      toast({
        title: 'Status Updated',
        description: `Promoter status updated to ${newStatus}`,
      });
    }
  }

  useEffect(() => {
    if (!promoterId) return;

    async function fetchPromoterDetails() {
      setIsLoading(true);
      setError(null);

      try {
        // Use API route instead of direct Supabase call for proper RBAC and error handling
        const response = await fetch(`/api/promoters/${promoterId}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }));

          // Handle 404 - promoter not found
          if (response.status === 404) {
            setError(
              'Promoter not found. The record may not exist or you may not have permission to view it.'
            );
            setIsLoading(false);
            return;
          }

          // Handle 401/403 - unauthorized
          if (response.status === 401 || response.status === 403) {
            setError('You do not have permission to view this promoter.');
            setIsLoading(false);
            return;
          }

          setError(errorData.error || 'Failed to fetch promoter details.');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const promoterData = data.promoter || data;

        if (!promoterData) {
          setError('Promoter not found.');
          setIsLoading(false);
          return;
        }

        // Get tags from promoter_tags table if it exists
        const supabase = createClient();
        let tags: string[] = [];
        try {
          if (supabase) {
            const { data: tagsData, error: tagsError } = await supabase
              .from('promoter_tags')
              .select('tag')
              .eq('promoter_id', promoterId);

            if (!tagsError && tagsData) {
              tags = tagsData.map((t: any) => t.tag).filter(Boolean);
            }
          }
        } catch (error) {
          // If promoter_tags table doesn't exist, use empty array
          logger.log(
            'promoter_tags table not available, using empty tags array'
          );
        }

        // Fetch contracts using API or direct call
        let contracts: any[] = [];
        try {
          if (supabase) {
            const { data: contractsData, error: contractsError } =
              await supabase
                .from('contracts')
                .select('*')
                .eq('promoter_id', promoterId);

            if (!contractsError && contractsData) {
              contracts = contractsData;
            }
          }
        } catch (error) {
          logger.error('Error fetching contracts:', error);
          // Don't set error for contracts, just log it
        }

        // Employer info is already included in API response
        const employerInfo = data.employer || promoterData.employer || null;

        setPromoterDetails({
          ...promoterData,
          contracts: contracts || [],
          employer: employerInfo,
          name_en:
            promoterData.name_en ||
            [promoterData.first_name, promoterData.last_name]
              .filter(Boolean)
              .join(' '),
          name_ar: promoterData.name_ar || '',
          id_card_number: promoterData.id_card_number || '',
          tags,
        });
        setIsLoading(false);
      } catch (fetchError) {

        setError('Failed to load promoter details. Please try again.');
        setIsLoading(false);
      }
    }

    async function fetchAuditLogs() {
      if (role !== 'admin') return;
      const supabase = createClient();
      if (!supabase) return;
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'promoters')
        .eq('record_id', promoterId)
        .order('created_at', { ascending: false });
      if (!error && data) setAuditLogs(data);
    }

    async function fetchCVData() {
      if (!promoterId) return;

      // Fetch CV data in parallel without blocking main data loading
      const fetchPromises = [
        // Fetch skills
        fetch(`/api/promoters/${promoterId}/skills`)
          .then(response => (response.ok ? response.json() : null))
          .then(data => data?.skills || [])
          .catch(error => {
            logger.warn('Skills API not available:', error.message);
            return [];
          }),

        // Fetch experience
        fetch(`/api/promoters/${promoterId}/experience`)
          .then(response => (response.ok ? response.json() : null))
          .then(data => data?.experience || [])
          .catch(error => {
            logger.warn('Experience API not available:', error.message);
            return [];
          }),

        // Fetch education
        fetch(`/api/promoters/${promoterId}/education`)
          .then(response => (response.ok ? response.json() : null))
          .then(data => data?.education || [])
          .catch(error => {
            logger.warn('Education API not available:', error.message);
            return [];
          }),

        // Fetch documents
        fetch(`/api/promoters/${promoterId}/documents`)
          .then(response => (response.ok ? response.json() : null))
          .then(data => data?.documents || [])
          .catch(error => {
            logger.warn('Documents API not available:', error.message);
            return [];
          }),
      ];

      try {
        const [skillsData, experienceData, educationData, documentsData] =
          await Promise.all(fetchPromises);

        setSkills(skillsData);
        setExperience(experienceData);
        setEducation(educationData);
        setDocuments(documentsData);

        logger.log('CV data loaded successfully:', {
          skills: skillsData.length,
          experience: experienceData.length,
          education: educationData.length,
          documents: documentsData.length,
        });
      } catch (error) {
        logger.warn('Some CV data could not be loaded:', error);
        // Set empty arrays as fallback
        setSkills([]);
        setExperience([]);
        setEducation([]);
        setDocuments([]);
      }
    }

    // Load main data first (blocking)
    fetchPromoterDetails();
    fetchAuditLogs();

    // Load CV data separately (non-blocking)
    setTimeout(() => {
      fetchCVData();
    }, 100);
  }, [promoterId, role]);

  // Real-time subscriptions for live updates
  useEffect(() => {
    if (!promoterId) return;

    const supabase = createClient();
    if (!supabase) return;

    logger.log(
      '🔔 Setting up real-time subscriptions for promoter:',
      promoterId
    );

    // Subscribe to promoter updates
    const promoterChannel = supabase
      .channel(`promoter:${promoterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'promoters',
          filter: `id=eq.${promoterId}`,
        },
        payload => {
          logger.log('📝 Promoter updated in real-time:', payload.new);
          // Update local state with new data
          setPromoterDetails(prev =>
            prev ? { ...prev, ...payload.new } : null
          );
          // Show toast notification
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('toast', {
              detail: {
                title: 'Profile Updated',
                description: 'Promoter information has been updated',
                variant: 'default',
              },
            });
            window.dispatchEvent(event);
          }
        }
      )
      .subscribe();

    // Subscribe to contract changes for this promoter
    const contractsChannel = supabase
      .channel(`promoter-contracts:${promoterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts',
          filter: `promoter_id=eq.${promoterId}`,
        },
        payload => {
          logger.log('📄 Contract changed in real-time:', payload);
          // Refetch contracts to get updated data
          const supabaseClient = createClient();
          if (supabaseClient) {
            supabaseClient
              .from('contracts')
              .select('*')
              .eq('promoter_id', promoterId)
              .then(({ data, error }) => {
                if (!error && data) {
                  setPromoterDetails(prev =>
                    prev ? { ...prev, contracts: data } : null
                  );
                }
              });
          }
        }
      )
      .subscribe();

    // Subscribe to document changes
    const documentsChannel = supabase
      .channel(`promoter-documents:${promoterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promoter_documents',
          filter: `promoter_id=eq.${promoterId}`,
        },
        () => {
          logger.log('📎 Document changed, refetching...');
          // Refetch documents by calling the API endpoints
          Promise.all([
            fetch(`/api/promoters/${promoterId}/documents`)
              .then(r => (r.ok ? r.json() : null))
              .catch(() => null),
            fetch(`/api/promoters/${promoterId}/skills`)
              .then(r => (r.ok ? r.json() : null))
              .catch(() => null),
            fetch(`/api/promoters/${promoterId}/experience`)
              .then(r => (r.ok ? r.json() : null))
              .catch(() => null),
            fetch(`/api/promoters/${promoterId}/education`)
              .then(r => (r.ok ? r.json() : null))
              .catch(() => null),
          ]).then(([docsData, skillsData, expData, eduData]) => {
            if (docsData?.documents) setDocuments(docsData.documents);
            if (skillsData?.skills) setSkills(skillsData.skills);
            if (expData?.experience) setExperience(expData.experience);
            if (eduData?.education) setEducation(eduData.education);
          });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      logger.log('🧹 Cleaning up real-time subscriptions');
      supabase.removeChannel(promoterChannel);
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(documentsChannel);
    };
  }, [promoterId]);

  // Auto-refresh key metrics every 30 seconds
  useEffect(() => {
    if (!promoterId || isLoading) return;

    const interval = setInterval(() => {
      logger.log('🔄 Auto-refreshing promoter data...');
      // Silently refresh contracts and basic info
      const supabase = createClient();
      if (supabase) {
        supabase
          .from('contracts')
          .select('*')
          .eq('promoter_id', promoterId)
          .then(({ data, error }) => {
            if (!error && data) {
              setPromoterDetails(prev =>
                prev ? { ...prev, contracts: data } : null
              );
            }
          });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [promoterId, isLoading]);


  // Handle refresh - reload the page
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    window.location.reload();
  }, []);

  // Pre-compute performance metrics for PromoterGoalWidget (extracted from JSX to fix react-hooks/rules-of-hooks)
  const goalWidgetMetrics = useMemo(() => {
    const contracts = promoterDetails?.contracts || [];
    const activeContracts = contracts.filter(
      (c: any) => c.status === 'active'
    ).length;
    const completedContracts = contracts.filter(
      (c: any) => c.status === 'completed'
    ).length;
    const totalContracts = contracts.length;
    const contractCompletionRate =
      totalContracts > 0
        ? Math.round((completedContracts / totalContracts) * 100)
        : 0;
    const rating = promoterDetails?.rating || 0;
    const customerSatisfaction = rating > 0 ? Math.round(rating * 20) : 85;
    const overallScore = Math.round(
      contractCompletionRate * 0.4 +
        customerSatisfaction * 0.3 +
        (promoterDetails?.status === 'active' ? 30 : 0)
    );
    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      attendanceRate: 90,
      taskCompletion: contractCompletionRate,
      customerSatisfaction,
      totalTasks: totalContracts,
      completedTasks: completedContracts,
      activeContracts,
    };
  }, [promoterDetails]);

  // Pre-compute performance metrics for PromoterPredictiveScore (extracted from JSX to fix react-hooks/rules-of-hooks)
  const predictiveScoreMetrics = useMemo(() => {
    const contracts = promoterDetails?.contracts || [];
    const completedContracts = contracts.filter(
      (c: any) => c.status === 'completed'
    ).length;
    const totalContracts = contracts.length;
    const contractCompletionRate =
      totalContracts > 0
        ? Math.round((completedContracts / totalContracts) * 100)
        : 0;
    const rating = promoterDetails?.rating || 0;
    const customerSatisfaction = rating > 0 ? Math.round(rating * 20) : 85;
    const overallScore = Math.round(
      contractCompletionRate * 0.4 + customerSatisfaction * 0.3
    );
    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      attendanceRate: 90,
      taskCompletion: contractCompletionRate,
      customerSatisfaction,
      totalTasks: totalContracts,
      completedTasks: completedContracts,
      activeContracts: contracts.filter((c: any) => c.status === 'active')
        .length,
    };
  }, [promoterDetails]);

  // Pre-compute performance score for EmployeeTeamComparison (extracted from JSX to fix react-hooks/rules-of-hooks)
  const teamComparisonScore = useMemo(() => {
    const contracts = promoterDetails?.contracts || [];
    const completed = contracts.filter(
      (c: any) => c.status === 'completed'
    ).length;
    const total = contracts.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [promoterDetails?.contracts]);

  if (isLoading) {
    return useEnhancedView ? (
      <PromoterDetailsSkeleton />
    ) : (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
        <span className='ml-2'>Loading promoter...</span>
      </div>
    );
  }

  if (error || !promoterDetails) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <p className='mb-4 text-red-600'>{error || 'Promoter not found'}</p>
          <Button onClick={() => router.push(`/${locale}/promoters`)}>
            Back to Promoters
          </Button>
        </div>
      </div>
    );
  }

  // Use enhanced view if enabled
  if (useEnhancedView) {
    // For employees viewing their own profile, show only the employee portal
    if (
      isViewingOwnProfile &&
      (role === 'promoter' || role === 'user' || role === 'employee') &&
      promoterDetails
    ) {
      return (
        <div className='container mx-auto py-6'>
          <EmployeeSelfServicePortal
            promoterId={promoterId}
            promoterDetails={promoterDetails}
            locale={locale}
          />
        </div>
      );
    }

    // For employers/admins, show the full enhanced view
    return (
      <PromoterDetailsEnhanced
        promoterDetails={promoterDetails}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        onRefresh={handleRefresh}
      />
    );
  }

  // For employees viewing their own profile, show only the employee portal
  if (
    isViewingOwnProfile &&
    (role === 'promoter' || role === 'user' || role === 'employee') &&
    promoterDetails
  ) {
    return (
      <div className='container mx-auto py-6'>
        <EmployeeSelfServicePortal
          promoterId={promoterId}
          promoterDetails={promoterDetails}
          locale={locale}
        />
      </div>
    );
  }

  // For employers/admins, show the full detailed view
  return (
    <div
      className={`container mx-auto space-y-6 py-6 ${viewMode === 'mobile' ? 'px-4' : ''}`}
    >
      {/* Breadcrumb */}
      <nav className='flex items-center gap-1.5 text-sm text-muted-foreground' aria-label='Breadcrumb'>
        <button
          onClick={() => router.push(`/${locale}/promoters`)}
          className='hover:text-foreground transition-colors font-medium hover:underline'
        >
          Promoters
        </button>
        <span aria-hidden='true'>/</span>
        <span className='text-foreground font-semibold truncate max-w-[240px]'>
          {promoterDetails?.name_en || 'Profile'}
        </span>
      </nav>

      {/* Enhanced Header with Predictive Score */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center gap-4 flex-1 min-w-0'>
          <Avatar className='h-14 w-14 flex-shrink-0 ring-2 ring-offset-2 ring-primary/20'>
            <AvatarImage
              src={promoterDetails?.profile_picture_url || undefined}
              alt={promoterDetails?.name_en || ''}
            />
            <AvatarFallback className='text-lg font-bold bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700'>
              {promoterDetails?.name_en?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <div className='flex items-center gap-3 flex-wrap'>
              <h1
                className={`font-bold text-gray-900 ${viewMode === 'mobile' ? 'text-2xl' : 'text-3xl'}`}
              >
                {promoterDetails?.name_en}
              </h1>
              {promoterDetails?.name_ar && (
                <span className='text-base text-muted-foreground font-medium' dir='rtl'>
                  {promoterDetails.name_ar}
                </span>
              )}
            </div>
            <div className='flex items-center gap-2 mt-1.5 flex-wrap'>
              <Badge
                variant={
                  promoterDetails?.status === 'active' ? 'default' : 'secondary'
                }
                className='capitalize'
              >
                {promoterDetails?.status}
              </Badge>
              {promoterDetails?.job_title && (
                <span className='text-sm text-muted-foreground'>
                  {promoterDetails.job_title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1 bg-gray-100 rounded-lg p-1'>
            <Button
              variant={viewMode === 'desktop' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('desktop')}
              className='h-8 w-8 p-0'
            >
              <Monitor className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'tablet' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('tablet')}
              className='h-8 w-8 p-0'
            >
              <Tablet className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('mobile')}
              className='h-8 w-8 p-0'
            >
              <Smartphone className='h-4 w-4' />
            </Button>
          </div>

          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='flex items-center gap-2'
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {viewMode === 'mobile' ? '' : 'Refresh'}
          </Button>

          <Button
            variant='outline'
            onClick={() => setUseEnhancedView(!useEnhancedView)}
            className='flex items-center gap-2'
          >
            {useEnhancedView ? 'Classic View' : 'Enhanced View'}
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className={`flex flex-wrap gap-2 ${viewMode === 'mobile' ? 'justify-center' : 'justify-end'}`}
      >
        <Button
          variant='outline'
          onClick={() => router.back()}
          size={viewMode === 'mobile' ? 'sm' : 'default'}
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          {viewMode === 'mobile' ? 'Back' : 'Back to List'}
        </Button>
        {role === 'admin' && (
          <>
            <Button
              onClick={() =>
                router.push(`/${locale}/manage-promoters/${promoterId}/edit`)
              }
              size={viewMode === 'mobile' ? 'sm' : 'default'}
            >
              <Edit className='mr-2 h-4 w-4' />
              {viewMode === 'mobile' ? 'Edit' : 'Edit Profile'}
            </Button>
            <Button
              variant='outline'
              onClick={() => router.push(`/${locale}/manage-promoters/new`)}
              size={viewMode === 'mobile' ? 'sm' : 'default'}
            >
              <Plus className='mr-2 h-4 w-4' />
              {viewMode === 'mobile' ? 'New' : 'Add New'}
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeletePromoter}
              disabled={isDeleting}
              size={viewMode === 'mobile' ? 'sm' : 'default'}
            >
              {isDeleting ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='mr-2 h-4 w-4' />
              )}
              {viewMode === 'mobile' ? 'Delete' : 'Delete Promoter'}
            </Button>
          </>
        )}
      </div>


      {/* TWO-COLUMN INTELLIGENT DASHBOARD LAYOUT */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* LEFT COLUMN - Primary Content (2/3 width) */}
        <div className='lg:col-span-2 space-y-6'>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='space-y-6'
          >
            <TabsList
              className={`grid w-full ${viewMode === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'}`}
            >
              <TabsTrigger
                value='personal'
                className={viewMode === 'mobile' ? 'text-xs' : ''}
              >
                {viewMode === 'mobile' ? 'Personal' : 'Personal Info'}
              </TabsTrigger>
              <TabsTrigger
                value='professional'
                className={viewMode === 'mobile' ? 'text-xs' : ''}
              >
                {viewMode === 'mobile' ? 'Professional' : 'Professional'}
              </TabsTrigger>
              <TabsTrigger
                value='advanced'
                className={viewMode === 'mobile' ? 'text-xs' : ''}
              >
                {viewMode === 'mobile' ? 'Performance' : 'Performance & Skills'}
              </TabsTrigger>
              <TabsTrigger
                value='activity'
                className={viewMode === 'mobile' ? 'text-xs' : ''}
              >
                {viewMode === 'mobile' ? 'Activity' : 'Activity'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value='personal' className='space-y-6'>
              {/* Goal Tracking & Progress Widget */}
              <PromoterGoalWidget
                promoterId={promoterId}
                performanceMetrics={goalWidgetMetrics}
                isAdmin={role === 'admin'}
              />

              {/* Personal Information Section */}
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle className='flex items-center gap-2'>
                        <UserCircle2Icon className='h-5 w-5' />
                        Personal Information
                      </CardTitle>
                      <CardDescription>
                        Basic personal details and contact information
                      </CardDescription>
                    </div>
                    {role === 'admin' && (
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            router.push(
                              `/${locale}/manage-promoters/${promoterId}/edit`
                            )
                          }
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          Edit Personal Info
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            router.push(
                              `/${locale}/manage-promoters/${promoterId}`
                            )
                          }
                        >
                          <UserCircle2Icon className='mr-2 h-4 w-4' />
                          View Full Profile
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`flex ${viewMode === 'mobile' ? 'flex-col items-center text-center space-y-4' : 'items-start space-x-6'}`}
                  >
                    <Avatar
                      className={`${viewMode === 'mobile' ? 'h-20 w-20' : 'h-24 w-24'}`}
                    >
                      <AvatarImage
                        src={promoterDetails?.profile_picture_url || undefined}
                        alt={promoterDetails?.name_en || ''}
                      />
                      <AvatarFallback>
                        {promoterDetails?.name_en?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex-1 space-y-4 ${viewMode === 'mobile' ? 'text-center' : ''}`}
                    >
                      <div>
                        <h2 className='text-2xl font-semibold'>
                          {promoterDetails?.name_en}
                        </h2>
                        <p className='text-lg text-muted-foreground'>
                          {promoterDetails?.name_ar}
                        </p>
                        <div className='mt-2 flex items-center gap-2'>
                          <Badge
                            variant={
                              promoterDetails?.status === 'active'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {promoterDetails?.status}
                          </Badge>
                          {role === 'admin' && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={handleToggleStatus}
                              disabled={isUpdatingStatus}
                            >
                              {isUpdatingStatus ? (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              ) : (
                                <Edit className='mr-2 h-4 w-4' />
                              )}
                              Toggle Status
                            </Button>
                          )}
                        </div>
                      </div>
                      <div
                        className={`grid grid-cols-1 gap-4 ${viewMode === 'mobile' ? 'grid-cols-1' : 'md:grid-cols-2'}`}
                      >
                        <DetailItem
                          label='Email'
                          value={promoterDetails?.email}
                        />
                        <DetailItem
                          label='Phone'
                          value={promoterDetails?.phone}
                        />
                        <DetailItem
                          label='Mobile'
                          value={promoterDetails?.mobile_number}
                        />
                        <DetailItem
                          label='Nationality'
                          value={promoterDetails?.nationality}
                        />
                        <DetailItem
                          label='Date of Birth'
                          value={promoterDetails?.date_of_birth}
                        />
                        <DetailItem
                          label='Gender'
                          value={promoterDetails?.gender}
                        />
                        <DetailItem
                          label='Work Location'
                          value={(promoterDetails as any)?.work_location}
                        />
                        <DetailItem
                          label='Department'
                          value={promoterDetails?.department}
                        />
                        <DetailItem
                          label='Emergency Contact'
                          value={(promoterDetails as any)?.emergency_contact_name || promoterDetails?.emergency_contact}
                        />
                        <DetailItem
                          label='Emergency Phone'
                          value={(promoterDetails as any)?.emergency_contact_phone || promoterDetails?.emergency_phone}
                        />
                      </div>
                      {((promoterDetails as any)?.tags?.length > 0) && (
                        <div className='flex flex-wrap gap-1 mt-2'>
                          {((promoterDetails as any).tags as string[]).map((tag: string) => (
                            <Badge key={tag} variant='secondary' className='text-xs'>{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Information Section */}
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle className='flex items-center gap-2'>
                        <FileTextIcon className='h-5 w-5' />
                        Document Information
                      </CardTitle>
                      <CardDescription>
                        Identity documents and their status
                      </CardDescription>
                    </div>
                    {role === 'admin' && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setShowDocumentUpload(!showDocumentUpload)
                        }
                      >
                        <Upload className='mr-2 h-4 w-4' />
                        {showDocumentUpload
                          ? 'Hide Upload'
                          : 'Upload Documents'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>ID Card</span>
                        <DocumentStatusDisplay
                          expiryDate={promoterDetails?.id_card_expiry_date}
                          documentUrl={promoterDetails?.id_card_url}
                          documentNumber={promoterDetails?.id_card_number}
                          documentType='id_card'
                        />
                      </div>
                      <DetailItem
                        label='ID Number'
                        value={promoterDetails?.id_card_number}
                      />
                      {promoterDetails?.id_card_expiry_date && (
                        <p className='text-xs text-muted-foreground'>
                          Expires:{' '}
                          {safeFormatDate(
                            promoterDetails.id_card_expiry_date,
                            'MMM dd, yyyy'
                          )}
                        </p>
                      )}
                      {promoterDetails?.id_card_url && (
                        <div className='flex gap-2 mt-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              window.open(
                                promoterDetails.id_card_url!,
                                '_blank'
                              )
                            }
                          >
                            <Eye className='h-4 w-4 mr-1' />
                            View ID
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = promoterDetails.id_card_url!;
                              link.download = 'ID_Card_Document';
                              link.click();
                            }}
                          >
                            <Download className='h-4 w-4 mr-1' />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>Passport</span>
                        <DocumentStatusDisplay
                          expiryDate={promoterDetails?.passport_expiry_date}
                          documentUrl={promoterDetails?.passport_url}
                          documentNumber={promoterDetails?.passport_number}
                          documentType='passport'
                        />
                      </div>
                      <DetailItem
                        label='Passport Number'
                        value={
                          promoterDetails?.passport_number || 'Not provided'
                        }
                      />
                      {promoterDetails?.passport_expiry_date && (
                        <p className='text-xs text-muted-foreground'>
                          Expires:{' '}
                          {safeFormatDate(
                            promoterDetails.passport_expiry_date,
                            'MMM dd, yyyy'
                          )}
                        </p>
                      )}
                      {!promoterDetails?.passport_url &&
                        !promoterDetails?.passport_number && (
                          <p className='text-xs text-amber-600'>
                            ⚠️ No passport information available
                          </p>
                        )}
                      {promoterDetails?.passport_url && (
                        <div className='flex gap-2 mt-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              window.open(
                                promoterDetails.passport_url!,
                                '_blank'
                              )
                            }
                          >
                            <Eye className='h-4 w-4 mr-1' />
                            View Passport
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = promoterDetails.passport_url!;
                              link.download = 'Passport_Document';
                              link.click();
                            }}
                          >
                            <Download className='h-4 w-4 mr-1' />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  {showDocumentUpload && role === 'admin' && (
                    <div className='mt-6 space-y-4'>
                      <Separator />
                      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                        <DocumentUpload
                          promoterId={promoterId}
                          documentType='id_card'
                          currentUrl={promoterDetails?.id_card_url ?? null}
                          onUploadComplete={url => {
                            setPromoterDetails(prev =>
                              prev ? { ...prev, id_card_url: url } : null
                            );
                            setShowDocumentUpload(false);
                          }}
                          onDelete={() => {
                            setPromoterDetails(prev =>
                              prev ? { ...prev, id_card_url: null } : null
                            );
                          }}
                        />
                        <DocumentUpload
                          promoterId={promoterId}
                          documentType='passport'
                          currentUrl={promoterDetails?.passport_url ?? null}
                          onUploadComplete={url => {
                            setPromoterDetails(prev =>
                              prev ? { ...prev, passport_url: url } : null
                            );
                            setShowDocumentUpload(false);
                          }}
                          onDelete={() => {
                            setPromoterDetails(prev =>
                              prev ? { ...prev, passport_url: null } : null
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Personal Details</CardTitle>
                  <CardDescription>
                    Other personal information and notes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <DetailItem
                      label='National ID'
                      value={promoterDetails?.national_id}
                    />
                    <DetailItem label='CRN' value={promoterDetails?.crn} />
                    <DetailItem
                      label='Marital Status'
                      value={promoterDetails?.marital_status}
                    />
                    <DetailItem label='Notes' value={promoterDetails?.notes} />
                    <DetailItem
                      label='Created Date'
                      value={safeFormatDate(
                        promoterDetails?.created_at,
                        'MMM dd, yyyy'
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='professional' className='space-y-6'>
              {/* Orphaned Promoter Warning */}
              {promoterDetails?.employer_id &&
                (!promoterDetails?.contracts ||
                  promoterDetails.contracts.length === 0) && (
                  <Alert variant='destructive'>
                    <AlertTriangle className='h-4 w-4' />
                    <AlertTitle>
                      Data Integrity Issue: No Contract Found
                    </AlertTitle>
                    <AlertDescription className='space-y-2'>
                      <p>
                        This promoter is assigned to an employer but has no
                        contract on file. This is a data integrity issue that
                        should be resolved.
                      </p>
                      <div className='flex gap-2 mt-2'>
                        <Button
                          size='sm'
                          onClick={() =>
                            router.push(
                              `/${locale}/generate-contract?promoter=${promoterId}`
                            )
                          }
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          Create Contract Now
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={async () => {
                            if (
                              confirm(
                                'Remove employer assignment from this promoter?'
                              )
                            ) {
                              const supabase = createClient();
                              if (!supabase) {
                                toast({
                                  variant: 'destructive',
                                  title: 'Connection Error',
                                  description:
                                    'Failed to initialize database connection.',
                                });
                                return;
                              }

                              try {
                                const { error } = await supabase
                                  .from('promoters')
                                  .update({ employer_id: null })
                                  .eq('id', promoterId);

                                if (error) {
                                  toast({
                                    variant: 'destructive',
                                    title: 'Update Failed',
                                    description: `Failed to update: ${error.message}`,
                                  });
                                } else {
                                  toast({
                                    title: 'Assignment Removed',
                                    description:
                                      'Employer assignment has been removed successfully.',
                                  });
                                  window.location.reload();
                                }
                              } catch (err: unknown) {
                                const message =
                                  err instanceof Error
                                    ? err.message
                                    : 'Unknown error';
                                toast({
                                  variant: 'destructive',
                                  title: 'Update Failed',
                                  description: `Failed to update: ${message}`,
                                });
                              }
                            }
                          }}
                        >
                          Remove Assignment
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

              {/* Contract Information Section */}
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle className='flex items-center gap-2'>
                        <BriefcaseIcon className='h-5 w-5' />
                        Contract Information
                      </CardTitle>
                      <CardDescription>
                        Current and historical contract details
                      </CardDescription>
                    </div>
                    {role === 'admin' && (
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            router.push(
                              `/${locale}/contracts?promoter=${promoterId}`
                            )
                          }
                        >
                          <ExternalLinkIcon className='mr-2 h-4 w-4' />
                          View All Contracts
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            router.push(
                              `/${locale}/generate-contract?promoter=${promoterId}`
                            )
                          }
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          New Contract
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`grid grid-cols-1 gap-6 ${viewMode === 'mobile' ? 'grid-cols-1' : 'md:grid-cols-3'}`}
                  >
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {promoterDetails?.contracts?.filter(
                          c => c.status === 'active'
                        ).length || 0}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Active Contracts
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {promoterDetails?.contracts?.filter(
                          c => c.status === 'completed'
                        ).length || 0}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Completed Contracts
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-orange-600'>
                        {promoterDetails?.contracts?.length || 0}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Total Contracts
                      </div>
                    </div>
                  </div>

                  {promoterDetails?.contracts &&
                    promoterDetails.contracts.length > 0 && (
                      <div className='mt-6'>
                        <h4 className='mb-3 text-sm font-medium'>
                          Recent Contracts
                        </h4>
                        <div className='space-y-2'>
                          {promoterDetails.contracts
                            .slice(0, 3)
                            .map(contract => (
                              <div
                                key={contract.id}
                                className='flex items-center justify-between rounded-lg border p-3'
                              >
                                <div>
                                  <p className='font-medium'>
                                    {contract.title || 'Contract'}
                                  </p>
                                  <p className='text-sm text-muted-foreground'>
                                    {contract.start_date &&
                                      safeFormatDate(
                                        contract.start_date,
                                        'MMM dd, yyyy'
                                      )}{' '}
                                    -
                                    {contract.end_date &&
                                      safeFormatDate(
                                        contract.end_date,
                                        'MMM dd, yyyy'
                                      )}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    contract.status === 'active'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {contract.status}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Working Status Section */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <UserCircle2Icon className='h-5 w-5' />
                    Working Status
                  </CardTitle>
                  <CardDescription>
                    Current availability and work status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`grid grid-cols-1 gap-4 ${viewMode === 'mobile' ? 'grid-cols-1' : 'md:grid-cols-3'}`}
                  >
                    <div className='text-center'>
                      <div className='text-lg font-semibold'>
                        {promoterDetails?.status === 'active'
                          ? 'Available'
                          : 'Not Available'}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Current Status
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-semibold'>
                        {promoterDetails?.contracts?.filter(
                          c => c.status === 'active'
                        ).length || 0}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Current Assignments
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-semibold'>
                        {promoterDetails?.rating || 'N/A'}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Performance Rating
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle>Professional Information</CardTitle>
                      <CardDescription>
                        Job details and professional background
                      </CardDescription>
                    </div>
                    {role === 'admin' && (
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            router.push(
                              `/${locale}/manage-promoters/${promoterId}/edit`
                            )
                          }
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          Edit Professional Info
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <DetailItem
                      label='Job Title'
                      value={promoterDetails?.job_title}
                    />
                    <DetailItem
                      label='Employer'
                      value={
                        promoterDetails?.employer ? (
                          <div className='flex flex-col'>
                            <span className='font-medium'>
                              {promoterDetails.employer.name_en}
                            </span>
                            {promoterDetails.employer.name_ar && (
                              <span className='text-xs text-muted-foreground'>
                                {promoterDetails.employer.name_ar}
                              </span>
                            )}
                            <Badge variant='outline' className='w-fit mt-1'>
                              {promoterDetails.employer.type}
                            </Badge>
                          </div>
                        ) : (
                          promoterDetails?.company || 'Not assigned'
                        )
                      }
                    />
                    <DetailItem
                      label='Department'
                      value={promoterDetails?.department}
                    />
                    <DetailItem
                      label='Specialization'
                      value={promoterDetails?.specialization}
                    />
                    <DetailItem
                      label='Experience Years'
                      value={promoterDetails?.experience_years}
                    />
                    <DetailItem
                      label='Education Level'
                      value={promoterDetails?.education_level}
                    />
                    <DetailItem
                      label='University'
                      value={promoterDetails?.university}
                    />
                    <DetailItem
                      label='Graduation Year'
                      value={promoterDetails?.graduation_year}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* CV/Resume Section */}
              <PromoterCVResume
                promoterId={promoterId}
                skills={skills}
                setSkills={setSkills}
                experience={experience}
                setExperience={setExperience}
                education={education}
                setEducation={setEducation}
                documents={documents}
                setDocuments={setDocuments}
                isAdmin={role === 'admin'}
              />
            </TabsContent>

            <TabsContent value='advanced' className='space-y-6'>
              {/* Attendance Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance & Performance</CardTitle>
                  <CardDescription>
                    Track attendance and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PromoterAttendance
                    promoterId={promoterId}
                    isAdmin={role === 'admin'}
                  />
                </CardContent>
              </Card>

              {/* Reports Section */}
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle>Reports & Analytics</CardTitle>
                      <CardDescription>
                        Detailed reports and performance analytics
                      </CardDescription>
                    </div>
                    {role === 'admin' && (
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            router.push(`/${locale}/promoter-analysis`)
                          }
                        >
                          <ExternalLinkIcon className='mr-2 h-4 w-4' />
                          View Analytics Dashboard
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => window.print()}
                        >
                          <FileTextIcon className='mr-2 h-4 w-4' />
                          Export Report
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <PromoterReports
                    promoterId={promoterId}
                    isAdmin={role === 'admin'}
                  />
                </CardContent>
              </Card>

              {/* Ranking Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Ranking</CardTitle>
                  <CardDescription>
                    Performance rankings and comparisons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PromoterRanking
                    promoterId={promoterId}
                    isAdmin={role === 'admin'}
                  />
                </CardContent>
              </Card>

              {/* CRM Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Relationship Management</CardTitle>
                  <CardDescription>
                    CRM data and customer interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PromoterCRM
                    promoterId={promoterId}
                    isAdmin={role === 'admin'}
                  />
                </CardContent>
              </Card>

              {/* Note: Financial Information moved to Right Sidebar */}

              {/* Skills & Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Certifications</CardTitle>
                  <CardDescription>
                    Professional skills and certifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <DetailItem
                      label='Skills'
                      value={promoterDetails?.skills}
                    />
                    <DetailItem
                      label='Certifications'
                      value={promoterDetails?.certifications}
                    />
                    <DetailItem
                      label='Availability'
                      value={promoterDetails?.availability}
                    />
                    <DetailItem
                      label='Preferred Language'
                      value={promoterDetails?.preferred_language}
                    />
                    <DetailItem
                      label='Timezone'
                      value={promoterDetails?.timezone}
                    />
                    <DetailItem
                      label='Special Requirements'
                      value={promoterDetails?.special_requirements}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contract & Compensation Details */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BriefcaseIcon className='h-5 w-5' />
                    Contract &amp; Compensation
                  </CardTitle>
                  <CardDescription>Employment terms and salary details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <DetailItem
                      label='Work Location'
                      value={(promoterDetails as any)?.work_location}
                    />
                    <DetailItem
                      label='Monthly Salary'
                      value={(promoterDetails as any)?.salary
                        ? `${Number((promoterDetails as any).salary).toLocaleString()} ${(promoterDetails as any)?.currency || 'OMR'}`
                        : undefined}
                    />
                    <DetailItem
                      label='Contract Start Date'
                      value={(promoterDetails as any)?.contract_start_date
                        ? new Date((promoterDetails as any).contract_start_date).toLocaleDateString()
                        : undefined}
                    />
                    <DetailItem
                      label='Contract End Date'
                      value={(promoterDetails as any)?.contract_end_date
                        ? new Date((promoterDetails as any).contract_end_date).toLocaleDateString()
                        : undefined}
                    />
                    <DetailItem
                      label='Emergency Contact Name'
                      value={(promoterDetails as any)?.emergency_contact_name}
                    />
                    <DetailItem
                      label='Emergency Contact Phone'
                      value={(promoterDetails as any)?.emergency_contact_phone}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='activity' className='space-y-6'>
              {/* Activity Timeline Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>
                    Recent activities and changes for this promoter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {role === 'admin' ? (
                    <div className='space-y-4'>
                      {auditLogs.length === 0 && (
                        <div className='flex flex-col items-center justify-center py-10 text-center gap-3'>
                          <div className='h-12 w-12 rounded-full bg-muted flex items-center justify-center'>
                            <Activity className='h-6 w-6 text-muted-foreground' />
                          </div>
                          <div>
                            <p className='text-sm font-medium'>No activity recorded yet</p>
                            <p className='text-xs text-muted-foreground mt-1'>Changes to this promoter&apos;s record will appear here.</p>
                          </div>
                        </div>
                      )}
                      {auditLogs.map(log => (
                        <div
                          key={log.id}
                          className='flex items-start space-x-3 rounded-lg border p-3'
                        >
                          <div className='mt-2 h-2 w-2 rounded-full bg-blue-500'></div>
                          <div className='flex-1'>
                            <p className='text-sm font-medium'>{log.action}</p>
                            <p className='text-xs text-muted-foreground'>
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                            {log.new_values && (
                              <p className='mt-1 text-xs text-muted-foreground'>
                                Changes: {JSON.stringify(log.new_values)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-muted-foreground'>
                      Activity timeline is restricted to administrators.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COLUMN - Fixed Sidebar (1/3 width) */}
        <aside className='lg:col-span-1 space-y-6'>
          {/* Predictive Performance Score */}
          <PromoterPredictiveScore
            performanceMetrics={predictiveScoreMetrics}
            contracts={promoterDetails?.contracts || []}
            documentsCompliant={
              !!(
                promoterDetails?.id_card_number &&
                promoterDetails?.id_card_expiry_date &&
                new Date(promoterDetails.id_card_expiry_date) > new Date() &&
                promoterDetails?.passport_number &&
                promoterDetails?.passport_expiry_date &&
                new Date(promoterDetails.passport_expiry_date) > new Date()
              )
            }
            lastActive={
              promoterDetails?.updated_at ||
              promoterDetails?.created_at ||
              undefined
            }
          />

          {/* Financial & Payout Summary */}
          <PromoterFinancialSummary
            promoterId={promoterId}
            contracts={promoterDetails?.contracts || []}
            isAdmin={
              role === 'admin' || role === 'employer' || role === 'manager'
            }
            onProcessPayment={amount => {
              // Payment processing via payment gateway integration
              toast({
                title: 'Payment Processing',
                description: `Payment of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)} queued for processing. Full payment integration coming soon.`,
              });
            }}
          />

          {/* Team Comparison - For Employers */}
          {(role === 'admin' || role === 'employer' || role === 'manager') && (
            <EmployeeTeamComparison
              promoterId={promoterId}
              employerId={promoterDetails?.employer_id || undefined}
              contracts={promoterDetails?.contracts || []}
              performanceScore={teamComparisonScore}
            />
          )}

          {/* Document Health Summary */}
          <PromoterDocumentHealth
            documents={{
              idCard: {
                number: promoterDetails?.id_card_number || undefined,
                expiryDate: promoterDetails?.id_card_expiry_date || undefined,
                url: promoterDetails?.id_card_url || undefined,
                status: (() => {
                  if (!promoterDetails?.id_card_expiry_date) return 'missing';
                  const expiry = new Date(promoterDetails.id_card_expiry_date);
                  const now = new Date();
                  const daysUntilExpiry = Math.ceil(
                    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  if (daysUntilExpiry < 0) return 'expired';
                  if (daysUntilExpiry <= 30) return 'expiring';
                  return 'valid';
                })(),
              },
              passport: {
                number: promoterDetails?.passport_number || undefined,
                expiryDate: promoterDetails?.passport_expiry_date || undefined,
                url: promoterDetails?.passport_url || undefined,
                status: (() => {
                  if (!promoterDetails?.passport_expiry_date) return 'missing';
                  const expiry = new Date(promoterDetails.passport_expiry_date);
                  const now = new Date();
                  const daysUntilExpiry = Math.ceil(
                    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  if (daysUntilExpiry < 0) return 'expired';
                  if (daysUntilExpiry <= 30) return 'expiring';
                  return 'valid';
                })(),
              },
            }}
            onUpload={_type => setShowDocumentUpload(true)}
            onView={type => {
              const url =
                type === 'id_card'
                  ? promoterDetails?.id_card_url
                  : promoterDetails?.passport_url;
              if (url) window.open(url, '_blank');
            }}
            onDownload={type => {
              const url =
                type === 'id_card'
                  ? promoterDetails?.id_card_url
                  : promoterDetails?.passport_url;
              if (url) {
                const link = document.createElement('a');
                link.href = url;
                link.download = `${type}_document`;
                link.click();
              }
            }}
            isAdmin={role === 'admin'}
          />

          {/* Employer Employee Management Panel */}
          {(role === 'admin' || role === 'employer' || role === 'manager') && (
            <EmployerEmployeeManagementPanel
              promoterId={promoterId}
              promoterName={promoterDetails?.name_en || 'Employee'}
              currentStatus={promoterDetails?.status || 'active'}
              employerId={promoterDetails?.employer_id || undefined}
              contracts={promoterDetails?.contracts || []}
              isAdmin={role === 'admin'}
              locale={locale}
            />
          )}

          {/* Quick Actions - For admins only */}
          {role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base flex items-center gap-2'>
                  <BriefcaseIcon className='h-5 w-5' />
                  Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <Button
                  variant='default'
                  size='sm'
                  className='w-full justify-start'
                  onClick={() =>
                    router.push(
                      `/${locale}/manage-promoters/${promoterId}/edit`
                    )
                  }
                >
                  <Edit className='mr-2 h-4 w-4' />
                  Edit Profile
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                  onClick={() =>
                    router.push(`/${locale}/contracts?promoter=${promoterId}`)
                  }
                >
                  <ExternalLinkIcon className='mr-2 h-4 w-4' />
                  View Contracts
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                  onClick={() => router.push(`/${locale}/promoter-analysis`)}
                >
                  <FileTextIcon className='mr-2 h-4 w-4' />
                  View Analytics Dashboard
                </Button>
                <Separator className='my-1' />
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200'
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/promoters/${promoterId}/notify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'standard', promoterName: promoterDetails?.name_en, email: promoterDetails?.email }),
                      });
                      if (!res.ok) throw new Error('Failed');
                      toast({ title: 'Notification sent', description: `A notification was sent to ${promoterDetails?.name_en}.` });
                    } catch {
                      toast({ variant: 'destructive', title: 'Failed', description: 'Could not send notification.' });
                    }
                  }}
                >
                  <Send className='mr-2 h-4 w-4' />
                  Send Notification
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30'
                  onClick={async () => {
                    if (!confirm(`Archive ${promoterDetails?.name_en}? They will be hidden from the active list.`)) return;
                    try {
                      const res = await fetch(`/api/promoters/${promoterId}/archive`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ archived: true }),
                      });
                      if (!res.ok) throw new Error('Failed');
                      toast({ title: 'Archived', description: `${promoterDetails?.name_en} has been archived.` });
                      router.push(`/${locale}/promoters`);
                    } catch {
                      toast({ variant: 'destructive', title: 'Failed', description: 'Could not archive this promoter.' });
                    }
                  }}
                >
                  <Archive className='mr-2 h-4 w-4' />
                  Archive Promoter
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
