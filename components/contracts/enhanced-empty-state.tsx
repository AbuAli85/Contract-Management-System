import { FileText, Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

/**
 * Enhanced Empty State Component
 * Provides helpful guidance when no data is available
 */

interface EnhancedEmptyStateProps {
  variant: 'no-contracts' | 'no-results' | 'no-permission' | 'error';
  message?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EnhancedEmptyState({
  variant,
  message,
  action,
}: EnhancedEmptyStateProps) {
  const config = {
    'no-contracts': {
      icon: FileText,
      title: 'No contracts yet',
      description: message || 'Get started by creating your first contract. It only takes a few minutes.',
      defaultAction: {
        label: 'Create Contract',
        href: '/contracts/new',
      },
    },
    'no-results': {
      icon: Search,
      title: 'No contracts found',
      description: message || 'Try adjusting your search or filter criteria to find what you\'re looking for.',
      defaultAction: {
        label: 'Clear Filters',
        onClick: () => window.location.reload(),
      },
    },
    'no-permission': {
      icon: Filter,
      title: 'No access',
      description: message || 'You don\'t have permission to view contracts. Contact your administrator for access.',
      defaultAction: undefined,
    },
    error: {
      icon: FileText,
      title: 'Unable to load contracts',
      description: message || 'There was an error loading contracts. Please try again.',
      defaultAction: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    },
  };

  const { icon: Icon, title, description, defaultAction } = config[variant];
  const finalAction = action || defaultAction;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          {description}
        </p>
        {finalAction && (
          <>
            {'href' in finalAction && finalAction.href ? (
              <Link href={finalAction.href}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {finalAction.label}
                </Button>
              </Link>
            ) : 'onClick' in finalAction && finalAction.onClick ? (
              <Button onClick={finalAction.onClick}>
                {finalAction.label}
              </Button>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact Empty State for smaller spaces
 */
export function CompactEmptyState({
  message = 'No items found',
  icon: Icon = FileText,
}: {
  message?: string;
  icon?: any;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Icon className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

