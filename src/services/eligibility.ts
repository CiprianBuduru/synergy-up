// ─── Eligibility Engine Service ──────────────────────────────────────
// Core eligibility logic — checks products/requests against CAEN codes & internal operations.

import type { EligibilityResult } from '@/types';
import { seedProducts, seedAlternatives } from '@/data/seed';

// ═══════════ AUTHORIZED CAEN CODES ═══════════
export const AUTHORIZED_CAEN: Record<string, string> = {
  '7311': 'Activități ale agențiilor de publicitate',
  '1812': 'Alte activități de tipărire n.c.a.',
  '1814': 'Legătorie și servicii conexe',
  '1723': 'Fabricarea articolelor de papetărie',
};

// ═══════════ INTERNAL OPERATIONS MAP ═══════════
export const OPERATIONS_CAEN: Record<string, string[]> = {
  'personalizare': ['7311'],
  'branding': ['7311'],
  'tipărire': ['1812'],
  'legătorie': ['1814'],
  'papetărie': ['1723'],
  'ambalare / kituire': ['1812', '7311'],
  'montaj materiale promo': ['7311'],
  'pregătire materiale promoționale': ['7311'],
};

// ═══════════ PRODUCT RULES ═══════════
interface ProductRule {
  keywords: string[];
  operations: string[];
  caen: string[];
  baseEligible: boolean;
  logic: string;
}

const productRules: ProductRule[] = [
  { keywords: ['tricou', 'tricouri', 'polo', 'hanorac', 'vestă', 'veste', 'șapcă', 'șepci', 'bandană', 'textile'], operations: ['personalizare', 'branding'], caen: ['7311'], baseEligible: true, logic: 'Textilele sunt achiziționate ca materie primă, personalizarea (serigrafie/broderie/transfer termic) se realizează intern.' },
  { keywords: ['flyere', 'flyer', 'broșur', 'catalog', 'poster', 'afiș', 'banner', 'etiche', 'sticker', 'card vizită', 'invitați', 'certificat', 'diplomă', 'print', 'tipărit'], operations: ['tipărire', 'montaj materiale promo'], caen: ['1812', '7311'], baseEligible: true, logic: 'Materialele print sunt tipărite integral intern pe echipamentele proprii.' },
  { keywords: ['agend', 'blocnotes', 'mapă', 'mape', 'papetărie', 'plic', 'dosar', 'registru', 'caiet', 'carnețel'], operations: ['papetărie', 'legătorie'], caen: ['1723', '1814'], baseEligible: true, logic: 'Articolele de papetărie sunt fabricate intern, cu legătorie realizată în atelierul propriu.' },
  { keywords: ['pix', 'pixuri', 'stilou', 'creion', 'marker', 'instrumente de scris'], operations: ['branding', 'personalizare'], caen: ['7311'], baseEligible: true, logic: 'Instrumentele de scris sunt achiziționate și branduite/gravate intern.' },
  { keywords: ['cană', 'căni', 'pahar', 'pahare', 'sticlă', 'termos', 'ceramică'], operations: ['personalizare', 'branding'], caen: ['7311'], baseEligible: true, logic: 'Produsele ceramice/sticlă sunt achiziționate și personalizate intern (sublimare/gravură).' },
  { keywords: ['geantă', 'rucsac', 'sacoș', 'husă', 'portofel', 'borseta', 'lanyard', 'badge', 'ecuson'], operations: ['personalizare', 'branding'], caen: ['7311'], baseEligible: true, logic: 'Accesoriile sunt achiziționate ca bază, personalizarea se realizează intern.' },
  { keywords: ['mousepad', 'suport telefon', 'hub usb', 'stick usb', 'powerbank', 'cablu personalizat', 'webcam cover', 'port card'], operations: ['branding', 'personalizare', 'ambalare / kituire'], caen: ['7311'], baseEligible: true, logic: 'Accesoriile IT promo sunt achiziționate și branduite/personalizate intern.' },
  { keywords: ['roll-up', 'rollup', 'display', 'totem', 'stand expo', 'panou', 'backdrop'], operations: ['tipărire', 'montaj materiale promo'], caen: ['1812', '7311'], baseEligible: true, logic: 'Materialele expoziționale sunt tipărite și montate/asamblate intern.' },
  { keywords: ['eco', 'reciclat', 'bambus', 'plută', 'bumbac organic', 'biodegradabil'], operations: ['personalizare', 'branding'], caen: ['7311'], baseEligible: true, logic: 'Produsele eco sunt achiziționate ca bază sustenabilă, personalizarea se realizează intern.' },
  { keywords: ['calendar', 'planner'], operations: ['tipărire', 'legătorie', 'papetărie'], caen: ['1812', '1814', '1723'], baseEligible: true, logic: 'Calendarele sunt tipărite și legate intern, cu design și producție proprie.' },
  { keywords: ['kit', 'pachet', 'set cadou', 'welcome kit', 'onboarding kit', 'gift box'], operations: ['ambalare / kituire', 'branding', 'pregătire materiale promoționale'], caen: ['7311', '1812'], baseEligible: true, logic: 'Kiturile sunt compuse, ambalate și branduite integral intern din produse eligibile.' },
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

// ═══════════ CORE ENGINE ═══════════

export function checkEligibility(productOrRequest: string): EligibilityResult {
  const lower = productOrRequest.toLowerCase();

  // 1. Not eligible
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

  // 2. Eligible via rules
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

  // 3. Products library match
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

  // 4. Alternatives from seed
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
    explanation: 'Produsul ar putea fi eligibil dacă include operațiuni realizate intern (personalizare, tipărire, ambalare, legătorie). Este necesară o analiză suplimentară.',
    internal_operation_used: ['De determinat'],
    supporting_caen_codes: ['De determinat'],
    converted_intent: '',
    alternative_products: [],
    alternative_kits: ['Onboarding Starter Kit', 'Branded Print Kit'],
    sales_angle: 'Recomandăm o discuție pentru a identifica componenta eligibilă.',
    confidence_score: 0.5,
  };
}

// Re-export rules for use in brief-analyzer
export { productRules, notEligibleRules };
