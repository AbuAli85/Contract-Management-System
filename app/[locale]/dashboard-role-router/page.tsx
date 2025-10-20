'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  User,
  Shield,
  Building2,
  Factory,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'client' | 'provider' | 'manager' | 'user';

interface RoleInfo {
  role: UserRole;
  displayName: string;
  description: string;
  icon: React.ReactNode;
  dashboardPath: string;
  color: string;
}

const roleConfig: Record<UserRole, RoleInfo> = {
  admin: {
    role: 'admin',
    displayName: 'Administrator',
    description: 'Full system access and management capabilities',
    icon: <Shield className='w-6 h-6' />,
    dashboardPath: '/dashboard/admin',
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  client: {
    role: 'client',
    displayName: 'Client',
    description: 'Manage contracts, view services, and track performance',
    icon: <Building2 className='w-6 h-6' />,
    dashboardPath: '/dashboard/client',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  provider: {
    role: 'provider',
    displayName: 'Provider',
    description: 'Manage services, promoters, and client relationships',
    icon: <Factory className='w-6 h-6' />,
    dashboardPath: '/dashboard/provider',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  manager: {
    role: 'manager',
    displayName: 'Manager',
    description: 'Oversee operations and team management',
    icon: <Settings className='w-6 h-6' />,
    dashboardPath: '/dashboard/manager',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  user: {
    role: 'user',
    displayName: 'User',
    description: 'Basic access to personal information and contracts',
    icon: <User className='w-6 h-6' />,
    dashboardPath: '/dashboard/user',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

export default function DashboardRoleRouter() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  // Fetch user role
  useEffect(() => {
    async function fetchUserRole() {
      if (!user) return;

      try {
        console.log('Fetching user role for dashboard routing...');
        const response = await fetch('/api/get-user-role');
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }

        const data = await response.json();
        const role = data.role?.value || 'user';
        console.log('User role detected:', role);
        setUserRole(role as UserRole);

        // Show role info for a moment before redirecting
        setTimeout(() => {
          setRedirecting(true);
          const targetPath =
            roleConfig[role as UserRole]?.dashboardPath || '/dashboard/user';
          console.log('Redirecting to:', targetPath);

          // Force a small delay to show the role confirmation
          setTimeout(() => {
            router.push(targetPath);
          }, 1000);
        }, 2000);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setUserRole('user'); // Default to user role
        toast({
          title: 'Error',
          description:
            'Failed to detect user role. Redirecting to default dashboard.',
          variant: 'destructive',
        });

        // Fallback to default dashboard
        setTimeout(() => {
          router.push('/dashboard/user');
        }, 2000);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchUserRole();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router, toast]); // Auto-redirect to role-specific dashboard
  useEffect(() => {
    if (userRole && !redirecting) {
      const config = roleConfig[userRole];
      if (config) {
        setRedirecting(true);
        // Small delay to show the role info before redirecting
        setTimeout(() => {
          router.push(config.dashboardPath);
        }, 2000);
      }
    }
  }, [userRole, redirecting, router]);

  // Manual redirect function
  const handleRedirect = () => {
    if (userRole) {
      const config = roleConfig[userRole];
      if (config) {
        setRedirecting(true);
        router.push(config.dashboardPath);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
        <Card className='w-full max-w-md mx-4'>
          <CardContent className='flex flex-col items-center justify-center py-8'>
            <Loader2 className='w-8 h-8 animate-spin text-blue-600 mb-4' />
            <h3 className='text-lg font-semibold mb-2'>Loading Dashboard</h3>
            <p className='text-sm text-gray-600 text-center'>
              Authenticating user and determining dashboard access...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (!userRole) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
        <Card className='w-full max-w-md mx-4'>
          <CardContent className='flex flex-col items-center justify-center py-8'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
              <Shield className='w-8 h-8 text-red-600' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>Role Detection Error</h3>
            <p className='text-sm text-gray-600 text-center mb-4'>
              Unable to determine your dashboard access level. Please contact
              support.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = roleConfig[userRole];

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
      <Card className='w-full max-w-lg mx-4'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${config.color}`}
            >
              {config.icon}
            </div>
          </div>
          <CardTitle className='text-2xl'>Welcome to Your Dashboard</CardTitle>
          <CardDescription className='text-base'>
            You're being redirected to your personalized dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center space-y-6'>
          <div className='space-y-2'>
            <Badge
              variant='secondary'
              className={`text-sm px-3 py-1 ${config.color}`}
            >
              {config.displayName}
            </Badge>
            <p className='text-sm text-gray-600'>{config.description}</p>
          </div>

          <div className='space-y-3'>
            {redirecting ? (
              <div className='flex items-center justify-center space-x-2'>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span className='text-sm'>Redirecting to dashboard...</span>
              </div>
            ) : (
              <>
                <p className='text-sm text-gray-500'>
                  Auto-redirecting in a moment...
                </p>
                <Button onClick={handleRedirect} className='w-full'>
                  Go to Dashboard Now
                </Button>
              </>
            )}
          </div>

          <div className='pt-4 border-t border-gray-200'>
            <p className='text-xs text-gray-500'>
              User: {user.email} • Role: {userRole}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
