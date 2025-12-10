'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth, useSupabase } from '@/app/providers';
import { usePermissions } from '@/hooks/use-permissions';

export type UserRoleType = 'employer' | 'employee' | 'admin' | 'manager' | 'viewer';

interface RoleContextType {
  userRole: UserRoleType;
  isEmployer: boolean;
  isEmployee: boolean;
  isAdmin: boolean;
  isManager: boolean;
  employerId: string | null;
  userId: string | null;
  canViewAll: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManageAssignments: boolean;
  canViewAnalytics: boolean;
  canBulkActions: boolean;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function useRoleContext() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRoleContext must be used within RoleContextProvider');
  }
  return context;
}

interface RoleContextProviderProps {
  children: ReactNode;
}

export function RoleContextProvider({ children }: RoleContextProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const { session, supabase } = useSupabase();
  const { role, canRead, canCreate, canUpdate, canDelete, isAdmin, isManager } = usePermissions();

  const roleContext = useMemo<RoleContextType>(() => {
    // Determine user role type
    const userRoleMetadata = user?.user_metadata || {};
    const userRoleFromMetadata = userRoleMetadata.role as string;
    const employerIdFromMetadata = userRoleMetadata.employer_id as string | null;
    const companyIdFromMetadata = userRoleMetadata.company_id as string | null;
    
    // Determine if user is employer or employee
    // Employers typically have: employer_id, company_id, or role === 'employer' | 'manager' | 'admin'
    // Employees typically have: role === 'promoter' | 'employee' | 'user'
    let userRoleType: UserRoleType = 'viewer';
    let isEmployerUser = false;
    let isEmployeeUser = false;
    let employerId: string | null = null;

    if (authLoading || !user) {
      return {
        userRole: 'viewer',
        isEmployer: false,
        isEmployee: false,
        isAdmin: false,
        isManager: false,
        employerId: null,
        userId: null,
        canViewAll: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
        canManageAssignments: false,
        canViewAnalytics: false,
        canBulkActions: false,
      };
    }

    // Check role hierarchy
    if (isAdmin()) {
      userRoleType = 'admin';
      isEmployerUser = true; // Admins can act as employers
    } else if (isManager()) {
      userRoleType = 'manager';
      isEmployerUser = true; // Managers can act as employers
    } else if (userRoleFromMetadata === 'employer' || employerIdFromMetadata || companyIdFromMetadata || sessionEmployerId || sessionCompanyId) {
      userRoleType = 'employer';
      isEmployerUser = true;
      employerId = employerIdFromMetadata || companyIdFromMetadata || sessionEmployerId || sessionCompanyId || null;
    } else if (userRoleFromMetadata === 'promoter' || userRoleFromMetadata === 'employee' || role === 'promoter' || role === 'user') {
      userRoleType = 'employee';
      isEmployeeUser = true;
    } else {
      userRoleType = 'viewer';
    }

    // Permissions based on role
    const canViewAllPromoters = isAdmin() || isManager() || isEmployerUser;
    const canCreatePromoters = canCreate('promoter') || isAdmin() || isManager();
    const canEditPromoters = canUpdate('promoter') || isAdmin() || isManager();
    const canDeletePromoters = canDelete('promoter') || isAdmin();
    const canExportData = canRead('promoter') || isAdmin() || isManager() || isEmployerUser;
    const canManageAssignments = isAdmin() || isManager() || isEmployerUser;
    const canViewAnalyticsData = isAdmin() || isManager() || isEmployerUser;
    const canPerformBulkActions = isAdmin() || isManager() || isEmployerUser;

    return {
      userRole: userRoleType,
      isEmployer: isEmployerUser,
      isEmployee: isEmployeeUser,
      isAdmin: isAdmin(),
      isManager: isManager(),
      employerId,
      userId: user?.id || null,
      canViewAll: canViewAllPromoters,
      canCreate: canCreatePromoters,
      canEdit: canEditPromoters,
      canDelete: canDeletePromoters,
      canExport: canExportData,
      canManageAssignments: canManageAssignments,
      canViewAnalytics: canViewAnalyticsData,
      canBulkActions: canPerformBulkActions,
    };
  }, [user, authLoading, role, canRead, canCreate, canUpdate, canDelete, isAdmin, isManager]);

  return (
    <RoleContext.Provider value={roleContext}>
      {children}
    </RoleContext.Provider>
  );
}

