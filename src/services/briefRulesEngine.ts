// ─── Brief Rules Engine ──────────────────────────────────────────────
// Matches brief text against the rules library and returns structured
// eligibility verdicts with transformation logic, recommended products/kits,
// and pitch lines.
//
// Matching uses 3 layers:
//   1. Exact Match   (confidence 1.0)
//   2. Synonym Match (confidence 0.85)
//   3. Fallback Match (confidence 0.6)

import type { BriefRule, BriefRuleMatch, RuleMatchType } from '@/types/brief-rule';
import type { EligibilityResult, ReasoningStep } from '@/types';
import { seedBriefRules } from '@/data/brief-rules.seed';
import { AUTHORIZED_CAEN } from '@/services/eligibility';

// ═══════════ TEXT NORMALIZATION ═══════════

const DIACRITICS_MAP: Record<string, string> = {
  'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ş': 's', 'ț': 't', 'ţ': 't',
  'Ă': 'a', 'Â': 'a', 'Î': 'i', 'Ș': 's', 'Ş': 's', 'Ț': 't', 'Ţ': 't',
};

/** Normalize text: lowercase, strip diacritics, strip punctuation, collapse whitespace */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map(c => DIACRITICS_MAP[c] || c)
    .join('')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ═══════════ SYNONYM DICTIONARY ═══════════

/** Maps a canonical term to its synonyms. The canonical term should match a keyword in the rules seed. */
const SYNONYM_MAP: Record<string, string[]> = {
  'hartie copiator': ['hartie xerox', 'hartie office', 'hartie imprimanta', 'hartie printer', 'hartie a4', 'hartie birou', 'hartie printare'],
  'dosare': ['mape', 'foldere', 'dosare documente', 'dosar', 'dosare plastic', 'dosare carton'],
  'pixuri': ['instrumente de scris', 'pix', 'stilou', 'pixuri corporate', 'pixuri firma', 'set pixuri'],
  'bibliorafturi': ['biblioraft', 'dosar arhivare', 'dosare arhivare', 'biblioraft a4'],
  'markere': ['marker', 'marker permanent', 'markere colorate', 'set markere'],
  'flyere': ['pliante', 'materiale promo', 'fluturasi', 'fluturas', 'flyer', 'flyers'],
  'brosuri': ['brosura', 'brosuri prezentare', 'brosuri corporate', 'catalog mic'],
  'cataloage': ['catalog', 'catalog produse', 'catalog prezentare'],
  'roll-up': ['banner rollup', 'display rollup', 'roll up', 'rollup', 'roll-up banner'],
  'bannere': ['banner', 'bannere promo', 'banner exterior', 'banner interior', 'mesh banner'],
  'tricouri': ['tricou', 'tricouri corporate', 'tricouri firma', 'tricouri eveniment', 'tshirt', 't-shirt'],
  'sorturi': ['sort', 'sorturi horeca', 'sort bucatar', 'sort personalizat'],
  'cani': ['cana', 'cani personalizate', 'cana cafea', 'cani corporate', 'mug', 'mugs'],
  'powerbank-uri': ['powerbank', 'power bank', 'baterie externa', 'acumulator extern'],
  'mousepad': ['mouse pad', 'mousepad personalizat', 'pad mouse'],
  'agende': ['agenda', 'agende personalizate', 'agenda corporate', 'planner', 'agenda datata'],
  'blocnotes': ['blocnotes personalizat', 'bloc notes', 'notepad', 'bloc de notite', 'notite'],
  'caiete': ['caiet', 'caiete personalizate', 'caiet notite'],
  'mape': ['mapa', 'mape conferinta', 'mape corporate', 'mape prezentare'],
  'carti de vizita': ['carte vizita', 'business card', 'carti vizita'],
  'laptopuri': ['laptop', 'notebook', 'laptopuri corporate'],
  'mobilier': ['mobila', 'mobilier birou', 'mobilier office', 'scaune', 'birouri'],
};

// ═══════════ FALLBACK CLUSTERS ═══════════

/** Maps generic/umbrella terms to arrays of canonical rule keywords */
const FALLBACK_CLUSTERS: Record<string, string[]> = {
  'papetarie': ['hartie copiator', 'dosare', 'pixuri', 'bibliorafturi', 'markere', 'agende', 'blocnotes', 'caiete', 'mape'],
  'articole papetarie': ['hartie copiator', 'dosare', 'pixuri', 'bibliorafturi', 'markere', 'agende', 'blocnotes', 'caiete', 'mape'],
  'materiale papetarie': ['hartie copiator', 'dosare', 'pixuri', 'bibliorafturi', 'markere', 'agende', 'blocnotes', 'caiete', 'mape'],
  'materiale print': ['flyere', 'brosuri', 'cataloage', 'carti de vizita'],
  'materiale tiparite': ['flyere', 'brosuri', 'cataloage', 'carti de vizita'],
  'produse promo': ['cani', 'tricouri', 'pixuri', 'powerbank-uri', 'mousepad'],
  'produse promotionale': ['cani', 'tricouri', 'pixuri', 'powerbank-uri', 'mousepad'],
  'materiale promotionale': ['cani', 'tricouri', 'pixuri', 'powerbank-uri', 'mousepad', 'roll-up', 'bannere'],
  'textile': ['tricouri', 'sorturi'],
  'textile personalizate': ['tricouri', 'sorturi'],
  'materiale vizuale': ['roll-up', 'bannere', 'flyere'],
  'semnalistica': ['roll-up', 'bannere'],
  'accesorii tech': ['powerbank-uri', 'mousepad'],
  'accesorii office': ['mousepad', 'pixuri', 'agende', 'blocnotes'],
  'office': ['hartie copiator', 'dosare', 'pixuri', 'bibliorafturi', 'markere', 'agende'],
  'kituri': ['agende', 'blocnotes', 'pixuri', 'cani', 'tricouri'],
};

