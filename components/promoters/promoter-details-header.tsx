'use client';

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Edit,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  MapPin,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface PromoterDetailsHeaderProps {
  promoter: {
    id: string;
    name_en: string;
    name_ar?: string;
    email?: string;
    phone?: string;
    mobile_number?: string;
    status: string;
    profile_picture_url?: string;
    created_at: string;
    rating?: number;
    location?: string;
    last_active?: string;
  };
  onEdit: () => void;
  onCall: () => void;
  onEmail: () => void;
  onMessage: () => void;
  isAdmin: boolean;
}

export function PromoterDetailsHeader({
  promoter,
  onEdit,
  onCall,
  onEmail,
  onMessage,
  isAdmin,
}: PromoterDetailsHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className='h-4 w-4' />;
      case 'inactive':
        return <XCircle className='h-4 w-4' />;
      case 'warning':
        return <AlertCircle className='h-4 w-4' />;
      case 'critical':
        return <AlertCircle className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Never';
    const date = new Date(lastActive);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <Card className='mb-6'>
      <CardContent className='p-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
          {/* Profile Section */}
          <div className='flex items-start gap-4'>
            <Avatar className='h-20 w-20'>
              <AvatarImage
                src={promoter.profile_picture_url}
                alt={promoter.name_en}
                className='object-cover'
              />
              <AvatarFallback className='text-lg font-semibold'>
                {promoter.name_en?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='text-2xl font-bold text-gray-900 truncate'>
                  {promoter.name_en}
                </h1>
                <Badge
                  variant='outline'
                  className={`${getStatusColor(promoter.status)} flex items-center gap-1`}
                >
                  {getStatusIcon(promoter.status)}
                  {promoter.status}
                </Badge>
              </div>

              {promoter.name_ar && (
                <p className='text-lg text-gray-600 mb-2' dir='rtl'>
                  {promoter.name_ar}
                </p>
              )}

              <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500'>
                {promoter.email && (
                  <div className='flex items-center gap-1'>
                    <Mail className='h-4 w-4' />
                    <span className='truncate max-w-[200px]'>
                      {promoter.email}
                    </span>
                  </div>
                )}
                {promoter.phone && (
                  <div className='flex items-center gap-1'>
                    <Phone className='h-4 w-4' />
                    <span>{promoter.phone}</span>
                  </div>
                )}
                {promoter.location && (
                  <div className='flex items-center gap-1'>
                    <MapPin className='h-4 w-4' />
                    <span className='truncate max-w-[150px]'>
                      {promoter.location}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className='flex flex-col sm:flex-row lg:flex-col gap-4'>
            <div className='grid grid-cols-2 gap-4 min-w-[200px]'>
              <div className='text-center'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <Star className='h-4 w-4 text-yellow-500' />
                  <span className='text-lg font-semibold'>
                    {promoter.rating ? promoter.rating.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <p className='text-xs text-gray-500'>Rating</p>
              </div>

              <div className='text-center'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <TrendingUp className='h-4 w-4 text-blue-500' />
                  <span className='text-lg font-semibold'>
                    {formatLastActive(promoter.last_active)}
                  </span>
                </div>
                <p className='text-xs text-gray-500'>Last Active</p>
              </div>
            </div>

            {/* Quick Actions */}
            {isAdmin && (
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={onEdit}
                  className='flex items-center gap-2'
                >
                  <Edit className='h-4 w-4' />
                  Edit
                </Button>

                {promoter.phone && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={onCall}
                    className='flex items-center gap-2'
                  >
                    <Phone className='h-4 w-4' />
                    Call
                  </Button>
                )}

                {promoter.email && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={onEmail}
                    className='flex items-center gap-2'
                  >
                    <Mail className='h-4 w-4' />
                    Email
                  </Button>
                )}

                <Button
                  variant='outline'
                  size='sm'
                  onClick={onMessage}
                  className='flex items-center gap-2'
                >
                  <MessageSquare className='h-4 w-4' />
                  Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
