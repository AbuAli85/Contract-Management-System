import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export interface UserRole {
  role: string;
  isValid: boolean;
  userId?: string;
}

/**
 * Securely verify user authentication and get role from server-side validation
 * This replaces the insecure cookie-based role checking
 */
export async function verifyUserRoleFromToken(request: NextRequest): Promise<UserRole> {
  try {
    // Get the access token from cookie (Supabase sets this automatically)
    const accessToken = request.cookies.get('sb-access-token')?.value;
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;
    
    if (!accessToken) {
      return { role: 'anonymous', isValid: false };
    }

    // Create Supabase client for server-side validation
    const supabase = createClient();
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log('Auth verification failed:', authError?.message);
      return { role: 'anonymous', isValid: false };
    }

    // Get user role from database (secure server-side check)
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRoles) {
      console.log('Role lookup failed:', roleError?.message);
      // Default to 'user' role if no specific role found
      return { role: 'user', isValid: true, userId: user.id };
    }

    return { 
      role: userRoles.role, 
      isValid: true, 
      userId: user.id 
    };

  } catch (error) {
    console.error('Role verification error:', error);
    return { role: 'anonymous', isValid: false };
  }
}

/**
 * Check if user has required role level for a given path
 */
export function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  // Role hierarchy (higher number = more permissions)
  const roleHierarchy: Record<string, number> = {
    'anonymous': 0,
    'user': 1,
    'client': 2,
    'provider': 3,
    'manager': 4,
    'admin': 5
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = Math.min(...requiredRoles.map(role => roleHierarchy[role] || 999));

  return userLevel >= requiredLevel;
}
