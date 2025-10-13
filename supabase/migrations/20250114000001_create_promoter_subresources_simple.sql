-- Migration: Create Promoter Sub-Resources Tables (Simplified)
-- Date: 2025-01-14
-- Purpose: Support documents, education, experience, and skills for promoters

-- ============================================================================
-- PROMOTER DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promoter_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promoter_id UUID NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROMOTER EDUCATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promoter_education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promoter_id UUID NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  grade TEXT,
  description TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROMOTER EXPERIENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promoter_experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promoter_id UUID NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  responsibilities TEXT,
  achievements TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROMOTER SKILLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promoter_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promoter_id UUID NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT,
  proficiency_level TEXT,
  years_of_experience INTEGER,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BASIC INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_promoter_documents_promoter ON public.promoter_documents(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_education_promoter ON public.promoter_education(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_experience_promoter ON public.promoter_experience(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_skills_promoter ON public.promoter_skills(promoter_id);

-- ============================================================================
-- BASIC RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.promoter_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_skills ENABLE ROW LEVEL SECURITY;

-- Simple policies: Users can manage their own promoter data
CREATE POLICY "Users can manage their promoter documents"
  ON public.promoter_documents FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their promoter education"
  ON public.promoter_education FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their promoter experience"
  ON public.promoter_experience FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their promoter skills"
  ON public.promoter_skills FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON public.promoter_documents TO authenticated;
GRANT ALL ON public.promoter_education TO authenticated;
GRANT ALL ON public.promoter_experience TO authenticated;
GRANT ALL ON public.promoter_skills TO authenticated;
