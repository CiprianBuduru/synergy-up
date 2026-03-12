// ─── Eligibility Engine v2 ───────────────────────────────────────────
// Structured reasoning based on: product → operation → CAEN → deliverable.
// No simple keyword matching — uses a reasoning pipeline.

import type { EligibilityResult, EligibilityStatus } from '@/types';
import type { Product, Alternative } from '@/types';

// ═══════════ AUTHORIZED CAEN CODES ═══════════
export const AUTHORIZED_CAEN: Record<string, string> = {
  '7311': 'Activități ale agențiilor de publicitate',
  '1812': 'Alte activități de tipărire n.c.a.',
  '1814': 'Legătorie și servicii conexe',
  '1723': 'Fabricarea articolelor de papetărie',
};

// ═══════════ INTERNAL OPERATIONS → CAEN MAP ═══════════
export const OPERATIONS_CAEN: Record<string, string[]> = {
  'personalizare':  ['7311'],
  'branding':       ['7311'],
  'tipărire':       ['1812'],
  'legătorie':      ['1814'],
  'papetărie':      ['1723'],
  'ambalare / kituire': ['1812', '7311'],
  'montaj materiale promo': ['7311'],
  'pregătire materiale promoționale': ['7311'],
};

const ALL_OPERATIONS = Object.keys(OPERATIONS_CAEN);

// ═══════════ DELIVERABLE TAXONOMY ═══════════
// Maps a base product type to allowed internal operations and expected deliverable
interface DeliverableProfile {
  allowedOperations: string[];
  caen: string[];
  deliverableType: string;
  baseEligible: boolean;
}

const DELIVERABLE_PROFILES: Record<string, DeliverableProfile> = {
  textile:       { allowedOperations: ['personalizare', 'branding'], caen: ['7311'], deliverableType: 'Produs textil personalizat', baseEligible: true },
  print:         { allowedOperations: ['tipărire', 'legătorie', 'montaj materiale promo'], caen: ['1812', '1814', '7311'], deliverableType: 'Material tipărit', baseEligible: true },
  papetărie:     { allowedOperations: ['papetărie', 'legătorie', 'tipărire', 'branding'], caen: ['1723', '1814', '1812', '7311'], deliverableType: 'Articol papetărie', baseEligible: true },
  promoțional:   { allowedOperations: ['branding', 'personalizare', 'ambalare / kituire'], caen: ['7311'], deliverableType: 'Articol promoțional brandat', baseEligible: true },
  vizual:        { allowedOperations: ['tipărire', 'montaj materiale promo'], caen: ['1812', '7311'], deliverableType: 'Material vizual/expozițional', baseEligible: true },
  eco:           { allowedOperations: ['branding', 'personalizare', 'tipărire', 'ambalare / kituire'], caen: ['7311', '1812'], deliverableType: 'Produs eco personalizat', baseEligible: true },
  kit:           { allowedOperations: ['ambalare / kituire', 'branding', 'pregătire materiale promoționale', 'papetărie', 'legătorie', 'tipărire'], caen: ['7311', '1812', '1723', '1814'], deliverableType: 'Kit compus intern', baseEligible: true },
  ambalaj:       { allowedOperations: ['tipărire', 'branding'], caen: ['1812', '7311'], deliverableType: 'Ambalaj brandat', baseEligible: true },
  // Not eligible base types
  'IT hardware': { allowedOperations: [], caen: [], deliverableType: 'Echipament IT', baseEligible: false },
  'mobilier':    { allowedOperations: [], caen: [], deliverableType: 'Mobilier', baseEligible: false },
  'serviciu':    { allowedOperations: [], caen: [], deliverableType: 'Serviciu', baseEligible: false },
  'digital':     { allowedOperations: [], caen: [], deliverableType: 'Produs digital', baseEligible: false },
  'alimentar':   { allowedOperations: [], caen: [], deliverableType: 'Produs alimentar/catering', baseEligible: false },
};

// ═══════════ REQUEST CLASSIFIER ═══════════
// Maps raw request text to a base product type + detected intent
interface ClassifiedRequest {
  baseType: string;
  detectedItems: string[];
  intent: string;
}

