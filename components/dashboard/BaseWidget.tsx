'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, X, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import type { WidgetProps, WidgetConfig } from '@/lib/types/dashboard';

interface BaseWidgetProps extends WidgetProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  headerActions?: React.ReactNode;
  footerActions?: React.ReactNode;
}

export function BaseWidget({
  id,
  title,
  description,
  icon,
  children,
  config,
  isLoading = false,
  error = null,
  editMode = false,
  onConfigChange,
  onRemove,
  onRefresh,
  headerActions,
  footerActions,
}: BaseWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const showHeader = config.displayOptions?.showHeader !== false;
  const showFooter = config.displayOptions?.showFooter !== false;

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleRemove = () => {
    if (onRemove && confirm('Remove this widget from your dashboard?')) {
      onRemove();
    }
  };

  const handleConfigure = () => {
    setIsConfiguring(true);
    // Configuration panel will be shown in a modal/drawer
  };

  return (
    <Card className={`h-full flex flex-col ${editMode ? 'ring-2 ring-orange-300' : ''}`}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
              {description && (
                <CardDescription className="text-xs truncate">{description}</CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {headerActions}
            
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            {onConfigChange && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleConfigure}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            
            {editMode && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className={`flex-1 ${showHeader ? 'pt-2' : 'pt-6'} overflow-auto`}>
        {error ? (
          <div className="flex items-center justify-center h-full text-sm text-destructive">
            <p>{error}</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          children
        )}
      </CardContent>

      {showFooter && footerActions && (
        <div className="px-6 pb-4 border-t pt-2 mt-2">
          {footerActions}
        </div>
      )}
    </Card>
  );
}

