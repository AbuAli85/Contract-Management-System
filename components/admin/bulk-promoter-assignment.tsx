'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Contract {
  id: string;
  contract_number: string | null;
  title: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  first_party?: { name_en: string } | null;
  second_party?: { name_en: string } | null;
  promoter_id: string | null;
}

interface Promoter {
  id: string;
  name_en: string;
  name_ar: string;
  email: string | null;
  mobile_number: string | null;
  status: string;
}

export default function BulkPromoterAssignment() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(
    new Set()
  );
  const [selectedPromoter, setSelectedPromoter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    withoutPromoter: 0,
    withPromoter: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch contracts without promoters
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(
          `
          id,
          contract_number,
          title,
          status,
          start_date,
          end_date,
          promoter_id,
          first_party:parties!contracts_first_party_id_fkey(name_en),
          second_party:parties!contracts_second_party_id_fkey(name_en)
        `
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (contractsError) {
        console.error('Error fetching contracts:', contractsError);
        toast({
          title: 'Error',
          description: 'Failed to load contracts',
          variant: 'destructive',
        });
      } else {
        setContracts(contractsData || []);

        // Calculate stats
        const total = contractsData?.length || 0;
        const withoutPromoter =
          contractsData?.filter(c => !c.promoter_id).length || 0;
        const withPromoter = total - withoutPromoter;

        setStats({ total, withoutPromoter, withPromoter });
      }

      // Fetch active promoters
      const { data: promotersData, error: promotersError } = await supabase
        .from('promoters')
        .select('id, name_en, name_ar, email, mobile_number, status')
        .eq('status', 'active')
        .order('name_en');

      if (promotersError) {
        console.error('Error fetching promoters:', promotersError);
        toast({
          title: 'Error',
          description: 'Failed to load promoters',
          variant: 'destructive',
        });
      } else {
        setPromoters(promotersData || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const contractsWithoutPromoter = contracts
        .filter(c => !c.promoter_id)
        .map(c => c.id);
      setSelectedContracts(new Set(contractsWithoutPromoter));
    } else {
      setSelectedContracts(new Set());
    }
  };

  const handleSelectContract = (contractId: string, checked: boolean) => {
    const newSelection = new Set(selectedContracts);
    if (checked) {
      newSelection.add(contractId);
    } else {
      newSelection.delete(contractId);
    }
    setSelectedContracts(newSelection);
  };

  const handleBulkAssign = async () => {
    if (!selectedPromoter || selectedContracts.size === 0) {
      toast({
        title: 'Invalid Selection',
        description: 'Please select a promoter and at least one contract',
        variant: 'destructive',
      });
      return;
    }

    setAssigning(true);
    try {
      const supabase = createClient();

      // Update contracts in a single batch
      const { error } = await supabase
        .from('contracts')
        .update({
          promoter_id: selectedPromoter,
          updated_at: new Date().toISOString(),
        })
        .in('id', Array.from(selectedContracts));

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: `Assigned promoter to ${selectedContracts.size} contract(s)`,
      });

      // Reset selection and reload data
      setSelectedContracts(new Set());
      setSelectedPromoter('');
      await loadData();
    } catch (error) {
      console.error('Error assigning promoter:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign promoter to contracts',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const contractsWithoutPromoter = contracts.filter(c => !c.promoter_id);

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Statistics */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-amber-600'>
              Without Promoter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-amber-600'>
              {stats.withoutPromoter}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-green-600'>
              With Promoter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {stats.withPromoter}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Assignment Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Promoter Assignment</CardTitle>
          <CardDescription>
            Assign promoters to contracts that are missing this information
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {stats.withoutPromoter === 0 ? (
            <Alert>
              <CheckCircle2 className='h-4 w-4' />
              <AlertDescription>
                Great! All contracts have promoters assigned.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Selection Controls */}
              <div className='flex items-center gap-4'>
                <div className='flex-1'>
                  <label className='text-sm font-medium mb-2 block'>
                    Select Promoter
                  </label>
                  <Select
                    value={selectedPromoter}
                    onValueChange={setSelectedPromoter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Choose a promoter...' />
                    </SelectTrigger>
                    <SelectContent>
                      {promoters.map(promoter => (
                        <SelectItem key={promoter.id} value={promoter.id}>
                          {promoter.name_en} ({promoter.name_ar})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-end gap-2'>
                  <Button
                    onClick={handleBulkAssign}
                    disabled={
                      !selectedPromoter ||
                      selectedContracts.size === 0 ||
                      assigning
                    }
                  >
                    {assigning ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <User className='mr-2 h-4 w-4' />
                        Assign to {selectedContracts.size} Contract(s)
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Contracts Table */}
              <div className='border rounded-lg'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-12'>
                        <Checkbox
                          checked={
                            selectedContracts.size ===
                              contractsWithoutPromoter.length &&
                            contractsWithoutPromoter.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Contract Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>First Party</TableHead>
                      <TableHead>Second Party</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractsWithoutPromoter.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className='text-center py-8'>
                          <AlertTriangle className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
                          <p className='text-muted-foreground'>
                            No contracts without promoters found
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      contractsWithoutPromoter.map(contract => (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedContracts.has(contract.id)}
                              onCheckedChange={checked =>
                                handleSelectContract(contract.id, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell className='font-mono text-sm'>
                            {contract.contract_number || 'N/A'}
                          </TableCell>
                          <TableCell>{contract.title || 'N/A'}</TableCell>
                          <TableCell>
                            {typeof contract.first_party === 'object' &&
                            contract.first_party
                              ? contract.first_party.name_en
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {typeof contract.second_party === 'object' &&
                            contract.second_party
                              ? contract.second_party.name_en
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline'>{contract.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {contract.start_date
                              ? new Date(
                                  contract.start_date
                                ).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Promoter List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Promoters ({promoters.length})</CardTitle>
          <CardDescription>
            Active promoters available for assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-2 md:grid-cols-2 lg:grid-cols-3'>
            {promoters.map(promoter => (
              <div
                key={promoter.id}
                className='flex items-center gap-3 p-3 border rounded-lg'
              >
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
                  <User className='h-5 w-5 text-primary' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium truncate'>{promoter.name_en}</p>
                  <p className='text-sm text-muted-foreground truncate'>
                    {promoter.name_ar}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
