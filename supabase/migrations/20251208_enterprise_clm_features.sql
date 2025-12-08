-- ============================================================================
-- Enterprise CLM Features Migration
-- Adds: Clause Library, E-Signatures, Enhanced Approvals, Collaboration
-- Version: 1.0.0
-- Date: 2024-12-08
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- CLAUSE LIBRARY
-- Reusable contract clauses with categorization and versioning
-- ============================================================================

-- Clause categories table
CREATE TABLE IF NOT EXISTS clause_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    description_ar TEXT,
    parent_id UUID REFERENCES clause_categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Main clauses table
CREATE TABLE IF NOT EXISTS clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    content TEXT NOT NULL,
    content_ar TEXT,
    category_id UUID REFERENCES clause_categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_mandatory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT true,
    applicable_contract_types TEXT[] DEFAULT '{}',
    jurisdiction VARCHAR(100),
    effective_date DATE,
    expiry_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Clause versions for history tracking
CREATE TABLE IF NOT EXISTS clause_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    content TEXT NOT NULL,
    content_ar TEXT,
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(clause_id, version)
);

-- Contract-clause junction table
CREATE TABLE IF NOT EXISTS contract_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    clause_id UUID NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
    clause_version INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    is_modified BOOLEAN DEFAULT false,
    modified_content TEXT,
    modified_content_ar TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(contract_id, clause_id)
);

-- ============================================================================
-- E-SIGNATURE SYSTEM
-- Digital signature capture and verification
-- ============================================================================

-- Signature requests table
CREATE TABLE IF NOT EXISTS signature_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    signer_email VARCHAR(255) NOT NULL,
    signer_name VARCHAR(255) NOT NULL,
    signer_role VARCHAR(100) DEFAULT 'party',
    signing_order INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'signed', 'declined', 'expired')),
    signed_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    decline_reason TEXT,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Signatures table (stores actual signature data)
CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signature_request_id UUID NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    signer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    signature_type VARCHAR(50) DEFAULT 'drawn' CHECK (signature_type IN ('drawn', 'typed', 'uploaded', 'certificate')),
    signature_data TEXT NOT NULL,
    typed_name VARCHAR(255),
    font_style VARCHAR(100),
    certificate_id VARCHAR(255),
    certificate_issuer VARCHAR(255),
    hash VARCHAR(64),
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    timestamp_token TEXT,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Signed documents table (stores finalized PDFs)
CREATE TABLE IF NOT EXISTS signed_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    document_hash VARCHAR(64) NOT NULL,
    all_signatures_complete BOOLEAN DEFAULT false,
    finalized_at TIMESTAMP WITH TIME ZONE,
    certificate_url TEXT,
    audit_trail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ENHANCED APPROVAL WORKFLOWS
-- Multi-step approval with conditional routing
-- ============================================================================

-- Approval workflow templates
CREATE TABLE IF NOT EXISTS approval_workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contract_type VARCHAR(100),
    min_contract_value DECIMAL(15, 2),
    max_contract_value DECIMAL(15, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Approval workflow steps
CREATE TABLE IF NOT EXISTS approval_workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES approval_workflow_templates(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    description TEXT,
    approver_type VARCHAR(50) CHECK (approver_type IN ('user', 'role', 'department', 'manager')),
    approver_id UUID,
    approver_role VARCHAR(100),
    approver_department VARCHAR(100),
    is_required BOOLEAN DEFAULT true,
    timeout_hours INTEGER DEFAULT 48,
    escalation_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract approval instances
CREATE TABLE IF NOT EXISTS contract_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES approval_workflow_templates(id) ON DELETE SET NULL,
    current_step INTEGER DEFAULT 1,
    overall_status VARCHAR(50) DEFAULT 'pending' CHECK (overall_status IN ('pending', 'in_progress', 'approved', 'rejected', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Individual approval actions
CREATE TABLE IF NOT EXISTS approval_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_approval_id UUID NOT NULL REFERENCES contract_approvals(id) ON DELETE CASCADE,
    step_id UUID REFERENCES approval_workflow_steps(id) ON DELETE SET NULL,
    step_order INTEGER NOT NULL,
    approver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) CHECK (action IN ('pending', 'approved', 'rejected', 'delegated', 'escalated')),
    comments TEXT,
    delegated_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    delegated_reason TEXT,
    acted_at TIMESTAMP WITH TIME ZONE,
    due_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval history for audit trail
CREATE TABLE IF NOT EXISTS approval_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comments TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COLLABORATION FEATURES
-- Comments, mentions, and real-time presence
-- ============================================================================

-- Contract comments
CREATE TABLE IF NOT EXISTS contract_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES contract_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    position_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment mentions
CREATE TABLE IF NOT EXISTS comment_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES contract_comments(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notified_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, mentioned_user_id)
);

-- Contract version history (for redlining/track changes)
CREATE TABLE IF NOT EXISTS contract_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    changes JSONB,
    change_summary TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contract_id, version_number)
);

