// ─── Email Brief Parser Service ──────────────────────────────────────
// Transforms raw email text into a structured brief ready for analysis.

import { analyzeBriefWithRules } from './briefRulesEngine';
import type { BriefRuleMatch } from '@/types/brief-rule';

// ═══════════ TYPES ═══════════

export type RequestType =
  | 'exploratory'
  | 'procurement'
  | 'pricing_request'
  | 'presentation_request'
  | 'documents_request'
  | 'mixed_request';

export type RequestedDocument =
  | 'up_authorization'
  | 'disability_involvement_proof'
  | 'legal_support_docs'
  | 'eligibility_docs';

export type SuggestedPresentationType =
  | 'general_exploratory'
  | 'procurement_focused'
  | 'office_supplies_conversion'
  | 'onboarding_alternatives';

export type SuggestedEmailResponseType =
  | 'intro_response'
  | 'procurement_response'
  | 'docs_plus_presentation_response'
  | 'pricing_followup_response';

export interface ParsedEmailBrief {
  // Company
  company_name: string | null;
  contact_name: string | null;
  contact_role: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  industry_hint: string | null;
  location_hint: string | null;

  // Request
  requested_items: string[];
  requested_categories: string[];
  request_type: RequestType;
  primary_request_type: RequestType;
  secondary_request_types: RequestType[];
  requested_documents: RequestedDocument[];
  requested_non_product_requests: string[];

  // Flags
  asks_for_price: boolean;
  asks_for_presentation: boolean;
  asks_for_product_list: boolean;
  asks_for_delivery_terms: boolean;
  asks_for_minimum_order: boolean;
  mentions_unitate_protejata: boolean;
  mentions_fond_handicap: boolean;

  // Response prep
  suggested_presentation_type: SuggestedPresentationType;
  suggested_email_response_type: SuggestedEmailResponseType;
  short_response_summary: string;

  // Rules engine results
  brief_rules_matches: BriefRuleMatch[];
  recommended_products: string[];
  recommended_kits: string[];
  pitch_lines: string[];

  // Meta
  notes: string;
  raw_email_body: string;
  cleaned_body: string;
  signature_block: string | null;
}

// ═══════════ NORMALIZATION ═══════════

const DIACRITICS: Record<string, string> = {
  'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ş': 's', 'ț': 't', 'ţ': 't',
  'Ă': 'a', 'Â': 'a', 'Î': 'i', 'Ș': 's', 'Ş': 's', 'Ț': 't', 'Ţ': 't',
};

function normalize(text: string): string {
  return text.toLowerCase().split('').map(c => DIACRITICS[c] || c).join('').replace(/[^a-z0-9\s@.-]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ═══════════ SIGNATURE DETECTION ═══════════

const SIG_MARKERS = [
  /^--\s*$/m,
  /^_{3,}/m,
  /^cu\s+stima/im,
  /^cu\s+respect/im,
  /^best\s+regards/im,
  /^kind\s+regards/im,
  /^regards/im,
  /^multumesc/im,
  /^mulțumesc/im,
  /^va\s+multumesc/im,
  /^sent\s+from/im,
  /^trimis\s+de\s+pe/im,
];

function splitSignature(raw: string): { body: string; signature: string | null } {
  const lines = raw.split('\n');
  let sigStart = -1;

  // Try explicit markers
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 15); i--) {
    for (const marker of SIG_MARKERS) {
      if (marker.test(lines[i].trim())) {
        sigStart = i;
        break;
      }
    }
    if (sigStart >= 0) break;
  }

  // Heuristic: last block with phone/email patterns in last 8 lines
  if (sigStart < 0) {
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 8); i--) {
      const l = lines[i];
      if (/(\+?\d[\d\s\-.]{7,}|[\w.+-]+@[\w.-]+\.\w{2,})/.test(l) && l.length < 80) {
        sigStart = i;
      }
    }
  }

  if (sigStart >= 0 && sigStart > lines.length * 0.3) {
    return {
      body: lines.slice(0, sigStart).join('\n').trim(),
      signature: lines.slice(sigStart).join('\n').trim(),
    };
  }
  return { body: raw.trim(), signature: null };
}

// ═══════════ CONTACT EXTRACTION ═══════════

