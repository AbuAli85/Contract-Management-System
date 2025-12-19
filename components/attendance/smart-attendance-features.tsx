'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  MapPin,
  TrendingDown,
  Bell,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

interface SmartAlert {
  id: string;
  type: 'late' | 'early' | 'location' | 'pattern' | 'missing';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  employeeName: string;
  date: string;
  actionRequired: boolean;
}

interface SmartFeaturesProps {
  companyId: string;
}

export function SmartAttendanceFeatures({ companyId }: SmartFeaturesProps) {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSmartAlerts();
    // Refresh every minute
    const interval = setInterval(fetchSmartAlerts, 60000);
    return () => clearInterval(interval);
  }, [companyId]);

  const fetchSmartAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employer/attendance/smart-alerts?company_id=${companyId}`);
      const data = await response.json();

      if (response.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching smart alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'early':
        return <TrendingDown className="h-4 w-4" />;
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'pattern':
        return <AlertTriangle className="h-4 w-4" />;
      case 'missing':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-orange-500 bg-orange-50';
      case 'low':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading smart alerts...</div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Smart Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
            <p>No alerts detected. All attendance patterns are normal.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Smart Alerts
          <Badge variant="secondary" className="ml-2">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'p-4 rounded-lg border-l-4',
                getSeverityColor(alert.severity)
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getAlertIcon(alert.type)}
                    <span className="font-semibold">{alert.title}</span>
                    <Badge
                      variant={
                        alert.severity === 'high'
                          ? 'destructive'
                          : alert.severity === 'medium'
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>
                      <strong>Employee:</strong> {alert.employeeName}
                    </span>
                    <span>
                      <strong>Date:</strong> {format(parseISO(alert.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                {alert.actionRequired && (
                  <Button size="sm" variant="outline" className="ml-4">
                    Review
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

