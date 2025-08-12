import { createClient } from '@supabase/supabase-js';

// Audit logging system for tracking all user actions and system events
export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: string;
  resource?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'failure' | 'pending';
  metadata?: Record<string, any>;
}

export interface AuditLogFilter {
  user_id?: string;
  action?: string;
  resource?: string;
  severity?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

// Initialize Supabase client for audit logging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Audit logger class
export class AuditLogger {
  private static instance: AuditLogger;
  private queue: AuditLogEntry[] = [];
  private processing = false;

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  // Log an audit event
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Add timestamp if not provided
      if (!entry.timestamp) {
        entry.timestamp = new Date().toISOString();
      }

      // Add severity if not provided
      if (!entry.severity) {
        entry.severity = this.getDefaultSeverity(entry.action);
      }

      // Add status if not provided
      if (!entry.status) {
        entry.status = 'success';
      }

      // Insert into audit_logs table
      const { error } = await supabase.from('audit_logs').insert(entry);

      if (error) {
        console.error('Failed to log audit event:', error);
        // Fallback to queue if database insert fails
        this.queue.push(entry);
        this.processQueue();
      }
    } catch (error) {
      console.error('Error in audit logging:', error);
      // Fallback to queue
      this.queue.push(entry);
      this.processQueue();
    }
  }

  // Log user authentication events
  async logAuthEvent(
    userId: string,
    action: 'login' | 'logout' | 'failed_login' | 'password_reset',
    details?: any
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: `AUTH_${action.toUpperCase()}`,
      resource: 'auth',
      severity: action === 'failed_login' ? 'medium' : 'low',
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Log user management events
  async logUserEvent(
    userId: string,
    action: string,
    targetUserId: string,
    details?: any
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: `USER_${action.toUpperCase()}`,
      resource: 'users',
      resource_id: targetUserId,
      severity: this.getUserActionSeverity(action),
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Log permission/role changes
  async logPermissionEvent(
    userId: string,
    action: string,
    targetUserId: string,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: `PERMISSION_${action.toUpperCase()}`,
      resource: 'permissions',
      resource_id: targetUserId,
      severity: 'high',
      details: {
        old_role: oldRole,
        new_role: newRole,
        change_type: action,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Log system events
  async logSystemEvent(
    action: string,
    details?: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    await this.log({
      user_id: 'system',
      action: `SYSTEM_${action.toUpperCase()}`,
      resource: 'system',
      severity,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Log security events
  async logSecurityEvent(
    userId: string,
    action: string,
    details?: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action: `SECURITY_${action.toUpperCase()}`,
      resource: 'security',
      severity,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Get audit logs with filtering
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<{
    logs: AuditLogEntry[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      if (filter.action) {
        query = query.eq('action', filter.action);
      }
      if (filter.resource) {
        query = query.eq('resource', filter.resource);
      }
      if (filter.severity) {
        query = query.eq('severity', filter.severity);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.start_date) {
        query = query.gte('timestamp', filter.start_date);
      }
      if (filter.end_date) {
        query = query.lte('timestamp', filter.end_date);
      }

      // Apply pagination
      const page = filter.page || 1;
      const limit = filter.limit || 50;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);

      const { data: logs, error, count } = await query;

      if (error) {
        throw error;
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      return {
        logs: logs || [],
        total,
        page,
        pages,
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  // Get audit summary statistics
  async getAuditSummary(days: number = 30): Promise<{
    total_events: number;
    events_by_severity: Record<string, number>;
    events_by_action: Record<string, number>;
    events_by_resource: Record<string, number>;
    top_users: Array<{ user_id: string; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', startDate.toISOString());

      if (error) {
        throw error;
      }

      const events = logs || [];

      // Calculate statistics
      const eventsBySeverity: Record<string, number> = {};
      const eventsByAction: Record<string, number> = {};
      const eventsByResource: Record<string, number> = {};
      const userCounts: Record<string, number> = {};

      events.forEach(event => {
        // Count by severity
        eventsBySeverity[event.severity || 'unknown'] =
          (eventsBySeverity[event.severity || 'unknown'] || 0) + 1;

        // Count by action
        eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;

        // Count by resource
        if (event.resource) {
          eventsByResource[event.resource] =
            (eventsByResource[event.resource] || 0) + 1;
        }

        // Count by user
        userCounts[event.user_id] = (userCounts[event.user_id] || 0) + 1;
      });

      // Get top users
      const topUsers = Object.entries(userCounts)
        .map(([user_id, count]) => ({ user_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        total_events: events.length,
        events_by_severity: eventsBySeverity,
        events_by_action: eventsByAction,
        events_by_resource: eventsByResource,
        top_users: topUsers,
      };
    } catch (error) {
      console.error('Error getting audit summary:', error);
      throw error;
    }
  }

  // Process queued audit events
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const entry = this.queue.shift();
        if (entry) {
          try {
            await supabase.from('audit_logs').insert(entry);
          } catch (error) {
            console.error('Failed to process queued audit event:', error);
            // Put it back in the queue for retry
            this.queue.unshift(entry);
            break;
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  // Get default severity for actions
  private getDefaultSeverity(
    action: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return 'high';
    }
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return 'medium';
    }
    if (actionLower.includes('update') || actionLower.includes('modify')) {
      return 'medium';
    }
    if (actionLower.includes('read') || actionLower.includes('view')) {
      return 'low';
    }

    return 'medium';
  }

  // Get severity for user management actions
  private getUserActionSeverity(
    action: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('delete')) {
      return 'critical';
    }
    if (actionLower.includes('role') || actionLower.includes('permission')) {
      return 'high';
    }
    if (actionLower.includes('create') || actionLower.includes('update')) {
      return 'medium';
    }

    return 'low';
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Convenience functions for common audit events
export const auditLog = {
  // User actions
  userCreated: (userId: string, targetUserId: string, details?: any) =>
    auditLogger.logUserEvent(userId, 'created', targetUserId, details),

  userUpdated: (userId: string, targetUserId: string, details?: any) =>
    auditLogger.logUserEvent(userId, 'updated', targetUserId, details),

  userDeleted: (userId: string, targetUserId: string, details?: any) =>
    auditLogger.logUserEvent(userId, 'deleted', targetUserId, details),

  roleChanged: (
    userId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string
  ) =>
    auditLogger.logPermissionEvent(
      userId,
      'role_changed',
      targetUserId,
      oldRole,
      newRole
    ),

  // Authentication
  login: (userId: string, details?: any) =>
    auditLogger.logAuthEvent(userId, 'login', details),

  logout: (userId: string, details?: any) =>
    auditLogger.logAuthEvent(userId, 'logout', details),

  failedLogin: (userId: string, details?: any) =>
    auditLogger.logAuthEvent(userId, 'failed_login', details),

  // System events
  systemEvent: (
    action: string,
    details?: any,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ) => auditLogger.logSystemEvent(action, details, severity),

  // Security events
  securityEvent: (
    userId: string,
    action: string,
    details?: any,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ) => auditLogger.logSecurityEvent(userId, action, details, severity),
};