function extractContact(raw: string, signature: string | null) {
  const text = raw;
  const sigText = signature || '';
  const combined = text + '\n' + sigText;

  const emailMatch = combined.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  const phoneMatch = combined.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);
  
  // Company name: look for common patterns
  let companyName: string | null = null;
  const companyPatterns = [
    /(?:compania|firma|societatea|sc|s\.c\.)\s+([A-ZÀ-Ž][\w\s&.,-]{2,40}?)(?:\s+s\.?r\.?l\.?|\s+s\.?a\.?|\s+s\.?r\.?l|\s*$)/im,
    /(?:din\s+partea|behalf\s+of|represent[aă]m)\s+(?:companiei\s+)?([A-ZÀ-Ž][\w\s&.,-]{2,40}?)(?:\s+s\.?r\.?l\.?|\s+s\.?a\.?|\s*[,.])/im,
  ];
  for (const pat of companyPatterns) {
    const m = combined.match(pat);
    if (m) { companyName = m[1].trim(); break; }
  }

  // Contact name from signature (first line that looks like a name)
  let contactName: string | null = null;
  let contactRole: string | null = null;
  if (sigText) {
    const sigLines = sigText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of sigLines.slice(0, 4)) {
      if (line.length < 40 && /^[A-ZÀ-Ž][a-zà-ž]+\s+[A-ZÀ-Ž]/.test(line) && !/@/.test(line) && !/\d{3}/.test(line)) {
        contactName = line;
        break;
      }
    }
    // Role: look for common titles
    const rolePats = /(?:director|manager|specialist|coordonator|responsabil|sef|șef|achizi[tț]ii|procurement|hr|marketing|admin)/i;
    for (const line of sigLines.slice(0, 5)) {
      if (rolePats.test(line) && line.length < 60) {
        contactRole = line;
        break;
      }
    }
  }

  // Location hints
  let locationHint: string | null = null;
  const locMatch = combined.match(/(?:bucuresti|bucureşti|bucureș|cluj|timisoara|timișoara|iasi|iași|constanta|constanța|brasov|brașov|sibiu|oradea|craiova|galati|galați|ploiesti|ploiești)/i);
  if (locMatch) locationHint = locMatch[0];

  // Industry hints
  let industryHint: string | null = null;
  const indPatterns: [RegExp, string][] = [
    [/(?:energie|energy|petrol|gaz)/i, 'Energy'],
    [/(?:retail|magazin|supermarket|hipermarket)/i, 'Retail'],
    [/(?:it[&\s]|software|tech|digital)/i, 'IT & Technology'],
    [/(?:banc[aă]|financiar|asigur)/i, 'Financial Services'],
    [/(?:farma|pharma|medic|sănătate|sanatate)/i, 'Pharma & Healthcare'],
    [/(?:logistic[aă]|transport|curier)/i, 'Logistics'],
    [/(?:construc[tț]|imobiliar)/i, 'Construction'],
    [/(?:horeca|restaurant|hotel|catering)/i, 'HoReCa'],
    [/(?:telecom|comunica[tț])/i, 'Telecom'],
    [/(?:auto|automotive|dealer)/i, 'Automotive'],
  ];
  for (const [pat, label] of indPatterns) {
    if (pat.test(combined)) { industryHint = label; break; }
  }

  return {
    company_name: companyName,
    contact_name: contactName,
    contact_role: contactRole,
    contact_email: emailMatch?.[0] || null,
    contact_phone: phoneMatch?.[0] || null,
    industry_hint: industryHint,
    location_hint: locationHint,
  };
}

// ═══════════ ITEM EXTRACTION ═══════════

const KNOWN_ITEMS = [
  'hartie copiator', 'hartie xerox', 'hartie imprimanta', 'hartie a4', 'hartie office',
  'dosare', 'mape', 'foldere', 'bibliorafturi', 'biblioraft',
  'pixuri', 'pix', 'stilou', 'instrumente de scris',
  'markere', 'marker',
  'agende', 'agenda', 'blocnotes', 'bloc notes', 'caiete', 'caiet',
  'flyere', 'pliante', 'fluturasi', 'brosuri', 'brosura',
  'cataloage', 'catalog', 'carti de vizita',
  'roll-up', 'rollup', 'bannere', 'banner',
  'tricouri', 'tricou', 'sorturi', 'sort',
  'cani', 'cana', 'powerbank', 'power bank', 'mousepad',
  'laptopuri', 'laptop', 'mobilier',
  'papetarie', 'articole de papetarie', 'materiale papetarie',
  'materiale print', 'materiale promo', 'produse promotionale',
  'produse promo', 'textile', 'semnalistica',
  'stickere', 'etichete', 'plicuri', 'calendare', 'umbrele', 'rucsaci', 'genti',
  'ecusoane', 'badge', 'lanyard', 'sepci', 'pahare', 'termos',
];

