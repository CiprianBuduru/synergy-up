// ─── Follow-Up Service ───────────────────────────────────────────────
// Manages opportunity status tracking and timeline events.

import { supabase } from '@/integrations/supabase/client';

export type FollowUpStatus =
  | 'prospect'
  | 'presentation_sent'
  | 'waiting_response'
  | 'interested'
  | 'negotiation'
  | 'won'
  | 'lost';

export const FOLLOW_UP_STATUS_CONFIG: Record<FollowUpStatus, { label: string; color: string; icon: string }> = {
  prospect: { label: 'Prospect', color: 'bg-muted text-muted-foreground', icon: '🔍' },
  presentation_sent: { label: 'Prezentare trimisă', color: 'bg-blue-50 text-blue-700 border border-blue-200', icon: '📤' },
  waiting_response: { label: 'Așteptăm răspuns', color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: '⏳' },
  interested: { label: 'Interesat', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: '✅' },
  negotiation: { label: 'Negociere', color: 'bg-purple-50 text-purple-700 border border-purple-200', icon: '🤝' },
  won: { label: 'Câștigat', color: 'bg-green-50 text-green-800 border border-green-200', icon: '🏆' },
  lost: { label: 'Pierdut', color: 'bg-red-50 text-red-700 border border-red-200', icon: '❌' },
};

export interface CompanyFollowUp {
  id: string;
  company_id: string;
  status: FollowUpStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  company_id: string;
  event_type: string;
  event_label: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

// ─── Fetch ──────────────────────────────────────────────────

export async function fetchFollowUp(companyId: string): Promise<CompanyFollowUp | null> {
  const { data, error } = await supabase
    .from('company_follow_ups')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as CompanyFollowUp;
}

export async function upsertFollowUp(companyId: string, status: FollowUpStatus, notes?: string): Promise<CompanyFollowUp | null> {
  // Check if exists
  const existing = await fetchFollowUp(companyId);
  if (existing) {
    const { data, error } = await supabase
      .from('company_follow_ups')
      .update({ status, notes: notes ?? existing.notes })
      .eq('id', existing.id)
      .select()
      .single();
    if (error || !data) return null;
    // Log timeline event
    await addTimelineEvent(companyId, 'status_change', `Status: ${FOLLOW_UP_STATUS_CONFIG[status].label}`);
    return data as CompanyFollowUp;
  } else {
    const { data, error } = await supabase
      .from('company_follow_ups')
      .insert({ company_id: companyId, status, notes: notes || '' })
      .select()
      .single();
    if (error || !data) return null;
    await addTimelineEvent(companyId, 'created', 'Oportunitate creată');
    return data as CompanyFollowUp;
  }
}

export async function fetchTimelineEvents(companyId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('company_timeline_events')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as TimelineEvent[];
}

export async function addTimelineEvent(
  companyId: string,
  eventType: string,
  eventLabel: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await supabase.from('company_timeline_events').insert([{
    company_id: companyId,
    event_type: eventType,
    event_label: eventLabel,
    metadata_json: (metadata || {}) as any,
  }]);
}

// ─── Aggregate stats ────────────────────────────────────────

export async function fetchSalesStats(): Promise<{
  total_prospects: number;
  presentations_sent: number;
  interested: number;
  won: number;
}> {
  const { data, error } = await supabase
    .from('company_follow_ups')
    .select('status');
  if (error || !data) return { total_prospects: 0, presentations_sent: 0, interested: 0, won: 0 };

  return {
    total_prospects: data.length,
    presentations_sent: data.filter(d => d.status !== 'prospect').length,
    interested: data.filter(d => ['interested', 'negotiation', 'won'].includes(d.status)).length,
    won: data.filter(d => d.status === 'won').length,
  };
}
