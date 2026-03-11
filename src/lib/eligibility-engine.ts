import type { EligibilityResult, EligibilityStatus, DetectedPurpose, BriefAnalysisV2 } from '@/types';
import { seedOperations, seedProducts, seedAlternatives, seedKits } from '@/data/seed';

// ═══════════ AUTHORIZED CAEN CODES ═══════════
const AUTHORIZED_CAEN: Record<string, string> = {
  '7311': 'Activități ale agențiilor de publicitate',
  '1812': 'Alte activități de tipărire n.c.a.',
  '1814': 'Legătorie și servicii conexe',
  '1723': 'Fabricarea articolelor de papetărie',
};

// ═══════════ INTERNAL OPERATIONS MAP ═══════════
const OPERATIONS_CAEN: Record<string, string[]> = {
  'personalizare': ['7311'],
  'branding': ['7311'],
  'tipărire': ['1812'],
  'legătorie': ['1814'],
  'papetărie': ['1723'],
  'ambalare / kituire': ['1812', '7311'],
  'montaj materiale promo': ['7311'],
  'pregătire materiale promoționale': ['7311'],
};

// ═══════════ PRODUCT → OPERATION MAPPING ═══════════
interface ProductRule {
  keywords: string[];
  operations: string[];
  caen: string[];
  baseEligible: boolean;
  logic: string;
}

const productRules: ProductRule[] = [
  // Textiles
  { keywords: ['tricou', 'tricouri', 'polo', 'hanorac', 'vestă', 'veste', 'șapcă', 'șepci', 'bandană', 'textile'], operations: ['personalizare', 'branding'], caen: ['7311'], baseEligible: true, logic: 'Textilele sunt achiziționate ca materie primă, personalizarea (serigrafie/broderie/transfer termic) se realizează intern.' },
  // Print materials
  { keywords: ['flyere', 'flyer', 'broșur', 'catalog', 'poster', 'afiș', 'banner', 'etiche', 'sticker', 'card vizită', 'invitați', 'certificat', 'diplomă', 'print', 'tipărit'], operations: ['tipărire', 'montaj materiale promo'], caen: ['1812', '7311'], baseEligible: true, logic: 'Materialele print sunt tipărite integral intern pe echipamentele proprii.' },
  // Stationery
  { keywords: ['agend', 'blocnotes', 'mapă', 'mape', 'papetărie', 'plic', 'dosar', 'registru', 'caiet', 'carnețel'], operations: ['papetărie', 'legătorie'], caen: ['1723', '1814'], baseEligible: true, logic: 'Articolele de papetărie sunt fabricate intern, cu legătorie realizată în atelierul propriu.' },
  // Writing instruments
  { keywords: ['pix', 'pixuri', 'stilou', 'creion', 'marker', 'instrumente de scris'], operations: ['branding', 'personalizare'], caen: ['7311'], baseEligible: true, logic: 'Instrumentele de scris sunt achiziționate și branduite/gravate intern.' },
  // Ceramics & glass
  { keywords: ['cană', 'căni', 'pahar', 'pahare', 'sticlă', 'termos', 'ceramică'], operations: ['personalizare', 'branding'], caen: ['7311'], baseEligible: true, logic: 'Produsele ceramice/sticlă sunt achiziționate și personalizate intern (sublimare/gravură).' },
  // Bags & accessories
  { keywords: ['geantă', 'rucsac', 'sacoș', 'husă', 'portofel', 'borseta', 'lanyard', 'badge', 'ecuson'], operations: ['personalizare', 'branding'], caen: ['7311'], baseEligible: true, logic: 'Accesoriile sunt achiziționate ca bază, personalizarea se realizează intern.' },
  // IT promo accessories
  { keywords: ['mousepad', 'suport telefon', 'hub usb', 'stick usb', 'powerbank', 'cablu personalizat', 'webcam cover', 'port card'], operations: ['branding', 'personalizare', 'ambalare / kituire'], caen: ['7311'], baseEligible: true, logic: 'Accesoriile IT promo sunt achiziționate și branduite/personalizate intern.' },
  // Display/expo materials
  { keywords: ['roll-up', 'rollup', 'display', 'totem', 'stand expo', 'panou', 'backdrop'], operations: ['tipărire', 'montaj materiale promo'], caen: ['1812', '7311'], baseEligible: true, logic: 'Materialele expoziționale sunt tipărite și montate/asamblate intern.' },
  // Eco products
  { keywords: ['eco', 'reciclat', 'bambus', 'plută', 'bumbac organic', 'biodegradabil'], operations: ['personalizare', 'branding'], caen: ['7311'], baseEligible: true, logic: 'Produsele eco sunt achiziționate ca bază sustenabilă, personalizarea se realizează intern.' },
  // Calendars
  { keywords: ['calendar', 'planner'], operations: ['tipărire', 'legătorie', 'papetărie'], caen: ['1812', '1814', '1723'], baseEligible: true, logic: 'Calendarele sunt tipărite și legate intern, cu design și producție proprie.' },
  // Kits
  { keywords: ['kit', 'pachet', 'set cadou', 'welcome kit', 'onboarding kit', 'gift box'], operations: ['ambalare / kituire', 'branding', 'pregătire materiale promoționale'], caen: ['7311', '1812'], baseEligible: true, logic: 'Kiturile sunt compuse, ambalate și branduite integral intern din produse eligibile.' },
  // Outdoor
  { keywords: ['umbrelă', 'pelerina', 'pătură', 'prosop', 'saltea'], operations: ['personalizare', 'branding'], caen: ['7311'], baseEligible: true, logic: 'Produsele outdoor sunt achiziționate și personalizate/branduite intern.' },
];

