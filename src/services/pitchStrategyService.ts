// ─── Pitch Strategy Generator ───────────────────────────────────────
// Generates a commercial pitch strategy based on company signals, intent, and industry.

import type { CompanySignals } from './companySignalsService';
import type { DetectedIntent, IntentType, INTENT_LABELS } from './intentDetectionService';
import { getIndustryProfile } from './industryIntelligenceService';

export interface PitchStrategy {
  headline: string;
  body: string;
  key_angles: string[];
  recommended_approach: string;
  urgency_level: 'low' | 'medium' | 'high';
}

const INTENT_STRATEGIES: Record<IntentType, { headline: string; angle: string }> = {
  exploration: { headline: 'Prezentare generală servicii eligibile', angle: 'Clientul explorează opțiunile disponibile prin unitate protejată. Prezentarea trebuie să acopere gama completă de categorii eligibile.' },
  service_discovery: { headline: 'Descoperire servicii prin fond handicap', angle: 'Clientul caută să înțeleagă ce poate achiziționa prin fondul de handicap. Focusul trebuie pe categoriile eligibile și beneficiile fiscale.' },
  onboarding: { headline: 'Kituri de onboarding și welcome experience', angle: 'Onboarding-ul este o investiție în retenție. Kiturile branduite creează primele impresii memorabile.' },
  employer_branding: { headline: 'Materiale de employer branding', angle: 'Employer branding-ul puternic atrage talente. Materialele fizice branduite completează strategia digitală.' },
  conference: { headline: 'Materiale de conferință și summit', angle: 'Conferințele necesită materiale profesionale — de la badge-uri la mape, roll-up-uri și kituri speaker.' },
  event_support: { headline: 'Suport material pentru evenimente', angle: 'Evenimentele au impact maxim cu materiale branduite coerente — vizuale, textile și accesorii.' },
  office_utility: { headline: 'Papetărie și materiale de birou', angle: 'Materialele de birou branduite îmbunătățesc identitatea vizuală internă și productivitatea.' },
  internal_communication: { headline: 'Materiale de comunicare internă', angle: 'Comunicarea internă eficientă necesită suporturi fizice — afișaje, broșuri, flyere informative.' },
  corporate_gifting: { headline: 'Pachete de corporate gifting', angle: 'Cadourile corporate bine alese construiesc relații. Kiturile elegante fac diferența.' },
  training: { headline: 'Materiale de training și formare', angle: 'Materialele de training profesionale — manuale, agende, kituri — îmbunătățesc experiența de învățare.' },
  recruitment: { headline: 'Materiale de recrutare și career fairs', angle: 'La târgurile de cariere, materialele branduite fac standurile memorabile și atrag candidații.' },
  marketing_campaign: { headline: 'Materiale de campanie marketing', angle: 'Campaniile de marketing au nevoie de suport fizic — POSM, bannere, flyere, materiale promoționale.' },
  branch_branding: { headline: 'Branding sucursale și locații', angle: 'Brandingul consistent al locațiilor consolidează identitatea vizuală pe toate punctele de contact.' },
};

function buildSignalInsights(signals: CompanySignals): string[] {
  const insights: string[] = [];
  if (signals.hr_relevance === 'high') insights.push('Relevanță HR ridicată — kituri de onboarding și employer branding sunt prioritare');
  if (signals.marketing_event_relevance === 'high') insights.push('Potențial mare pentru materiale de marketing și evenimente');
  if (signals.corporate_gifting_relevance === 'high') insights.push('Oportunitate semnificativă în corporate gifting');
  if (signals.csr_relevance === 'high') insights.push('Sensibilitate CSR — produsele eco și responsabile vor rezona');
  if (signals.multi_location_relevance) insights.push('Companie multi-locație — volum scalabil pe sucursale');
  if (signals.recruiting_signal) insights.push('Semnale de recrutare activă — kituri de onboarding și welcome sunt urgente');
  if (signals.internal_branding_relevance === 'high') insights.push('Branding intern puternic — materialele de identitate vizuală sunt prioritare');
  return insights;
}

export function generatePitchStrategy(
  signals: CompanySignals,
  intent: DetectedIntent,
  industry: string,
  opportunityEstimate?: number,
): PitchStrategy {
  const strategy = INTENT_STRATEGIES[intent.primary_intent];
  const profile = getIndustryProfile(industry);
  const signalInsights = buildSignalInsights(signals);

  // Build body
  const bodyParts: string[] = [strategy.angle];
  if (profile.pitch_focus) bodyParts.push(profile.pitch_focus);
  if (signalInsights.length > 0) bodyParts.push(signalInsights[0]);
  if (opportunityEstimate && opportunityEstimate > 0) {
    bodyParts.push(`Estimarea oportunității: ~${opportunityEstimate.toLocaleString('ro-RO')} lei/lună potențial.`);
  }

  // Key angles
  const key_angles: string[] = [strategy.angle];
  if (signals.multi_location_relevance) key_angles.push('Scalabilitate pe multiple locații');
  if (signals.recruiting_signal) key_angles.push('Urgență — recrutare activă detectată');
  if (intent.secondary_intent) {
    const sec = INTENT_STRATEGIES[intent.secondary_intent];
    if (sec) key_angles.push(sec.angle);
  }

  // Urgency
  let urgency_level: 'low' | 'medium' | 'high' = 'medium';
  if (signals.recruiting_signal || intent.primary_intent === 'onboarding') urgency_level = 'high';
  if (intent.primary_intent === 'office_utility') urgency_level = 'low';

  return {
    headline: strategy.headline,
    body: bodyParts.join(' '),
    key_angles,
    recommended_approach: profile.pitch_focus || strategy.angle,
    urgency_level,
  };
}
