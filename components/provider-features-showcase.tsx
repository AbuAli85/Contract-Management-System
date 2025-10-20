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
import {
  Users,
  Calendar,
  BarChart3,
  Settings,
  Star,
  DollarSign,
  MapPin,
  Clock,
  MessageSquare,
  FileText,
  Plus,
  Eye,
  Edit,
  Target,
} from 'lucide-react';
import Link from 'next/link';

export function ProviderFeaturesShowcase() {
  const providerFeatures = [
    {
      title: 'Service Management',
      description: 'Create and manage your service offerings',
      icon: <Settings className='h-6 w-6' />,
      color: 'bg-blue-100 text-blue-800',
      actions: [
        {
          label: 'My Services',
          href: '/provider/services',
          icon: <Eye className='h-4 w-4' />,
        },
        {
          label: 'Add Service',
          href: '/provider/services/new',
          icon: <Plus className='h-4 w-4' />,
        },
        {
          label: 'Categories',
          href: '/provider/categories',
          icon: <Edit className='h-4 w-4' />,
        },
      ],
    },
    {
      title: 'Promoter Management',
      description: 'Manage your team of promoters and staff',
      icon: <Users className='h-6 w-6' />,
      color: 'bg-green-100 text-green-800',
      actions: [
        {
          label: 'Manage Promoters',
          href: '/manage-promoters',
          icon: <Users className='h-4 w-4' />,
        },
        {
          label: 'Add Promoter',
          href: '/manage-promoters/new',
          icon: <Plus className='h-4 w-4' />,
        },
        {
          label: 'Performance',
          href: '/promoters/performance',
          icon: <BarChart3 className='h-4 w-4' />,
        },
      ],
    },
    {
      title: 'Booking Management',
      description: 'Track and manage client bookings',
      icon: <Calendar className='h-6 w-6' />,
      color: 'bg-purple-100 text-purple-800',
      actions: [
        {
          label: 'All Bookings',
          href: '/provider/bookings',
          icon: <Calendar className='h-4 w-4' />,
        },
        {
          label: 'Availability',
          href: '/provider/availability',
          icon: <Clock className='h-4 w-4' />,
        },
        {
          label: 'Schedule',
          href: '/provider/schedule',
          icon: <Target className='h-4 w-4' />,
        },
      ],
    },
    {
      title: 'Financial Dashboard',
      description: 'Track earnings and financial performance',
      icon: <DollarSign className='h-6 w-6' />,
      color: 'bg-yellow-100 text-yellow-800',
      actions: [
        {
          label: 'Earnings',
          href: '/provider/earnings',
          icon: <DollarSign className='h-4 w-4' />,
        },
        {
          label: 'Invoices',
          href: '/provider/invoices',
          icon: <FileText className='h-4 w-4' />,
        },
        {
          label: 'Reports',
          href: '/provider/reports',
          icon: <BarChart3 className='h-4 w-4' />,
        },
      ],
    },
    {
      title: 'Client Relations',
      description: 'Manage client communications and reviews',
      icon: <MessageSquare className='h-6 w-6' />,
      color: 'bg-indigo-100 text-indigo-800',
      actions: [
        {
          label: 'Messages',
          href: '/provider/messages',
          icon: <MessageSquare className='h-4 w-4' />,
        },
        {
          label: 'Reviews',
          href: '/provider/reviews',
          icon: <Star className='h-4 w-4' />,
        },
        {
          label: 'Clients',
          href: '/provider/clients',
          icon: <Users className='h-4 w-4' />,
        },
      ],
    },
    {
      title: 'Location & Services',
      description: 'Manage service areas and locations',
      icon: <MapPin className='h-6 w-6' />,
      color: 'bg-teal-100 text-teal-800',
      actions: [
        {
          label: 'Service Areas',
          href: '/provider/locations',
          icon: <MapPin className='h-4 w-4' />,
        },
        {
          label: 'Delivery Zones',
          href: '/provider/zones',
          icon: <Target className='h-4 w-4' />,
        },
        {
          label: 'Coverage Map',
          href: '/provider/coverage',
          icon: <Eye className='h-4 w-4' />,
        },
      ],
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center space-y-2'>
        <h2 className='text-3xl font-bold text-gray-900'>Provider Features</h2>
        <p className='text-gray-600 max-w-2xl mx-auto'>
          Comprehensive tools to manage your services, promoters, and grow your
          business
        </p>
        <Badge className='bg-green-100 text-green-800'>
          ✅ You are registered as a Provider
        </Badge>
      </div>

      {/* Features Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {providerFeatures.map((feature, index) => (
          <Card key={index} className='hover:shadow-lg transition-shadow'>
            <CardHeader className='pb-4'>
              <div className='flex items-center space-x-3'>
                <div className={`p-2 rounded-lg ${feature.color}`}>
                  {feature.icon}
                </div>
                <div>
                  <CardTitle className='text-lg'>{feature.title}</CardTitle>
                </div>
              </div>
              <CardDescription className='text-sm text-gray-600'>
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              {feature.actions.map((action, actionIndex) => (
                <Link key={actionIndex} href={action.href}>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full justify-start'
                  >
                    {action.icon}
                    <span className='ml-2'>{action.label}</span>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card className='bg-gradient-to-r from-green-50 to-blue-50'>
        <CardHeader>
          <CardTitle className='text-center'>Quick Provider Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Link href='/dashboard/provider'>
              <Button className='w-full bg-green-600 hover:bg-green-700'>
                <BarChart3 className='h-4 w-4 mr-2' />
                Dashboard
              </Button>
            </Link>
            <Link href='/manage-promoters/new'>
              <Button className='w-full' variant='outline'>
                <Plus className='h-4 w-4 mr-2' />
                Add Promoter
              </Button>
            </Link>
            <Link href='/provider/services/new'>
              <Button className='w-full' variant='outline'>
                <Settings className='h-4 w-4 mr-2' />
                Add Service
              </Button>
            </Link>
            <Link href='/provider/profile'>
              <Button className='w-full' variant='outline'>
                <Users className='h-4 w-4 mr-2' />
                My Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
