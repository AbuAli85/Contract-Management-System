'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Download,
  Upload,
  FileText,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Settings,
  BarChart3,
  Filter,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  onClick: () => void;
  badge?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  shortcut?: string;
}

interface PromotersQuickActionsPanelProps {
  onAddPromoter?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onBulkAction?: (action: string) => void;
  onViewAnalytics?: () => void;
  onSendNotification?: () => void;
  onScheduleMeeting?: () => void;
  selectedCount?: number;
  className?: string;
}

export function PromotersQuickActionsPanel({
  onAddPromoter,
  onImport,
  onExport,
  onBulkAction,
  onViewAnalytics,
  onSendNotification,
  onScheduleMeeting,
  selectedCount = 0,
  className,
}: PromotersQuickActionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const primaryActions: QuickAction[] = [
    {
      id: 'add',
      label: 'Add Promoter',
      icon: Plus,
      description: 'Create a new promoter profile',
      onClick: () => onAddPromoter?.(),
      variant: 'primary',
      shortcut: 'Ctrl+N',
    },
    {
      id: 'import',
      label: 'Import',
      icon: Upload,
      description: 'Import promoters from CSV/Excel',
      onClick: () => onImport?.(),
      variant: 'default',
      shortcut: 'Ctrl+I',
    },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      description: 'Export current view to Excel/PDF',
      onClick: () => onExport?.(),
      variant: 'default',
      shortcut: 'Ctrl+E',
    },
  ];

  const secondaryActions: QuickAction[] = [
    {
      id: 'analytics',
      label: 'View Analytics',
      icon: BarChart3,
      description: 'Open analytics dashboard',
      onClick: () => onViewAnalytics?.(),
      variant: 'default',
    },
    {
      id: 'notify',
      label: 'Send Notification',
      icon: Mail,
      description: 'Send bulk notifications',
      onClick: () => onSendNotification?.(),
      variant: 'default',
      badge: selectedCount > 0 ? `${selectedCount} selected` : undefined,
    },
    {
      id: 'schedule',
      label: 'Schedule Meeting',
      icon: Calendar,
      description: 'Schedule team meeting',
      onClick: () => onScheduleMeeting?.(),
      variant: 'default',
    },
  ];

  const getVariantStyles = (variant: QuickAction['variant'] = 'default') => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-primary to-blue-600 text-white hover:from-primary/90 hover:to-blue-600/90 shadow-lg';
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-500/90 hover:to-emerald-600/90';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-500/90 hover:to-orange-600/90';
      default:
        return 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700';
    }
  };

  return (
    <Card className={cn('shadow-lg border-2 border-primary/20', className)}>
      <CardHeader className='bg-gradient-to-r from-primary/5 to-blue-500/5 border-b border-primary/10 pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20 p-2 border border-primary/30'>
              <Zap className='h-5 w-5 text-primary' />
            </div>
            <div>
              <CardTitle className='text-lg font-bold flex items-center gap-2'>
                <Sparkles className='h-4 w-4 text-primary' />
                Quick Actions
              </CardTitle>
              <p className='text-xs text-muted-foreground mt-1'>
                Fast access to common tasks
              </p>
            </div>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsExpanded(!isExpanded)}
            className='text-xs'
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className='p-4 space-y-3'>
        {/* Primary Actions */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {primaryActions.map((action) => {
            const Icon = action.icon;
            return (
              <TooltipProvider key={action.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={action.onClick}
                      className={cn(
                        'h-auto py-4 px-4 flex flex-col items-center gap-2 transition-all duration-300',
                        'hover:scale-105 hover:shadow-lg',
                        getVariantStyles(action.variant)
                      )}
                    >
                      <Icon className='h-5 w-5' />
                      <div className='flex flex-col items-center gap-1'>
                        <span className='font-semibold text-sm'>{action.label}</span>
                        {action.shortcut && (
                          <Badge
                            variant='outline'
                            className='text-xs bg-white/20 border-white/30 text-white/90'
                          >
                            {action.shortcut}
                          </Badge>
                        )}
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>{action.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Secondary Actions - Expandable */}
        {isExpanded && (
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700'>
            {secondaryActions.map((action) => {
              const Icon = action.icon;
              return (
                <TooltipProvider key={action.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={action.onClick}
                        variant='outline'
                        className={cn(
                          'h-auto py-3 px-4 flex items-center justify-between gap-2 transition-all duration-300',
                          'hover:scale-105 hover:shadow-md',
                          getVariantStyles('default')
                        )}
                        disabled={action.id === 'notify' && selectedCount === 0}
                      >
                        <div className='flex items-center gap-2'>
                          <Icon className='h-4 w-4' />
                          <span className='font-medium text-sm'>{action.label}</span>
                        </div>
                        {action.badge && (
                          <Badge variant='secondary' className='text-xs'>
                            {action.badge}
                          </Badge>
                        )}
                        <ArrowRight className='h-4 w-4 opacity-50' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>{action.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}

        {/* Bulk Actions Dropdown */}
        {selectedCount > 0 && (
          <div className='pt-3 border-t border-slate-200 dark:border-slate-700'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  className='w-full justify-between bg-primary/5 border-primary/30 hover:bg-primary/10'
                >
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    <span className='font-semibold'>
                      {selectedCount} Promoter{selectedCount > 1 ? 's' : ''} Selected
                    </span>
                  </div>
                  <ArrowRight className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onBulkAction?.('export')}>
                  <Download className='mr-2 h-4 w-4' />
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction?.('notify')}>
                  <Mail className='mr-2 h-4 w-4' />
                  Send Notification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction?.('assign')}>
                  <Users className='mr-2 h-4 w-4' />
                  Assign to Company
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction?.('tag')}>
                  <FileText className='mr-2 h-4 w-4' />
                  Add Tags
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

