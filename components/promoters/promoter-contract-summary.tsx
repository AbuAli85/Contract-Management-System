'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Plus
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
    const expired = contracts.filter(c => c.status === 'expired').length;
    const total = contracts.length;
    
    const totalValue = contracts
      .filter(c => c.value && c.status === 'active')
      .reduce((sum, c) => sum + (c.value || 0), 0);
    
    const expiringSoon = contracts.filter(c => {
      if (c.status !== 'active' || !c.end_date) return false;
      const endDate = new Date(c.end_date);
      const daysUntilExpiry = differenceInDays(endDate, now);
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    return {
      active,
      completed,
      pending,
      expired,
      total,
      totalValue,
      expiringSoon
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
    const progress = isActive ? Math.max(0, Math.min(100, (differenceInDays(now, startDate) / differenceInDays(endDate, startDate)) * 100)) : 0;

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewContract(contract.id)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{contract.title}</h4>
              <p className="text-sm text-gray-500">
                {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
              </p>
            </div>
            <Badge className={`${getStatusColor(contract.status)} flex items-center gap-1`}>
              {getStatusIcon(contract.status)}
              {contract.status}
            </Badge>
          </div>

          {contract.value && (
            <div className="flex items-center gap-1 mb-3">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-600">
                {contract.value.toLocaleString()} {contract.currency || 'USD'}
              </span>
            </div>
          )}

          {isActive && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Started {format(startDate, 'MMM dd')}</span>
                <span>{daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}</span>
              </div>
            </div>
          )}

          {contract.approved_at && (
            <div className="mt-2 text-xs text-gray-500">
              Approved: {format(new Date(contract.approved_at), 'MMM dd, yyyy')}
            </div>
          )}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>

          {stats.totalValue > 0 && (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Total Active Contract Value</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {stats.totalValue.toLocaleString()} USD
              </div>
            </div>
          )}

          {stats.expiringSoon > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  {stats.expiringSoon} contract{stats.expiringSoon !== 1 ? 's' : ''} expiring soon
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Review and renew contracts before they expire.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Contracts */}
      {contracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contracts
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 6)
                .map((contract) => (
                  <ContractCard key={contract.id} contract={contract} />
                ))}
            </div>
            
            {contracts.length > 6 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={onViewAllContracts}
                  className="flex items-center gap-2"
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
