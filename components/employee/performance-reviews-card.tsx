'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Award,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PerformanceReview {
  id: string;
  review_period_start: string;
  review_period_end: string;
  review_type: string;
  overall_rating: number | null;
  performance_rating: number | null;
  attendance_rating: number | null;
  teamwork_rating: number | null;
  communication_rating: number | null;
  initiative_rating: number | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  goals_for_next_period: string | null;
  manager_comments: string | null;
  employee_comments: string | null;
  status: string;
  created_at: string;
  reviewer?: {
    full_name: string | null;
  } | null;
}

const reviewTypeLabels: Record<string, string> = {
  probation: 'Probation Review',
  quarterly: 'Quarterly Review',
  semi_annual: 'Semi-Annual Review',
  annual: 'Annual Review',
  ad_hoc: 'Ad-hoc Review',
};

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: { label: 'Pending', color: 'bg-gray-100 text-gray-600', icon: Clock },
  submitted: {
    label: 'For Review',
    color: 'bg-blue-100 text-blue-600',
    icon: MessageSquare,
  },
  acknowledged: {
    label: 'Acknowledged',
    color: 'bg-amber-100 text-amber-600',
    icon: CheckCircle2,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-600',
    icon: CheckCircle2,
  },
};

function RatingStars({
  rating,
  size = 'sm',
}: {
  rating: number | null;
  size?: 'sm' | 'lg';
}) {
  if (rating === null)
    return <span className='text-gray-400 text-sm'>N/A</span>;

  const starSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div className='flex items-center gap-0.5'>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            starSize,
            i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
}

interface PerformanceReviewsCardProps {
  employerEmployeeId: string;
}

