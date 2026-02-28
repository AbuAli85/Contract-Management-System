'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Plus,
  Upload,
  Download,
  RefreshCw,
  BarChart3,
  LayoutGrid,
} from 'lucide-react';

export type PromotersMainTab = 'workforce' | 'analytics';

interface PromotersBusinessHeaderProps {
  activeTab: PromotersMainTab;
  onTabChange: (tab: PromotersMainTab) => void;
  locale: string;
  /** Total count for subtitle */
  totalCount?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onAddPromoter?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  canCreate?: boolean;
  canExport?: boolean;
  canViewAnalytics?: boolean;
  showTabs?: boolean;
}

export function PromotersBusinessHeader({
  activeTab,
  onTabChange,
  locale,
  totalCount = 0,
  isRefreshing = false,
  onRefresh,
  onAddPromoter,
  onImport,
  onExport,
  canCreate = true,
  canExport = true,
  canViewAnalytics = true,
  showTabs = true,
}: PromotersBusinessHeaderProps) {
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
    <header className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Workforce Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage promoters, track compliance, and monitor documents
            {typeof totalCount === 'number' && totalCount >= 0 && (
              <span className="ml-1 font-medium text-foreground/80">
                · {totalCount} {totalCount === 1 ? 'member' : 'members'}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <>
              <Button onClick={handleAdd} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add promoter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </>
          )}
          {canExport && onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
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
              className="gap-2"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {showTabs && (
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange(v as PromotersMainTab)}
          className="w-full"
        >
          <TabsList className="h-10 w-full sm:w-auto sm:inline-flex">
            <TabsTrigger value="workforce" className="gap-2 sm:px-4">
              <LayoutGrid className="h-4 w-4" />
              Workforce
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="gap-2 sm:px-4"
              disabled={!canViewAnalytics}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </header>
  );
}
