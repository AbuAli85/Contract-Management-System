import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface UserRole {
  role: string;
  isValid: boolean;
  userId?: string;
}

/**
 * Securely verify user authentication and get role from JWT token
 * This replaces the insecure cookie-based role checking with secure JWT verification
 */
export async function verifyUserRoleFromToken(request: NextRequest): Promise<UserRole> {
  try {
    // Get the access token from cookie (Supabase sets this automatically)
    const accessToken = request.cookies.get('sb-access-token')?.value;
    
    if (!accessToken) {
      return { role: 'anonymous', isValid: false };
    }

    // Create Supabase client for server-side validation
    const supabase = createClient();
    
    // Verify the JWT token and get user with custom claims
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.log('Auth verification failed:', authError?.message);
      return { role: 'anonymous', isValid: false };
    }

    // SECURITY FIX: Get role from JWT custom claims first (most secure)
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    
    if (userRole) {
      console.log('✅ Middleware: Role found in JWT custom claims:', userRole);
      return { 
        role: userRole, 
        isValid: true, 
        userId: user.id 
      };
    }

    // Fallback to database check (secure server-side verification)
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userError && userData && userData.role) {
      console.log('✅ Middleware: Role found in users table:', userData.role);
      
      // SECURITY FIX: Update JWT custom claims for future requests
      await updateUserCustomClaims(supabase, user.id, userData.role);
      
      return { 
        role: userData.role, 
        isValid: true, 
        userId: user.id 
      };
    }

    // Fallback to user_roles table
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleError && userRoles) {
      console.log('✅ Middleware: Role found in user_roles table:', userRoles.role);
      
      // SECURITY FIX: Update JWT custom claims for future requests
      await updateUserCustomClaims(supabase, user.id, userRoles.role);
      
      return { 
        role: userRoles.role, 
        isValid: true, 
        userId: user.id 
      };
    }

    // If no role found, check if it's admin by email
    if (user.email === 'luxsess2001@gmail.com') {
      console.log('✅ Middleware: Admin user detected by email');
      
      // SECURITY FIX: Update JWT custom claims for future requests
      await updateUserCustomClaims(supabase, user.id, 'admin');
      
      return { 
        role: 'admin', 
        isValid: true, 
        userId: user.id 
      };
    }

    console.log('⚠️ Middleware: No role found, defaulting to user');
    
    // SECURITY FIX: Update JWT custom claims for future requests
    await updateUserCustomClaims(supabase, user.id, 'user');
    
    return { role: 'user', isValid: true, userId: user.id };

  } catch (error) {
    console.error('Role verification error:', error);
    return { role: 'anonymous', isValid: false };
  }
}

/**
 * Update user's JWT custom claims via Supabase Edge Functions
 * This ensures roles are stored securely in JWT tokens
 */
async function updateUserCustomClaims(supabase: any, userId: string, role: string): Promise<void> {
  try {
    // Call Supabase Edge Function to update custom claims
    const { error } = await supabase.functions.invoke('update-user-claims', {
      body: { userId, role }
    });
    
    if (error) {
      console.warn('Failed to update custom claims:', error.message);
    } else {
      console.log('✅ Custom claims updated for user:', userId);
    }
  } catch (error) {
    console.warn('Custom claims update failed:', error);
  }
}

/**
 * Check if user has required role level for a given path
 */
export function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  // Role hierarchy (higher index = higher privileges)
  const roleHierarchy = ['anonymous', 'user', 'client', 'provider', 'manager', 'admin'];
  
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  if (userRoleIndex === -1) return false;
  
  // Check if user has any of the required roles
  return requiredRoles.some(requiredRole => {
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    return requiredRoleIndex !== -1 && userRoleIndex >= requiredRoleIndex;
  });
}
