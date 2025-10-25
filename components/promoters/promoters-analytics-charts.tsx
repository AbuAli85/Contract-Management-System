'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Users, 
  TrendingUp, 
  Award, 
  Building2,
  Globe,
  PieChart,
  BarChart3,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { DashboardPromoter } from './types';

interface GeographicalData {
  location: string;
  count: number;
  percentage: number;
}

interface SkillsData {
  skill: string;
  count: number;
  level: 'beginner' | 'intermediate' | 'expert';
}

interface TrendData {
  month: string;
  newHires: number;
  departures: number;
  netGrowth: number;
}

interface PromotersAnalyticsChartsProps {
  promoters: DashboardPromoter[];
}

export function PromotersAnalyticsCharts({ promoters }: PromotersAnalyticsChartsProps) {
  
  // Geographical Distribution
  const geographicalData = useMemo(() => {
    const locationCounts = new Map<string, number>();
    
    promoters.forEach(promoter => {
      // Use nationality as a proxy for geographical distribution
      const location = promoter.nationality || 'Unknown';
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    });
    
    const total = promoters.length;
    return Array.from(locationCounts.entries())
      .map(([location, count]) => ({
        location,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 locations
  }, [promoters]);

  // Skills/Job Title Distribution
  const skillsData = useMemo(() => {
    const skillCounts = new Map<string, number>();
    
    promoters.forEach(promoter => {
      const jobTitle = promoter.job_title || 'General Promoter';
      skillCounts.set(jobTitle, (skillCounts.get(jobTitle) || 0) + 1);
    });
    
    return Array.from(skillCounts.entries())
      .map(([skill, count]) => ({
        skill,
        count,
        level: count > 10 ? 'expert' as const : 
               count > 5 ? 'intermediate' as const : 
               'beginner' as const
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 skills
  }, [promoters]);

  // Employment Status Distribution
  const statusData = useMemo(() => {
    const statusCounts = new Map<string, number>();
    
    promoters.forEach(promoter => {
      const status = promoter.overallStatus || 'unknown';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });
    
    return Array.from(statusCounts.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / promoters.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [promoters]);

  // Company Assignment Distribution
  const companyData = useMemo(() => {
    const companyCounts = new Map<string, number>();
    const unassigned = promoters.filter(p => !p.employer_id).length;
    
    promoters.forEach(promoter => {
      if (promoter.employer_id && promoter.organisationLabel) {
        const company = promoter.organisationLabel;
        companyCounts.set(company, (companyCounts.get(company) || 0) + 1);
      }
    });
    
    const companyList = Array.from(companyCounts.entries())
      .map(([company, count]) => ({
        company,
        count,
        percentage: Math.round((count / promoters.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 companies
    
    return { companies: companyList, unassigned };
  }, [promoters]);

  const maxGeoCount = Math.max(...geographicalData.map(d => d.count), 1);
  const maxSkillCount = Math.max(...skillsData.map(d => d.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Geographical Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Geographical Distribution
          </CardTitle>
          <CardDescription>
            Distribution of promoters by nationality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {geographicalData.map((item, index) => (
            <div key={item.location} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{item.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.count}</span>
                  <Badge variant="secondary" className="text-xs">
                    {item.percentage}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={(item.count / maxGeoCount) * 100} 
                className="h-2"
              />
            </div>
          ))}
          
          {geographicalData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No geographical data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills/Job Title Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-500" />
            Skills Distribution
          </CardTitle>
          <CardDescription>
            Distribution of promoters by job title/skills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {skillsData.map((item, index) => (
            <div key={item.skill} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className={`h-4 w-4 ${
                    item.level === 'expert' ? 'text-green-500' :
                    item.level === 'intermediate' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <span className="font-medium">{item.skill}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.count}</span>
                  <Badge 
                    variant={item.level === 'expert' ? 'default' : 'secondary'} 
                    className="text-xs"
                  >
                    {item.level}
                  </Badge>
                </div>
              </div>
              <Progress 
                value={(item.count / maxSkillCount) * 100} 
                className={`h-2 ${
                  item.level === 'expert' ? '[&>div]:bg-green-500' :
                  item.level === 'intermediate' ? '[&>div]:bg-yellow-500' :
                  '[&>div]:bg-blue-500'
                }`}
              />
            </div>
          ))}
          
          {skillsData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No skills data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employment Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-500" />
            Employment Status
          </CardTitle>
          <CardDescription>
            Current status distribution of all promoters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {statusData.map((item, index) => {
              const colors = {
                active: 'bg-green-500 text-green-50 border-green-600',
                critical: 'bg-red-500 text-red-50 border-red-600',
                warning: 'bg-yellow-500 text-yellow-50 border-yellow-600',
                inactive: 'bg-gray-500 text-gray-50 border-gray-600'
              };
              
              return (
                <div 
                  key={item.status} 
                  className={`rounded-lg p-4 border ${
                    colors[item.status as keyof typeof colors] || 'bg-blue-500 text-blue-50 border-blue-600'
                  }`}
                >
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-sm capitalize opacity-90">{item.status}</div>
                  <div className="text-xs opacity-75">{item.percentage}% of total</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Company Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" />
            Company Assignment
          </CardTitle>
          <CardDescription>
            Distribution of promoters across companies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Unassigned promoters alert */}
          {companyData.unassigned > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-amber-800">
                  {companyData.unassigned} promoters unassigned
                </span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Consider assigning these promoters to improve organization
              </p>
            </div>
          )}
          
          {/* Company list */}
          {companyData.companies.map((item, index) => (
            <div key={item.company} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  <span className="font-medium">{item.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.count}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.percentage}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={item.percentage} 
                className="h-2 [&>div]:bg-indigo-500"
              />
            </div>
          ))}
          
          {companyData.companies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No company assignments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
