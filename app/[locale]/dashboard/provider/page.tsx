'use client';

import {
  useEnhancedRBAC,
  RoleRedirect,
} from '@/components/auth/enhanced-rbac-provider';
import { ProviderDashboard } from '@/components/dashboards/provider-dashboard';
import { ProviderFeaturesShowcase } from '@/components/provider-features-showcase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function ProviderDashboardPage() {
  return (
    <RoleRedirect allowedRoles={['provider', 'admin', 'super_admin']}>
      <div className='space-y-6 p-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Provider Portal
            </h1>
            <p className='text-gray-600'>
              Manage your services, promoters, and business operations
            </p>
          </div>
          <Badge className='bg-green-100 text-green-800 text-lg px-4 py-2'>
            🏢 Provider Account
          </Badge>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue='dashboard' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='dashboard'>Analytics Dashboard</TabsTrigger>
            <TabsTrigger value='features'>Provider Features</TabsTrigger>
          </TabsList>

          <TabsContent value='dashboard' className='space-y-4'>
            <ProviderDashboard />
          </TabsContent>

          <TabsContent value='features' className='space-y-4'>
            <ProviderFeaturesShowcase />
          </TabsContent>
        </Tabs>
      </div>
    </RoleRedirect>
  );
}
