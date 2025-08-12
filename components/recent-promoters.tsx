'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSafeParams } from '@/hooks/use-safe-params';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Eye, Loader2 } from 'lucide-react';

interface RecentPromoter {
  id: string;
  name_en: string;
  name_ar: string;
  status: string;
  created_at: string;
}

interface RecentPromotersProps {
  limit?: number;
}

export function RecentPromoters({ limit = 3 }: RecentPromotersProps) {
  const params = useSafeParams();
  const locale = (params?.locale as string) || 'en';
  const [promoters, setPromoters] = useState<RecentPromoter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentPromoters();
  }, []);

  async function fetchRecentPromoters() {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('promoters')
        .select('id, name_en, name_ar, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      setPromoters(data || []);
    } catch (error) {
      console.error('Error fetching recent promoters:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card className='mb-4'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-sm'>
            <User className='h-4 w-4' />
            Recent Promoters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-4'>
            <Loader2 className='h-4 w-4 animate-spin' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (promoters.length === 0) {
    return null;
  }

  return (
    <Card className='mb-4'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-sm'>
          <User className='h-4 w-4' />
          Recent Promoters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {promoters.map(promoter => (
            <div
              key={promoter.id}
              className='flex items-center justify-between'
            >
              <div className='flex items-center space-x-2'>
                <Avatar className='h-6 w-6'>
                  <AvatarImage src={undefined} alt={promoter.name_en} />
                  <AvatarFallback className='text-xs'>
                    {promoter.name_en.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <p className='text-xs font-medium truncate'>
                    {promoter.name_en}
                  </p>
                  <Badge
                    variant={
                      promoter.status === 'active' ? 'default' : 'secondary'
                    }
                    className='text-xs'
                  >
                    {promoter.status}
                  </Badge>
                </div>
              </div>
              <Button asChild variant='ghost' size='sm' className='h-6 w-6 p-0'>
                <Link href={`/${locale}/manage-promoters/${promoter.id}`}>
                  <Eye className='h-3 w-3' />
                </Link>
              </Button>
            </div>
          ))}
          <div className='pt-2'>
            <Button asChild variant='outline' size='sm' className='w-full'>
              <Link href={`/${locale}/promoter-details`}>
                View All Promoters
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
