'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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

    try {
      // Mock data for now - replace with actual API call
      const mockMetrics: PerformanceMetrics = {
        overallScore: 85,
        attendanceRate: 92,
        taskCompletion: 88,
        customerSatisfaction: 90,
        responseTime: 2.5,
        totalTasks: 24,
        completedTasks: 21,
        pendingTasks: 2,
        overdueTasks: 1,
        thisMonthTasks: 8,
        lastMonthTasks: 6,
        averageRating: 4.2,
        totalContracts: promoterDetails?.contracts?.length || 0,
        activeContracts: promoterDetails?.contracts?.filter((c: any) => c.status === 'active').length || 0,
        completedContracts: promoterDetails?.contracts?.filter((c: any) => c.status === 'completed').length || 0,
      };
      setPerformanceMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    }
  }, [promoterId, promoterDetails?.contracts]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    if (!promoterId) return;

    try {
      // Mock data for now - replace with actual API call
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'contract',
          action: 'Contract Created',
          description: 'New contract "Marketing Campaign 2024" was created',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: 'Admin User',
          metadata: { contractTitle: 'Marketing Campaign 2024' },
          status: 'success'
        },
        {
          id: '2',
          type: 'document',
          action: 'Document Uploaded',
          description: 'ID card document was uploaded',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          user: 'Admin User',
          metadata: { documentType: 'ID Card' },
          status: 'success'
        },
        {
          id: '3',
          type: 'status',
          action: 'Status Updated',
          description: 'Promoter status changed from inactive to active',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          user: 'Admin User',
          metadata: { oldValue: 'inactive', newValue: 'active' },
          status: 'success'
        },
        {
          id: '4',
          type: 'profile',
          action: 'Profile Updated',
          description: 'Contact information was updated',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          user: 'Admin User',
          status: 'info'
        }
      ];
      setActivities(mockActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
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

  const handleDocumentUpload = (type: 'id_card' | 'passport') => {
    console.log(`Upload ${type} for:`, promoterDetails?.name_en);
  };

  const handleDocumentView = (type: 'id_card' | 'passport') => {
    const url = type === 'id_card' ? promoterDetails?.id_card_url : promoterDetails?.passport_url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDocumentDownload = (type: 'id_card' | 'passport') => {
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

  const documentHealth = {
    idCard: {
      number: promoterDetails.id_card_number || undefined,
      expiryDate: promoterDetails.id_card_expiry_date || undefined,
      url: promoterDetails.id_card_url || undefined,
      status: 'valid' as const // This should be calculated based on expiry date
    },
    passport: {
      number: promoterDetails.passport_number || undefined,
      expiryDate: promoterDetails.passport_expiry_date || undefined,
      url: promoterDetails.passport_url || undefined,
      status: 'valid' as const // This should be calculated based on expiry date
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

      {/* Enhanced Header */}
      <PromoterDetailsHeader
        promoter={promoterDetails}
        onEdit={handleEdit}
        onCall={handleCall}
        onEmail={handleEmail}
        onMessage={handleMessage}
        isAdmin={role === 'admin'}
      />

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {performanceMetrics && (
            <PromoterPerformanceMetrics metrics={performanceMetrics} />
          )}
          <PromoterQuickActions
            promoter={promoterDetails}
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
            isAdmin={role === 'admin'}
            hasDocuments={!!(promoterDetails.id_card_url || promoterDetails.passport_url)}
            hasContracts={promoterDetails.contracts.length > 0}
          />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {performanceMetrics && (
            <PromoterPerformanceMetrics metrics={performanceMetrics} />
          )}
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

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <PromoterActivityTimeline
            activities={activities}
            onLoadMore={() => console.log('Load more activities')}
            hasMore={false}
            isLoading={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
