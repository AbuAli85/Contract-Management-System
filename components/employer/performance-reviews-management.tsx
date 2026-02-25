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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Star,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
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
  employer_employee?: {
    job_title: string | null;
    department: string | null;
    employee?: {
      id: string;
      full_name: string | null;
      email: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

interface TeamMember {
  id: string;
  employee_id: string;
  job_title: string | null;
  department: string | null;
  employee: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const reviewTypeLabels: Record<string, string> = {
  probation: 'Probation',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
  ad_hoc: 'Ad-hoc',
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-600',
    bg: 'bg-gray-100 dark:bg-gray-900/30',
  },
  submitted: {
    label: 'Submitted',
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  acknowledged: {
    label: 'Acknowledged',
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
};

function RatingStars({
  rating,
  max = 5,
}: {
  rating: number | null;
  max?: number;
}) {
  if (rating === null) return <span className='text-gray-400'>Not rated</span>;

  return (
    <div className='flex items-center gap-1'>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
          )}
        />
      ))}
      <span className='ml-2 text-sm font-medium'>{rating.toFixed(1)}</span>
    </div>
  );
}

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <Label>{label}</Label>
        <div className='flex items-center gap-1'>
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type='button'
              onClick={() => onChange(i + 1)}
              className='focus:outline-none'
            >
              <Star
                className={cn(
                  'h-5 w-5 transition-colors',
                  i < value
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-300 hover:text-amber-200'
                )}
              />
            </button>
          ))}
          <span className='ml-2 text-sm font-medium w-8'>{value}/5</span>
        </div>
      </div>
    </div>
  );
}

