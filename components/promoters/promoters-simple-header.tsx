'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Upload,
  Download,
  RefreshCw,
  BarChart3,
  UserCircle,
} from 'lucide-react';

interface PromotersSimpleHeaderProps {
  locale: string;
  totalCount?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onAddPromoter?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onViewAnalytics?: () => void;
  canCreate?: boolean;
  canExport?: boolean;
  canViewAnalytics?: boolean;
}

export function PromotersSimpleHeader({
  locale,
  totalCount = 0,
  isRefreshing = false,
  onRefresh,
  onAddPromoter,
  onImport,
  onExport,
  onViewAnalytics,
  canCreate = true,
  canExport = true,
  canViewAnalytics = true,
}: PromotersSimpleHeaderProps) {
  const derivedLocale = useMemo(() => {
    if (locale && typeof locale === 'string') return locale;
    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      return segments[0] || 'en';
    }
    return 'en';
  }, [locale]);

  const router = useRouter();

  const handleAdd = () => {
    if (onAddPromoter) {
      onAddPromoter();
    } else {
      router.push(`/${derivedLocale}/manage-promoters/new`);
    }
  };

  const handleImport = () => {
    if (onImport) {
      onImport();
    } else {
      router.push(`/${derivedLocale}/csv-import`);
    }
  };

  return (
    <header className="border-b border-border/60 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-muted-foreground" />
            Promoters
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Profiles, details, and compliance
            {typeof totalCount === 'number' && totalCount >= 0 && (
              <span className="ml-1.5 font-medium text-foreground/70">
                · {totalCount} {totalCount === 1 ? 'profile' : 'profiles'}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <>
              <Button onClick={handleAdd} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                className="gap-1.5"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </>
          )}
          {canExport && onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-1.5"
              aria-label="Refresh"
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
              Refresh
            </Button>
          )}
          {canViewAnalytics && onViewAnalytics && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAnalytics}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
