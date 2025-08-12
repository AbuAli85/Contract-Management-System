<<<<<<< Updated upstream
// ========================================
// 🛡️ RBAC AUDIT LOGGING
// ========================================

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export interface AuditLogData {
  user_id?: string
  event_type: 'PERMISSION_CHECK' | 'ROLE_CHANGE' | 'PERMISSION_GRANT' | 'PERMISSION_REVOKE'
  permission?: string
  resource?: string
  action?: string
  result: 'ALLOW' | 'DENY' | 'WOULD_BLOCK'
  ip_address?: string
  user_agent?: string
  old_value?: any
  new_value?: any
  changed_by?: string
  context?: Record<string, any>
}

export interface RoleChangeData {
  user_id: string
  old_roles: string[]
  new_roles: string[]
  changed_by: string
  ip_address?: string
  user_agent?: string
  reason?: string
}

export interface PermissionUsageData {
  user_id: string
  permission: string
  path: string
  result: 'ALLOW' | 'DENY' | 'WOULD_BLOCK'
  ip_address?: string
  user_agent?: string
  context?: Record<string, any>
}

export class AuditLogger {
  private supabase: any = null

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    try {
      this.supabase = await createClient()
    } catch (error) {
      console.error('🔐 RBAC: Failed to initialize Supabase for audit logging:', error)
    }
  }

  /**
   * Log permission usage (ALLOW/DENY/WOULD_BLOCK)
   */
  async logPermissionUsage(data: PermissionUsageData): Promise<string | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: logEntry, error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: data.user_id,
          event_type: 'PERMISSION_CHECK',
          permission: data.permission,
          resource: this.extractResource(data.permission),
          action: this.extractAction(data.permission),
          result: data.result,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          old_value: null,
          new_value: null,
          changed_by: data.user_id,
          timestamp: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('🔐 RBAC: Failed to log permission usage:', error)
        return null
      }

      return logEntry?.id || null
    } catch (error) {
      console.error('🔐 RBAC: Error logging permission usage:', error)
      return null
    }
  }

  /**
   * Log role changes
   */
  async logRoleChange(data: RoleChangeData): Promise<string | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: logEntry, error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: data.user_id,
          event_type: 'ROLE_CHANGE',
          permission: null,
          resource: 'role',
          action: 'assign',
          result: 'ALLOW',
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          old_value: { roles: data.old_roles },
          new_value: { roles: data.new_roles },
          changed_by: data.changed_by,
          timestamp: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('🔐 RBAC: Failed to log role change:', error)
        return null
      }

      return logEntry?.id || null
    } catch (error) {
      console.error('🔐 RBAC: Error logging role change:', error)
      return null
    }
  }

  /**
   * Log permission grant
   */
  async logPermissionGrant(
    user_id: string,
    permission: string,
    granted_by: string,
    context?: Record<string, any>
  ): Promise<string | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: logEntry, error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id,
          event_type: 'PERMISSION_GRANT',
          permission,
          resource: this.extractResource(permission),
          action: this.extractAction(permission),
          result: 'ALLOW',
          ip_address: null,
          user_agent: null,
          old_value: null,
          new_value: { permission, granted_by, context },
          changed_by: granted_by,
          timestamp: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('🔐 RBAC: Failed to log permission grant:', error)
        return null
      }

      return logEntry?.id || null
    } catch (error) {
      console.error('🔐 RBAC: Error logging permission grant:', error)
      return null
    }
  }

  /**
   * Log permission revocation
   */
  async logPermissionRevoke(
    user_id: string,
    permission: string,
    revoked_by: string,
    reason?: string
  ): Promise<string | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: logEntry, error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id,
          event_type: 'PERMISSION_REVOKE',
          permission,
          resource: this.extractResource(permission),
          action: this.extractAction(permission),
          result: 'DENY',
          ip_address: null,
          user_agent: null,
          old_value: { permission },
          new_value: { permission, revoked_by, reason },
          changed_by: revoked_by,
          timestamp: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('🔐 RBAC: Failed to log permission revocation:', error)
        return null
      }

      return logEntry?.id || null
    } catch (error) {
      console.error('🔐 RBAC: Error logging permission revocation:', error)
      return null
    }
  }

  /**
   * Log general audit event
   */
  async logAuditEvent(data: AuditLogData): Promise<string | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: logEntry, error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: data.user_id,
          event_type: data.event_type,
          permission: data.permission,
          resource: data.resource,
          action: data.action,
          result: data.result,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          old_value: data.old_value,
          new_value: data.new_value,
          changed_by: data.changed_by,
          timestamp: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('🔐 RBAC: Failed to log audit event:', error)
        return null
      }

      return logEntry?.id || null
    } catch (error) {
      console.error('🔐 RBAC: Error logging audit event:', error)
      return null
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    user_id: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: logs, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user_id)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('🔐 RBAC: Failed to fetch user audit logs:', error)
        return []
      }

      return logs || []
    } catch (error) {
      console.error('🔐 RBAC: Error fetching user audit logs:', error)
      return []
    }
  }

  /**
   * Get audit logs by event type
   */
  async getAuditLogsByType(
    event_type: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: logs, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('event_type', event_type)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('🔐 RBAC: Failed to fetch audit logs by type:', error)
        return []
      }

      return logs || []
    } catch (error) {
      console.error('🔐 RBAC: Error fetching audit logs by type:', error)
      return []
    }
  }

  /**
   * Get audit logs by result
   */
  async getAuditLogsByResult(
    result: 'ALLOW' | 'DENY' | 'WOULD_BLOCK',
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      const { data: logs, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('result', result)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('🔐 RBAC: Failed to fetch audit logs by result:', error)
        return []
      }

      return logs || []
    } catch (error) {
      console.error('🔐 RBAC: Error fetching audit logs by result:', error)
      return []
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(): Promise<{
    total_logs: number
    allow_count: number
    deny_count: number
    would_block_count: number
    today_logs: number
  }> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase()
      }

      // Get total counts
      const { count: total_logs } = await this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })

      // Get result counts
      const { data: resultCounts, error: resultError } = await this.supabase
        .from('audit_logs')
        .select('result')

      if (resultError) {
        console.error('🔐 RBAC: Failed to fetch audit result counts:', resultError)
        return {
          total_logs: 0,
          allow_count: 0,
          deny_count: 0,
          would_block_count: 0,
          today_logs: 0
        }
      }

      const allow_count = resultCounts?.filter(log => log.result === 'ALLOW').length || 0
      const deny_count = resultCounts?.filter(log => log.result === 'DENY').length || 0
      const would_block_count = resultCounts?.filter(log => log.result === 'WOULD_BLOCK').length || 0

      // Get today's logs
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count: today_logs } = await this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', today.toISOString())

      return {
        total_logs: total_logs || 0,
        allow_count,
        deny_count,
        would_block_count,
        today_logs: today_logs || 0
      }
    } catch (error) {
      console.error('🔐 RBAC: Error fetching audit statistics:', error)
      return {
        total_logs: 0,
        allow_count: 0,
        deny_count: 0,
        would_block_count: 0,
        today_logs: 0
      }
    }
  }

  /**
   * Extract resource from permission string
   */
  private extractResource(permission: string): string | null {
    if (!permission) return null
    const parts = permission.split(':')
    return parts.length >= 1 ? parts[0] : null
  }

  /**
   * Extract action from permission string
   */
  private extractAction(permission: string): string | null {
    if (!permission) return null
    const parts = permission.split(':')
    return parts.length >= 2 ? parts[1] : null
  }

  /**
   * Get client IP from request
   */
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP
    }
    
    return 'unknown'
  }

  /**
   * Get user agent from request
   */
  static getUserAgent(request: NextRequest): string {
    return request.headers.get('user-agent') || 'unknown'
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

=======
import { createClient } from '@/lib/supabase/server'

export const AuditLogger = {
  async logPermissionUsage(userId: string, permission: string, path: string, result: 'ALLOW'|'DENY'|'WOULD_BLOCK', ip?: string, userAgent?: string, context?: any) {
    try {
      const supabase = await createClient()
      await supabase.from('rbac_audit_logs').insert({
        user_id: userId || null,
        event_type: 'permission_usage',
        permission,
        resource: path,
        action: permission.split(':')[1] || null,
        result,
        ip_address: ip || null,
        user_agent: userAgent || null,
        new_value: context || null,
      })
    } catch (_) {
      // best-effort
    }
  },
  async logRoleChange(userId: string, oldRoles: string[], newRoles: string[], changedBy?: string) {
    try {
      const supabase = await createClient()
      await supabase.from('rbac_audit_logs').insert({
        user_id: userId || null,
        event_type: 'role_change',
        old_value: { roles: oldRoles },
        new_value: { roles: newRoles },
        changed_by: changedBy || null,
      })
    } catch (_) {}
  }
}

>>>>>>> Stashed changes

