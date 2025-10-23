import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  XCircle, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ContractStatus = 
  | 'draft' 
  | 'pending' 
  | 'approved' 
  | 'active' 
  | 'completed' 
  | 'terminated' 
  | 'expired'
  | 'rejected';

interface ContractStatusBadgeProps {
  status: ContractStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  draft: {
    label: 'Draft',
    variant: 'secondary' as const,
    icon: FileText,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  pending: {
    label: 'Pending',
    variant: 'default' as const,
    icon: Clock,
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  approved: {
    label: 'Approved',
    variant: 'default' as const,
    icon: CheckCircle2,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  active: {
    label: 'Active',
    variant: 'default' as const,
    icon: PlayCircle,
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  completed: {
    label: 'Completed',
    variant: 'default' as const,
    icon: CheckCircle,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  terminated: {
    label: 'Terminated',
    variant: 'destructive' as const,
    icon: XCircle,
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  expired: {
    label: 'Expired',
    variant: 'destructive' as const,
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive' as const,
    icon: X,
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

export function ContractStatusBadge({ 
  status, 
  className, 
  showIcon = true, 
  size = 'md' 
}: ContractStatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) {
    return (
      <Badge variant="secondary" className={className}>
        {status}
      </Badge>
    );
  }

  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {config.label}
    </Badge>
  );
}

// Helper function to get status color for charts or other UI elements
export function getStatusColor(status: ContractStatus): string {
  const config = statusConfig[status];
  if (!config) return '#6b7280'; // gray fallback
  
  const colorMap = {
    draft: '#6b7280', // gray
    pending: '#f97316', // orange
    approved: '#3b82f6', // blue
    active: '#22c55e', // green
    completed: '#10b981', // emerald
    terminated: '#ef4444', // red
    expired: '#ef4444', // red
    rejected: '#ef4444', // red
  };
  
  return colorMap[status] || '#6b7280';
}

// Helper function to get status description
export function getStatusDescription(status: ContractStatus): string {
  const descriptions = {
    draft: 'Contract is being prepared and not yet submitted',
    pending: 'Contract is awaiting admin review and approval',
    approved: 'Contract has been approved and is ready to start',
    active: 'Contract is currently active and in progress',
    completed: 'Contract has been completed successfully',
    terminated: 'Contract was terminated before completion',
    expired: 'Contract has reached its end date',
    rejected: 'Contract was rejected during review',
  };
  
  return descriptions[status] || 'Unknown status';
}

// Helper function to check if status allows editing
export function canEditContract(status: ContractStatus): boolean {
  return ['draft', 'pending'].includes(status);
}

// Helper function to check if status allows approval
export function canApproveContract(status: ContractStatus): boolean {
  return status === 'pending';
}

// Helper function to check if status is final
export function isFinalStatus(status: ContractStatus): boolean {
  return ['completed', 'terminated', 'expired', 'rejected'].includes(status);
}
