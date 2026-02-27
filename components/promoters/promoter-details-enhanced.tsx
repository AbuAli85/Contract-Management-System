'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Import our new enhanced components
import { PromoterDetailsHeader } from './promoter-details-header';
import { PromoterPerformanceMetrics } from './promoter-performance-metrics';
import { PromoterDocumentHealth } from './promoter-document-health';
import { PromoterActivityTimeline } from './promoter-activity-timeline';
import { PromoterQuickActions } from './promoter-quick-actions';
import { PromoterContractSummary } from './promoter-contract-summary';
import { PromoterDetailsSkeleton } from './promoter-details-skeleton';
// Import new advanced features
import { PromoterAnalyticsDashboard } from './promoter-analytics-dashboard';
import { PromoterNotesComments } from './promoter-notes-comments';
import { PromoterSmartTags } from './promoter-smart-tags';
import { PromoterComplianceTracker } from './promoter-compliance-tracker';
import { PromoterComparisonView } from './promoter-comparison-view';
import { PromoterKPITracker } from './promoter-kpi-tracker';
import { PromoterExportPrint } from './promoter-export-print';
// Import Intelligence Hub features
import { PromoterIntelligenceHubLayout } from './promoter-intelligence-hub-layout';
import { PromoterFinancialSummary } from './promoter-financial-summary';
import { PromoterPredictiveScore } from './promoter-predictive-score';
import { PromoterCoachingRecommendations } from './promoter-coaching-recommendations';
import { PromoterGoalWidget } from './promoter-goal-widget';

interface PromoterDetails {
  id: string;
  name_en: string;
  name_ar?: string;
  email?: string;
  phone?: string;
  mobile_number?: string;
  status: string;
  profile_picture_url?: string;
  created_at: string;
  rating?: number;
  location?: string;
  last_active?: string;
  id_card_number?: string;
  id_card_expiry_date?: string;
  id_card_url?: string;
  passport_number?: string;
  passport_expiry_date?: string;
  passport_url?: string;
  contracts: any[];
}

interface PerformanceMetrics {
  overallScore: number;
  attendanceRate: number;
  taskCompletion: number;
  customerSatisfaction: number;
  responseTime: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  thisMonthTasks: number;
  lastMonthTasks: number;
  averageRating: number;
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
}

