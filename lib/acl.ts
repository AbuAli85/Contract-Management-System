// lib/acl.ts - Role and organization access control helpers
export const canAccessProviderConsole = (role?: string) =>
  ['admin', 'manager', 'provider'].includes(role ?? '');

export const canCreateBooking = (role?: string) =>
  ['admin', 'manager', 'client'].includes(role ?? '');

export const canViewInvoices = (role?: string) =>
  ['admin', 'manager', 'provider', 'client'].includes(role ?? '');

export const canCreateInvoices = (role?: string) =>
  ['admin', 'manager', 'provider'].includes(role ?? '');

export const canProcessPayments = (role?: string) =>
  ['admin', 'manager'].includes(role ?? '');

// Check if user can access specific invoice
export const canAccessInvoice = (
  invoice: any,
  userId: string,
  userRole: string
) => {
  // Admins and managers can access all invoices
  if (['admin', 'manager'].includes(userRole)) return true;

  // Providers can access invoices for their services
  if (userRole === 'provider' && invoice.provider_id === userId) return true;

  // Clients can access invoices for their bookings
  if (userRole === 'client' && invoice.booking?.client_id === userId)
    return true;

  return false;
};

// Check if user can modify invoice
export const canModifyInvoice = (
  invoice: any,
  userId: string,
  userRole: string
) => {
  // Only admins, managers, and the invoice provider can modify
  if (['admin', 'manager'].includes(userRole)) return true;
  if (userRole === 'provider' && invoice.provider_id === userId) return true;

  return false;
};
