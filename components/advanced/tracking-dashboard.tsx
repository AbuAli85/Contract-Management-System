'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Package,
  FileText,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Users,
  Calendar,
  Target,
  ArrowRight,
  Circle,
  CheckCircle2,
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

import { TrackingService } from '@/lib/advanced/tracking-service';

interface TrackingEntity {
  id: string;
  type: 'contract' | 'document' | 'project' | 'delivery';
  name: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress_percentage: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  metadata: Record<string, any>;
}

interface TrackingEvent {
  id: string;
  entity_id: string;
  entity_type: string;
  event_type: string;
  description: string;
  user_id: string;
  user_name: string;
  created_at: string;
  metadata: Record<string, any>;
}

interface DeliveryTracking {
  id: string;
  tracking_number: string;
  title: string;
  from_location: string;
  to_location: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
  carrier: string;
  estimated_delivery: string;
  actual_delivery?: string;
  progress_percentage: number;
  checkpoints: Array<{
    location: string;
    status: string;
    timestamp: string;
    description: string;
  }>;
}

export function TrackingDashboard() {
  const [entities, setEntities] = useState<TrackingEntity[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<TrackingEntity | null>(
    null
  );

  const trackingService = new TrackingService();

  useEffect(() => {
    loadTrackingData();
  }, [selectedFilter]);

  const loadTrackingData = async () => {
    setLoading(true);
    try {
      // Fetch contracts for tracking entities
      const [contractsRes] = await Promise.all([
        fetch('/api/contracts?limit=20&status=active'),
      ]);
      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        const contracts = contractsData.contracts ?? contractsData.data ?? [];
        const mappedEntities = contracts.map((c: Record<string, unknown>) => ({
          id: String(c.id),
          type: 'contract' as const,
          name: String(c.title ?? c.name ?? `Contract #${c.id}`),
          description: String(c.description ?? ''),
          status: String(c.status ?? 'active'),
          priority: String(c.priority ?? 'medium'),
          progress_percentage: Number(c.progress_percentage ?? 50),
          assigned_to: String(c.assigned_to ?? ''),
          created_at: String(c.created_at ?? new Date().toISOString()),
          updated_at: String(c.updated_at ?? new Date().toISOString()),
          due_date: c.end_date ? String(c.end_date) : undefined,
          metadata: {},
        }));
        setEntities(mappedEntities);
      }
      setEvents([]);
      setDeliveries([]);
    } catch {
      setEntities([]);
      setEvents([]);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'not_started':
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return FileText;
      case 'document':
        return FileText;
      case 'project':
        return Target;
      case 'delivery':
        return Package;
      default:
        return Activity;
    }
  };

  const filteredEntities = entities.filter(entity => {
    const matchesFilter =
      selectedFilter === 'all' ||
      entity.type === selectedFilter ||
      entity.status === selectedFilter;
    const matchesSearch =
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4' />
          <p className='text-muted-foreground text-lg'>
            Loading tracking dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Tracking Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Monitor contracts, documents, projects, and deliveries in real-time
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Input
            placeholder='Search entities...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-64'
          />

          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className='w-48'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Items</SelectItem>
              <SelectItem value='contract'>Contracts</SelectItem>
              <SelectItem value='document'>Documents</SelectItem>
              <SelectItem value='project'>Projects</SelectItem>
              <SelectItem value='delivery'>Deliveries</SelectItem>
              <SelectItem value='in_progress'>In Progress</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
              <SelectItem value='on_hold'>On Hold</SelectItem>
            </SelectContent>
          </Select>

          <Button variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <Activity className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Total Items
                  </p>
                  <p className='text-2xl font-bold'>{entities.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                  <CheckCircle className='h-6 w-6 text-green-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Completed
                  </p>
                  <p className='text-2xl font-bold'>
                    {entities.filter(e => e.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center'>
                  <PlayCircle className='h-6 w-6 text-yellow-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    In Progress
                  </p>
                  <p className='text-2xl font-bold'>
                    {entities.filter(e => e.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center'>
                  <AlertTriangle className='h-6 w-6 text-red-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Urgent
                  </p>
                  <p className='text-2xl font-bold'>
                    {entities.filter(e => e.priority === 'urgent').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue='overview' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='deliveries'>Deliveries</TabsTrigger>
          <TabsTrigger value='timeline'>Timeline</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Entities List */}
            <div className='lg:col-span-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Tracked Items</CardTitle>
                  <CardDescription>
                    All contracts, documents, projects, and deliveries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {filteredEntities.map(entity => {
                      const Icon = getTypeIcon(entity.type);
                      return (
                        <motion.div
                          key={entity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className='flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer'
                          onClick={() => setSelectedEntity(entity)}
                        >
                          <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                            <Icon className='h-5 w-5 text-blue-600' />
                          </div>

                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                              <h3 className='font-medium truncate'>
                                {entity.name}
                              </h3>
                              <Badge className={getStatusColor(entity.status)}>
                                {entity.status.replace('_', ' ')}
                              </Badge>
                              <Badge
                                className={getPriorityColor(entity.priority)}
                              >
                                {entity.priority}
                              </Badge>
                            </div>

                            <p className='text-sm text-muted-foreground mb-2 truncate'>
                              {entity.description}
                            </p>

                            <div className='flex items-center gap-4 mb-2'>
                              <div className='flex-1'>
                                <div className='flex items-center justify-between text-xs mb-1'>
                                  <span>Progress</span>
                                  <span>{entity.progress_percentage}%</span>
                                </div>
                                <Progress
                                  value={entity.progress_percentage}
                                  className='h-2'
                                />
                              </div>
                            </div>

                            <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                              {entity.assigned_to && (
                                <span className='flex items-center gap-1'>
                                  <Users className='h-3 w-3' />
                                  {entity.assigned_to}
                                </span>
                              )}
                              {entity.due_date && (
                                <span className='flex items-center gap-1'>
                                  <Calendar className='h-3 w-3' />
                                  Due{' '}
                                  {new Date(
                                    entity.due_date
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Eye className='h-4 w-4 mr-2' />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <TrendingUp className='h-4 w-4 mr-2' />
                                View Analytics
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {events.slice(0, 5).map(event => (
                      <div key={event.id} className='flex gap-3'>
                        <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                          <Activity className='h-4 w-4 text-blue-600' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium'>
                            {event.description}
                          </p>
                          <div className='flex items-center gap-2 text-xs text-muted-foreground mt-1'>
                            <span>{event.user_name}</span>
                            <span>•</span>
                            <span>
                              {new Date(event.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value='deliveries' className='space-y-6'>
          <div className='grid gap-6'>
            {deliveries.map(delivery => (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div>
                        <CardTitle className='flex items-center gap-2'>
                          <Truck className='h-5 w-5' />
                          {delivery.title}
                        </CardTitle>
                        <CardDescription>
                          Tracking: {delivery.tracking_number} •{' '}
                          {delivery.carrier}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(delivery.status)}>
                        {delivery.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className='space-y-4'>
                      {/* Route */}
                      <div className='flex items-center gap-4 text-sm'>
                        <div className='flex items-center gap-2'>
                          <MapPin className='h-4 w-4 text-green-600' />
                          <span>{delivery.from_location}</span>
                        </div>
                        <ArrowRight className='h-4 w-4 text-muted-foreground' />
                        <div className='flex items-center gap-2'>
                          <MapPin className='h-4 w-4 text-red-600' />
                          <span>{delivery.to_location}</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className='flex items-center justify-between text-sm mb-2'>
                          <span>Delivery Progress</span>
                          <span>{delivery.progress_percentage}%</span>
                        </div>
                        <Progress
                          value={delivery.progress_percentage}
                          className='h-2'
                        />
                      </div>

                      {/* Timeline */}
                      <div className='space-y-3'>
                        {delivery.checkpoints.map((checkpoint, index) => (
                          <div key={index} className='flex items-start gap-3'>
                            <div className='flex flex-col items-center'>
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  index === delivery.checkpoints.length - 1
                                    ? 'bg-blue-600'
                                    : 'bg-green-600'
                                }`}
                              />
                              {index < delivery.checkpoints.length - 1 && (
                                <div className='w-px h-6 bg-gray-300 mt-1' />
                              )}
                            </div>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-1'>
                                <span className='font-medium text-sm'>
                                  {checkpoint.location}
                                </span>
                                <Badge variant='outline' className='text-xs'>
                                  {checkpoint.status}
                                </Badge>
                              </div>
                              <p className='text-xs text-muted-foreground mb-1'>
                                {checkpoint.description}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                {new Date(
                                  checkpoint.timestamp
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Info */}
                      <div className='grid grid-cols-2 gap-4 pt-4 border-t text-sm'>
                        <div>
                          <span className='text-muted-foreground'>
                            Estimated Delivery:
                          </span>
                          <p className='font-medium'>
                            {new Date(
                              delivery.estimated_delivery
                            ).toLocaleString()}
                          </p>
                        </div>
                        {delivery.actual_delivery && (
                          <div>
                            <span className='text-muted-foreground'>
                              Actual Delivery:
                            </span>
                            <p className='font-medium'>
                              {new Date(
                                delivery.actual_delivery
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='timeline' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                Chronological view of all activities and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {events.map((event, index) => (
                  <div key={event.id} className='flex gap-4'>
                    <div className='flex flex-col items-center'>
                      <div className='w-4 h-4 bg-blue-600 rounded-full' />
                      {index < events.length - 1 && (
                        <div className='w-px h-8 bg-gray-300 mt-2' />
                      )}
                    </div>
                    <div className='flex-1 pb-6'>
                      <div className='flex items-center gap-2 mb-2'>
                        <h3 className='font-medium'>{event.description}</h3>
                        <Badge variant='outline'>{event.event_type}</Badge>
                      </div>
                      <div className='text-sm text-muted-foreground mb-2'>
                        {event.user_name} •{' '}
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                      <div className='text-sm'>
                        Entity: {event.entity_type} #{event.entity_id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='analytics' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Current status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {['completed', 'in_progress', 'on_hold', 'not_started'].map(
                    status => {
                      const count = entities.filter(
                        e => e.status === status
                      ).length;
                      const percentage =
                        entities.length > 0
                          ? (count / entities.length) * 100
                          : 0;
                      return (
                        <div key={status}>
                          <div className='flex items-center justify-between text-sm mb-2'>
                            <span className='capitalize'>
                              {status.replace('_', ' ')}
                            </span>
                            <span>
                              {count} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className='h-2' />
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Type Distribution</CardTitle>
                <CardDescription>Items by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {['contract', 'document', 'project', 'delivery'].map(type => {
                    const count = entities.filter(e => e.type === type).length;
                    const percentage =
                      entities.length > 0 ? (count / entities.length) * 100 : 0;
                    return (
                      <div key={type}>
                        <div className='flex items-center justify-between text-sm mb-2'>
                          <span className='capitalize'>{type}s</span>
                          <span>
                            {count} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className='h-2' />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