export function PerformanceReviewsManagement() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({
    draft: 0,
    submitted: 0,
    acknowledged: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employer_employee_id: '',
    review_period_start: '',
    review_period_end: '',
    review_type: 'annual',
    overall_rating: 3,
    performance_rating: 3,
    attendance_rating: 3,
    teamwork_rating: 3,
    communication_rating: 3,
    initiative_rating: 3,
    strengths: '',
    areas_for_improvement: '',
    goals_for_next_period: '',
    manager_comments: '',
    status: 'draft',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
    fetchTeamMembers();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/employer/performance-reviews');
      const data = await response.json();

      if (response.ok && data.success) {
        setReviews(data.reviews || []);
        setStats(
          data.stats || {
            draft: 0,
            submitted: 0,
            acknowledged: 0,
            completed: 0,
          }
        );
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/employer/team');
      const data = await response.json();

      if (response.ok && data.team) {
        setTeamMembers(
          data.team.filter((m: any) => m.employment_status === 'active')
        );
      }
    } catch (error) {
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/employer/performance-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '✅ Review Created',
        description:
          formData.status === 'submitted'
            ? 'Employee has been notified'
            : 'Saved as draft',
      });

      setDialogOpen(false);
      resetForm();
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

  const resetForm = () => {
    setFormData({
      employer_employee_id: '',
      review_period_start: '',
      review_period_end: '',
      review_type: 'annual',
      overall_rating: 3,
      performance_rating: 3,
      attendance_rating: 3,
      teamwork_rating: 3,
      communication_rating: 3,
      initiative_rating: 3,
      strengths: '',
      areas_for_improvement: '',
      goals_for_next_period: '',
      manager_comments: '',
      status: 'draft',
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAverageRating = (review: PerformanceReview) => {
    const ratings = [
      review.performance_rating,
      review.attendance_rating,
      review.teamwork_rating,
      review.communication_rating,
      review.initiative_rating,
    ].filter((r): r is number => r !== null);

    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold flex items-center gap-2'>
            <Star className='h-6 w-6 text-amber-500' />
            Performance Reviews
          </h2>
          <p className='text-gray-500'>
            Manage employee performance evaluations
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={open => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className='h-4 w-4 mr-2' />
              New Review
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Create Performance Review</DialogTitle>
              <DialogDescription>
                Create a new performance evaluation for a team member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Employee Selection */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Employee</Label>
                  <Select
                    value={formData.employer_employee_id}
                    onValueChange={v =>
                      setFormData(prev => ({
                        ...prev,
                        employer_employee_id: v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select employee' />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.employee?.full_name || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>Review Type</Label>
                  <Select
                    value={formData.review_type}
                    onValueChange={v =>
                      setFormData(prev => ({ ...prev, review_type: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(reviewTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Review Period */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Period Start</Label>
                  <Input
                    type='date'
                    value={formData.review_period_start}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        review_period_start: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Period End</Label>
                  <Input
                    type='date'
                    value={formData.review_period_end}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        review_period_end: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Ratings */}
              <div className='space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg'>
                <h4 className='font-medium'>Performance Ratings</h4>
                <RatingInput
                  label='Overall Performance'
                  value={formData.overall_rating}
                  onChange={v =>
                    setFormData(prev => ({ ...prev, overall_rating: v }))
                  }
                />
                <RatingInput
                  label='Job Performance'
                  value={formData.performance_rating}
                  onChange={v =>
                    setFormData(prev => ({ ...prev, performance_rating: v }))
                  }
                />
                <RatingInput
                  label='Attendance & Punctuality'
                  value={formData.attendance_rating}
                  onChange={v =>
                    setFormData(prev => ({ ...prev, attendance_rating: v }))
                  }
                />
                <RatingInput
                  label='Teamwork'
                  value={formData.teamwork_rating}
                  onChange={v =>
                    setFormData(prev => ({ ...prev, teamwork_rating: v }))
                  }
                />
                <RatingInput
                  label='Communication'
                  value={formData.communication_rating}
                  onChange={v =>
                    setFormData(prev => ({ ...prev, communication_rating: v }))
                  }
                />
                <RatingInput
                  label='Initiative'
                  value={formData.initiative_rating}
                  onChange={v =>
                    setFormData(prev => ({ ...prev, initiative_rating: v }))
                  }
                />
              </div>

              {/* Feedback */}
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Strengths</Label>
                  <Textarea
                    placeholder='Key strengths and achievements...'
                    value={formData.strengths}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        strengths: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Areas for Improvement</Label>
                  <Textarea
                    placeholder='Areas that need development...'
                    value={formData.areas_for_improvement}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        areas_for_improvement: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Goals for Next Period</Label>
                  <Textarea
                    placeholder='Objectives and goals...'
                    value={formData.goals_for_next_period}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        goals_for_next_period: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Manager Comments</Label>
                  <Textarea
                    placeholder='Additional comments...'
                    value={formData.manager_comments}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        manager_comments: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  variant='secondary'
                  disabled={submitting}
                  onClick={() =>
                    setFormData(prev => ({ ...prev, status: 'draft' }))
                  }
                >
                  Save Draft
                </Button>
                <Button
                  type='submit'
                  disabled={submitting}
                  onClick={() =>
                    setFormData(prev => ({ ...prev, status: 'submitted' }))
                  }
                >
                  {submitting && (
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  )}
                  Submit & Notify
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Drafts</p>
                <p className='text-3xl font-bold text-gray-600'>
                  {stats.draft}
                </p>
              </div>
              <FileText className='h-8 w-8 text-gray-400 opacity-50' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Submitted</p>
                <p className='text-3xl font-bold text-blue-600'>
                  {stats.submitted}
                </p>
              </div>
              <Clock className='h-8 w-8 text-blue-400 opacity-50' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Acknowledged</p>
                <p className='text-3xl font-bold text-amber-600'>
                  {stats.acknowledged}
                </p>
              </div>
              <Users className='h-8 w-8 text-amber-400 opacity-50' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Completed</p>
                <p className='text-3xl font-bold text-green-600'>
                  {stats.completed}
                </p>
              </div>
              <CheckCircle2 className='h-8 w-8 text-green-400 opacity-50' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Star className='h-5 w-5' />
            Review History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {reviews.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <Star className='h-12 w-12 mx-auto mb-2 opacity-30' />
                <p>No performance reviews yet</p>
              </div>
            ) : (
              reviews.map(review => {
                const employee = review.employer_employee?.employee;
                const statusCfg =
                  statusConfig[review.status] ?? statusConfig.draft;
                const avgRating = calculateAverageRating(review);
                const isExpanded = expandedReview === review.id;

                return (
                  <div
                    key={review.id}
                    className='border rounded-xl overflow-hidden'
                  >
                    <button
                      onClick={() =>
                        setExpandedReview(isExpanded ? null : review.id)
                      }
                      className='w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors'
                    >
                      <div className='flex items-center gap-4'>
                        <Avatar className='h-12 w-12'>
                          <AvatarImage
                            src={employee?.avatar_url || undefined}
                          />
                          <AvatarFallback>
                            {getInitials(employee?.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <h4 className='font-medium'>
                              {employee?.full_name || 'Unknown'}
                            </h4>
                            <Badge variant='outline'>
                              {reviewTypeLabels[review.review_type] ||
                                review.review_type}
                            </Badge>
                            <Badge
                              className={cn(
                                statusCfg.bg,
                                statusCfg.color,
                                'border-0'
                              )}
                            >
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className='text-sm text-gray-500 mt-1'>
                            {format(
                              new Date(review.review_period_start),
                              'MMM d, yyyy'
                            )}{' '}
                            -{' '}
                            {format(
                              new Date(review.review_period_end),
                              'MMM d, yyyy'
                            )}
                          </p>
                        </div>

                        <div className='flex items-center gap-4'>
                          {avgRating !== null && (
                            <div className='text-right'>
                              <p className='text-sm text-gray-500'>
                                Avg Rating
                              </p>
                              <RatingStars rating={avgRating} />
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
                      <div className='p-4 border-t bg-gray-50 dark:bg-gray-900/30 space-y-4'>
                        {/* Ratings Grid */}
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                          <div>
                            <p className='text-sm text-gray-500'>Overall</p>
                            <RatingStars rating={review.overall_rating} />
                          </div>
                          <div>
                            <p className='text-sm text-gray-500'>Performance</p>
                            <RatingStars rating={review.performance_rating} />
                          </div>
                          <div>
                            <p className='text-sm text-gray-500'>Attendance</p>
                            <RatingStars rating={review.attendance_rating} />
                          </div>
                          <div>
                            <p className='text-sm text-gray-500'>Teamwork</p>
                            <RatingStars rating={review.teamwork_rating} />
                          </div>
                          <div>
                            <p className='text-sm text-gray-500'>
                              Communication
                            </p>
                            <RatingStars rating={review.communication_rating} />
                          </div>
                          <div>
                            <p className='text-sm text-gray-500'>Initiative</p>
                            <RatingStars rating={review.initiative_rating} />
                          </div>
                        </div>

                        {/* Feedback Sections */}
                        {review.strengths && (
                          <div>
                            <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                              Strengths
                            </p>
                            <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                              {review.strengths}
                            </p>
                          </div>
                        )}
                        {review.areas_for_improvement && (
                          <div>
                            <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                              Areas for Improvement
                            </p>
                            <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                              {review.areas_for_improvement}
                            </p>
                          </div>
                        )}
                        {review.goals_for_next_period && (
                          <div>
                            <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                              Goals for Next Period
                            </p>
                            <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                              {review.goals_for_next_period}
                            </p>
                          </div>
                        )}
                        {review.manager_comments && (
                          <div>
                            <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                              Manager Comments
                            </p>
                            <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                              {review.manager_comments}
                            </p>
                          </div>
                        )}
                        {review.employee_comments && (
                          <div>
                            <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                              Employee Comments
                            </p>
                            <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                              {review.employee_comments}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
