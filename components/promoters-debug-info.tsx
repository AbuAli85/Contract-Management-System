'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react';

interface DebugInfo {
  apiStatus: 'loading' | 'success' | 'error';
  promotersCount: number;
  lastFetch: string | null;
  error: string | null;
  apiResponse: any;
  networkInfo: {
    status: number | null;
    statusText: string | null;
    headers: Record<string, string>;
  };
}

export function PromotersDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    apiStatus: 'loading',
    promotersCount: 0,
    lastFetch: null,
    error: null,
    apiResponse: null,
    networkInfo: {
      status: null,
      statusText: null,
      headers: {},
    },
  });

  const fetchDebugInfo = async () => {
    setDebugInfo(prev => ({ ...prev, apiStatus: 'loading', error: null }));
    
    try {
      console.log('🔍 Debug: Testing promoters API...');
      
      const startTime = Date.now();
      const response = await fetch('/api/promoters', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      console.log(`🔍 Debug: API response time: ${responseTime}ms`);
      
      const data = await response.json();
      
      // Extract headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      setDebugInfo({
        apiStatus: response.ok ? 'success' : 'error',
        promotersCount: data.promoters?.length || 0,
        lastFetch: new Date().toISOString(),
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
        apiResponse: data,
        networkInfo: {
          status: response.status,
          statusText: response.statusText,
          headers,
        },
      });
      
      console.log('🔍 Debug: API response:', data);
      console.log('🔍 Debug: Promoters count:', data.promoters?.length || 0);
      
    } catch (error) {
      console.error('🔍 Debug: Fetch error:', error);
      setDebugInfo(prev => ({
        ...prev,
        apiStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastFetch: new Date().toISOString(),
      }));
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Promoters API Debug Information
          </CardTitle>
          <Button 
            onClick={fetchDebugInfo} 
            disabled={debugInfo.apiStatus === 'loading'}
            variant="outline"
            size="sm"
          >
            {debugInfo.apiStatus === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Badge 
              variant={debugInfo.apiStatus === 'success' ? 'default' : debugInfo.apiStatus === 'error' ? 'destructive' : 'secondary'}
            >
              {debugInfo.apiStatus === 'loading' && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              {debugInfo.apiStatus === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
              {debugInfo.apiStatus === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
              {debugInfo.apiStatus.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">API Status</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {debugInfo.promotersCount} Promoters
            </Badge>
            <span className="text-sm text-muted-foreground">Count</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {debugInfo.networkInfo.status || 'N/A'}
            </Badge>
            <span className="text-sm text-muted-foreground">HTTP Status</span>
          </div>
        </div>

        {/* Error Display */}
        {debugInfo.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {debugInfo.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Network Information */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Network Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span> {debugInfo.networkInfo.status}
            </div>
            <div>
              <span className="text-muted-foreground">Status Text:</span> {debugInfo.networkInfo.statusText}
            </div>
            <div>
              <span className="text-muted-foreground">Last Fetch:</span> {debugInfo.lastFetch ? new Date(debugInfo.lastFetch).toLocaleString() : 'Never'}
            </div>
            <div>
              <span className="text-muted-foreground">Content-Type:</span> {debugInfo.networkInfo.headers['content-type'] || 'N/A'}
            </div>
          </div>
        </div>

        {/* API Response */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">API Response</h4>
          <div className="bg-muted p-3 rounded-md text-sm">
            <pre className="whitespace-pre-wrap overflow-auto max-h-64">
              {JSON.stringify(debugInfo.apiResponse, null, 2)}
            </pre>
          </div>
        </div>

        {/* Headers */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Response Headers</h4>
          <div className="bg-muted p-3 rounded-md text-sm">
            <pre className="whitespace-pre-wrap overflow-auto max-h-32">
              {JSON.stringify(debugInfo.networkInfo.headers, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

