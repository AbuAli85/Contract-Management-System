'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  MoreVertical,
  Edit,
  Eye,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardPromoter } from './types';
import { PartyAssignmentDialog } from './party-assignment-dialog';

interface SafeImageProps {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback?: React.ReactNode;
}

function SafeImage({ src, alt, width, height, className, fallback }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={cn("flex items-center justify-center bg-slate-100 rounded-full", className)}>
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn("rounded-full object-cover", className)}
      onError={() => setHasError(true)}
    />
  );
}

function InfoLine({ icon: Icon, text }: { icon: React.ComponentType<any>; text: string }) {
  if (!text || text === '—') return null;
  
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/80 flex-shrink-0" />
      <span className="text-sm truncate">{text}</span>
    </div>
  );
}

function DocumentStatusPill({
  label,
  health,
}: {
  label: string;
  health: { status: 'valid' | 'expiring' | 'expired' | 'missing' | 'warning' | 'critical' | 'good'; label: string };
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
      case 'good': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'expiring':
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'expired':
      case 'missing':
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
          getStatusColor(health.status)
        )}
      >
        {health.label}
      </span>
    </div>
  );
}

interface EnhancedPromoterCardProps {
  promoter: DashboardPromoter;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onPartyAssignmentUpdate?: (promoterId: string, partyId: string | null) => void;
}

export function EnhancedPromoterCardWithPartyEdit({
  promoter,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onPartyAssignmentUpdate,
}: EnhancedPromoterCardProps) {
  const [showPartyDialog, setShowPartyDialog] = useState(false);

  const handlePartyAssignmentUpdate = (promoterId: string, partyId: string | null) => {
    onPartyAssignmentUpdate?.(promoterId, partyId);
    setShowPartyDialog(false);
  };

  const getOverallStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'active':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      default:
        return <UserCheck className="h-4 w-4 text-slate-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'active': return 'default';
      default: return 'outline';
    }
  };

  return (
    <>
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer',
          promoter.overallStatus === 'critical' &&
            'border-l-4 border-l-red-500 bg-red-50/10',
          promoter.overallStatus === 'warning' &&
            'border-l-4 border-l-amber-400 bg-amber-50/10',
          isSelected && 'ring-2 ring-primary bg-primary/5'
        )}
        onClick={() => onView()}
      >
        <CardHeader className="pb-3 border-b">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
              className="mt-1"
            />
            
            <SafeImage
              src={promoter.profile_picture_url ?? null}
              alt={promoter.displayName}
              width={48}
              height={48}
              className="h-12 w-12 transition-transform group-hover:scale-105"
              fallback={
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Users className="h-6 w-6" />
                </div>
              }
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base leading-tight truncate">
                    {promoter.displayName}
                  </h3>
                  {promoter.name_ar && promoter.name_ar !== promoter.name_en && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {promoter.name_ar}
                    </p>
                  )}
                  {promoter.id_card_number && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      ID: {promoter.id_card_number}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {getOverallStatusIcon(promoter.overallStatus)}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onView()}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onEdit()}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setShowPartyDialog(true)}
                        className="text-blue-600"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Manage Party Assignment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={getStatusBadgeVariant(promoter.overallStatus)}
                  className="text-xs"
                >
                  {promoter.overallStatus?.charAt(0).toUpperCase() + promoter.overallStatus?.slice(1)}
                </Badge>
                {promoter.job_title && (
                  <Badge variant="outline" className="text-xs">
                    {promoter.job_title}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Documents Status */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Document Status</span>
            <div className="space-y-1.5">
              <DocumentStatusPill
                label="ID Card"
                health={promoter.idDocument}
              />
              <DocumentStatusPill
                label="Passport"
                health={promoter.passportDocument}
              />
            </div>
          </div>

          {/* Assignment - Enhanced with Party Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Assignment</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPartyDialog(true);
                }}
              >
                <Settings className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground/80 flex-shrink-0" />
              <span className="text-sm truncate">
                {promoter.assignmentStatus === 'assigned'
                  ? promoter.organisationLabel
                  : 'Unassigned'}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'ml-auto rounded-full border px-2 py-0.5 text-xs font-medium flex-shrink-0',
                  promoter.assignmentStatus === 'assigned'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                )}
              >
                {promoter.assignmentStatus === 'assigned' ? '✓' : '○'}
              </Badge>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Contact</span>
            <div className="space-y-1.5">
              <InfoLine icon={Mail} text={promoter.contactEmail} />
              <InfoLine icon={Phone} text={promoter.contactPhone} />
              {promoter.work_location && (
                <InfoLine icon={MapPin} text={promoter.work_location} />
              )}
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">Created</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {promoter.createdLabel}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Party Assignment Dialog */}
      <PartyAssignmentDialog
        isOpen={showPartyDialog}
        onClose={() => setShowPartyDialog(false)}
        promoter={promoter}
        onAssignmentUpdate={handlePartyAssignmentUpdate}
      />
    </>
  );
}

// Enhanced Cards View component that uses the new card with party edit functionality
interface EnhancedPromotersCardsViewProps {
  promoters: DashboardPromoter[];
  selectedPromoters: Set<string>;
  onSelectPromoter: (id: string) => void;
  onViewPromoter: (promoter: DashboardPromoter) => void;
  onEditPromoter: (promoter: DashboardPromoter) => void;
  onPartyAssignmentUpdate?: (promoterId: string, partyId: string | null) => void;
}

export function EnhancedPromotersCardsViewWithPartyEdit({
  promoters,
  selectedPromoters,
  onSelectPromoter,
  onViewPromoter,
  onEditPromoter,
  onPartyAssignmentUpdate,
}: EnhancedPromotersCardsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      {promoters.map((promoter, index) => (
        <div
          key={promoter.id}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{
            animationDelay: `${index * 40}ms`,
            animationDuration: '400ms',
            animationFillMode: 'backwards',
          }}
        >
          <EnhancedPromoterCardWithPartyEdit
            promoter={promoter}
            isSelected={selectedPromoters.has(promoter.id)}
            onSelect={() => onSelectPromoter(promoter.id)}
            onView={() => onViewPromoter(promoter)}
            onEdit={() => onEditPromoter(promoter)}
            {...(onPartyAssignmentUpdate && { onPartyAssignmentUpdate })}
          />
        </div>
      ))}
    </div>
  );
}
