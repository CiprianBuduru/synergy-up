// ─── Dynamic Slide Engine ────────────────────────────────────────────
// Decides which slides to include based on company context, signals, and intent.

import type { CompanySignals } from './companySignalsService';
import type { DetectedIntent } from './intentDetectionService';
import type { PitchStrategy } from './pitchStrategyService';
import type { EligibilityResult, CalculationSnapshot, Brief, CompanyEnrichment } from '@/types';
import type { RankedProduct, RankedKit } from './solutionRankingService';

export type SlideType =
  | 'cover'
  | 'company_context'
  | 'brief_interpretation'
  | 'opportunity_mechanism'
  | 'opportunity_estimate'
  | 'relevant_solutions'
  | 'recommended_kits'
  | 'alternative_solutions'
  | 'benefits'
  | 'about_equal_up'
  | 'next_steps';

export interface SlideDecision {
  type: SlideType;
  priority: number; // higher = more important
  reason: string;
  emphasisLevel: 'normal' | 'highlighted'; // highlighted = full-width accent
}

export interface DynamicSlideInput {
  enrichment: CompanyEnrichment | null;
  signals: CompanySignals;
  intent: DetectedIntent | null;
  industry: string;
  calculation: CalculationSnapshot | null;
  eligibility: EligibilityResult | null;
  brief: Brief | null;
  rankedProducts: RankedProduct[];
  rankedKits: RankedKit[];
  pitchStrategy: PitchStrategy | null;
}

export function buildSlideSequence(input: DynamicSlideInput): SlideDecision[] {
  const { enrichment, signals, intent, calculation, eligibility, brief, rankedProducts, rankedKits } = input;
  const slides: SlideDecision[] = [];

  // 1. Cover — always
  slides.push({ type: 'cover', priority: 100, reason: 'Copertă prezentare', emphasisLevel: 'normal' });

  // 2. Company context with pitch angle — always
  slides.push({ type: 'company_context', priority: 95, reason: 'Context companie + oportunitate', emphasisLevel: 'normal' });

  // 3. Brief interpretation — only if brief exists
  if (brief && brief.raw_brief?.trim()) {
    slides.push({ type: 'brief_interpretation', priority: 90, reason: 'Brief-ul clientului a fost analizat', emphasisLevel: 'normal' });
  }

  // 4. Opportunity mechanism — always (core value prop)
  slides.push({ type: 'opportunity_mechanism', priority: 85, reason: 'Mecanismul UP — valoare centrală', emphasisLevel: 'normal' });

  // 5. Opportunity estimate — conditional on company size
  const empCount = enrichment?.employee_count_estimate || enrichment?.employee_count_exact || 0;
  if (calculation) {
    const emphasis = empCount > 500 ? 'highlighted' : 'normal';
    slides.push({
      type: 'opportunity_estimate',
      priority: empCount > 500 ? 88 : 75,
      reason: empCount > 500 ? 'Companie mare — impact financiar semnificativ' : 'Estimare oportunitate',
      emphasisLevel: emphasis,
    });
  }

  // 6. Relevant solutions — if we have ranked products
  if (rankedProducts.length > 0) {
    let emphasis: 'normal' | 'highlighted' = 'normal';
    let reason = 'Produse recomandate';
    if (signals.hr_relevance === 'high' && intent?.primary_intent === 'onboarding') {
      emphasis = 'highlighted';
      reason = 'HR relevance HIGH — accent pe onboarding & welcome kits';
    } else if (signals.marketing_event_relevance === 'high') {
      emphasis = 'highlighted';
      reason = 'Marketing relevance HIGH — accent pe materiale promo & evenimente';
    }
    slides.push({ type: 'relevant_solutions', priority: 80, reason, emphasisLevel: emphasis });
  }

  // 7. Recommended kits — if available
  if (rankedKits.length > 0) {
    slides.push({ type: 'recommended_kits', priority: 78, reason: 'Kituri recomandate pe baza analizei', emphasisLevel: 'normal' });
  }

  // 8. Alternative solutions — only if not eligible or conditionally eligible
  if (eligibility?.verdict === 'not_eligible_but_convertible' || eligibility?.verdict === 'conditionally_eligible') {
    slides.push({ type: 'alternative_solutions', priority: 82, reason: 'Cererea conține elemente neeligibile — alternative propuse', emphasisLevel: 'highlighted' });
  }

  // 9. Benefits — always
  slides.push({ type: 'benefits', priority: 70, reason: 'Beneficii colaborare', emphasisLevel: 'normal' });

  // 10. About — always
  slides.push({ type: 'about_equal_up', priority: 60, reason: 'Despre Like Media Group', emphasisLevel: 'normal' });

  // 11. Next steps — always
  slides.push({ type: 'next_steps', priority: 55, reason: 'Pași următori', emphasisLevel: 'normal' });

  // Sort by priority descending — but keep cover first and next_steps last
  return slides;
}
