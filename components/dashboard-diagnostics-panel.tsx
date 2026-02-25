'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  runDashboardDiagnostics,
  testDashboardDataPoints,
  quickDashboardHealthCheck,
} from '@/lib/dashboard-diagnostics';
import { DashboardDiagnosticSummary } from '@/lib/dashboard-diagnostics';
import {
  Bug,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  Database,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface DashboardDiagnosticsPanelProps {
  className?: string;
}

export function DashboardDiagnosticsPanel({
  className = '',
}: DashboardDiagnosticsPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DashboardDiagnosticSummary | null>(
    null
  );
  const [dataPoints, setDataPoints] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      // Run comprehensive diagnostics
      const diagnosticResults = await runDashboardDiagnostics();
      setResults(diagnosticResults);

      // Test specific data points
      const dataPointResults = await testDashboardDataPoints();
      setDataPoints(dataPointResults);
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      setResults({
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        results: [
          {
            success: false,
            endpoint: 'Diagnostics',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        summary: 'Diagnostics failed to run',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const quickCheck = async () => {
    setIsRunning(true);
    try {
      const isHealthy = await quickDashboardHealthCheck();
      setResults({
        totalTests: 1,
        passedTests: isHealthy ? 1 : 0,
        failedTests: isHealthy ? 0 : 1,
        results: [
          {
            success: isHealthy,
            endpoint: 'Quick Health Check',
            data: isHealthy ? 'Dashboard is healthy' : 'Dashboard has issues',
          },
        ],
        summary: isHealthy
          ? 'Dashboard is working correctly'
          : 'Dashboard has issues',
      });
    } catch (error) {
      console.error('Quick check failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className={`border-orange-200 bg-orange-50/50 ${className}`}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Bug className='h-5 w-5 text-orange-600' />
            <CardTitle className='text-orange-800'>
              Dashboard Diagnostics
            </CardTitle>
          </div>
          <Badge
            variant={results?.failedTests === 0 ? 'default' : 'destructive'}
          >
            {results
              ? `${results.passedTests}/${results.totalTests}`
              : 'Not Run'}
          </Badge>
        </div>
        <CardDescription className='text-orange-700'>
          Test dashboard API endpoints and data fetching
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Action Buttons */}
        <div className='flex gap-2'>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant='outline'
            size='sm'
            className='border-orange-300 text-orange-700 hover:bg-orange-100'
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`}
            />
            {isRunning ? 'Running...' : 'Full Diagnostics'}
          </Button>

          <Button
            onClick={quickCheck}
            disabled={isRunning}
            variant='outline'
            size='sm'
            className='border-orange-300 text-orange-700 hover:bg-orange-100'
          >
            <Activity className='h-4 w-4 mr-2' />
            Quick Check
          </Button>

          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant='ghost'
            size='sm'
            className='text-orange-600 hover:text-orange-800'
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {/* Results Summary */}
        {results && (
          <Alert
            className={
              results.failedTests === 0
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
          >
            {results.failedTests === 0 ? (
              <CheckCircle className='h-4 w-4 text-green-600' />
            ) : (
              <XCircle className='h-4 w-4 text-red-600' />
            )}
            <AlertTitle
              className={
                results.failedTests === 0 ? 'text-green-800' : 'text-red-800'
              }
            >
              {results.failedTests === 0
                ? 'All Tests Passed'
                : 'Some Tests Failed'}
            </AlertTitle>
            <AlertDescription
              className={
                results.failedTests === 0 ? 'text-green-700' : 'text-red-700'
              }
            >
              {results.summary}
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Results */}
        {showDetails && results && (
          <div className='space-y-3'>
            <h4 className='font-medium text-slate-700'>Test Results:</h4>
            {results.results.map((result, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-white rounded-lg border'
              >
                <div className='flex items-center gap-2'>
                  {result.success ? (
                    <CheckCircle className='h-4 w-4 text-green-600' />
                  ) : (
                    <XCircle className='h-4 w-4 text-red-600' />
                  )}
                  <span className='font-medium'>{result.endpoint}</span>
                </div>
                <div className='flex items-center gap-2'>
                  {result.responseTime && (
                    <Badge variant='outline' className='text-xs'>
                      {result.responseTime}ms
                    </Badge>
                  )}
                  {result.success ? (
                    <Badge variant='default' className='text-xs'>
                      Success
                    </Badge>
                  ) : (
                    <Badge variant='destructive' className='text-xs'>
                      Failed
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Data Points Results */}
        {showDetails && dataPoints && (
          <div className='space-y-3'>
            <h4 className='font-medium text-slate-700'>Data Points:</h4>

            {dataPoints.errors.length > 0 && (
              <Alert className='border-red-200 bg-red-50'>
                <AlertTriangle className='h-4 w-4 text-red-600' />
                <AlertTitle className='text-red-800'>Errors Found</AlertTitle>
                <AlertDescription className='text-red-700'>
                  <ul className='list-disc list-inside space-y-1'>
                    {dataPoints.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {dataPoints.stats && (
              <div className='p-3 bg-white rounded-lg border'>
                <div className='flex items-center gap-2 mb-2'>
                  <Database className='h-4 w-4 text-blue-600' />
                  <span className='font-medium'>Stats Data</span>
                </div>
                <div className='text-sm text-slate-600'>
                  <div>
                    Total Contracts: {dataPoints.stats.totalContracts || 0}
                  </div>
                  <div>
                    Total Promoters: {dataPoints.stats.totalPromoters || 0}
                  </div>
                  <div>Total Parties: {dataPoints.stats.totalParties || 0}</div>
                  <div>
                    Pending Approvals: {dataPoints.stats.pendingApprovals || 0}
                  </div>
                </div>
              </div>
            )}

            {dataPoints.notifications && (
              <div className='p-3 bg-white rounded-lg border'>
                <div className='flex items-center gap-2 mb-2'>
                  <Info className='h-4 w-4 text-blue-600' />
                  <span className='font-medium'>Notifications</span>
                </div>
                <div className='text-sm text-slate-600'>
                  Count:{' '}
                  {Array.isArray(dataPoints.notifications)
                    ? dataPoints.notifications.length
                    : 'N/A'}
                </div>
              </div>
            )}

            {dataPoints.activities && (
              <div className='p-3 bg-white rounded-lg border'>
                <div className='flex items-center gap-2 mb-2'>
                  <Activity className='h-4 w-4 text-blue-600' />
                  <span className='font-medium'>Activities</span>
                </div>
                <div className='text-sm text-slate-600'>
                  Count:{' '}
                  {Array.isArray(dataPoints.activities)
                    ? dataPoints.activities.length
                    : 'N/A'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {results && results.failedTests > 0 && (
          <Alert className='border-yellow-200 bg-yellow-50'>
            <AlertTriangle className='h-4 w-4 text-yellow-600' />
            <AlertTitle className='text-yellow-800'>Recommendations</AlertTitle>
            <AlertDescription className='text-yellow-700'>
              <ul className='list-disc list-inside space-y-1'>
                <li>Check if the database is accessible</li>
                <li>Verify API endpoints are working</li>
                <li>Check browser console for errors</li>
                <li>Try refreshing the page</li>
                <li>Contact support if issues persist</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
