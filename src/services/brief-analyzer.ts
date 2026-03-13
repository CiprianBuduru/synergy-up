// ─── Brief Analyzer Service ─────────────────────────────────────────
// Analyzes client briefs to detect purpose, department, products, and eligibility.

import type { DetectedPurpose, BriefAnalysisV2 } from '@/types';
import { checkEligibility, productRules, notEligibleRules } from './eligibility';
import { analyzeBriefWithRules } from './briefRulesEngine';

// ═══════════ PURPOSE DETECTION ═══════════
const purposePatterns: { purpose: DetectedPurpose; keywords: string[] }[] = [
  { purpose: 'onboarding', keywords: ['onboarding', 'angajat nou', 'angajați noi', 'integrare', 'prima zi'] },
  { purpose: 'hr_welcome', keywords: ['welcome', 'bun venit', 'hr kit', 'welcome kit'] },
  { purpose: 'recruitment', keywords: ['recrutare', 'recruitment', 'târg cariere', 'career fair', 'employer branding', 'candidat'] },
  { purpose: 'eveniment', keywords: ['eveniment', 'event', 'team building', 'team event', 'gală', 'festival'] },
  { purpose: 'conferinta', keywords: ['conferinț', 'summit', 'congres', 'simpozion', 'workshop', 'seminar'] },
  { purpose: 'office_use', keywords: ['birou', 'office', 'workspace', 'papetărie birou', 'desk'] },
  { purpose: 'protocol', keywords: ['protocol', 'cadou oficial', 'reprezentare', 'delegație', 'ambasadă'] },
  { purpose: 'corporate_gifting', keywords: ['cadou', 'gift', 'cadouri', 'gifting', 'pachet cadou', 'christmas', 'crăciun', 'sărbători'] },
  { purpose: 'marketing_campaign', keywords: ['campanie', 'marketing', 'promoți', 'promo', 'lansare', 'awareness', 'brand'] },
  { purpose: 'internal_communication', keywords: ['comunicare internă', 'internal', 'newsletter', 'afișaj', 'informare angajați'] },
];

export const PURPOSE_LABELS: Record<DetectedPurpose, string> = {
  onboarding: 'Onboarding angajați',
  hr_welcome: 'HR Welcome',
  eveniment: 'Evenimente',
  conferinta: 'Conferințe',
  office_use: 'Office & Birou',
  protocol: 'Protocol & Reprezentare',
  corporate_gifting: 'Corporate Gifting',
  marketing_campaign: 'Campanii Marketing',
  internal_communication: 'Comunicare internă',
  recruitment: 'Recrutare',
};

export function detectPurpose(text: string): DetectedPurpose {
  const lower = text.toLowerCase();
  let best: DetectedPurpose = 'office_use';
  let bestScore = 0;
  for (const p of purposePatterns) {
    const score = p.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = p.purpose; }
  }
  return best;
}

export function detectIntents(text: string): string[] {
  const lower = text.toLowerCase();
  const intents: string[] = [];
  for (const p of purposePatterns) {
    if (p.keywords.some(k => lower.includes(k))) {
      intents.push(PURPOSE_LABELS[p.purpose]);
    }
  }
  return intents.length ? intents : ['General corporate'];
}

