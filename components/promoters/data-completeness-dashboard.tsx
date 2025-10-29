'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  FileText,
  User,
  Building2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import type { DashboardPromoter } from './types';
import { cn } from '@/lib/utils';

interface DataCompletenessDashboardProps {
  promoters: DashboardPromoter[];
  onViewIncomplete?: (field: string) => void;
}

interface CompletenessMetrics {
  overall: number;
  byField: {
    email: number;
    phone: number;
    idCard: number;
    passport: number;
    assignment: number;
  };
  incomplete: {
    email: DashboardPromoter[];
    phone: DashboardPromoter[];
    idCard: DashboardPromoter[];
    passport: DashboardPromoter[];
    assignment: DashboardPromoter[];
  };
  totalPromoters: number;
}

export function DataCompletenessDashboard({
  promoters,
  onViewIncomplete
}: DataCompletenessDashboardProps) {
  
  const metrics = useMemo<CompletenessMetrics>(() => {
    const total = promoters.length;
    if (total === 0) {
      return {
        overall: 100,
        byField: { email: 100, phone: 100, idCard: 100, passport: 100, assignment: 100 },
        incomplete: { email: [], phone: [], idCard: [], passport: [], assignment: [] },
        totalPromoters: 0
      };
    }

    const incomplete = {
      email: promoters.filter(p => !p.contactEmail || p.contactEmail.trim() === ''),
      phone: promoters.filter(p => !p.contactPhone || p.contactPhone.trim() === ''),
      idCard: promoters.filter(p => !p.id_card_expiry_date || p.idDocument.status === 'missing'),
      passport: promoters.filter(p => !p.passport_expiry_date || p.passportDocument.status === 'missing'),
      assignment: promoters.filter(p => p.assignmentStatus === 'unassigned'),
    };

    const byField = {
      email: ((total - incomplete.email.length) / total) * 100,
      phone: ((total - incomplete.phone.length) / total) * 100,
      idCard: ((total - incomplete.idCard.length) / total) * 100,
      passport: ((total - incomplete.passport.length) / total) * 100,
      assignment: ((total - incomplete.assignment.length) / total) * 100,
    };

    // Calculate overall completeness (weighted average)
    const overall = (
      byField.email * 0.25 +
      byField.phone * 0.15 +
      byField.idCard * 0.3 +
      byField.passport * 0.2 +
      byField.assignment * 0.1
    );

    return {
      overall: Math.round(overall),
      byField: {
        email: Math.round(byField.email),
        phone: Math.round(byField.phone),
        idCard: Math.round(byField.idCard),
        passport: Math.round(byField.passport),
        assignment: Math.round(byField.assignment),
      },
      incomplete,
      totalPromoters: total
    };
  }, [promoters]);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const fields = [
    {
      key: 'email' as const,
      label: 'Email Addresses',
      icon: Mail,
      description: 'Contact email for notifications',
      weight: '25%',
    },
    {
      key: 'phone' as const,
      label: 'Phone Numbers',
      icon: Phone,
      description: 'Contact phone for SMS alerts',
      weight: '15%',
    },
    {
      key: 'idCard' as const,
      label: 'ID Card Documents',
      icon: FileText,
      description: 'Valid ID card with expiry date',
      weight: '30%',
    },
    {
      key: 'passport' as const,
      label: 'Passport Documents',
      icon: User,
      description: 'Valid passport with expiry date',
      weight: '20%',
    },
    {
      key: 'assignment' as const,
      label: 'Company Assignment',
      icon: Building2,
      description: 'Assigned to employer/company',
      weight: '10%',
    },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              Data Completeness Tracker
            </CardTitle>
            <CardDescription className="mt-1">
              Monitor and improve data quality across your promoter roster
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={cn('text-4xl font-bold', getStatusColor(metrics.overall))}>
              {metrics.overall}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Overall Score
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Data Quality Score</span>
            <span className="text-sm text-muted-foreground">
              {metrics.totalPromoters} promoters analyzed
            </span>
          </div>
          <Progress 
            value={metrics.overall} 
            className="h-3"
            indicatorClassName={getProgressColor(metrics.overall)}
          />
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {Math.round((metrics.overall / 100) * metrics.totalPromoters)}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Complete Records
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              <div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {Math.round(((100 - metrics.overall) / 100) * metrics.totalPromoters)}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  Needs Attention
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <TrendingUp className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <div>
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {metrics.overall >= 70 ? 'Good' : 'Needs Work'}
                </div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400">
                  Overall Health
                </div>
              </div>
            </div>
          </div>

          {/* Field-by-Field Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-indigo-600" />
              Field Completeness Breakdown
            </h3>

            {fields.map((field) => {
              const percentage = metrics.byField[field.key];
              const incompleteCount = metrics.incomplete[field.key].length;
              const Icon = field.icon;

              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{field.label}</span>
                      <Badge variant="outline" className="text-xs">
                        Weight: {field.weight}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      {incompleteCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {incompleteCount} missing
                        </Badge>
                      )}
                      <span className={cn('text-sm font-bold', getStatusColor(percentage))}>
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress 
                      value={percentage} 
                      className="h-2 flex-1"
                      indicatorClassName={getProgressColor(percentage)}
                    />
                    {incompleteCount > 0 && onViewIncomplete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewIncomplete(field.key)}
                        className="text-xs h-7"
                      >
                        View {incompleteCount}
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {field.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Recommendations */}
          {metrics.overall < 90 && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Recommended Actions
              </h4>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                {metrics.byField.email < 90 && (
                  <li>• Collect missing email addresses from {metrics.incomplete.email.length} promoters</li>
                )}
                {metrics.byField.phone < 80 && (
                  <li>• Update phone numbers for {metrics.incomplete.phone.length} promoters</li>
                )}
                {metrics.byField.idCard < 90 && (
                  <li>• Request ID card documents from {metrics.incomplete.idCard.length} promoters</li>
                )}
                {metrics.byField.passport < 70 && (
                  <li>• Request passport documents from {metrics.incomplete.passport.length} promoters</li>
                )}
                {metrics.byField.assignment < 50 && (
                  <li>• Assign {metrics.incomplete.assignment.length} promoters to companies</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

