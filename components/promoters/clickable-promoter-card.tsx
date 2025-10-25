'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  Phone, 
  Shield, 
  Edit, 
  Eye, 
  MoreVertical,
  ExternalLink,
  Calendar,
  MapPin,
  Mail,
  CreditCard,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ClickablePromoterCardProps {
  promoter: {
    id: string;
    name_en: string;
    name_ar: string | null;
    mobile_number: string | null;
    id_card_number: string;
    status: string;
    job_title: string | null;
    profile_picture_url: string | null;
    id_card_expiry_date: string | null;
    passport_expiry_date: string | null;
    created_at: string;
    updated_at: string;
  };
  locale?: string;
  onEdit?: (promoterId: string) => void;
  onView?: (promoterId: string) => void;
  enableQuickActions?: boolean;
}

export function ClickablePromoterCard({ 
  promoter, 
  locale = 'en',
  onEdit,
  onView,
  enableQuickActions = true,
}: ClickablePromoterCardProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on dropdown or other interactive elements
    if ((e.target as Element).closest('[data-no-click]')) {
      return;
    }
    
    if (onEdit) {
      onEdit(promoter.id);
    } else {
      router.push(`/${locale}/manage-promoters/${promoter.id}/edit`);
    }
  };

  const handleViewDetails = () => {
    if (onView) {
      onView(promoter.id);
    } else {
      router.push(`/${locale}/manage-promoters/${promoter.id}`);
    }
  };

  const handleQuickEdit = () => {
    if (onEdit) {
      onEdit(promoter.id);
    } else {
      router.push(`/${locale}/manage-promoters/${promoter.id}/edit`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDocumentStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: 'missing', label: 'Missing', color: 'bg-red-100 text-red-700 border-red-200' };
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: 'Expiring Soon', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    } else {
      return { status: 'valid', label: 'Valid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
  };

  const idCardStatus = getDocumentStatus(promoter.id_card_expiry_date);
  const passportStatus = getDocumentStatus(promoter.passport_expiry_date);

  return (
    <>
      <Card 
        className={cn(
          'group relative border-slate-200 dark:border-slate-700 transition-all duration-200',
          'hover:shadow-lg hover:border-blue-300 hover:-translate-y-0.5 cursor-pointer',
          'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2'
        )}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick(e as any);
          }
        }}
        aria-label={`Edit promoter ${promoter.name_en}`}
      >
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            {/* Profile Picture */}
            <div className='flex-shrink-0'>
              {promoter.profile_picture_url ? (
                <img
                  src={promoter.profile_picture_url}
                  alt={promoter.name_en}
                  className='h-12 w-12 rounded-full object-cover border-2 border-slate-200 group-hover:border-blue-300 transition-colors'
                />
              ) : (
                <div className='h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-slate-200 group-hover:border-blue-300 transition-colors'>
                  <User className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                </div>
              )}
              
              {/* Edit Overlay on Hover */}
              <div className='absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                <Edit className='h-4 w-4 text-white' />
              </div>
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <h4 className='font-semibold text-slate-900 dark:text-slate-100 truncate text-base group-hover:text-blue-600 transition-colors'>
                  {promoter.name_en}
                </h4>
                <Badge
                  variant={
                    promoter.status === 'active'
                      ? 'default'
                      : promoter.status === 'inactive'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className='text-xs'
                >
                  {promoter.status}
                </Badge>
              </div>
              
              {promoter.name_ar && (
                <p className='text-sm text-slate-600 dark:text-slate-400 mb-2'>
                  {promoter.name_ar}
                </p>
              )}
              
              {promoter.job_title && (
                <div className='flex items-center gap-1 mb-2'>
                  <Building2 className='h-3 w-3 text-slate-400' />
                  <p className='text-xs text-slate-500 dark:text-slate-500'>
                    {promoter.job_title}
                  </p>
                </div>
              )}
              
              <div className='space-y-1 text-xs text-slate-500 dark:text-slate-500'>
                {promoter.mobile_number && (
                  <div className='flex items-center gap-1'>
                    <Phone className='h-3 w-3' />
                    <span>{promoter.mobile_number}</span>
                  </div>
                )}
                <div className='flex items-center gap-1'>
                  <CreditCard className='h-3 w-3' />
                  <span>{promoter.id_card_number}</span>
                </div>
              </div>

              {/* Document Status Indicators */}
              <div className='flex items-center gap-2 mt-2'>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full border font-medium',
                  idCardStatus.color
                )}>
                  ID: {idCardStatus.label}
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full border font-medium',
                  passportStatus.color
                )}>
                  Passport: {passportStatus.label}
                </span>
              </div>

              {/* Quick Actions Hint */}
              <div className='opacity-0 group-hover:opacity-100 transition-opacity mt-2'>
                <p className='text-xs text-blue-600 font-medium flex items-center gap-1'>
                  <Edit className='h-3 w-3' />
                  Click to edit details
                </p>
              </div>
            </div>

            {/* Actions Dropdown */}
            {enableQuickActions && (
              <div data-no-click className='flex-shrink-0'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                    >
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuItem onClick={handleQuickEdit}>
                      <Edit className='mr-2 h-4 w-4' />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleViewDetails}>
                      <Eye className='mr-2 h-4 w-4' />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDetails(true)}>
                      <ExternalLink className='mr-2 h-4 w-4' />
                      Quick Preview
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>

        {/* Hover Effect Overlay */}
        <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />
      </Card>

      {/* Quick Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              {promoter.profile_picture_url ? (
                <img
                  src={promoter.profile_picture_url}
                  alt={promoter.name_en}
                  className='h-8 w-8 rounded-full object-cover'
                />
              ) : (
                <div className='h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center'>
                  <User className='h-4 w-4 text-blue-600' />
                </div>
              )}
              {promoter.name_en}
            </DialogTitle>
            <DialogDescription>
              Promoter details and status information
            </DialogDescription>
          </DialogHeader>
          
          <div className='space-y-4'>
            {promoter.name_ar && (
              <div>
                <label className='text-sm font-medium text-slate-600'>Arabic Name</label>
                <p className='text-sm text-slate-900'>{promoter.name_ar}</p>
              </div>
            )}
            
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-slate-600'>Status</label>
                <Badge
                  variant={
                    promoter.status === 'active' ? 'default' : 'secondary'
                  }
                  className='mt-1'
                >
                  {promoter.status}
                </Badge>
              </div>
              
              {promoter.job_title && (
                <div>
                  <label className='text-sm font-medium text-slate-600'>Job Title</label>
                  <p className='text-sm text-slate-900'>{promoter.job_title}</p>
                </div>
              )}
            </div>
            
            <div className='grid grid-cols-1 gap-4'>
              {promoter.mobile_number && (
                <div className='flex items-center gap-2'>
                  <Phone className='h-4 w-4 text-slate-400' />
                  <span className='text-sm'>{promoter.mobile_number}</span>
                </div>
              )}
              
              <div className='flex items-center gap-2'>
                <CreditCard className='h-4 w-4 text-slate-400' />
                <span className='text-sm'>{promoter.id_card_number}</span>
              </div>
              
              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-slate-400' />
                <span className='text-sm'>Created: {formatDate(promoter.created_at)}</span>
              </div>
            </div>
            
            <div className='space-y-2'>
              <h4 className='text-sm font-medium text-slate-600'>Document Status</h4>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>ID Card</span>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full border font-medium',
                    idCardStatus.color
                  )}>
                    {idCardStatus.label}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Passport</span>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full border font-medium',
                    passportStatus.color
                  )}>
                    {passportStatus.label}
                  </span>
                </div>
              </div>
            </div>
            
            <div className='flex gap-2 pt-4 border-t'>
              <Button onClick={handleQuickEdit} className='flex-1'>
                <Edit className='h-4 w-4 mr-2' />
                Edit Profile
              </Button>
              <Button variant='outline' onClick={handleViewDetails} className='flex-1'>
                <Eye className='h-4 w-4 mr-2' />
                View Details
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