// ═══════════ NOT ELIGIBLE ITEMS ═══════════
interface NotEligibleRule {
  keywords: string[];
  intent: string;
  alternativeProducts: string[];
  alternativeKits: string[];
  salesAngle: string;
}

const notEligibleRules: NotEligibleRule[] = [
  { keywords: ['laptop', 'laptopuri', 'calculator', 'calculatoare', 'pc'], intent: 'onboarding / utilitate IT', alternativeProducts: ['Mousepad personalizat', 'Husă laptop brandată', 'Powerbank brandat', 'Suport telefon personalizat', 'Agendă tech'], alternativeKits: ['Alternative to Laptop Request Kit', 'Onboarding Starter Kit', 'Office Starter Kit'], salesAngle: 'Deși laptopurile nu pot fi facturate prin unitate protejată, accesoriile IT branduite și kiturile de onboarding sunt 100% eligibile și creează o experiență memorabilă pentru angajatul nou.' },
  { keywords: ['telefon', 'telefoane', 'smartphone'], intent: 'utilitate IT / comunicare', alternativeProducts: ['Suport telefon personalizat', 'Husă telefon brandată', 'Powerbank brandat', 'Cablu personalizat'], alternativeKits: ['Alternative to Laptop Request Kit', 'Onboarding Starter Kit'], salesAngle: 'Telefoanele nu sunt eligibile, dar accesoriile tech branduite sunt — și sunt mai vizibile ca element de branding.' },
  { keywords: ['tabletă', 'tablete', 'ipad'], intent: 'utilitate IT', alternativeProducts: ['Husă tabletă brandată', 'Suport tabletă personalizat', 'Mousepad personalizat', 'Powerbank brandat'], alternativeKits: ['Alternative to Laptop Request Kit', 'Office Starter Kit'], salesAngle: 'Tabletele nu pot fi incluse, dar accesoriile tech personalizate intern sunt eligibile și reprezintă o soluție practică.' },
  { keywords: ['mobilier', 'scaun', 'scaune', 'birou', 'birouri', 'raft', 'rafturi', 'dulap'], intent: 'office utility / workspace setup', alternativeProducts: ['Organizer birou brandat', 'Set papetărie office', 'Calendar birou personalizat', 'Suport pixuri brandat', 'Mape organizare'], alternativeKits: ['Alternative to Furniture Request Kit', 'Office Starter Kit', 'Procurement Utility Kit'], salesAngle: 'Mobilierul nu este eligibil, dar materialele de organizare, papetăria brandată și kiturile office sunt — și completează perfect spațiul de lucru.' },
  { keywords: ['software', 'licență', 'licențe', 'aplicație', 'abonament digital'], intent: 'utilitate digitală', alternativeProducts: ['Manual training tipărit', 'Broșură proceduri', 'Mapă documentație', 'Set papetărie office'], alternativeKits: ['Training Kit', 'Branded Print Kit'], salesAngle: 'Licențele software nu sunt eligibile, dar materialele de training tipărite intern sunt o completare excelentă.' },
  { keywords: ['catering', 'mâncare', 'coffee break', 'prânz'], intent: 'eveniment / hospitality', alternativeProducts: ['Cană personalizată', 'Pahar personalizat', 'Set tocilar personalizat', 'Șervețele branduite'], alternativeKits: ['Conference Basic Kit', 'Event Promotion Kit'], salesAngle: 'Cateringul nu este eligibil, dar materialele de eveniment (badge-uri, mape, bannere, căni branduite) sunt 100% eligibile.' },
  { keywords: ['transport', 'deplasare', 'cursă', 'combustibil'], intent: 'logistică / operațional', alternativeProducts: ['Flyere', 'Etichete branduite', 'Mape transport'], alternativeKits: ['Branded Print Kit', 'Energy Field Support Kit'], salesAngle: 'Transportul nu este eligibil, dar materialele tipărite și de branding pentru flota auto sunt.' },
  { keywords: ['cursuri', 'training online', 'formare', 'e-learning'], intent: 'dezvoltare profesională', alternativeProducts: ['Manual training tipărit', 'Mape training', 'Blocnotes', 'Certificat tipărit'], alternativeKits: ['Training Kit', 'Conference Basic Kit'], salesAngle: 'Cursurile online nu sunt eligibile, dar materialele fizice de training — manuale tipărite, mape, certificări — sunt realizate intern.' },
  { keywords: ['gadget', 'gadgeturi', 'electronice', 'electrocasnice'], intent: 'tech gifting', alternativeProducts: ['Powerbank brandat', 'Mousepad personalizat', 'Husă laptop brandată', 'Stick USB brandat'], alternativeKits: ['Corporate Gifting Kit', 'Alternative to Laptop Request Kit'], salesAngle: 'Gadgeturile electronice nu sunt direct eligibile, dar accesoriile tech branduite intern sunt o alternativă excelentă.' },
  { keywords: ['bilete', 'intrări', 'acces eveniment'], intent: 'participare eveniment', alternativeProducts: ['Badge eveniment', 'Mapă participant', 'Flyere program', 'Ecuson personalizat'], alternativeKits: ['Event Promotion Kit', 'Conference Basic Kit'], salesAngle: 'Biletele nu sunt eligibile, dar toate materialele fizice de eveniment realizate intern sunt.' },
  { keywords: ['consultanță', 'servicii consultanță', 'advisory'], intent: 'servicii profesionale', alternativeProducts: ['Broșură servicii', 'Catalog corporate', 'Mapă prezentare'], alternativeKits: ['Sales Meeting Kit', 'Branded Print Kit'], salesAngle: 'Serviciile de consultanță nu sunt eligibile, dar materialele de prezentare și comunicare corporate tipărite intern sunt.' },
];

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

