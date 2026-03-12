// ─── Industry Intelligence Service ──────────────────────────────────
// Industry-specific recommendations for products and kits.

export interface IndustryProfile {
  industry: string;
  suggested_kit_categories: string[];
  suggested_product_types: string[];
  priority_intents: string[];
  pitch_focus: string;
}

const INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
  energy: {
    industry: 'Energy',
    suggested_kit_categories: ['HR', 'Office', 'Corporate'],
    suggested_product_types: ['textile', 'papetărie', 'promoțional', 'print', 'vizual'],
    priority_intents: ['onboarding', 'internal_communication', 'branch_branding', 'employer_branding'],
    pitch_focus: 'Companiile din energie au obligații legale clare și volume mari de angajați pe teren. Focus pe kituri de onboarding, echipament brandat și comunicare internă.',
  },
  it: {
    industry: 'IT & Tech',
    suggested_kit_categories: ['HR', 'Marketing'],
    suggested_product_types: ['promoțional', 'eco', 'textile', 'kit'],
    priority_intents: ['onboarding', 'employer_branding', 'conference', 'recruitment'],
    pitch_focus: 'IT-ul se concentrează pe employer branding și retenție. Welcome kits premium, materiale conferință și brand experience fac diferența.',
  },
  retail: {
    industry: 'Retail',
    suggested_kit_categories: ['Marketing', 'Corporate'],
    suggested_product_types: ['vizual', 'print', 'promoțional', 'textile'],
    priority_intents: ['marketing_campaign', 'branch_branding', 'event_support', 'training'],
    pitch_focus: 'Retail-ul necesită volume mari de POSM, kituri promoționale și materiale de campanie. Multi-locație = multiplicator natural.',
  },
  banking: {
    industry: 'Banking & Finance',
    suggested_kit_categories: ['Protocol', 'Corporate', 'HR'],
    suggested_product_types: ['papetărie', 'promoțional', 'ambalaj', 'print'],
    priority_intents: ['corporate_gifting', 'onboarding', 'internal_communication', 'conference'],
    pitch_focus: 'Sectorul bancar valorează materialele premium, protocol gifting și papetărie corporate. Volum mare de angajați, obligații legale clare.',
  },
  pharma: {
    industry: 'Pharma & Healthcare',
    suggested_kit_categories: ['HR', 'Marketing', 'Corporate'],
    suggested_product_types: ['print', 'promoțional', 'eco', 'kit'],
    priority_intents: ['conference', 'onboarding', 'marketing_campaign', 'training'],
    pitch_focus: 'Pharma investește mult în conferințe medicale, materiale de training și kituri promoționale. Compliance-ul e important — eligibilitatea clară e un avantaj.',
  },
  telecom: {
    industry: 'Telecom',
    suggested_kit_categories: ['Marketing', 'HR', 'Corporate'],
    suggested_product_types: ['promoțional', 'vizual', 'textile', 'print'],
    priority_intents: ['marketing_campaign', 'event_support', 'branch_branding', 'onboarding'],
    pitch_focus: 'Telecom-ul are rețele de locații și campanii frecvente. Materiale POSM, kituri eveniment și branding sucursale sunt foarte relevante.',
  },
  fmcg: {
    industry: 'FMCG',
    suggested_kit_categories: ['Marketing', 'Corporate'],
    suggested_product_types: ['vizual', 'promoțional', 'print', 'ambalaj'],
    priority_intents: ['marketing_campaign', 'event_support', 'corporate_gifting'],
    pitch_focus: 'FMCG are nevoi continue de materiale promoționale, kituri de campanie și ambalaje branduite. Volume mari, cicluri scurte.',
  },
  auto: {
    industry: 'Automotive',
    suggested_kit_categories: ['Marketing', 'HR', 'Protocol'],
    suggested_product_types: ['promoțional', 'textile', 'print', 'vizual'],
    priority_intents: ['event_support', 'onboarding', 'marketing_campaign', 'corporate_gifting'],
    pitch_focus: 'Automotive combină evenimente, lansări de produse și onboarding tehnic. Materialele premium și kiturile de eveniment sunt foarte valoroase.',
  },
  consulting: {
    industry: 'Consulting & Professional Services',
    suggested_kit_categories: ['Protocol', 'Corporate', 'HR'],
    suggested_product_types: ['papetărie', 'promoțional', 'print'],
    priority_intents: ['corporate_gifting', 'employer_branding', 'conference', 'onboarding'],
    pitch_focus: 'Consultanța valorează materialele de protocol, papetăria premium și employer branding-ul. Cadourile corporate sunt un canal important.',
  },
  general: {
    industry: 'General',
    suggested_kit_categories: ['HR', 'Office', 'Corporate'],
    suggested_product_types: ['promoțional', 'papetărie', 'print', 'textile'],
    priority_intents: ['onboarding', 'corporate_gifting', 'office_utility'],
    pitch_focus: 'Recomandări generale — kituri de onboarding, papetărie corporate și materiale promoționale.',
  },
};

const INDUSTRY_ALIASES: Record<string, string> = {
  'energie': 'energy', 'energy': 'energy', 'petrol': 'energy', 'oil': 'energy', 'gaze': 'energy', 'utilități': 'energy',
  'it': 'it', 'tech': 'it', 'software': 'it', 'technology': 'it', 'digital': 'it', 'startup': 'it',
  'retail': 'retail', 'comerț': 'retail', 'magazine': 'retail', 'e-commerce': 'retail',
  'bancar': 'banking', 'banking': 'banking', 'financiar': 'banking', 'finance': 'banking', 'asigurări': 'banking', 'insurance': 'banking',
  'farma': 'pharma', 'pharma': 'pharma', 'medical': 'pharma', 'healthcare': 'pharma', 'sănătate': 'pharma',
  'telecom': 'telecom', 'telecomunicații': 'telecom',
  'fmcg': 'fmcg', 'bunuri consum': 'fmcg', 'alimentar': 'fmcg',
  'auto': 'auto', 'automotive': 'auto', 'automobile': 'auto',
  'consultanță': 'consulting', 'consulting': 'consulting', 'legal': 'consulting', 'avocatură': 'consulting',
};

export function getIndustryProfile(industry: string): IndustryProfile {
  const lower = industry.toLowerCase();
  for (const [alias, key] of Object.entries(INDUSTRY_ALIASES)) {
    if (lower.includes(alias)) {
      return INDUSTRY_PROFILES[key] || INDUSTRY_PROFILES.general;
    }
  }
  return INDUSTRY_PROFILES.general;
}

export function getIndustryBoost(industry: string, kitCategory: string, productType: string): number {
  const profile = getIndustryProfile(industry);
  let boost = 0;
  if (profile.suggested_kit_categories.some(c => kitCategory.toLowerCase().includes(c.toLowerCase()))) boost += 15;
  if (profile.suggested_product_types.includes(productType)) boost += 10;
  return boost;
}

export function getAllIndustryProfiles(): IndustryProfile[] {
  return Object.values(INDUSTRY_PROFILES);
}