interface ClassificationRule {
  keywords: string[];
  baseType: string;
  intent: string;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // Not eligible items first (higher priority)
  { keywords: ['laptop', 'laptopuri', 'calculator', 'calculatoare', 'pc', 'desktop'], baseType: 'IT hardware', intent: 'utilitate IT / onboarding' },
  { keywords: ['telefon', 'telefoane', 'smartphone', 'mobil'], baseType: 'IT hardware', intent: 'comunicare / IT' },
  { keywords: ['tabletă', 'tablete', 'ipad'], baseType: 'IT hardware', intent: 'utilitate IT' },
  { keywords: ['gadget', 'gadgeturi', 'electronice', 'electrocasnice'], baseType: 'IT hardware', intent: 'tech gifting' },
  { keywords: ['mobilier', 'scaun', 'scaune', 'birou mobilier', 'raft', 'rafturi', 'dulap'], baseType: 'mobilier', intent: 'office setup' },
  { keywords: ['software', 'licență', 'licențe', 'aplicație', 'abonament digital', 'saas'], baseType: 'digital', intent: 'utilitate digitală' },
  { keywords: ['catering', 'mâncare', 'coffee break', 'prânz', 'bufet'], baseType: 'alimentar', intent: 'eveniment / hospitality' },
  { keywords: ['transport', 'deplasare', 'cursă', 'combustibil'], baseType: 'serviciu', intent: 'logistică' },
  { keywords: ['cursuri', 'training online', 'formare', 'e-learning'], baseType: 'serviciu', intent: 'dezvoltare profesională' },
  { keywords: ['consultanță', 'servicii consultanță', 'advisory'], baseType: 'serviciu', intent: 'servicii profesionale' },
  { keywords: ['bilete', 'intrări', 'acces eveniment'], baseType: 'serviciu', intent: 'participare eveniment' },
  { keywords: ['abonamente', 'abonament'], baseType: 'serviciu', intent: 'beneficii angajați' },
  // Eligible items
  { keywords: ['tricou', 'tricouri', 'polo', 'hanorac', 'vestă', 'veste', 'șapcă', 'șepci', 'bandană', 'șorț', 'sacosă', 'prosop', 'textile', 'textil'], baseType: 'textile', intent: 'personalizare textile' },
  { keywords: ['flyere', 'flyer', 'broșur', 'catalog', 'poster', 'afiș', 'banner print', 'etiche', 'sticker', 'card vizită', 'invitați', 'certificat', 'diplomă', 'print', 'tipărit', 'tipărire', 'hârtie cu antet'], baseType: 'print', intent: 'materiale tipărite' },
  { keywords: ['agend', 'blocnotes', 'mapă', 'mape', 'papetărie', 'plic', 'dosar', 'registru', 'caiet', 'carnețel', 'planner', 'planificator'], baseType: 'papetărie', intent: 'papetărie corporate' },
  { keywords: ['pix', 'pixuri', 'stilou', 'creion', 'marker', 'roller', 'evidențiator'], baseType: 'promoțional', intent: 'instrumente de scris branduite' },
  { keywords: ['cană', 'căni', 'pahar', 'pahare', 'sticlă apă', 'termos', 'ceramică', 'borcan'], baseType: 'promoțional', intent: 'produse ceramică/sticlă' },
  { keywords: ['geantă', 'rucsac', 'husă', 'portofel', 'borseta', 'lanyard', 'badge', 'ecuson', 'breloc', 'port-card'], baseType: 'promoțional', intent: 'accesorii branduite' },
  { keywords: ['mousepad', 'suport telefon', 'hub usb', 'stick usb', 'powerbank', 'cablu personalizat', 'webcam cover', 'mouse wireless', 'căști'], baseType: 'promoțional', intent: 'accesorii IT promo' },
  { keywords: ['roll-up', 'rollup', 'display', 'totem', 'stand expo', 'panou expo', 'backdrop', 'steag', 'beach flag'], baseType: 'vizual', intent: 'materiale expoziționale' },
  { keywords: ['eco', 'reciclat', 'bambus', 'plută', 'bumbac organic', 'biodegradabil', 'semințe'], baseType: 'eco', intent: 'produse eco' },
  { keywords: ['calendar'], baseType: 'print', intent: 'calendare personalizate' },
  { keywords: ['kit', 'pachet', 'set cadou', 'welcome kit', 'onboarding kit', 'gift box', 'cutie cadou'], baseType: 'kit', intent: 'kit compus' },
  { keywords: ['umbrela', 'pelerină', 'pătură', 'cooler bag', 'evantai'], baseType: 'promoțional', intent: 'produse outdoor' },
  { keywords: ['trofeu', 'plachetă', 'medalion', 'insignă', 'fond de scenă'], baseType: 'promoțional', intent: 'protocol & recunoaștere' },
  { keywords: ['hârtie', 'legătorie'], baseType: 'print', intent: 'producție tipografică' },
  { keywords: ['uniforme'], baseType: 'textile', intent: 'textile de lucru' },
  { keywords: ['cadouri electronice'], baseType: 'IT hardware', intent: 'cadouri tech' },
];

