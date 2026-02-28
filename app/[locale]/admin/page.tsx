import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { AdminDashboardUnified } from '@/components/admin/admin-dashboard-unified';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Control Center',
  description:
    'Admin control center for managing users, roles, and permissions',
};

/** Server-side RBAC gate: admin/super_admin only. Redirects before rendering. */
export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect(`/${locale}/auth/login`);
  }

  const { role } = await getCompanyRole(supabase);
  const isAdmin = role === 'admin' || role === 'manager';

  // Fallback: check users.role for super_admin (platform-level)
  let isSuperAdmin = false;
  if (!isAdmin) {
    const { data: u } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    isSuperAdmin = u?.role === 'super_admin' || u?.role === 'admin';
  }

  if (!isAdmin && !isSuperAdmin) {
    redirect(`/${locale}/auth/unauthorized`);
  }

  return (
    <div className='container mx-auto py-6 px-4'>
      <AdminDashboardUnified />
    </div>
  );
}
