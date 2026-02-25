'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  FileText,
  Users,
  Building2,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface SearchResult {
  type: 'contract' | 'promoter' | 'party';
  id: string;
  title: string;
  subtitle: string;
  url: string;
  created_at: string;
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  total: number;
  query: string;
  searchType: string;
  message?: string;
}

const typeIcons = {
  contract: FileText,
  promoter: Users,
  party: Building2,
};

const typeColors = {
  contract: 'bg-blue-100 text-blue-800',
  promoter: 'bg-green-100 text-green-800',
  party: 'bg-purple-100 text-purple-800',
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState('all');

  // Perform search when component mounts or query changes
  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query, searchType]);

  const performSearch = async () => {
    if (query.trim().length < 2) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=${searchType}&limit=50`
      );
      const data: SearchResponse = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.message || 'Search failed');
        setResults([]);
      }
    } catch (err) {

      setError('Failed to perform search');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const groupResultsByType = (results: SearchResult[]) => {
    const grouped = results.reduce(
      (acc, result) => {
        if (!acc[result.type]) {
          acc[result.type] = [];
        }
        acc[result.type]!.push(result);
        return acc;
      },
      {} as Record<string, SearchResult[]>
    );

    return grouped;
  };

  const groupedResults = groupResultsByType(results || []);

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>Search Results</h1>
          <p className='text-muted-foreground'>
            Search across contracts, promoters, and parties
          </p>
        </div>

        {/* Search Form */}
        <Card className='mb-8'>
          <CardContent className='p-6'>
            <form onSubmit={handleSearch} className='space-y-4'>
              <div className='flex gap-4'>
                <div className='flex-1'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      type='text'
                      placeholder='Search contracts, promoters, parties...'
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>
                <div className='flex gap-2'>
                  <select
                    value={searchType}
                    onChange={e => setSearchType(e.target.value)}
                    className='px-3 py-2 border border-input rounded-md bg-background'
                  >
                    <option value='all'>All</option>
                    <option value='contracts'>Contracts</option>
                    <option value='promoters'>Promoters</option>
                    <option value='parties'>Parties</option>
                  </select>
                  <Button
                    type='submit'
                    disabled={isLoading || query.trim().length < 2}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin mr-3' />
            <span className='text-lg'>Searching...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className='p-6 text-center'>
              <p className='text-destructive mb-4'>{error}</p>
              <Button onClick={performSearch}>Try Again</Button>
            </CardContent>
          </Card>
        ) : results.length > 0 ? (
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>
                Found {results.length} result{results.length !== 1 ? 's' : ''}{' '}
                for "{query}"
              </h2>
            </div>

            {Object.entries(groupedResults).map(([type, typeResults]) => {
              const Icon = typeIcons[type as keyof typeof typeIcons];
              const colorClass = typeColors[type as keyof typeof typeColors];

              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Icon className='h-5 w-5' />
                      {type.charAt(0).toUpperCase() + type.slice(1)}s
                      <Badge variant='secondary'>{typeResults.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {typeResults.map(result => (
                        <Link
                          key={`${result.type}-${result.id}`}
                          href={result.url}
                          className='block p-4 border rounded-lg hover:bg-muted/50 transition-colors'
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-1'>
                                <h3 className='font-medium'>{result.title}</h3>
                                <Badge
                                  variant='secondary'
                                  className={colorClass}
                                >
                                  {result.type}
                                </Badge>
                              </div>
                              <p className='text-sm text-muted-foreground mb-2'>
                                {result.subtitle}
                              </p>
                              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                <Clock className='h-3 w-3' />
                                {new Date(
                                  result.created_at
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : query.trim().length >= 2 ? (
          <Card>
            <CardContent className='p-6 text-center'>
              <Search className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-medium mb-2'>No results found</h3>
              <p className='text-muted-foreground mb-4'>
                No results found for "{query}". Try different keywords or check
                your spelling.
              </p>
              <Button variant='outline' onClick={() => setQuery('')}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className='p-6 text-center'>
              <Search className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-medium mb-2'>Start searching</h3>
              <p className='text-muted-foreground'>
                Enter at least 2 characters to search across contracts,
                promoters, and parties.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
