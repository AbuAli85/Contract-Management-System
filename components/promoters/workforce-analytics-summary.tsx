'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Target,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  Briefcase,
  DollarSign,
  Star,
  ArrowUp,
  ArrowDown,
  Building2,
  Globe,
  UserCheck,
  UserX,
  Shield,
  FileText,
  BarChart3
} from 'lucide-react';
import { formatDistanceToNow, format, subMonths, differenceInDays } from 'date-fns';
import type { DashboardPromoter } from './types';

interface WorkforceAnalyticsSummaryProps {
  promoters: DashboardPromoter[];
  isRealTime?: boolean;
  lastUpdated?: string | undefined;
}

export function WorkforceAnalyticsSummary({ 
  promoters, 
  isRealTime = false, 
  lastUpdated 
}: WorkforceAnalyticsSummaryProps) {
  
  // Comprehensive workforce metrics
  const workforceMetrics = useMemo(() => {
    const total = promoters.length;
    const now = new Date();
    
    // Status distribution
    const active = promoters.filter(p => p.overallStatus === 'active').length;
    const critical = promoters.filter(p => p.overallStatus === 'critical').length;
    const warning = promoters.filter(p => p.overallStatus === 'warning').length;
    const inactive = promoters.filter(p => p.overallStatus === 'inactive').length;
    
    // Assignment metrics
    const assigned = promoters.filter(p => p.assignmentStatus === 'assigned').length;
    const unassigned = promoters.filter(p => p.assignmentStatus === 'unassigned').length;
    
    // Document health
    const documentsExpired = promoters.filter(p => 
      p.idDocument.status === 'expired' || p.passportDocument.status === 'expired'
    ).length;
    const documentsExpiring = promoters.filter(p => 
      p.idDocument.status === 'expiring' || p.passportDocument.status === 'expiring'
    ).length;
    const documentsHealthy = promoters.filter(p => 
      p.idDocument.status === 'valid' && p.passportDocument.status === 'valid'
    ).length;
    
    // Time-based metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyAdded = promoters.filter(p => {
      if (!p.created_at) return false;
      const createdDate = new Date(p.created_at);
      return !isNaN(createdDate.getTime()) && createdDate >= thirtyDaysAgo;
    }).length;
    
    // Geographical distribution
    const countries = new Set(promoters.map(p => p.nationality).filter(Boolean)).size;
    
    // Company distribution
    const companies = new Set(promoters.map(p => p.employer_id).filter(Boolean)).size;
    
    // Job title diversity
    const jobTitles = new Set(promoters.map(p => p.job_title).filter(Boolean)).size;
    
    // Compliance metrics
    const complianceRate = total > 0 ? Math.round((documentsHealthy / total) * 100) : 0;
    const assignmentRate = total > 0 ? Math.round((assigned / total) * 100) : 0;
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;
    
    return {
      total,
      active, critical, warning, inactive,
      assigned, unassigned,
      documentsExpired, documentsExpiring, documentsHealthy,
      recentlyAdded, countries, companies, jobTitles,
      complianceRate, assignmentRate, activeRate
    };
  }, [promoters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 border-green-200';
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'inactive': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getTrendIcon = (value: number, threshold: number = 80) => {
    if (value >= threshold) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value >= 60) return <Activity className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl border-0 shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Workforce Analytics Summary
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Complete insights across {workforceMetrics.total.toLocaleString()} workforce members
              </p>
            </div>
          </div>
          
          {isRealTime && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Live Data
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Workforce */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total Workforce</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {workforceMetrics.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {workforceMetrics.recentlyAdded} added this month
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Rate */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Active Rate</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {workforceMetrics.activeRate}%
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {getTrendIcon(workforceMetrics.activeRate)}
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {workforceMetrics.active} active members
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <Progress value={workforceMetrics.activeRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        {/* Compliance Rate */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Compliance Rate</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {workforceMetrics.complianceRate}%
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {getTrendIcon(workforceMetrics.complianceRate)}
                  <span className="text-sm text-purple-600 dark:text-purple-400">
                    {workforceMetrics.documentsHealthy} compliant
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <Progress value={workforceMetrics.complianceRate} className="mt-3 h-2 [&>div]:bg-purple-500" />
          </CardContent>
        </Card>

        {/* Assignment Rate */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Assignment Rate</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {workforceMetrics.assignmentRate}%
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {getTrendIcon(workforceMetrics.assignmentRate)}
                  <span className="text-sm text-orange-600 dark:text-orange-400">
                    {workforceMetrics.unassigned} unassigned
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Briefcase className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <Progress value={workforceMetrics.assignmentRate} className="mt-3 h-2 [&>div]:bg-orange-500" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Status Distribution
            </CardTitle>
            <CardDescription>Current workforce status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Active', value: workforceMetrics.active, status: 'active' },
              { label: 'Critical', value: workforceMetrics.critical, status: 'critical' },
              { label: 'Warning', value: workforceMetrics.warning, status: 'warning' },
              { label: 'Inactive', value: workforceMetrics.inactive, status: 'inactive' }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(item.status)}`}>
                    {item.label}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.value}</span>
                  <span className="text-sm text-muted-foreground">
                    ({Math.round((item.value / workforceMetrics.total) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Document Health */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Document Health
            </CardTitle>
            <CardDescription>Document compliance status overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Documents Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-600">{workforceMetrics.documentsHealthy}</span>
                  <Badge variant="secondary" className="text-xs">{workforceMetrics.complianceRate}%</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Expiring Soon</span>
                </div>
                <span className="font-medium text-yellow-600">{workforceMetrics.documentsExpiring}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Expired</span>
                </div>
                <span className="font-medium text-red-600">{workforceMetrics.documentsExpired}</span>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <Progress value={workforceMetrics.complianceRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Overall document compliance rate
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Diversity Metrics */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              Diversity Overview
            </CardTitle>
            <CardDescription>Workforce diversity and distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{workforceMetrics.countries}</div>
                <div className="text-xs text-muted-foreground">Countries</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{workforceMetrics.companies}</div>
                <div className="text-xs text-muted-foreground">Companies</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{workforceMetrics.jobTitles}</div>
                <div className="text-xs text-muted-foreground">Job Roles</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{workforceMetrics.recentlyAdded}</div>
                <div className="text-xs text-muted-foreground">New (30d)</div>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Assignment Coverage</span>
                <span className="font-medium">{workforceMetrics.assignmentRate}%</span>
              </div>
              <Progress value={workforceMetrics.assignmentRate} className="h-2 mt-1 [&>div]:bg-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {format(new Date(lastUpdated), 'PPpp')}
        </div>
      )}
    </div>
  );
}
