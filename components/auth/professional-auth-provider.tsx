'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  ProfessionalAuthService,
  AuthState,
  SecurityContext,
} from '@/lib/auth/professional-auth-service';
import { useToast } from '@/hooks/use-toast';

// ========================================
// 🏢 PROFESSIONAL AUTH PROVIDER CONTEXT
// ========================================

interface ProfessionalAuthContextType extends AuthState {
  // Basic Authentication
  signIn: (
    email: string,
    password: string,
    options?: {
      rememberDevice?: boolean;
      requireMFA?: boolean;
      deviceName?: string;
    }
  ) => Promise<{ success: boolean; error?: string; requiresMFA?: boolean }>;

  signUp: (
    email: string,
    password: string,
    userData?: any
  ) => Promise<{ success: boolean; error?: string }>;

  signOut: () => Promise<void>;

  // Advanced Authentication
  signInWithMFA: (
    token: string,
    backupCode?: string
  ) => Promise<{ success: boolean; error?: string }>;

  signInWithBiometric: () => Promise<{ success: boolean; error?: string }>;

  signInWithSSO: (
    provider: string
  ) => Promise<{ success: boolean; error?: string }>;

  // MFA Management
  enableMFA: () => Promise<{
    success: boolean;
    qrCode?: string;
    backupCodes?: string[];
    error?: string;
  }>;

  verifyMFASetup: (
    token: string
  ) => Promise<{ success: boolean; error?: string }>;