function classifyRequest(text: string): ClassifiedRequest[] {
  const lower = text.toLowerCase();
  const found: ClassifiedRequest[] = [];
  const seenTypes = new Set<string>();

  for (const rule of CLASSIFICATION_RULES) {
    const matchedKeywords = rule.keywords.filter(kw => lower.includes(kw));
    if (matchedKeywords.length > 0 && !seenTypes.has(rule.baseType)) {
      seenTypes.add(rule.baseType);
      found.push({ baseType: rule.baseType, detectedItems: matchedKeywords, intent: rule.intent });
    }
  }
  return found;
}

// ═══════════ ALTERNATIVE GENERATION ═══════════
interface AlternativeMapping {
  forBaseTypes: string[];
  products: string[];
  kits: string[];
  salesAngle: string;
}

const ALTERNATIVE_MAPPINGS: AlternativeMapping[] = [
  { forBaseTypes: ['IT hardware'], products: ['Mousepad personalizat', 'Husă laptop brandată', 'Powerbank brandat', 'Suport telefon personalizat', 'Agendă tech'], kits: ['Onboarding Starter Kit', 'Office Starter Kit'], salesAngle: 'Echipamentele IT nu pot fi facturate prin unitate protejată, dar accesoriile IT branduite și kiturile de onboarding sunt 100% eligibile și creează o experiență memorabilă.' },
  { forBaseTypes: ['mobilier'], products: ['Organizator birou brandat', 'Set papetărie office', 'Calendar birou personalizat', 'Covoraș birou personalizat'], kits: ['Office Starter Kit'], salesAngle: 'Mobilierul nu este eligibil, dar materialele de birou branduite completează perfect spațiul de lucru — 100% eligibile.' },
  { forBaseTypes: ['digital'], products: ['Manual training tipărit', 'Broșură proceduri', 'Mapă documentație'], kits: ['Training Kit', 'Branded Print Kit'], salesAngle: 'Licențele digitale nu sunt eligibile, dar materialele tipărite de training și documentare sunt realizate integral intern.' },
  { forBaseTypes: ['alimentar'], products: ['Cană personalizată', 'Pahar personalizat', 'Badge-uri eveniment'], kits: ['Conference Basic Kit', 'Event Promotion Kit'], salesAngle: 'Cateringul nu este eligibil, dar materialele de eveniment — badge-uri, mape, bannere, căni branduite — sunt 100% eligibile.' },
  { forBaseTypes: ['serviciu'], products: ['Flyere', 'Broșuri servicii', 'Mape prezentare', 'Certificat tipărit'], kits: ['Branded Print Kit', 'Sales Meeting Kit'], salesAngle: 'Serviciile nu intră sub operațiuni autorizate, dar materialele fizice asociate — tipărite și branduite intern — sunt 100% eligibile.' },
];

function findAlternatives(baseType: string): AlternativeMapping | null {
  return ALTERNATIVE_MAPPINGS.find(a => a.forBaseTypes.includes(baseType)) || null;
}

// ═══════════ REASONING STEP ═══════════
interface ReasoningStep {
  item: string;
  baseType: string;
  profile: DeliverableProfile | null;
  matchedOperations: string[];
  matchedCaen: string[];
  isEligible: boolean;
  explanation: string;
}

