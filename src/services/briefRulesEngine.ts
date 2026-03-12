// ─── Brief Rules Engine ──────────────────────────────────────────────
// Matches brief text against the rules library and returns structured
// eligibility verdicts with transformation logic, recommended products/kits,
// and pitch lines.

import type { BriefRule, BriefRuleMatch } from '@/types/brief-rule';
import type { EligibilityResult, ReasoningStep } from '@/types';
import { seedBriefRules } from '@/data/brief-rules.seed';
import { AUTHORIZED_CAEN } from '@/services/eligibility';

// ═══════════ RULE MATCHING ═══════════

/** Match brief text against all rules. Returns matches sorted by confidence. */
export function matchBriefRules(text: string, rules: BriefRule[] = seedBriefRules): BriefRuleMatch[] {
  const lower = text.toLowerCase();
  const matches: BriefRuleMatch[] = [];

  for (const rule of rules) {
    let bestKeyword = '';
    let bestLen = 0;
    for (const kw of rule.match_keywords) {
      if (lower.includes(kw) && kw.length > bestLen) {
        bestKeyword = kw;
        bestLen = kw.length;
      }
    }
    if (bestKeyword) {
      // Longer keyword matches = higher confidence
      const confidence = Math.min(1, 0.7 + bestLen * 0.02);
      matches.push({ rule, matched_keyword: bestKeyword, confidence });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

// ═══════════ VERDICT LABELS ═══════════

const ELIGIBILITY_TYPE_LABELS: Record<string, string> = {
  direct: 'Eligibil direct',
  via_operation: 'Eligibil prin operațiune',
  convertible: 'Convertibil în soluție eligibilă',
};

// ═══════════ RULE → ELIGIBILITY RESULT ═══════════

/** Convert a single BriefRule match into an EligibilityResult */
function ruleToEligibilityResult(match: BriefRuleMatch): EligibilityResult {
  const { rule } = match;

  const verdictMap: Record<string, 'eligible' | 'conditionally_eligible' | 'not_eligible_but_convertible'> = {
    direct: 'eligible',
    via_operation: 'conditionally_eligible',
    convertible: 'not_eligible_but_convertible',
  };

  const verdict = verdictMap[rule.eligibility_type] || 'conditionally_eligible';

  const step: ReasoningStep = {
    item: rule.requested_item,
    baseType: rule.requested_category,
    deliverableType: rule.eligible_result.join(', '),
    operations: rule.eligible_via_operation,
    caen: rule.supporting_caen_codes,
    eligible: rule.direct_eligible || rule.eligibility_type === 'via_operation',
    explanation: rule.direct_eligible
      ? `${rule.requested_item} este eligibil direct. ${rule.pitch_line}`
      : `${rule.requested_item} nu este eligibil ca revânzare directă. Devine eligibil prin: ${rule.eligible_via_operation.join(', ')}. Produs rezultat: ${rule.eligible_result.join(', ')}.`,
  };

  return {
    verdict,
    explanation: buildRuleExplanation(rule),
    internal_operation_used: rule.eligible_via_operation,
    supporting_caen_codes: rule.supporting_caen_codes,
    converted_intent: rule.eligibility_type !== 'direct' ? `${rule.primary_intent} → ${rule.eligible_result.join(', ')}` : '',
    alternative_products: rule.eligibility_type !== 'direct' ? rule.recommended_products : [],
    alternative_kits: rule.recommended_kits,
    sales_angle: rule.pitch_line,
    confidence_score: match.confidence,
    reasoning_steps: [step],
  };
}

function buildRuleExplanation(rule: BriefRule): string {
  if (rule.direct_eligible) {
    return `${rule.requested_item} — ${ELIGIBILITY_TYPE_LABELS[rule.eligibility_type]}.\n\nOperațiuni: ${rule.eligible_via_operation.join(', ') || 'N/A'}.\nCAEN: ${rule.supporting_caen_codes.map(c => `${c} (${AUTHORIZED_CAEN[c] || c})`).join(', ')}.\n\n${rule.pitch_line}`;
  }
  return `${rule.requested_item} — ${ELIGIBILITY_TYPE_LABELS[rule.eligibility_type]}.\n\nAcest produs NU este eligibil ca revânzare directă.\nDevine eligibil prin: ${rule.eligible_via_operation.join(', ')}.\nProdus eligibil rezultat: ${rule.eligible_result.join(', ')}.\nCAEN suport: ${rule.supporting_caen_codes.map(c => `${c} (${AUTHORIZED_CAEN[c] || c})`).join(', ')}.\n\n${rule.pitch_line}`;
}

// ═══════════ MULTI-MATCH MERGE ═══════════

/** Merge multiple rule matches into a single combined EligibilityResult */
function mergeRuleResults(matches: BriefRuleMatch[]): EligibilityResult {
  if (matches.length === 1) return ruleToEligibilityResult(matches[0]);

  const results = matches.map(ruleToEligibilityResult);
  const allSteps = results.flatMap(r => r.reasoning_steps || []);
  const hasDirectEligible = matches.some(m => m.rule.direct_eligible);
  const hasNotDirect = matches.some(m => !m.rule.direct_eligible);

  let verdict: 'eligible' | 'conditionally_eligible' | 'not_eligible_but_convertible';
  if (hasDirectEligible && hasNotDirect) verdict = 'conditionally_eligible';
  else if (hasDirectEligible) verdict = 'eligible';
  else if (matches.some(m => m.rule.eligibility_type === 'convertible')) verdict = 'not_eligible_but_convertible';
  else verdict = 'conditionally_eligible';

  const allOps = [...new Set(matches.flatMap(m => m.rule.eligible_via_operation))];
  const allCaen = [...new Set(matches.flatMap(m => m.rule.supporting_caen_codes))];
  const allAltProducts = [...new Set(matches.filter(m => !m.rule.direct_eligible).flatMap(m => m.rule.recommended_products))];
  const allKits = [...new Set(matches.flatMap(m => m.rule.recommended_kits))];
  const pitchLines = matches.map(m => m.rule.pitch_line);
  const avgConfidence = matches.reduce((s, m) => s + m.confidence, 0) / matches.length;

  const explanationParts = matches.map(m => {
    const r = m.rule;
    const tag = ELIGIBILITY_TYPE_LABELS[r.eligibility_type];
    return `• ${r.requested_item} — ${tag}${r.direct_eligible ? '' : ` (prin ${r.eligible_via_operation.join(', ')})`}`;
  });

  return {
    verdict,
    explanation: `Analiză pe baza Brief Rules Engine:\n\n${explanationParts.join('\n')}\n\nDin perspectiva eligibilității, kiturile reprezintă una dintre cele mai avantajoase forme de achiziție.`,
    internal_operation_used: allOps,
    supporting_caen_codes: allCaen,
    converted_intent: matches.filter(m => !m.rule.direct_eligible).map(m => m.rule.primary_intent).join(', '),
    alternative_products: allAltProducts,
    alternative_kits: allKits,
    sales_angle: pitchLines[0] + '\n\nUnele dintre cele mai căutate variante prin unitate protejată sunt kiturile configurate în funcție de contextul companiei.',
    confidence_score: avgConfidence,
    reasoning_steps: allSteps,
  };
}

// ═══════════ MAIN API ═══════════

export interface BriefRulesResult {
  matches: BriefRuleMatch[];
  eligibility: EligibilityResult | null;
  recommended_products: string[];
  recommended_kits: string[];
  pitch_lines: string[];
}

/**
 * Analyze a brief text against the Brief Rules Engine.
 * Returns matched rules, merged eligibility result, recommendations, and pitch lines.
 */
export function analyzeBriefWithRules(text: string, rules?: BriefRule[]): BriefRulesResult {
  const matches = matchBriefRules(text, rules);

  if (matches.length === 0) {
    return { matches: [], eligibility: null, recommended_products: [], recommended_kits: [], pitch_lines: [] };
  }

  const eligibility = mergeRuleResults(matches);
  const recommended_products = [...new Set(matches.flatMap(m => m.rule.recommended_products))];
  const recommended_kits = [...new Set(matches.flatMap(m => m.rule.recommended_kits))];
  const pitch_lines = matches.map(m => m.rule.pitch_line);

  return { matches, eligibility, recommended_products, recommended_kits, pitch_lines };
}

/** Get all rules (for display/admin) */
export function getAllBriefRules(rules?: BriefRule[]): BriefRule[] {
  return rules || seedBriefRules;
}

/** Get a single rule by ID */
export function getBriefRuleById(id: string, rules?: BriefRule[]): BriefRule | undefined {
  return (rules || seedBriefRules).find(r => r.id === id);
}
