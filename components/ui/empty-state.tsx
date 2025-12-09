import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Book,
  PlayCircle,
  HelpCircle,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
  iconClassName?: string;
  // New enhanced features
  quickTips?: string[]; // Quick tips to display
  helpLink?: string; // Link to help documentation
  videoTutorial?: string; // Link to video tutorial
  showSuggestions?: boolean; // Show helpful suggestions
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  iconClassName,
  quickTips,
  helpLink,
  videoTutorial,
  showSuggestions = true,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* Illustration Circle */}
      <div className='mb-6 relative'>
        <div className='absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl' />
        <div className='relative w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-full flex items-center justify-center'>
          <Icon className={cn('h-12 w-12 text-primary/60', iconClassName)} />
        </div>
      </div>

      {/* Content */}
      <h3 className='text-xl font-semibold text-foreground mb-2'>{title}</h3>
      <p className='text-muted-foreground mb-6 max-w-md'>{description}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className='flex flex-col sm:flex-row gap-3 mb-6'>
          {action &&
            (action.href ? (
              <Button
                asChild
                size='lg'
                className='shadow-lg hover:shadow-xl transition-shadow'
              >
                <a href={action.href}>{action.label}</a>
              </Button>
            ) : (
              <Button
                onClick={action.onClick}
                size='lg'
                className='shadow-lg hover:shadow-xl transition-shadow'
              >
                {action.label}
              </Button>
            ))}
          {secondaryAction &&
            (secondaryAction.href ? (
              <Button asChild variant='outline' size='lg'>
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              </Button>
            ) : (
              <Button
                onClick={secondaryAction.onClick}
                variant='outline'
                size='lg'
              >
                {secondaryAction.label}
              </Button>
            ))}
        </div>
      )}

      {/* Quick Tips */}
      {quickTips && quickTips.length > 0 && showSuggestions && (
        <div className='w-full max-w-md mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg'>
          <div className='flex items-start gap-2 mb-3'>
            <Lightbulb className='h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0' />
            <h4 className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
              Quick Start Tips
            </h4>
          </div>
          <ul className='space-y-2 text-left'>
            {quickTips.map((tip, index) => (
              <li
                key={index}
                className='flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200'
              >
                <ChevronRight className='h-4 w-4 flex-shrink-0 mt-0.5' />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Help Resources */}
      {showSuggestions && (helpLink || videoTutorial) && (
        <div className='flex flex-wrap items-center justify-center gap-3 mt-6'>
          {helpLink && (
            <Button variant='ghost' size='sm' asChild className='text-xs'>
              <a href={helpLink} target='_blank' rel='noopener noreferrer'>
                <Book className='h-3.5 w-3.5 mr-1.5' />
                Read Documentation
              </a>
            </Button>
          )}
          {videoTutorial && (
            <Button variant='ghost' size='sm' asChild className='text-xs'>
              <a href={videoTutorial} target='_blank' rel='noopener noreferrer'>
                <PlayCircle className='h-3.5 w-3.5 mr-1.5' />
                Watch Tutorial
              </a>
            </Button>
          )}
          <Button variant='ghost' size='sm' className='text-xs'>
            <HelpCircle className='h-3.5 w-3.5 mr-1.5' />
            Get Help
          </Button>
        </div>
      )}
    </div>
  );
}

// Specific empty state variants for common scenarios
export function EmptySearchState({
  searchTerm,
  onClearSearch,
  className,
}: {
  searchTerm: string;
  onClearSearch: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className='mb-4 w-20 h-20 bg-muted rounded-full flex items-center justify-center'>
        <svg
          className='h-10 w-10 text-muted-foreground'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      </div>
      <h3 className='text-lg font-semibold mb-2'>
        No results found for "{searchTerm}"
      </h3>
      <p className='text-muted-foreground mb-4 max-w-sm'>
        We couldn't find anything matching your search. Try adjusting your
        filters or search term.
      </p>
      <Button variant='outline' onClick={onClearSearch}>
        Clear search
      </Button>
    </div>
  );
}
