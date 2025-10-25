'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  TrendingUp,
  Users
} from 'lucide-react';
import { differenceInDays, format, addDays } from 'date-fns';
import type { DashboardPromoter } from './types';

interface DocumentExpiryData {
  month: string;
  expired: number;
  expiringSoon: number; // Next 30 days
  expiringLater: number; // 31-90 days
  total: number;
}

interface PromotersDocumentExpiryChartProps {
  promoters: DashboardPromoter[];
  title?: string;
  description?: string;
}

export function PromotersDocumentExpiryChart({
  promoters,
  title = "Document Expiry Timeline",
  description = "Track document expiration patterns over the next 12 months"
}: PromotersDocumentExpiryChartProps) {
  
  const expiryData = useMemo(() => {
    const now = new Date();
    const data: DocumentExpiryData[] = [];
    
    // Generate next 12 months
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const monthName = format(monthStart, 'MMM yyyy');
      
      let expired = 0;
      let expiringSoon = 0;
      let expiringLater = 0;
      
      promoters.forEach(promoter => {
        // Check ID card expiry
        if (promoter.id_card_expiry_date) {
          const expiryDate = new Date(promoter.id_card_expiry_date);
          if (expiryDate >= monthStart && expiryDate <= monthEnd) {
            const daysUntilExpiry = differenceInDays(expiryDate, now);
            if (daysUntilExpiry < 0) expired++;
            else if (daysUntilExpiry <= 30) expiringSoon++;
            else if (daysUntilExpiry <= 90) expiringLater++;
          }
        }
        
        // Check passport expiry
        if (promoter.passport_expiry_date) {
          const expiryDate = new Date(promoter.passport_expiry_date);
          if (expiryDate >= monthStart && expiryDate <= monthEnd) {
            const daysUntilExpiry = differenceInDays(expiryDate, now);
            if (daysUntilExpiry < 0) expired++;
            else if (daysUntilExpiry <= 30) expiringSoon++;
            else if (daysUntilExpiry <= 90) expiringLater++;
          }
        }
      });
      
      data.push({
        month: monthName,
        expired,
        expiringSoon,
        expiringLater,
        total: expired + expiringSoon + expiringLater
      });
    }
    
    return data;
  }, [promoters]);

  const maxValue = Math.max(...expiryData.map(d => d.total));
  
  // Current month stats
  const currentStats = useMemo(() => {
    const now = new Date();
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let healthyCount = 0;
    
    promoters.forEach(promoter => {
      const idExpired = promoter.idDocument.status === 'expired';
      const passportExpired = promoter.passportDocument.status === 'expired';
      const idExpiringSoon = promoter.idDocument.status === 'expiring';
      const passportExpiringSoon = promoter.passportDocument.status === 'expiring';
      
      if (idExpired || passportExpired) {
        expiredCount++;
      } else if (idExpiringSoon || passportExpiringSoon) {
        expiringSoonCount++;
      } else {
        healthyCount++;
      }
    });
    
    return { expiredCount, expiringSoonCount, healthyCount };
  }, [promoters]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span>Expired</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span>Expiring Soon</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span>Later</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-700">
                  {currentStats.expiredCount}
                </div>
                <div className="text-sm text-red-600">
                  Documents Expired
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-700">
                  {currentStats.expiringSoonCount}
                </div>
                <div className="text-sm text-orange-600">
                  Expiring Soon (30 days)
                </div>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {currentStats.healthyCount}
                </div>
                <div className="text-sm text-green-600">
                  Documents Healthy
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            12-Month Expiry Forecast
          </div>
          
          <div className="space-y-3">
            {expiryData.map((item, index) => (
              <div key={item.month} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.month}</span>
                  <span className="text-muted-foreground">
                    {item.total} documents
                  </span>
                </div>
                
                <div className="relative">
                  <div className="flex h-4 bg-gray-100 rounded-full overflow-hidden">
                    {/* Expired */}
                    {item.expired > 0 && (
                      <div 
                        className="bg-red-500"
                        style={{ width: `${(item.expired / Math.max(maxValue, 1)) * 100}%` }}
                      />
                    )}
                    {/* Expiring Soon */}
                    {item.expiringSoon > 0 && (
                      <div 
                        className="bg-orange-500"
                        style={{ width: `${(item.expiringSoon / Math.max(maxValue, 1)) * 100}%` }}
                      />
                    )}
                    {/* Expiring Later */}
                    {item.expiringLater > 0 && (
                      <div 
                        className="bg-yellow-500"
                        style={{ width: `${(item.expiringLater / Math.max(maxValue, 1)) * 100}%` }}
                      />
                    )}
                  </div>
                  
                  {/* Hover tooltips */}
                  {item.total > 0 && (
                    <div className="absolute top-full left-0 mt-1 text-xs text-muted-foreground">
                      {item.expired > 0 && <span className="text-red-600">Expired: {item.expired} </span>}
                      {item.expiringSoon > 0 && <span className="text-orange-600">Soon: {item.expiringSoon} </span>}
                      {item.expiringLater > 0 && <span className="text-yellow-600">Later: {item.expiringLater}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        {(currentStats.expiredCount > 0 || currentStats.expiringSoonCount > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Action Required</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  {currentStats.expiredCount > 0 && (
                    <li>• {currentStats.expiredCount} promoters have expired documents that need immediate renewal</li>
                  )}
                  {currentStats.expiringSoonCount > 0 && (
                    <li>• {currentStats.expiringSoonCount} promoters have documents expiring within 30 days</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
