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

  // Request timeout: allow enough time for minimal=1 (including admin's all-employer-parties query).
  const FETCH_TIMEOUT_MS = 40_000;

  const fetchWithTimeout = useCallback(
    (url: string, options?: RequestInit): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      return fetch(url, {
        ...options,
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache', ...options?.headers },
      }).finally(() => clearTimeout(timeoutId));
    },
    []
  );

  // Primary: GET /api/user/companies?minimal=1 (all sources: memberships, owned, user_roles, parties). Fallback: list then parties.
  const fetchCompaniesFromParties = useCallback(async (): Promise<boolean> => {
    const applyCompanies = (companies: any[], activeId: string | null) => {
      const allRaw: RawCompany[] = companies.map((c: any) => ({
        company_id: c.company_id,
        company_name: c.company_name || 'Company',
        company_logo: c.company_logo ?? null,
        user_role: c.user_role || 'member',
        is_primary: c.is_primary ?? c.company_id === activeId,
        group_name: c.group_name ?? null,
      }));
      hasFetchedRef.current = true;
      setLoadError(null);
      setCurrentCompanyDisplay(null);
      setRawCompanies(allRaw);
      const activeRaw = allRaw.find(c => c.company_id === activeId);
      setCompany(
        activeRaw
          ? toCompany(activeRaw)
          : allRaw.length > 0
            ? toCompany(allRaw[0])
            : null
      );
    };

    try {
      // 1) Try lightweight list first (single query, fastest) so we avoid timeout when possible
      const listRes = await fetchWithTimeout(
        `/api/user/companies/list?t=${Date.now()}`
      );
      const listData = await listRes.json().catch(() => ({}));
      const listCompanies = Array.isArray(listData.companies)
        ? listData.companies
        : [];
      const listActiveId =
        listData.active_company_id ?? (listData as any).active_company_id ?? null;
      if (listRes.ok && listData.success === true && listCompanies.length > 0) {
        applyCompanies(listCompanies, listActiveId);
        return true;
      }

      // 2) Try main companies API with minimal=1 (memberships, roles, admin-all-parties)
      const companiesRes = await fetchWithTimeout(
        `/api/user/companies?minimal=1&t=${Date.now()}`
      );
      const companiesData = await companiesRes.json().catch(() => ({}));
      const companies = Array.isArray(companiesData.companies)
        ? companiesData.companies
        : [];
      const activeId =
        companiesData.active_company_id ??
        (companiesData as any).active_company_id ??
        null;

      if (companiesRes.ok && companiesData.success === true) {
        applyCompanies(companies, activeId);
        return true;
      }

      // 3) Fallback: parties API (slow, contract counts)
      const [partiesRes, currentRes] = await Promise.all([
        fetchWithTimeout(
          `/api/parties?type=Employer&limit=500&t=${Date.now()}`
        ),
        fetchWithTimeout('/api/user/companies/current'),
      ]);
      const partiesData = await partiesRes.json().catch(() => ({}));
      const currentData = await currentRes.json().catch(() => ({}));
      const parties = Array.isArray(partiesData.parties)
        ? partiesData.parties
        : [];
      const fallbackActiveId = currentData.company_id ?? null;
      if (parties.length === 0) return false;
      const fallbackCompanies = parties.map((p: any) => ({
        company_id: p.id,
        company_name: p.name_en || p.name_ar || 'Company',
        company_logo: p.logo_url ?? null,
        user_role: 'member',
        is_primary: p.id === fallbackActiveId,
        group_name: null,
      }));
      applyCompanies(fallbackCompanies, fallbackActiveId);
      return true;
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        throw new Error('Request timed out. Click to retry.');
      }
      return false;
    }
  }, [fetchWithTimeout]);

  // ─── Fetch companies list (same source as Manage Parties) ───────────────────
  const fetchActiveCompany = useCallback(async (forceRefresh = false, silent = false): Promise<void> => {
    let loadingGuardId: ReturnType<typeof setTimeout> | null = null;
    try {
      if (!silent) {
        setIsLoading(true);
        setLoadError(null);
        loadingGuardId = setTimeout(() => {
          setIsLoading(false);
          setLoadError(prev => (prev ? prev : 'Request timed out. Click to retry.'));
        }, FETCH_TIMEOUT_MS + 5_000); // Slightly longer than fetch timeout so we show "timed out" after fetch aborts
      }

      await ensureSessionInCookies();

      let used = await fetchCompaniesFromParties();
      if (!used && !forceRefresh) {
        await new Promise(r => setTimeout(r, 1500)); // retry once after 1.5s (cold start)
        used = await fetchCompaniesFromParties();
      }
      if (used) {
        if (loadingGuardId) clearTimeout(loadingGuardId);
        if (!silent) setIsLoading(false);
        return;
      }

      if (!silent) setLoadError('No companies found. Add employers in Manage Parties or retry.');
      setCompany(null);
      setRawCompanies([]);
    } catch (err: any) {
      const isTimeout = err?.message?.includes('timed out');
      if (!silent) {
        setLoadError(err?.message || 'Failed to load companies');
        setCompany(null);
        setRawCompanies([]);
      }
      // On timeout (e.g. server cold start), retry once after a short delay before showing error
      if (isTimeout && !silent) {
        await new Promise(r => setTimeout(r, 2000));
        const used = await fetchCompaniesFromParties();
        if (used && loadingGuardId) {
          clearTimeout(loadingGuardId);
          setLoadError(null);
        }
      } else if (!isTimeout) {
        const used = await fetchCompaniesFromParties();
        if (used && loadingGuardId) clearTimeout(loadingGuardId);
      }
    } finally {
      if (loadingGuardId) clearTimeout(loadingGuardId);
      if (!silent) setIsLoading(false);
    }
  }, [fetchCompaniesFromParties]);

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
