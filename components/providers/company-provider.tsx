'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/** Minimal company shape used throughout the app */
export interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  role: string;
}

/** Current company display when full list failed — from GET /api/user/companies/current */
export interface CurrentCompanyDisplay {
  company_id: string;
  company_name: string;
  company_logo: string | null;
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
  /** Error message when companies failed to load (e.g. network) — show Retry in UI */
  loadError: string | null;
  /** When list failed or empty, display name for "Showing for: [name]" from /api/user/companies/current */
  currentCompanyDisplay: CurrentCompanyDisplay | null;
  /** True while a company switch is in progress — use to disable the switcher UI */
  isSwitching: boolean;
  switchCompany: (companyId: string) => Promise<void>;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

function toCompany(raw: RawCompany): Company {
  return {
    id: raw.company_id,
    name: raw.company_name,
    logo_url: raw.company_logo ?? null,
    role: raw.user_role || 'member',
  };
}

/**
 * Ensure the Supabase session cookie is present before making API calls.
 * This is needed because Next.js middleware may strip cookies on the first
 * request after login.
 */
async function ensureSessionInCookies(): Promise<void> {
  try {
    const supabase = createClient();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentCompanyDisplay, setCurrentCompanyDisplay] = useState<CurrentCompanyDisplay | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Prevent duplicate fetches on TOKEN_REFRESHED events
  const hasFetchedRef = useRef(false);
  const autoRetryDoneRef = useRef(false);

  // Fallback: same data as Manage Parties (GET /api/parties?type=Employer) when list endpoint fails
  const fetchCompaniesFromPartiesFallback = useCallback(async (): Promise<boolean> => {
    try {
      const [partiesRes, currentRes] = await Promise.all([
        fetch('/api/parties?type=Employer&limit=500', {
          cache: 'no-store',
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch('/api/user/companies/current', {
          cache: 'no-store',
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' },
        }),
      ]);
      const partiesData = await partiesRes.json().catch(() => ({}));
      const currentData = await currentRes.json().catch(() => ({}));
      const parties = Array.isArray(partiesData.parties) ? partiesData.parties : [];
      const activeId = currentData.company_id ?? null;
      if (parties.length === 0) return false;
      const allRaw: RawCompany[] = parties.map((p: any) => ({
        company_id: p.id,
        company_name: p.name_en || p.name_ar || 'Company',
        company_logo: p.logo_url ?? null,
        user_role: 'member',
        is_primary: p.id === activeId,
        group_name: null,
      }));
      hasFetchedRef.current = true;
      setLoadError(null);
      setCurrentCompanyDisplay(null);
      setRawCompanies(allRaw);
      const activeRaw = allRaw.find(c => c.company_id === activeId);
      setCompany(activeRaw ? toCompany(activeRaw) : allRaw.length > 0 ? toCompany(allRaw[0]) : null);
      return true;
    } catch {
      return false;
    }
  }, []);

  // ─── Fetch companies list ──────────────────────────────────────────────────
  const fetchActiveCompany = useCallback(async (forceRefresh = false, silent = false): Promise<void> => {
    let loadingGuardId: ReturnType<typeof setTimeout> | null = null;
    try {
      if (!silent) {
        setIsLoading(true);
        setLoadError(null);
        // Hard cap: never show loading longer than fetch timeout (in case ensureSessionInCookies or fetch hangs)
        loadingGuardId = setTimeout(() => {
          setIsLoading(false);
          setLoadError(prev => (prev ? prev : 'Request timed out. Click to retry.'));
        }, 18_000); // Slightly longer than fetch timeout (15s) so we don't show timeout before request can complete
      }

      await ensureSessionInCookies();

      // Use list endpoint: same employer parties as Manage Parties, 2 queries only, no timeout
      const url = `/api/user/companies/list${forceRefresh ? `?t=${Date.now()}` : ''}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s is enough for 2 queries

      const response = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      clearTimeout(timeoutId);

      if (response.status === 401) {
        setCompany(null);
        setRawCompanies([]);
        if (!silent) {
          // One automatic retry after re-ensuring session (cookie race after login)
          if (!forceRefresh) {
            await new Promise(r => setTimeout(r, 800));
            await ensureSessionInCookies();
            const retryRes = await fetch(`/api/user/companies/list?t=${Date.now()}`, {
              cache: 'no-store',
              credentials: 'include',
              headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
            });
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              if (retryData.success && Array.isArray(retryData.companies)) {
                hasFetchedRef.current = true;
                setLoadError(null);
                setCurrentCompanyDisplay(null);
                setRawCompanies(retryData.companies);
                const activeId = retryData.active_company_id ?? null;
                const allRaw = retryData.companies;
                if (activeId) {
                  const activeRaw = allRaw.find((c: RawCompany) => c.company_id === activeId);
                  setCompany(activeRaw ? toCompany(activeRaw) : allRaw.length > 0 ? toCompany(allRaw[0]) : null);
                } else {
                  setCompany(allRaw.length > 0 ? toCompany(allRaw[0]) : null);
                }
                if (loadingGuardId) clearTimeout(loadingGuardId);
                setIsLoading(false);
                return;
              }
            }
          }
          setLoadError('Session expired or not found. Sign in again or retry.');
        }
        if (!silent && loadingGuardId) clearTimeout(loadingGuardId);
        return;
      }

      let data: { success?: boolean; companies?: RawCompany[]; active_company_id?: string | null };
      try {
        data = await response.json();
      } catch {
        if (!silent) setLoadError('Invalid response from server');
        setCompany(null);
        setRawCompanies([]);
        if (!silent && loadingGuardId) clearTimeout(loadingGuardId);
        return;
      }

      if (response.ok && data.success) {
        const allRaw: RawCompany[] = Array.isArray(data.companies) ? data.companies : [];
        if (allRaw.length > 0) {
          hasFetchedRef.current = true;
          setLoadError(null);
          setCurrentCompanyDisplay(null);
          setRawCompanies(allRaw);
          const activeId: string | null = data.active_company_id ?? null;
          if (activeId) {
            const activeRaw = allRaw.find(c => c.company_id === activeId);
            setCompany(
              activeRaw
                ? toCompany(activeRaw)
                : allRaw.length > 0
                  ? toCompany(allRaw[0])
                  : null
            );
          } else {
            setCompany(allRaw.length > 0 ? toCompany(allRaw[0]) : null);
          }
        } else {
          const used = await fetchCompaniesFromPartiesFallback();
          if (!used && !silent) setLoadError('No companies found. Retry or add employers in Manage Parties.');
        }
      } else {
        setCompany(null);
        setRawCompanies([]);
        if (!silent) setLoadError((data as any)?.message || 'Failed to load companies');
        const used = await fetchCompaniesFromPartiesFallback();
        if (used && loadingGuardId) clearTimeout(loadingGuardId);
      }
    } catch (err: any) {
      if (!silent) {
        if (err.name === 'AbortError') {
          setLoadError('Request timed out. Click to retry.');
        } else {
          setLoadError(err?.message || 'Failed to load companies');
        }
        setCompany(null);
        setRawCompanies([]);
      }
      const used = await fetchCompaniesFromPartiesFallback();
      if (used && loadingGuardId) clearTimeout(loadingGuardId);
    } finally {
      if (loadingGuardId) clearTimeout(loadingGuardId);
      if (!silent) setIsLoading(false);
    }
  }, [fetchCompaniesFromPartiesFallback]);

  // ─── Switch company ────────────────────────────────────────────────────────
  const switchCompany = useCallback(async (companyId: string): Promise<void> => {
    if (isSwitching) return;
    if (companyId === company?.id) return;

    setIsSwitching(true);
    try {
      const response = await fetch('/api/user/companies/switch', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ company_id: companyId }),
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data.error || data.details || 'Failed to switch company';
        throw new Error(typeof message === 'string' ? message : 'Failed to switch company');
      }

      // Optimistic update: set active company immediately so UI leaves loading state
      setCompany({
        id: data.company_id,
        name: data.company_name ?? 'Company',
        logo_url: data.company_logo ?? null,
        role: data.user_role ?? 'member',
      });
      setIsSwitching(false);

      // Invalidate React Query so data views refetch with new company
      queryClient.invalidateQueries();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('company-switched', {
            detail: { companyId, companyName: data.company_name },
          })
        );
      }

      const stayOnPromoters =
        typeof pathname === 'string' && pathname.includes('/promoters');
      if (stayOnPromoters) {
        router.push(`/${locale}/promoters`);
      } else {
        router.push(`/${locale}/dashboard/overview`);
      }
      router.refresh();

      toast({
        title: 'Company Switched',
        description: `Now viewing ${data.company_name}.`,
      });

      // Refetch companies list in background without showing loading (avoids UI flash)
      fetchActiveCompany(true, true).catch(() => {});
    } catch (error: any) {
      setIsSwitching(false);
      fetchActiveCompany(true).catch(() => {});
      toast({
        title: 'Switch Failed',
        description: error.message || 'Failed to switch company',
        variant: 'destructive',
      });
    }
  }, [isSwitching, company?.id, fetchActiveCompany, queryClient, router, locale, toast, pathname]);

  // ─── Refresh ───────────────────────────────────────────────────────────────
  const refreshCompany = useCallback(async () => {
    await fetchActiveCompany(true);
  }, [fetchActiveCompany]);

  // When companies failed to load (e.g. cookie timing), auto-retry once after 2s so "Could not load" can resolve
  useEffect(() => {
    if (!loadError || rawCompanies.length > 0) {
      autoRetryDoneRef.current = false;
      return;
    }
    if (autoRetryDoneRef.current) return;
    autoRetryDoneRef.current = true;
    const t = setTimeout(() => {
      fetchActiveCompany(true, true).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [loadError, rawCompanies.length, fetchActiveCompany]);

  // When list is empty or failed, fetch current company so UI can show "Showing for: [Name]"
  useEffect(() => {
    if (isLoading || (rawCompanies.length > 0 && !loadError)) {
      if (rawCompanies.length > 0) setCurrentCompanyDisplay(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/companies/current', {
          cache: 'no-store',
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.company_id && data.company_name) {
          setCurrentCompanyDisplay({
            company_id: data.company_id,
            company_name: data.company_name,
            company_logo: data.company_logo ?? null,
          });
        } else {
          setCurrentCompanyDisplay(null);
        }
      } catch {
        if (!cancelled) setCurrentCompanyDisplay(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, loadError, rawCompanies.length]);

  // ─── Initial load with auth-state awareness ────────────────────────────────
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
        await fetchActiveCompany().catch(() => {});
      } else {
        // No session yet — wait for SIGNED_IN event (post-login navigation)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event) => {
            if (event === 'SIGNED_IN' && !hasFetchedRef.current) {
              await fetchActiveCompany().catch(() => {});
            }
          }
        );
        unsubscribe = () => subscription.unsubscribe();

        // Safety: stop spinner after 6 s if SIGNED_IN never fires
        setTimeout(() => {
          setIsLoading(current => (current ? false : current));
        }, 6_000);
      }
    };

    init();

    // Hard safety timeout: never block the UI for more than 10 s (backstop if fetch hangs)
    const safetyTimeout = setTimeout(() => {
      setIsLoading(current => (current ? false : current));
    }, 10_000);

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe?.();
    };
  }, [fetchActiveCompany]);

  return (
    <CompanyContext.Provider
      value={{
        company,
        companyId: company?.id ?? null,
        rawCompanies,
        isLoading,
        loadError,
        currentCompanyDisplay,
        isSwitching,
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
