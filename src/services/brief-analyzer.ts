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

  // Detect products
  const detectedProducts: string[] = [];
  for (const rule of productRules) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw) && !detectedProducts.includes(kw)) detectedProducts.push(kw);
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

  // Eligibility
  const eligibility = checkEligibility(briefText);
  const hasNotEligible = notEligibleRules.some(r => r.keywords.some(kw => lower.includes(kw)));
  const hasEligible = detectedProducts.length > 0;

  if (hasNotEligible && hasEligible && eligibility.verdict === 'not_eligible_but_convertible') {
    eligibility.verdict = 'conditionally_eligible';
    eligibility.explanation = 'Brief-ul conține atât produse eligibile cât și produse neeligibile. Recomandăm focusarea pe componentele eligibile și propunerea de alternative.';
    eligibility.confidence_score = 0.75;
  }

  return { products: detectedProducts, purpose, audience, department, tone, eligibility, detected_intents: intents };
}