function reasonAboutItem(classified: ClassifiedRequest): ReasoningStep {
  const profile = DELIVERABLE_PROFILES[classified.baseType] || null;

  if (!profile || !profile.baseEligible) {
    return {
      item: classified.detectedItems.join(', '),
      baseType: classified.baseType,
      profile,
      matchedOperations: [],
      matchedCaen: [],
      isEligible: false,
      explanation: `Produsul de tip "${classified.baseType}" nu implică operațiuni interne autorizate.`,
    };
  }

  // Find which operations from our authorized list match the profile
  const matchedOps = profile.allowedOperations.filter(op => ALL_OPERATIONS.includes(op));
  const matchedCaen = [...new Set(matchedOps.flatMap(op => OPERATIONS_CAEN[op] || []))];
  const validCaen = matchedCaen.filter(c => c in AUTHORIZED_CAEN);

  return {
    item: classified.detectedItems.join(', '),
    baseType: classified.baseType,
    profile,
    matchedOperations: matchedOps,
    matchedCaen: validCaen,
    isEligible: validCaen.length > 0 && matchedOps.length > 0,
    explanation: `${profile.deliverableType}: operațiuni interne (${matchedOps.join(', ')}) sub codurile CAEN (${validCaen.join(', ')}).`,
  };
}

// ═══════════ MAIN ENGINE ═══════════

export function checkEligibility(
  productOrRequest: string,
  productsLibrary?: Product[],
  alternativesLibrary?: Alternative[],
): EligibilityResult {
  const classified = classifyRequest(productOrRequest);

  // If nothing detected, try product library match then fallback
  if (classified.length === 0) {
    return tryProductLibraryMatch(productOrRequest, productsLibrary, alternativesLibrary);
  }

  // Reason about each classified item
  const steps = classified.map(reasonAboutItem);
  const eligibleSteps = steps.filter(s => s.isEligible);
  const notEligibleSteps = steps.filter(s => !s.isEligible);

  // Pure eligible
  if (notEligibleSteps.length === 0 && eligibleSteps.length > 0) {
    const allOps = [...new Set(eligibleSteps.flatMap(s => s.matchedOperations))];
    const allCaen = [...new Set(eligibleSteps.flatMap(s => s.matchedCaen))];
    const deliverables = [...new Set(eligibleSteps.map(s => s.profile!.deliverableType))];

    return {
      verdict: 'eligible',
      explanation: buildEligibleExplanation(eligibleSteps),
      internal_operation_used: allOps,
      supporting_caen_codes: allCaen,
      converted_intent: '',
      alternative_products: [],
      alternative_kits: [],
      sales_angle: `Produsele sunt 100% eligibile. Livrabil final: ${deliverables.join(', ')}. Operațiuni interne (${allOps.join(', ')}) realizate sub codurile CAEN ${allCaen.map(c => `${c} — ${AUTHORIZED_CAEN[c]}`).join(', ')}.`,
      confidence_score: calculateConfidence(eligibleSteps, 'eligible'),
      reasoning_steps: steps.map(s => ({
        item: s.item,
        baseType: s.baseType,
        deliverableType: s.profile?.deliverableType || 'Necunoscut',
        operations: s.matchedOperations,
        caen: s.matchedCaen,
        eligible: s.isEligible,
        explanation: s.explanation,
      })),
    };
  }

  // Pure not eligible
  if (eligibleSteps.length === 0 && notEligibleSteps.length > 0) {
    const primaryNotEligible = notEligibleSteps[0];
    const alt = findAlternatives(primaryNotEligible.baseType);
    const intents = notEligibleSteps.map(s => classified.find(c => c.baseType === s.baseType)?.intent || '').filter(Boolean);

    return {
      verdict: 'not_eligible_but_convertible',
      explanation: `Produsele solicitate (${notEligibleSteps.map(s => s.item).join(', ')}) nu pot fi procesate prin unitate protejată deoarece nu implică operațiuni interne autorizate. Intenție detectată: ${intents.join(', ')}.`,
      internal_operation_used: [],
      supporting_caen_codes: [],
      converted_intent: intents.join(', '),
      alternative_products: alt?.products || [],
      alternative_kits: alt?.kits || [],
      sales_angle: alt?.salesAngle || 'Recomandăm identificarea alternativelor eligibile care răspund aceluiași scop.',
      confidence_score: 0.95,
      reasoning_steps: steps.map(s => ({
        item: s.item,
        baseType: s.baseType,
        deliverableType: s.profile?.deliverableType || 'Necunoscut',
        operations: s.matchedOperations,
        caen: s.matchedCaen,
        eligible: s.isEligible,
        explanation: s.explanation,
      })),
    };
  }

  // Mixed: conditionally eligible
  if (eligibleSteps.length > 0 && notEligibleSteps.length > 0) {
    const allOps = [...new Set(eligibleSteps.flatMap(s => s.matchedOperations))];
    const allCaen = [...new Set(eligibleSteps.flatMap(s => s.matchedCaen))];
    const primaryNotEligible = notEligibleSteps[0];
    const alt = findAlternatives(primaryNotEligible.baseType);

    return {
      verdict: 'conditionally_eligible',
      explanation: `Cererea conține atât produse eligibile (${eligibleSteps.map(s => s.item).join(', ')}) cât și produse neeligibile (${notEligibleSteps.map(s => s.item).join(', ')}). Recomandăm focusarea pe componentele eligibile și propunerea de alternative pentru restul.`,
      internal_operation_used: allOps,
      supporting_caen_codes: allCaen,
      converted_intent: notEligibleSteps.map(s => classified.find(c => c.baseType === s.baseType)?.intent || '').filter(Boolean).join(', '),
      alternative_products: alt?.products || [],
      alternative_kits: alt?.kits || [],
      sales_angle: `Componentele eligibile pot fi livrate imediat. Pentru restul, propunem alternative branduite realizate intern.`,
      confidence_score: calculateConfidence(eligibleSteps, 'conditionally_eligible'),
      reasoning_steps: steps.map(s => ({
        item: s.item,
        baseType: s.baseType,
        deliverableType: s.profile?.deliverableType || 'Necunoscut',
        operations: s.matchedOperations,
        caen: s.matchedCaen,
        eligible: s.isEligible,
        explanation: s.explanation,
      })),
    };
  }

  return fallbackResult();
}

