// ─── Solution Ranking Engine ────────────────────────────────────────
// Calculates composite scores for products and kits based on multiple factors.

import type { Product, Kit } from '@/types';
import type { DetectedIntent, IntentType } from './intentDetectionService';
import type { CompanySignals } from './companySignalsService';
import { getIndustryProfile } from './industryIntelligenceService';

export interface RankedProduct {
  product: Product;
  score: number;
  factors: ScoreFactors;
}

export interface RankedKit {
  kit: Kit;
  score: number;
  factors: ScoreFactors;
}

export interface ScoreFactors {
  industry_match: number;   // 0-1
  intent_match: number;     // 0-1
  eligibility_strength: number; // 0-1
  department_relevance: number; // 0-1
  utility_score: number;    // 0-1
  historical_success: number; // -1 to 1
}

const WEIGHTS = {
  industry_match: 0.25,
  intent_match: 0.25,
  eligibility_strength: 0.2,
  department_relevance: 0.1,
  utility_score: 0.1,
  historical_success: 0.1,
};

// ═══════════ INTENT → PRODUCT TYPE MAP ═══════════
const INTENT_PRODUCT_AFFINITY: Record<IntentType, string[]> = {
  onboarding: ['kit', 'textile', 'papetărie', 'promoțional'],
  employer_branding: ['textile', 'promoțional', 'eco', 'kit'],
  conference: ['print', 'promoțional', 'vizual', 'kit'],
  event_support: ['vizual', 'print', 'promoțional', 'textile'],
  office_utility: ['papetărie', 'promoțional', 'print'],
  internal_communication: ['print', 'vizual', 'papetărie'],
  corporate_gifting: ['kit', 'promoțional', 'eco', 'ambalaj'],
  training: ['print', 'papetărie', 'kit'],
  recruitment: ['promoțional', 'textile', 'kit', 'vizual'],
  marketing_campaign: ['vizual', 'print', 'promoțional', 'textile'],
  branch_branding: ['vizual', 'print', 'textile', 'promoțional'],
};

function computeIndustryMatch(product: Product, industry: string): number {
  const profile = getIndustryProfile(industry);
  const baseType = product.base_product_type?.toLowerCase() || '';
  if (profile.suggested_product_types.includes(baseType)) return 1.0;
  // Check suggested_industries on the product itself
  const prodIndustries = (product.suggested_industries_json || []).map(s => s.toLowerCase());
  const indLower = industry.toLowerCase();
  if (prodIndustries.some(i => i === 'toate industriile' || indLower.includes(i.slice(0, 4)))) return 0.7;
  return 0.2;
}

function computeIntentMatch(product: Product, intent: DetectedIntent): number {
  const affinityTypes = INTENT_PRODUCT_AFFINITY[intent.primary_intent] || [];
  const baseType = product.base_product_type?.toLowerCase() || '';
  const idx = affinityTypes.indexOf(baseType);
  if (idx === 0) return 1.0;
  if (idx === 1) return 0.8;
  if (idx >= 2) return 0.5;
  // Secondary intent
  if (intent.secondary_intent) {
    const secTypes = INTENT_PRODUCT_AFFINITY[intent.secondary_intent] || [];
    if (secTypes.includes(baseType)) return 0.4;
  }
  return 0.1;
}

function computeEligibilityStrength(product: Product): number {
  const logic = product.eligible_logic?.toLowerCase() || '';
  if (logic.includes('eligible') && !logic.includes('not')) return 1.0;
  if (logic.includes('conditional')) return 0.7;
  if (logic.includes('alternative')) return 0.4;
  // Check if product has CAEN codes
  if (product.supporting_caen_codes_json?.length > 0) return 0.9;
  return 0.3;
}

function computeDepartmentRelevance(product: Product, department: string): number {
  const depts = (product.suitable_departments_json || []).map(d => d.toLowerCase());
  const deptLower = department.toLowerCase();
  if (depts.some(d => deptLower.includes(d) || d.includes(deptLower))) return 1.0;
  return 0.2;
}

function computeUtility(product: Product, signals: CompanySignals): number {
  let score = 0.3; // base
  const suitableFor = (product.suitable_for_json || []).map(s => s.toLowerCase());
  if (signals.hr_relevance === 'high' && suitableFor.some(s => s.includes('hr') || s.includes('onboard'))) score += 0.3;
  if (signals.marketing_event_relevance === 'high' && suitableFor.some(s => s.includes('market') || s.includes('event'))) score += 0.2;
  if (signals.corporate_gifting_relevance === 'high' && suitableFor.some(s => s.includes('gift') || s.includes('cadou'))) score += 0.2;
  return Math.min(score, 1.0);
}

