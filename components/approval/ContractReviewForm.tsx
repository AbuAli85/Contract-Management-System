'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Users,
  Calendar,
} from 'lucide-react';

interface Review {
  id: string;
  contract_number: string;
  job_title: string;
  contract_type: string;
  approval_status: string;
  submitted_for_review_at: string;
  current_reviewer_id: string;
  created_at: string;
  updated_at: string;
  days_pending: number;
  priority: 'high' | 'medium' | 'normal';
  is_overdue: boolean;
  first_party: { name_en: string; name_ar: string } | null;
  second_party: { name_en: string; name_ar: string } | null;
  promoter: { name_en: string; name_ar: string } | null;
}

interface ContractReviewFormProps {
  contract: Review;
  onClose: () => void;
  onComplete: () => void;
}

export function ContractReviewForm({
  contract,
  onClose,
  onComplete,
}: ContractReviewFormProps) {
  const [action, setAction] = useState<
    'approved' | 'rejected' | 'requested_changes' | null
  >(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!action) {
      setError('Please select an action');
      return;
    }

    if (action === 'rejected' && !comments.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/contracts/approval/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          comments: comments.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onComplete();
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'legal_review':
        return <FileText className='h-4 w-4' />;
      case 'hr_review':
        return <Users className='h-4 w-4' />;
      case 'final_approval':
        return <CheckCircle className='h-4 w-4' />;
      case 'signature':
        return <Calendar className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'legal_review':
        return 'bg-blue-100 text-blue-800';
      case 'hr_review':
        return 'bg-green-100 text-green-800';
      case 'final_approval':
        return 'bg-purple-100 text-purple-800';
      case 'signature':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'legal_review':
        return 'Legal Review';
      case 'hr_review':
        return 'HR Review';
      case 'final_approval':
        return 'Final Approval';
      case 'signature':
        return 'Signature';
      default:
        return status;
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
      <Card className='max-h-[90vh] w-full max-w-2xl overflow-y-auto'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                {getStatusIcon(contract.approval_status)}
                Review Contract: {contract.contract_number}
              </CardTitle>
              <CardDescription>
                {contract.job_title} • {contract.contract_type}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(contract.approval_status)}>
              {getStatusLabel(contract.approval_status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Contract Details */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Client
              </p>
              <p className='text-sm'>
                {contract.first_party?.name_en || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Employer
              </p>
              <p className='text-sm'>
                {contract.second_party?.name_en || 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Employee
              </p>
              <p className='text-sm'>{contract.promoter?.name_en || 'N/A'}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Days Pending
              </p>
              <p className='text-sm'>
                {contract.days_pending} day
                {contract.days_pending !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Separator />

          {/* Review Actions */}
          <div>
            <h3 className='mb-3 text-lg font-medium'>Review Decision</h3>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <Button
                variant={action === 'approved' ? 'default' : 'outline'}
                onClick={() => setAction('approved')}
                className='flex items-center gap-2'
              >
                <CheckCircle className='h-4 w-4' />
                Approve
              </Button>
              <Button
                variant={action === 'requested_changes' ? 'default' : 'outline'}
                onClick={() => setAction('requested_changes')}
                className='flex items-center gap-2'
              >
                <MessageSquare className='h-4 w-4' />
                Request Changes
              </Button>
              <Button
                variant={action === 'rejected' ? 'destructive' : 'outline'}
                onClick={() => setAction('rejected')}
                className='flex items-center gap-2'
              >
                <XCircle className='h-4 w-4' />
                Reject
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className='text-sm font-medium'>Comments</label>
            <Textarea
              placeholder={
                action === 'approved'
                  ? 'Add any comments or notes (optional)'
                  : action === 'requested_changes'
                    ? 'Describe the changes needed'
                    : 'Provide reason for rejection'
              }
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={4}
              className='mt-2'
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className='flex items-center justify-end gap-3'>
            <Button variant='outline' onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !action}
              className='flex items-center gap-2'
            >
              {loading && <Loader2 className='h-4 w-4 animate-spin' />}
              Submit Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
