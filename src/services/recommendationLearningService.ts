// ─── Recommendation Learning Service ─────────────────────────────────
// Adjusts solution ranking scores based on historical win/loss data.

import { fetchAllInteractions } from './interactionMemoryService';

export interface HistoricalBoost {
  product_boosts: Record<string, number>; // product name → -1 to +1
  kit_boosts: Record<string, number>;     // kit name → -1 to +1
  strategy_boosts: Record<string, number>; // strategy → -1 to +1
}

let cachedBoosts: HistoricalBoost | null = null;
let lastComputed = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getHistoricalBoosts(): Promise<HistoricalBoost> {
  if (cachedBoosts && Date.now() - lastComputed < CACHE_TTL) return cachedBoosts;

  const interactions = await fetchAllInteractions();
  const won = interactions.filter(i => i.interaction_type === 'deal_won');
  const lost = interactions.filter(i => i.interaction_type === 'deal_lost');

  const product_boosts: Record<string, number> = {};
  const kit_boosts: Record<string, number> = {};
  const strategy_boosts: Record<string, number> = {};

  // Count wins and losses per item
  const countMap = (
    items: string[],
    target: Record<string, { wins: number; losses: number }>,
  ) => {
    items.forEach(name => {
      if (!target[name]) target[name] = { wins: 0, losses: 0 };
    });
  };

  const prodCounts: Record<string, { wins: number; losses: number }> = {};
  const kitCounts: Record<string, { wins: number; losses: number }> = {};
  const stratCounts: Record<string, { wins: number; losses: number }> = {};

  won.forEach(w => {
    (w.products_recommended || []).forEach(p => {
      if (!prodCounts[p]) prodCounts[p] = { wins: 0, losses: 0 };
      prodCounts[p].wins++;
    });
    (w.kits_recommended || []).forEach(k => {
      if (!kitCounts[k]) kitCounts[k] = { wins: 0, losses: 0 };
      kitCounts[k].wins++;
    });
    if (w.pitch_strategy_used) {
      if (!stratCounts[w.pitch_strategy_used]) stratCounts[w.pitch_strategy_used] = { wins: 0, losses: 0 };
      stratCounts[w.pitch_strategy_used].wins++;
    }
  });

  lost.forEach(l => {
    (l.products_recommended || []).forEach(p => {
      if (!prodCounts[p]) prodCounts[p] = { wins: 0, losses: 0 };
      prodCounts[p].losses++;
    });
    (l.kits_recommended || []).forEach(k => {
      if (!kitCounts[k]) kitCounts[k] = { wins: 0, losses: 0 };
      kitCounts[k].losses++;
    });
    if (l.pitch_strategy_used) {
      if (!stratCounts[l.pitch_strategy_used]) stratCounts[l.pitch_strategy_used] = { wins: 0, losses: 0 };
      stratCounts[l.pitch_strategy_used].losses++;
    }
  });

  // Compute boost: (wins - losses) / total, clamped to [-1, 1]
  const computeBoost = (counts: Record<string, { wins: number; losses: number }>): Record<string, number> => {
    const result: Record<string, number> = {};
    Object.entries(counts).forEach(([name, { wins, losses }]) => {
      const total = wins + losses;
      if (total === 0) { result[name] = 0; return; }
      result[name] = Math.max(-1, Math.min(1, (wins - losses) / total));
    });
    return result;
  };

  cachedBoosts = {
    product_boosts: computeBoost(prodCounts),
    kit_boosts: computeBoost(kitCounts),
    strategy_boosts: computeBoost(stratCounts),
  };
  lastComputed = Date.now();
  return cachedBoosts;
}

export function getProductBoost(boosts: HistoricalBoost, productName: string): number {
  return boosts.product_boosts[productName] ?? 0;
}

export function getKitBoost(boosts: HistoricalBoost, kitName: string): number {
  return boosts.kit_boosts[kitName] ?? 0;
}

export function invalidateBoostCache() {
  cachedBoosts = null;
  lastComputed = 0;
}