interface ActivityItem {
  id: string;
  type: 'contract' | 'document' | 'status' | 'profile' | 'task' | 'system';
  action: string;
  description: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, any>;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface PromoterDetailsEnhancedProps {
  promoterDetails: any; // Use any to avoid type conflicts
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function PromoterDetailsEnhanced({
  promoterDetails,
  isLoading = false,
  isRefreshing = false,
  error = null,
  onRefresh,
}: PromoterDetailsEnhancedProps) {
  const params = useParams();
  const router = useRouter();
  const promoterId = params?.id as string;
  const locale = params?.locale as string;
  const role = useUserRole();

  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Load additional data when promoter details are available
  useEffect(() => {
    if (promoterDetails && promoterId) {
      fetchPerformanceMetrics();
      fetchActivities();
    }
  }, [promoterDetails, promoterId]);

  // Fetch performance metrics
  // Fetch performance metrics via API
  const fetchPerformanceMetrics = useCallback(async () => {
    if (!promoterId) return;
    setIsLoadingMetrics(true);
    setMetricsError(null);
    try {
      const response = await fetch(`/api/promoters/${promoterId}/performance`);
      if (response.status === 401) {
        setMetricsError('Session expired. Please refresh the page.');
        return;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load performance metrics');
      }
      const data = await response.json();
      if (data.success && data.metrics) {
        setPerformanceMetrics(data.metrics);
      }
    } catch (err) {
      setMetricsError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [promoterId]);

  // Fetch activities
  // Fetch activities via API
  const fetchActivities = useCallback(async () => {
    if (!promoterId) return;
    setIsLoadingActivities(true);
    setActivitiesError(null);
    try {
      const response = await fetch(`/api/promoters/${promoterId}/activity`);
      if (response.status === 401) {
        setActivitiesError('Session expired. Please refresh the page.');
        return;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load activity timeline');
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.activities)) {
        setActivities(data.activities);
      }
    } catch (err) {
      setActivitiesError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setIsLoadingActivities(false);
    }
  }, [promoterId]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // Action handlers
  const handleEdit = () => {
    router.push(`/${locale}/manage-promoters/${promoterId}/edit`);
  };

  const handleCall = () => {
    if (promoterDetails?.phone) {
      window.open(`tel:${promoterDetails.phone}`, '_self');
    }
  };

  const handleEmail = () => {
    if (promoterDetails?.email) {
      window.open(`mailto:${promoterDetails.email}`, '_self');
    }
  };

  const handleMessage = () => {
    if (promoterDetails?.email) {
      window.location.href = `mailto:${promoterDetails.email}`;
    } else if (promoterDetails?.phone || promoterDetails?.mobile_number) {
      const phone = promoterDetails.phone || promoterDetails.mobile_number;
      window.location.href = `tel:${phone}`;
    } else {
      toast({
        title: 'No contact info',
        description: 'This promoter has no email or phone number on record.',
        variant: 'destructive',
      });
    }
  };

  const handleViewProfile = () => {
    // Already viewing profile - scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewContracts = () => {
    router.push(`/${locale}/contracts?promoter=${promoterId}`);
  };

  const handleCreateContract = () => {
    router.push(`/${locale}/generate-contract?promoter=${promoterId}`);
  };

  const handleViewContract = (contractId: string) => {
    router.push(`/${locale}/contracts/${contractId}`);
  };

  const handleUploadDocuments = () => {
    if (promoterId && locale) {
      router.push(
        `/${locale}/manage-promoters/${promoterId}/edit?tab=documents`
      );
    }
  };

  const handleDownloadProfile = () => {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({
          title: 'Link copied',
          description: 'Promoter profile link copied to clipboard.',
        });
      })
      .catch(() => {
        toast({
          title: 'Copy failed',
          description: 'Could not copy link to clipboard.',
          variant: 'destructive',
        });
      });
  };

  const handleScheduleMeeting = () => {
    const subject = encodeURIComponent(
      `Meeting with ${promoterDetails?.name_en || 'Promoter'}`
    );
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${subject}`,
      '_blank'
    );
  };

  const handleAddToFavorites = () => {
    if (!promoterId) return;
    const key = 'favoritePromoters';
    const stored = localStorage.getItem(key);
    const favorites: string[] = stored ? JSON.parse(stored) : [];
    const isFav = favorites.includes(promoterId);
    if (isFav) {
      const updated = favorites.filter(id => id !== promoterId);
      localStorage.setItem(key, JSON.stringify(updated));
      toast({ title: 'Removed from favorites' });
    } else {
      favorites.push(promoterId);
      localStorage.setItem(key, JSON.stringify(favorites));
      toast({
        title: 'Added to favorites',
        description: `${promoterDetails?.name_en} added to your favorites.`,
      });
    }
  };

  const handleShare = () => {
    // Implement sharing functionality
    if (navigator.share) {
      navigator.share({
        title: `Promoter Profile - ${promoterDetails?.name_en}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };
  const handleConfirmDelete = async () => {
    if (!promoterId) return;
    try {
      const res = await fetch(`/api/promoters/${promoterId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast({
          title: 'Promoter deleted',
          description: `${promoterDetails?.name_en} has been removed.`,
        });
        router.push(`/${locale}/manage-promoters`);
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      toast({
        title: 'Delete failed',
        description: 'Could not delete this promoter. Please try again.',
        variant: 'destructive',
      });
    }
    setShowDeleteDialog(false);
  };

  const handleDocumentUpload = (type: string) => {
    if (promoterId && locale) {
      router.push(
        `/${locale}/manage-promoters/${promoterId}/edit?tab=documents&upload=${type}`
      );
    }
  };

  const handleDocumentView = (type: string) => {
    const url =
      type === 'id_card'
        ? promoterDetails?.id_card_url
        : promoterDetails?.passport_url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDocumentDownload = (type: string) => {
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
  };

  if (isLoading) {
    return <PromoterDetailsSkeleton />;
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

  // Calculate document health status in real-time
  const calculateDocumentStatus = (
    expiryDate: string | null | undefined
  ): 'valid' | 'expiring' | 'expired' | 'missing' => {
    if (!expiryDate) return 'missing';

    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'valid';
  };

  const documentHealth = {
    idCard: {
      number: promoterDetails.id_card_number || undefined,
      expiryDate: promoterDetails.id_card_expiry_date || undefined,
      url: promoterDetails.id_card_url || undefined,
      status: calculateDocumentStatus(promoterDetails.id_card_expiry_date),
    },
    passport: {
      number: promoterDetails.passport_number || undefined,
      expiryDate: promoterDetails.passport_expiry_date || undefined,
      url: promoterDetails.passport_url || undefined,
      status: calculateDocumentStatus(promoterDetails.passport_expiry_date),
    },
  };

  return (
    <>
      <div className='container mx-auto space-y-6 py-6'>
        {/* Header with refresh button */}
        <div className='flex items-center justify-between'>
          <Button
            variant='outline'
            onClick={() => router.back()}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='bg-purple-100 text-purple-700'>
              Intelligence Hub
            </Badge>
            <Button
              variant='outline'
              onClick={handleRefresh}
              disabled={isRefreshing}
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Header */}
        <PromoterDetailsHeader
          promoter={promoterDetails}
          onEdit={handleEdit}
          onCall={handleCall}
          onEmail={handleEmail}
          onMessage={handleMessage}
          isAdmin={role === 'admin'}
        />

        {/* Enhanced Tabs with Two-Column Layout */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-3 lg:grid-cols-10 gap-1'>
            <TabsTrigger value='overview' className='text-xs lg:text-sm'>
              Overview
            </TabsTrigger>
            <TabsTrigger value='performance' className='text-xs lg:text-sm'>
              Performance
            </TabsTrigger>
            <TabsTrigger value='analytics' className='text-xs lg:text-sm'>
              Analytics
            </TabsTrigger>
            <TabsTrigger value='comparison' className='text-xs lg:text-sm'>
              Comparison
            </TabsTrigger>
            <TabsTrigger value='kpi' className='text-xs lg:text-sm'>
              KPI & Goals
            </TabsTrigger>
            <TabsTrigger value='documents' className='text-xs lg:text-sm'>
              Documents
            </TabsTrigger>
            <TabsTrigger value='compliance' className='text-xs lg:text-sm'>
              Compliance
            </TabsTrigger>
            <TabsTrigger value='contracts' className='text-xs lg:text-sm'>
              Contracts
            </TabsTrigger>
            <TabsTrigger value='notes' className='text-xs lg:text-sm'>
              Notes
            </TabsTrigger>
            <TabsTrigger value='activity' className='text-xs lg:text-sm'>
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab with Two-Column Layout */}
          <TabsContent value='overview' className='space-y-6'>
            <PromoterIntelligenceHubLayout
              promoterData={promoterDetails}
              performanceMetrics={performanceMetrics}
              isAdmin={role === 'admin'}
              onEdit={handleEdit}
              onCall={handleCall}
              onEmail={handleEmail}
              onMessage={handleMessage}
              onViewProfile={handleViewProfile}
              onViewContracts={handleViewContracts}
              onCreateContract={handleCreateContract}
              onUploadDocuments={handleUploadDocuments}
              onDownloadProfile={handleDownloadProfile}
              onScheduleMeeting={handleScheduleMeeting}
              onAddToFavorites={handleAddToFavorites}
              onShare={handleShare}
              onDelete={handleDelete}
              hasDocuments={
                !!(promoterDetails.id_card_url || promoterDetails.passport_url)
              }
              hasContracts={promoterDetails.contracts.length > 0}
            >
              {/* Main Content Area */}
              <div className='space-y-6'>
                {isLoadingMetrics ? (
                  <div className='flex items-center justify-center p-8'>
                    <Loader2 className='h-6 w-6 animate-spin mr-2' />
                    <span>Loading performance metrics...</span>
                  </div>
                ) : metricsError ? (
                  <div className='flex items-center justify-center p-8 text-red-600'>
                    <span>⚠️ {metricsError}</span>
                  </div>
                ) : performanceMetrics ? (
                  <>
                    <PromoterGoalWidget
                      promoterId={promoterId}
                      performanceMetrics={performanceMetrics}
                      isAdmin={role === 'admin'}
                    />
                    <PromoterPerformanceMetrics metrics={performanceMetrics} />
                    <PromoterCoachingRecommendations
                      performanceMetrics={performanceMetrics}
                      contracts={promoterDetails.contracts}
                      isAdmin={role === 'admin'}
                    />
                  </>
                ) : null}
              </div>
            </PromoterIntelligenceHubLayout>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value='performance' className='space-y-6'>
            {isLoadingMetrics ? (
              <div className='flex items-center justify-center p-8'>
                <Loader2 className='h-6 w-6 animate-spin mr-2' />
                <span>Loading performance metrics...</span>
              </div>
            ) : metricsError ? (
              <div className='flex items-center justify-center p-8 text-red-600'>
                <span>⚠️ {metricsError}</span>
              </div>
            ) : performanceMetrics ? (
              <>
                <PromoterPerformanceMetrics metrics={performanceMetrics} />
                <PromoterSmartTags
                  promoterId={promoterId}
                  isAdmin={role === 'admin'}
                  existingTags={promoterDetails.tags || []}
                  onTagsUpdate={_tags => {
                    /* Tags are persisted by the component itself */
                  }}
                />
              </>
            ) : (
              <div className='flex items-center justify-center p-8 text-gray-500'>
                <span>No performance data available</span>
              </div>
            )}
          </TabsContent>

          {/* Analytics Dashboard Tab */}
          <TabsContent value='analytics' className='space-y-6'>
            {isLoadingMetrics ? (
              <div className='flex items-center justify-center p-8'>
                <Loader2 className='h-6 w-6 animate-spin mr-2' />
                <span>Loading analytics...</span>
              </div>
            ) : (
              <PromoterAnalyticsDashboard
                promoterId={promoterId}
                promoterData={promoterDetails}
                performanceMetrics={performanceMetrics || undefined}
              />
            )}
          </TabsContent>

          {/* Comparison View Tab */}
          <TabsContent value='comparison' className='space-y-6'>
            {isLoadingMetrics ? (
              <div className='flex items-center justify-center p-8'>
                <Loader2 className='h-6 w-6 animate-spin mr-2' />
                <span>Loading comparison data...</span>
              </div>
            ) : performanceMetrics ? (
              <PromoterComparisonView
                promoterMetrics={performanceMetrics}
                promoterName={promoterDetails.name_en}
              />
            ) : (
              <div className='flex items-center justify-center p-8 text-gray-500'>
                <span>No comparison data available</span>
              </div>
            )}
          </TabsContent>

          {/* KPI Tracker Tab */}
          <TabsContent value='kpi' className='space-y-6'>
            <PromoterKPITracker
              promoterId={promoterId}
              isAdmin={role === 'admin'}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value='documents' className='space-y-6'>
            <PromoterDocumentHealth
              documents={documentHealth}
              onUpload={handleDocumentUpload}
              onView={handleDocumentView}
              onDownload={handleDocumentDownload}
              isAdmin={role === 'admin'}
            />
            <PromoterExportPrint
              promoterId={promoterId}
              promoterData={promoterDetails}
              performanceMetrics={performanceMetrics}
              contracts={promoterDetails.contracts}
              documents={[]}
            />
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value='compliance' className='space-y-6'>
            <PromoterComplianceTracker
              promoterId={promoterId}
              promoterData={promoterDetails}
              isAdmin={role === 'admin'}
              onDocumentUpload={handleDocumentUpload}
              onDocumentView={handleDocumentView}
            />
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value='contracts' className='space-y-6'>
            <PromoterContractSummary
              contracts={promoterDetails.contracts}
              onCreateContract={handleCreateContract}
              onViewAllContracts={handleViewContracts}
              onViewContract={handleViewContract}
              isAdmin={role === 'admin'}
            />
          </TabsContent>

          {/* Notes & Comments Tab */}
          <TabsContent value='notes' className='space-y-6'>
            <PromoterNotesComments
              promoterId={promoterId}
              isAdmin={role === 'admin'}
              currentUserId='current-user-id'
              currentUserName={role === 'admin' ? 'Admin User' : 'User'}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value='activity' className='space-y-6'>
            {isLoadingActivities ? (
              <div className='flex items-center justify-center p-8'>
                <Loader2 className='h-6 w-6 animate-spin mr-2' />
                <span>Loading activity timeline...</span>
              </div>
            ) : activitiesError ? (
              <div className='flex items-center justify-center p-8 text-red-600'>
                <span>⚠️ {activitiesError}</span>
              </div>
            ) : (
              <PromoterActivityTimeline
                activities={activities}
                onLoadMore={() => {
                  /* Load more handled by the timeline component */
                }}
                hasMore={false}
                isLoading={isLoadingActivities}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promoter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{promoterDetails?.name_en}</strong>? This action cannot be
              undone and will permanently remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