// Normalize all lookup keys at module load
const normalizedSynonyms: Map<string, { canonical: string; synonyms: string[] }> = new Map();
for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
  const normCanonical = normalize(canonical);
  const normSynonyms = synonyms.map(normalize);
  normalizedSynonyms.set(normCanonical, { canonical, synonyms: normSynonyms });
}

const normalizedFallbacks: Map<string, string[]> = new Map();
for (const [cluster, canonicals] of Object.entries(FALLBACK_CLUSTERS)) {
  normalizedFallbacks.set(normalize(cluster), canonicals);
}

// ═══════════ 3-LAYER MATCHING ═══════════

interface LayerMatch {
  rule: BriefRule;
  matched_keyword: string;
  confidence: number;
  rule_type: RuleMatchType;
}

/** Try to find a rule whose match_keywords contain the exact normalized term */
function exactMatch(term: string, rules: BriefRule[]): LayerMatch | null {
  for (const rule of rules) {
    for (const kw of rule.match_keywords) {
      if (normalize(kw) === term) {
        return { rule, matched_keyword: kw, confidence: 1.0, rule_type: 'exact_match' };
      }
    }
  }
  // Also check if the term matches the normalized requested_item
  for (const rule of rules) {
    if (normalize(rule.requested_item) === term) {
      return { rule, matched_keyword: rule.requested_item, confidence: 1.0, rule_type: 'exact_match' };
    }
  }
  return null;
}

/** Try to match via synonym dictionary */
function synonymMatch(term: string, rules: BriefRule[]): LayerMatch | null {
  for (const [normCanonical, { canonical, synonyms }] of normalizedSynonyms) {
    if (synonyms.includes(term) || term.includes(normCanonical) || synonyms.some(s => term.includes(s))) {
      // Find the rule that owns this canonical
      const found = exactMatch(normCanonical, rules);
      if (found) {
        return { ...found, confidence: 0.85, rule_type: 'synonym_match', matched_keyword: term };
      }
    }
  }
  return null;
}

/** Fallback: match via umbrella/cluster terms */
function fallbackMatch(term: string, rules: BriefRule[]): LayerMatch[] {
  const results: LayerMatch[] = [];
  for (const [cluster, canonicals] of normalizedFallbacks) {
    if (term.includes(cluster) || cluster.includes(term)) {
      for (const canonical of canonicals) {
        const found = exactMatch(normalize(canonical), rules);
        if (found && !results.some(r => r.rule.id === found.rule.id)) {
          results.push({ ...found, confidence: 0.6, rule_type: 'fallback_match', matched_keyword: cluster });
        }
      }
    }
  }
  return results;
}

/** Extract individual product terms from a brief text */
function extractTerms(normalizedText: string): string[] {
  // Split on common delimiters
  const parts = normalizedText
    .split(/\s+(?:si|și|and|plus|sau|or|virgula|,)\s+|[,;•·\-–—\/|]+|\n/)
    .map(p => p.trim())
    .filter(p => p.length > 1);

  // Also include the full text as a single term for fallback cluster matching
  const terms = [...parts];
  if (!terms.includes(normalizedText)) terms.push(normalizedText);
  return [...new Set(terms)];
}

/** Match brief text against all rules using 3-layer strategy */
export function matchBriefRules(text: string, rules: BriefRule[] = seedBriefRules): BriefRuleMatch[] {
  const normText = normalize(text);
  const terms = extractTerms(normText);
  const matchedRuleIds = new Set<string>();
  const matches: BriefRuleMatch[] = [];

  const addMatch = (m: LayerMatch) => {
    if (!matchedRuleIds.has(m.rule.id)) {
      matchedRuleIds.add(m.rule.id);
      matches.push(m);
    }
  };

  // Pass 1: per-term exact + synonym
  for (const term of terms) {
    const exact = exactMatch(term, rules);
    if (exact) { addMatch(exact); continue; }

    const syn = synonymMatch(term, rules);
    if (syn) { addMatch(syn); continue; }
  }

  // Pass 2: fallback clusters (only for terms that didn't match yet)
  for (const term of terms) {
    const fbs = fallbackMatch(term, rules);
    for (const fb of fbs) addMatch(fb);
  }

  // Pass 3: substring scan against all rule keywords (legacy compatibility)
  // Only if no matches found yet — tries partial keyword containment
  if (matches.length === 0) {
    for (const rule of rules) {
      for (const kw of rule.match_keywords) {
        const normKw = normalize(kw);
        if (normText.includes(normKw) && normKw.length >= 3) {
          const confidence = Math.min(0.75, 0.5 + normKw.length * 0.02);
          addMatch({ rule, matched_keyword: kw, confidence, rule_type: 'fallback_match' });
          break;
        }
      }
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

export function getAllBriefRules(rules?: BriefRule[]): BriefRule[] {
  return rules || seedBriefRules;
}

export function getBriefRuleById(id: string, rules?: BriefRule[]): BriefRule | undefined {
  return (rules || seedBriefRules).find(r => r.id === id);
}
