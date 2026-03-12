// ─── Recommendations Service ────────────────────────────────────────
// Product and kit recommendations based on purpose, department, and industry.

import { seedProducts, seedKits } from '@/data/seed';

export function getRecommendedProducts(purpose: string, _department: string) {
  return seedProducts.filter(p => {
    const suitable = p.suitable_for_json.map(s => s.toLowerCase());
    const purposeLower = purpose.toLowerCase();
    return suitable.some(s => purposeLower.includes(s) || s.includes(purposeLower.split(' ')[0]));
  }).slice(0, 6);
}

export function getRecommendedKits(purpose: string, industry: string) {
  return seedKits.filter(k => {
    const purposeLower = purpose.toLowerCase();
    const kitPurpose = k.purpose.toLowerCase();
    const kitCategory = k.category.toLowerCase();
    return kitPurpose.includes(purposeLower.split(' ')[0]) ||
      purposeLower.includes(kitCategory) ||
      k.suggested_industries_json.some(i => i.toLowerCase().includes(industry.toLowerCase().slice(0, 4)));
  }).slice(0, 4);
}
