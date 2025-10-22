'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Users,
  FileText,
  TrendingUp,
  Save,
  Sparkles,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  status: string;
  contract_type: string;
  first_party_name: string;
  second_party_name: string;
  created_at: string;
  days_without_promoter: number;
  priority: 'high' | 'medium' | 'low';
  suggestions: Suggestion[];
}

interface Suggestion {
  id: string;
  suggested_promoter_id: string;
  confidence_score: number;
  suggestion_reason: string;
  promoters: {
    id: string;
    name_en: string;
    name_ar: string;
    email: string;
    mobile_number: string;
    status: string;
  };
}

interface Stats {
  total_contracts: number;
  contracts_with_promoter: number;
  contracts_without_promoter: number;
  percentage_complete: number;
  high_priority_missing: number;
  medium_priority_missing: number;
  low_priority_missing: number;
}

export default function ContractsWithoutPromotersPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { toast } = useToast();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Fetch contracts without promoters
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await fetch(`/api/admin/contracts-without-promoters?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }

      const data = await response.json();
      
      if (data.success) {
        setContracts(data.data.contracts);
        setStats(data.data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch contracts');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch contracts without promoters',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [statusFilter, priorityFilter]);

  // Generate suggestions for a contract
  const generateSuggestions = async (contractId: string) => {
    try {
      const response = await fetch('/api/admin/contracts-without-promoters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, maxSuggestions: 5 }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: `Generated ${data.data.suggestions.length} suggestions`,
        });
        fetchContracts(); // Refresh to show new suggestions
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate suggestions',
        variant: 'destructive',
      });
    }
  };

  // Handle promoter selection
  const handlePromoterSelect = (contractId: string, promoterId: string) => {
    const newAssignments = new Map(assignments);
    newAssignments.set(contractId, promoterId);
    setAssignments(newAssignments);
    
    // Also add to selected contracts
    const newSelected = new Set(selectedContracts);
    newSelected.add(contractId);
    setSelectedContracts(newSelected);
  };

  // Handle bulk save
  const handleBulkSave = async () => {
    if (assignments.size === 0) {
      toast({
        title: 'No assignments',
        description: 'Please select promoters for contracts first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const assignmentsArray = Array.from(assignments.entries()).map(([contract_id, promoter_id]) => ({
        contract_id,
        promoter_id,
      }));

      const response = await fetch('/api/admin/contracts-without-promoters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: assignmentsArray }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign promoters');
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success!',
          description: `Assigned promoters to ${data.data.summary.successful} contracts`,
        });
        
        // Clear selections and assignments
        setAssignments(new Map());
        setSelectedContracts(new Set());
        
        // Refresh contracts list
        fetchContracts();
      } else {
        throw new Error(data.error || 'Failed to assign promoters');
      }
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign promoters',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(new Set(contracts.map(c => c.id)));
    } else {
      setSelectedContracts(new Set());
    }
  };

  // Handle individual selection
  const handleSelectContract = (contractId: string, checked: boolean) => {
    const newSelected = new Set(selectedContracts);
    if (checked) {
      newSelected.add(contractId);
    } else {
      newSelected.delete(contractId);
    }
    setSelectedContracts(newSelected);
  };

  // Auto-assign top suggestions for selected contracts
  const autoAssignTopSuggestions = () => {
    const newAssignments = new Map(assignments);
    
    selectedContracts.forEach(contractId => {
      const contract = contracts.find(c => c.id === contractId);
      if (contract && contract.suggestions.length > 0) {
        const topSuggestion = contract.suggestions[0];
        newAssignments.set(contractId, topSuggestion.promoters.id);
      }
    });
    
    setAssignments(newAssignments);
    
    toast({
      title: 'Auto-assigned',
      description: `Assigned top suggestions to ${newAssignments.size} contracts`,
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['contract:edit:own']}>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Contracts Without Promoters</h1>
          <p className="text-muted-foreground mt-2">
            Manage and assign promoters to contracts missing promoter assignments
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contracts</p>
                    <p className="text-2xl font-bold">{stats.total_contracts}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">With Promoters</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.contracts_with_promoter}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.percentage_complete}% complete
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Without Promoters</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.contracts_without_promoter}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.high_priority_missing}
                    </p>
                    <p className="text-xs text-muted-foreground">Active/Pending</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contracts Needing Promoters ({contracts.length})</CardTitle>
                <CardDescription>
                  Select contracts and assign promoters using AI suggestions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={fetchContracts}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Bulk Actions */}
            {selectedContracts.size > 0 && (
              <Alert className="mb-4">
                <AlertDescription className="flex items-center justify-between">
                  <span>{selectedContracts.size} contract(s) selected</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={autoAssignTopSuggestions}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Auto-assign Top Suggestions
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBulkSave}
                      disabled={saving || assignments.size === 0}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Assignments ({assignments.size})
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Contracts Table */}
            {contracts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All contracts have promoters!</h3>
                <p className="text-muted-foreground">
                  No contracts found without promoter assignments.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedContracts.size === contracts.length}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Parties</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Days Pending</TableHead>
                      <TableHead>Suggested Promoters</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedContracts.has(contract.id)}
                            onCheckedChange={(checked) =>
                              handleSelectContract(contract.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{contract.contract_number}</p>
                            <p className="text-sm text-muted-foreground">{contract.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{contract.first_party_name || 'N/A'}</p>
                            <p className="text-muted-foreground">{contract.second_party_name || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>{contract.status}</Badge>
                        </TableCell>
                        <TableCell>{getPriorityBadge(contract.priority)}</TableCell>
                        <TableCell>{contract.days_without_promoter} days</TableCell>
                        <TableCell>
                          {contract.suggestions.length > 0 ? (
                            <Select
                              value={assignments.get(contract.id) || ''}
                              onValueChange={(value) => handlePromoterSelect(contract.id, value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select promoter" />
                              </SelectTrigger>
                              <SelectContent>
                                {contract.suggestions.map((suggestion) => (
                                  <SelectItem
                                    key={suggestion.promoters.id}
                                    value={suggestion.promoters.id}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{suggestion.promoters.name_en}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {suggestion.confidence_score}%
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateSuggestions(contract.id)}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignments.has(contract.id) && (
                            <Badge variant="secondary" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ready to save
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

