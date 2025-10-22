-- =====================================================
-- Migration: Dashboard Layouts and Widget Configuration (FIXED)
-- Description: Add tables for customizable dashboard layouts
-- Date: 2025-10-22
-- Fix: Changed CONSTRAINT with WHERE to filtered UNIQUE INDEX
-- =====================================================

-- =====================================================
-- 1. Dashboard Layouts Table
-- =====================================================
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'My Dashboard',
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  layout_data JSONB NOT NULL,
  breakpoint VARCHAR(50) DEFAULT 'lg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);

-- Partial unique index to ensure user has at most one default layout
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_layouts_unique_default 
  ON dashboard_layouts(user_id) 
  WHERE is_default = true;

-- Partial indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_is_default 
  ON dashboard_layouts(user_id, is_default) 
  WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_is_shared 
  ON dashboard_layouts(is_shared) 
  WHERE is_shared = true;

-- Add comments
COMMENT ON TABLE dashboard_layouts IS 'Stores user dashboard layout configurations';
COMMENT ON COLUMN dashboard_layouts.layout_data IS 'JSON array of widget configurations with positions and settings';
COMMENT ON COLUMN dashboard_layouts.breakpoint IS 'Responsive breakpoint: lg, md, sm, xs';

-- =====================================================
-- 2. Widget Configurations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS widget_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
  widget_type VARCHAR(100) NOT NULL,
  widget_config JSONB NOT NULL DEFAULT '{}',
  position_data JSONB NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  refresh_interval INTEGER DEFAULT 60, -- seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_widget_configurations_layout_id ON widget_configurations(layout_id);
CREATE INDEX IF NOT EXISTS idx_widget_configurations_widget_type ON widget_configurations(widget_type);

-- Add comments
COMMENT ON TABLE widget_configurations IS 'Individual widget configurations within a layout';
COMMENT ON COLUMN widget_configurations.widget_type IS 'Type of widget: contract_metrics, promoter_metrics, etc.';
COMMENT ON COLUMN widget_configurations.widget_config IS 'Widget-specific configuration like filters, display options';
COMMENT ON COLUMN widget_configurations.position_data IS 'Grid position: {x, y, w, h, minW, minH}';

-- =====================================================
-- 3. Default Layouts by Role Table
-- =====================================================
CREATE TABLE IF NOT EXISTS default_layouts_by_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(100) NOT NULL UNIQUE,
  layout_data JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comments
COMMENT ON TABLE default_layouts_by_role IS 'Default dashboard layouts for different user roles';
COMMENT ON COLUMN default_layouts_by_role.role IS 'User role: admin, manager, user, etc.';

-- =====================================================
-- 4. Shared Layouts Table
-- =====================================================
CREATE TABLE IF NOT EXISTS shared_layout_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_role VARCHAR(100),
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure either user_id or role is set, not both
  CONSTRAINT check_shared_target CHECK (
    (shared_with_user_id IS NOT NULL AND shared_with_role IS NULL) OR
    (shared_with_user_id IS NULL AND shared_with_role IS NOT NULL)
  )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_shared_layout_access_layout_id ON shared_layout_access(layout_id);
