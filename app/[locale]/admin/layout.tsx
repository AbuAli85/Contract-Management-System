import { requireAdminAccess } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

/**
 * Admin layout: single RBAC gate for all admin routes.
 * Protects /admin, /admin/users, /admin/permissions, etc.
 * Prevents drift — new admin pages cannot bypass authorization.
 * Auth context (user, companyId, tenantRole, platformRole) is returned — pass via
 * AdminAuthProvider or props when child pages need it to avoid re-fetching.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminAccess(locale);

  return <>{children}</>;
}
