import {
  FileText,
  Search,
  Plus,
  Filter,
  Lightbulb,
  Book,
  HelpCircle,
} from 'lucide-react';
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
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const config = {
    'no-contracts': {
      icon: FileText,
      title: 'No contracts yet',
      description:
        message ||
        'Get started by creating your first contract. It only takes a few minutes.',
      tips: [
        'Choose a contract type (eXtra, General, or Sharaf DG)',
        'Select promoters and assign parties',
        'Review and customize contract terms',
        'Generate and download your professional contract',
      ],
      defaultAction: {
        label: 'Create Your First Contract',
        href: `/${locale}/generate-contract`,
      },
    },
    'no-results': {
      icon: Search,
      title: 'No contracts found',
      description:
        message ||
        "Try adjusting your search or filter criteria to find what you're looking for.",
      tips: [
        'Check your spelling and try again',
        'Use broader search terms',
        'Clear filters to see all contracts',
        'Try searching by party name or promoter name',
      ],
      defaultAction: {
        label: 'Clear Filters',
        onClick: () => window.location.reload(),
      },
    },
    'no-permission': {
      icon: Filter,
      title: 'No access',
      description:
        message ||
        "You don't have permission to view contracts. Contact your administrator for access.",
      defaultAction: undefined,
    },
    error: {
      icon: FileText,
      title: 'Unable to load contracts',
      description:
        message || 'There was an error loading contracts. Please try again.',
      defaultAction: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    },
  };

  const {
    icon: Icon,
    title,
    description,
    defaultAction,
    tips,
  } = config[variant];
  const finalAction = action || defaultAction;

  return (
    <Card className='border-dashed border-2'>
      <CardContent className='flex flex-col items-center justify-center py-16 px-4'>
        <div className='rounded-full bg-muted p-6 mb-4 relative'>
          <div className='absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-lg' />
          <Icon className='h-10 w-10 text-muted-foreground relative z-10' />
        </div>
        <h3 className='text-lg font-semibold mb-2'>{title}</h3>
        <p className='text-sm text-muted-foreground text-center max-w-md mb-6'>
          {description}
        </p>

        {/* Quick Tips */}
        {tips && tips.length > 0 && (
          <div className='w-full max-w-md mb-6 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg'>
            <div className='flex items-center gap-2 mb-3'>
              <Lightbulb className='h-4 w-4 text-blue-600 dark:text-blue-400' />
              <h4 className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
                Getting Started
              </h4>
            </div>
            <ol className='space-y-2 text-left list-decimal list-inside'>
              {tips.map((tip, index) => (
                <li
                  key={index}
                  className='text-sm text-blue-800 dark:text-blue-200'
                >
                  {tip}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Primary Action */}
        {finalAction && (
          <>
            {'href' in finalAction && finalAction.href ? (
              <Link href={finalAction.href}>
                <Button size='lg' className='shadow-lg'>
                  <Plus className='h-4 w-4 mr-2' />
                  {finalAction.label}
                </Button>
              </Link>
            ) : 'onClick' in finalAction && finalAction.onClick ? (
              <Button
                onClick={finalAction.onClick}
                size='lg'
                className='shadow-lg'
              >
                {finalAction.label}
              </Button>
            ) : null}
          </>
        )}

        {/* Help Resources */}
        <div className='flex flex-wrap items-center justify-center gap-3 mt-6'>
          <Button variant='ghost' size='sm' className='text-xs' asChild>
            <Link href='/help'>
              <Book className='h-3.5 w-3.5 mr-1.5' />
              Documentation
            </Link>
          </Button>
          <Button variant='ghost' size='sm' className='text-xs'>
            <HelpCircle className='h-3.5 w-3.5 mr-1.5' />
            Support
          </Button>
        </div>
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
    <div className='flex flex-col items-center justify-center py-8 px-4 text-center'>
      <Icon className='h-8 w-8 text-muted-foreground mb-2' />
      <p className='text-sm text-muted-foreground'>{message}</p>
    </div>
  );
}
