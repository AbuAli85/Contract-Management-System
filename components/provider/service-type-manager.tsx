'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  TrendingUp,
  Eye,
  Target,
  BarChart3,
  Mail,
  MousePointer,
  Share2,
  Globe,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface ServiceTypeDetails {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  averagePrice: number;
  popularityScore: number;
  skills: string[];
  deliverables: string[];
  estimatedDuration: string;
}

const DIGITAL_MARKETING_SERVICES: ServiceTypeDetails[] = [
  {
    id: 'seo_audit',
    name: 'SEO Audit & Strategy',
    description:
      'Comprehensive website SEO analysis with actionable recommendations to improve search rankings',
    icon: <Search className='h-5 w-5' />,
    category: 'Search Engine Optimization',
    averagePrice: 299,
    popularityScore: 95,
    skills: [
      'Technical SEO',
      'Keyword Research',
      'Content Optimization',
      'Link Building',
    ],
    deliverables: [
      'SEO Audit Report',
      'Keyword Strategy',
      'Technical Recommendations',
      'Action Plan',
    ],
    estimatedDuration: '5-7 days',
  },
  {
    id: 'google_ads',
    name: 'Google Ads Campaign Setup',
    description:
      'Professional Google Ads campaign creation, optimization, and management for maximum ROI',
    icon: <Target className='h-5 w-5' />,
    category: 'Paid Advertising',
    averagePrice: 499,
    popularityScore: 90,
    skills: ['Google Ads', 'PPC Strategy', 'Keyword Bidding', 'Ad Copywriting'],
    deliverables: [
      'Campaign Setup',
      'Ad Groups',
      'Keywords List',
      'Performance Report',
    ],
    estimatedDuration: '3-5 days',
  },
  {
    id: 'social_media',
    name: 'Social Media Management',
    description:
      'Complete social media strategy, content creation, and community management across platforms',
    icon: <Share2 className='h-5 w-5' />,
    category: 'Social Media Marketing',
    averagePrice: 399,
    popularityScore: 88,
    skills: [
      'Content Creation',
      'Community Management',
      'Social Analytics',
      'Brand Voice',
    ],
    deliverables: [
      'Content Calendar',
      'Post Templates',
      'Analytics Report',
      'Strategy Document',
    ],
    estimatedDuration: '7-10 days',
  },
  {
    id: 'content_marketing',
    name: 'Content Marketing Strategy',
    description:
      'Strategic content planning, creation, and distribution to attract and engage target audience',
    icon: <Globe className='h-5 w-5' />,
    category: 'Content Marketing',
    averagePrice: 450,
    popularityScore: 85,
    skills: [
      'Content Strategy',
      'Copywriting',
      'SEO Writing',
      'Content Distribution',
    ],
    deliverables: [
      'Content Strategy',
      'Editorial Calendar',
      'Content Templates',
      'Distribution Plan',
    ],
    estimatedDuration: '7-14 days',
  },
  {
    id: 'ppc_management',
    name: 'PPC Campaign Management',
    description:
      'Ongoing pay-per-click campaign management and optimization across multiple platforms',
    icon: <MousePointer className='h-5 w-5' />,
    category: 'Paid Advertising',
    averagePrice: 599,
    popularityScore: 82,
    skills: [
      'PPC Management',
      'Bid Optimization',
      'A/B Testing',
      'ROI Analysis',
    ],
    deliverables: [
      'Campaign Optimization',
      'Performance Reports',
      'Bid Adjustments',
      'ROI Analysis',
    ],
    estimatedDuration: '10-14 days',
  },
  {
    id: 'email_marketing',
    name: 'Email Marketing Campaigns',
    description:
      'Email marketing strategy, automation setup, and campaign management for lead nurturing',
    icon: <Mail className='h-5 w-5' />,
    category: 'Email Marketing',
    averagePrice: 350,
    popularityScore: 78,
    skills: [
      'Email Design',
      'Marketing Automation',
      'Segmentation',
      'A/B Testing',
    ],
    deliverables: [
      'Email Templates',
      'Automation Flows',
      'Campaign Reports',
      'List Segmentation',
    ],
    estimatedDuration: '5-8 days',
  },
  {
    id: 'web_analytics',
    name: 'Web Analytics Setup',
    description:
      'Google Analytics and tracking implementation with custom dashboards and reporting',
    icon: <BarChart3 className='h-5 w-5' />,
    category: 'Analytics & Tracking',
    averagePrice: 275,
    popularityScore: 75,
    skills: [
      'Google Analytics',
      'Data Analysis',
      'Conversion Tracking',
      'Dashboard Creation',
    ],
    deliverables: [
      'Analytics Setup',
      'Custom Dashboards',
      'Tracking Implementation',
      'Training Guide',
    ],
    estimatedDuration: '3-5 days',
  },
  {
    id: 'conversion_optimization',
    name: 'Conversion Rate Optimization',
    description:
      'Website optimization to improve conversion rates through testing and user experience improvements',
    icon: <TrendingUp className='h-5 w-5' />,
    category: 'Conversion Optimization',
    averagePrice: 525,
    popularityScore: 70,
    skills: [
      'CRO Testing',
      'UX Analysis',
      'Landing Page Optimization',
      'User Research',
    ],
    deliverables: [
      'CRO Audit',
      'Test Designs',
      'Implementation Plan',
      'Results Analysis',
    ],
    estimatedDuration: '10-14 days',
  },
];

