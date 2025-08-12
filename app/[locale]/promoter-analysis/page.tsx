'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, BarChart3, Activity } from 'lucide-react';

export default function PromoterAnalysisPage() {
  return (
    <div className='container mx-auto space-y-6 py-6'>
      <div className='flex items-center gap-3'>
        <Users className='h-8 w-8' />
        <div>
          <h1 className='text-3xl font-bold'>Promoter Analysis</h1>
          <p className='text-muted-foreground'>
            Analyze promoter performance and statistics
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Promoters
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1,234</div>
            <p className='text-xs text-muted-foreground'>
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Contracts
            </CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>856</div>
            <p className='text-xs text-muted-foreground'>
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Average Performance
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
              Retention Rate
            </CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>94.2%</div>
            <p className='text-xs text-muted-foreground'>
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>
              Monthly performance metrics for promoters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex h-64 items-center justify-center text-muted-foreground'>
              <div className='text-center'>
                <BarChart3 className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <p>Performance chart will be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Promoters with highest performance ratings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className='flex items-center justify-between rounded-lg border p-3'
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium'>
                      {i}
                    </div>
                    <div>
                      <p className='font-medium'>Promoter {i}</p>
                      <p className='text-sm text-muted-foreground'>
                        Contract #{1000 + i}
                      </p>
                    </div>
                  </div>
                  <Badge variant='secondary'>9.{10 - i}/10</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Tools</CardTitle>
          <CardDescription>
            Tools for analyzing promoter data and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <Button
              variant='outline'
              className='flex h-20 flex-col items-center justify-center'
            >
              <TrendingUp className='mb-2 h-6 w-6' />
              Performance Reports
            </Button>
            <Button
              variant='outline'
              className='flex h-20 flex-col items-center justify-center'
            >
              <BarChart3 className='mb-2 h-6 w-6' />
              Analytics Dashboard
            </Button>
            <Button
              variant='outline'
              className='flex h-20 flex-col items-center justify-center'
            >
              <Activity className='mb-2 h-6 w-6' />
              Real-time Monitoring
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
