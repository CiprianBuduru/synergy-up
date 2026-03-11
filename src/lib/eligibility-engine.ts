import type { EligibilityResult, EligibilityStatus } from '@/types';
import { seedOperations, seedProducts, seedAlternatives, seedKits } from '@/data/seed';

const eligibleKeywords = [
  'tricou', 'tricouri', 'agendă', 'agende', 'pix', 'pixuri', 'mapă', 'mape',
  'blocnotes', 'broșur', 'flyer', 'flyere', 'banner', 'bannere', 'roll-up',
  'cană', 'căni', 'papetărie', 'welcome card', 'calendar', 'catalog',
  'etichet', 'șepcă', 'șepci', 'print', 'tipărit', 'personalizat',
  'onboarding kit', 'welcome kit', 'event kit', 'kit', 'pachet cadou',
  'materiale promo', 'materiale conferinț', 'materiale eveniment',
];

const notEligibleKeywords = [
  'laptop', 'calculator', 'telefon', 'tableta', 'tabletă', 'software',
  'licență', 'mobilier', 'scaun', 'birou', 'catering', 'transport',
  'cursuri', 'training online', 'gadget', 'electronice', 'abonament',
  'bilete', 'consultanț',
];

export function analyzeBrief(briefText: string): {
  products: string[];
  purpose: string;
  audience: string;
  department: string;
  tone: string;
  eligibility: EligibilityStatus;
} {
  const lower = briefText.toLowerCase();

  const detectedProducts: string[] = [];
  eligibleKeywords.forEach(kw => {
    if (lower.includes(kw)) detectedProducts.push(kw);
  });

  const notEligible = notEligibleKeywords.some(kw => lower.includes(kw));

  let purpose = 'General corporate';
  if (lower.includes('onboarding') || lower.includes('angajat') || lower.includes('nou')) purpose = 'Onboarding';
  else if (lower.includes('eveniment') || lower.includes('conferinț')) purpose = 'Evenimente';
  else if (lower.includes('campanie') || lower.includes('marketing') || lower.includes('promo')) purpose = 'Marketing & Promovare';
  else if (lower.includes('cadou') || lower.includes('protocol')) purpose = 'Protocol & Gifting';
  else if (lower.includes('office') || lower.includes('birou')) purpose = 'Office & Papetărie';

  let department = 'General';
  if (lower.includes('hr') || lower.includes('resurse umane') || lower.includes('angajat') || lower.includes('onboarding')) department = 'HR';
  else if (lower.includes('marketing') || lower.includes('campanie') || lower.includes('brand')) department = 'Marketing';
  else if (lower.includes('achizit') || lower.includes('procurement') || lower.includes('furnizor')) department = 'Achiziții';
  else if (lower.includes('director') || lower.includes('management') || lower.includes('csr')) department = 'Management';

  let tone = 'corporate';
  if (department === 'HR') tone = 'friendly';
  else if (department === 'Marketing') tone = 'premium';
  else if (department === 'Management') tone = 'corporate';
  else if (department === 'Achiziții') tone = 'technical';

  let audience = 'Angajați';
  if (lower.includes('client') || lower.includes('partener')) audience = 'Clienți & Parteneri';
  else if (lower.includes('participant') || lower.includes('invitat')) audience = 'Participanți eveniment';

  let eligibility: EligibilityStatus = 'eligible';
  if (notEligible && detectedProducts.length > 0) eligibility = 'conditionally_eligible';
  else if (notEligible) eligibility = 'not_eligible_but_convertible';

  return { products: detectedProducts, purpose, audience, department, tone, eligibility };
}

export function checkEligibility(productOrRequest: string): EligibilityResult {
  const lower = productOrRequest.toLowerCase();

  // Check if directly eligible
  const matchedProduct = seedProducts.find(p =>
    lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower)
  );

  if (matchedProduct) {
    return {
      verdict: 'eligible',
      explanation: matchedProduct.eligible_logic,
      internal_operation: matchedProduct.internal_operations_json.join(', '),
      supporting_caen: matchedProduct.supporting_caen_codes_json.join(', '),
      alternative_suggestions: [],
    };
  }

  // Check keywords
  const isEligibleKeyword = eligibleKeywords.some(kw => lower.includes(kw));
  if (isEligibleKeyword) {
    const relatedOp = seedOperations.find(op => {
      const opLower = op.name.toLowerCase();
      if (lower.includes('tipăr') || lower.includes('print')) return opLower.includes('tipărire');
      if (lower.includes('personal')) return opLower.includes('personalizare');
      if (lower.includes('legăt')) return opLower.includes('legătorie');
      if (lower.includes('ambal') || lower.includes('kit')) return opLower.includes('ambalare');
      return false;
    }) || seedOperations[0];

    return {
      verdict: 'eligible',
      explanation: `Produsul/serviciul poate fi realizat intern prin operațiunea: ${relatedOp.name}`,
      internal_operation: relatedOp.name,
      supporting_caen: relatedOp.caen_code,
      alternative_suggestions: [],
    };
  }

  // Check not eligible
  const matchedAlt = seedAlternatives.find(a => lower.includes(a.source_request_keyword));
  if (matchedAlt) {
    return {
      verdict: 'not_eligible_but_convertible',
      explanation: matchedAlt.explanation,
      internal_operation: 'N/A - produs neeligibil direct',
      supporting_caen: 'N/A',
      alternative_suggestions: [matchedAlt.suggested_product_or_kit],
    };
  }

  // Default: conditionally eligible
  return {
    verdict: 'conditionally_eligible',
    explanation: 'Produsul ar putea fi eligibil dacă include operațiuni realizate intern (personalizare, tipărire, ambalare). Necesită analiză suplimentară.',
    internal_operation: 'De determinat',
    supporting_caen: 'De determinat',
    alternative_suggestions: ['Onboarding Kit', 'Branded Print Kit'],
  };
}

export function calculateOpportunity(
  employeeCount: number,
  disabledEmployees: number,
  minWage: number
): {
  required_positions_4_percent: number;
  uncovered_positions: number;
  monthly_obligation_estimated: number;
  spendable_half_estimated: number;
  below_threshold: boolean;
} {
  const required = Math.ceil(employeeCount * 0.04);
  const uncovered = Math.max(0, required - disabledEmployees);
  const monthly = uncovered * minWage;
  const half = Math.round(monthly / 2);

  return {
    required_positions_4_percent: required,
    uncovered_positions: uncovered,
    monthly_obligation_estimated: monthly,
    spendable_half_estimated: half,
    below_threshold: employeeCount < 50,
  };
}

export function getRecommendedProducts(purpose: string, department: string) {
  return seedProducts.filter(p => {
    const suitable = p.suitable_for_json.map(s => s.toLowerCase());
    const purposeLower = purpose.toLowerCase();
    return suitable.some(s =>
      purposeLower.includes(s) || s.includes(purposeLower.split(' ')[0])
    );
  }).slice(0, 6);
}

export function getRecommendedKits(purpose: string, industry: string) {
  return seedKits.filter(k => {
    const purposeLower = purpose.toLowerCase();
    const kitPurpose = k.purpose.toLowerCase();
    const kitCategory = k.category.toLowerCase();
    return kitPurpose.includes(purposeLower.split(' ')[0]) ||
      purposeLower.includes(kitCategory) ||
      k.suggested_industries_json.some(i => i.toLowerCase().includes(industry.toLowerCase().slice(0, 4)));
  }).slice(0, 4);
}
