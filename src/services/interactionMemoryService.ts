// ─── Interaction Memory Service ──────────────────────────────────────
// Stores and retrieves commercial interactions for the AI Knowledge Engine.

import { supabase } from '@/integrations/supabase/client';

export type InteractionType =
  | 'presentation_generated'
  | 'presentation_sent'
  | 'client_reply'
  | 'meeting'
  | 'deal_won'
  | 'deal_lost';

export interface InteractionMemory {
  id: string;
  company_id: string;
  interaction_type: InteractionType;
  created_at: string;
  presentation_id: string | null;
  pitch_strategy_used: string;
  products_recommended: string[];
  kits_recommended: string[];
  client_response: string;
  outcome: string;
  metadata_json: Record<string, unknown>;
}

export async function recordInteraction(
  companyId: string,
  type: InteractionType,
  details: {
    presentation_id?: string;
    pitch_strategy_used?: string;
    products_recommended?: string[];
    kits_recommended?: string[];
    client_response?: string;
    outcome?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<InteractionMemory | null> {
  const { data, error } = await supabase
    .from('interaction_memories')
    .insert({
      company_id: companyId,
      interaction_type: type,
      presentation_id: details.presentation_id || null,
      pitch_strategy_used: details.pitch_strategy_used || '',
      products_recommended: (details.products_recommended || []) as unknown as import('@/integrations/supabase/types').Json,
      kits_recommended: (details.kits_recommended || []) as unknown as import('@/integrations/supabase/types').Json,
      client_response: details.client_response || '',
      outcome: details.outcome || '',
      metadata_json: (details.metadata || {}) as unknown as import('@/integrations/supabase/types').Json,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to record interaction:', error);
    return null;
  }
  return mapRow(data);
}

export async function fetchInteractions(companyId: string): Promise<InteractionMemory[]> {
  const { data, error } = await supabase
    .from('interaction_memories')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch interactions:', error);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function fetchAllInteractions(): Promise<InteractionMemory[]> {
  const { data, error } = await supabase
    .from('interaction_memories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch all interactions:', error);
    return [];
  }
  return (data || []).map(mapRow);
}

function mapRow(row: any): InteractionMemory {
  return {
    id: row.id,
    company_id: row.company_id,
    interaction_type: row.interaction_type as InteractionType,
    created_at: row.created_at,
    presentation_id: row.presentation_id,
    pitch_strategy_used: row.pitch_strategy_used || '',
    products_recommended: Array.isArray(row.products_recommended) ? row.products_recommended : [],
    kits_recommended: Array.isArray(row.kits_recommended) ? row.kits_recommended : [],
    client_response: row.client_response || '',
    outcome: row.outcome || '',
    metadata_json: row.metadata_json || {},
  };
}
