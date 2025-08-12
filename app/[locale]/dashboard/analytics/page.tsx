'use client';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function LocaleAnalyticsPage() {
  const params = useParams();
  const locale = (params?.locale ?? 'en') as string;

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Analytics Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Comprehensive analytics and insights for your contract management
            system
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Contracts
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1,234</div>
            <p className='text-xs text-muted-foreground'>
              +12% from last month
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
            <div className='text-2xl font-bold'>567</div>
            <p className='text-xs text-muted-foreground'>+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Success Rate</CardTitle>
            <CheckCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>94.2%</div>
            <p className='text-xs text-muted-foreground'>
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg. Processing Time
            </CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>2.4 days</div>
            <p className='text-xs text-muted-foreground'>
              -0.3 days from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Contract Trends</CardTitle>
            <CardDescription>
              Monthly contract generation and completion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px] flex items-center justify-center text-muted-foreground'>
              Chart placeholder - Implement with your preferred charting library
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promoter Performance</CardTitle>
            <CardDescription>
              Top performing promoters and their metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px] flex items-center justify-center text-muted-foreground'>
              Chart placeholder - Implement with your preferred charting library
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest system activities and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center space-x-4'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>New contract generated</p>
                <p className='text-xs text-muted-foreground'>2 minutes ago</p>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>Promoter profile updated</p>
                <p className='text-xs text-muted-foreground'>15 minutes ago</p>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>Document expiring soon</p>
                <p className='text-xs text-muted-foreground'>1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
