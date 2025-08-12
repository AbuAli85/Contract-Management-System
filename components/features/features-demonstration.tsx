'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Factory,
  Heart,
  LayoutDashboard,
  TrendingUp,
  Star,
  DollarSign,
  Search,
  FileText,
  UserCheck,
  Activity,
  Target,
  Package,
  Shield,
  Network,
  Zap,
  BarChart3,
  Bell,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  Eye,
  Settings,
  Filter,
  ArrowRight,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function FeaturesDemonstration() {
  const clientFeatures = [
    {
      icon: Users,
      title: 'Complete Client Profiles',
      description:
        'Store and manage comprehensive client information including contact details, service history, and preferences',
      demo: "Add client 'Oman Petroleum' with full company details",
      color: 'blue',
    },
    {
      icon: TrendingUp,
      title: 'Revenue Tracking',
      description:
        'Real-time monitoring of client contract values, payment status, and revenue analytics',
      demo: 'Track $85K contract value with payment milestones',
      color: 'green',
    },
    {
      icon: Star,
      title: 'Satisfaction Monitoring',
      description:
        'Continuous tracking of client satisfaction scores with trend analysis and alerts',
      demo: 'Monitor client satisfaction: 4.8/5.0 rating',
      color: 'yellow',
    },
    {
      icon: FileText,
      title: 'Contract Management',
      description:
        'Full contract lifecycle management from creation to renewal with automated workflows',
      demo: 'Manage 12-month service agreement with auto-renewal',
      color: 'purple',
    },
    {
      icon: Search,
      title: 'Advanced Search & Filters',
      description:
        'Powerful search capabilities with multiple filter options for efficient client discovery',
      demo: 'Search by industry, location, contract value, status',
      color: 'orange',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description:
        'Comprehensive analytics with charts, trends, and business intelligence insights',
      demo: 'View client growth trends and performance metrics',
      color: 'indigo',
    },
  ];

  const providerFeatures = [
    {
      icon: UserCheck,
      title: 'Promoter Management',
      description:
        'Track, allocate, and manage your workforce with performance monitoring and scheduling',
      demo: 'Manage 45 promoters with skill-based allocation',
      color: 'green',
    },
    {
      icon: Activity,
      title: 'Capacity Tracking',
      description:
        'Real-time monitoring of provider capacity utilization with alerts and optimization suggestions',
      demo: 'Monitor 78% capacity with efficiency insights',
      color: 'blue',
    },
    {
      icon: Target,
      title: 'Performance Metrics',
      description:
        'Comprehensive KPI tracking including delivery time, quality scores, and client satisfaction',
      demo: 'Track 92% delivery success rate and 4.6 rating',
      color: 'purple',
    },
    {
      icon: Package,
      title: 'Service Portfolio Management',
      description:
        'Organize and manage all service offerings with pricing, descriptions, and availability',
      demo: 'Manage IT Services, Marketing, and Consulting',
      color: 'orange',
    },
    {
      icon: DollarSign,
      title: 'Revenue Analytics',
      description:
        'Financial performance tracking with profit margins, cost analysis, and revenue forecasting',
      demo: 'Analyze $250K total revenue with 15% growth',
      color: 'yellow',
    },
    {
      icon: Shield,
      title: 'Quality Assurance',
      description:
        'Service quality monitoring with client feedback integration and improvement tracking',
      demo: 'Maintain 89% quality score with trend analysis',
      color: 'red',
    },
  ];

  const relationshipFeatures = [
    {
      icon: Network,
      title: 'Network Visualization',
      description:
        'Interactive visual mapping of all client-provider relationships with connection strength indicators',
      demo: 'View network of 18 active partnerships',
      color: 'purple',
    },
    {
      icon: Heart,
      title: 'Relationship Strength Scoring',
      description:
        'AI-powered scoring system that evaluates partnership health based on multiple factors',
      demo: 'Calculate 87% strength score for top partnerships',
      color: 'red',
    },
    {
      icon: Star,
      title: 'Partnership Satisfaction Tracking',
      description:
        'Monitor satisfaction from both client and provider perspectives with actionable insights',
      demo: 'Track 4.4/5.0 average partnership satisfaction',
      color: 'yellow',
    },
    {
      icon: DollarSign,
      title: 'Value Attribution',
      description:
        'Track revenue generation and value creation through specific partnerships',
      demo: 'Attribute $425K revenue to active partnerships',
      color: 'green',
    },
    {
      icon: Zap,
      title: 'Smart Recommendations',
      description:
        'AI-powered suggestions for new partnerships, optimization opportunities, and growth strategies',
      demo: 'Recommend optimal client-provider matches',
      color: 'blue',
    },
    {
      icon: TrendingUp,
      title: 'Growth Optimization',
      description:
        'Partnership expansion planning with predictive analytics and success probability scoring',
      demo: 'Identify 23% growth potential in existing network',
      color: 'indigo',
    },
  ];

  const systemFeatures = [
    {
      icon: LayoutDashboard,
      title: 'Unified Dashboard',
      description:
        'Single pane of glass for all business operations with customizable widgets and real-time updates',
      demo: 'Access all systems from one central location',
      color: 'indigo',
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description:
        'Intelligent alert system for capacity limits, contract renewals, and performance anomalies',
      demo: 'Get alerts for 85% capacity and contract renewals',
      color: 'orange',
    },
    {
      icon: Calendar,
      title: 'Automated Workflows',
      description:
        'Streamlined processes for contract renewals, performance reviews, and partnership evaluations',
      demo: 'Automate contract renewal workflows',
      color: 'blue',
    },
    {
      icon: Award,
      title: 'Performance Analytics',
      description:
        'Comprehensive performance tracking across all business dimensions with trend analysis',
      demo: 'Monitor system-wide 94% performance score',
      color: 'green',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'from-blue-500 to-blue-600 text-white',
      green: 'from-green-500 to-green-600 text-white',
      purple: 'from-purple-500 to-purple-600 text-white',
      orange: 'from-orange-500 to-orange-600 text-white',
      yellow: 'from-yellow-500 to-yellow-600 text-white',
      red: 'from-red-500 to-red-600 text-white',
      indigo: 'from-indigo-500 to-indigo-600 text-white',
    };
    return (
      colorMap[color as keyof typeof colorMap] ||
      'from-gray-500 to-gray-600 text-white'
    );
  };

  const FeatureSection = ({
    title,
    features,
    description,
    icon: Icon,
    sectionColor,
  }: any) => (
    <Card className='mb-8'>
      <CardHeader>
        <CardTitle className='flex items-center gap-3 text-2xl'>
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses(sectionColor)}`}
          >
            <Icon className='h-8 w-8' />
          </div>
          {title}
        </CardTitle>
        <CardDescription className='text-lg'>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {features.map((feature: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className='h-full hover:shadow-lg transition-shadow duration-200'>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${getColorClasses(feature.color)}`}
                    >
                      <feature.icon className='h-6 w-6' />
                    </div>
                    <CardTitle className='text-lg'>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <p className='text-muted-foreground'>{feature.description}</p>
                  <div className='p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500'>
                    <p className='text-sm font-medium text-blue-800'>
                      Demo Example:
                    </p>
                    <p className='text-sm text-blue-600'>{feature.demo}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className='space-y-8 p-6'>
      {/* Header */}
      <div className='text-center space-y-4'>
        <motion.h1
          className='text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Complete Features Demonstration
        </motion.h1>
        <motion.p
          className='text-xl text-muted-foreground max-w-3xl mx-auto'
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Explore every capability of your Business Management System with real
          examples and use cases
        </motion.p>
      </div>

      {/* System Overview */}
      <Card className='bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border-indigo-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-3 text-2xl text-indigo-800'>
            <LayoutDashboard className='h-8 w-8 text-indigo-600' />
            System Capabilities Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='text-center p-4'>
              <div className='text-3xl font-bold text-blue-600'>12</div>
              <div className='text-sm text-muted-foreground'>
                Active Clients
              </div>
            </div>
            <div className='text-center p-4'>
              <div className='text-3xl font-bold text-green-600'>16</div>
              <div className='text-sm text-muted-foreground'>
                Service Providers
              </div>
            </div>
            <div className='text-center p-4'>
              <div className='text-3xl font-bold text-purple-600'>18</div>
              <div className='text-sm text-muted-foreground'>
                Active Partnerships
              </div>
            </div>
            <div className='text-center p-4'>
              <div className='text-3xl font-bold text-orange-600'>$675K</div>
              <div className='text-sm text-muted-foreground'>Network Value</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Management Features */}
      <FeatureSection
        title='Client Management Features'
        description='Complete client lifecycle management with advanced tracking and analytics'
        features={clientFeatures}
        icon={Users}
        sectionColor='blue'
      />

      {/* Provider Management Features */}
      <FeatureSection
        title='Provider Management Features'
        description='Comprehensive provider performance tracking and capacity optimization'
        features={providerFeatures}
        icon={Factory}
        sectionColor='green'
      />

      {/* Relationship Management Features */}
      <FeatureSection
        title='Relationship Management Features'
        description='Advanced partnership mapping and relationship intelligence'
        features={relationshipFeatures}
        icon={Heart}
        sectionColor='purple'
      />

      {/* System Features */}
      <FeatureSection
        title='System-Wide Features'
        description='Platform capabilities that enhance the entire business management experience'
        features={systemFeatures}
        icon={Zap}
        sectionColor='indigo'
      />

      {/* Call to Action */}
      <Card className='bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
        <CardContent className='p-8 text-center space-y-4'>
          <h2 className='text-3xl font-bold'>
            Ready to Experience These Features?
          </h2>
          <p className='text-xl opacity-90'>
            Your system is live and operational with all these capabilities
            available now
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center mt-6'>
            <Button
              size='lg'
              variant='secondary'
              className='bg-white text-blue-600 hover:bg-gray-100'
            >
              <Eye className='mr-2 h-5 w-5' />
              View Live System
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='border-white text-white hover:bg-white hover:text-blue-600'
            >
              <Plus className='mr-2 h-5 w-5' />
              Start Adding Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
