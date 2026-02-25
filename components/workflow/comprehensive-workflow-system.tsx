'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Users,
  MessageCircle,
  FileText,
  Upload,
  Download,
  Star,
  Flag,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Eye,
  Edit,
  Share2,
  Target,
  Activity,
  Zap,
  Award,
  Package,
  Settings,
  Bell,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface WorkflowProject {
  id: string;
  title: string;
  description: string;
  status:
    | 'planning'
    | 'active'
    | 'review'
    | 'completed'
    | 'paused'
    | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';

  client: {
    id: string;
    name: string;
    avatar: string;
    email: string;
  };

  provider: {
    id: string;
    name: string;
    avatar: string;
    email: string;
    rating: number;
  };

  timeline: {
    startDate: string;
    endDate: string;
    estimatedDuration: number;
    actualDuration?: number;
  };

  budget: {
    total: number;
    currency: string;
    paid: number;
    pending: number;
  };

  milestones: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    progress: number;
    deliverables: string[];
    paymentAmount: number;
    approvedBy?: string;
    completedAt?: string;
  }[];

  communications: {
    id: string;
    type: 'message' | 'file' | 'milestone' | 'review' | 'payment';
    sender: 'client' | 'provider' | 'system';
    content: string;
    timestamp: string;
    attachments?: string[];
    read: boolean;
  }[];

  deliverables: {
    id: string;
    name: string;
    type: 'document' | 'image' | 'video' | 'code' | 'other';
    url: string;
    uploadedBy: 'client' | 'provider';
    uploadedAt: string;
    version: number;
    approved: boolean;
  }[];

  reviews: {
    id: string;
    type: 'milestone' | 'final';
    rating: number;
    comment: string;
    reviewer: 'client' | 'provider';
    reviewedAt: string;
    milestoneId?: string;
  }[];
}

interface WorkflowSystemProps {
  userRole: 'client' | 'provider' | 'admin';
  userId: string;
}