  disableMFA: (
    password: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Device Management
  getTrustedDevices: () => Promise<any[]>;

  trustCurrentDevice: () => Promise<{ success: boolean; error?: string }>;

  removeTrustedDevice: (
    deviceId: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Security Management
  getSecurityEvents: (limit?: number) => Promise<any[]>;

  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;

  enableBiometric: () => Promise<{ success: boolean; error?: string }>;

  disableBiometric: () => Promise<{ success: boolean; error?: string }>;

  // Session Management
  refreshSession: () => Promise<void>;

  terminateAllSessions: () => Promise<void>;

  terminateSession: (sessionId: string) => Promise<void>;

  // Security Status
  getSecurityScore: () => Promise<number>;

  getSecurityRecommendations: () => Promise<string[]>;

  // Compliance & Audit
  downloadSecurityReport: () => Promise<Blob>;

  requestDataExport: () => Promise<{ success: boolean; error?: string }>;

  requestAccountDeletion: () => Promise<{ success: boolean; error?: string }>;
}

const ProfessionalAuthContext =
  createContext<ProfessionalAuthContextType | null>(null);

// ========================================
// 🔒 PROFESSIONAL AUTH PROVIDER COMPONENT
// ========================================

interface ProfessionalAuthProviderProps {
  children: React.ReactNode;
  config?: {
    enableMFA?: boolean;
    enableBiometric?: boolean;
    enableDeviceTracking?: boolean;
    enableLocationTracking?: boolean;
    sessionTimeout?: number;
    maxConcurrentSessions?: number;
  };
}

export function ProfessionalAuthProvider({
  children,
  config = {},
}: ProfessionalAuthProviderProps) {
  const { toast } = useToast();
  const [authService] = useState(() => ProfessionalAuthService.getInstance());
  const [state, setState] = useState<AuthState>(authService.getState());

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.subscribe(newState => {
      setState(newState);
    });

    return unsubscribe;
  }, [authService]);

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session
        const existingSession = localStorage.getItem('supabase.auth.token');
        if (existingSession) {
          await authService.refreshSession?.();
        }
      } catch (error) {
      }
    };

    initAuth();
  }, [authService]);

  // ========================================
  // 🔐 AUTHENTICATION METHODS
  // ========================================

  const signIn = useCallback(
    async (
      email: string,
      password: string,
      options?: {
        rememberDevice?: boolean;
        requireMFA?: boolean;
        deviceName?: string;
      }
    ) => {
      const result = await authService.signInWithCredentials(
        email,
        password,
        options
      );

      if (result.success) {
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully signed in.',
        });
      } else if (result.requiresMFA) {
        toast({
          title: 'Additional verification required',
          description: 'Please complete two-factor authentication.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Sign in failed',
          description:
            result.error || 'Please check your credentials and try again.',
          variant: 'destructive',
        });
      }

      return result;
    },
    [authService, toast]
  );

  const signUp = useCallback(
    async (email: string, password: string, userData?: any) => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: userData },
        });
        if (signUpError) throw signUpError;
        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account.',
        });
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Signup failed';
        toast({
          title: 'Signup failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: errorMessage };
      }
    },
    [toast]
  );

  const signOut = useCallback(async () => {
    try {
      await authService.terminateSession();
      toast({
        title: 'Signed out',
        description: 'You have been securely signed out.',
      });
    } catch (error) {
      toast({
        title: 'Signout error',
        description: 'There was an issue signing you out.',
        variant: 'destructive',
      });
    }
  }, [authService, toast]);

  // ========================================
  // 🛡️ MFA METHODS
  // ========================================

  const signInWithMFA = useCallback(
    async (token: string, backupCode?: string) => {
      const result = await authService.signInWithMFA(token, backupCode);

      if (result.success) {
        toast({
          title: 'Verification successful',
          description: 'You have been successfully authenticated.',
        });
      } else {
        toast({
          title: 'Verification failed',
          description: result.error || 'Invalid verification code.',
          variant: 'destructive',
        });
      }

      return result;
    },
    [authService, toast]
  );

  const enableMFA = useCallback(async () => {
    const result = await authService.enableMFA();

    if (result.success) {
      toast({
        title: 'MFA setup initiated',
        description: 'Scan the QR code with your authenticator app.',
      });
    } else {
      toast({
        title: 'MFA setup failed',
        description:
          result.error || 'Unable to set up two-factor authentication.',
        variant: 'destructive',
      });
    }

    return result;
  }, [authService, toast]);

  const verifyMFASetup = useCallback(
    async (token: string) => {
      const result = await authService.verifyMFASetup(token);

      if (result.success) {
        toast({
          title: 'MFA enabled',
          description:
            'Two-factor authentication has been successfully enabled.',
        });
      } else {
        toast({
          title: 'Verification failed',
          description: result.error || 'Invalid verification code.',
          variant: 'destructive',
        });
      }

      return result;
    },
    [authService, toast]
  );

  const disableMFA = useCallback(
    async (password: string) => {
      const result = await authService.disableMFA(password);

      if (result.success) {
        toast({
          title: 'MFA disabled',
          description: 'Two-factor authentication has been disabled.',
        });
      } else {
        toast({
          title: 'Failed to disable MFA',
          description:
            result.error || 'Unable to disable two-factor authentication.',
          variant: 'destructive',
        });
      }

      return result;
    },
    [authService, toast]
  );

  // ========================================
  // 🔬 BIOMETRIC METHODS
  // ========================================

  const signInWithBiometric = useCallback(async () => {
    const result = await authService.signInWithBiometric();

    if (result.success) {
      toast({
        title: 'Biometric authentication successful',
        description: 'You have been authenticated using biometrics.',
      });
    } else {
      toast({
        title: 'Biometric authentication failed',
        description:
          result.error || 'Biometric authentication not available or failed.',
        variant: 'destructive',
      });
    }

    return result;
  }, [authService, toast]);

  const enableBiometric = useCallback(async () => {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        return { success: false, error: 'Biometric authentication is not supported on this device.' };
      }
      // Use WebAuthn credential creation
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'Contract Management System' },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: authState.user?.email ?? 'user',
            displayName: authState.user?.email ?? 'user',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      });
      if (credential) {
        // Store credential ID in localStorage for future use
        localStorage.setItem('biometric_credential_id', (credential as PublicKeyCredential).id);
        toast({
          title: 'Biometric authentication enabled',
          description: 'You can now use biometric authentication.',
        });
        return { success: true };
      }
      return { success: false, error: 'Biometric enrollment was cancelled.' };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to enable biometric authentication';
      toast({
        title: 'Biometric setup failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  }, [toast, authState.user]);

  const disableBiometric = useCallback(async () => {
    try {
      // Remove stored credential ID
      localStorage.removeItem('biometric_credential_id');
      toast({
        title: 'Biometric authentication disabled',
        description: 'Biometric authentication has been disabled.',
      });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to disable biometric authentication';
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  // ========================================
  // 📱 DEVICE MANAGEMENT METHODS
  // ========================================

  const getTrustedDevices = useCallback(async () => {
    try {
      // Retrieve trusted devices from server
      const response = await fetch('/api/auth/devices');
      if (!response.ok) return [];
      const data = await response.json();
      return data.devices ?? [];
    } catch {
      return [];
    }
  }, []);

  const trustCurrentDevice = useCallback(async () => {
    try {
      await fetch('/api/auth/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trust' }),
      });
      toast({
        title: 'Device trusted',
        description: 'This device has been marked as trusted.',
      });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to trust device';
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const removeTrustedDevice = useCallback(
    async (deviceId: string) => {
      try {
        await fetch(`/api/auth/devices?id=${deviceId}`, { method: 'DELETE' });
        toast({
          title: 'Device removed',
          description: 'The trusted device has been removed.',
        });
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to remove device';
        return { success: false, error: errorMessage };
      }
    },
    [toast]
  );

  // ========================================
  // 🔐 SECURITY METHODS
  // ========================================

  const getSecurityEvents = useCallback(async (limit = 50) => {
    try {
      const res = await fetch(`/api/auth/security-events?limit=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.events || [];
    } catch {
      return [];
    }
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to change password');
        toast({
          title: 'Password updated',
          description: 'Your password has been successfully changed.',
        });
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to change password';
        toast({
          title: 'Password change failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: errorMessage };
      }
    },
    [toast]
  );

  const getSecurityScore = useCallback(async () => {
    try {
      let score = 50; // Base score
      if (state.user) {
        // +20 for verified email
        if (state.user.email_confirmed_at) score += 20;
        // +20 for MFA enabled
        const factors = await state.user.factors;
        if (factors && Array.isArray(factors) && factors.length > 0) score += 20;
        // +10 for recent login (within 30 days)
        const lastSignIn = state.user.last_sign_in_at;
        if (lastSignIn) {
          const daysSinceLogin = (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLogin < 30) score += 10;
        }
      }
      return Math.min(score, 100);
    } catch {
      return 50;
    }
  }, [state.user]);

  const getSecurityRecommendations = useCallback(async () => {
    try {
      const recommendations: string[] = [];

      if (!state.mfaRequired) {
        recommendations.push(
          'Enable two-factor authentication for enhanced security'
        );
      }

      if (!state.deviceTrusted) {
        recommendations.push('Trust this device for faster future logins');
      }

      return recommendations;
    } catch (error) {
      return [];
    }
  }, [state]);

  // ========================================
  // 📊 SESSION MANAGEMENT METHODS
  // ========================================

  const refreshSession = useCallback(async () => {
    try {
      await authService.refreshSession?.();
    } catch (error) {
      await signOut();
    }
  }, [authService, signOut]);

  const terminateAllSessions = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut({ scope: 'global' });
      toast({
        title: 'All sessions terminated',
        description: 'You have been signed out from all devices.',
      });
    } catch {
    }
  }, [toast]);

  const terminateSession = useCallback(
    async (sessionId: string) => {
      try {
        await fetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
        toast({
          title: 'Session terminated',
          description: 'The selected session has been terminated.',
        });
      } catch {
      }
    },
    [toast]
  );

  // ========================================
  // 📋 SSO METHODS
  // ========================================

  const signInWithSSO = useCallback(
    async (provider: string) => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { error: ssoError } = await supabase.auth.signInWithOAuth({
          provider: provider as any,
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (ssoError) throw ssoError;
        toast({
          title: `${provider} authentication initiated`,
          description: 'Please complete the authentication in the popup window.',
        });
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'SSO authentication failed';
        toast({
          title: 'SSO authentication failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: errorMessage };
      }
    },
    [toast]
  );

  // ========================================
  // 📊 COMPLIANCE METHODS
  // ========================================

  const downloadSecurityReport = useCallback(async () => {
    try {
      const reportData = {
        user: state.user,
        securityEvents: await getSecurityEvents(100),
        trustedDevices: await getTrustedDevices(),
        securityScore: await getSecurityScore(),
        generatedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json',
      });

      return blob;
    } catch (error) {
      throw error;
    }
  }, [state.user, getSecurityEvents, getTrustedDevices, getSecurityScore]);

  const requestDataExport = useCallback(async () => {
    try {
      await fetch('/api/user/data-export', { method: 'POST' });
      toast({
        title: 'Data export requested',
        description: 'Your data export will be available within 24 hours.',
      });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to request data export';
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const requestAccountDeletion = useCallback(async () => {
    try {
      await fetch('/api/user/account-deletion', { method: 'POST' });
      toast({
        title: 'Account deletion requested',
        description:
          'Your account will be deleted within 30 days. You can cancel this request until then.',
        variant: 'destructive',
      });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to request account deletion';
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  // ========================================
  // 🎯 CONTEXT VALUE
  // ========================================

  const contextValue: ProfessionalAuthContextType = {
    // State
    ...state,

    // Basic Authentication
    signIn,
    signUp,
    signOut,

    // Advanced Authentication
    signInWithMFA,
    signInWithBiometric,
    signInWithSSO,

    // MFA Management
    enableMFA,
    verifyMFASetup,
    disableMFA,

    // Device Management
    getTrustedDevices,
    trustCurrentDevice,
    removeTrustedDevice,

    // Security Management
    getSecurityEvents,
    changePassword,
    enableBiometric,
    disableBiometric,

    // Session Management
    refreshSession,
    terminateAllSessions,
    terminateSession,

    // Security Status
    getSecurityScore,
    getSecurityRecommendations,

    // Compliance & Audit
    downloadSecurityReport,
    requestDataExport,
    requestAccountDeletion,
  };

  return (
    <ProfessionalAuthContext.Provider value={contextValue}>
      {children}
    </ProfessionalAuthContext.Provider>
  );
}

// ========================================
// 🪝 CUSTOM HOOK
// ========================================

export function useProfessionalAuth(): ProfessionalAuthContextType {
  const context = useContext(ProfessionalAuthContext);

  if (!context) {
    throw new Error(
      'useProfessionalAuth must be used within a ProfessionalAuthProvider'
    );
  }

  return context;
}

// ========================================
// 🛡️ SECURITY GUARD COMPONENT
// ========================================

interface SecurityGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireMFA?: boolean;
  allowedRoles?: string[];
  minSecurityScore?: number;
  fallback?: React.ReactNode;
}

export function SecurityGuard({
  children,
  requireAuth = true,
  requireMFA = false,
  allowedRoles = [],
  minSecurityScore = 0,
  fallback = null,
}: SecurityGuardProps) {
  const auth = useProfessionalAuth();
  const [securityScore, setSecurityScore] = useState<number>(0);

  useEffect(() => {
    if (auth.user) {
      auth.getSecurityScore().then(setSecurityScore);
    }
  }, [auth.user, auth]);

  // Check authentication requirement
  if (requireAuth && !auth.user) {
    return fallback || <div>Authentication required</div>;
  }

  // Check MFA requirement
  if (requireMFA && auth.mfaRequired) {
    return fallback || <div>Multi-factor authentication required</div>;
  }

  // Check role requirement
  if (allowedRoles.length > 0 && auth.user) {
    const userRole = (auth.user as any).user_metadata?.role || (auth.user as any).role;
    if (userRole && !allowedRoles.includes(userRole)) {
      return fallback || <div>Insufficient permissions</div>;
    }
  }

  // Check security score requirement
  if (minSecurityScore > 0 && securityScore < minSecurityScore) {
    return fallback || <div>Security requirements not met</div>;
  }

  return <>{children}</>;
}
