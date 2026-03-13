// ─── Intent Detection Service v2 ────────────────────────────────────
// Detects the real intent behind a client request.
// Separate from eligibility logic — pure intent classification.

export type IntentType =
  | 'onboarding'
  | 'employer_branding'
  | 'conference'
  | 'event_support'
  | 'office_utility'
  | 'internal_communication'
  | 'corporate_gifting'
  | 'training'
  | 'recruitment'
  | 'marketing_campaign'
  | 'branch_branding'
  | 'exploration'
  | 'service_discovery';

export interface DetectedIntent {
  primary_intent: IntentType;
  secondary_intent: IntentType | null;
  all_intents: { intent: IntentType; score: number }[];
  confidence: number;
}

interface IntentPattern {
  intent: IntentType;
  keywords: string[];
  weight: number; // base weight for this intent
}

const INTENT_PATTERNS: IntentPattern[] = [
  { intent: 'exploration', keywords: ['informatii', 'informații', 'detalii', 'ce servicii', 'ce produse', 'ce putem', 'ce pot fi', 'orice informatie', 'orice informație', 'as fi interesat', 'aș fi interesat', 'sa primesc', 'să primesc', 'explorare', 'curios'], weight: 1.2 },
  { intent: 'service_discovery', keywords: ['fond handicap', 'fond de handicap', 'unitate protejata', 'unitate protejată', 'achizitionate prin', 'achiziționate prin', 'servicii eligibile', 'produse eligibile'], weight: 1.2 },
  { intent: 'onboarding', keywords: ['onboarding', 'angajat nou', 'angajați noi', 'integrare', 'prima zi', 'welcome kit', 'welcome pack', 'nou venit', 'noi colegi'], weight: 1.0 },
  { intent: 'employer_branding', keywords: ['employer brand', 'brand angajator', 'brand intern', 'cultură organizațională', 'employee experience', 'employer value', 'evp'], weight: 1.0 },
  { intent: 'conference', keywords: ['conferinț', 'summit', 'congres', 'simpozion', 'workshop', 'seminar', 'speaker', 'panel'], weight: 1.0 },
  { intent: 'event_support', keywords: ['eveniment', 'event', 'team building', 'teambuilding', 'gală', 'festival', 'petrecere', 'aniversare', 'party'], weight: 1.0 },
  { intent: 'office_utility', keywords: ['birou', 'office', 'workspace', 'papetărie birou', 'desk', 'organizare birou', 'rechizite'], weight: 0.8 },
  { intent: 'internal_communication', keywords: ['comunicare internă', 'internal', 'newsletter', 'afișaj', 'informare angajați', 'anunț intern', 'town hall'], weight: 0.9 },
  { intent: 'corporate_gifting', keywords: ['cadou', 'gift', 'cadouri', 'gifting', 'pachet cadou', 'christmas', 'crăciun', 'sărbători', 'paști', 'ziua femeii', '8 martie', 'aniversare firmă'], weight: 1.0 },
  { intent: 'training', keywords: ['training', 'formare', 'instruire', 'curs', 'workshop intern', 'dezvoltare profesională', 'learning', 'academie'], weight: 0.9 },
  { intent: 'recruitment', keywords: ['recrutare', 'recruitment', 'târg cariere', 'career fair', 'candidat', 'employer branding event', 'joburi', 'hiring'], weight: 1.0 },
  { intent: 'marketing_campaign', keywords: ['campanie', 'marketing', 'promoți', 'promo', 'lansare', 'awareness', 'brand campaign', 'activare', 'sampling'], weight: 1.0 },
  { intent: 'branch_branding', keywords: ['sucursală', 'filială', 'branch', 'sediu nou', 'relocare', 'deschidere', 'inaugurare', 'rebrand locație'], weight: 1.0 },
];

export const INTENT_LABELS: Record<IntentType, string> = {
  onboarding: 'Onboarding angajați',
  employer_branding: 'Employer Branding',
  conference: 'Conferință / Summit',
  event_support: 'Suport eveniment',
  office_utility: 'Utilitate office',
  internal_communication: 'Comunicare internă',
  corporate_gifting: 'Corporate Gifting',
  training: 'Training & Dezvoltare',
  recruitment: 'Recrutare',
  marketing_campaign: 'Campanie Marketing',
  branch_branding: 'Branding sucursală',
};

export function detectIntent(briefText: string): DetectedIntent {
  const lower = briefText.toLowerCase();
  const scores: { intent: IntentType; score: number }[] = [];

  for (const pattern of INTENT_PATTERNS) {
    const matchedCount = pattern.keywords.filter(kw => lower.includes(kw)).length;
    if (matchedCount > 0) {
      // Score = matched keywords * weight, with diminishing returns
      const score = Math.min(matchedCount * pattern.weight * 0.25, 1.0);
      scores.push({ intent: pattern.intent, score });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return {
      primary_intent: 'office_utility',
      secondary_intent: null,
      all_intents: [{ intent: 'office_utility', score: 0.3 }],
      confidence: 0.3,
    };
  }

  const primary = scores[0];
  const secondary = scores.length > 1 ? scores[1] : null;

  // Confidence based on how strong the primary signal is vs noise
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const confidence = Math.min(0.98, 0.5 + primary.score * 0.5 + (scores.length > 1 ? 0.1 : 0));

  return {
    primary_intent: primary.intent,
    secondary_intent: secondary?.intent || null,
    all_intents: scores,
    confidence: Math.round(confidence * 100) / 100,
  };
}