export function PerformanceReviewsCard({
  employerEmployeeId,
}: PerformanceReviewsCardProps) {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] =
    useState<PerformanceReview | null>(null);
  const [employeeComments, setEmployeeComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [employerEmployeeId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/employee/performance-reviews');
      const data = await response.json();

      if (response.ok && data.success) {
        setReviews(data.reviews || []);
        // Auto-expand first pending review
        const pendingReview = data.reviews?.find(
          (r: PerformanceReview) => r.status === 'submitted'
        );
        if (pendingReview) {
          setExpandedReview(pendingReview.id);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedReview) return;
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/employee/performance-reviews/${selectedReview.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'acknowledged',
            employee_comments: employeeComments,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '✅ Review Acknowledged',
        description: 'Your feedback has been submitted',
      });

      setAcknowledgeDialogOpen(false);
      setSelectedReview(null);
      setEmployeeComments('');
      fetchReviews();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getAverageRating = (review: PerformanceReview) => {
    const ratings = [
      review.overall_rating,
      review.performance_rating,
      review.attendance_rating,
      review.teamwork_rating,
      review.communication_rating,
      review.initiative_rating,
    ].filter((r): r is number => r !== null);

    if (ratings.length === 0) return null;
    return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
  };

  const pendingCount = reviews.filter(r => r.status === 'submitted').length;

  if (loading) {
    return (
      <Card className='border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30'>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-amber-600' />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30'>
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg'>
                <Award className='h-6 w-6 text-white' />
              </div>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  Performance Reviews
                  {pendingCount > 0 && (
                    <Badge className='bg-blue-500 text-white'>
                      {pendingCount} pending
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Your performance evaluations</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {reviews.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <Star className='h-12 w-12 mx-auto mb-2 opacity-30' />
              <p>No performance reviews yet</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {reviews.map(review => {
                const statusCfg =
                  statusConfig[review.status] ?? statusConfig.draft;
                const StatusIcon = statusCfg.icon;
                const isExpanded = expandedReview === review.id;
                const avgRating = getAverageRating(review);

                return (
                  <div
                    key={review.id}
                    className={cn(
                      'border rounded-xl overflow-hidden transition-all bg-white dark:bg-gray-900',
                      review.status === 'submitted' &&
                        'ring-2 ring-blue-400 ring-offset-2'
                    )}
                  >
                    <button
                      onClick={() =>
                        setExpandedReview(isExpanded ? null : review.id)
                      }
                      className='w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <h4 className='font-semibold'>
                              {reviewTypeLabels[review.review_type] ||
                                review.review_type}
                            </h4>
                            <Badge
                              className={cn(statusCfg.color, 'border-0 gap-1')}
                            >
                              <StatusIcon className='h-3 w-3' />
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className='text-sm text-gray-500 mt-1'>
                            {format(
                              new Date(review.review_period_start),
                              'MMM d'
                            )}{' '}
                            -{' '}
                            {format(
                              new Date(review.review_period_end),
                              'MMM d, yyyy'
                            )}
                          </p>
                        </div>
                        <div className='flex items-center gap-3'>
                          {avgRating && (
                            <div className='text-right'>
                              <div className='text-2xl font-bold text-amber-600'>
                                {avgRating}
                              </div>
                              <RatingStars
                                rating={Math.round(parseFloat(avgRating))}
                              />
                            </div>
                          )}
                          {isExpanded ? (
                            <ChevronUp className='h-5 w-5 text-gray-400' />
                          ) : (
                            <ChevronDown className='h-5 w-5 text-gray-400' />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className='p-4 border-t bg-gray-50 dark:bg-gray-900/50 space-y-4'>
                        {/* Detailed Ratings */}
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                          <div className='space-y-1'>
                            <p className='text-xs text-gray-500 uppercase tracking-wide'>
                              Overall
                            </p>
                            <RatingStars
                              rating={review.overall_rating}
                              size='lg'
                            />
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-gray-500 uppercase tracking-wide'>
                              Performance
                            </p>
                            <RatingStars
                              rating={review.performance_rating}
                              size='lg'
                            />
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-gray-500 uppercase tracking-wide'>
                              Attendance
                            </p>
                            <RatingStars
                              rating={review.attendance_rating}
                              size='lg'
                            />
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-gray-500 uppercase tracking-wide'>
                              Teamwork
                            </p>
                            <RatingStars
                              rating={review.teamwork_rating}
                              size='lg'
                            />
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-gray-500 uppercase tracking-wide'>
                              Communication
                            </p>
                            <RatingStars
                              rating={review.communication_rating}
                              size='lg'
                            />
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-gray-500 uppercase tracking-wide'>
                              Initiative
                            </p>
                            <RatingStars
                              rating={review.initiative_rating}
                              size='lg'
                            />
                          </div>
                        </div>

                        {/* Feedback */}
                        <div className='space-y-3'>
                          {review.strengths && (
                            <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                              <p className='text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide mb-1'>
                                Strengths
                              </p>
                              <p className='text-sm text-gray-700 dark:text-gray-300'>
                                {review.strengths}
                              </p>
                            </div>
                          )}
                          {review.areas_for_improvement && (
                            <div className='p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg'>
                              <p className='text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide mb-1'>
                                Areas for Improvement
                              </p>
                              <p className='text-sm text-gray-700 dark:text-gray-300'>
                                {review.areas_for_improvement}
                              </p>
                            </div>
                          )}
                          {review.goals_for_next_period && (
                            <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                              <p className='text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide mb-1'>
                                Goals for Next Period
                              </p>
                              <p className='text-sm text-gray-700 dark:text-gray-300'>
                                {review.goals_for_next_period}
                              </p>
                            </div>
                          )}
                          {review.manager_comments && (
                            <div className='p-3 bg-gray-100 dark:bg-gray-800 rounded-lg'>
                              <p className='text-xs text-gray-500 font-medium uppercase tracking-wide mb-1'>
                                Manager Comments
                              </p>
                              <p className='text-sm text-gray-700 dark:text-gray-300'>
                                {review.manager_comments}
                              </p>
                            </div>
                          )}
                          {review.employee_comments && (
                            <div className='p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
                              <p className='text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide mb-1'>
                                Your Comments
                              </p>
                              <p className='text-sm text-gray-700 dark:text-gray-300'>
                                {review.employee_comments}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Acknowledge Button */}
                        {review.status === 'submitted' && (
                          <Button
                            className='w-full'
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedReview(review);
                              setAcknowledgeDialogOpen(true);
                            }}
                          >
                            <MessageSquare className='h-4 w-4 mr-2' />
                            Acknowledge & Add Comments
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acknowledge Dialog */}
      <Dialog
        open={acknowledgeDialogOpen}
        onOpenChange={setAcknowledgeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Review</DialogTitle>
            <DialogDescription>
              Add your comments and acknowledge this performance review
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <Textarea
              placeholder='Optional: Add your comments or feedback...'
              value={employeeComments}
              onChange={e => setEmployeeComments(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setAcknowledgeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAcknowledge} disabled={submitting}>
              {submitting && <Loader2 className='h-4 w-4 animate-spin mr-2' />}
              Acknowledge Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
