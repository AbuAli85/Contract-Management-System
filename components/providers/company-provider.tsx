'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  role: string;
}

interface CompanyContextType {
  company: Company | null;
  companyId: string | null;
  isLoading: boolean;
  switchCompany: (companyId: string) => Promise<void>;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchActiveCompany = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/companies');
      const data = await response.json();

      if (response.ok && data.success) {
        const activeCompanyId = data.active_company_id;
        
        if (activeCompanyId) {
          // Find the active company from the list
          const activeCompany = data.companies?.find(
            (c: any) => c.company_id === activeCompanyId
          );

          if (activeCompany) {
            // Double-check: Ensure it's not an invalid company
            const companyName = (activeCompany.company_name || '').toLowerCase().trim();
            const isInvalidCompany = 
              companyName === 'digital morph' ||
              companyName === 'falcon eye group' ||
              companyName.includes('digital morph') ||
              companyName.includes('falcon eye group');
            
            if (isInvalidCompany) {
              // Invalid company - clear it and use first valid company
              console.warn('Active company is invalid, clearing it');
              setCompany(null);
              // Optionally switch to first valid company
              const firstValidCompany = data.companies?.find((c: any) => {
                const name = (c.company_name || '').toLowerCase().trim();
                return name !== 'digital morph' && 
                       name !== 'falcon eye group' &&
                       !name.includes('digital morph') &&
                       !name.includes('falcon eye group');
              });
              if (firstValidCompany) {
                // Auto-switch to first valid company
                switchCompany(firstValidCompany.company_id);
              }
            } else {
              setCompany({
                id: activeCompany.company_id,
                name: activeCompany.company_name,
                logo_url: activeCompany.company_logo,
                role: activeCompany.user_role || 'member',
              });
            }
          } else {
            setCompany(null);
          }
        } else {
          setCompany(null);
        }
      } else {
        setCompany(null);
      }
    } catch (error) {
      console.error('Error fetching active company:', error);
      setCompany(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchCompany = async (companyId: string) => {
    try {
      const response = await fetch('/api/user/companies/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchActiveCompany();
        router.refresh(); // Refresh to update server components
        toast({
          title: 'Company Switched',
          description: `Now viewing ${data.company_name}`,
        });
      } else {
        throw new Error(data.error || 'Failed to switch company');
      }
    } catch (error: any) {
      console.error('Error switching company:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to switch company',
        variant: 'destructive',
      });
    }
  };

  const refreshCompany = async () => {
    await fetchActiveCompany();
  };

  useEffect(() => {
    fetchActiveCompany();
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        company,
        companyId: company?.id || null,
        isLoading,
        switchCompany,
        refreshCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

