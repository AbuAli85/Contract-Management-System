'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Plus,
  Upload,
  Search,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface EnhancedEmptyStateProps {
  type: 'no-data' | 'no-results' | 'error';
  searchTerm?: string;
  onAddPromoter?: () => void;
  onImport?: () => void;
  onClearFilters?: () => void;
  onRetry?: () => void;
}

/**
 * Enhanced empty states with contextual actions and guidance
 */
export function PromotersEnhancedEmptyState({
  type,
  searchTerm,
  onAddPromoter,
  onImport,
  onClearFilters,
  onRetry,
}: EnhancedEmptyStateProps) {
  if (type === 'no-data') {
    return (
      <Card className='border-2 border-dashed'>
        <CardContent className='flex flex-col items-center justify-center py-16 px-6'>
          <div className='rounded-full bg-blue-100 dark:bg-blue-900 p-6 mb-6'>
            <Users className='h-16 w-16 text-blue-600 dark:text-blue-400' />
          </div>
          <h3 className='text-2xl font-bold mb-2'>No Promoters Yet</h3>
          <p className='text-muted-foreground text-center max-w-md mb-6'>
            Get started by adding your first promoter to the system. You can add
            them individually or import multiple promoters from a CSV file.
          </p>
          <div className='flex flex-wrap gap-3 justify-center'>
            {onAddPromoter && (
              <Button onClick={onAddPromoter} size='lg' className='shadow-lg'>
                <Plus className='mr-2 h-5 w-5' />
                Add First Promoter
              </Button>
            )}
            {onImport && (
              <Button variant='outline' onClick={onImport} size='lg'>
                <Upload className='mr-2 h-5 w-5' />
                Import from CSV
              </Button>
            )}
          </div>
          <div className='mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 max-w-md'>
            <div className='flex items-start gap-3'>
              <FileText className='h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
              <div className='text-sm space-y-1'>
                <p className='font-medium text-blue-900 dark:text-blue-100'>
                  Quick Start Guide
                </p>
                <ul className='text-blue-700 dark:text-blue-300 space-y-1 ml-1'>
                  <li>• Add promoter details (name, contact, documents)</li>
                  <li>• Upload ID card and passport copies</li>
                  <li>• Assign to a company or employer</li>
                  <li>• Create contracts and track assignments</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'no-results') {
    return (
      <Card className='border-2 border-dashed border-yellow-200 dark:border-yellow-800'>
        <CardContent className='flex flex-col items-center justify-center py-16 px-6'>
          <div className='rounded-full bg-yellow-100 dark:bg-yellow-900 p-6 mb-6'>
            <Search className='h-16 w-16 text-yellow-600 dark:text-yellow-400' />
          </div>
          <h3 className='text-2xl font-bold mb-2'>
            No Matching Promoters Found
          </h3>
          <p className='text-muted-foreground text-center max-w-md mb-6'>
            {searchTerm ? (
              <>
                We couldn't find any promoters matching{' '}
                <strong className='text-foreground'>"{searchTerm}"</strong>. Try
                adjusting your search or filters to see more results.
              </>
            ) : (
              <>
                No promoters match your current filter criteria. Try adjusting
                your filters or clearing them to view all promoters.
              </>
            )}
          </p>
          <div className='flex flex-wrap gap-3 justify-center mb-6'>
            {onClearFilters && (
              <Button onClick={onClearFilters} size='lg' className='shadow-md'>
                <Search className='mr-2 h-5 w-5' />
                Clear All Filters
              </Button>
            )}
            {onAddPromoter && (
              <Button variant='outline' onClick={onAddPromoter} size='lg'>
                <Plus className='mr-2 h-5 w-5' />
                Add New Promoter
              </Button>
            )}
          </div>
          <div className='mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800 max-w-md w-full'>
            <div className='flex items-start gap-3'>
              <Search className='h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5' />
              <div className='text-sm space-y-2'>
                <p className='font-medium text-yellow-900 dark:text-yellow-100'>
                  {searchTerm ? 'Search Tips:' : 'Filter Tips:'}
                </p>
                <ul className='text-yellow-700 dark:text-yellow-300 space-y-1 ml-1'>
                  {searchTerm ? (
                    <>
                      <li>• Try shorter or more general keywords</li>
                      <li>• Check for typos in the search term</li>
                      <li>
                        • Search by name, email, phone, or partial ID (4+
                        digits)
                      </li>
                      <li>• Remove some filters to broaden your search</li>
                      <li>• Use advanced search for complex queries</li>
                    </>
                  ) : (
                    <>
                      <li>• Try removing one filter at a time</li>
                      <li>• Check if status filters are too restrictive</li>
                      <li>• Verify document health filters</li>
                      <li>• Clear all filters to see all promoters</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'error') {
    return (
      <Card className='border-2 border-destructive'>
        <CardContent className='flex flex-col items-center justify-center py-16 px-6'>
          <div className='rounded-full bg-red-100 dark:bg-red-900 p-6 mb-6'>
            <AlertTriangle className='h-16 w-16 text-red-600 dark:text-red-400' />
          </div>
          <h3 className='text-2xl font-bold mb-2 text-destructive'>
            Unable to Load Promoters
          </h3>
          <p className='text-muted-foreground text-center max-w-md mb-6'>
            We encountered an error while loading promoter data. This could be
            due to network issues or a temporary server problem.
          </p>
          <div className='flex flex-wrap gap-3 justify-center'>
            {onRetry && (
              <Button onClick={onRetry} size='lg' variant='destructive'>
                <RefreshCw className='mr-2 h-5 w-5' />
                Retry Loading
              </Button>
            )}
            <Button
              variant='outline'
              onClick={() => window.location.reload()}
              size='lg'
            >
              Reload Page
            </Button>
          </div>
          <div className='mt-8 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 max-w-md'>
            <p className='text-sm text-red-800 dark:text-red-200'>
              <strong>Troubleshooting:</strong>
            </p>
            <ul className='text-sm text-red-700 dark:text-red-300 space-y-1 mt-2 ml-1'>
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Clear your browser cache</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
