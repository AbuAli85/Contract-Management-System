// Simple audit logger shim to satisfy imports and provide minimal logging in production
import { NextRequest } from 'next/server';

export class AuditLogger {
  static getClientIP(request: NextRequest): string | undefined {
    try {
      // Next.js hides raw request in headers; rely on standard proxies if present
      const fwd = request.headers.get('x-forwarded-for') || '';
      return fwd.split(',')[0]?.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  static getUserAgent(request: NextRequest): string | undefined {
    try {
      return request.headers.get('user-agent') || undefined;
    } catch {
      return undefined;
    }
  }

  async logPermissionUsage(entry: {
    user_id: string;
    permission: string;
    path: string;
    result: 'ALLOW' | 'DENY' | 'WOULD_BLOCK';
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    try {
      // Non-blocking console log; replace with DB insert if needed
      console.log('📝 RBAC Audit:', entry);
    } catch {
      // swallow
    }
  }
}

export const auditLogger = new AuditLogger();


