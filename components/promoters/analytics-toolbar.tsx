'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Printer, 
  RefreshCw, 
  Maximize2, 
  Search,
  Calendar,
  Filter,
  Settings,
  Share2,
  BookmarkPlus,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsToolbarProps {
  totalRecords: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  onPrint?: () => void;
  onFullScreen?: () => void;
  lastUpdated?: string | undefined;
  className?: string;
}

export function AnalyticsToolbar({
  totalRecords,
  isLoading = false,
  onRefresh,
  onExport,
  onPrint,
  onFullScreen,
  lastUpdated,
  className
}: AnalyticsToolbarProps) {
  const [timeRange, setTimeRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState('off');

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 space-y-4",
      className
    )}>
      {/* Top Row - Main Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Workforce Analytics
            </h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {totalRecords.toLocaleString()} Records
            </Badge>
          </div>
          
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Auto Refresh */}
          <Select value={autoRefresh} onValueChange={setAutoRefresh}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Auto refresh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Manual</SelectItem>
              <SelectItem value="30s">30 seconds</SelectItem>
              <SelectItem value="1m">1 minute</SelectItem>
              <SelectItem value="5m">5 minutes</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            {isLoading ? 'Updating...' : 'Refresh'}
          </Button>

          {/* Export Dropdown */}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.('pdf')}
              className="gap-2 rounded-r-none"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <div className="flex">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.('excel')}
                className="rounded-none border-l-0 px-3"
                title="Export to Excel"
              >
                XLS
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.('csv')}
                className="rounded-l-none border-l-0 px-3"
                title="Export to CSV"
              >
                CSV
              </Button>
            </div>
          </div>

          {/* Print Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>

          {/* Full Screen */}
          <Button
            variant="outline"
            size="sm"
            onClick={onFullScreen}
            className="gap-2"
          >
            <Maximize2 className="h-4 w-4" />
            Full Screen
          </Button>
        </div>
      </div>

      {/* Bottom Row - Filters and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search analytics data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Time Range Filter */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters */}
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Dashboard */}
          <Button variant="outline" size="sm" className="gap-2">
            <BookmarkPlus className="h-4 w-4" />
            Save View
          </Button>

          {/* Share */}
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          {/* Settings */}
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchQuery || timeRange !== 'all') && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <span className="text-sm text-slate-600 dark:text-slate-400">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchQuery}"
              <button 
                onClick={() => setSearchQuery('')}
                className="ml-1 text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </Badge>
          )}
          {timeRange !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Time: {timeRange}
              <button 
                onClick={() => setTimeRange('all')}
                className="ml-1 text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
