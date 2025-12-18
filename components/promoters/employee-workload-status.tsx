'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

interface EmployeeWorkloadStatusProps {
  contracts?: any[];
  status?: string;
  availability?: string;
  employmentType?: string;
}

export function EmployeeWorkloadStatus({
  contracts = [],
  status = 'active',
  availability = 'available',
  employmentType,
}: EmployeeWorkloadStatusProps) {
  const workloadMetrics = useMemo(() => {
    const activeContracts = contracts.filter((c: any) => c.status === 'active');
    const pendingContracts = contracts.filter((c: any) => c.status === 'pending');
    const completedContracts = contracts.filter((c: any) => c.status === 'completed');

    // Calculate workload percentage (assuming max 5 active contracts = 100%)
    const maxActiveContracts = 5;
    const workloadPercentage = Math.min(100, (activeContracts.length / maxActiveContracts) * 100);

    // Calculate average contract duration
    let totalDays = 0;
    let contractCount = 0;
    activeContracts.forEach((contract: any) => {
      if (contract.start_date && contract.end_date) {
        try {
          const start = parseISO(contract.start_date);
          const end = parseISO(contract.end_date);
          const days = differenceInDays(end, start);
          if (days > 0) {
            totalDays += days;
            contractCount++;
          }
        } catch (error) {
          // Ignore invalid dates
        }
      }
    });
    const averageDuration = contractCount > 0 ? Math.round(totalDays / contractCount) : 0;

    // Determine workload status
    let workloadStatus: 'low' | 'normal' | 'high' | 'overloaded' = 'normal';
    let workloadColor = 'bg-blue-500';
    let workloadLabel = 'Normal Workload';

    if (activeContracts.length === 0) {
      workloadStatus = 'low';
      workloadColor = 'bg-gray-400';
      workloadLabel = 'No Active Assignments';
    } else if (activeContracts.length >= maxActiveContracts) {
      workloadStatus = 'overloaded';
      workloadColor = 'bg-red-500';
      workloadLabel = 'Overloaded';
    } else if (activeContracts.length >= maxActiveContracts * 0.8) {
      workloadStatus = 'high';
      workloadColor = 'bg-orange-500';
      workloadLabel = 'High Workload';
    } else if (activeContracts.length <= maxActiveContracts * 0.3) {
      workloadStatus = 'low';
      workloadColor = 'bg-green-500';
      workloadLabel = 'Light Workload';
    }

    return {
      activeContracts: activeContracts.length,
      pendingContracts: pendingContracts.length,
      completedContracts: completedContracts.length,
      totalContracts: contracts.length,
      workloadPercentage,
      workloadStatus,
      workloadColor,
      workloadLabel,
      averageDuration,
    };
  }, [contracts]);

  const getAvailabilityBadge = () => {
    switch (availability?.toLowerCase()) {
      case 'available':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        );
      case 'busy':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
            <Loader className="h-3 w-3 mr-1" />
            Busy
          </Badge>
        );
      case 'unavailable':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unavailable
          </Badge>
        );
      case 'part_time':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            Part Time
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {availability || 'Unknown'}
          </Badge>
        );
    }
  };

  const getStatusBadge = () => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-600">
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary">
            Inactive
          </Badge>
        );
      case 'on_leave':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
            On Leave
          </Badge>
        );
      case 'terminated':
        return (
          <Badge variant="destructive">
            Terminated
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="destructive">
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Workload & Availability
        </CardTitle>
        <CardDescription>Current assignment status and capacity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status and Availability */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Employment Status</div>
            {getStatusBadge()}
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Availability</div>
            {getAvailabilityBadge()}
          </div>
        </div>

        {/* Workload Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Workload Capacity</span>
            <span className="text-sm font-semibold">{workloadMetrics.workloadLabel}</span>
          </div>
          <Progress
            value={workloadMetrics.workloadPercentage}
            className="h-3"
            indicatorClassName={workloadMetrics.workloadColor}
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {workloadMetrics.activeContracts} active assignment{workloadMetrics.activeContracts !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(workloadMetrics.workloadPercentage)}% capacity
            </span>
          </div>
        </div>

        {/* Contract Statistics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{workloadMetrics.activeContracts}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{workloadMetrics.pendingContracts}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{workloadMetrics.completedContracts}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Average Duration */}
        {workloadMetrics.averageDuration > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Avg. Contract Duration
              </span>
              <span className="font-semibold">{workloadMetrics.averageDuration} days</span>
            </div>
          </div>
        )}

        {/* Employment Type */}
        {employmentType && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Employment Type</span>
              <Badge variant="outline" className="text-xs">
                {employmentType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            </div>
          </div>
        )}

        {/* Workload Warning */}
        {workloadMetrics.workloadStatus === 'overloaded' && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">High workload detected. Consider redistributing assignments.</span>
            </div>
          </div>
        )}

        {workloadMetrics.workloadStatus === 'low' && workloadMetrics.activeContracts === 0 && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Employee has capacity for new assignments.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

