import { requireAdminAccess } from '@/lib/auth/server-auth';

/**
 * Admin layout: single RBAC gate for all admin routes.
 * Protects /admin, /admin/users, /admin/permissions, etc.
 * Prevents drift — new admin pages cannot bypass authorization.
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
