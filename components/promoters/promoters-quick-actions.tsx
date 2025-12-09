'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Eye,
  Edit,
  Mail,
  Phone,
  FileText,
  MoreHorizontal,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import type { DashboardPromoter } from './types';
import { toast } from 'sonner';

interface PromoterQuickActionsProps {
  promoter: DashboardPromoter;
  locale?: string;
  onAction?: (action: string, promoterId: string) => void;
}

/**
 * Quick action buttons that appear on row hover
 * Provides fast access to common promoter operations
 */
export function PromoterQuickActions({
  promoter,
  locale = 'en',
  onAction,
}: PromoterQuickActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleView = () => {
    router.push(`/${locale}/manage-promoters/${promoter.id}`);
    onAction?.('view', promoter.id);
  };

  const handleEdit = () => {
    router.push(`/${locale}/manage-promoters/${promoter.id}/edit`);
    onAction?.('edit', promoter.id);
  };

  const handleEmail = () => {
    if (promoter.contactEmail) {
      window.location.href = `mailto:${promoter.contactEmail}`;
      toast.success('Opening email client...');
    } else {
      toast.error('No email address available');
    }
    onAction?.('email', promoter.id);
  };

  const handleCall = () => {
    if (promoter.contactPhone) {
      window.location.href = `tel:${promoter.contactPhone}`;
      toast.success('Initiating call...');
    } else {
      toast.error('No phone number available');
    }
    onAction?.('call', promoter.id);
  };

  const handleViewDocuments = () => {
    router.push(`/${locale}/manage-promoters/${promoter.id}?tab=documents`);
    onAction?.('documents', promoter.id);
  };

  const handleAssign = () => {
    router.push(`/${locale}/manage-promoters/${promoter.id}?action=assign`);
    onAction?.('assign', promoter.id);
  };

  const handleSendReminder = async () => {
    setIsLoading('reminder');
    try {
      const response = await fetch(`/api/promoters/${promoter.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'document_reminder' }),
      });

      if (!response.ok) throw new Error('Failed to send reminder');

      toast.success('Document reminder sent successfully');
    } catch (error) {
      toast.error('Failed to send reminder');
    } finally {
      setIsLoading(null);
    }
    onAction?.('reminder', promoter.id);
  };

  return (
    <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
      <TooltipProvider delayDuration={300}>
        {/* View */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8 hover:bg-blue-100 hover:text-blue-600'
              onClick={handleView}
            >
              <Eye className='h-4 w-4' />
              <span className='sr-only'>View promoter profile</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className='text-xs'>View Profile</p>
            <p className='text-[10px] text-muted-foreground'>Cmd+Click</p>
          </TooltipContent>
        </Tooltip>

        {/* Edit */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8 hover:bg-purple-100 hover:text-purple-600'
              onClick={handleEdit}
            >
              <Edit className='h-4 w-4' />
              <span className='sr-only'>Edit promoter</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className='text-xs'>Edit Details</p>
          </TooltipContent>
        </Tooltip>

        {/* Email */}
        {promoter.contactEmail && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8 hover:bg-green-100 hover:text-green-600'
                onClick={handleEmail}
              >
                <Mail className='h-4 w-4' />
                <span className='sr-only'>Send email</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className='text-xs'>Email: {promoter.contactEmail}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Phone */}
        {promoter.contactPhone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8 hover:bg-yellow-100 hover:text-yellow-600'
                onClick={handleCall}
              >
                <Phone className='h-4 w-4' />
                <span className='sr-only'>Call promoter</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className='text-xs'>Call: {promoter.contactPhone}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8 hover:bg-gray-100'
            >
              <MoreHorizontal className='h-4 w-4' />
              <span className='sr-only'>More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={handleViewDocuments}>
              <FileText className='mr-2 h-4 w-4' />
              View Documents
            </DropdownMenuItem>
            {promoter.assignmentStatus === 'unassigned' && (
              <DropdownMenuItem onClick={handleAssign}>
                <UserCheck className='mr-2 h-4 w-4' />
                Assign to Company
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSendReminder}
              disabled={isLoading === 'reminder'}
            >
              <AlertCircle className='mr-2 h-4 w-4' />
              {isLoading === 'reminder'
                ? 'Sending...'
                : 'Send Document Reminder'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}
