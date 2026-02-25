import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Contract } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

interface ContractStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
}

interface ContractsStore {
  contracts: Contract[];
  stats: ContractStats;
  error: string | null;
  isLoading: boolean;
  fetchContracts: () => Promise<void>;
  generateContract: (
    contractData: Omit<Contract, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  retryContract: (contractId: string) => Promise<void>;
  clearError: () => void;
  getContractById: (id: string) => Contract | undefined;
  updateStats: () => void;
}

const createContractStore = (set: any, get: any) => ({
  contracts: [],
  stats: {
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
  },
  error: null,
  isLoading: true,

  fetchContracts: async () => {
    set({ isLoading: true });
    try {
      const supabaseClient = createClient();
      if (!supabaseClient) {
        throw new Error('Failed to create Supabase client');
      }
      const { data, error } = await supabaseClient
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to handle nullable fields
      const transformedContracts = (data || []).map((contract: any) => ({
        ...contract,
        created_at: contract.created_at || new Date().toISOString(),
        updated_at: contract.updated_at || null,
        first_party_id: contract.first_party_id || '',
        second_party_id: contract.second_party_id || '',
        promoter_id: contract.promoter_id || '',
      }));

      set({ contracts: transformedContracts, isLoading: false });
      get().updateStats();
    } catch (error) {
      console.error('Error fetching contracts:', error);
      set({ isLoading: false });
    }
  },

  generateContract: async (contractData: any) => {
    set({ isLoading: true });
    try {
      // Simulate API call
      const response = await fetch('/api/generate-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate contract');
      }

      toast({ title: 'Success', description: 'Contract generation started.' });
    } catch (error: unknown) {
      set({ error: (error as Error).message });
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  retryContract: async (contractId: string) => {
    // In a real app, you'd call an API to retry the contract generation
    // For now, we'll just move it back to 'pending'
    const updatedContracts = get().contracts.map((contract: any) =>
      contract.id === contractId ? { ...contract, status: 'pending' } : contract
    );
    set({ contracts: updatedContracts });
    get().updateStats();
  },

  updateStats: () => {
    const contracts = get().contracts;
    const stats = {
      total: contracts.length,
      pending: contracts.filter(
        (c: any) => c.status === 'generating' || c.status === 'pending'
      ).length,
      completed: contracts.filter((c: any) => c.status === 'completed').length,
      failed: contracts.filter((c: any) => c.status === 'failed').length,
    };
    set({ stats });
  },

  clearError: () => set({ error: null }),

  getContractById: (id: string) => {
    return get().contracts.find((c: Contract) => c.id === id);
  },
});

export const useContractsStore = create<ContractsStore>(createContractStore);
