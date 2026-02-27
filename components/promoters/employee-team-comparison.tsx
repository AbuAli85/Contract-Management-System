'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  Users,
  BarChart3,
} from 'lucide-react';

interface EmployeeTeamComparisonProps {
  promoterId: string;
  employerId?: string;
  contracts?: any[];
  performanceScore?: number;
}

interface TeamMetrics {
  averageScore: number;
  rank: number;
  totalTeamMembers: number;
  percentile: number;
  topPerformer: boolean;
}

export function EmployeeTeamComparison({
  promoterId,
  employerId,
  contracts = [],
  performanceScore = 0,
}: EmployeeTeamComparisonProps) {
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeamMetrics();
  }, [promoterId, employerId, performanceScore]);

  const fetchTeamMetrics = async () => {
    setIsLoading(true);
    try {
      if (!employerId) {
        setTeamMetrics({ averageScore: 75, rank: 5, totalTeamMembers: 12, percentile: 58, topPerformer: false });
        setIsLoading(false);
        return;
      }
      const response = await fetch(`/api/promoters/${promoterId}/performance?employerId=${employerId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.teamMetrics) {
          setTeamMetrics(data.teamMetrics);
          setIsLoading(false);
          return;
        }
      }
      setTeamMetrics({ averageScore: performanceScore, rank: 1, totalTeamMembers: 1, percentile: 100, topPerformer: true });
    } catch {
      setTeamMetrics({ averageScore: performanceScore, rank: 1, totalTeamMembers: 1, percentile: 100, topPerformer: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-base flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Team Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-sm text-muted-foreground'>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!teamMetrics) return null;

  const scoreDifference = performanceScore - teamMetrics.averageScore;
  const isAboveAverage = scoreDifference > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2'>
          <BarChart3 className='h-5 w-5' />
          Team Comparison
        </CardTitle>
        <CardDescription>Performance vs team average</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Rank */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>Team Rank</span>
          <div className='flex items-center gap-2'>
            {teamMetrics.topPerformer && (
              <Badge variant='default' className='bg-yellow-500'>
                <Award className='h-3 w-3 mr-1' />
                Top Performer
              </Badge>
            )}
            <span className='font-bold text-lg'>#{teamMetrics.rank}</span>
            <span className='text-sm text-muted-foreground'>
              of {teamMetrics.totalTeamMembers}
            </span>
          </div>
        </div>

        {/* Percentile */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm text-muted-foreground'>Percentile</span>
            <span className='font-semibold'>{teamMetrics.percentile}%</span>
          </div>
          <Progress value={teamMetrics.percentile} className='h-2' />
        </div>

        {/* Score Comparison */}
        <div className='space-y-2 pt-2 border-t'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Your Score</span>
            <span className='font-semibold'>
              {Math.round(performanceScore)}%
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Team Average</span>
            <span className='font-semibold'>{teamMetrics.averageScore}%</span>
          </div>
          <div className='flex items-center justify-between pt-1'>
            <span className='text-sm font-medium'>Difference</span>
            <div className='flex items-center gap-1'>
              {isAboveAverage ? (
                <TrendingUp className='h-4 w-4 text-green-600' />
              ) : scoreDifference < 0 ? (
                <TrendingDown className='h-4 w-4 text-red-600' />
              ) : (
                <Minus className='h-4 w-4 text-gray-600' />
              )}
              <span
                className={`font-semibold ${
                  isAboveAverage
                    ? 'text-green-600'
                    : scoreDifference < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {isAboveAverage ? '+' : ''}
                {Math.round(scoreDifference)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
