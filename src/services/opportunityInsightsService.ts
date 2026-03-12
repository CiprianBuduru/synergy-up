// ─── Opportunity Insights Service ────────────────────────────────────
// Generates a quick commercial opportunity analysis.

import type { CompanyEnrichment, CalculationSnapshot } from '@/types';
import type { CompanySignals } from './companySignalsService';
import type { DetectedIntent } from './intentDetectionService';

export interface OpportunityInsights {
  opportunity_score: number; // 0-100
  estimated_monthly_budget: number;
  confidence_level: 'low' | 'medium' | 'high';
  recommended_pitch_strategy: string;
  best_entry_point_department: string;
}

const DEPT_PRIORITY: Record<string, string[]> = {
  onboarding: ['HR', 'Procurement'],
  employer_branding: ['HR', 'Marketing'],
  conference: ['Marketing', 'Procurement'],
  event_support: ['Marketing', 'Procurement'],
  office_utility: ['Procurement', 'Office Manager'],
  internal_communication: ['HR', 'Marketing'],
  corporate_gifting: ['Procurement', 'Marketing', 'Management'],
  training: ['HR', 'Training'],
  recruitment: ['HR', 'Recruitment'],
  marketing_campaign: ['Marketing'],
  branch_branding: ['Marketing', 'Operations'],
};

const INTENT_STRATEGY: Record<string, string> = {
  onboarding: 'Focus pe kituri de onboarding și materiale de welcome experience pentru angajați noi.',
  employer_branding: 'Accent pe materiale de employer branding care întăresc identitatea internă și atrag talente.',
  conference: 'Pachete de conferință complete — mape, badge-uri, materiale promoționale coordonate.',
  event_support: 'Suport material complet pentru evenimente — vizual, print și produse promoționale.',
  office_utility: 'Papetărie și materiale de birou branduite — utilitate zilnică cu vizibilitate de brand.',
  internal_communication: 'Materiale de comunicare internă — broșuri, afișaje, newsletter print.',
  corporate_gifting: 'Pachete de corporate gifting elegante — cadouri cu impact și utilitate.',
  training: 'Materiale de training profesionale — manuale, agende, kituri de curs.',
  recruitment: 'Materiale de recrutare și career fair — standuri, flyere, kituri candidat.',
  marketing_campaign: 'Materiale de campanie marketing — POSM, bannere, produse promoționale.',
  branch_branding: 'Branding consistent al sucursalelor — semnalistică, vizual, materiale de identitate.',
};

export function generateOpportunityInsights(
  enrichment: CompanyEnrichment | null,
  signals: CompanySignals,
  intent: DetectedIntent | null,
  industry: string,
  calculation: CalculationSnapshot | null,
): OpportunityInsights {
  const empCount = enrichment?.employee_count_estimate || enrichment?.employee_count_exact || 0;
  const monthlyBudget = calculation?.spendable_half_estimated || 0;
  const primaryIntent = intent?.primary_intent || 'onboarding';

  // Score calculation
  let score = 0;

  // Size factor (0-30)
  if (empCount >= 1000) score += 30;
  else if (empCount >= 500) score += 25;
  else if (empCount >= 200) score += 20;
  else if (empCount >= 50) score += 12;
  else score += 5;

  // Budget factor (0-25)
  if (monthlyBudget >= 20000) score += 25;
  else if (monthlyBudget >= 10000) score += 20;
  else if (monthlyBudget >= 5000) score += 15;
  else if (monthlyBudget > 0) score += 8;

  // Signal strength (0-25)
  const highSignals = [
    signals.hr_relevance, signals.marketing_event_relevance,
    signals.corporate_gifting_relevance, signals.internal_branding_relevance,
  ].filter(s => s === 'high').length;
  score += highSignals * 6;
  if (signals.multi_location_relevance) score += 4;
  if (signals.recruiting_signal) score += 5;

  // Intent confidence (0-20)
  if (intent) {
    score += Math.round(intent.confidence * 20);
  }

  score = Math.min(score, 100);

  // Confidence level
  let confidence_level: 'low' | 'medium' | 'high' = 'low';
  if (empCount > 0 && monthlyBudget > 0 && intent && intent.confidence > 0.6) confidence_level = 'high';
  else if (empCount > 0 || monthlyBudget > 0) confidence_level = 'medium';

  // Best department
  const deptList = DEPT_PRIORITY[primaryIntent] || ['Procurement'];
  const best_entry_point_department = deptList.join(' / ');

  // Strategy
  const recommended_pitch_strategy = INTENT_STRATEGY[primaryIntent] || INTENT_STRATEGY.onboarding;

  return {
    opportunity_score: score,
    estimated_monthly_budget: monthlyBudget,
    confidence_level,
    recommended_pitch_strategy,
    best_entry_point_department,
  };
}