const PURPOSE_LABELS: Record<DetectedPurpose, string> = {
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

// ═══════════ CORE ENGINE ═══════════

function detectPurpose(text: string): DetectedPurpose {
  const lower = text.toLowerCase();
  let best: DetectedPurpose = 'office_use';
  let bestScore = 0;
  for (const p of purposePatterns) {
    const score = p.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = p.purpose; }
  }
  return best;
}

function detectIntents(text: string): string[] {
  const lower = text.toLowerCase();
  const intents: string[] = [];
  for (const p of purposePatterns) {
    if (p.keywords.some(k => lower.includes(k))) {
      intents.push(PURPOSE_LABELS[p.purpose]);
    }
  }
  return intents.length ? intents : ['General corporate'];
}

export function checkEligibility(productOrRequest: string): EligibilityResult {
  const lower = productOrRequest.toLowerCase();

  // 1. Check if NOT eligible first
  for (const rule of notEligibleRules) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return {
        verdict: 'not_eligible_but_convertible',
        explanation: `Produsul solicitat nu poate fi facturat prin unitate protejată deoarece nu implică o operațiune internă autorizată. Intenția detectată: ${rule.intent}.`,
        internal_operation_used: [],
        supporting_caen_codes: [],
        converted_intent: rule.intent,
        alternative_products: rule.alternativeProducts,
        alternative_kits: rule.alternativeKits,
        sales_angle: rule.salesAngle,
        confidence_score: 0.95,
      };
    }
  }

  // 2. Check eligible product rules
  for (const rule of productRules) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return {
        verdict: 'eligible',
        explanation: rule.logic,
        internal_operation_used: rule.operations,
        supporting_caen_codes: rule.caen,
        converted_intent: '',
        alternative_products: [],
        alternative_kits: [],
        sales_angle: `Produsul este 100% eligibil. Operațiunea internă (${rule.operations.join(', ')}) este realizată în atelierul propriu sub codurile CAEN ${rule.caen.map(c => `${c} — ${AUTHORIZED_CAEN[c]}`).join(', ')}.`,
        confidence_score: 0.92,
      };
    }
  }

  // 3. Check products library
  const matchedProduct = seedProducts.find(p =>
    lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower)
  );
  if (matchedProduct) {
    return {
      verdict: 'eligible',
      explanation: matchedProduct.eligible_logic,
      internal_operation_used: matchedProduct.internal_operations_json,
      supporting_caen_codes: matchedProduct.supporting_caen_codes_json,
      converted_intent: '',
      alternative_products: [],
      alternative_kits: [],
      sales_angle: `Produs din catalogul intern, realizat prin: ${matchedProduct.internal_operations_json.join(', ')}.`,
      confidence_score: 0.9,
    };
  }

  // 4. Check alternatives from seed
  const matchedAlt = seedAlternatives.find(a => lower.includes(a.source_request_keyword));
  if (matchedAlt) {
    return {
      verdict: 'not_eligible_but_convertible',
      explanation: matchedAlt.explanation,
      internal_operation_used: [],
      supporting_caen_codes: [],
      converted_intent: matchedAlt.source_request_keyword,
      alternative_products: [],
      alternative_kits: [matchedAlt.suggested_product_or_kit],
      sales_angle: matchedAlt.explanation,
      confidence_score: 0.85,
    };
  }

  // 5. Conditionally eligible fallback
  return {
    verdict: 'conditionally_eligible',
    explanation: 'Produsul ar putea fi eligibil dacă include operațiuni realizate intern (personalizare, tipărire, ambalare, legătorie). Este necesară o analiză suplimentară a livrabilului final.',
    internal_operation_used: ['De determinat'],
    supporting_caen_codes: ['De determinat'],
    converted_intent: '',
    alternative_products: [],
    alternative_kits: ['Onboarding Starter Kit', 'Branded Print Kit'],
    sales_angle: 'Recomandăm o discuție pentru a identifica componenta eligibilă — de multe ori produsul poate fi inclus într-un kit cu operațiuni interne.',
    confidence_score: 0.5,
  };
}