const NON_PRODUCT_ITEMS = [
  { keywords: ['prezentare', 'presentation'], label: 'prezentare' },
  { keywords: ['lista produse', 'lista articole', 'lista servicii', 'product list'], label: 'lista produse' },
  { keywords: ['documente justificative', 'dovada', 'autorizatie', 'autorizație', 'certificat'], label: 'documente justificative' },
  { keywords: ['termen de livrare', 'termen livrare', 'delivery'], label: 'termen de livrare' },
  { keywords: ['comanda minima', 'comandă minimă', 'minimum order', 'minim comanda'], label: 'comanda minima' },
  { keywords: ['oferta de pret', 'ofertă de preț', 'oferta pret', 'pricing', 'cotatie'], label: 'oferta de pret' },
];

function extractItems(normalizedText: string): { items: string[]; nonProduct: string[]; categories: string[] } {
  const items: string[] = [];
  const categories: string[] = [];
  
  for (const item of KNOWN_ITEMS) {
    const normItem = item.replace(/[ăâ]/g, 'a').replace(/[îÎ]/g, 'i').replace(/[șşȘŞ]/g, 's').replace(/[țţȚŢ]/g, 't');
    if (normalizedText.includes(normItem)) {
      items.push(item);
      // Categorize
      if (['papetarie', 'articole de papetarie', 'materiale papetarie'].includes(item)) categories.push('papetarie');
      else if (['materiale print', 'flyere', 'pliante', 'brosuri', 'cataloage', 'carti de vizita'].includes(item)) categories.push('print');
      else if (['produse promo', 'produse promotionale', 'materiale promo', 'cani', 'tricouri', 'powerbank'].includes(item)) categories.push('promo');
      else if (['textile', 'tricouri', 'sorturi'].includes(item)) categories.push('textile');
    }
  }

  const nonProduct: string[] = [];
  for (const np of NON_PRODUCT_ITEMS) {
    if (np.keywords.some(kw => normalizedText.includes(kw.replace(/[ăâ]/g, 'a').replace(/[îÎ]/g, 'i').replace(/[șşȘŞ]/g, 's').replace(/[țţȚŢ]/g, 't')))) {
      nonProduct.push(np.label);
    }
  }

  return { items: [...new Set(items)], nonProduct: [...new Set(nonProduct)], categories: [...new Set(categories)] };
}

// ═══════════ FLAGS ═══════════

function detectFlags(norm: string) {
  return {
    asks_for_price: /oferta\s+de\s+pret|pret|pricing|cotatie|tarif/.test(norm),
    asks_for_presentation: /prezentare|presentation/.test(norm),
    asks_for_product_list: /lista\s+(de\s+)?(produse|articole|servicii)|product\s+list/.test(norm),
    asks_for_delivery_terms: /termen\s+(de\s+)?livrare|delivery/.test(norm),
    asks_for_minimum_order: /comanda\s+minima|minimum\s+order|minim\s+comanda/.test(norm),
    mentions_unitate_protejata: /unitate\s+protejata|unitatea\s+protejata|u\.?p\.?\b/.test(norm),
    mentions_fond_handicap: /fond\s+(de\s+)?handicap|fond\s+dizabilit/.test(norm),
  };
}

// ═══════════ REQUEST TYPE CLASSIFICATION ═══════════

function classifyRequestType(norm: string, flags: ReturnType<typeof detectFlags>, nonProduct: string[]): { primary: RequestType; secondary: RequestType[] } {
  const types: RequestType[] = [];

  if (flags.asks_for_price || /oferta|cotatie/.test(norm)) types.push('pricing_request');
  if (flags.asks_for_presentation || /prezentare/.test(norm)) types.push('presentation_request');
  if (nonProduct.includes('documente justificative') || /autorizatie|certificat|dovada/.test(norm)) types.push('documents_request');
  if (/achizitie|achizitii|procurement|comanda|furniz/.test(norm)) types.push('procurement');
  if (/informatii|informații|detalii|explorar|interes/.test(norm)) types.push('exploratory');

  if (types.length === 0) types.push('exploratory');
  const primary = types.length > 1 ? 'mixed_request' : types[0];
  return { primary, secondary: types.filter(t => t !== primary) };
}

// ═══════════ DOCUMENT REQUEST DETECTION ═══════════

function detectRequestedDocuments(norm: string): RequestedDocument[] {
  const docs: RequestedDocument[] = [];
  if (/autorizatie\s*(up|unitate\s*protejata)|autorizatia/.test(norm)) docs.push('up_authorization');
  if (/dovada\s*(implicar|persoan|dizabilit)|certificat\s*dizabilit/.test(norm)) docs.push('disability_involvement_proof');
  if (/documente\s*(justificative|legale|suport)|documentatie\s+legala/.test(norm)) docs.push('legal_support_docs');
  if (/eligibilit|documente\s+eligibil/.test(norm)) docs.push('eligibility_docs');
  return docs;
}