// ═══════════ HELPERS ═══════════

function buildEligibleExplanation(steps: ReasoningStep[]): string {
  if (steps.length === 1) {
    const s = steps[0];
    return `${s.profile!.deliverableType}: ${s.item} — operațiunile interne (${s.matchedOperations.join(', ')}) sunt realizate integral în atelierul propriu, sub codurile CAEN autorizate (${s.matchedCaen.join(', ')}).`;
  }
  const lines = steps.map(s =>
    `• ${s.profile!.deliverableType} (${s.item}): ${s.matchedOperations.join(', ')} → CAEN ${s.matchedCaen.join(', ')}`
  );
  return `Toate produsele sunt eligibile:\n${lines.join('\n')}`;
}

function calculateConfidence(eligibleSteps: ReasoningStep[], verdict: EligibilityStatus): number {
  if (verdict === 'eligible') {
    const avgOps = eligibleSteps.reduce((sum, s) => sum + s.matchedOperations.length, 0) / eligibleSteps.length;
    return Math.min(0.98, 0.8 + avgOps * 0.05);
  }
  if (verdict === 'conditionally_eligible') return 0.75;
  return 0.5;
}

function tryProductLibraryMatch(
  text: string,
  productsLibrary?: Product[],
  alternativesLibrary?: Alternative[],
): EligibilityResult {
  const lower = text.toLowerCase();

  // Try products library
  if (productsLibrary) {
    const match = productsLibrary.find(p =>
      lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower)
    );
    if (match) {
      return {
        verdict: 'eligible',
        explanation: match.eligible_logic,
        internal_operation_used: match.internal_operations_json,
        supporting_caen_codes: match.supporting_caen_codes_json,
        converted_intent: '',
        alternative_products: [],
        alternative_kits: [],
        sales_angle: `Produs din catalogul intern: ${match.name}. Realizat prin: ${match.internal_operations_json.join(', ')}.`,
        confidence_score: 0.9,
        reasoning_steps: [{
          item: match.name,
          baseType: match.base_product_type,
          deliverableType: match.base_product_type,
          operations: match.internal_operations_json,
          caen: match.supporting_caen_codes_json,
          eligible: true,
          explanation: match.eligible_logic,
        }],
      };
    }
  }

  // Try alternatives library
  if (alternativesLibrary) {
    const altMatch = alternativesLibrary.find(a => lower.includes(a.source_request_keyword));
    if (altMatch) {
      return {
        verdict: 'not_eligible_but_convertible',
        explanation: altMatch.explanation,
        internal_operation_used: [],
        supporting_caen_codes: [],
        converted_intent: altMatch.source_request_keyword,
        alternative_products: [],
        alternative_kits: [altMatch.suggested_product_or_kit],
        sales_angle: altMatch.explanation,
        confidence_score: 0.85,
        reasoning_steps: [{
          item: altMatch.source_request_keyword,
          baseType: 'necunoscut',
          deliverableType: 'Necunoscut',
          operations: [],
          caen: [],
          eligible: false,
          explanation: altMatch.explanation,
        }],
      };
    }
  }

  return fallbackResult();
}

