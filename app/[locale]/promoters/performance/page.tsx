'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, Filter, TrendingUp, Award } from 'lucide-react';

export default function PromotersPerformancePage() {
  return (
    <div className='container mx-auto space-y-6 py-6'>
      <div className='flex items-center gap-3'>
        <Award className='h-8 w-8' />
        <div>
          <h1 className='text-3xl font-bold'>Promoter Performance</h1>
          <p className='text-muted-foreground'>
            Track and analyze promoter performance metrics
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Average Rating
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>8.7/10</div>
            <p className='text-xs text-muted-foreground'>
              +0.3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Promoters
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>234</div>
            <p className='text-xs text-muted-foreground'>+12 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Top Performers
            </CardTitle>
            <Award className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>45</div>
            <p className='text-xs text-muted-foreground'>Rating 9.0+</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Improvement Rate
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>+15.2%</div>
            <p className='text-xs text-muted-foreground'>vs last quarter</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Performance Rankings</CardTitle>
              <CardDescription>
                Top performing promoters this month
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search promoters...'
                  className='w-64 pl-10'
                />
              </div>
              <Button variant='outline' size='sm'>
                <Filter className='mr-2 h-4 w-4' />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div
                key={i}
                className='flex items-center justify-between rounded-lg border p-4 transition-shadow hover:shadow-md'
              >
                <div className='flex items-center gap-4'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 font-bold text-white'>
                    {i}
                  </div>
                  <div>
                    <h3 className='font-semibold'>Promoter {i}</h3>
                    <p className='text-sm text-muted-foreground'>
                      ID: PRM-{1000 + i}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-4'>
                  <div className='text-right'>
                    <p className='font-medium'>
                      {(9.9 - i * 0.1).toFixed(1)}/10
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {i === 1
                        ? 'Gold'
                        : i === 2
                          ? 'Silver'
                          : i === 3
                            ? 'Bronze'
                            : 'Standard'}{' '}
                      Level
                    </p>
                  </div>
                  <Badge variant={i <= 3 ? 'default' : 'secondary'}>
                    {i <= 3 ? 'Top Performer' : 'Good'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>
              Monthly performance trends over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex h-64 items-center justify-center text-muted-foreground'>
              <div className='text-center'>
                <TrendingUp className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <p>Performance trend chart will be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Key performance indicators and benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between rounded-lg bg-green-50 p-3'>
                <span className='font-medium'>Excellent (9.0+)</span>
                <Badge className='bg-green-100 text-green-800'>
                  45 promoters
                </Badge>
              </div>
              <div className='flex items-center justify-between rounded-lg bg-blue-50 p-3'>
                <span className='font-medium'>Good (8.0-8.9)</span>
                <Badge className='bg-blue-100 text-blue-800'>
                  89 promoters
                </Badge>
              </div>
              <div className='flex items-center justify-between rounded-lg bg-yellow-50 p-3'>
                <span className='font-medium'>Average (7.0-7.9)</span>
                <Badge className='bg-yellow-100 text-yellow-800'>
                  67 promoters
                </Badge>
              </div>
              <div className='flex items-center justify-between rounded-lg bg-red-50 p-3'>
                <span className='font-medium'>Needs Improvement (&lt;7.0)</span>
                <Badge className='bg-red-100 text-red-800'>33 promoters</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