// ═══════════ RESPONSE PREPARATION ═══════════

function suggestPresentationType(primary: RequestType, items: string[]): SuggestedPresentationType {
  const hasOfficeItems = items.some(i => ['hartie copiator', 'dosare', 'bibliorafturi', 'pixuri', 'markere', 'papetarie'].includes(i));
  if (hasOfficeItems) return 'office_supplies_conversion';
  if (primary === 'procurement') return 'procurement_focused';
  if (items.some(i => ['tricouri', 'agende', 'cani'].includes(i))) return 'onboarding_alternatives';
  return 'general_exploratory';
}

function suggestEmailResponseType(primary: RequestType, docs: RequestedDocument[]): SuggestedEmailResponseType {
  if (docs.length > 0 && primary !== 'pricing_request') return 'docs_plus_presentation_response';
  if (primary === 'pricing_request' || primary === 'procurement') return 'pricing_followup_response';
  if (primary === 'procurement') return 'procurement_response';
  return 'intro_response';
}

function buildSummary(contact: ReturnType<typeof extractContact>, items: string[], primary: RequestType): string {
  const companyPart = contact.company_name ? `de la ${contact.company_name}` : '';
  const itemsPart = items.length > 0 ? `Solicită: ${items.slice(0, 5).join(', ')}${items.length > 5 ? ` (+${items.length - 5})` : ''}. ` : '';
  const typePart: Record<RequestType, string> = {
    exploratory: 'Email exploratoriu',
    procurement: 'Cerere de achiziție',
    pricing_request: 'Cerere ofertă de preț',
    presentation_request: 'Cerere de prezentare',
    documents_request: 'Cerere documente',
    mixed_request: 'Cerere mixtă',
  };
  return `${typePart[primary]} ${companyPart}. ${itemsPart}`.trim();
}

// ═══════════ MAIN API ═══════════

export function parseEmailBrief(rawEmail: string): ParsedEmailBrief {
  const { body, signature } = splitSignature(rawEmail);
  const norm = normalize(body);
  const contact = extractContact(rawEmail, signature);
  const { items, nonProduct, categories } = extractItems(norm);
  const flags = detectFlags(norm);
  const { primary, secondary } = classifyRequestType(norm, flags, nonProduct);
  const docs = detectRequestedDocuments(norm);

  // Run through Brief Rules Engine
  const rulesResult = analyzeBriefWithRules(body);

  return {
    ...contact,
    requested_items: items,
    requested_categories: categories,
    request_type: primary,
    primary_request_type: primary,
    secondary_request_types: secondary,
    requested_documents: docs,
    requested_non_product_requests: nonProduct,
    ...flags,
    suggested_presentation_type: suggestPresentationType(primary, items),
    suggested_email_response_type: suggestEmailResponseType(primary, docs),
    short_response_summary: buildSummary(contact, items, primary),
    brief_rules_matches: rulesResult.matches,
    recommended_products: rulesResult.recommended_products,
    recommended_kits: rulesResult.recommended_kits,
    pitch_lines: rulesResult.pitch_lines,
    notes: '',
    raw_email_body: rawEmail,
    cleaned_body: body,
    signature_block: signature,
  };
}

// Labels
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  exploratory: 'Exploratoriu',
  procurement: 'Achiziție',
  pricing_request: 'Cerere de preț',
  presentation_request: 'Cerere prezentare',
  documents_request: 'Cerere documente',
  mixed_request: 'Cerere mixtă',
};

export const DOCUMENT_LABELS: Record<RequestedDocument, string> = {
  up_authorization: 'Autorizație Unitate Protejată',
  disability_involvement_proof: 'Dovada implicării persoanelor cu dizabilități',
  legal_support_docs: 'Documente suport legale',
  eligibility_docs: 'Documente eligibilitate',
};

export const PRESENTATION_TYPE_LABELS: Record<SuggestedPresentationType, string> = {
  general_exploratory: 'Prezentare generală exploratorie',
  procurement_focused: 'Prezentare focusată pe achiziții',
  office_supplies_conversion: 'Prezentare conversie papetărie → soluții eligibile',
  onboarding_alternatives: 'Prezentare alternative onboarding',
};

export const EMAIL_RESPONSE_TYPE_LABELS: Record<SuggestedEmailResponseType, string> = {
  intro_response: 'Răspuns introductiv',
  procurement_response: 'Răspuns achiziții',
  docs_plus_presentation_response: 'Documente + Prezentare',
  pricing_followup_response: 'Follow-up ofertă de preț',
};