export function analyzeBrief(briefText: string): BriefAnalysisV2 {
  const lower = briefText.toLowerCase();

  // ── Check if this is an exploratory brief ──
  const isExploratory = isExploratoryBrief(lower);

  // Detect products (skip for exploratory briefs to avoid false positives from industry context)
  const detectedProducts: string[] = [];
  if (!isExploratory) {
    for (const rule of productRules) {
      for (const kw of rule.keywords) {
        if (lower.includes(kw) && !detectedProducts.includes(kw)) detectedProducts.push(kw);
      }
    }
  }

  const purpose = detectPurpose(briefText);
  const intents = detectIntents(briefText);

  // Department
  let department = 'General';
  if (/\b(hr|resurse umane|angajat|onboarding|people)\b/.test(lower)) department = 'HR';
  else if (/\b(marketing|campanie|brand|promovare)\b/.test(lower)) department = 'Marketing';
  else if (/\b(achizi|procurement|furnizor)\b/.test(lower)) department = 'Achiziții';
  else if (/\b(director|management|csr|board)\b/.test(lower)) department = 'Management';

  // Tone
  const toneMap: Record<string, string> = { HR: 'friendly', Marketing: 'premium', Management: 'corporate', 'Achiziții': 'technical' };
  const tone = toneMap[department] || 'corporate';

  // Audience
  let audience = 'Angajați';
  if (/\b(client|partener)\b/.test(lower)) audience = 'Clienți & Parteneri';
  else if (/\b(participant|invitat|speaker)\b/.test(lower)) audience = 'Participanți eveniment';
  else if (/\b(candidat|recrutare)\b/.test(lower)) audience = 'Candidați';

  // ── Exploratory brief — special eligibility branch ──
  if (isExploratory) {
    const exploratoryEligibility: import('@/types').EligibilityResult = {
      verdict: 'eligible',
      explanation: 'Exploratory brief — No direct product request detected. Generating eligible categories and recommended kits.',
      internal_operation_used: ['personalizare', 'branding', 'tipărire', 'ambalare / kituire'],
      supporting_caen_codes: ['7311', '1812', '1723', '1814'],
      converted_intent: 'explorare servicii',
      alternative_products: [],
      alternative_kits: ['Office Starter Kit', 'Branded Print Kit', 'Onboarding Starter Kit'],
      sales_angle: 'Clientul explorează opțiunile eligibile. Recomandăm o prezentare generală cu toată gama de categorii disponibile.',
      confidence_score: 0.7,
      reasoning_steps: [{
        item: 'Brief exploratoriu',
        baseType: 'exploratory',
        deliverableType: 'Prezentare generală',
        operations: ['personalizare', 'branding', 'tipărire', 'ambalare / kituire'],
        caen: ['7311', '1812', '1723', '1814'],
        eligible: true,
        explanation: 'Exploratory brief — no direct product request detected. Generating eligible categories and recommended kits.',
      }],
    };

    return {
      products: [],
      purpose,
      audience,
      department,
      tone,
      eligibility: exploratoryEligibility,
      detected_intents: ['Explorare servicii', ...intents],
      brief_rules_matches: [],
      recommended_kits_from_rules: [],
      pitch_lines_from_rules: [],
    };
  }

  // ── Brief Rules Engine (primary) ──
  const rulesResult = analyzeBriefWithRules(briefText);

  let eligibility;
  if (rulesResult.matches.length > 0 && rulesResult.eligibility) {
    // Rules engine matched — use its verdict (more precise)
    eligibility = rulesResult.eligibility;
  } else {
    // Fallback to generic eligibility engine
    eligibility = checkEligibility(briefText);
    const hasNotEligible = notEligibleRules.some(r => r.keywords.some(kw => lower.includes(kw)));
    const hasEligible = detectedProducts.length > 0;

    if (hasNotEligible && hasEligible && eligibility.verdict === 'not_eligible_but_convertible') {
      eligibility.verdict = 'conditionally_eligible';
      eligibility.explanation = 'Brief-ul conține atât produse eligibile cât și produse neeligibile. Recomandăm focusarea pe componentele eligibile și propunerea de alternative.';
      eligibility.confidence_score = 0.75;
    }
  }

  // Enrich detected products with rules recommendations
  const enrichedProducts = rulesResult.matches.length > 0
    ? [...new Set([...detectedProducts, ...rulesResult.recommended_products])]
    : detectedProducts;

  return {
    products: enrichedProducts,
    purpose,
    audience,
    department,
    tone,
    eligibility,
    detected_intents: intents,
    brief_rules_matches: rulesResult.matches,
    recommended_kits_from_rules: rulesResult.recommended_kits,
    pitch_lines_from_rules: rulesResult.pitch_lines,
  };
}

/** Detect if a brief is exploratory (no concrete product request) */
function isExploratoryBrief(lower: string): boolean {
  const exploratoryPatterns = [
    /ce\s+servicii/,
    /ce\s+produse/,
    /ce\s+putem\s+achizi/,
    /ce\s+pot\s+fi\s+achizi/,
    /orice\s+informatie/,
    /orice\s+informație/,
    /trimite.*informati/,
    /trimite.*prezentare/,
    /sa\s+primesc.*informati/,
    /să\s+primesc.*informați/,
    /as\s+fi\s+interesat/,
    /aș\s+fi\s+interesat/,
  ];
  const hasExploratorySignal = exploratoryPatterns.some(p => p.test(lower));

  // Also check for fond de handicap + no specific products
  const hasFondHandicap = /fond\s+(de\s+)?handicap/.test(lower);

  // Check for concrete product keywords
  const concreteProductPatterns = [
    /tricou/, /agend/, /cani\b/, /cană/, /pix/, /marker/, /flyere/, /brosur/,
    /roll-?up/, /banner/, /mapă/, /mape\b/, /papetărie/, /ecusoane/, /badge/,
    /calendar/, /rucsac/, /umbrela/, /sticker/, /etichet/,
  ];
  const hasConcreteProduct = concreteProductPatterns.some(p => p.test(lower));

  // It's exploratory if we have exploratory signals AND no concrete products
  return (hasExploratorySignal || hasFondHandicap) && !hasConcreteProduct;
}
