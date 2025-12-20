-- Workflow Automation Engine
-- Creates system for automated business processes and workflows

-- 1. Workflow Definitions Table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'document', 'attendance', 'task', 'target', 'leave', 'recruitment', 'offboarding', 'compliance', 'general'
  )),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'event', 'schedule', 'manual', 'condition'
  )),
  trigger_config JSONB DEFAULT '{}'::jsonb, -- Event details, schedule, conditions
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_workflows_company_id ON workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);

-- 2. Workflow Steps Table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN (
    'notification', 'data_update', 'approval', 'condition', 'delay', 'webhook', 'script'
  )),
  step_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Step-specific configuration
  conditions JSONB DEFAULT '[]'::jsonb, -- Conditions for step execution
  on_success_action TEXT, -- Next step on success
  on_failure_action TEXT, -- Next step on failure
  timeout_seconds INTEGER, -- Timeout for step
  retry_count INTEGER DEFAULT 0,
  retry_delay_seconds INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT workflow_steps_order_unique UNIQUE (workflow_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON workflow_steps(workflow_id, step_order);

-- 3. Workflow Executions Table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_event TEXT, -- What triggered this execution
  trigger_data JSONB DEFAULT '{}'::jsonb, -- Data from trigger
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'cancelled', 'paused'
  )),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  execution_data JSONB DEFAULT '{}'::jsonb, -- Data collected during execution
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);

-- 4. Workflow Step Executions Table
CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'skipped'
  )),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER, -- Duration in milliseconds
  result_data JSONB DEFAULT '{}'::jsonb, -- Step execution result
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_execution_id ON workflow_step_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_step_id ON workflow_step_executions(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_status ON workflow_step_executions(status);

-- 5. Workflow Templates Table (Pre-built workflows)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  template_config JSONB NOT NULL, -- Complete workflow definition
  is_system_template BOOLEAN DEFAULT false, -- System templates vs user-created
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);

-- 6. Function to update updated_at
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

CREATE TRIGGER trigger_update_workflow_steps_updated_at
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

CREATE TRIGGER trigger_update_workflow_executions_updated_at
  BEFORE UPDATE ON workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

CREATE TRIGGER trigger_update_workflow_step_executions_updated_at
  BEFORE UPDATE ON workflow_step_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

-- 7. Insert Common Workflow Templates
INSERT INTO workflow_templates (name, description, category, template_config, is_system_template) VALUES
(
  'Document Expiry Alert',
  'Automatically sends alerts when documents are expiring',
  'document',
  '{
    "trigger": {
      "type": "schedule",
      "schedule": "daily",
      "time": "09:00"
    },
    "steps": [
      {
        "order": 1,
        "type": "condition",
        "config": {
          "condition": "check_expiring_documents",
          "days_before": [90, 60, 30, 14, 7]
        }
      },
      {
        "order": 2,
        "type": "notification",
        "config": {
          "channels": ["email", "in_app"],
          "priority": "high"
        }
      }
    ]
  }'::jsonb,
  true
),
(
  'New Employee Onboarding',
  'Automated workflow for new employee onboarding',
  'recruitment',
  '{
    "trigger": {
      "type": "event",
      "event": "employee_hired"
    },
    "steps": [
      {
        "order": 1,
        "type": "notification",
        "config": {
          "recipient": "employee",
          "template": "welcome_email"
        }
      },
      {
        "order": 2,
        "type": "data_update",
        "config": {
          "action": "create_onboarding_tasks"
        }
      },
      {
        "order": 3,
        "type": "notification",
        "config": {
          "recipient": "hr",
          "template": "new_employee_notification"
        }
      }
    ]
  }'::jsonb,
  true
),
(
  'Attendance Anomaly Detection',
  'Detects and alerts on attendance anomalies',
  'attendance',
  '{
    "trigger": {
      "type": "schedule",
      "schedule": "daily",
      "time": "18:00"
    },
    "steps": [
      {
        "order": 1,
        "type": "condition",
        "config": {
          "condition": "check_attendance_anomalies"
        }
      },
      {
        "order": 2,
        "type": "notification",
        "config": {
          "recipient": "manager",
          "priority": "medium"
        }
      }
    ]
  }'::jsonb,
  true
),
(
  'Task Overdue Reminder',
  'Sends reminders for overdue tasks',
  'task',
  '{
    "trigger": {
      "type": "schedule",
      "schedule": "daily",
      "time": "10:00"
    },
    "steps": [
      {
        "order": 1,
        "type": "condition",
        "config": {
          "condition": "find_overdue_tasks"
        }
      },
      {
        "order": 2,
        "type": "notification",
        "config": {
          "recipient": "assignee",
          "channels": ["email", "in_app"]
        }
      }
    ]
  }'::jsonb,
  true
);

-- 8. Comments
COMMENT ON TABLE workflows IS 'Workflow definitions for automated business processes';
COMMENT ON TABLE workflow_steps IS 'Individual steps within a workflow';
COMMENT ON TABLE workflow_executions IS 'Execution history of workflows';
COMMENT ON TABLE workflow_step_executions IS 'Execution history of individual workflow steps';
COMMENT ON TABLE workflow_templates IS 'Pre-built workflow templates for common processes';

