'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  const fetchActiveCompany = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      // Add cache-busting to ensure fresh data
      const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
      
      // Add timeout to prevent hanging (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(`/api/user/companies${cacheBuster}`, {
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        clearTimeout(timeoutId);
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('Company fetch timed out after 10 seconds');
          // Don't block rendering - set loading to false even on timeout
          setCompany(null);
        } else {
          throw fetchError; // Re-throw other errors
        }
      }
    } catch (error) {
      console.error('Error fetching active company:', error);
      setCompany(null);
      // Always set loading to false even on error to prevent blocking
    } finally {
      setIsLoading(false);
    }
  };

  const switchCompany = async (companyId: string) => {
    try {
      const response = await fetch('/api/user/companies/switch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ company_id: companyId }),
        cache: 'no-store', // Ensure we don't use cached response
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Immediately update state with the new company from the response
        // This prevents the UI from being stuck with the old company
        // We'll get full details from fetchActiveCompany, but this ensures immediate UI update
        const tempCompany = {
          id: companyId,
          name: data.company_name || 'Company',
          logo_url: null, // Will be updated by fetchActiveCompany
          role: 'member', // Will be updated by fetchActiveCompany
        };
        setCompany(tempCompany);
        
        // Invalidate all React Query caches to force data refresh
        queryClient.invalidateQueries();
        queryClient.clear();
        
        // Refresh router to update all server components
        router.refresh();
        
        // Trigger window event for client components to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('company-switched', { 
            detail: { companyId, companyName: data.company_name } 
          }));
        }
        
        // Fetch full company details after a short delay to ensure DB update has propagated
        // The immediate state update above ensures UI is not stuck, this gets full details
        setTimeout(async () => {
          try {
            await fetchActiveCompany(true); // Force refresh with cache busting
          } catch (error) {
            console.error('Error fetching active company after switch:', error);
            // If fetch fails, the temporary state above will still show the correct company
          }
        }, 300);
        
        toast({
          title: 'Company Switched',
          description: `Now viewing ${data.company_name}. All features refreshed.`,
        });
      } else {
        throw new Error(data.error || 'Failed to switch company');
      }
    } catch (error: any) {
      console.error('Error switching company:', error);
      // Re-fetch to restore correct state on error
      await fetchActiveCompany();
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
    // Fetch company data but don't block rendering
    // Set a timeout to ensure loading state doesn't persist too long
    fetchActiveCompany().catch((error) => {
      console.error('Failed to fetch active company:', error);
      // Ensure loading is set to false even on error
      setIsLoading(false);
    });
    
    // Safety timeout: If loading takes more than 5 seconds, stop blocking
    // Use functional setState to access current value
    const safetyTimeout = setTimeout(() => {
      setIsLoading((currentLoading) => {
        if (currentLoading) {
          console.warn('CompanyProvider: Loading timeout after 5s - allowing page to render');
          return false;
        }
        return currentLoading;
      });
    }, 5000);
    
    return () => clearTimeout(safetyTimeout);
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

