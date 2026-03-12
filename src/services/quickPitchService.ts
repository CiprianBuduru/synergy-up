// ─── Quick Pitch Service ─────────────────────────────────────────────
// Generates a short pitch for email or conversation.

import type { CompanySignals } from './companySignalsService';
import type { DetectedIntent } from './intentDetectionService';
import type { OpportunityInsights } from './opportunityInsightsService';

export interface QuickPitch {
  short_pitch: string;
  hook_line: string;
  value_proposition: string;
  call_to_action: string;
}

export function generateQuickPitch(
  companyName: string,
  industry: string,
  signals: CompanySignals,
  intent: DetectedIntent | null,
  insights: OpportunityInsights,
): QuickPitch {
  const budget = insights.estimated_monthly_budget;
  const budgetStr = budget > 0 ? `${budget.toLocaleString('ro-RO')} RON` : 'un buget semnificativ';

  // Hook line based on signals
  let hook_line = `Pe baza dimensiunii companiei ${companyName}, mecanismul unităților protejate poate transforma o obligație legală într-un buget utilizabil pentru produse corporate.`;
  if (signals.recruiting_signal) {
    hook_line = `${companyName} este în proces activ de recrutare — mecanismul UP poate finanța kituri de onboarding și materiale de welcome.`;
  } else if (signals.multi_location_relevance) {
    hook_line = `Cu multiple locații, ${companyName} poate beneficia de soluții scalabile de branding și materiale corporate prin mecanismul UP.`;
  }

  // Value prop based on intent
  const intentStr = intent?.primary_intent || 'onboarding';
  const VALUE_PROPS: Record<string, string> = {
    onboarding: `Companiile din industria ${industry} utilizează frecvent acest mecanism pentru kituri de onboarding, materiale corporate și produse personalizate utile pentru angajați.`,
    employer_branding: `Materialele de employer branding — de la textile branduite la kituri de welcome — pot fi finanțate integral prin acest mecanism.`,
    corporate_gifting: `Pachetele de corporate gifting și cadourile corporate pot fi achiziționate prin mecanismul UP, oferind valoare reală partenerilor și angajaților.`,
    marketing_campaign: `Materialele de campanie — bannere, POSM, produse promoționale — pot fi finanțate prin mecanismul UP.`,
    conference: `Materialele de conferință — mape, badge-uri, roll-up-uri — pot fi realizate integral prin unitățile protejate.`,
    event_support: `Suportul material pentru evenimente poate fi realizat complet prin mecanismul UP — de la vizuale la produse promoționale.`,
    office_utility: `Papetăria și materialele de birou branduite sunt printre cele mai frecvente produse achiziționate prin UP.`,
    internal_communication: `Materialele de comunicare internă — afișaje, broșuri, newsletter-uri print — pot fi realizate prin UP.`,
    training: `Materialele de training — manuale, agende de curs, kituri de formare — sunt eligibile prin mecanismul UP.`,
    recruitment: `Materialele de recrutare și career fair pot fi finanțate integral prin UP.`,
    branch_branding: `Brandingul consistent al sucursalelor — semnalistică, vizual, materiale de identitate — poate fi realizat prin UP.`,
  };

  const value_proposition = VALUE_PROPS[intentStr] || VALUE_PROPS.onboarding;

  const short_pitch = `${hook_line}\n\n${value_proposition}`;

  const call_to_action = budget > 0
    ? `Estimăm un potențial lunar de aproximativ ${budgetStr}. Vă putem prezenta câteva exemple concrete de soluții relevante.`
    : `Vă putem prezenta câteva exemple concrete de soluții relevante pentru compania dumneavoastră.`;

  return { short_pitch, hook_line, value_proposition, call_to_action };
}
