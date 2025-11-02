'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  Clock,
} from 'lucide-react';
import type { DashboardMetrics, DashboardPromoter } from './types';

interface PromotersStatsChartsProps {
  metrics: DashboardMetrics;
  promoters: DashboardPromoter[];
  hasFiltersApplied?: boolean;
}

/**
 * Visual data insights with charts and statistics
 * Provides quick overview of workforce health
 */
export function PromotersStatsCharts({ metrics, promoters, hasFiltersApplied = false }: PromotersStatsChartsProps) {
  // Calculate document expiry timeline (next 90 days)
  const getExpiryTimeline = () => {
    const now = new Date();
    
    // Generate actual month names for next 3 months
    const getMonthName = (monthOffset: number) => {
      const date = new Date(now);
      date.setMonth(date.getMonth() + monthOffset);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };
    
    const months = [
      getMonthName(0), // Current month (e.g., "October 2025")
      getMonthName(1), // Next month (e.g., "November 2025")
      getMonthName(2)  // Month after (e.g., "December 2025")
    ];
    
    const timeline: Record<string, { ids: number; passports: number }> = {};
    months.forEach(month => {
      timeline[month] = { ids: 0, passports: 0 };
    });

    promoters.forEach(p => {
      // ID card expiry (with null safety)
      if (p?.idDocument?.expiresOn && p?.idDocument?.status === 'expiring') {
        const daysUntilExpiry = p?.idDocument?.daysRemaining || 0;
        const month0 = months[0];
        const month1 = months[1];
        const month2 = months[2];
        
        if (daysUntilExpiry <= 30 && month0 && timeline[month0]) {
          timeline[month0].ids++;
        } else if (daysUntilExpiry <= 60 && month1 && timeline[month1]) {
          timeline[month1].ids++;
        } else if (daysUntilExpiry <= 90 && month2 && timeline[month2]) {
          timeline[month2].ids++;
        }
      }

      // Passport expiry (with null safety)
      if (p?.passportDocument?.expiresOn && p?.passportDocument?.status === 'expiring') {
        const daysUntilExpiry = p?.passportDocument?.daysRemaining || 0;
        const month0 = months[0];
        const month1 = months[1];
        const month2 = months[2];
        
        if (daysUntilExpiry <= 30 && month0 && timeline[month0]) {
          timeline[month0].passports++;
        } else if (daysUntilExpiry <= 60 && month1 && timeline[month1]) {
          timeline[month1].passports++;
        } else if (daysUntilExpiry <= 90 && month2 && timeline[month2]) {
          timeline[month2].passports++;
        }
      }
    });

    return Object.entries(timeline).map(([month, counts]) => ({
      month,
      ids: counts.ids,
      passports: counts.passports,
      total: counts.ids + counts.passports,
    }));
  };

  const expiryTimeline = getExpiryTimeline();
  const totalExpiring = expiryTimeline.reduce((sum, item) => sum + item.total, 0);

  // Calculate mutually exclusive status distribution
  // IMPORTANT: These categories must not overlap to avoid percentage totals >100%
  // Priority: Critical > Warning > Assigned > Available
  const assigned = metrics.active - metrics.unassigned; // Active promoters with employer assignment
  const available = metrics.unassigned; // Active but awaiting assignment
  
  const statusDistribution = [
    { status: 'Assigned', count: assigned, percentage: Math.round((assigned / metrics.total) * 100) || 0, color: 'bg-green-500', description: 'Active with employer' },
    { status: 'Available', count: available, percentage: Math.round((available / metrics.total) * 100) || 0, color: 'bg-blue-500', description: 'Ready for assignment' },
    { status: 'Critical', count: metrics.critical, percentage: Math.round((metrics.critical / metrics.total) * 100) || 0, color: 'bg-red-500', description: 'Expired documents' },
    { status: 'Warning', count: metrics.expiring, percentage: Math.round((metrics.expiring / metrics.total) * 100) || 0, color: 'bg-amber-500', description: 'Expiring soon' },
  ];

  // Verify categories are mutually exclusive (percentages should total ~100%)
  const totalPercentage = statusDistribution.reduce((sum, item) => sum + item.percentage, 0);
  if (totalPercentage > 105 || totalPercentage < 95) {
    console.warn(`Workforce distribution percentages may overlap: ${totalPercentage}%`);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Document Expiry Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-600" />
              Document Renewal Timeline
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasFiltersApplied && (
                <Badge variant="secondary" className="text-xs">
                  Filtered View
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Next 90 days
              </Badge>
            </div>
          </div>
          <CardDescription>
            {hasFiltersApplied 
              ? 'Showing renewals for filtered promoters only' 
              : 'Upcoming document renewals that require attention'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expiryTimeline.map((item, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.month}</span>
                  <span className="text-muted-foreground">{item.total} documents</span>
                </div>
                <div className="flex gap-2">
                  {/* ID Cards Bar */}
                  <div className="flex-1 space-y-1">
                    <div className="h-8 bg-orange-100 rounded-md flex items-center justify-center relative overflow-hidden">
                      {/* eslint-disable-next-line react/no-inline-styles */}
                      <div 
                        className="absolute left-0 top-0 h-full bg-orange-500 transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (item.ids / Math.max(...expiryTimeline.map(t => t?.total || 0), 1)) * 100)}%` 
                        } as React.CSSProperties}
                      />
                      <span className="relative z-10 text-xs font-medium text-orange-900">
                        {item.ids} IDs
                      </span>
                    </div>
                  </div>
                  {/* Passports Bar */}
                  <div className="flex-1 space-y-1">
                    <div className="h-8 bg-blue-100 rounded-md flex items-center justify-center relative overflow-hidden">
                      {/* eslint-disable-next-line react/no-inline-styles */}
                      <div 
                        className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (item.passports / Math.max(...expiryTimeline.map(t => t?.total || 0), 1)) * 100)}%` 
                        } as React.CSSProperties}
                      />
                      <span className="relative z-10 text-xs font-medium text-blue-900">
                        {item.passports} Passports
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {totalExpiring === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents expiring in the next 90 days</p>
                <p className="text-xs mt-1">All documents are up to date! 🎉</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Workforce Distribution
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {metrics.total} total
            </Badge>
          </div>
          <CardDescription>
            Breakdown of promoter statuses and readiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statusDistribution.map((item, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  {/* eslint-disable-next-line react/no-inline-styles */}
                  <div 
                    className={`h-full ${item.color} transition-all duration-300`}
                    style={{ width: `${item.percentage}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Compliance Health
            </CardTitle>
            <Badge 
              variant={metrics.complianceRate >= 90 ? 'default' : 'destructive'}
              className={metrics.complianceRate >= 90 ? 'bg-green-500' : 'bg-amber-500'}
            >
              {metrics.complianceRate}%
            </Badge>
          </div>
          <CardDescription>
            Document compliance and action items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Compliance Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Compliance</span>
                <span className="text-muted-foreground">
                  {metrics.total - metrics.critical - metrics.expiring}/{metrics.total} compliant
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                {/* eslint-disable-next-line react/no-inline-styles */}
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${metrics.complianceRate}%` } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Action Items */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-red-50 transition-colors">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Critical Issues</span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {metrics.critical}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-amber-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Expiring Soon</span>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                  {metrics.expiring}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Unassigned</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {metrics.unassigned}
                </Badge>
              </div>
            </div>

            {/* Quick Action Hint */}
            {(metrics.critical > 0 || metrics.expiring > 0) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800 font-medium mb-1">
                  💡 Quick Action Needed
                </p>
                <p className="text-xs text-blue-700">
                  {metrics.critical > 0 && `${metrics.critical} critical documents need immediate renewal. `}
                  {metrics.expiring > 0 && `${metrics.expiring} documents expiring soon.`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

