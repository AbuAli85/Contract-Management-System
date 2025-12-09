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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Bell, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface PromoterMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  performanceScore: number;
  attendanceRate: number;
  leaderboardRank: number;
  totalPoints: number;
  thisWeekPoints: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  points: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  points: number;
}

export default function PromoterDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Fetch promoter metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['promoter-metrics', selectedPeriod],
    queryFn: async (): Promise<PromoterMetrics> => {
      const response = await fetch(
        `/api/promoter/metrics?period=${selectedPeriod}`
      );
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
  });

  // Fetch tasks
  const { data: tasks } = useQuery({
    queryKey: ['promoter-tasks'],
    queryFn: async (): Promise<Task[]> => {
      const response = await fetch('/api/promoter/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
  });

  // Fetch achievements
  const { data: achievements } = useQuery({
    queryKey: ['promoter-achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const response = await fetch('/api/promoter/achievements');
      if (!response.ok) throw new Error('Failed to fetch achievements');
      return response.json();
    },
  });

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    color = 'blue',
    subtitle,
    trend,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
    subtitle?: string;
    trend?: string;
  }) => (
    <Card className='relative overflow-hidden'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {subtitle && (
          <p className='mt-1 text-xs text-muted-foreground'>{subtitle}</p>
        )}
        {trend && (
          <div className='mt-1 flex items-center text-xs'>
            <TrendingUp className='mr-1 h-3 w-3 text-green-500' />
            <span className='text-green-600'>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const TaskList = () => (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Target className='h-5 w-5' />
          My Tasks
        </CardTitle>
        <CardDescription>
          {tasks?.filter(t => t.status !== 'completed').length || 0} tasks
          remaining
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {tasks?.slice(0, 5).map(task => (
            <div
              key={task.id}
              className='flex items-center justify-between rounded-lg border p-3'
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`h-2 w-2 rounded-full ${
                    task.priority === 'high'
                      ? 'bg-red-500'
                      : task.priority === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                />
                <div>
                  <p className='text-sm font-medium'>{task.title}</p>
                  <p className='text-xs text-muted-foreground'>
                    Due {format(new Date(task.dueDate), 'MMM dd')} •{' '}
                    {task.points} points
                  </p>
                </div>
              </div>
              <Badge
                variant={task.status === 'completed' ? 'default' : 'secondary'}
              >
                {task.status.replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>
        <Button variant='outline' className='mt-4 w-full'>
          <Plus className='mr-2 h-4 w-4' />
          View All Tasks
        </Button>
      </CardContent>
    </Card>
  );

  const Achievements = () => (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Award className='h-5 w-5' />
          Recent Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {achievements?.slice(0, 3).map(achievement => (
            <div
              key={achievement.id}
              className='flex items-center gap-3 rounded-lg border p-3'
            >
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500'>
                <Star className='h-5 w-5 text-white' />
              </div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>{achievement.name}</p>
                <p className='text-xs text-muted-foreground'>
                  {achievement.description}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {format(new Date(achievement.earnedAt), 'MMM dd')} •{' '}
                  {achievement.points} points
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const LeaderboardCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5' />
          Leaderboard Rank
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-center'>
          <div className='mb-2 text-4xl font-bold text-primary'>
            #{metrics?.leaderboardRank || 'N/A'}
          </div>
          <p className='mb-4 text-sm text-muted-foreground'>
            Your current rank
          </p>
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Total Points</span>
              <span className='font-medium'>{metrics?.totalPoints || 0}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span>This Week</span>
              <span className='font-medium text-green-600'>
                +{metrics?.thisWeekPoints || 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Activity className='h-5 w-5' />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-2 gap-3'>
        <Button
          variant='outline'
          className='flex h-auto flex-col items-center gap-2 p-4'
        >
          <FileText className='h-6 w-6' />
          <span className='text-sm'>Submit Report</span>
        </Button>
        <Button
          variant='outline'
          className='flex h-auto flex-col items-center gap-2 p-4'
        >
          <MessageCircle className='h-6 w-6' />
          <span className='text-sm'>Contact Admin</span>
        </Button>
        <Button
          variant='outline'
          className='flex h-auto flex-col items-center gap-2 p-4'
        >
          <Calendar className='h-6 w-6' />
          <span className='text-sm'>Request Leave</span>
        </Button>
        <Button
          variant='outline'
          className='flex h-auto flex-col items-center gap-2 p-4'
        >
          <Bell className='h-6 w-6' />
          <span className='text-sm'>Notifications</span>
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header with Profile */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'>
            <AvatarImage src='/placeholder-user.jpg' />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className='text-2xl font-bold'>Welcome back, John!</h1>
            <p className='text-muted-foreground'>
              Keep up the great work! You're doing amazing.
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='flex items-center gap-1'>
            <Star className='h-3 w-3' />
            Level 5 Promoter
          </Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          title='Performance Score'
          value={`${metrics?.performanceScore || 0}%`}
          icon={TrendingUp}
          color='green'
          trend='+5% this week'
        />
        <MetricCard
          title='Tasks Completed'
          value={metrics?.completedTasks || 0}
          subtitle={`${metrics?.totalTasks || 0} total tasks`}
          icon={CheckCircle}
          color='blue'
        />
        <MetricCard
          title='Attendance Rate'
          value={`${metrics?.attendanceRate || 0}%`}
          icon={Clock}
          color='orange'
        />
        <MetricCard
          title='Total Points'
          value={metrics?.totalPoints || 0}
          subtitle={`+${metrics?.thisWeekPoints || 0} this week`}
          icon={Award}
          color='purple'
        />
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left Column */}
        <div className='space-y-6 lg:col-span-2'>
          <TaskList />

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5' />
                Performance This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <div className='mb-2 flex items-center justify-between text-sm'>
                    <span>Task Completion</span>
                    <span>
                      {metrics?.completedTasks || 0}/{metrics?.totalTasks || 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      metrics?.completedTasks &&
                      metrics?.totalTasks &&
                      metrics.totalTasks > 0
                        ? (metrics.completedTasks / metrics.totalTasks) * 100
                        : 0
                    }
                  />
                </div>
                <div>
                  <div className='mb-2 flex items-center justify-between text-sm'>
                    <span>Attendance</span>
                    <span>{metrics?.attendanceRate || 0}%</span>
                  </div>
                  <Progress value={metrics?.attendanceRate || 0} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className='space-y-6'>
          <LeaderboardCard />
          <Achievements />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
