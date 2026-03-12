// ─── Client Pattern Service ──────────────────────────────────────────
// Detects patterns between companies based on interaction history.

import { fetchAllInteractions, type InteractionMemory } from './interactionMemoryService';
import { supabase } from '@/integrations/supabase/client';

export interface DetectedPattern {
  pattern_id: string;
  description: string;
  confidence: number; // 0-1
  affected_industries: string[];
  affected_company_sizes: string[];
  recommended_kits: string[];
  recommended_products: string[];
  sample_size: number;
}

export async function detectPatterns(): Promise<DetectedPattern[]> {
  const interactions = await fetchAllInteractions();
  if (interactions.length < 3) return [];

  const companyIds = [...new Set(interactions.map(i => i.company_id))];
  const { data: companies } = await supabase
    .from('companies')
    .select('id, industry, company_size')
    .in('id', companyIds.length > 0 ? companyIds : ['__none__']);

  const { data: enrichments } = await supabase
    .from('company_enrichments')
    .select('company_id, employee_count_estimate')
    .in('company_id', companyIds.length > 0 ? companyIds : ['__none__']);

  const companyMap: Record<string, { industry: string; size: string; employees: number }> = {};
  (companies || []).forEach(c => {
    companyMap[c.id] = { industry: c.industry || '', size: c.company_size || '', employees: 0 };
  });
  (enrichments || []).forEach(e => {
    if (companyMap[e.company_id]) companyMap[e.company_id].employees = e.employee_count_estimate || 0;
  });

  const won = interactions.filter(i => i.interaction_type === 'deal_won');
  const patterns: DetectedPattern[] = [];

  // Pattern: Industry + Size → successful kits
  const groupKey = (cId: string) => {
    const c = companyMap[cId];
    if (!c) return null;
    const sizeLabel = c.employees >= 500 ? 'large' : c.employees >= 100 ? 'medium' : 'small';
    return `${c.industry}|${sizeLabel}`;
  };

  const groups: Record<string, { companies: Set<string>; wonKits: Record<string, number>; wonProducts: Record<string, number>; total: number; wonCount: number }> = {};

  interactions.forEach(i => {
    const key = groupKey(i.company_id);
    if (!key) return;
    if (!groups[key]) groups[key] = { companies: new Set(), wonKits: {}, wonProducts: {}, total: 0, wonCount: 0 };
    groups[key].companies.add(i.company_id);
    groups[key].total++;
  });

  won.forEach(w => {
    const key = groupKey(w.company_id);
    if (!key || !groups[key]) return;
    groups[key].wonCount++;
    (w.kits_recommended || []).forEach(k => {
      groups[key].wonKits[k] = (groups[key].wonKits[k] || 0) + 1;
    });
    (w.products_recommended || []).forEach(p => {
      groups[key].wonProducts[p] = (groups[key].wonProducts[p] || 0) + 1;
    });
  });

  Object.entries(groups).forEach(([key, g]) => {
    if (g.companies.size < 2 || g.wonCount < 1) return;
    const [industry, sizeLabel] = key.split('|');
    const sizeDesc = sizeLabel === 'large' ? '>500 angajați' : sizeLabel === 'medium' ? '100-500 angajați' : '<100 angajați';
    const topKits = Object.entries(g.wonKits).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    const topProducts = Object.entries(g.wonProducts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p]) => p);

    if (topKits.length === 0 && topProducts.length === 0) return;

    const confidence = Math.min(1, g.wonCount / g.total + 0.1 * g.companies.size);
    patterns.push({
      pattern_id: `pattern_${key.replace(/[^a-z0-9]/gi, '_')}`,
      description: `Companiile din ${industry} (${sizeDesc}) răspund bine la ${topKits.length > 0 ? topKits.join(', ') : topProducts.join(', ')}.`,
      confidence: Math.round(confidence * 100) / 100,
      affected_industries: [industry],
      affected_company_sizes: [sizeLabel],
      recommended_kits: topKits,
      recommended_products: topProducts,
      sample_size: g.companies.size,
    });
  });

  return patterns.sort((a, b) => b.confidence - a.confidence);
}