-- User presence for real-time collaboration
CREATE TABLE IF NOT EXISTS contract_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cursor_position JSONB,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'viewing' CHECK (status IN ('viewing', 'editing', 'commenting')),
    UNIQUE(contract_id, user_id)
);

-- ============================================================================
-- CONTRACT ALERTS & NOTIFICATIONS
-- Expiry reminders, renewal alerts, compliance notifications
-- ============================================================================

-- Alert configurations
CREATE TABLE IF NOT EXISTS alert_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    days_before INTEGER[],
    notification_channels TEXT[] DEFAULT '{email}',
    recipients TEXT[],
    custom_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled alerts
CREATE TABLE IF NOT EXISTS scheduled_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN ('expiry', 'renewal', 'review', 'milestone', 'payment', 'custom')),
    trigger_date DATE NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    notification_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- OBLIGATION TRACKING
-- Track deliverables, payments, and compliance tasks
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_obligations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    obligation_type VARCHAR(50) CHECK (obligation_type IN ('deliverable', 'payment', 'compliance', 'milestone', 'custom')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    responsible_party VARCHAR(50) CHECK (responsible_party IN ('first_party', 'second_party', 'both')),
    due_date DATE,
    recurring_pattern VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'waived')),
    completion_date DATE,
    completion_notes TEXT,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2),
    currency VARCHAR(3),
    reminder_days INTEGER[] DEFAULT '{7, 3, 1}',
    last_reminder_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- ANALYTICS VIEWS
-- Pre-computed views for dashboard performance
-- Using correct column names from contracts table
-- ============================================================================

-- Contract status summary view
CREATE OR REPLACE VIEW contract_status_summary AS
SELECT 
    COUNT(*) as total_contracts,
    COUNT(*) FILTER (WHERE status = 'active') as active_contracts,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_contracts,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_contracts,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_contracts,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_contracts,
    COALESCE(SUM(COALESCE(total_value, contract_value, 0)), 0) as total_contract_value,
    COALESCE(SUM(COALESCE(total_value, contract_value, 0)) FILTER (WHERE status = 'active'), 0) as active_contract_value
FROM contracts;

-- Contracts expiring soon view (using end_date column)
CREATE OR REPLACE VIEW contracts_expiring_soon AS
SELECT 
    c.id,
    c.contract_number,
    c.status,
    c.end_date,
    COALESCE(c.total_value, c.contract_value) as contract_value,
    p1.name_en as first_party_name,
    p2.name_en as second_party_name,
    (c.end_date - CURRENT_DATE) as days_until_expiry
FROM contracts c
LEFT JOIN parties p1 ON c.employer_id = p1.id OR c.first_party_id = p1.id
LEFT JOIN parties p2 ON c.client_id = p2.id OR c.second_party_id = p2.id
WHERE c.status = 'active'
  AND c.end_date IS NOT NULL
  AND c.end_date <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY c.end_date ASC;

-- Approval metrics view
CREATE OR REPLACE VIEW approval_metrics AS
SELECT 
    COUNT(*) as total_approvals,
    COUNT(*) FILTER (WHERE overall_status = 'pending') as pending_approvals,
    COUNT(*) FILTER (WHERE overall_status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE overall_status = 'rejected') as rejected_count,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600) FILTER (WHERE completed_at IS NOT NULL) as avg_approval_hours
FROM contract_approvals
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Clause indexes
CREATE INDEX IF NOT EXISTS idx_clauses_category ON clauses(category_id);
CREATE INDEX IF NOT EXISTS idx_clauses_tags ON clauses USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_clauses_contract_types ON clauses USING GIN(applicable_contract_types);
CREATE INDEX IF NOT EXISTS idx_clauses_active ON clauses(is_active) WHERE is_active = true;

