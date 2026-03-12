
-- Follow-up tracking table
CREATE TABLE public.company_follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'prospect',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Timeline events table
CREATE TABLE public.company_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT '',
  event_label TEXT NOT NULL DEFAULT '',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_timeline_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for follow_ups
CREATE POLICY "Authenticated users can read follow_ups" ON public.company_follow_ups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert follow_ups" ON public.company_follow_ups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update follow_ups" ON public.company_follow_ups FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete follow_ups" ON public.company_follow_ups FOR DELETE TO authenticated USING (true);

-- RLS policies for timeline_events
CREATE POLICY "Authenticated users can read timeline_events" ON public.company_timeline_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert timeline_events" ON public.company_timeline_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete timeline_events" ON public.company_timeline_events FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at on follow_ups
CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON public.company_follow_ups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