export function ComprehensiveWorkflowSystem({
  userRole,
  userId,
}: WorkflowSystemProps) {
  const [projects, setProjects] = useState<WorkflowProject[]>([]);
  const [selectedProject, setSelectedProject] =
    useState<WorkflowProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);

  useEffect(() => {
    loadProjects();
  }, [userRole, userId]);

  const loadProjects = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      const mockProjects: WorkflowProject[] = [
        {
          id: 'proj_1',
          title: 'E-commerce SEO Optimization',
          description:
            'Complete SEO overhaul for online fashion store including keyword research, on-page optimization, and content strategy',
          status: 'active',
          priority: 'high',

          client: {
            id: 'client_1',
            name: 'Michael Chen',
            avatar:
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
            email: 'michael@fashionstore.com',
          },

          provider: {
            id: 'provider_1',
            name: 'Sarah Johnson',
            avatar:
              'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
            email: 'sarah@seoexpert.com',
            rating: 4.9,
          },

          timeline: {
            startDate: '2024-01-10',
            endDate: '2024-02-15',
            estimatedDuration: 36,
          },

          budget: {
            total: 1500,
            currency: 'USD',
            paid: 600,
            pending: 300,
          },

          milestones: [
            {
              id: 'mile_1',
              title: 'Keyword Research & Analysis',
              description:
                'Comprehensive keyword research and competitor analysis',
              dueDate: '2024-01-20',
              status: 'completed',
              progress: 100,
              deliverables: ['Keyword Research Report', 'Competitor Analysis'],
              paymentAmount: 500,
              approvedBy: 'client_1',
              completedAt: '2024-01-19',
            },
            {
              id: 'mile_2',
              title: 'On-Page Optimization',
              description:
                'Optimize product pages and category pages for target keywords',
              dueDate: '2024-02-05',
              status: 'in_progress',
              progress: 70,
              deliverables: ['Optimized Pages', 'Meta Tags Report'],
              paymentAmount: 600,
            },
            {
              id: 'mile_3',
              title: 'Content Strategy & Implementation',
              description:
                'Create and implement content strategy with blog posts',
              dueDate: '2024-02-15',
              status: 'pending',
              progress: 0,
              deliverables: ['Content Calendar', 'Blog Posts', 'SEO Report'],
              paymentAmount: 400,
            },
          ],

          communications: [
            {
              id: 'comm_1',
              type: 'message',
              sender: 'provider',
              content:
                "I've completed the keyword research phase. The report shows great opportunities in long-tail keywords. Please review the attached document.",
              timestamp: '2024-01-20T14:30:00Z',
              attachments: ['keyword-research-report.pdf'],
              read: true,
            },
            {
              id: 'comm_2',
              type: 'milestone',
              sender: 'system',
              content:
                'Milestone "Keyword Research & Analysis" has been completed and approved.',
              timestamp: '2024-01-20T16:45:00Z',
              read: true,
            },
            {
              id: 'comm_3',
              type: 'message',
              sender: 'client',
              content:
                "Great work on the keyword research! I'm excited to see the on-page optimization results.",
              timestamp: '2024-01-21T09:15:00Z',
              read: false,
            },
          ],

          deliverables: [
            {
              id: 'deliv_1',
              name: 'Keyword Research Report',
              type: 'document',
              url: '/files/keyword-research-report.pdf',
              uploadedBy: 'provider',
              uploadedAt: '2024-01-19T16:30:00Z',
              version: 1,
              approved: true,
            },
            {
              id: 'deliv_2',
              name: 'Competitor Analysis',
              type: 'document',
              url: '/files/competitor-analysis.pdf',
              uploadedBy: 'provider',
              uploadedAt: '2024-01-19T16:35:00Z',
              version: 1,
              approved: true,
            },
          ],

          reviews: [
            {
              id: 'review_1',
              type: 'milestone',
              rating: 5,
              comment:
                'Excellent work! Very detailed analysis and actionable insights.',
              reviewer: 'client',
              reviewedAt: '2024-01-20T16:00:00Z',
              milestoneId: 'mile_1',
            },
          ],
        },
      ];

      setProjects(mockProjects);
      if (mockProjects.length > 0) {
        setSelectedProject(mockProjects[0]);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load projects');
      setLoading(false);
    }
  };

  const handleMilestoneAction = (action: string, milestoneId: string) => {
    if (!selectedProject) return;

    const milestone = selectedProject.milestones.find(
      m => m.id === milestoneId
    );
    if (!milestone) return;

    switch (action) {
      case 'complete':
        toast.success('Milestone marked as completed!');
        break;
      case 'approve':
        setSelectedMilestone(milestone);
        setShowReviewModal(true);
        break;
      case 'request_revision':
        toast.info('Revision requested for milestone');
        break;
      default:
        break;
    }
  };

  const handleSubmitReview = (rating: number, comment: string) => {
    toast.success('Review submitted successfully!');
    setShowReviewModal(false);
    setSelectedMilestone(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-gray-100 text-gray-700';
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'review':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'urgent':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='animate-pulse space-y-8'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='h-96 bg-gray-200 rounded'></div>
            <div className='lg:col-span-2 h-96 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Project Workflow
        </h1>
        <p className='text-gray-600'>
          Manage project progress, milestones, and communications
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Project Sidebar */}
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Active Projects</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='space-y-2'>
                {projects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`p-4 cursor-pointer border-l-4 hover:bg-gray-50 transition-colors ${
                      selectedProject?.id === project.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent'
                    }`}
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <h4 className='font-medium text-sm text-gray-900 line-clamp-2'>
                        {project.title}
                      </h4>
                      <div className='flex space-x-1 ml-2'>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className='flex items-center space-x-2 mb-3'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage
                          src={
                            userRole === 'client'
                              ? project.provider.avatar
                              : project.client.avatar
                          }
                        />
                        <AvatarFallback>
                          {userRole === 'client'
                            ? project.provider.name.charAt(0)
                            : project.client.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-xs text-gray-600'>
                        {userRole === 'client'
                          ? project.provider.name
                          : project.client.name}
                      </span>
                    </div>

                    <div className='space-y-2'>
                      <div className='flex justify-between text-xs text-gray-600'>
                        <span>Progress</span>
                        <span>
                          {Math.round(
                            (project.milestones.filter(
                              m => m.status === 'completed'
                            ).length /
                              project.milestones.length) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          (project.milestones.filter(
                            m => m.status === 'completed'
                          ).length /
                            project.milestones.length) *
                          100
                        }
                        className='h-2'
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Project Content */}
        <div className='lg:col-span-2'>
          {selectedProject ? (
            <div className='space-y-6'>
              {/* Project Header */}
              <Card>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div>
                      <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                        {selectedProject.title}
                      </h2>
                      <p className='text-gray-600 mb-4'>
                        {selectedProject.description}
                      </p>

                      <div className='flex items-center space-x-4'>
                        <div className='flex items-center space-x-2'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage src={selectedProject.client.avatar} />
                            <AvatarFallback>
                              {selectedProject.client.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='text-sm font-medium'>
                              Client: {selectedProject.client.name}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center space-x-2'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage
                              src={selectedProject.provider.avatar}
                            />
                            <AvatarFallback>
                              {selectedProject.provider.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='text-sm font-medium'>
                              Provider: {selectedProject.provider.name}
                            </p>
                            <div className='flex items-center text-xs text-gray-500'>
                              <Star className='h-3 w-3 fill-yellow-400 text-yellow-400 mr-1' />
                              {selectedProject.provider.rating}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex space-x-2'>
                      <Badge className={getStatusColor(selectedProject.status)}>
                        {selectedProject.status}
                      </Badge>
                      <Badge
                        className={getPriorityColor(selectedProject.priority)}
                      >
                        {selectedProject.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div>
                      <h4 className='font-medium text-gray-900 mb-2'>
                        Timeline
                      </h4>
                      <div className='space-y-1 text-sm text-gray-600'>
                        <p>
                          Start:{' '}
                          {new Date(
                            selectedProject.timeline.startDate
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          End:{' '}
                          {new Date(
                            selectedProject.timeline.endDate
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          Duration: {selectedProject.timeline.estimatedDuration}{' '}
                          days
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className='font-medium text-gray-900 mb-2'>Budget</h4>
                      <div className='space-y-1 text-sm text-gray-600'>
                        <p>
                          Total: $
                          {selectedProject.budget.total.toLocaleString()}
                        </p>
                        <p>
                          Paid: ${selectedProject.budget.paid.toLocaleString()}
                        </p>
                        <p>
                          Pending: $
                          {selectedProject.budget.pending.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className='font-medium text-gray-900 mb-2'>
                        Progress
                      </h4>
                      <div className='space-y-2'>
                        <Progress
                          value={
                            (selectedProject.milestones.filter(
                              m => m.status === 'completed'
                            ).length /
                              selectedProject.milestones.length) *
                            100
                          }
                          className='h-3'
                        />
                        <p className='text-sm text-gray-600'>
                          {
                            selectedProject.milestones.filter(
                              m => m.status === 'completed'
                            ).length
                          }{' '}
                          of {selectedProject.milestones.length} milestones
                          completed
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className='space-y-6'
              >
                <TabsList className='grid w-full grid-cols-4'>
                  <TabsTrigger value='overview'>Overview</TabsTrigger>
                  <TabsTrigger value='milestones'>Milestones</TabsTrigger>
                  <TabsTrigger value='communication'>Communication</TabsTrigger>
                  <TabsTrigger value='deliverables'>Deliverables</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value='overview' className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-4'>
                          {selectedProject.communications
                            .slice(0, 5)
                            .map(comm => (
                              <div
                                key={comm.id}
                                className='flex items-start space-x-3'
                              >
                                <div
                                  className={`p-2 rounded-full ${
                                    comm.type === 'message'
                                      ? 'bg-blue-100'
                                      : comm.type === 'milestone'
                                        ? 'bg-green-100'
                                        : comm.type === 'file'
                                          ? 'bg-purple-100'
                                          : 'bg-gray-100'
                                  }`}
                                >
                                  {comm.type === 'message' && (
                                    <MessageCircle className='h-4 w-4 text-blue-600' />
                                  )}
                                  {comm.type === 'milestone' && (
                                    <Target className='h-4 w-4 text-green-600' />
                                  )}
                                  {comm.type === 'file' && (
                                    <FileText className='h-4 w-4 text-purple-600' />
                                  )}
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <p className='text-sm text-gray-900 line-clamp-2'>
                                    {comm.content}
                                  </p>
                                  <p className='text-xs text-gray-500'>
                                    {new Date(comm.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>Project Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-2 gap-4'>
                          <div className='text-center'>
                            <div className='text-2xl font-bold text-blue-600'>
                              {
                                selectedProject.milestones.filter(
                                  m => m.status === 'completed'
                                ).length
                              }
                            </div>
                            <p className='text-sm text-gray-600'>
                              Completed Milestones
                            </p>
                          </div>

                          <div className='text-center'>
                            <div className='text-2xl font-bold text-green-600'>
                              {selectedProject.communications.length}
                            </div>
                            <p className='text-sm text-gray-600'>Messages</p>
                          </div>

                          <div className='text-center'>
                            <div className='text-2xl font-bold text-purple-600'>
                              {selectedProject.deliverables.length}
                            </div>
                            <p className='text-sm text-gray-600'>
                              Deliverables
                            </p>
                          </div>

                          <div className='text-center'>
                            <div className='text-2xl font-bold text-orange-600'>
                              {selectedProject.reviews.length}
                            </div>
                            <p className='text-sm text-gray-600'>Reviews</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Milestones Tab */}
                <TabsContent value='milestones' className='space-y-6'>
                  <div className='space-y-4'>
                    {selectedProject.milestones.map((milestone, index) => (
                      <Card
                        key={milestone.id}
                        className='border-l-4 border-blue-500'
                      >
                        <CardContent className='p-6'>
                          <div className='flex items-start justify-between mb-4'>
                            <div className='flex-1'>
                              <div className='flex items-center space-x-3 mb-2'>
                                <h3 className='font-semibold text-lg'>
                                  {milestone.title}
                                </h3>
                                <Badge
                                  className={getMilestoneStatusColor(
                                    milestone.status
                                  )}
                                >
                                  {milestone.status.replace('_', ' ')}
                                </Badge>
                                <span className='text-sm text-gray-500'>
                                  Due:{' '}
                                  {new Date(
                                    milestone.dueDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className='text-gray-600 mb-4'>
                                {milestone.description}
                              </p>

                              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                                <div>
                                  <p className='text-sm font-medium text-gray-900'>
                                    Progress
                                  </p>
                                  <div className='flex items-center space-x-2 mt-1'>
                                    <Progress
                                      value={milestone.progress}
                                      className='flex-1 h-2'
                                    />
                                    <span className='text-sm text-gray-600'>
                                      {milestone.progress}%
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <p className='text-sm font-medium text-gray-900'>
                                    Payment
                                  </p>
                                  <p className='text-lg font-bold text-green-600'>
                                    ${milestone.paymentAmount}
                                  </p>
                                </div>

                                <div>
                                  <p className='text-sm font-medium text-gray-900'>
                                    Deliverables
                                  </p>
                                  <p className='text-sm text-gray-600'>
                                    {milestone.deliverables.length} items
                                  </p>
                                </div>
                              </div>

                              <div className='flex flex-wrap gap-2 mb-4'>
                                {milestone.deliverables.map(
                                  (deliverable, idx) => (
                                    <Badge
                                      key={idx}
                                      variant='outline'
                                      className='text-xs'
                                    >
                                      {deliverable}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          <div className='flex space-x-3'>
                            {userRole === 'provider' &&
                              milestone.status === 'in_progress' && (
                                <Button
                                  size='sm'
                                  onClick={() =>
                                    handleMilestoneAction(
                                      'complete',
                                      milestone.id
                                    )
                                  }
                                >
                                  <CheckCircle className='h-4 w-4 mr-1' />
                                  Mark Complete
                                </Button>
                              )}

                            {userRole === 'client' &&
                              milestone.status === 'completed' &&
                              !milestone.approvedBy && (
                                <>
                                  <Button
                                    size='sm'
                                    onClick={() =>
                                      handleMilestoneAction(
                                        'approve',
                                        milestone.id
                                      )
                                    }
                                  >
                                    <CheckCircle className='h-4 w-4 mr-1' />
                                    Approve & Pay
                                  </Button>
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() =>
                                      handleMilestoneAction(
                                        'request_revision',
                                        milestone.id
                                      )
                                    }
                                  >
                                    <RotateCcw className='h-4 w-4 mr-1' />
                                    Request Revision
                                  </Button>
                                </>
                              )}

                            <Button variant='outline' size='sm'>
                              <Eye className='h-4 w-4 mr-1' />
                              View Details
                            </Button>

                            <Button variant='outline' size='sm'>
                              <MessageCircle className='h-4 w-4 mr-1' />
                              Discuss
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Communication Tab */}
                <TabsContent value='communication' className='space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-lg'>
                        Project Communication
                      </CardTitle>
                      <CardDescription>
                        Messages and updates related to this project
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-4 mb-6'>
                        {selectedProject.communications.map(comm => (
                          <div
                            key={comm.id}
                            className={`flex items-start space-x-3 p-4 rounded-lg ${
                              comm.sender === userRole
                                ? 'bg-blue-50 ml-8'
                                : 'bg-gray-50 mr-8'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-full ${
                                comm.type === 'message'
                                  ? 'bg-blue-100'
                                  : comm.type === 'milestone'
                                    ? 'bg-green-100'
                                    : comm.type === 'file'
                                      ? 'bg-purple-100'
                                      : 'bg-gray-100'
                              }`}
                            >
                              {comm.type === 'message' && (
                                <MessageCircle className='h-4 w-4 text-blue-600' />
                              )}
                              {comm.type === 'milestone' && (
                                <Target className='h-4 w-4 text-green-600' />
                              )}
                              {comm.type === 'file' && (
                                <FileText className='h-4 w-4 text-purple-600' />
                              )}
                              {comm.type === 'system' && (
                                <Settings className='h-4 w-4 text-gray-600' />
                              )}
                            </div>

                            <div className='flex-1'>
                              <div className='flex items-center space-x-2 mb-1'>
                                <span className='font-medium text-sm capitalize'>
                                  {comm.sender}
                                </span>
                                <span className='text-xs text-gray-500'>
                                  {new Date(comm.timestamp).toLocaleString()}
                                </span>
                                {!comm.read && (
                                  <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                                )}
                              </div>

                              <p className='text-gray-700'>{comm.content}</p>

                              {comm.attachments &&
                                comm.attachments.length > 0 && (
                                  <div className='mt-2 flex space-x-2'>
                                    {comm.attachments.map((attachment, idx) => (
                                      <Badge
                                        key={idx}
                                        variant='outline'
                                        className='text-xs'
                                      >
                                        <FileText className='h-3 w-3 mr-1' />
                                        {attachment}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      <div className='border-t pt-4'>
                        <div className='flex space-x-3'>
                          <Textarea
                            placeholder='Type your message...'
                            className='flex-1'
                            rows={3}
                          />
                          <div className='flex flex-col space-y-2'>
                            <Button size='sm'>
                              <MessageCircle className='h-4 w-4 mr-1' />
                              Send
                            </Button>
                            <Button variant='outline' size='sm'>
                              <Upload className='h-4 w-4 mr-1' />
                              Attach
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Deliverables Tab */}
                <TabsContent value='deliverables' className='space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center justify-between'>
                        Project Deliverables
                        <Button size='sm'>
                          <Upload className='h-4 w-4 mr-1' />
                          Upload File
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-4'>
                        {selectedProject.deliverables.map(deliverable => (
                          <div
                            key={deliverable.id}
                            className='flex items-center justify-between p-4 border rounded-lg'
                          >
                            <div className='flex items-center space-x-3'>
                              <div
                                className={`p-2 rounded-lg ${
                                  deliverable.type === 'document'
                                    ? 'bg-blue-100'
                                    : deliverable.type === 'image'
                                      ? 'bg-green-100'
                                      : deliverable.type === 'video'
                                        ? 'bg-purple-100'
                                        : 'bg-gray-100'
                                }`}
                              >
                                <FileText className='h-5 w-5' />
                              </div>

                              <div>
                                <h4 className='font-medium'>
                                  {deliverable.name}
                                </h4>
                                <div className='flex items-center space-x-4 text-sm text-gray-600'>
                                  <span>
                                    Uploaded by {deliverable.uploadedBy}
                                  </span>
                                  <span>
                                    {new Date(
                                      deliverable.uploadedAt
                                    ).toLocaleDateString()}
                                  </span>
                                  <span>v{deliverable.version}</span>
                                  {deliverable.approved && (
                                    <Badge className='bg-green-100 text-green-700'>
                                      <CheckCircle className='h-3 w-3 mr-1' />
                                      Approved
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className='flex space-x-2'>
                              <Button variant='outline' size='sm'>
                                <Eye className='h-4 w-4 mr-1' />
                                View
                              </Button>
                              <Button variant='outline' size='sm'>
                                <Download className='h-4 w-4 mr-1' />
                                Download
                              </Button>
                              {!deliverable.approved &&
                                userRole === 'client' && (
                                  <Button size='sm'>
                                    <CheckCircle className='h-4 w-4 mr-1' />
                                    Approve
                                  </Button>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardContent className='p-12 text-center'>
                <Package className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No Project Selected
                </h3>
                <p className='text-gray-600'>
                  Select a project from the sidebar to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Review Milestone</DialogTitle>
            <DialogDescription>{selectedMilestone?.title}</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <label className='text-sm font-medium mb-2 block'>Rating</label>
              <div className='flex space-x-1'>
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    className='p-1'
                    title={`Rate ${rating} stars`}
                    aria-label={`Rate ${rating} stars`}
                  >
                    <Star className='h-6 w-6 text-yellow-400 fill-yellow-400' />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className='text-sm font-medium mb-2 block'>
                Review Comment
              </label>
              <Textarea
                placeholder='Share your feedback on this milestone...'
                rows={4}
              />
            </div>

            <div className='flex space-x-3'>
              <Button
                onClick={() => setShowReviewModal(false)}
                variant='outline'
                className='flex-1'
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSubmitReview(5, 'Great work!')}
                className='flex-1'
              >
                Submit Review & Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