-- Signature indexes
CREATE INDEX IF NOT EXISTS idx_signature_requests_contract ON signature_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_status ON signature_requests(status);
CREATE INDEX IF NOT EXISTS idx_signatures_contract ON signatures(contract_id);

-- Approval indexes
CREATE INDEX IF NOT EXISTS idx_contract_approvals_contract ON contract_approvals(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_status ON contract_approvals(overall_status);
CREATE INDEX IF NOT EXISTS idx_approval_actions_approver ON approval_actions(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_pending ON approval_actions(action) WHERE action = 'pending';

-- Comment indexes
CREATE INDEX IF NOT EXISTS idx_contract_comments_contract ON contract_comments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_comments_user ON contract_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_user ON comment_mentions(mentioned_user_id);

-- Alert indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_alerts_date ON scheduled_alerts(trigger_date) WHERE is_sent = false;
CREATE INDEX IF NOT EXISTS idx_scheduled_alerts_contract ON scheduled_alerts(contract_id);

-- Obligation indexes
CREATE INDEX IF NOT EXISTS idx_contract_obligations_contract ON contract_obligations(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_obligations_due_date ON contract_obligations(due_date) WHERE status = 'pending';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE clause_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clause_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE signed_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_obligations ENABLE ROW LEVEL SECURITY;

-- Clause policies (viewable by all authenticated, editable by admins)
DROP POLICY IF EXISTS "Clauses viewable by authenticated users" ON clauses;
CREATE POLICY "Clauses viewable by authenticated users" ON clauses
    FOR SELECT TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Clauses manageable by admins" ON clauses;
CREATE POLICY "Clauses manageable by admins" ON clauses
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Clause categories policies
DROP POLICY IF EXISTS "Clause categories viewable by authenticated" ON clause_categories;
CREATE POLICY "Clause categories viewable by authenticated" ON clause_categories
    FOR SELECT TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Clause categories manageable" ON clause_categories;
CREATE POLICY "Clause categories manageable" ON clause_categories
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Clause versions policies
DROP POLICY IF EXISTS "Clause versions viewable by authenticated" ON clause_versions;
CREATE POLICY "Clause versions viewable by authenticated" ON clause_versions
    FOR SELECT TO authenticated
    USING (true);

-- Contract clauses policies
DROP POLICY IF EXISTS "Contract clauses viewable by authenticated" ON contract_clauses;
CREATE POLICY "Contract clauses viewable by authenticated" ON contract_clauses
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Contract clauses manageable" ON contract_clauses;
CREATE POLICY "Contract clauses manageable" ON contract_clauses
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Signature requests policies
DROP POLICY IF EXISTS "Signature requests viewable" ON signature_requests;
CREATE POLICY "Signature requests viewable" ON signature_requests
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Signature requests manageable" ON signature_requests;
CREATE POLICY "Signature requests manageable" ON signature_requests
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Signatures policies
DROP POLICY IF EXISTS "Signatures viewable" ON signatures;
CREATE POLICY "Signatures viewable" ON signatures
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Signatures creatable" ON signatures;
CREATE POLICY "Signatures creatable" ON signatures
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Signed documents policies
DROP POLICY IF EXISTS "Signed documents viewable" ON signed_documents;
CREATE POLICY "Signed documents viewable" ON signed_documents
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Signed documents manageable" ON signed_documents;
CREATE POLICY "Signed documents manageable" ON signed_documents
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Approval workflow templates policies
DROP POLICY IF EXISTS "Approval templates viewable" ON approval_workflow_templates;
CREATE POLICY "Approval templates viewable" ON approval_workflow_templates
    FOR SELECT TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Approval templates manageable" ON approval_workflow_templates;
CREATE POLICY "Approval templates manageable" ON approval_workflow_templates
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Approval workflow steps policies
DROP POLICY IF EXISTS "Approval steps viewable" ON approval_workflow_steps;
CREATE POLICY "Approval steps viewable" ON approval_workflow_steps
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Approval steps manageable" ON approval_workflow_steps;
CREATE POLICY "Approval steps manageable" ON approval_workflow_steps
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Contract approvals policies
DROP POLICY IF EXISTS "Contract approvals viewable" ON contract_approvals;
CREATE POLICY "Contract approvals viewable" ON contract_approvals
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Contract approvals manageable" ON contract_approvals;
CREATE POLICY "Contract approvals manageable" ON contract_approvals
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Approval actions policies
DROP POLICY IF EXISTS "Approval actions viewable" ON approval_actions;
CREATE POLICY "Approval actions viewable" ON approval_actions
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Approval actions manageable" ON approval_actions;
CREATE POLICY "Approval actions manageable" ON approval_actions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Approval history policies
DROP POLICY IF EXISTS "Approval history viewable" ON approval_history;
CREATE POLICY "Approval history viewable" ON approval_history
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Approval history insertable" ON approval_history;
CREATE POLICY "Approval history insertable" ON approval_history
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Comment policies
DROP POLICY IF EXISTS "Comments viewable" ON contract_comments;
CREATE POLICY "Comments viewable" ON contract_comments
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON contract_comments;
CREATE POLICY "Users can create comments" ON contract_comments
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own comments" ON contract_comments;
CREATE POLICY "Users can update own comments" ON contract_comments
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own comments" ON contract_comments;
CREATE POLICY "Users can delete own comments" ON contract_comments
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Comment mentions policies
DROP POLICY IF EXISTS "Mentions viewable" ON comment_mentions;
CREATE POLICY "Mentions viewable" ON comment_mentions
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Mentions manageable" ON comment_mentions;
CREATE POLICY "Mentions manageable" ON comment_mentions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Contract versions policies
DROP POLICY IF EXISTS "Versions viewable" ON contract_versions;
CREATE POLICY "Versions viewable" ON contract_versions
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Versions creatable" ON contract_versions;
CREATE POLICY "Versions creatable" ON contract_versions
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Contract presence policies
DROP POLICY IF EXISTS "Presence viewable" ON contract_presence;
CREATE POLICY "Presence viewable" ON contract_presence
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Presence manageable" ON contract_presence;
CREATE POLICY "Presence manageable" ON contract_presence
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Alert configuration policies
DROP POLICY IF EXISTS "Alert configs viewable" ON alert_configurations;
CREATE POLICY "Alert configs viewable" ON alert_configurations
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Alert configs manageable" ON alert_configurations;
CREATE POLICY "Alert configs manageable" ON alert_configurations
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL)
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Scheduled alerts policies
DROP POLICY IF EXISTS "Scheduled alerts viewable" ON scheduled_alerts;
CREATE POLICY "Scheduled alerts viewable" ON scheduled_alerts
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Scheduled alerts manageable" ON scheduled_alerts;
CREATE POLICY "Scheduled alerts manageable" ON scheduled_alerts
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Contract obligations policies
DROP POLICY IF EXISTS "Obligations viewable" ON contract_obligations;
CREATE POLICY "Obligations viewable" ON contract_obligations
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Obligations manageable" ON contract_obligations;
CREATE POLICY "Obligations manageable" ON contract_obligations
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_clauses_updated_at ON clauses;
CREATE TRIGGER update_clauses_updated_at 
    BEFORE UPDATE ON clauses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clause_categories_updated_at ON clause_categories;
CREATE TRIGGER update_clause_categories_updated_at 
    BEFORE UPDATE ON clause_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_signature_requests_updated_at ON signature_requests;
CREATE TRIGGER update_signature_requests_updated_at 
    BEFORE UPDATE ON signature_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_approval_workflow_templates_updated_at ON approval_workflow_templates;
CREATE TRIGGER update_approval_workflow_templates_updated_at 
    BEFORE UPDATE ON approval_workflow_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contract_comments_updated_at ON contract_comments;
CREATE TRIGGER update_contract_comments_updated_at 
    BEFORE UPDATE ON contract_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alert_configurations_updated_at ON alert_configurations;
CREATE TRIGGER update_alert_configurations_updated_at 
    BEFORE UPDATE ON alert_configurations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contract_obligations_updated_at ON contract_obligations;
CREATE TRIGGER update_contract_obligations_updated_at 
    BEFORE UPDATE ON contract_obligations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Clause version history trigger
CREATE OR REPLACE FUNCTION track_clause_version()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.content IS DISTINCT FROM NEW.content THEN
        INSERT INTO clause_versions (clause_id, version, title, title_ar, content, content_ar, created_by)
        VALUES (OLD.id, OLD.version, OLD.title, OLD.title_ar, OLD.content, OLD.content_ar, NEW.created_by);
        NEW.version = OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clause_version_trigger ON clauses;
CREATE TRIGGER clause_version_trigger
    BEFORE UPDATE ON clauses
    FOR EACH ROW
    EXECUTE FUNCTION track_clause_version();

-- Approval history trigger
CREATE OR REPLACE FUNCTION log_approval_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO approval_history (contract_id, action_type, performed_by, previous_status, new_status, comments)
    SELECT 
        ca.contract_id,
        NEW.action,
        NEW.approver_id,
        OLD.action,
        NEW.action,
        NEW.comments
    FROM contract_approvals ca
    WHERE ca.id = NEW.contract_approval_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS approval_action_log_trigger ON approval_actions;
CREATE TRIGGER approval_action_log_trigger
    AFTER UPDATE ON approval_actions
    FOR EACH ROW
    WHEN (OLD.action IS DISTINCT FROM NEW.action)
    EXECUTE FUNCTION log_approval_action();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get pending approvals for a user
CREATE OR REPLACE FUNCTION get_user_pending_approvals(p_user_id UUID)
RETURNS TABLE (
    approval_id UUID,
    contract_id UUID,
    contract_number VARCHAR,
    step_name VARCHAR,
    due_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.id as approval_id,
        ca.contract_id,
        c.contract_number,
        aws.step_name,
        aa.due_at,
        aa.created_at
    FROM approval_actions aa
    JOIN contract_approvals ca ON aa.contract_approval_id = ca.id
    JOIN contracts c ON ca.contract_id = c.id
    LEFT JOIN approval_workflow_steps aws ON aa.step_id = aws.id
    WHERE aa.approver_id = p_user_id
      AND aa.action = 'pending'
    ORDER BY aa.due_at ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate contract analytics
CREATE OR REPLACE FUNCTION get_contract_analytics(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_change NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT 
            COUNT(*) as contracts_created,
            COUNT(*) FILTER (WHERE status = 'active') as active_contracts,
            COALESCE(SUM(COALESCE(total_value, contract_value, 0)), 0) as total_value
        FROM contracts
        WHERE created_at::date BETWEEN p_start_date AND p_end_date
    ),
    previous_period AS (
        SELECT 
            COUNT(*) as contracts_created,
            COUNT(*) FILTER (WHERE status = 'active') as active_contracts,
            COALESCE(SUM(COALESCE(total_value, contract_value, 0)), 0) as total_value
        FROM contracts
        WHERE created_at::date BETWEEN p_start_date - (p_end_date - p_start_date) AND p_start_date - INTERVAL '1 day'
    )
    SELECT 'contracts_created'::TEXT, cp.contracts_created::NUMERIC, 
           CASE WHEN pp.contracts_created > 0 
                THEN ((cp.contracts_created - pp.contracts_created)::NUMERIC / pp.contracts_created * 100)
                ELSE 0 END
    FROM current_period cp, previous_period pp
    UNION ALL
    SELECT 'active_contracts'::TEXT, cp.active_contracts::NUMERIC,
           CASE WHEN pp.active_contracts > 0 
                THEN ((cp.active_contracts - pp.active_contracts)::NUMERIC / pp.active_contracts * 100)
                ELSE 0 END
    FROM current_period cp, previous_period pp
    UNION ALL
    SELECT 'total_value'::TEXT, cp.total_value::NUMERIC,
           CASE WHEN pp.total_value > 0 
                THEN ((cp.total_value - pp.total_value)::NUMERIC / pp.total_value * 100)
                ELSE 0 END
    FROM current_period cp, previous_period pp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_pending_approvals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_contract_analytics(DATE, DATE) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE clauses IS 'Reusable contract clauses library';
COMMENT ON TABLE signature_requests IS 'E-signature workflow requests';
COMMENT ON TABLE contract_approvals IS 'Contract approval workflow instances';
COMMENT ON TABLE contract_comments IS 'Collaborative comments on contracts';
COMMENT ON TABLE contract_obligations IS 'Contract deliverables and compliance tracking';

