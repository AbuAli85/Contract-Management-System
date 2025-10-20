'use client';

import { useState, useCallback, useMemo } from 'react';
import { format, addDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Promoter } from '@/lib/types';

interface DashboardPromoter extends Promoter {
  displayName: string;
  assignmentStatus: 'assigned' | 'unassigned';
  organisationLabel: string;
  idDocument: any;
  passportDocument: any;
  overallStatus: 'active' | 'warning' | 'critical' | 'inactive';
  contactEmail: string;
  contactPhone: string;
  createdLabel: string;
}

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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  Bell,
  Send,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Filter,
  Search,
  Plus,
  Settings,
  Trash2,
  Edit,
  Eye,
  Archive,
  RefreshCw,
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'document_expiry' | 'assignment' | 'general' | 'urgent';
  subject: string;
  message: string;
  isActive: boolean;
  createdAt: string;
}

interface Notification {
  id: string;
  promoterId: string;
  promoterName: string;
  type: 'document_expiry' | 'assignment' | 'general' | 'urgent';
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveryMethod: 'email' | 'sms' | 'both';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

interface PromoterNotificationSystemProps {
  promoters: DashboardPromoter[];
}

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'doc-expiry-30',
    name: 'Document Expiry - 30 Days',
    type: 'document_expiry',
    subject: 'Document Expiry Reminder - Action Required',
    message:
      'Dear {{promoter_name}},\n\nYour {{document_type}} will expire in {{days_remaining}} days on {{expiry_date}}.\n\nPlease renew your document at the earliest convenience to maintain compliance.\n\nBest regards,\nContract Management Team',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'doc-expiry-7',
    name: 'Document Expiry - 7 Days (Urgent)',
    type: 'document_expiry',
    subject: 'URGENT: Document Expiring Soon',
    message:
      'Dear {{promoter_name}},\n\nURGENT: Your {{document_type}} will expire in {{days_remaining}} days on {{expiry_date}}.\n\nImmediate action is required to avoid compliance issues.\n\nPlease contact us immediately.\n\nBest regards,\nContract Management Team',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'assignment-new',
    name: 'New Assignment Notification',
    type: 'assignment',
    subject: 'New Assignment - {{company_name}}',
    message:
      'Dear {{promoter_name}},\n\nYou have been assigned to work with {{company_name}}.\n\nPlease review the assignment details and contact us if you have any questions.\n\nBest regards,\nContract Management Team',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'general-welcome',
    name: 'Welcome Message',
    type: 'general',
    subject: 'Welcome to Contract Management System',
    message:
      'Dear {{promoter_name}},\n\nWelcome to our Contract Management System!\n\nYour profile has been created successfully. Please ensure all your documents are up to date.\n\nBest regards,\nContract Management Team',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export function PromoterNotificationSystem({
  promoters,
}: PromoterNotificationSystemProps) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'notifications' | 'templates' | 'settings'
  >('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] =
    useState<NotificationTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedPromoters, setSelectedPromoters] = useState<Set<string>>(
    new Set()
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<
    'email' | 'sms' | 'both'
  >('email');
  const [priority, setPriority] = useState<
    'low' | 'medium' | 'high' | 'urgent'
  >('medium');
  const [isSending, setIsSending] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'sent' | 'delivered' | 'failed'
  >('all');

  // Get promoters with expiring documents
  const promotersNeedingAttention = useMemo(() => {
    return promoters.filter(
      promoter =>
        promoter.idDocument.status === 'expired' ||
        promoter.idDocument.status === 'expiring' ||
        promoter.passportDocument.status === 'expired' ||
        promoter.passportDocument.status === 'expiring'
    );
  }, [promoters]);

  // Get unassigned promoters
  const unassignedPromoters = useMemo(() => {
    return promoters.filter(
      promoter => promoter.assignmentStatus === 'unassigned'
    );
  }, [promoters]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesSearch =
        !searchTerm ||
        notification.promoterName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        notification.subject.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || notification.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [notifications, searchTerm, statusFilter]);

  // Handle sending notifications
  const handleSendNotification = useCallback(async () => {
    if (selectedPromoters.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No promoters selected',
        description:
          'Please select at least one promoter to send notifications.',
      });
      return;
    }

    setIsSending(true);

    try {
      const template = templates.find(t => t.id === selectedTemplate);
      const selectedPromoterData = promoters.filter(p =>
        selectedPromoters.has(p.id)
      );

      const newNotifications: Notification[] = selectedPromoterData.map(
        promoter => {
          let message =
            customMessage || template?.message || 'Notification message';
          let subject = template?.subject || 'Notification';

          // Replace template variables
          message = message
            .replace(/\{\{promoter_name\}\}/g, promoter.displayName)
            .replace(/\{\{company_name\}\}/g, promoter.organisationLabel)
            .replace(/\{\{document_type\}\}/g, 'document')
            .replace(/\{\{days_remaining\}\}/g, 'X')
            .replace(/\{\{expiry_date\}\}/g, 'YYYY-MM-DD');

          subject = subject
            .replace(/\{\{promoter_name\}\}/g, promoter.displayName)
            .replace(/\{\{company_name\}\}/g, promoter.organisationLabel);

          return {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            promoterId: promoter.id,
            promoterName: promoter.displayName,
            type: template?.type || 'general',
            subject,
            message,
            status: 'pending',
            deliveryMethod,
            priority,
            createdAt: new Date().toISOString(),
          };
        }
      );

      setNotifications(prev => [...newNotifications, ...prev]);

      // Simulate sending notifications
      setTimeout(() => {
        setNotifications(prev =>
          prev.map(notif =>
            newNotifications.some(n => n.id === notif.id)
              ? {
                  ...notif,
                  status: 'sent' as const,
                  sentAt: new Date().toISOString(),
                }
              : notif
          )
        );
      }, 2000);

      toast({
        title: 'Notifications sent',
        description: `${selectedPromoters.size} notifications have been queued for delivery.`,
      });

      setSelectedPromoters(new Set());
      setCustomMessage('');
      setSelectedTemplate('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to send notifications',
        description: 'There was an error sending the notifications.',
      });
    } finally {
      setIsSending(false);
    }
  }, [
    selectedPromoters,
    templates,
    selectedTemplate,
    customMessage,
    deliveryMethod,
    priority,
    promoters,
    toast,
  ]);

  // Handle bulk actions
  const handleBulkAction = useCallback(
    (
      action: 'select_all' | 'select_expiring' | 'select_unassigned' | 'clear'
    ) => {
      switch (action) {
        case 'select_all':
          setSelectedPromoters(new Set(promoters.map(p => p.id)));
          break;
        case 'select_expiring':
          setSelectedPromoters(
            new Set(promotersNeedingAttention.map(p => p.id))
          );
          break;
        case 'select_unassigned':
          setSelectedPromoters(new Set(unassignedPromoters.map(p => p.id)));
          break;
        case 'clear':
          setSelectedPromoters(new Set());
          break;
      }
    },
    [promoters, promotersNeedingAttention, unassignedPromoters]
  );

  // Handle template creation
  const handleCreateTemplate = useCallback(
    (templateData: Omit<NotificationTemplate, 'id' | 'createdAt'>) => {
      const newTemplate: NotificationTemplate = {
        ...templateData,
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      setTemplates(prev => [newTemplate, ...prev]);
      setShowCreateTemplate(false);

      toast({
        title: 'Template created',
        description:
          'Your notification template has been created successfully.',
      });
    },
    [toast]
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Notification Center
          </h2>
          <p className='text-muted-foreground'>
            Manage notifications and communications with your promoter workforce
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <Settings className='mr-2 h-4 w-4' />
            Settings
          </Button>
          <Button size='sm'>
            <Plus className='mr-2 h-4 w-4' />
            New Notification
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Pending
                </p>
                <p className='text-2xl font-bold'>
                  {notifications.filter(n => n.status === 'pending').length}
                </p>
              </div>
              <Clock className='h-8 w-8 text-amber-500' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Sent
                </p>
                <p className='text-2xl font-bold'>
                  {
                    notifications.filter(
                      n => n.status === 'sent' || n.status === 'delivered'
                    ).length
                  }
                </p>
              </div>
              <CheckCircle className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Failed
                </p>
                <p className='text-2xl font-bold'>
                  {notifications.filter(n => n.status === 'failed').length}
                </p>
              </div>
              <XCircle className='h-8 w-8 text-red-500' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Templates
                </p>
                <p className='text-2xl font-bold'>{templates.length}</p>
              </div>
              <MessageSquare className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(value: any) => setActiveTab(value)}
      >
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='notifications'>Notifications</TabsTrigger>
          <TabsTrigger value='templates'>Templates</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value='notifications' className='space-y-4'>
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Quick Actions</CardTitle>
              <CardDescription>
                Send notifications to specific groups of promoters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-3'>
                <Button
                  variant='outline'
                  onClick={() => handleBulkAction('select_expiring')}
                  className='justify-start'
                >
                  <AlertTriangle className='mr-2 h-4 w-4 text-amber-500' />
                  Document Expiry Alerts ({promotersNeedingAttention.length})
                </Button>
                <Button
                  variant='outline'
                  onClick={() => handleBulkAction('select_unassigned')}
                  className='justify-start'
                >
                  <Users className='mr-2 h-4 w-4 text-blue-500' />
                  Unassigned Promoters ({unassignedPromoters.length})
                </Button>
                <Button
                  variant='outline'
                  onClick={() => handleBulkAction('select_all')}
                  className='justify-start'
                >
                  <Users className='mr-2 h-4 w-4 text-slate-500' />
                  All Promoters ({promoters.length})
                </Button>
              </div>

              {selectedPromoters.size > 0 && (
                <div className='mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-green-500' />
                      <span className='font-medium'>
                        {selectedPromoters.size} promoters selected
                      </span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleBulkAction('clear')}
                    >
                      Clear selection
                    </Button>
                  </div>

                  <div className='space-y-4'>
                    <div className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label>Template</Label>
                        <Select
                          value={selectedTemplate}
                          onValueChange={setSelectedTemplate}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select a template' />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='space-y-2'>
                        <Label>Delivery Method</Label>
                        <Select
                          value={deliveryMethod}
                          onValueChange={(value: any) =>
                            setDeliveryMethod(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='email'>Email</SelectItem>
                            <SelectItem value='sms'>SMS</SelectItem>
                            <SelectItem value='both'>Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label>Custom Message (Optional)</Label>
                      <Textarea
                        placeholder='Override the template message with your own...'
                        value={customMessage}
                        onChange={e => setCustomMessage(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button
                        onClick={handleSendNotification}
                        disabled={isSending}
                        className='flex-1'
                      >
                        {isSending ? (
                          <>
                            <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className='mr-2 h-4 w-4' />
                            Send Notifications
                          </>
                        )}
                      </Button>
                      <Select
                        value={priority}
                        onValueChange={(value: any) => setPriority(value)}
                      >
                        <SelectTrigger className='w-32'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='low'>Low</SelectItem>
                          <SelectItem value='medium'>Medium</SelectItem>
                          <SelectItem value='high'>High</SelectItem>
                          <SelectItem value='urgent'>Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification History */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-lg'>
                    Notification History
                  </CardTitle>
                  <CardDescription>
                    View and manage sent notifications
                  </CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='relative'>
                    <Search className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      placeholder='Search notifications...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-8 w-64'
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: any) => setStatusFilter(value)}
                  >
                    <SelectTrigger className='w-32'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All</SelectItem>
                      <SelectItem value='pending'>Pending</SelectItem>
                      <SelectItem value='sent'>Sent</SelectItem>
                      <SelectItem value='delivered'>Delivered</SelectItem>
                      <SelectItem value='failed'>Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[400px]'>
                <div className='space-y-2'>
                  {filteredNotifications.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      No notifications found
                    </div>
                  ) : (
                    filteredNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onResend={() => {
                          // Handle resend logic
                          toast({
                            title: 'Notification resent',
                            description: `Notification to ${notification.promoterName} has been resent.`,
                          });
                        }}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='templates' className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-lg'>
                    Notification Templates
                  </CardTitle>
                  <CardDescription>
                    Manage reusable notification templates
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateTemplate(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {templates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => {
                      // Handle edit template
                      toast({
                        title: 'Edit template',
                        description:
                          'Template editing functionality coming soon.',
                      });
                    }}
                    onDelete={() => {
                      setTemplates(prev =>
                        prev.filter(t => t.id !== template.id)
                      );
                      toast({
                        title: 'Template deleted',
                        description: 'The template has been removed.',
                      });
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='settings' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Notification Settings</CardTitle>
              <CardDescription>
                Configure notification preferences and delivery settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>Delivery Settings</h3>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label>Default Delivery Method</Label>
                      <Select value='email' onValueChange={() => {}}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='email'>Email</SelectItem>
                          <SelectItem value='sms'>SMS</SelectItem>
                          <SelectItem value='both'>Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Default Priority</Label>
                      <Select value='medium' onValueChange={() => {}}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='low'>Low</SelectItem>
                          <SelectItem value='medium'>Medium</SelectItem>
                          <SelectItem value='high'>High</SelectItem>
                          <SelectItem value='urgent'>Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>
                    Automated Notifications
                  </h3>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between p-4 border rounded-lg'>
                      <div>
                        <h4 className='font-medium'>Document Expiry Alerts</h4>
                        <p className='text-sm text-muted-foreground'>
                          Automatically notify promoters when documents are
                          expiring
                        </p>
                      </div>
                      <Button variant='outline' size='sm'>
                        <Settings className='mr-2 h-4 w-4' />
                        Configure
                      </Button>
                    </div>
                    <div className='flex items-center justify-between p-4 border rounded-lg'>
                      <div>
                        <h4 className='font-medium'>
                          Assignment Notifications
                        </h4>
                        <p className='text-sm text-muted-foreground'>
                          Notify promoters when they are assigned to new
                          companies
                        </p>
                      </div>
                      <Button variant='outline' size='sm'>
                        <Settings className='mr-2 h-4 w-4' />
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Create Notification Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for sending notifications to promoters
            </DialogDescription>
          </DialogHeader>
          <CreateTemplateForm
            onSubmit={handleCreateTemplate}
            onCancel={() => setShowCreateTemplate(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onResend: () => void;
}

function NotificationItem({ notification, onResend }: NotificationItemProps) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    pending: Clock,
    sent: Send,
    delivered: CheckCircle,
    failed: XCircle,
  };

  const StatusIcon = statusIcons[notification.status];

  return (
    <div className='flex items-center justify-between p-4 border rounded-lg'>
      <div className='flex items-center gap-4'>
        <div
          className={cn('rounded-full p-2', statusColors[notification.status])}
        >
          <StatusIcon className='h-4 w-4' />
        </div>
        <div className='space-y-1'>
          <div className='font-medium'>{notification.promoterName}</div>
          <div className='text-sm text-muted-foreground'>
            {notification.subject}
          </div>
          <div className='text-xs text-muted-foreground'>
            {notification.deliveryMethod} • {notification.priority} priority
          </div>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Badge variant='outline' className={statusColors[notification.status]}>
          {notification.status}
        </Badge>
        {notification.status === 'failed' && (
          <Button variant='outline' size='sm' onClick={onResend}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Resend
          </Button>
        )}
        <Button variant='ghost' size='sm'>
          <Eye className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: NotificationTemplate;
  onEdit: () => void;
  onDelete: () => void;
}

function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  const typeColors = {
    document_expiry: 'bg-red-100 text-red-800',
    assignment: 'bg-blue-100 text-blue-800',
    general: 'bg-green-100 text-green-800',
    urgent: 'bg-amber-100 text-amber-800',
  };

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base'>{template.name}</CardTitle>
          <Badge variant='outline' className={typeColors[template.type]}>
            {template.type.replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription className='text-sm'>
          {template.subject}
        </CardDescription>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-3'>
          <p className='text-sm text-muted-foreground line-clamp-3'>
            {template.message}
          </p>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  template.isActive ? 'bg-green-500' : 'bg-slate-300'
                )}
              />
              <span className='text-xs text-muted-foreground'>
                {template.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <Button variant='ghost' size='sm' onClick={onEdit}>
                <Edit className='h-4 w-4' />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant='ghost' size='sm'>
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this template? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CreateTemplateFormProps {
  onSubmit: (template: Omit<NotificationTemplate, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function CreateTemplateForm({ onSubmit, onCancel }: CreateTemplateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'general' as const,
    subject: '',
    message: '',
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='name'>Template Name</Label>
          <Input
            id='name'
            value={formData.name}
            onChange={e =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            placeholder='Enter template name'
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='type'>Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) =>
              setFormData(prev => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='document_expiry'>Document Expiry</SelectItem>
              <SelectItem value='assignment'>Assignment</SelectItem>
              <SelectItem value='general'>General</SelectItem>
              <SelectItem value='urgent'>Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='subject'>Subject</Label>
        <Input
          id='subject'
          value={formData.subject}
          onChange={e =>
            setFormData(prev => ({ ...prev, subject: e.target.value }))
          }
          placeholder='Enter email subject'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='message'>Message</Label>
        <Textarea
          id='message'
          value={formData.message}
          onChange={e =>
            setFormData(prev => ({ ...prev, message: e.target.value }))
          }
          placeholder='Enter message content. Use {{promoter_name}}, {{company_name}} for variables.'
          rows={6}
          required
        />
        <p className='text-xs text-muted-foreground'>
          Available variables:{' '}
          {`{{promoter_name}}, {{company_name}}, {{document_type}}, {{days_remaining}}, {{expiry_date}}`}
        </p>
      </div>

      <div className='flex items-center space-x-2'>
        <Checkbox
          id='active'
          checked={formData.isActive}
          onCheckedChange={checked =>
            setFormData(prev => ({ ...prev, isActive: !!checked }))
          }
        />
        <Label htmlFor='active'>Active template</Label>
      </div>

      <DialogFooter>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit'>Create Template</Button>
      </DialogFooter>
    </form>
  );
}
