-- ============================================================================
-- Promoter Notifications System Migration
-- ============================================================================
-- This migration creates the infrastructure for tracking and managing
-- notifications sent to promoters about documents, reminders, and other events.
--
-- Author: System
-- Date: 2025-01-27
-- ============================================================================

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'document_expiry_reminder',
  'document_request',
  'bulk_notification',
  'contract_update',
  'general_message',
  'urgent_alert'
);

-- Notification status enum
CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'read',
  'archived'
);

-- Notification priority enum
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- ============================================================================
-- 2. CREATE MAIN TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS promoter_notifications (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Notification Details
  type notification_type NOT NULL,
  status notification_status NOT NULL DEFAULT 'pending',
  priority notification_priority NOT NULL DEFAULT 'medium',
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Channel Configuration
  send_email BOOLEAN DEFAULT false,
  send_sms BOOLEAN DEFAULT false,
  send_in_app BOOLEAN DEFAULT true,
  
  -- Document Reference (optional, for document-related notifications)
  document_type VARCHAR(100),
  document_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Delivery Information
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Index for querying notifications by promoter
CREATE INDEX idx_promoter_notifications_promoter_id 
ON promoter_notifications(promoter_id);

-- Index for querying by status
CREATE INDEX idx_promoter_notifications_status 
ON promoter_notifications(status);

-- Index for querying by type
CREATE INDEX idx_promoter_notifications_type 
ON promoter_notifications(type);

-- Index for querying by priority
CREATE INDEX idx_promoter_notifications_priority 
ON promoter_notifications(priority);

-- Composite index for common queries (unread notifications per promoter)
CREATE INDEX idx_promoter_notifications_promoter_status 
ON promoter_notifications(promoter_id, status) 
WHERE status IN ('pending', 'sent');

-- Index for date-based queries
CREATE INDEX idx_promoter_notifications_created_at 
ON promoter_notifications(created_at DESC);

-- ============================================================================
-- 4. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_promoter_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_promoter_notifications_updated_at
  BEFORE UPDATE ON promoter_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_promoter_notifications_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE promoter_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all notifications
CREATE POLICY "Allow authenticated users to read notifications"
ON promoter_notifications
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to create notifications
CREATE POLICY "Allow authenticated users to create notifications"
ON promoter_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update notifications
CREATE POLICY "Allow authenticated users to update notifications"
ON promoter_notifications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to delete their own created notifications
CREATE POLICY "Allow users to delete their own notifications"
ON promoter_notifications
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- ============================================================================
-- 6. HELPFUL VIEWS
-- ============================================================================

-- View: Unread notifications count per promoter
CREATE OR REPLACE VIEW promoter_unread_notifications AS
SELECT 
  promoter_id,
  COUNT(*) AS unread_count,
  COUNT(*) FILTER (WHERE priority = 'urgent') AS urgent_count,
  COUNT(*) FILTER (WHERE priority = 'high') AS high_priority_count
FROM promoter_notifications
WHERE status IN ('pending', 'sent')
  AND read_at IS NULL
GROUP BY promoter_id;

-- View: Recent notifications with promoter details
CREATE OR REPLACE VIEW promoter_recent_notifications AS
SELECT 
  n.id,
  n.promoter_id,
  COALESCE(p.name_en, p.name_ar, 'Unknown') AS promoter_name,
  p.email AS promoter_email,
  COALESCE(p.phone, p.mobile_number) AS promoter_phone,
  n.type,
  n.status,
  n.priority,
  n.title,
  n.message,
  n.document_type,
  n.send_email,
  n.send_sms,
  n.send_in_app,
  n.sent_at,
  n.read_at,
  n.created_at
FROM promoter_notifications n
JOIN promoters p ON n.promoter_id = p.id
WHERE n.created_at >= NOW() - INTERVAL '30 days'
ORDER BY n.created_at DESC;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT ALL ON promoter_notifications TO authenticated;
GRANT SELECT ON promoter_unread_notifications TO authenticated;
GRANT SELECT ON promoter_recent_notifications TO authenticated;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE promoter_notifications IS 'Stores all notifications sent to promoters';
COMMENT ON COLUMN promoter_notifications.type IS 'Type of notification being sent';
COMMENT ON COLUMN promoter_notifications.status IS 'Current status of the notification';
COMMENT ON COLUMN promoter_notifications.priority IS 'Priority level of the notification';
COMMENT ON COLUMN promoter_notifications.metadata IS 'Additional flexible data storage for notification-specific information';
COMMENT ON COLUMN promoter_notifications.retry_count IS 'Number of times delivery was attempted';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

