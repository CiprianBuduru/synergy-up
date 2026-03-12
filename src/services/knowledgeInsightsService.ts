// ─── Knowledge Insights Service ──────────────────────────────────────
// Analyzes historical interaction data to surface actionable insights.

import { fetchAllInteractions, type InteractionMemory } from './interactionMemoryService';
import { fetchAllClassifications, type ResponseClassification } from './responseClassificationService';
import { supabase } from '@/integrations/supabase/client';

export interface IndustryInsight {
  industry: string;
  total_interactions: number;
  won: number;
  interest_rate: number; // 0-100
}

export interface KitInsight {
  kit_name: string;
  times_recommended: number;
  times_won: number;
  success_rate: number;
}

export interface ProductInsight {
  product_name: string;
  times_recommended: number;
  times_won: number;
  success_rate: number;
}

export interface PitchInsight {
  strategy: string;
  times_used: number;
  times_won: number;
  conversion_rate: number;
}

export interface KnowledgeInsights {
  top_industries: IndustryInsight[];
  top_kits: KitInsight[];
  top_products: ProductInsight[];
  top_pitches: PitchInsight[];
  total_interactions: number;
  total_won: number;
  total_lost: number;
  overall_conversion: number;
}

export async function generateKnowledgeInsights(): Promise<KnowledgeInsights> {
  const interactions = await fetchAllInteractions();
  const classifications = await fetchAllClassifications();

  // Fetch company industries
  const companyIds = [...new Set(interactions.map(i => i.company_id))];
  const { data: companies } = await supabase
    .from('companies')
    .select('id, industry')
    .in('id', companyIds.length > 0 ? companyIds : ['__none__']);

  const companyIndustryMap: Record<string, string> = {};
  (companies || []).forEach(c => { companyIndustryMap[c.id] = c.industry || 'Necunoscut'; });

  const won = interactions.filter(i => i.interaction_type === 'deal_won');
  const lost = interactions.filter(i => i.interaction_type === 'deal_lost');

  // Industry insights
  const industryMap: Record<string, { total: number; won: number }> = {};
  interactions.forEach(i => {
    const ind = companyIndustryMap[i.company_id] || 'Necunoscut';
    if (!industryMap[ind]) industryMap[ind] = { total: 0, won: 0 };
    industryMap[ind].total++;
  });
  won.forEach(w => {
    const ind = companyIndustryMap[w.company_id] || 'Necunoscut';
    if (industryMap[ind]) industryMap[ind].won++;
  });
  const top_industries: IndustryInsight[] = Object.entries(industryMap)
    .map(([industry, d]) => ({ industry, total_interactions: d.total, won: d.won, interest_rate: d.total > 0 ? Math.round((d.won / d.total) * 100) : 0 }))
    .sort((a, b) => b.interest_rate - a.interest_rate)
    .slice(0, 10);

  // Kit insights
  const kitMap: Record<string, { recommended: number; won: number }> = {};
  interactions.forEach(i => {
    (i.kits_recommended || []).forEach(k => {
      if (!kitMap[k]) kitMap[k] = { recommended: 0, won: 0 };
      kitMap[k].recommended++;
    });
  });
  won.forEach(w => {
    (w.kits_recommended || []).forEach(k => {
      if (kitMap[k]) kitMap[k].won++;
    });
  });
  const top_kits: KitInsight[] = Object.entries(kitMap)
    .map(([kit_name, d]) => ({ kit_name, times_recommended: d.recommended, times_won: d.won, success_rate: d.recommended > 0 ? Math.round((d.won / d.recommended) * 100) : 0 }))
    .sort((a, b) => b.success_rate - a.success_rate)
    .slice(0, 10);

  // Product insights
  const prodMap: Record<string, { recommended: number; won: number }> = {};
  interactions.forEach(i => {
    (i.products_recommended || []).forEach(p => {
      if (!prodMap[p]) prodMap[p] = { recommended: 0, won: 0 };
      prodMap[p].recommended++;
    });
  });
  won.forEach(w => {
    (w.products_recommended || []).forEach(p => {
      if (prodMap[p]) prodMap[p].won++;
    });
  });
  const top_products: ProductInsight[] = Object.entries(prodMap)
    .map(([product_name, d]) => ({ product_name, times_recommended: d.recommended, times_won: d.won, success_rate: d.recommended > 0 ? Math.round((d.won / d.recommended) * 100) : 0 }))
    .sort((a, b) => b.success_rate - a.success_rate)
    .slice(0, 10);

  // Pitch insights
  const pitchMap: Record<string, { used: number; won: number }> = {};
  interactions.filter(i => i.pitch_strategy_used).forEach(i => {
    const s = i.pitch_strategy_used;
    if (!pitchMap[s]) pitchMap[s] = { used: 0, won: 0 };
    pitchMap[s].used++;
  });
  won.filter(w => w.pitch_strategy_used).forEach(w => {
    const s = w.pitch_strategy_used;
    if (pitchMap[s]) pitchMap[s].won++;
  });
  const top_pitches: PitchInsight[] = Object.entries(pitchMap)
    .map(([strategy, d]) => ({ strategy, times_used: d.used, times_won: d.won, conversion_rate: d.used > 0 ? Math.round((d.won / d.used) * 100) : 0 }))
    .sort((a, b) => b.conversion_rate - a.conversion_rate)
    .slice(0, 10);

  return {
    top_industries,
    top_kits,
    top_products,
    top_pitches,
    total_interactions: interactions.length,
    total_won: won.length,
    total_lost: lost.length,
    overall_conversion: interactions.length > 0 ? Math.round((won.length / interactions.length) * 100) : 0,
  };
}
