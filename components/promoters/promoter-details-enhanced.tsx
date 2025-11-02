'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

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
  onRefresh 
}: PromoterDetailsEnhancedProps) {
  const params = useParams();
  const router = useRouter();
  const promoterId = params?.id as string;
  const locale = params?.locale as string;
  const role = useUserRole();

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
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
  const fetchPerformanceMetrics = useCallback(async () => {
    if (!promoterId) return;

    setIsLoadingMetrics(true);
    setMetricsError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to initialize database connection');
      }

      // Fetch real-time data in parallel
      const [
        contractsResponse,
        tasksResponse,
        attendanceResponse,
        ratingsResponse
      ] = await Promise.allSettled([
        // Get contract metrics
        supabase
          .from('contracts')
          .select('id, status, start_date, end_date, created_at')
          .eq('promoter_id', promoterId),
        
        // Get task metrics (if tasks table exists)
        supabase
          .from('promoter_tasks')
          .select('id, status, created_at, completed_at')
          .eq('promoter_id', promoterId),
        
        // Get attendance data (if attendance table exists)
        supabase
          .from('promoter_attendance')
          .select('id, date, status')
          .eq('promoter_id', promoterId)
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Get ratings/feedback (if feedback table exists)
        supabase
          .from('promoter_feedback')
          .select('id, rating, created_at')
          .eq('promoter_id', promoterId)
      ]);

      // Process contracts data
      const contracts = contractsResponse.status === 'fulfilled' ? contractsResponse.value.data || [] : [];
      const totalContracts = contracts.length;
      const activeContracts = contracts.filter((c: any) => c.status === 'active').length;
      const completedContracts = contracts.filter((c: any) => c.status === 'completed').length;

      // Process tasks data
      const tasks = tasksResponse.status === 'fulfilled' ? tasksResponse.value.data || [] : [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
      const pendingTasks = tasks.filter((t: any) => t.status === 'pending').length;
      const overdueTasks = tasks.filter((t: any) => {
        if (!t.created_at) return false;
        const createdDate = new Date(t.created_at);
        const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreated > 7 && t.status !== 'completed';
      }).length;

      // Calculate monthly tasks
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonthTasks = tasks.filter((t: any) => 
        t.created_at && new Date(t.created_at) >= thisMonthStart
      ).length;
      
      const lastMonthTasks = tasks.filter((t: any) => 
        t.created_at && new Date(t.created_at) >= lastMonthStart && new Date(t.created_at) <= lastMonthEnd
      ).length;

      // Process attendance data
      const attendance = attendanceResponse.status === 'fulfilled' ? attendanceResponse.value.data || [] : [];
      const attendanceRate = attendance.length > 0 
        ? Math.round((attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100)
        : 95; // Default high attendance if no data

      // Process ratings data
      const ratings = ratingsResponse.status === 'fulfilled' ? ratingsResponse.value.data || [] : [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratings.length
        : 4.2; // Default rating if no data

      // Calculate overall score based on multiple factors
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 90;
      const contractSuccessRate = totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 85;
      const overallScore = Math.round(
        (attendanceRate * 0.3 + taskCompletionRate * 0.3 + contractSuccessRate * 0.2 + averageRating * 20 * 0.2)
      );

      const metrics: PerformanceMetrics = {
        overallScore: Math.min(100, Math.max(0, overallScore)),
        attendanceRate,
        taskCompletion: Math.round(taskCompletionRate),
        customerSatisfaction: Math.round(averageRating * 20), // Convert 5-star to percentage
        responseTime: 2.5, // This would need actual response time tracking
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        thisMonthTasks,
        lastMonthTasks,
        averageRating: Number(averageRating.toFixed(1)),
        totalContracts,
        activeContracts,
        completedContracts,
      };

      setPerformanceMetrics(metrics);
      console.log('✅ Performance metrics loaded:', metrics);
    } catch (error) {
      console.error('❌ Error fetching performance metrics:', error);
      setMetricsError(error instanceof Error ? error.message : 'Failed to load performance metrics');
      // Set fallback metrics
      const fallbackMetrics: PerformanceMetrics = {
        overallScore: 75,
        attendanceRate: 90,
        taskCompletion: 80,
        customerSatisfaction: 85,
        responseTime: 3.0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        thisMonthTasks: 0,
        lastMonthTasks: 0,
        averageRating: 4.0,
        totalContracts: promoterDetails?.contracts?.length || 0,
        activeContracts: promoterDetails?.contracts?.filter((c: any) => c.status === 'active').length || 0,
        completedContracts: promoterDetails?.contracts?.filter((c: any) => c.status === 'completed').length || 0,
      };
      setPerformanceMetrics(fallbackMetrics);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [promoterId, promoterDetails?.contracts]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    if (!promoterId) return;

    setIsLoadingActivities(true);
    setActivitiesError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to initialize database connection');
      }

      // Fetch real-time activities in parallel
      const [
        auditLogsResponse,
        contractsResponse,
        documentsResponse,
        communicationsResponse
      ] = await Promise.allSettled([
        // Get audit logs for this promoter
        supabase
          .from('audit_logs')
          .select('id, action, table_name, record_id, new_values, old_values, created_at, user_id')
          .eq('table_name', 'promoters')
          .eq('record_id', promoterId)
          .order('created_at', { ascending: false })
          .limit(20),
        
        // Get recent contract activities
        supabase
          .from('contracts')
          .select('id, title, status, created_at, updated_at, contract_number')
          .eq('promoter_id', promoterId)
          .order('updated_at', { ascending: false })
          .limit(10),
        
        // Get document activities via API route to avoid RLS issues
        fetch(`/api/promoters/${promoterId}/documents`)
          .then(res => res.ok ? res.json() : { documents: [] })
          .then(result => ({ data: result.documents || [], error: null }))
          .catch(error => {
            console.warn('Documents API not available:', error);
            return { data: [], error: null };
          }),
        
        // Get communications (if communications table exists)
        supabase
          .from('promoter_communications')
          .select('id, type, subject, communication_time')
          .eq('promoter_id', promoterId)
          .order('communication_time', { ascending: false })
          .limit(10)
      ]);

      const activities: ActivityItem[] = [];

      // Process audit logs
      if (auditLogsResponse.status === 'fulfilled' && auditLogsResponse.value.data) {
        auditLogsResponse.value.data.forEach((log: any) => {
          activities.push({
            id: `audit-${log.id}`,
            type: 'system',
            action: `${log.action.charAt(0).toUpperCase() + log.action.slice(1)} Promoter`,
            description: `Promoter profile was ${log.action}d`,
            timestamp: log.created_at,
            user: 'System',
            metadata: {
              action: log.action,
              newValues: log.new_values,
              oldValues: log.old_values
            },
            status: 'info'
          });
        });
      }

      // Process contract activities
      if (contractsResponse.status === 'fulfilled' && contractsResponse.value.data) {
        contractsResponse.value.data.forEach((contract: any) => {
          const isNew = contract.created_at === contract.updated_at;
          activities.push({
            id: `contract-${contract.id}`,
            type: 'contract',
            action: isNew ? 'Contract Created' : 'Contract Updated',
            description: `${contract.title || 'Untitled Contract'} (${contract.contract_number || contract.id})`,
            timestamp: isNew ? contract.created_at : contract.updated_at,
            user: 'System',
            metadata: {
              contractId: contract.id,
              contractTitle: contract.title,
              contractNumber: contract.contract_number,
              status: contract.status
            },
            status: contract.status === 'active' ? 'success' : 'info'
          });
        });
      }

      // Process document activities
      if (documentsResponse.status === 'fulfilled' && documentsResponse.value.data) {
        documentsResponse.value.data.forEach((doc: any) => {
          activities.push({
            id: `document-${doc.id}`,
            type: 'document',
            action: 'Document Uploaded',
            description: `${doc.document_type || 'Document'} was uploaded`,
            timestamp: doc.created_at,
            user: 'System',
            metadata: {
              documentType: doc.document_type,
              documentId: doc.id,
              status: doc.status
            },
            status: doc.status === 'approved' ? 'success' : 'warning'
          });
        });
      }

      // Process communication activities
      if (communicationsResponse.status === 'fulfilled' && communicationsResponse.value.data) {
        communicationsResponse.value.data.forEach((comm: any) => {
          activities.push({
            id: `comm-${comm.id}`,
            type: 'system',
            action: 'Communication Sent',
            description: `${comm.type || 'Message'} sent: ${comm.subject || 'No subject'}`,
            timestamp: comm.communication_time,
            user: 'System',
            metadata: {
              communicationType: comm.type,
              subject: comm.subject
            },
            status: 'info'
          });
        });
      }

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Limit to 20 most recent activities
      const limitedActivities = activities.slice(0, 20);

      setActivities(limitedActivities);
      console.log('✅ Activities loaded:', limitedActivities.length, 'items');
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
      setActivitiesError(error instanceof Error ? error.message : 'Failed to load activities');
      // Set fallback activities
      const fallbackActivities: ActivityItem[] = [
        {
          id: 'fallback-1',
          type: 'system',
          action: 'Profile Created',
          description: 'Promoter profile was created',
          timestamp: promoterDetails?.created_at || new Date().toISOString(),
          user: 'System',
          status: 'info'
        }
      ];
      setActivities(fallbackActivities);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [promoterId, promoterDetails?.created_at]);

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
    // Implement messaging functionality
    console.log('Open messaging for:', promoterDetails?.name_en);
  };

  const handleViewProfile = () => {
    // Already viewing profile
    console.log('Viewing profile for:', promoterDetails?.name_en);
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
    // Implement document upload
    console.log('Upload documents for:', promoterDetails?.name_en);
  };

  const handleDownloadProfile = () => {
    // Implement profile download
    console.log('Download profile for:', promoterDetails?.name_en);
  };

  const handleScheduleMeeting = () => {
    // Implement meeting scheduling
    console.log('Schedule meeting for:', promoterDetails?.name_en);
  };

  const handleAddToFavorites = () => {
    // Implement favorites functionality
    console.log('Toggle favorite for:', promoterDetails?.name_en);
  };

  const handleShare = () => {
    // Implement sharing functionality
    if (navigator.share) {
      navigator.share({
        title: `Promoter Profile - ${promoterDetails?.name_en}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this promoter? This action cannot be undone.')) {
      // Implement delete functionality
      console.log('Delete promoter:', promoterDetails?.name_en);
    }
  };

  const handleDocumentUpload = (type: string) => {
    console.log(`Upload ${type} for:`, promoterDetails?.name_en);
  };

  const handleDocumentView = (type: string) => {
    const url = type === 'id_card' ? promoterDetails?.id_card_url : promoterDetails?.passport_url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDocumentDownload = (type: string) => {
    const url = type === 'id_card' ? promoterDetails?.id_card_url : promoterDetails?.passport_url;
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error || 'Promoter not found'}</p>
          <Button onClick={() => router.push(`/${locale}/promoters`)}>
            Back to Promoters
          </Button>
        </div>
      </div>
    );
  }

  // Calculate document health status in real-time
  const calculateDocumentStatus = (expiryDate: string | null | undefined): 'valid' | 'expiring' | 'expired' | 'missing' => {
    if (!expiryDate) return 'missing';
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'valid';
  };

  const documentHealth = {
    idCard: {
      number: promoterDetails.id_card_number || undefined,
      expiryDate: promoterDetails.id_card_expiry_date || undefined,
      url: promoterDetails.id_card_url || undefined,
      status: calculateDocumentStatus(promoterDetails.id_card_expiry_date)
    },
    passport: {
      number: promoterDetails.passport_number || undefined,
      expiryDate: promoterDetails.passport_expiry_date || undefined,
      url: promoterDetails.passport_url || undefined,
      status: calculateDocumentStatus(promoterDetails.passport_expiry_date)
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-100 text-purple-700">
            Intelligence Hub
          </Badge>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10 gap-1">
          <TabsTrigger value="overview" className="text-xs lg:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs lg:text-sm">Performance</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs lg:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs lg:text-sm">Comparison</TabsTrigger>
          <TabsTrigger value="kpi" className="text-xs lg:text-sm">KPI & Goals</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs lg:text-sm">Documents</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs lg:text-sm">Compliance</TabsTrigger>
          <TabsTrigger value="contracts" className="text-xs lg:text-sm">Contracts</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs lg:text-sm">Notes</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs lg:text-sm">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab with Two-Column Layout */}
        <TabsContent value="overview" className="space-y-6">
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
            hasDocuments={!!(promoterDetails.id_card_url || promoterDetails.passport_url)}
            hasContracts={promoterDetails.contracts.length > 0}
          >
            {/* Main Content Area */}
            <div className="space-y-6">
              {isLoadingMetrics ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading performance metrics...</span>
                </div>
              ) : metricsError ? (
                <div className="flex items-center justify-center p-8 text-red-600">
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
        <TabsContent value="performance" className="space-y-6">
          {isLoadingMetrics ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading performance metrics...</span>
            </div>
          ) : metricsError ? (
            <div className="flex items-center justify-center p-8 text-red-600">
              <span>⚠️ {metricsError}</span>
            </div>
          ) : performanceMetrics ? (
            <>
              <PromoterPerformanceMetrics metrics={performanceMetrics} />
              <PromoterSmartTags 
                promoterId={promoterId}
                isAdmin={role === 'admin'}
                existingTags={promoterDetails.tags || []}
                onTagsUpdate={(tags) => console.log('Tags updated:', tags)}
              />
            </>
          ) : (
            <div className="flex items-center justify-center p-8 text-gray-500">
              <span>No performance data available</span>
            </div>
          )}
        </TabsContent>

        {/* Analytics Dashboard Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {isLoadingMetrics ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
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
        <TabsContent value="comparison" className="space-y-6">
          {isLoadingMetrics ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading comparison data...</span>
            </div>
          ) : performanceMetrics ? (
            <PromoterComparisonView
              promoterMetrics={performanceMetrics}
              promoterName={promoterDetails.name_en}
            />
          ) : (
            <div className="flex items-center justify-center p-8 text-gray-500">
              <span>No comparison data available</span>
            </div>
          )}
        </TabsContent>

        {/* KPI Tracker Tab */}
        <TabsContent value="kpi" className="space-y-6">
          <PromoterKPITracker
            promoterId={promoterId}
            isAdmin={role === 'admin'}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
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
        <TabsContent value="compliance" className="space-y-6">
          <PromoterComplianceTracker
            promoterId={promoterId}
            promoterData={promoterDetails}
            isAdmin={role === 'admin'}
            onDocumentUpload={handleDocumentUpload}
            onDocumentView={handleDocumentView}
          />
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <PromoterContractSummary
            contracts={promoterDetails.contracts}
            onCreateContract={handleCreateContract}
            onViewAllContracts={handleViewContracts}
            onViewContract={handleViewContract}
            isAdmin={role === 'admin'}
          />
        </TabsContent>

        {/* Notes & Comments Tab */}
        <TabsContent value="notes" className="space-y-6">
          <PromoterNotesComments
            promoterId={promoterId}
            isAdmin={role === 'admin'}
            currentUserId="current-user-id"
            currentUserName={role === 'admin' ? 'Admin User' : 'User'}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          {isLoadingActivities ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading activity timeline...</span>
            </div>
          ) : activitiesError ? (
            <div className="flex items-center justify-center p-8 text-red-600">
              <span>⚠️ {activitiesError}</span>
            </div>
          ) : (
            <PromoterActivityTimeline
              activities={activities}
              onLoadMore={() => console.log('Load more activities')}
              hasMore={false}
              isLoading={isLoadingActivities}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
