'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { syncSessionToSSO } from '@/lib/sso-session-sync';

/** Minimal company shape used throughout the app */
export interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  role: string;
}

/** Full enriched company shape returned by /api/user/companies */
export interface RawCompany {
  company_id: string;
  company_name: string;
  company_logo: string | null;
  user_role: string;
  is_primary: boolean;
  group_name: string | null;
  stats?: {
    employees: number;
    attendance_today: number;
    active_tasks: number;
    contracts: number;
  };
  features?: {
    team_management: boolean;
    attendance: boolean;
    tasks: boolean;
    targets: boolean;
    reports: boolean;
    contracts: boolean;
    analytics: boolean;
  };
}

interface CompanyContextType {
  /** The currently active company (simplified shape) */
  company: Company | null;
  companyId: string | null;
  /** Full enriched list of all companies — use this in CompanySwitcher */
  rawCompanies: RawCompany[];
  isLoading: boolean;
  switchCompany: (companyId: string) => Promise<void>;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const INVALID_COMPANY_NAMES = new Set([
  'digital morph',
  'falcon eye group',
  'cc',
  'digital marketing pro',
]);

function isInvalidCompany(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (lower.includes('falcon eye modern investments')) return false;
  if (INVALID_COMPANY_NAMES.has(lower)) return true;
  if (lower.includes('digital morph')) return true;
  if (lower.includes('falcon eye group') && !lower.includes('modern investments')) return true;
  return false;
}

function toCompany(raw: RawCompany): Company {
  return {
    id: raw.company_id,
    name: raw.company_name,
    logo_url: raw.company_logo ?? null,
    role: raw.user_role || 'member',
  };
}

async function ensureSessionInCookies(): Promise<void> {
  try {
    const supabase = createClient();
    if (!supabase) return;

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      await syncSessionToSSO();
      return;
    }

    const cookies = document.cookie.split(';').map(c => c.trim());
    const hasAuthCookies = cookies.some(
      c => c.includes('sb-') && (c.includes('auth-token') || c.includes('auth'))
    );

    if (!hasAuthCookies) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  } catch {
    // Non-fatal: the API will return 401 if session is truly missing
  }
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [rawCompanies, setRawCompanies] = useState<RawCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Track whether we already have a successful fetch so we don't re-fetch
  // on every auth-state event (e.g. TOKEN_REFRESHED).
  const hasFetchedRef = useRef(false);

  const fetchActiveCompany = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);

      await ensureSessionInCookies();

      const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`/api/user/companies${cacheBuster}`, {
          cache: 'no-store',
          signal: controller.signal,
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
          setCompany(null);
          setRawCompanies([]);
          setIsLoading(false);
          return;
        }

        const data = await response.json();

        if (response.ok && data.success) {
          const allRaw: RawCompany[] = data.companies ?? [];
          const validRaw = allRaw.filter(c => !isInvalidCompany(c.company_name || ''));

          setRawCompanies(validRaw);

          const activeCompanyId: string | null = data.active_company_id ?? null;

          if (activeCompanyId) {
            const activeRaw = allRaw.find(c => c.company_id === activeCompanyId);
            if (activeRaw && !isInvalidCompany(activeRaw.company_name || '')) {
              setCompany(toCompany(activeRaw));
            } else {
              // Active company is invalid — fall back to first valid
              setCompany(validRaw.length > 0 ? toCompany(validRaw[0]) : null);
            }
          } else {
            setCompany(validRaw.length > 0 ? toCompany(validRaw[0]) : null);
          }
        } else {
          setCompany(null);
          setRawCompanies([]);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name !== 'AbortError') {
          throw fetchError;
        }
        setCompany(null);
        setRawCompanies([]);
      }
    } catch {
      setCompany(null);
      setRawCompanies([]);
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
        cache: 'no-store',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Optimistically update the active company from the existing list
        const matchingRaw = rawCompanies.find(c => c.company_id === companyId);
        const newActive: Company = matchingRaw
          ? toCompany(matchingRaw)
          : { id: companyId, name: data.company_name || 'Company', logo_url: null, role: 'member' };

        setCompany(newActive);

        queryClient.invalidateQueries();
        queryClient.clear();

        router.refresh();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('company-switched', {
              detail: { companyId, companyName: data.company_name },
            })
          );
        }

        // Fetch full details after a short delay to ensure DB propagation
        setTimeout(() => {
          fetchActiveCompany(true).catch(() => {});
        }, 300);

        toast({
          title: 'Company Switched',
          description: `Now viewing ${data.company_name}. All features refreshed.`,
        });
      } else {
        throw new Error(data.error || 'Failed to switch company');
      }
    } catch (error: any) {
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

  // Fetch with retry: if the API returns 401 (session cookie not yet
  // propagated to the server), wait and retry up to 3 times with
  // exponential backoff before giving up.
  const fetchWithRetry = async (forceRefresh = false, attempt = 0): Promise<void> => {
    await ensureSessionInCookies();
    const cacheBuster = forceRefresh || attempt > 0 ? `?t=${Date.now()}` : '';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`/api/user/companies${cacheBuster}`, {
        cache: 'no-store',
        signal: controller.signal,
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      clearTimeout(timeoutId);

      if (response.status === 401) {
        if (attempt < 3) {
          // Exponential backoff: 600 ms, 1 200 ms, 2 400 ms
          const delay = 600 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(true, attempt + 1);
        }
        // Exhausted retries — session is genuinely absent
        setCompany(null);
        setRawCompanies([]);
        return;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        hasFetchedRef.current = true;
        const allRaw: RawCompany[] = data.companies ?? [];
        const validRaw = allRaw.filter(c => !isInvalidCompany(c.company_name || ''));
        setRawCompanies(validRaw);
        const activeCompanyId: string | null = data.active_company_id ?? null;
        if (activeCompanyId) {
          const activeRaw = allRaw.find(c => c.company_id === activeCompanyId);
          if (activeRaw && !isInvalidCompany(activeRaw.company_name || '')) {
            setCompany(toCompany(activeRaw));
          } else {
            setCompany(validRaw.length > 0 ? toCompany(validRaw[0]) : null);
          }
        } else {
          setCompany(validRaw.length > 0 ? toCompany(validRaw[0]) : null);
        }
      } else {
        setCompany(null);
        setRawCompanies([]);
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name !== 'AbortError') {
        setCompany(null);
        setRawCompanies([]);
      }
    }
  };

  useEffect(() => {
    const supabase = createClient();
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      // Check whether a session already exists (e.g. page refresh with valid cookie)
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Session already present — fetch immediately
        setIsLoading(true);
        await fetchWithRetry().catch(() => {});
        setIsLoading(false);
      } else {
        // No session yet — wait for SIGNED_IN event (post-login navigation)
        // Keep isLoading=true so the UI shows a spinner rather than empty state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event) => {
            if (event === 'SIGNED_IN' && !hasFetchedRef.current) {
              setIsLoading(true);
              await fetchWithRetry().catch(() => {});
              setIsLoading(false);
            }
          }
        );
        unsubscribe = () => subscription.unsubscribe();

        // Safety: if SIGNED_IN never fires within 6 s, stop the spinner
        setTimeout(() => {
          setIsLoading(current => (current ? false : current));
        }, 6000);
      }
    };

    init();

    // Safety timeout: prevent loading state from blocking the UI indefinitely
    const safetyTimeout = setTimeout(() => {
      setIsLoading(current => (current ? false : current));
    }, 8000);

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        company,
        companyId: company?.id ?? null,
        rawCompanies,
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
