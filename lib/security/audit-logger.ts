import { createClient } from '@/lib/supabase/server'

export interface AuditEvent {
  id?: string
  event_type: string
  user_id?: string
  resource_type?: string
  resource_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  request_id?: string
  metadata?: any
  created_at?: string
}

export interface ApiRequestLog {
  requestId: string
  method: string
  path: string
  ip: string
  userAgent: string
  timestamp: string
  userId?: string
  responseTime?: number
  statusCode?: number
}

export interface SecurityEvent {
  event: string
  requestId?: string
  userId?: string
  userRole?: string
  requiredRoles?: string[]
  ip?: string
  userAgent?: string
  path?: string
  error?: string
  timestamp: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

class AuditLogger {
  async logApiRequest(log: ApiRequestLog): Promise<void> {
    try {
      const supabase = await createClient()
      
      await supabase.from('api_request_logs').insert({
        request_id: log.requestId,
        method: log.method,
        path: log.path,
        ip_address: log.ip,
        user_agent: log.userAgent,
        user_id: log.userId,
        response_time: log.responseTime,
        status_code: log.statusCode,
        created_at: log.timestamp
      })
    } catch (error) {
      console.error('Failed to log API request:', error)
    }
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const supabase = await createClient()
      
      await supabase.from('security_events').insert({
        event_type: event.event,
        request_id: event.requestId,
        user_id: event.userId,
        user_role: event.userRole,
        required_roles: event.requiredRoles,
        ip_address: event.ip,
        user_agent: event.userAgent,
        path: event.path,
        error_message: event.error,
        severity: event.severity || 'medium',
        metadata: {
          timestamp: event.timestamp,
          ...event
        },
        created_at: event.timestamp
      })
      
      // Also log to console for immediate visibility
      console.warn(`🚨 Security Event [${event.event}]:`, {
        requestId: event.requestId,
        userId: event.userId,
        path: event.path,
        severity: event.severity
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  async logDataChange(event: AuditEvent): Promise<void> {
    try {
      const supabase = await createClient()
      
      await supabase.from('audit_logs').insert({
        event_type: event.event_type,
        user_id: event.user_id,
        resource_type: event.resource_type,
        resource_id: event.resource_id,
        old_values: event.old_values,
        new_values: event.new_values,
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        request_id: event.request_id,
        metadata: event.metadata,
        created_at: event.created_at || new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log data change:', error)
    }
  }

  async logUserAction(action: string, userId: string, details?: any): Promise<void> {
    await this.logDataChange({
      event_type: `user.${action}`,
      user_id: userId,
      resource_type: 'user',
      resource_id: userId,
      metadata: details,
      created_at: new Date().toISOString()
    })
  }

  async logContractAction(action: string, userId: string, contractId: string, oldData?: any, newData?: any): Promise<void> {
    await this.logDataChange({
      event_type: `contract.${action}`,
      user_id: userId,
      resource_type: 'contract',
      resource_id: contractId,
      old_values: oldData,
      new_values: newData,
      created_at: new Date().toISOString()
    })
  }

  async logPromoterAction(action: string, userId: string, promoterId: string, oldData?: any, newData?: any): Promise<void> {
    await this.logDataChange({
      event_type: `promoter.${action}`,
      user_id: userId,
      resource_type: 'promoter',
      resource_id: promoterId,
      old_values: oldData,
      new_values: newData,
      created_at: new Date().toISOString()
    })
  }

  async getAuditTrail(resourceType?: string, resourceId?: string, limit: number = 100): Promise<AuditEvent[]> {
    try {
      const supabase = await createClient()
      
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (resourceType) {
        query = query.eq('resource_type', resourceType)
      }
      
      if (resourceId) {
        query = query.eq('resource_id', resourceId)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Failed to get audit trail:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Failed to get audit trail:', error)
      return []
    }
  }

  async getSecurityEvents(severity?: string, limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const supabase = await createClient()
      
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (severity) {
        query = query.eq('severity', severity)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Failed to get security events:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Failed to get security events:', error)
      return []
    }
  }
}

export const auditLogger = new AuditLogger()

// Database schema for audit tables (run these in Supabase SQL editor)
export const AUDIT_TABLE_SCHEMAS = `
-- API Request Logs
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  response_time INTEGER,
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Events
CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  request_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT,
  required_roles TEXT[],
  ip_address TEXT,
  user_agent TEXT,
  path TEXT,
  error_message TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (Data Changes)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_user_id ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Row Level Security
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies (only admins can view audit data)
CREATE POLICY "Admin can view api request logs" ON api_request_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view security events" ON security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
`