import type { HistoricalBoost } from './recommendationLearningService';

export function rankProducts(
  products: Product[],
  industry: string,
  department: string,
  intent: DetectedIntent,
  signals: CompanySignals,
  historicalBoosts?: HistoricalBoost | null,
): RankedProduct[] {
  return products
    .filter(p => p.active)
    .map(product => {
      const histScore = historicalBoosts?.product_boosts?.[product.name] ?? 0;
      const factors: ScoreFactors = {
        industry_match: computeIndustryMatch(product, industry),
        intent_match: computeIntentMatch(product, intent),
        eligibility_strength: computeEligibilityStrength(product),
        department_relevance: computeDepartmentRelevance(product, department),
        utility_score: computeUtility(product, signals),
        historical_success: (histScore + 1) / 2, // normalize -1..1 to 0..1
      };
      const score =
        factors.industry_match * WEIGHTS.industry_match +
        factors.intent_match * WEIGHTS.intent_match +
        factors.eligibility_strength * WEIGHTS.eligibility_strength +
        factors.department_relevance * WEIGHTS.department_relevance +
        factors.utility_score * WEIGHTS.utility_score +
        factors.historical_success * WEIGHTS.historical_success;

      return { product, score: Math.round(score * 100) / 100, factors };
    })
    .sort((a, b) => b.score - a.score);
}

// ═══════════ KIT RANKING ═══════════

const INTENT_KIT_AFFINITY: Record<IntentType, string[]> = {
  onboarding: ['HR', 'Office'],
  employer_branding: ['HR', 'Marketing'],
  conference: ['Marketing', 'Corporate'],
  event_support: ['Marketing', 'Corporate'],
  office_utility: ['Office', 'Corporate'],
  internal_communication: ['Corporate'],
  corporate_gifting: ['Protocol', 'Corporate'],
  training: ['HR', 'Corporate'],
  recruitment: ['HR', 'Marketing'],
  marketing_campaign: ['Marketing'],
  branch_branding: ['Marketing', 'Corporate'],
};

export function rankKits(
  kits: Kit[],
  industry: string,
  department: string,
  intent: DetectedIntent,
  signals: CompanySignals,
  historicalBoosts?: HistoricalBoost | null,
): RankedKit[] {
  const profile = getIndustryProfile(industry);
  const affinityCategories = INTENT_KIT_AFFINITY[intent.primary_intent] || ['Corporate'];

  return kits
    .filter(k => k.active)
    .map(kit => {
      const histScore = historicalBoosts?.kit_boosts?.[kit.name] ?? 0;
      const factors: ScoreFactors = {
        industry_match: profile.suggested_kit_categories.includes(kit.category) ? 1.0
          : kit.suggested_industries_json.some(i => i === 'Toate industriile') ? 0.5 : 0.2,
        intent_match: affinityCategories.includes(kit.category) ? 1.0
          : kit.purpose.toLowerCase().includes(intent.primary_intent.replace('_', ' ')) ? 0.7 : 0.2,
        eligibility_strength: kit.eligibility_type === 'eligible' ? 1.0
          : kit.eligibility_type === 'conditionally_eligible' ? 0.7 : 0.4,
        department_relevance: kit.target_departments.some(d =>
          department.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(department.toLowerCase())
        ) ? 1.0 : 0.2,
        utility_score: computeKitUtility(kit, signals),
        historical_success: (histScore + 1) / 2,
      };

      const score =
        factors.industry_match * WEIGHTS.industry_match +
        factors.intent_match * WEIGHTS.intent_match +
        factors.eligibility_strength * WEIGHTS.eligibility_strength +
        factors.department_relevance * WEIGHTS.department_relevance +
        factors.utility_score * WEIGHTS.utility_score +
        factors.historical_success * WEIGHTS.historical_success;

      return { kit, score: Math.round(score * 100) / 100, factors };
    })
    .sort((a, b) => b.score - a.score);
}

function computeKitUtility(kit: Kit, signals: CompanySignals): number {
  let score = 0.3;
  const purpose = kit.purpose.toLowerCase();
  if (signals.hr_relevance === 'high' && (purpose.includes('onboard') || purpose.includes('welcome'))) score += 0.3;
  if (signals.marketing_event_relevance === 'high' && (purpose.includes('event') || purpose.includes('conference'))) score += 0.2;
  if (signals.corporate_gifting_relevance === 'high' && (purpose.includes('gift') || purpose.includes('cadou') || purpose.includes('protocol'))) score += 0.2;
  if (signals.multi_location_relevance) score += 0.1;
  return Math.min(score, 1.0);
}
