'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Trophy,
  Star,
  Award,
  TrendingUp,
  Target,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Crown,
  Medal,
  Zap,
  Heart,
  Shield,
  Users,
  BarChart3,
} from 'lucide-react';
import { PromoterScore, PromoterBadge, PromoterFeedback } from '@/lib/types';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface PromoterRankingProps {
  promoterId: string;
  isAdmin: boolean;
}

export function PromoterRanking({ promoterId, isAdmin }: PromoterRankingProps) {
  const [activeTab, setActiveTab] = useState('scores');
  const [scores, setScores] = useState<PromoterScore[]>([]);
  const [badges, setBadges] = useState<PromoterBadge[]>([]);
  const [feedback, setFeedback] = useState<PromoterFeedback[]>([]);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [isBadgeDialogOpen, setIsBadgeDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Score form
  const [scoreForm, setScoreForm] = useState({
    score_type: '',
    score_value: 0,
    max_score: 100,
    period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  // Badge form
  const [badgeForm, setBadgeForm] = useState({
    badge_type: '',
    badge_name: '',
    badge_description: '',
    badge_icon: '',
    is_active: true,
  });

  // Feedback form
  const [feedbackForm, setFeedbackForm] = useState({
    feedback_type: '',
    rating: 5,
    feedback_text: '',
    strengths: [] as string[],
    areas_for_improvement: [] as string[],
    is_anonymous: false,
  });

  // Fetch data
  useEffect(() => {
    fetchScores();
    fetchBadges();
    fetchFeedback();
  }, [promoterId]);

  const fetchScores = async () => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/scores`);
      if (response.ok) {
        const data = await response.json();
        setScores(data);
      }
    } catch (error) {
    }
  };

  const fetchBadges = async () => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/badges`);
      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      }
    } catch (error) {
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/feedback`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      }
    } catch (error) {
    }
  };

  // Score handlers
  const handleScoreSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/scores`;
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { id: editingItem.id, ...scoreForm }
        : scoreForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const newScore = await response.json();
        if (editingItem) {
          setScores(scores.map(s => (s.id === editingItem.id ? newScore : s)));
        } else {
          setScores([...scores, newScore]);
        }
        setScoreForm({
          score_type: '',
          score_value: 0,
          max_score: 100,
          period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
          period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        });
        setEditingItem(null);
        setIsScoreDialogOpen(false);
        toast.success(
          editingItem
            ? 'Score updated successfully'
            : 'Score added successfully'
        );
      }
    } catch (error) {
      toast.error('Failed to save score');
    }
  };

  const handleScoreDelete = async (scoreId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/scores`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scoreId }),
      });

      if (response.ok) {
        setScores(scores.filter(s => s.id !== scoreId));
        toast.success('Score deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete score');
    }
  };

  // Badge handlers
  const handleBadgeSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/badges`;
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { id: editingItem.id, ...badgeForm }
        : badgeForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const newBadge = await response.json();
        if (editingItem) {
          setBadges(badges.map(b => (b.id === editingItem.id ? newBadge : b)));
        } else {
          setBadges([...badges, newBadge]);
        }
        setBadgeForm({
          badge_type: '',
          badge_name: '',
          badge_description: '',
          badge_icon: '',
          is_active: true,
        });
        setEditingItem(null);
        setIsBadgeDialogOpen(false);
        toast.success(
          editingItem
            ? 'Badge updated successfully'
            : 'Badge added successfully'
        );
      }
    } catch (error) {
      toast.error('Failed to save badge');
    }
  };

  const handleBadgeDelete = async (badgeId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/badges`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: badgeId }),
      });

      if (response.ok) {
        setBadges(badges.filter(b => b.id !== badgeId));
        toast.success('Badge deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete badge');
    }
  };

  // Feedback handlers
  const handleFeedbackSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/feedback`;
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { id: editingItem.id, ...feedbackForm }
        : feedbackForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const newFeedback = await response.json();
        if (editingItem) {
          setFeedback(
            feedback.map(f => (f.id === editingItem.id ? newFeedback : f))
          );
        } else {
          setFeedback([...feedback, newFeedback]);
        }
        setFeedbackForm({
          feedback_type: '',
          rating: 5,
          feedback_text: '',
          strengths: [],
          areas_for_improvement: [],
          is_anonymous: false,
        });
        setEditingItem(null);
        setIsFeedbackDialogOpen(false);
        toast.success(
          editingItem
            ? 'Feedback updated successfully'
            : 'Feedback added successfully'
        );
      }
    } catch (error) {
      toast.error('Failed to save feedback');
    }
  };

  const handleFeedbackDelete = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/feedback`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feedbackId }),
      });

      if (response.ok) {
        setFeedback(feedback.filter(f => f.id !== feedbackId));
        toast.success('Feedback deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete feedback');
    }
  };

  const openEditDialog = (item: any, type: string) => {
    setEditingItem(item);
    if (type === 'score') {
      setScoreForm({
        score_type: item.score_type,
        score_value: item.score_value,
        max_score: item.max_score || 100,
        period_start: item.period_start,
        period_end: item.period_end,
      });
      setIsScoreDialogOpen(true);
    } else if (type === 'badge') {
      setBadgeForm({
        badge_type: item.badge_type,
        badge_name: item.badge_name,
        badge_description: item.badge_description || '',
        badge_icon: item.badge_icon || '',
        is_active: item.is_active,
      });
      setIsBadgeDialogOpen(true);
    } else if (type === 'feedback') {
      setFeedbackForm({
        feedback_type: item.feedback_type,
        rating: item.rating || 5,
        feedback_text: item.feedback_text || '',
        strengths: item.strengths || [],
        areas_for_improvement: item.areas_for_improvement || [],
        is_anonymous: item.is_anonymous,
      });
      setIsFeedbackDialogOpen(true);
    }
  };

  // Helper functions
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (scoreType: string) => {
    switch (scoreType) {
      case 'overall':
        return <Trophy className='h-4 w-4' />;
      case 'attendance':
        return <Target className='h-4 w-4' />;
      case 'performance':
        return <TrendingUp className='h-4 w-4' />;
      case 'quality':
        return <Star className='h-4 w-4' />;
      default:
        return <BarChart3 className='h-4 w-4' />;
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'attendance_streak':
        return <Target className='h-4 w-4' />;
      case 'performance_excellence':
        return <Trophy className='h-4 w-4' />;
      case 'team_player':
        return <Users className='h-4 w-4' />;
      case 'quality_champion':
        return <Star className='h-4 w-4' />;
      case 'innovation':
        return <Zap className='h-4 w-4' />;
      case 'leadership':
        return <Crown className='h-4 w-4' />;
      default:
        return <Award className='h-4 w-4' />;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  // Chart data
  const scoreData = scores.map(score => ({
    name: score.score_type.replace('_', ' '),
    score: score.score_value,
    max: score.max_score || 100,
  }));

  const feedbackData = [
    {
      name: '5 Stars',
      value: feedback.filter(f => f.rating === 5).length,
      color: '#10b981',
    },
    {
      name: '4 Stars',
      value: feedback.filter(f => f.rating === 4).length,
      color: '#3b82f6',
    },
    {
      name: '3 Stars',
      value: feedback.filter(f => f.rating === 3).length,
      color: '#f59e0b',
    },
    {
      name: '2 Stars',
      value: feedback.filter(f => f.rating === 2).length,
      color: '#ef4444',
    },
    {
      name: '1 Star',
      value: feedback.filter(f => f.rating === 1).length,
      color: '#dc2626',
    },
  ];

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p className='text-center text-muted-foreground'>
            Ranking management is restricted to administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='scores'>Scores</TabsTrigger>
          <TabsTrigger value='badges'>Badges</TabsTrigger>
          <TabsTrigger value='feedback'>Feedback</TabsTrigger>
          <TabsTrigger value='leaderboards'>Leaderboards</TabsTrigger>
        </TabsList>

        {/* Scores Tab */}
        <TabsContent value='scores' className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Performance Scores</h3>
            <Dialog
              open={isScoreDialogOpen}
              onOpenChange={setIsScoreDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Score
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Score' : 'Add Score'}
                  </DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='score-type'>Score Type</Label>
                    <Select
                      value={scoreForm.score_type}
                      onValueChange={value =>
                        setScoreForm({ ...scoreForm, score_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select score type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='overall'>Overall</SelectItem>
                        <SelectItem value='attendance'>Attendance</SelectItem>
                        <SelectItem value='performance'>Performance</SelectItem>
                        <SelectItem value='quality'>Quality</SelectItem>
                        <SelectItem value='teamwork'>Teamwork</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='score-value'>Score Value</Label>
                      <Input
                        id='score-value'
                        type='number'
                        min='0'
                        max='100'
                        value={scoreForm.score_value}
                        onChange={e =>
                          setScoreForm({
                            ...scoreForm,
                            score_value: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor='max-score'>Max Score</Label>
                      <Input
                        id='max-score'
                        type='number'
                        min='0'
                        max='1000'
                        value={scoreForm.max_score}
                        onChange={e =>
                          setScoreForm({
                            ...scoreForm,
                            max_score: parseInt(e.target.value) || 100,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='period-start'>Period Start</Label>
                      <Input
                        id='period-start'
                        type='date'
                        value={scoreForm.period_start}
                        onChange={e =>
                          setScoreForm({
                            ...scoreForm,
                            period_start: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor='period-end'>Period End</Label>
                      <Input
                        id='period-end'
                        type='date'
                        value={scoreForm.period_end}
                        onChange={e =>
                          setScoreForm({
                            ...scoreForm,
                            period_end: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsScoreDialogOpen(false);
                      setEditingItem(null);
                      setScoreForm({
                        score_type: '',
                        score_value: 0,
                        max_score: 100,
                        period_start: format(
                          startOfMonth(new Date()),
                          'yyyy-MM-dd'
                        ),
                        period_end: format(
                          endOfMonth(new Date()),
                          'yyyy-MM-dd'
                        ),
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleScoreSubmit}>
                    {editingItem ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Score Overview</CardTitle>
                <CardDescription>Current performance scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='score' fill='#3b82f6' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Details</CardTitle>
                <CardDescription>Individual score breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {scores.map(score => (
                    <div
                      key={score.id}
                      className='flex items-center justify-between rounded-lg border p-4'
                    >
                      <div className='flex items-center gap-3'>
                        {getScoreIcon(score.score_type)}
                        <div>
                          <p className='font-medium capitalize'>
                            {score.score_type.replace('_', ' ')}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {format(new Date(score.period_start), 'MMM d')} -{' '}
                            {format(new Date(score.period_end), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <p
                            className={`font-semibold ${getScoreColor(score.score_value)}`}
                          >
                            {score.score_value}/{score.max_score || 100}
                          </p>
                          <Progress
                            value={
                              (score.score_value / (score.max_score || 100)) *
                              100
                            }
                            className='w-20'
                          />
                        </div>
                        <div className='flex gap-1'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => openEditDialog(score, 'score')}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleScoreDelete(score.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {scores.length === 0 && (
                    <div className='py-8 text-center'>
                      <BarChart3 className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                      <p className='text-muted-foreground'>
                        No scores available.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value='badges' className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Achievement Badges</h3>
            <Dialog
              open={isBadgeDialogOpen}
              onOpenChange={setIsBadgeDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Award Badge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Badge' : 'Award Badge'}
                  </DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='badge-type'>Badge Type</Label>
                    <Select
                      value={badgeForm.badge_type}
                      onValueChange={value =>
                        setBadgeForm({ ...badgeForm, badge_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select badge type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='attendance_streak'>
                          Attendance Streak
                        </SelectItem>
                        <SelectItem value='performance_excellence'>
                          Performance Excellence
                        </SelectItem>
                        <SelectItem value='team_player'>Team Player</SelectItem>
                        <SelectItem value='quality_champion'>
                          Quality Champion
                        </SelectItem>
                        <SelectItem value='innovation'>Innovation</SelectItem>
                        <SelectItem value='leadership'>Leadership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='badge-name'>Badge Name</Label>
                    <Input
                      id='badge-name'
                      value={badgeForm.badge_name}
                      onChange={e =>
                        setBadgeForm({
                          ...badgeForm,
                          badge_name: e.target.value,
                        })
                      }
                      placeholder='e.g., Perfect Attendance'
                    />
                  </div>
                  <div>
                    <Label htmlFor='badge-description'>Description</Label>
                    <Textarea
                      id='badge-description'
                      value={badgeForm.badge_description}
                      onChange={e =>
                        setBadgeForm({
                          ...badgeForm,
                          badge_description: e.target.value,
                        })
                      }
                      placeholder='Description of the achievement...'
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor='badge-icon'>Icon URL</Label>
                    <Input
                      id='badge-icon'
                      value={badgeForm.badge_icon}
                      onChange={e =>
                        setBadgeForm({
                          ...badgeForm,
                          badge_icon: e.target.value,
                        })
                      }
                      placeholder='URL to badge icon'
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsBadgeDialogOpen(false);
                      setEditingItem(null);
                      setBadgeForm({
                        badge_type: '',
                        badge_name: '',
                        badge_description: '',
                        badge_icon: '',
                        is_active: true,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleBadgeSubmit}>
                    {editingItem ? 'Update' : 'Award'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {badges.map(badge => (
              <Card key={badge.id} className='relative'>
                <CardContent className='p-6'>
                  <div className='mb-4 flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      {getBadgeIcon(badge.badge_type)}
                      <div>
                        <h4 className='font-semibold'>{badge.badge_name}</h4>
                        <p className='text-sm capitalize text-muted-foreground'>
                          {badge.badge_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className='flex gap-1'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => openEditDialog(badge, 'badge')}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleBadgeDelete(badge.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  {badge.badge_description && (
                    <p className='mb-3 text-sm text-muted-foreground'>
                      {badge.badge_description}
                    </p>
                  )}
                  <div className='flex items-center justify-between'>
                    <Badge variant={badge.is_active ? 'default' : 'secondary'}>
                      {badge.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <p className='text-xs text-muted-foreground'>
                      Earned{' '}
                      {format(new Date(badge.earned_at || ''), 'MMM d, yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {badges.length === 0 && (
              <div className='col-span-full py-8 text-center'>
                <Award className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                <p className='text-muted-foreground'>No badges awarded yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value='feedback' className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Feedback & Reviews</h3>
            <Dialog
              open={isFeedbackDialogOpen}
              onOpenChange={setIsFeedbackDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Feedback
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Feedback' : 'Add Feedback'}
                  </DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='feedback-type'>Feedback Type</Label>
                    <Select
                      value={feedbackForm.feedback_type}
                      onValueChange={value =>
                        setFeedbackForm({
                          ...feedbackForm,
                          feedback_type: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select feedback type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='performance_review'>
                          Performance Review
                        </SelectItem>
                        <SelectItem value='peer_feedback'>
                          Peer Feedback
                        </SelectItem>
                        <SelectItem value='client_feedback'>
                          Client Feedback
                        </SelectItem>
                        <SelectItem value='manager_feedback'>
                          Manager Feedback
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='rating'>Rating</Label>
                    <div className='mt-2 flex gap-1'>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type='button'
                          onClick={() =>
                            setFeedbackForm({ ...feedbackForm, rating: star })
                          }
                          className='focus:outline-none'
                          aria-label={`Rate ${star} out of 5 stars`}
                          title={`Rate ${star} out of 5 stars`}
                        >
                          <Star
                            className={`h-6 w-6 ${star <= feedbackForm.rating ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
                            aria-hidden='true'
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor='feedback-text'>Feedback Text</Label>
                    <Textarea
                      id='feedback-text'
                      value={feedbackForm.feedback_text}
                      onChange={e =>
                        setFeedbackForm({
                          ...feedbackForm,
                          feedback_text: e.target.value,
                        })
                      }
                      placeholder='Detailed feedback...'
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsFeedbackDialogOpen(false);
                      setEditingItem(null);
                      setFeedbackForm({
                        feedback_type: '',
                        rating: 5,
                        feedback_text: '',
                        strengths: [],
                        areas_for_improvement: [],
                        is_anonymous: false,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleFeedbackSubmit}>
                    {editingItem ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Feedback Distribution</CardTitle>
                <CardDescription>Rating breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={feedbackData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      {feedbackData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>Latest reviews and comments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {feedback.map(item => (
                    <div key={item.id} className='rounded-lg border p-4'>
                      <div className='mb-2 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline' className='capitalize'>
                            {item.feedback_type.replace('_', ' ')}
                          </Badge>
                          {item.is_anonymous && (
                            <Badge variant='secondary'>Anonymous</Badge>
                          )}
                        </div>
                        <div className='flex gap-1'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => openEditDialog(item, 'feedback')}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleFeedbackDelete(item.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                      {item.rating && (
                        <div className='mb-2 flex items-center gap-2'>
                          {getRatingStars(item.rating)}
                          <span className='text-sm text-muted-foreground'>
                            ({item.rating}/5)
                          </span>
                        </div>
                      )}
                      {item.feedback_text && (
                        <p className='mb-2 text-sm'>{item.feedback_text}</p>
                      )}
                      <p className='text-xs text-muted-foreground'>
                        {format(new Date(item.created_at || ''), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                  {feedback.length === 0 && (
                    <div className='py-8 text-center'>
                      <MessageSquare className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                      <p className='text-muted-foreground'>
                        No feedback available.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboards Tab */}
        <TabsContent value='leaderboards' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Team Leaderboard</CardTitle>
              <CardDescription>Current month rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {/* Mock leaderboard data */}
                {[
                  { rank: 1, name: 'Ahmed Hassan', score: 95, badge: '🏆' },
                  { rank: 2, name: 'Sarah Johnson', score: 92, badge: '🥈' },
                  { rank: 3, name: 'Mohammed Ali', score: 89, badge: '🥉' },
                  { rank: 4, name: 'Lisa Chen', score: 87, badge: '⭐' },
                  { rank: 5, name: 'David Wilson', score: 85, badge: '⭐' },
                ].map(item => (
                  <div
                    key={item.rank}
                    className='flex items-center justify-between rounded-lg border p-4'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='flex items-center gap-2'>
                        <span className='text-2xl'>{item.badge}</span>
                        <span className='text-lg font-bold'>#{item.rank}</span>
                      </div>
                      <div>
                        <p className='font-medium'>{item.name}</p>
                        <p className='text-sm text-muted-foreground'>
                          Score: {item.score}/100
                        </p>
                      </div>
                    </div>
                    <Progress value={item.score} className='w-32' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
