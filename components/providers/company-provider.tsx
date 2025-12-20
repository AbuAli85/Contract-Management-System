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
            // Double-check: Ensure it's not an invalid/mock company (but allow valid Falcon Eye companies)
            const isInvalidCompany = (name: string): boolean => {
              const lower = name.toLowerCase().trim();
              if (lower.includes('falcon eye modern investments')) return false; // Allow valid Falcon Eye companies
              return (
                lower === 'digital morph' ||
                lower === 'falcon eye group' ||
                lower === 'cc' ||
                lower === 'digital marketing pro' ||
                lower.includes('digital morph') ||
                (lower.includes('falcon eye group') && !lower.includes('modern investments'))
              );
            };
            
            if (isInvalidCompany(activeCompany.company_name || '')) {
              // Invalid company - clear it and use first valid company
              console.warn('Active company is invalid, clearing it');
              
              // Find first valid company and set it directly (don't trigger full switch)
              const firstValidCompany = data.companies?.find((c: any) => 
                !isInvalidCompany(c.company_name || '')
              );
              if (firstValidCompany) {
                // Set the company state directly without triggering switch
                setCompany({
                  id: firstValidCompany.company_id,
                  name: firstValidCompany.company_name,
                  logo_url: firstValidCompany.company_logo,
                  role: firstValidCompany.user_role || 'member',
                });
                // Note: We don't update the active_company_id in the database here
                // to avoid circular calls. The user can manually switch if needed.
              } else {
                setCompany(null);
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
        // Update company state immediately
        await fetchActiveCompany();
        
        // Refresh router to update all server components
        router.refresh();
        
        // Trigger window event for client components to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('company-switched', { 
            detail: { companyId, companyName: data.company_name } 
          }));
        }
        
        toast({
          title: 'Company Switched',
          description: `Now viewing ${data.company_name}. All features refreshed.`,
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

