
-- ═══════════════════════════════════════════════════════════════
-- Synergy-UP: Full schema migration
-- ═══════════════════════════════════════════════════════════════

-- Helper: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ─── Companies ──────────────────────────────────────────────
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  legal_name TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  company_size TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_role TEXT NOT NULL DEFAULT '',
  contact_department TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update companies" ON public.companies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete companies" ON public.companies FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Company Enrichments ────────────────────────────────────
CREATE TABLE public.company_enrichments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  industry_label TEXT NOT NULL DEFAULT '',
  caen_code TEXT NOT NULL DEFAULT '',
  caen_label TEXT NOT NULL DEFAULT '',
  employee_count_exact INTEGER,
  employee_count_min INTEGER,
  employee_count_max INTEGER,
  employee_count_estimate INTEGER,
  employee_count_confidence NUMERIC NOT NULL DEFAULT 0,
  headquarters TEXT NOT NULL DEFAULT '',
  public_summary TEXT NOT NULL DEFAULT '',
  enrichment_status TEXT NOT NULL DEFAULT 'estimated' CHECK (enrichment_status IN ('verified', 'estimated', 'needs_confirmation')),
  sources_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  signals_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_enriched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_enrichments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read enrichments" ON public.company_enrichments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert enrichments" ON public.company_enrichments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update enrichments" ON public.company_enrichments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete enrichments" ON public.company_enrichments FOR DELETE TO authenticated USING (true);

-- ─── Calculations ───────────────────────────────────────────
CREATE TABLE public.calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_count_used INTEGER NOT NULL DEFAULT 0,
  disabled_employees_declared INTEGER NOT NULL DEFAULT 0,
  required_positions_4_percent INTEGER NOT NULL DEFAULT 0,
  uncovered_positions INTEGER NOT NULL DEFAULT 0,
  min_wage_used NUMERIC NOT NULL DEFAULT 0,
  monthly_obligation_estimated NUMERIC NOT NULL DEFAULT 0,
  spendable_half_estimated NUMERIC NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read calculations" ON public.calculations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert calculations" ON public.calculations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update calculations" ON public.calculations FOR UPDATE TO authenticated USING (true);

-- ─── Briefs ─────────────────────────────────────────────────
CREATE TABLE public.briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  raw_brief TEXT NOT NULL DEFAULT '',
  requested_products_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  requested_purpose TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  department_detected TEXT NOT NULL DEFAULT '',
  tone_recommended TEXT NOT NULL DEFAULT '',
  eligibility_status TEXT NOT NULL DEFAULT 'eligible' CHECK (eligibility_status IN ('eligible', 'conditionally_eligible', 'not_eligible', 'needs_review')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read briefs" ON public.briefs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert briefs" ON public.briefs FOR INSERT TO authenticated WITH CHECK (true);

-- ─── Products ───────────────────────────────────────────────
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  base_product_type TEXT NOT NULL DEFAULT '',
  internal_operations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_caen_codes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  eligible_logic TEXT NOT NULL DEFAULT '',
  suggested_industries_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  suitable_departments_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  suitable_for_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  usable_in_kits BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);

-- ─── Kits ───────────────────────────────────────────────────
CREATE TABLE public.kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  purpose TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT '',
  target_departments JSONB NOT NULL DEFAULT '[]'::jsonb,
  complexity TEXT NOT NULL DEFAULT 'standard' CHECK (complexity IN ('simplu', 'standard', 'premium')),
  suggested_industries_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  components_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  internal_operations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_caen_codes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  eligibility_type TEXT NOT NULL DEFAULT 'eligible',
  eligibility_explanation TEXT NOT NULL DEFAULT '',
  sales_angle TEXT NOT NULL DEFAULT '',
  presentation_use_case TEXT NOT NULL DEFAULT '',
  is_alternative BOOLEAN NOT NULL DEFAULT false,
  alternative_for JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read kits" ON public.kits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert kits" ON public.kits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update kits" ON public.kits FOR UPDATE TO authenticated USING (true);

-- ─── Presentations ──────────────────────────────────────────
CREATE TABLE public.presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES public.briefs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT '',
  tone TEXT NOT NULL DEFAULT 'corporate' CHECK (tone IN ('corporate', 'friendly', 'premium', 'technical')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'research_done', 'presentation_generated', 'sent', 'follow_up')),
  generated_summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read presentations" ON public.presentations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert presentations" ON public.presentations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update presentations" ON public.presentations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete presentations" ON public.presentations FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_presentations_updated_at BEFORE UPDATE ON public.presentations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Slides ─────────────────────────────────────────────────
CREATE TABLE public.slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  slide_order INTEGER NOT NULL DEFAULT 0,
  slide_type TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  visible BOOLEAN NOT NULL DEFAULT true,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read slides" ON public.slides FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert slides" ON public.slides FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update slides" ON public.slides FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete slides" ON public.slides FOR DELETE TO authenticated USING (true);

-- ─── Operations (reference table) ───────────────────────────
CREATE TABLE public.operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  caen_code TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read operations" ON public.operations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert operations" ON public.operations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update operations" ON public.operations FOR UPDATE TO authenticated USING (true);

-- ─── Alternatives (reference table) ─────────────────────────
CREATE TABLE public.alternatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_request_keyword TEXT NOT NULL,
  suggested_product_or_kit TEXT NOT NULL DEFAULT '',
  explanation TEXT NOT NULL DEFAULT '',
  relevance_tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.alternatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read alternatives" ON public.alternatives FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert alternatives" ON public.alternatives FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update alternatives" ON public.alternatives FOR UPDATE TO authenticated USING (true);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_enrichments_company_id ON public.company_enrichments(company_id);
CREATE INDEX idx_calculations_company_id ON public.calculations(company_id);
CREATE INDEX idx_briefs_company_id ON public.briefs(company_id);
CREATE INDEX idx_presentations_company_id ON public.presentations(company_id);
CREATE INDEX idx_slides_presentation_id ON public.slides(presentation_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_kits_category ON public.kits(category);
