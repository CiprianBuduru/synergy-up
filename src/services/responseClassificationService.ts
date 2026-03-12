// ─── Response Classification Service ─────────────────────────────────
// Classifies client responses and stores them for knowledge accumulation.

import { supabase } from '@/integrations/supabase/client';

export type ResponseClass =
  | 'positive_interest'
  | 'needs_more_information'
  | 'budget_constraint'
  | 'not_relevant'
  | 'no_response';

export const RESPONSE_CLASS_CONFIG: Record<ResponseClass, { label: string; color: string; icon: string }> = {
  positive_interest: { label: 'Interes pozitiv', color: 'bg-emerald-100 text-emerald-800', icon: '✅' },
  needs_more_information: { label: 'Necesită informații', color: 'bg-amber-100 text-amber-800', icon: '❓' },
  budget_constraint: { label: 'Constrângeri buget', color: 'bg-orange-100 text-orange-800', icon: '💰' },
  not_relevant: { label: 'Nu este relevant', color: 'bg-red-100 text-red-800', icon: '❌' },
  no_response: { label: 'Fără răspuns', color: 'bg-muted text-muted-foreground', icon: '⏳' },
};

export interface ResponseClassification {
  id: string;
  company_id: string;
  interaction_id: string | null;
  classification: ResponseClass;
  reason: string;
  created_at: string;
}

export async function classifyResponse(
  companyId: string,
  classification: ResponseClass,
  reason: string = '',
  interactionId?: string,
): Promise<ResponseClassification | null> {
  const { data, error } = await supabase
    .from('response_classifications')
    .insert({
      company_id: companyId,
      interaction_id: interactionId || null,
      classification,
      reason,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to classify response:', error);
    return null;
  }
  return mapRow(data);
}

export async function fetchClassifications(companyId: string): Promise<ResponseClassification[]> {
  const { data, error } = await supabase
    .from('response_classifications')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data || []).map(mapRow);
}

export async function fetchAllClassifications(): Promise<ResponseClassification[]> {
  const { data, error } = await supabase
    .from('response_classifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data || []).map(mapRow);
}

function mapRow(row: any): ResponseClassification {
  return {
    id: row.id,
    company_id: row.company_id,
    interaction_id: row.interaction_id,
    classification: row.classification as ResponseClass,
    reason: row.reason || '',
    created_at: row.created_at,
  };
}
