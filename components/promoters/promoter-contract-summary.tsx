'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Plus,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';

interface Contract {
  id: string;
  title: string;
  status: 'draft' | 'pending' | 'approved' | 'active' | 'completed' | 'terminated' | 'expired';
  start_date: string;
  end_date: string;
  value?: number;
  currency?: string;
  created_at: string;
  approved_at?: string;
}

interface PromoterContractSummaryProps {
  contracts: Contract[];
  onCreateContract: () => void;
  onViewAllContracts: () => void;
  onViewContract: (contractId: string) => void;
  isAdmin: boolean;
}

export function PromoterContractSummary({
  contracts,
  onCreateContract,
  onViewAllContracts,
  onViewContract,
  isAdmin
}: PromoterContractSummaryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'terminated':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'draft':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      case 'terminated':
        return <AlertTriangle className="h-4 w-4" />;
      case 'draft':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const calculateContractStats = () => {
    const now = new Date();
    const active = contracts.filter(c => c.status === 'active').length;
    const completed = contracts.filter(c => c.status === 'completed').length;
    const pending = contracts.filter(c => c.status === 'pending').length;
    const approved = contracts.filter(c => c.status === 'approved').length;
    const expired = contracts.filter(c => c.status === 'expired').length;
    const terminated = contracts.filter(c => c.status === 'terminated').length;
    const draft = contracts.filter(c => c.status === 'draft').length;
    const total = contracts.length;
    
    // Financial metrics
    const totalValue = contracts
      .filter(c => c.value && c.status === 'active')
      .reduce((sum, c) => sum + (c.value || 0), 0);
    
    const completedValue = contracts
      .filter(c => c.value && c.status === 'completed')
      .reduce((sum, c) => sum + (c.value || 0), 0);
    
    const pendingValue = contracts
      .filter(c => c.value && c.status === 'pending')
      .reduce((sum, c) => sum + (c.value || 0), 0);
    
    const totalContractValue = contracts
      .filter(c => c.value)
      .reduce((sum, c) => sum + (c.value || 0), 0);
    
    // Time-based metrics
    const expiringSoon = contracts.filter(c => {
      if (c.status !== 'active' || !c.end_date) return false;
      const endDate = new Date(c.end_date);
      const daysUntilExpiry = differenceInDays(endDate, now);
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    const recentlyCreated = contracts.filter(c => {
      const createdDate = new Date(c.created_at);
      const daysSinceCreated = differenceInDays(now, createdDate);
      return daysSinceCreated <= 7;
    }).length;

    const recentlyCompleted = contracts.filter(c => {
      if (c.status !== 'completed' || !c.approved_at) return false;
      const completedDate = new Date(c.approved_at);
      const daysSinceCompleted = differenceInDays(now, completedDate);
      return daysSinceCompleted <= 30;
    }).length;

    // Performance metrics
    const averageContractValue = total > 0 ? totalContractValue / total : 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const activeRate = total > 0 ? (active / total) * 100 : 0;

    // Contract duration analysis
    const contractDurations = contracts
      .filter(c => c.start_date && c.end_date && c.status === 'completed')
      .map(c => {
        const start = new Date(c.start_date);
        const end = new Date(c.end_date);
        return differenceInDays(end, start);
      });

    const averageDuration = contractDurations.length > 0 
      ? contractDurations.reduce((sum, duration) => sum + duration, 0) / contractDurations.length 
      : 0;

    return {
      active,
      completed,
      pending,
      approved,
      expired,
      terminated,
      draft,
      total,
      totalValue,
      completedValue,
      pendingValue,
      totalContractValue,
      averageContractValue,
      expiringSoon,
      recentlyCreated,
      recentlyCompleted,
      completionRate,
      activeRate,
      averageDuration
    };
  };

  const stats = calculateContractStats();

  const ContractCard = ({ contract }: { contract: Contract }) => {
    const now = new Date();
    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date);
    const isActive = contract.status === 'active';
    const isExpired = isAfter(now, endDate);
    const daysRemaining = isActive ? differenceInDays(endDate, now) : 0;
    const totalDays = differenceInDays(endDate, startDate);
    const progress = isActive ? Math.max(0, Math.min(100, (differenceInDays(now, startDate) / totalDays) * 100)) : 0;
    const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;

    return (
      <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${
        isActive ? 'border-l-green-500' : 
        contract.status === 'completed' ? 'border-l-blue-500' :
        contract.status === 'pending' ? 'border-l-yellow-500' :
        'border-l-gray-300'
      }`} onClick={() => onViewContract(contract.id)}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate text-lg">{contract.title}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
              </p>
            </div>
            <Badge className={`${getStatusColor(contract.status)} flex items-center gap-1 px-3 py-1`}>
              {getStatusIcon(contract.status)}
              <span className="capitalize">{contract.status}</span>
            </Badge>
          </div>

          {/* Financial Information */}
          {contract.value && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Contract Value</span>
                </div>
                <span className="font-bold text-green-600 text-lg">
                  {contract.value.toLocaleString()} {contract.currency || 'USD'}
                </span>
              </div>
            </div>
          )}

          {/* Progress Section for Active Contracts */}
          {isActive && (
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Contract Progress</span>
                <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Started {format(startDate, 'MMM dd, yyyy')}</span>
                <span className={isExpiringSoon ? 'text-yellow-600 font-medium' : ''}>
                  {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                </span>
              </div>
            </div>
          )}

          {/* Status-specific Information */}
          <div className="space-y-2">
            {contract.approved_at && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle className="h-3 w-3" />
                <span>Approved: {format(new Date(contract.approved_at), 'MMM dd, yyyy')}</span>
              </div>
            )}
            
            {isExpiringSoon && (
              <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">Expires soon</span>
              </div>
            )}
            
            {contract.status === 'completed' && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <CheckCircle className="h-3 w-3" />
                <span className="font-medium">Successfully completed</span>
              </div>
            )}
            
            {contract.status === 'pending' && (
              <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                <Clock className="h-3 w-3" />
                <span className="font-medium">Awaiting approval</span>
              </div>
            )}
          </div>

          {/* Contract Duration */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Duration: {totalDays} days</span>
              <span>ID: {contract.id.slice(0, 8)}...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Contract Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract Overview
            </CardTitle>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateContract}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Contract
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewAllContracts}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm font-medium text-green-800">Active</div>
              <div className="text-xs text-green-600 mt-1">{stats.activeRate.toFixed(1)}% of total</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm font-medium text-blue-800">Completed</div>
              <div className="text-xs text-blue-600 mt-1">{stats.completionRate.toFixed(1)}% success rate</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm font-medium text-yellow-800">Pending</div>
              <div className="text-xs text-yellow-600 mt-1">Awaiting approval</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm font-medium text-gray-800">Total</div>
              <div className="text-xs text-gray-600 mt-1">All contracts</div>
            </div>
          </div>

          {/* Secondary Status Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{stats.approved}</div>
              <div className="text-xs font-medium text-purple-800">Approved</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{stats.expired}</div>
              <div className="text-xs font-medium text-red-800">Expired</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-600">{stats.terminated}</div>
              <div className="text-xs font-medium text-gray-800">Terminated</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-600">{stats.draft}</div>
              <div className="text-xs font-medium text-gray-800">Draft</div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Active Value</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalValue.toLocaleString()} USD
              </div>
              <div className="text-xs text-green-600 mt-1">Currently generating revenue</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Completed Value</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.completedValue.toLocaleString()} USD
              </div>
              <div className="text-xs text-blue-600 mt-1">Successfully delivered</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Pending Value</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingValue.toLocaleString()} USD
              </div>
              <div className="text-xs text-yellow-600 mt-1">Awaiting approval</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">Average Contract Value</span>
                <DollarSign className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-xl font-bold text-gray-600">
                {stats.averageContractValue.toLocaleString()} USD
              </div>
              <div className="text-xs text-gray-500 mt-1">Per contract</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">Average Duration</span>
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-xl font-bold text-gray-600">
                {stats.averageDuration > 0 ? `${Math.round(stats.averageDuration)} days` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Completed contracts only</div>
            </div>
          </div>

          {/* Alerts and Notifications */}
          <div className="space-y-3">
            {stats.expiringSoon > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">
                    {stats.expiringSoon} contract{stats.expiringSoon !== 1 ? 's' : ''} expiring soon
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Review and renew contracts before they expire to maintain continuity.
                </p>
              </div>
            )}

            {stats.recentlyCreated > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {stats.recentlyCreated} new contract{stats.recentlyCreated !== 1 ? 's' : ''} this week
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Recent contract activity shows good engagement.
                </p>
              </div>
            )}

            {stats.recentlyCompleted > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {stats.recentlyCompleted} contract{stats.recentlyCompleted !== 1 ? 's' : ''} completed this month
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Excellent delivery performance this month.
                </p>
              </div>
            )}

            {stats.total === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-800">No contracts yet</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  This promoter hasn't been assigned any contracts yet.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Contracts Table */}
      {contracts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Contracts
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {Math.min(10, contracts.length)} of {contracts.length} contracts
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewAllContracts}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Contract Details</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[120px]">Value</TableHead>
                    <TableHead className="w-[140px]">Duration</TableHead>
                    <TableHead className="w-[100px]">Progress</TableHead>
                    <TableHead className="w-[120px]">Created</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map((contract) => {
                      const now = new Date();
                      const startDate = new Date(contract.start_date);
                      const endDate = new Date(contract.end_date);
                      const isActive = contract.status === 'active';
                      const daysRemaining = isActive ? differenceInDays(endDate, now) : 0;
                      const totalDays = differenceInDays(endDate, startDate);
                      const progress = isActive ? Math.max(0, Math.min(100, (differenceInDays(now, startDate) / totalDays) * 100)) : 0;
                      const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;

                      return (
                        <TableRow key={contract.id} className="hover:bg-gray-50">
                          {/* Contract Details */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 truncate max-w-[280px]">
                                {contract.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {contract.id.slice(0, 8)}...
                              </div>
                              <div className="text-xs text-gray-400">
                                {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                              </div>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={`${getStatusColor(contract.status)} flex items-center gap-1 w-fit`}>
                                {getStatusIcon(contract.status)}
                                <span className="capitalize">{contract.status}</span>
                              </Badge>
                              {isExpiringSoon && (
                                <div className="flex items-center gap-1 text-xs text-yellow-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Expires soon</span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Value */}
                          <TableCell>
                            {contract.value ? (
                              <div className="space-y-1">
                                <div className="font-medium text-green-600">
                                  {contract.value.toLocaleString()} {contract.currency || 'USD'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Contract value
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No value</span>
                            )}
                          </TableCell>

                          {/* Duration */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {totalDays} days
                              </div>
                              <div className="text-xs text-gray-500">
                                {isActive && daysRemaining > 0 ? (
                                  <span className={isExpiringSoon ? 'text-yellow-600' : ''}>
                                    {daysRemaining} days left
                                  </span>
                                ) : contract.status === 'completed' ? (
                                  <span className="text-blue-600">Completed</span>
                                ) : (
                                  <span className="text-gray-500">N/A</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Progress */}
                          <TableCell>
                            {isActive ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {Math.round(progress)}%
                                </div>
                                <Progress value={progress} className="h-2 w-16" />
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>

                          {/* Created Date */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                {format(new Date(contract.created_at), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(contract.created_at), 'HH:mm')}
                              </div>
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewContract(contract.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {isAdmin && (
                                  <DropdownMenuItem onClick={() => onViewContract(contract.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Contract
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
            
            {contracts.length > 10 && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={onViewAllContracts}
                  className="flex items-center gap-2 px-6 py-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View All {contracts.length} Contracts
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Contracts State */}
      {contracts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Contracts Yet</h3>
            <p className="text-gray-500 mb-4">
              This promoter doesn't have any contracts yet.
            </p>
            {isAdmin && (
              <Button onClick={onCreateContract} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create First Contract
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