function fallbackResult(): EligibilityResult {
  return {
    verdict: 'conditionally_eligible',
    explanation: 'Produsul ar putea fi eligibil dacă include operațiuni realizate intern (personalizare, tipărire, ambalare, legătorie). Este necesară o analiză suplimentară pentru a determina livrabilul final.',
    internal_operation_used: [],
    supporting_caen_codes: [],
    converted_intent: '',
    alternative_products: [],
    alternative_kits: ['Onboarding Starter Kit', 'Branded Print Kit'],
    sales_angle: 'Recomandăm o discuție pentru a identifica componenta eligibilă și livrabilul final.',
    confidence_score: 0.4,
    reasoning_steps: [],
  };
}

// ═══════════ PRODUCT-LEVEL ELIGIBILITY ═══════════
// Check eligibility for a single product from the library
export function checkProductEligibility(product: Product): EligibilityResult {
  const profile = DELIVERABLE_PROFILES[product.base_product_type];
  const ops = product.internal_operations_json;
  const caen = product.supporting_caen_codes_json;
  const validCaen = caen.filter(c => c in AUTHORIZED_CAEN);

  if (!profile || !profile.baseEligible || validCaen.length === 0) {
    return {
      verdict: 'conditionally_eligible',
      explanation: `Produsul "${product.name}" necesită validare suplimentară a operațiunilor interne.`,
      internal_operation_used: ops,
      supporting_caen_codes: validCaen,
      converted_intent: '',
      alternative_products: [],
      alternative_kits: [],
      sales_angle: '',
      confidence_score: 0.5,
      reasoning_steps: [{
        item: product.name,
        baseType: product.base_product_type,
        deliverableType: profile?.deliverableType || product.base_product_type,
        operations: ops,
        caen: validCaen,
        eligible: validCaen.length > 0,
        explanation: product.eligible_logic,
      }],
    };
  }

  return {
    verdict: 'eligible',
    explanation: product.eligible_logic,
    internal_operation_used: ops,
    supporting_caen_codes: validCaen,
    converted_intent: '',
    alternative_products: [],
    alternative_kits: [],
    sales_angle: `${profile.deliverableType} realizat prin ${ops.join(', ')} sub CAEN ${validCaen.join(', ')}.`,
    confidence_score: 0.92,
    reasoning_steps: [{
      item: product.name,
      baseType: product.base_product_type,
      deliverableType: profile.deliverableType,
      operations: ops,
      caen: validCaen,
      eligible: true,
      explanation: product.eligible_logic,
    }],
  };
}

// Re-export for backward compat
export { CLASSIFICATION_RULES as productRules_v2 };

// Legacy compat shim — brief-analyzer uses these
export const productRules = CLASSIFICATION_RULES
  .filter(r => DELIVERABLE_PROFILES[r.baseType]?.baseEligible)
  .map(r => ({
    keywords: r.keywords,
    operations: DELIVERABLE_PROFILES[r.baseType]?.allowedOperations || [],
    caen: DELIVERABLE_PROFILES[r.baseType]?.caen || [],
    baseEligible: true,
    logic: `Produs de tip ${r.baseType}`,
  }));

export const notEligibleRules = CLASSIFICATION_RULES
  .filter(r => !DELIVERABLE_PROFILES[r.baseType]?.baseEligible)
  .map(r => ({
    keywords: r.keywords,
    intent: r.intent,
    alternativeProducts: findAlternatives(r.baseType)?.products || [],
    alternativeKits: findAlternatives(r.baseType)?.kits || [],
    salesAngle: findAlternatives(r.baseType)?.salesAngle || '',
  }));
