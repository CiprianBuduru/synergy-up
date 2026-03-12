
-- Interaction memories table
CREATE TABLE public.interaction_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  interaction_type text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  presentation_id uuid REFERENCES public.presentations(id) ON DELETE SET NULL,
  pitch_strategy_used text NOT NULL DEFAULT '',
  products_recommended jsonb NOT NULL DEFAULT '[]'::jsonb,
  kits_recommended jsonb NOT NULL DEFAULT '[]'::jsonb,
  client_response text NOT NULL DEFAULT '',
  outcome text NOT NULL DEFAULT '',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.interaction_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read interaction_memories" ON public.interaction_memories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert interaction_memories" ON public.interaction_memories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update interaction_memories" ON public.interaction_memories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete interaction_memories" ON public.interaction_memories FOR DELETE TO authenticated USING (true);

-- Response classifications table
CREATE TABLE public.response_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  interaction_id uuid REFERENCES public.interaction_memories(id) ON DELETE CASCADE,
  classification text NOT NULL DEFAULT 'no_response',
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.response_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read response_classifications" ON public.response_classifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert response_classifications" ON public.response_classifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update response_classifications" ON public.response_classifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete response_classifications" ON public.response_classifications FOR DELETE TO authenticated USING (true);