interface ServiceTypeManagerProps {
  onServiceTypeSelect?: (serviceType: ServiceTypeDetails) => void;
  selectedServiceType?: string;
  showCreateForm?: boolean;
}

export function ServiceTypeManager({
  onServiceTypeSelect,
  selectedServiceType,
  showCreateForm = false,
}: ServiceTypeManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const categories = Array.from(
    new Set(DIGITAL_MARKETING_SERVICES.map(service => service.category))
  );

  const filteredServices = DIGITAL_MARKETING_SERVICES.filter(service => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleServiceSelect = (service: ServiceTypeDetails) => {
    if (onServiceTypeSelect) {
      onServiceTypeSelect(service);
    }
    toast.success(`Selected: ${service.name}`);
  };

  const getPriceRange = (price: number) => {
    if (price < 300) return 'Budget-Friendly';
    if (price < 500) return 'Standard';
    return 'Premium';
  };

  const getPriceColor = (price: number) => {
    if (price < 300) return 'text-green-600';
    if (price < 500) return 'text-blue-600';
    return 'text-purple-600';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Digital Marketing Services
          </h2>
          <p className='text-gray-600'>
            Choose from specialized service types to create your offerings
          </p>
        </div>

        {showCreateForm && (
          <Dialog open={showCustomForm} onOpenChange={setShowCustomForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className='h-4 w-4 mr-2' />
                Create Custom Service
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>Create Custom Service Type</DialogTitle>
                <DialogDescription>
                  Create a custom service type that's not covered by our
                  standard offerings
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Service Name</label>
                    <Input placeholder='e.g. Brand Strategy Consulting' />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Category</label>
                    <Input placeholder='e.g. Brand Management' />
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Description</label>
                  <Textarea
                    placeholder='Describe what this service includes...'
                    rows={3}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      Starting Price ($)
                    </label>
                    <Input placeholder='299' type='number' />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      Estimated Duration
                    </label>
                    <Input placeholder='5-7 days' />
                  </div>
                </div>

                <div className='flex space-x-3'>
                  <Button
                    onClick={() => setShowCustomForm(false)}
                    variant='outline'
                    className='flex-1'
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCustomForm(false);
                      toast.success('Custom service type created!');
                    }}
                    className='flex-1'
                  >
                    Create Service Type
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className='flex flex-col lg:flex-row gap-4'>
        <div className='flex-1'>
          <Input
            placeholder='Search service types...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='max-w-md'
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='w-64'>
            <SelectValue placeholder='Filter by category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service Types Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredServices.map(service => (
          <Card
            key={service.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedServiceType === service.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleServiceSelect(service)}
          >
            <CardHeader className='pb-3'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-blue-100 rounded-lg'>
                    {service.icon}
                  </div>
                  <div>
                    <h3 className='font-semibold text-lg'>{service.name}</h3>
                    <Badge variant='outline' className='text-xs'>
                      {service.category}
                    </Badge>
                  </div>
                </div>

                <div className='text-right'>
                  <div
                    className={`text-lg font-bold ${getPriceColor(service.averagePrice)}`}
                  >
                    ${service.averagePrice}
                  </div>
                  <div className='text-xs text-gray-500'>
                    {getPriceRange(service.averagePrice)}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className='space-y-4'>
                <p className='text-sm text-gray-600 line-clamp-2'>
                  {service.description}
                </p>

                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='font-medium text-gray-700'>Duration:</span>
                    <p className='text-gray-600'>{service.estimatedDuration}</p>
                  </div>
                  <div>
                    <span className='font-medium text-gray-700'>
                      Popularity:
                    </span>
                    <div className='flex items-center space-x-1'>
                      <div className='w-16 bg-gray-200 rounded-full h-2'>
                        <div
                          className={`bg-blue-600 h-2 rounded-full ${
                            service.popularityScore >= 90
                              ? 'w-full'
                              : service.popularityScore >= 80
                                ? 'w-5/6'
                                : service.popularityScore >= 70
                                  ? 'w-3/4'
                                  : 'w-2/3'
                          }`}
                        />
                      </div>
                      <span className='text-xs text-gray-500'>
                        {service.popularityScore}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <span className='text-sm font-medium text-gray-700'>
                    Key Skills:
                  </span>
                  <div className='flex flex-wrap gap-1'>
                    {service.skills.slice(0, 3).map((skill, index) => (
                      <Badge
                        key={index}
                        variant='secondary'
                        className='text-xs'
                      >
                        {skill}
                      </Badge>
                    ))}
                    {service.skills.length > 3 && (
                      <Badge variant='outline' className='text-xs'>
                        +{service.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  className='w-full'
                  onClick={e => {
                    e.stopPropagation();
                    setShowDetails(service.id);
                  }}
                >
                  <Eye className='h-4 w-4 mr-1' />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Details Modal */}
      <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
        <DialogContent className='sm:max-w-[700px]'>
          {showDetails &&
            (() => {
              const service = DIGITAL_MARKETING_SERVICES.find(
                s => s.id === showDetails
              );
              if (!service) return null;

              return (
                <>
                  <DialogHeader>
                    <DialogTitle className='flex items-center space-x-3'>
                      <div className='p-2 bg-blue-100 rounded-lg'>
                        {service.icon}
                      </div>
                      <div>
                        <h3 className='text-xl font-semibold'>
                          {service.name}
                        </h3>
                        <Badge variant='outline'>{service.category}</Badge>
                      </div>
                    </DialogTitle>
                    <DialogDescription>{service.description}</DialogDescription>
                  </DialogHeader>

                  <div className='space-y-6 py-4'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div className='text-center p-4 bg-gray-50 rounded-lg'>
                        <div
                          className={`text-2xl font-bold ${getPriceColor(service.averagePrice)}`}
                        >
                          ${service.averagePrice}
                        </div>
                        <p className='text-sm text-gray-600'>Average Price</p>
                      </div>
                      <div className='text-center p-4 bg-gray-50 rounded-lg'>
                        <div className='text-2xl font-bold text-blue-600'>
                          {service.estimatedDuration}
                        </div>
                        <p className='text-sm text-gray-600'>Duration</p>
                      </div>
                      <div className='text-center p-4 bg-gray-50 rounded-lg'>
                        <div className='text-2xl font-bold text-green-600'>
                          {service.popularityScore}%
                        </div>
                        <p className='text-sm text-gray-600'>Popularity</p>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <h4 className='font-semibold text-gray-900 mb-3'>
                          Required Skills
                        </h4>
                        <div className='flex flex-wrap gap-2'>
                          {service.skills.map((skill, index) => (
                            <Badge key={index} variant='secondary'>
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className='font-semibold text-gray-900 mb-3'>
                          Typical Deliverables
                        </h4>
                        <ul className='space-y-1'>
                          {service.deliverables.map((deliverable, index) => (
                            <li
                              key={index}
                              className='flex items-center text-sm text-gray-600'
                            >
                              <div className='w-1.5 h-1.5 bg-blue-600 rounded-full mr-2' />
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className='flex space-x-3'>
                      <Button
                        onClick={() => setShowDetails(null)}
                        variant='outline'
                        className='flex-1'
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          handleServiceSelect(service);
                          setShowDetails(null);
                        }}
                        className='flex-1'
                      >
                        Use This Service Type
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
