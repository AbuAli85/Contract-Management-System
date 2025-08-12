'use client';

import { useEffect } from 'react';
import { useContractsStore } from '@/lib/stores/contracts-store';
import { useRealtimeContracts } from '@/hooks/use-realtime-contracts';
import { ContractStatusIndicator } from './contract-status-indicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, RotateCcw, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function ContractsList() {
  const {
    contracts,
    fetchContracts,
    retryContract,
    generateContract,
    isLoading,
  } = useContractsStore();

  // Set up real-time subscriptions
  useRealtimeContracts();

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleDownload = async (contractId: string, contractName: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/download`);

      if (!response.ok) {
        throw new Error('Failed to download contract');
      }

      // Create blob and download
      if (typeof window !== 'undefined') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contractName || 'contract'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast.success(`Downloaded ${contractName}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download contract');
    }
  };

  const handleRetry = async (contractId: string) => {
    try {
      await retryContract(contractId);
      toast.success('Contract retry initiated');
    } catch (error) {
      toast.error('Failed to retry contract');
    }
  };

  const handleGenerate = async () => {
    try {
      // TODO: Replace with real contract generation logic or remove if not needed
      // await generateContract({ ... })
      toast.success('Contract generation started');
    } catch (error) {
      toast.error('Failed to generate contract');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center'>Loading contracts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>Contracts</CardTitle>
        <Button onClick={handleGenerate} className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Generate Contract
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map(contract => (
              <TableRow key={contract.id}>
                <TableCell className='font-medium'>
                  {contract.contract_name}
                </TableCell>
                <TableCell>
                  <ContractStatusIndicator
                    status={contract.status || 'unknown'}
                  />
                </TableCell>
                <TableCell>
                  {new Date(contract.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    {contract.status === 'completed' && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          handleDownload(
                            contract.id,
                            contract.contract_name || 'Contract'
                          )
                        }
                      >
                        <Download className='h-4 w-4' />
                      </Button>
                    )}
                    {contract.status === 'failed' && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleRetry(contract.id)}
                      >
                        <RotateCcw className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {contracts.length === 0 && (
          <div className='py-8 text-center text-muted-foreground'>
            No contracts found. Generate your first contract to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