CREATE INDEX IF NOT EXISTS idx_shared_layout_access_user_id ON shared_layout_access(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_layout_access_role ON shared_layout_access(shared_with_role);

-- Add comments
COMMENT ON TABLE shared_layout_access IS 'Controls who can access shared dashboard layouts';

-- =====================================================
-- 5. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_layouts_by_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_layout_access ENABLE ROW LEVEL SECURITY;

-- Dashboard Layouts Policies
DROP POLICY IF EXISTS "Users can view their own layouts" ON dashboard_layouts;
CREATE POLICY "Users can view their own layouts"
  ON dashboard_layouts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view shared layouts" ON dashboard_layouts;
CREATE POLICY "Users can view shared layouts"
  ON dashboard_layouts FOR SELECT
  USING (
    is_shared = true AND (
      EXISTS (
        SELECT 1 FROM shared_layout_access
        WHERE layout_id = dashboard_layouts.id
        AND shared_with_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert their own layouts" ON dashboard_layouts;
CREATE POLICY "Users can insert their own layouts"
  ON dashboard_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own layouts" ON dashboard_layouts;
CREATE POLICY "Users can update their own layouts"
  ON dashboard_layouts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own layouts" ON dashboard_layouts;
CREATE POLICY "Users can delete their own layouts"
  ON dashboard_layouts FOR DELETE
  USING (auth.uid() = user_id);

-- Widget Configurations Policies
DROP POLICY IF EXISTS "Users can view widgets of their layouts" ON widget_configurations;
CREATE POLICY "Users can view widgets of their layouts"
  ON widget_configurations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dashboard_layouts
      WHERE dashboard_layouts.id = widget_configurations.layout_id
      AND dashboard_layouts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert widgets to their layouts" ON widget_configurations;
CREATE POLICY "Users can insert widgets to their layouts"
  ON widget_configurations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboard_layouts
      WHERE dashboard_layouts.id = layout_id
      AND dashboard_layouts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update widgets of their layouts" ON widget_configurations;
CREATE POLICY "Users can update widgets of their layouts"
  ON widget_configurations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard_layouts
      WHERE dashboard_layouts.id = widget_configurations.layout_id
      AND dashboard_layouts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete widgets of their layouts" ON widget_configurations;
CREATE POLICY "Users can delete widgets of their layouts"
  ON widget_configurations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard_layouts
      WHERE dashboard_layouts.id = widget_configurations.layout_id
      AND dashboard_layouts.user_id = auth.uid()
    )
  );

-- Default Layouts by Role Policies
DROP POLICY IF EXISTS "Everyone can view default layouts" ON default_layouts_by_role;
CREATE POLICY "Everyone can view default layouts"
  ON default_layouts_by_role FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage default layouts" ON default_layouts_by_role;
CREATE POLICY "Only admins can manage default layouts"
  ON default_layouts_by_role FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Shared Layout Access Policies
DROP POLICY IF EXISTS "Users can view their shared access" ON shared_layout_access;
CREATE POLICY "Users can view their shared access"
  ON shared_layout_access FOR SELECT
  USING (
    shared_with_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM dashboard_layouts
      WHERE dashboard_layouts.id = shared_layout_access.layout_id
      AND dashboard_layouts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Layout owners can manage sharing" ON shared_layout_access;
CREATE POLICY "Layout owners can manage sharing"
  ON shared_layout_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM dashboard_layouts
      WHERE dashboard_layouts.id = layout_id
      AND dashboard_layouts.user_id = auth.uid()
    )
  );

-- =====================================================
-- 6. Helper Functions
-- =====================================================

-- Function to get user's dashboard layout
CREATE OR REPLACE FUNCTION get_user_dashboard_layout(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_layout JSONB;
  v_user_role VARCHAR(100);
BEGIN
  -- Try to get user's default layout
  SELECT layout_data INTO v_layout
  FROM dashboard_layouts
  WHERE user_id = p_user_id AND is_default = true
  LIMIT 1;
  
  -- If no custom layout, get role-based default
  IF v_layout IS NULL THEN
    -- Get user's role
    SELECT role INTO v_user_role
    FROM users
    WHERE id = p_user_id;
    
    -- Get default layout for role
    SELECT layout_data INTO v_layout
    FROM default_layouts_by_role
    WHERE role = COALESCE(v_user_role, 'user');
  END IF;
  
  RETURN v_layout;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clone a layout
CREATE OR REPLACE FUNCTION clone_dashboard_layout(
  p_source_layout_id UUID,
  p_new_name VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_new_layout_id UUID;
  v_source_layout dashboard_layouts%ROWTYPE;
  v_widget widget_configurations%ROWTYPE;
BEGIN
  -- Get source layout
  SELECT * INTO v_source_layout
  FROM dashboard_layouts
  WHERE id = p_source_layout_id
  AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Layout not found or access denied';
  END IF;
  
  -- Create new layout
  INSERT INTO dashboard_layouts (
    user_id,
    name,
    is_default,
    is_shared,
    layout_data,
    breakpoint
  ) VALUES (
    auth.uid(),
    COALESCE(p_new_name, v_source_layout.name || ' (Copy)'),
    false,
    false,
    v_source_layout.layout_data,
    v_source_layout.breakpoint
  )
  RETURNING id INTO v_new_layout_id;
  
  -- Clone widgets
  FOR v_widget IN
    SELECT * FROM widget_configurations
    WHERE layout_id = p_source_layout_id
  LOOP
    INSERT INTO widget_configurations (
      layout_id,
      widget_type,
      widget_config,
      position_data,
      is_visible,
      refresh_interval
    ) VALUES (
      v_new_layout_id,
      v_widget.widget_type,
      v_widget.widget_config,
      v_widget.position_data,
      v_widget.is_visible,
      v_widget.refresh_interval
    );
  END LOOP;
  
  RETURN v_new_layout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Triggers for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dashboard_layouts_updated_at ON dashboard_layouts;
CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_widget_configurations_updated_at ON widget_configurations;
CREATE TRIGGER update_widget_configurations_updated_at
  BEFORE UPDATE ON widget_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_default_layouts_by_role_updated_at ON default_layouts_by_role;
CREATE TRIGGER update_default_layouts_by_role_updated_at
  BEFORE UPDATE ON default_layouts_by_role
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. Insert Default Layouts
-- =====================================================

-- Admin default layout
INSERT INTO default_layouts_by_role (role, layout_data, description) VALUES (
  'admin',
  '[
    {"i":"contract_metrics","x":0,"y":0,"w":4,"h":2,"minW":2,"minH":2},
    {"i":"promoter_metrics","x":4,"y":0,"w":4,"h":2,"minW":2,"minH":2},
    {"i":"compliance_rate","x":8,"y":0,"w":4,"h":2,"minW":2,"minH":2},
    {"i":"revenue_chart","x":0,"y":2,"w":6,"h":3,"minW":3,"minH":2},
    {"i":"recent_activity","x":6,"y":2,"w":6,"h":3,"minW":3,"minH":2},
    {"i":"upcoming_expiries","x":0,"y":5,"w":6,"h":2,"minW":3,"minH":2},
    {"i":"quick_actions","x":6,"y":5,"w":6,"h":2,"minW":3,"minH":2}
  ]'::jsonb,
  'Default dashboard layout for administrators with full metrics access'
) ON CONFLICT (role) DO UPDATE SET
  layout_data = EXCLUDED.layout_data,
  description = EXCLUDED.description;

-- Manager default layout
INSERT INTO default_layouts_by_role (role, layout_data, description) VALUES (
  'manager',
  '[
    {"i":"contract_metrics","x":0,"y":0,"w":6,"h":2,"minW":3,"minH":2},
    {"i":"recent_activity","x":6,"y":0,"w":6,"h":2,"minW":3,"minH":2},
    {"i":"upcoming_expiries","x":0,"y":2,"w":6,"h":3,"minW":3,"minH":2},
    {"i":"compliance_rate","x":6,"y":2,"w":6,"h":3,"minW":3,"minH":2},
    {"i":"quick_actions","x":0,"y":5,"w":12,"h":2,"minW":6,"minH":2}
  ]'::jsonb,
  'Default dashboard layout for managers with team oversight'
) ON CONFLICT (role) DO UPDATE SET
  layout_data = EXCLUDED.layout_data,
  description = EXCLUDED.description;

-- User default layout
INSERT INTO default_layouts_by_role (role, layout_data, description) VALUES (
  'user',
  '[
    {"i":"contract_metrics","x":0,"y":0,"w":6,"h":2,"minW":3,"minH":2},
    {"i":"recent_activity","x":6,"y":0,"w":6,"h":2,"minW":3,"minH":2},
    {"i":"upcoming_expiries","x":0,"y":2,"w":12,"h":3,"minW":6,"minH":2},
    {"i":"quick_actions","x":0,"y":5,"w":12,"h":2,"minW":6,"minH":2}
  ]'::jsonb,
  'Default dashboard layout for regular users'
) ON CONFLICT (role) DO UPDATE SET
  layout_data = EXCLUDED.layout_data,
  description = EXCLUDED.description;

-- =====================================================
-- 9. Verify Installation
-- =====================================================

-- Check tables exist
DO $$
DECLARE
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'dashboard_layouts',
    'widget_configurations',
    'default_layouts_by_role',
    'shared_layout_access'
  );
  
  IF v_table_count = 4 THEN
    RAISE NOTICE '✅ All dashboard tables created successfully';
  ELSE
    RAISE WARNING '⚠️ Expected 4 tables but found %', v_table_count;
  END IF;
END $$;

-- Show default layouts
SELECT role, description 
FROM default_layouts_by_role 
ORDER BY role;

