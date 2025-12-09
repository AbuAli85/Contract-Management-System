'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2, FileText, Users, Building2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export interface SearchResult {
  id: string;
  type: 'contract' | 'promoter' | 'party';
  title: string;
  subtitle: string;
  url: string;
  metadata?: Record<string, any>;
}

const typeConfig = {
  contract: {
    icon: FileText,
    label: 'Contract',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  promoter: {
    icon: Users,
    label: 'Promoter',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  party: {
    icon: Building2,
    label: 'Party',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
};

/**
 * Global Search Component
 *
 * Searches across contracts, promoters, and parties
 * with debouncing and keyboard navigation
 *
 * @example
 * ```tsx
 * <GlobalSearch placeholder="Search contracts, promoters, parties..." />
 * ```
 */
export function GlobalSearch({
  placeholder = 'Search...',
  className,
  onResultSelect,
}: {
  placeholder?: string;
  className?: string;
  onResultSelect?: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      router.push(result.url);
    }
    setIsOpen(false);
    setQuery('');
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-search-container]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={cn('relative w-full max-w-2xl', className)}
      data-search-container
    >
      {/* Search Input */}
      <div className='relative'>
        <Search
          className='absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400'
          size={20}
          aria-hidden='true'
        />
        <input
          ref={inputRef}
          type='text'
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full ps-10 pe-10 py-2.5',
            'border border-gray-300 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'text-sm',
            'transition-all'
          )}
          role='combobox'
          aria-label='Global search'
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-autocomplete='list'
          aria-controls='search-results'
          data-search-input
        />

        {/* Clear/Loading Button */}
        <div className='absolute end-3 top-1/2 transform -translate-y-1/2'>
          {isLoading ? (
            <Loader2
              className='text-gray-400 animate-spin'
              size={18}
              aria-label='Loading'
            />
          ) : query ? (
            <button
              onClick={handleClear}
              className='text-gray-400 hover:text-gray-600 transition-colors'
              aria-label='Clear search'
            >
              <X size={18} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          id='search-results'
          role='listbox'
          className={cn(
            'absolute top-full mt-2 w-full',
            'bg-white border border-gray-200 rounded-lg shadow-lg',
            'max-h-96 overflow-y-auto',
            'z-50'
          )}
        >
          {/* Results Count */}
          <div className='px-3 py-2 text-xs text-gray-500 border-b'>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>

          {/* Results List */}
          <div className='py-1'>
            {results.map((result, index) => {
              const config = typeConfig[result.type];
              const Icon = config.icon;

              return (
                <button
                  key={`${result.type}-${result.id}`}
                  role='option'
                  aria-selected={index === selectedIndex ? 'true' : 'false'}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    'w-full px-3 py-3 text-start',
                    'hover:bg-gray-50 transition-colors',
                    'border-b last:border-b-0',
                    'focus:outline-none focus:bg-gray-100',
                    index === selectedIndex && 'bg-gray-50'
                  )}
                >
                  <div className='flex items-start space-x-3'>
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 p-2 rounded-lg',
                        config.bgColor
                      )}
                    >
                      <Icon
                        className={config.color}
                        size={18}
                        aria-hidden='true'
                      />
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-gray-900 truncate'>
                        {result.title}
                      </div>
                      <div className='text-sm text-gray-600 truncate'>
                        {result.subtitle}
                      </div>
                      <div className='mt-1'>
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 text-xs rounded-full',
                            config.color,
                            config.bgColor
                          )}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Keyboard Hints */}
          <div className='px-3 py-2 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between'>
            <span>Navigate with ↑↓, select with ↵</span>
            <span>ESC to close</span>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div
          className={cn(
            'absolute top-full mt-2 w-full',
            'bg-white border border-gray-200 rounded-lg shadow-lg',
            'px-4 py-8 text-center text-gray-500 text-sm',
            'z-50'
          )}
        >
          <Search className='mx-auto mb-2 text-gray-400' size={24} />
          <p>No results found for "{query}"</p>
          <p className='text-xs mt-1'>Try searching with different keywords</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact search variant (for navbar)
 */
export function CompactSearch({ className }: { className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn('relative', className)}>
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          aria-label='Open search'
        >
          <Search size={20} />
        </button>
      ) : (
        <div className='absolute end-0 top-0 w-64 sm:w-96'>
          <GlobalSearch
            placeholder='Quick search...'
            onResultSelect={() => setIsExpanded(false)}
          />
        </div>
      )}
    </div>
  );
}
