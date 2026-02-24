'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  X,
  User,
  Mail,
  Phone,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  maskIdNumber,
  formatIdForSuggestion,
  isIdSearch,
} from '@/lib/utils/id-masking';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  idCard?: string;
  type: 'name' | 'email' | 'phone' | 'id';
  matchText: string;
}

interface PromotersSearchWithAutocompleteProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
  locale?: string;
}

async function fetchSearchSuggestions(
  query: string
): Promise<SearchSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/promoters?search=${encodeURIComponent(query)}&limit=10&page=1`,
      {
        credentials: 'include',
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!data.success || !data.promoters) {
      return [];
    }

    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    data.promoters.forEach((promoter: any) => {
      // Name matches
      if (promoter.name_en?.toLowerCase().includes(queryLower)) {
        suggestions.push({
          id: `${promoter.id}-name`,
          name: promoter.name_en || promoter.name_ar || 'Unknown',
          email: promoter.email,
          phone: promoter.mobile_number || promoter.phone,
          idCard: promoter.id_card_number,
          type: 'name',
          matchText: promoter.name_en || promoter.name_ar || '',
        });
      }

      // Email matches
      if (promoter.email?.toLowerCase().includes(queryLower)) {
        suggestions.push({
          id: `${promoter.id}-email`,
          name: promoter.name_en || promoter.name_ar || 'Unknown',
          email: promoter.email,
          phone: promoter.mobile_number || promoter.phone,
          type: 'email',
          matchText: promoter.email,
        });
      }

      // Phone matches
      const phone = promoter.mobile_number || promoter.phone;
      if (phone?.includes(query)) {
        suggestions.push({
          id: `${promoter.id}-phone`,
          name: promoter.name_en || promoter.name_ar || 'Unknown',
          email: promoter.email,
          phone,
          type: 'phone',
          matchText: phone,
        });
      }

      // ID card matches (only if query is long enough for security)
      if (
        isIdSearch(query) &&
        promoter.id_card_number?.toLowerCase().includes(queryLower)
      ) {
        suggestions.push({
          id: `${promoter.id}-id`,
          name: promoter.name_en || promoter.name_ar || 'Unknown',
          email: promoter.email,
          phone: promoter.mobile_number || promoter.phone,
          idCard: promoter.id_card_number,
          type: 'id',
          matchText: formatIdForSuggestion(promoter.id_card_number, query),
        });
      }
    });

    // Remove duplicates and limit to 8 suggestions
    const unique = Array.from(
      new Map(suggestions.map(s => [s.id, s])).values()
    ).slice(0, 8);

    return unique;
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return [];
  }
}

export const PromotersSearchWithAutocomplete = React.memo(
  ({
    searchTerm,
    onSearchChange,
    isSearching = false,
    locale = 'en',
  }: PromotersSearchWithAutocompleteProps) => {
    const [localValue, setLocalValue] = useState(searchTerm);
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Update local value when searchTerm prop changes
    useEffect(() => {
      setLocalValue(searchTerm);
    }, [searchTerm]);

    // Fetch suggestions when user types
    const { data: suggestions = [], isLoading: isLoadingSuggestions } =
      useQuery<SearchSuggestion[]>({
        queryKey: ['promoter-search-suggestions', localValue],
        queryFn: () => fetchSearchSuggestions(localValue),
        enabled: localValue.length >= 2 && isFocused,
        staleTime: 1000,
        gcTime: 5000,
      });

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onSearchChange(newValue);
        setShowSuggestions(newValue.length >= 2);
      },
      [onSearchChange]
    );

    const handleClear = useCallback(() => {
      setLocalValue('');
      onSearchChange('');
      setShowSuggestions(false);
    }, [onSearchChange]);

    const handleSuggestionSelect = useCallback(
      (suggestion: SearchSuggestion) => {
        // Use the match text for the search
        let searchValue = '';
        switch (suggestion.type) {
          case 'name':
            searchValue = suggestion.name;
            break;
          case 'email':
            searchValue = suggestion.email || '';
            break;
          case 'phone':
            searchValue = suggestion.phone || '';
            break;
          case 'id':
            // For ID searches, use the original query that matched
            searchValue = localValue;
            break;
        }
        setLocalValue(searchValue);
        onSearchChange(searchValue);
        setShowSuggestions(false);
        inputRef.current?.blur();
      },
      [localValue, onSearchChange]
    );

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl+K or Cmd+K for quick search focus
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          inputRef.current?.focus();
        }

        // Escape to clear search
        if (e.key === 'Escape' && localValue) {
          handleClear();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [localValue, handleClear]);

    const hasSuggestions = suggestions.length > 0 && showSuggestions;
    const showAutocomplete = isFocused && localValue.length >= 2;

    return (
      <div className='space-y-3'>
        <div className='flex items-center justify-between flex-wrap gap-2'>
          <Label
            htmlFor='promoter-search'
            className='text-sm font-medium whitespace-nowrap'
          >
            Search promoters
          </Label>
          <div className='flex items-center gap-3 flex-wrap'>
            {isSearching && localValue && (
              <div className='flex items-center gap-2 text-xs text-blue-600'>
                <Loader2 className='h-3 w-3 animate-spin flex-shrink-0' />
                <span className='whitespace-nowrap'>Searching...</span>
              </div>
            )}
            <span className='text-xs text-muted-foreground hidden sm:inline whitespace-nowrap'>
              Press{' '}
              <kbd className='px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600'>
                Ctrl+K
              </kbd>{' '}
              for focus •{' '}
              <kbd className='px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600'>
                Esc
              </kbd>{' '}
              to clear
            </span>
          </div>
        </div>
        <div className='relative'>
          <Search
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
              isFocused || localValue
                ? 'text-indigo-600'
                : 'text-muted-foreground'
            )}
          />
          <Input
            ref={inputRef}
            id='promoter-search'
            placeholder='Search by name, email, phone, or ID...'
            className={cn(
              'pl-10 pr-10 transition-all',
              isFocused
                ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
            )}
            value={localValue}
            onChange={handleChange}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(localValue.length >= 2);
            }}
            onBlur={() => {
              // Delay to allow suggestion clicks
              setTimeout(() => {
                setIsFocused(false);
                setShowSuggestions(false);
              }, 200);
            }}
            aria-label='Search promoters by name, contact, or ID'
            aria-describedby='search-help'
            aria-expanded={showAutocomplete && hasSuggestions}
            aria-controls='search-suggestions'
            autoComplete='off'
            spellCheck='false'
          />
          {localValue && (
            <button
              onClick={handleClear}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
              aria-label='Clear search'
              type='button'
            >
              <X className='h-4 w-4' />
            </button>
          )}

          {/* Autocomplete Suggestions */}
          {showAutocomplete && (
            <div
              id='search-suggestions'
              className='absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg dark:bg-slate-900'
            >
              {isLoadingSuggestions ? (
                <div className='flex items-center justify-center p-4'>
                  <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                  <span className='ml-2 text-sm text-muted-foreground'>
                    Searching...
                  </span>
                </div>
              ) : hasSuggestions ? (
                <div className='max-h-64 overflow-y-auto p-1'>
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion.id}
                      type='button'
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className='w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                    >
                      <div className='flex items-center gap-2'>
                        {suggestion.type === 'name' && (
                          <User className='h-4 w-4 text-muted-foreground' />
                        )}
                        {suggestion.type === 'email' && (
                          <Mail className='h-4 w-4 text-muted-foreground' />
                        )}
                        {suggestion.type === 'phone' && (
                          <Phone className='h-4 w-4 text-muted-foreground' />
                        )}
                        {suggestion.type === 'id' && (
                          <CreditCard className='h-4 w-4 text-muted-foreground' />
                        )}
                        <div className='flex-1'>
                          <div className='font-medium'>{suggestion.name}</div>
                          <div className='text-xs text-muted-foreground'>
                            {suggestion.type === 'name' && suggestion.email && (
                              <span>{suggestion.email}</span>
                            )}
                            {suggestion.type === 'email' && (
                              <span>{suggestion.email}</span>
                            )}
                            {suggestion.type === 'phone' && (
                              <span>{suggestion.phone}</span>
                            )}
                            {suggestion.type === 'id' && (
                              <span className='font-mono'>
                                {suggestion.matchText}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant='outline' className='text-xs'>
                          {suggestion.type}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : localValue.length >= 2 ? (
                <div className='p-4 text-center text-sm text-muted-foreground'>
                  No suggestions found. Try different keywords.
                </div>
              ) : null}
            </div>
          )}
        </div>
        <div className='flex items-center justify-between flex-wrap gap-2'>
          <p
            id='search-help'
            className='text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap'
          >
            <span className='whitespace-nowrap'>Press</span>
            <kbd className='px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 whitespace-nowrap'>
              Ctrl+K
            </kbd>
            <span className='whitespace-nowrap'>for focus</span>
            <span className='hidden sm:inline'>•</span>
            <kbd className='px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 whitespace-nowrap'>
              Esc
            </kbd>
            <span className='whitespace-nowrap'>to clear</span>
          </p>
          {localValue && !isSearching && (
            <div className='flex items-center gap-1 text-xs whitespace-nowrap'>
              <span className='text-green-600 font-medium'>✓</span>
              <span className='text-muted-foreground'>Search applied</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

PromotersSearchWithAutocomplete.displayName = 'PromotersSearchWithAutocomplete';
