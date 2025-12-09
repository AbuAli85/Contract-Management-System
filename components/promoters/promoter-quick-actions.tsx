'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Download,
  Upload,
  Calendar,
  UserPlus,
  Settings,
  Eye,
  Trash2,
  Copy,
  Share,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
  badge?: string | undefined;
  description?: string;
}

interface PromoterQuickActionsProps {
  promoter: {
    id: string;
    name_en: string;
    email?: string;
    phone?: string;
    status: string;
  };
  onEdit: () => void;
  onCall: () => void;
  onEmail: () => void;
  onMessage: () => void;
  onViewProfile: () => void;
  onViewContracts: () => void;
  onCreateContract: () => void;
  onUploadDocuments: () => void;
  onDownloadProfile: () => void;
  onScheduleMeeting: () => void;
  onAddToFavorites: () => void;
  onShare: () => void;
  onDelete: () => void;
  isAdmin: boolean;
  isFavorite?: boolean;
  hasDocuments?: boolean;
  hasContracts?: boolean;
}

export function PromoterQuickActions({
  promoter,
  onEdit,
  onCall,
  onEmail,
  onMessage,
  onViewProfile,
  onViewContracts,
  onCreateContract,
  onUploadDocuments,
  onDownloadProfile,
  onScheduleMeeting,
  onAddToFavorites,
  onShare,
  onDelete,
  isAdmin,
  isFavorite = false,
  hasDocuments = false,
  hasContracts = false,
}: PromoterQuickActionsProps) {
  const primaryActions: QuickAction[] = [
    {
      id: 'edit',
      label: 'Edit Profile',
      icon: <Edit className='h-4 w-4' />,
      variant: 'default',
      onClick: onEdit,
      description: 'Update promoter information',
    },
    {
      id: 'view-profile',
      label: 'View Full Profile',
      icon: <Eye className='h-4 w-4' />,
      variant: 'outline',
      onClick: onViewProfile,
      description: 'See complete profile details',
    },
    {
      id: 'create-contract',
      label: 'Create Contract',
      icon: <FileText className='h-4 w-4' />,
      variant: 'outline',
      onClick: onCreateContract,
      description: 'Generate new contract',
      badge: hasContracts ? 'Available' : undefined,
    },
  ];

  const communicationActions: QuickAction[] = [
    {
      id: 'call',
      label: 'Call',
      icon: <Phone className='h-4 w-4' />,
      variant: 'outline',
      onClick: onCall,
      disabled: !promoter.phone,
      description: 'Call promoter directly',
    },
    {
      id: 'email',
      label: 'Send Email',
      icon: <Mail className='h-4 w-4' />,
      variant: 'outline',
      onClick: onEmail,
      disabled: !promoter.email,
      description: 'Send email to promoter',
    },
    {
      id: 'message',
      label: 'Send Message',
      icon: <MessageSquare className='h-4 w-4' />,
      variant: 'outline',
      onClick: onMessage,
      description: 'Send internal message',
    },
    {
      id: 'schedule',
      label: 'Schedule Meeting',
      icon: <Calendar className='h-4 w-4' />,
      variant: 'outline',
      onClick: onScheduleMeeting,
      description: 'Schedule a meeting',
    },
  ];

  const documentActions: QuickAction[] = [
    {
      id: 'view-contracts',
      label: 'View Contracts',
      icon: <FileText className='h-4 w-4' />,
      variant: 'outline',
      onClick: onViewContracts,
      disabled: !hasContracts,
      description: 'View all contracts',
      badge: hasContracts ? `${hasContracts} contracts` : 'No contracts',
    },
    {
      id: 'upload-documents',
      label: 'Upload Documents',
      icon: <Upload className='h-4 w-4' />,
      variant: 'outline',
      onClick: onUploadDocuments,
      description: 'Upload ID card or passport',
    },
    {
      id: 'download-profile',
      label: 'Download Profile',
      icon: <Download className='h-4 w-4' />,
      variant: 'outline',
      onClick: onDownloadProfile,
      description: 'Export profile as PDF',
    },
  ];

  const utilityActions: QuickAction[] = [
    {
      id: 'favorite',
      label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: <Star className='h-4 w-4' />,
      variant: isFavorite ? 'secondary' : 'outline',
      onClick: onAddToFavorites,
      description: isFavorite ? 'Remove from favorites' : 'Add to favorites',
    },
    {
      id: 'share',
      label: 'Share Profile',
      icon: <Share className='h-4 w-4' />,
      variant: 'outline',
      onClick: onShare,
      description: 'Share promoter profile',
    },
    {
      id: 'copy-link',
      label: 'Copy Link',
      icon: <Copy className='h-4 w-4' />,
      variant: 'outline',
      onClick: () => navigator.clipboard.writeText(window.location.href),
      description: 'Copy profile link',
    },
  ];

  const adminActions: QuickAction[] = [
    {
      id: 'settings',
      label: 'Advanced Settings',
      icon: <Settings className='h-4 w-4' />,
      variant: 'outline',
      onClick: () => console.log('Advanced settings'),
      description: 'Configure advanced options',
    },
    {
      id: 'delete',
      label: 'Delete Promoter',
      icon: <Trash2 className='h-4 w-4' />,
      variant: 'destructive',
      onClick: onDelete,
      description: 'Permanently delete promoter',
    },
  ];

  const ActionGroup = ({
    title,
    actions,
    columns = 2,
  }: {
    title: string;
    actions: QuickAction[];
    columns?: number;
  }) => (
    <div className='space-y-3'>
      <h4 className='text-sm font-medium text-gray-900'>{title}</h4>
      <div
        className={`grid grid-cols-1 ${columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-2`}
      >
        {actions.map(action => (
          <Button
            key={action.id}
            variant={action.variant}
            size='sm'
            onClick={action.onClick}
            disabled={action.disabled}
            className='justify-start h-auto p-3 text-left'
          >
            <div className='flex items-center gap-2 w-full'>
              {action.icon}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium truncate'>{action.label}</span>
                  {action.badge && (
                    <Badge variant='outline' className='text-xs'>
                      {action.badge}
                    </Badge>
                  )}
                </div>
                {action.description && (
                  <p className='text-xs text-muted-foreground mt-1'>
                    {action.description}
                  </p>
                )}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Settings className='h-5 w-5' />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <ActionGroup title='Primary Actions' actions={primaryActions} />
        <ActionGroup title='Communication' actions={communicationActions} />
        <ActionGroup title='Documents & Contracts' actions={documentActions} />
        <ActionGroup title='Utilities' actions={utilityActions} columns={3} />
        {isAdmin && (
          <ActionGroup title='Admin Actions' actions={adminActions} />
        )}
      </CardContent>
    </Card>
  );
}
