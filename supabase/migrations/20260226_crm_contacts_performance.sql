-- CRM Contacts table
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  type TEXT DEFAULT 'lead' CHECK (type IN ('client','lead','partner','vendor','other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  city TEXT,
  country TEXT DEFAULT 'Oman',
  notes TEXT,
  tags TEXT[],
  assigned_to UUID REFERENCES auth.users(id),
  last_contacted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_contacts_company_access" ON public.crm_contacts
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON public.crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON public.crm_contacts(type);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);

-- Performance Reviews table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id),
  period TEXT NOT NULL,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  goals_met INTEGER CHECK (goals_met BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  teamwork_rating INTEGER CHECK (teamwork_rating BETWEEN 1 AND 5),
  initiative_rating INTEGER CHECK (initiative_rating BETWEEN 1 AND 5),
  comments TEXT,
  goals_next_period TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','acknowledged','completed')),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "performance_reviews_access" ON public.performance_reviews
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_perf_reviews_employee ON public.performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_reviews_company ON public.performance_reviews(company_id);

-- Tasks table (if not exists)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled','overdue')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  category TEXT,
  tags TEXT[],
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_company_access" ON public.tasks
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR assigned_to = auth.uid()
    OR assigned_by = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Targets / Goals table
CREATE TABLE IF NOT EXISTS public.targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  department TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','paused')),
  category TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "targets_company_access" ON public.targets
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR assigned_to = auth.uid()
  );

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_crm_contacts_updated_at') THEN
    CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_performance_reviews_updated_at') THEN
    CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_targets_updated_at') THEN
    CREATE TRIGGER update_targets_updated_at BEFORE UPDATE ON public.targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
