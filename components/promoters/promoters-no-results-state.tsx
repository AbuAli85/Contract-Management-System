'use client';

import { Search, FilterX, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PromotersNoResultsStateProps {
  searchTerm?: string;
  hasFiltersApplied: boolean;
  onClearFilters: () => void;
  onClearSearch: () => void;
  locale?: string;
}

export function PromotersNoResultsState({
  searchTerm,
  hasFiltersApplied,
  onClearFilters,
  onClearSearch,
  locale = 'en',
}: PromotersNoResultsStateProps) {
  const isArabic = locale === 'ar';

  const title = isArabic
    ? 'لم يتم العثور على مروجين'
    : 'No promoters found';
  const description = isArabic
    ? searchTerm
      ? `لا توجد نتائج تطابق "${searchTerm}". جرب تعديل مصطلحات البحث أو المرشحات الخاصة بك.`
      : hasFiltersApplied
        ? 'لا توجد مروجين يطابقون المرشحات المطبقة. جرب تعديل المرشحات الخاصة بك.'
        : 'لا توجد مروجين في النظام.'
    : searchTerm
      ? `No results match "${searchTerm}". Try adjusting your search terms or filters.`
      : hasFiltersApplied
        ? 'No promoters match the applied filters. Try adjusting your filters.'
        : 'No promoters in the system.';

  const suggestions = isArabic
    ? [
        'تحقق من إملاء مصطلحات البحث',
        'قم بإزالة بعض المرشحات',
        'جرب مصطلحات بحث مختلفة',
        'تحقق من أن جميع المرشحات صحيحة',
      ]
    : [
        'Check spelling of search terms',
        'Remove some filters',
        'Try different search terms',
        'Verify all filters are correct',
      ];

  return (
    <div className='flex flex-col items-center justify-center py-16 px-4 text-center space-y-6'>
      {/* Icon */}
      <div className='relative'>
        <div className='absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl' />
        <div className='relative w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-full flex items-center justify-center'>
          <Search className='h-12 w-12 text-primary/60' />
        </div>
      </div>

      {/* Title and Description */}
      <div className='space-y-2'>
        <h3 className='text-xl font-semibold text-foreground'>{title}</h3>
        <p className='text-muted-foreground max-w-md'>{description}</p>
      </div>

      {/* Active Filters Summary */}
      {(hasFiltersApplied || searchTerm) && (
        <div className='w-full max-w-2xl space-y-4'>
          <Card className='border bg-muted/50'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-3'>
                <h4 className='text-sm font-semibold text-foreground flex items-center gap-2'>
                  <FilterX className='h-4 w-4' />
                  {isArabic ? 'المرشحات النشطة' : 'Active Filters'}
                </h4>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onClearFilters}
                  className='h-7 text-xs'
                >
                  {isArabic ? 'مسح الكل' : 'Clear All'}
                </Button>
              </div>
              <div className='flex flex-wrap gap-2'>
                {searchTerm && (
                  <Badge
                    variant='secondary'
                    className='group pr-1 flex items-center gap-1'
                  >
                    <span>
                      {isArabic ? 'بحث:' : 'Search:'} "{searchTerm}"
                    </span>
                    <button
                      onClick={onClearSearch}
                      className='ml-1 rounded-full hover:bg-muted p-0.5 transition-colors'
                      aria-label={isArabic ? 'إزالة البحث' : 'Remove search'}
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card className='border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20'>
            <CardContent className='p-4'>
              <h4 className='text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2'>
                {isArabic ? 'اقتراحات' : 'Suggestions'}
              </h4>
              <ul className='space-y-1.5 text-sm text-blue-800 dark:text-blue-200 text-left'>
                {suggestions.map((suggestion, index) => (
                  <li key={index} className='flex items-start gap-2'>
                    <span className='text-blue-600 dark:text-blue-400 mt-0.5'>
                      •
                    </span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-2 justify-center'>
            <Button
              variant='outline'
              onClick={onClearFilters}
              className='gap-2'
            >
              <FilterX className='h-4 w-4' />
              {isArabic ? 'إعادة تعيين المرشحات' : 'Reset Filters'}
            </Button>
            <Button
              variant='outline'
              onClick={() => window.location.reload()}
              className='gap-2'
            >
              <RefreshCw className='h-4 w-4' />
              {isArabic ? 'تحديث الصفحة' : 'Refresh Page'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