export function analyzeBrief(briefText: string): BriefAnalysisV2 {
  const lower = briefText.toLowerCase();

  // Detect products mentioned
  const detectedProducts: string[] = [];
  for (const rule of productRules) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw) && !detectedProducts.includes(kw)) detectedProducts.push(kw);
    }
  }

  const purpose = detectPurpose(briefText);
  const intents = detectIntents(briefText);

  // Department detection
  let department = 'General';
  if (/\b(hr|resurse umane|angajat|onboarding|people)\b/.test(lower)) department = 'HR';
  else if (/\b(marketing|campanie|brand|promovare)\b/.test(lower)) department = 'Marketing';
  else if (/\b(achizi|procurement|furnizor)\b/.test(lower)) department = 'Achiziții';
  else if (/\b(director|management|csr|board)\b/.test(lower)) department = 'Management';

  // Tone from department
  const toneMap: Record<string, string> = { HR: 'friendly', Marketing: 'premium', Management: 'corporate', 'Achiziții': 'technical' };
  const tone = toneMap[department] || 'corporate';

  // Audience
  let audience = 'Angajați';
  if (/\b(client|partener)\b/.test(lower)) audience = 'Clienți & Parteneri';
  else if (/\b(participant|invitat|speaker)\b/.test(lower)) audience = 'Participanți eveniment';
  else if (/\b(candidat|recrutare)\b/.test(lower)) audience = 'Candidați';

  // Run eligibility on entire brief
  const eligibility = checkEligibility(briefText);

  // If brief has both eligible and not-eligible items, upgrade to conditionally_eligible
  const hasNotEligible = notEligibleRules.some(r => r.keywords.some(kw => lower.includes(kw)));
  const hasEligible = detectedProducts.length > 0;

  if (hasNotEligible && hasEligible && eligibility.verdict === 'not_eligible_but_convertible') {
    eligibility.verdict = 'conditionally_eligible';
    eligibility.explanation = 'Brief-ul conține atât produse eligibile cât și produse neeligibile. Recomandăm focusarea pe componentele eligibile și propunerea de alternative.';
    eligibility.confidence_score = 0.75;
  }

  return {
    products: detectedProducts,
    purpose,
    audience,
    department,
    tone,
    eligibility,
    detected_intents: intents,
  };
}

export function calculateOpportunity(
  employeeCount: number,
  disabledEmployees: number,
  minWage: number
) {
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

export function getRecommendedProducts(purpose: string, _department: string) {
  return seedProducts.filter(p => {
    const suitable = p.suitable_for_json.map(s => s.toLowerCase());
    const purposeLower = purpose.toLowerCase();
    return suitable.some(s => purposeLower.includes(s) || s.includes(purposeLower.split(' ')[0]));
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

export { AUTHORIZED_CAEN, PURPOSE_LABELS };
