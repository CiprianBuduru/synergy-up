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
  return text.toLowerCase().split('').map(c => DIACRITICS[c] || c).join('').replace(/[^a-z0-9\s@.\-]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ═══════════ LIST / BULLET EXTRACTION ═══════════

/**
 * Extracts individual line items from text that uses bullets, dashes,
 * numbered lists, or comma/semicolon-separated enumerations.
 * Returns cleaned individual items.
 */
function extractListItems(text: string): string[] {
  const items: string[] = [];
  const lines = text.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect bullet / dash / numbered list items
    // Patterns: "- item", "• item", "· item", "* item", "1. item", "1) item", "— item", "– item"
    const bulletMatch = line.match(/^(?:[-–—•·*]\s*|\d+[.)]\s*)(.+)$/);
    if (bulletMatch) {
      // The bullet content might itself contain commas for sub-items
      const content = bulletMatch[1].trim();
      const subItems = splitByCommasAndSemicolons(content);
      items.push(...subItems);
      continue;
    }

    // For non-bullet lines, try to split by commas / semicolons if they look like a list
    const commaCount = (line.match(/[,;]/g) || []).length;
    if (commaCount >= 1) {
      const subItems = splitByCommasAndSemicolons(line);
      if (subItems.length >= 2) {
        items.push(...subItems);
        continue;
      }
    }

    // Otherwise keep the whole line as a potential item
    items.push(line);
  }

  return items.map(i => i.replace(/^[\s,;.]+|[\s,;.]+$/g, '').trim()).filter(i => i.length > 1);
}

function splitByCommasAndSemicolons(text: string): string[] {
  return text
    .split(/\s*[,;]\s*|\s+si\s+|\s+și\s+|\s+and\s+/i)
    .map(s => s.trim())
    .filter(s => s.length > 1);
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
  /^vă\s+mulțumesc/im,
  /^sent\s+from/im,
  /^trimis\s+de\s+pe/im,
  /^cordial/im,
  /^toate\s+cele\s+bune/im,
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
  const sigText = signature || '';
  const combined = raw + '\n' + sigText;

  const emailMatch = combined.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  const phoneMatch = combined.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);

  // Company name: look for common patterns
  let companyName: string | null = null;
  const companyPatterns = [
    /(?:compania|firma|societatea|sc|s\.c\.)\s+([A-ZÀ-Ž][\w\s&.,-]{2,40}?)(?:\s+s\.?r\.?l\.?|\s+s\.?a\.?|\s+s\.?r\.?l|\s*$)/im,
    /(?:din\s+partea|behalf\s+of|represent[aă]m)\s+(?:companiei\s+)?([A-ZÀ-Ž][\w\s&.,-]{2,40}?)(?:\s+s\.?r\.?l\.?|\s+s\.?a\.?|\s*[,.])/im,
    /(?:de\s+la)\s+([A-ZÀ-Ž][\w\s&.,-]{2,40}?)(?:\s+(?:si|și|iar|\.|\,))/im,
    /([A-ZÀ-Ž][\w\s&]{2,30}?)\s+s\.?r\.?l\.?/im,
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
    const rolePats = /(?:director|manager|specialist|coordonator|responsabil|sef|șef|achizi[tț]ii|procurement|hr|marketing|admin|departament|birou)/i;
    for (const line of sigLines.slice(0, 5)) {
      if (rolePats.test(line) && line.length < 60) {
        contactRole = line;
        break;
      }
    }
  }

  // Location hints
  let locationHint: string | null = null;
  const locMatch = combined.match(/(?:bucuresti|bucureşti|bucurești|cluj|timisoara|timișoara|iasi|iași|constanta|constanța|brasov|brașov|sibiu|oradea|craiova|galati|galați|ploiesti|ploiești|pitesti|pitești|targu\s*mures|baia\s*mare|suceava|bacau|buzau|arad|deva|alba\s*iulia)/i);
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
    [/(?:productie|producție|manufactur)/i, 'Manufacturing'],
    [/(?:agricol|agri|ferma|fermă)/i, 'Agriculture'],
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

/** Multi-word known product terms for matching (normalized, no diacritics) */
const KNOWN_ITEMS_MULTI: string[] = [
  'hartie copiator', 'hartie xerox', 'hartie imprimanta', 'hartie a4', 'hartie office', 'hartie printare',
  'dosare documente', 'dosare plastic', 'dosare carton',
  'instrumente de scris', 'set pixuri', 'set markere',
  'articole de papetarie', 'materiale papetarie', 'articole papetarie',
  'materiale print', 'materiale promo', 'produse promotionale', 'produse promo',
  'materiale de prezentare', 'materiale tiparite', 'materiale vizuale',
  'textile personalizate',
  'carti de vizita', 'carte vizita',
  'bloc notes', 'bloc de notite',
  'power bank', 'baterie externa',
  'mouse pad',
  'roll-up', 'banner rollup', 'display rollup',
  'dosar arhivare', 'dosare arhivare',
];

const KNOWN_ITEMS_SINGLE: string[] = [
  'dosare', 'mape', 'foldere', 'bibliorafturi', 'biblioraft',
  'pixuri', 'pix', 'stilou',
  'markere', 'marker',
  'agende', 'agenda', 'blocnotes', 'caiete', 'caiet',
  'flyere', 'pliante', 'fluturasi', 'brosuri', 'brosura',
  'cataloage', 'catalog',
  'rollup', 'bannere', 'banner',
  'tricouri', 'tricou', 'sorturi', 'sort',
  'cani', 'cana', 'powerbank', 'mousepad',
  'laptopuri', 'laptop', 'mobilier',
  'papetarie', 'semnalistica',
  'stickere', 'etichete', 'plicuri', 'calendare', 'umbrele', 'rucsaci', 'genti',
  'ecusoane', 'badge', 'lanyard', 'sepci', 'pahare', 'termos', 'termosuri',
  'carnete', 'carnet', 'notite', 'post-it',
];

const NON_PRODUCT_PATTERNS: { patterns: RegExp[]; label: string }[] = [
  { patterns: [/prezentare/, /presentation/], label: 'prezentare' },
  { patterns: [/lista\s+(de\s+)?(produse|articole|servicii)/, /product\s+list/, /lista\s+completa/], label: 'lista produse' },
  { patterns: [/documente\s+justificative/, /dovada/, /autorizatie/, /autorizație/, /certificat/, /acte\s+legale/], label: 'documente justificative' },
  { patterns: [/termen\s+(de\s+)?livrare/, /delivery\s+time/, /cand\s+puteti\s+livra/, /timp\s+livrare/], label: 'termen de livrare' },
  { patterns: [/comanda\s+minima/, /comandă\s+minimă/, /minimum\s+order/, /minim\s+comanda/, /cantitate\s+minima/], label: 'comanda minima' },
  { patterns: [/oferta\s+(de\s+)?pret/, /ofertă\s+(de\s+)?preț/, /cotatie/, /tarif/, /pricing/, /cost/, /buget/], label: 'oferta de pret' },
  { patterns: [/contract/, /acord\s+cadru/, /acord-cadru/], label: 'contract / acord cadru' },
  { patterns: [/factura\s+proforma/, /proforma/], label: 'factura proforma' },
  { patterns: [/mostre/, /sample/, /mostra/], label: 'mostre' },
];

function extractItems(body: string, normalizedFull: string): { items: string[]; nonProduct: string[]; categories: string[] } {
  const items = new Set<string>();
  const categories = new Set<string>();

  // 1. Extract list items (bullets, dashes, numbered) from original body
  const listItems = extractListItems(body);
  const allTerms = [
    ...listItems.map(normalize),
    normalizedFull,
  ];

  // 2. Multi-word matching first (longer matches take priority)
  for (const term of allTerms) {
    for (const known of KNOWN_ITEMS_MULTI) {
      const normKnown = normalize(known);
      if (term.includes(normKnown)) {
        items.add(known);
      }
    }
  }

  // 3. Single-word matching
  for (const term of allTerms) {
    for (const known of KNOWN_ITEMS_SINGLE) {
      const normKnown = normalize(known);
      // Use word boundary-like check to avoid false positives
      const regex = new RegExp(`(?:^|\\s)${escapeRegex(normKnown)}(?:\\s|$)`);
      if (regex.test(` ${term} `)) {
        items.add(known);
      }
    }
  }

  // 4. Categorize
  const itemArr = [...items];
  for (const item of itemArr) {
    const ni = normalize(item);
    if (/papetarie|dosare|biblioraft|hartie|pix|marker|agenda|blocnotes|caiet|mape|carnete|notite/.test(ni)) categories.add('papetarie');
    if (/flyere|pliante|brosuri|cataloage|carti de vizita|materiale print|materiale tiparite/.test(ni)) categories.add('print');
    if (/promo|cani|tricouri|powerbank|mousepad|umbrele|rucsaci|sepci|pahare|termos/.test(ni)) categories.add('promo');
    if (/textile|tricouri|sorturi/.test(ni)) categories.add('textile');
    if (/roll-up|rollup|bannere|banner|semnalistica/.test(ni)) categories.add('semnalistica');
  }

  // 5. Non-product requests
  const nonProduct = new Set<string>();
  for (const np of NON_PRODUCT_PATTERNS) {
    if (np.patterns.some(pat => pat.test(normalizedFull))) {
      nonProduct.add(np.label);
    }
    // Also check extracted list items
    for (const term of allTerms) {
      if (np.patterns.some(pat => pat.test(term))) {
        nonProduct.add(np.label);
      }
    }
  }

  return {
    items: itemArr,
    nonProduct: [...nonProduct],
    categories: [...categories],
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════ FLAGS ═══════════

function detectFlags(norm: string) {
  return {
    asks_for_price: /oferta\s+(de\s+)?pret|pret|pricing|cotatie|tarif|cost|buget/.test(norm),
    asks_for_presentation: /prezentare|presentation/.test(norm),
    asks_for_product_list: /lista\s+(de\s+)?(produse|articole|servicii)|product\s+list|lista\s+completa/.test(norm),
    asks_for_delivery_terms: /termen\s+(de\s+)?livrare|delivery|cand\s+puteti\s+livra/.test(norm),
    asks_for_minimum_order: /comanda\s+minima|minimum\s+order|minim\s+comanda|cantitate\s+minima/.test(norm),
    mentions_unitate_protejata: /unitate\s+protejata|unitatea\s+protejata|u\.?p\.?\b/.test(norm),
    mentions_fond_handicap: /fond\s+(de\s+)?handicap|fond\s+dizabilit/.test(norm),
  };
}

// ═══════════ REQUEST TYPE CLASSIFICATION ═══════════

function classifyRequestType(norm: string, flags: ReturnType<typeof detectFlags>, nonProduct: string[], items: string[]): { primary: RequestType; secondary: RequestType[] } {
  const types: RequestType[] = [];

  // Detect exploratory signals FIRST
  const exploratorySignals = /informatii|informații|detalii|explorar|interes|curios|doresc\s+sa\s+aflu|ce\s+servicii|ce\s+produse|ce\s+putem|ce\s+pot\s+fi|orice\s+informatie|trimite.*informatii|trimite.*prezentare|as\s+fi\s+interesat|sa\s+primesc/.test(norm);
  const hasFondHandicap = /fond\s+(de\s+)?handicap|fond\s+dizabilit|unitate\s+protejata/.test(norm);

  if (flags.asks_for_price || nonProduct.includes('oferta de pret')) types.push('pricing_request');
  if (flags.asks_for_presentation || nonProduct.includes('prezentare')) types.push('presentation_request');
  if (nonProduct.includes('documente justificative') || /autorizatie|certificat|dovada|acte\s+legale/.test(norm)) types.push('documents_request');
  if (/achizitie|achizitii|procurement|comanda|furniz|aprovizion/.test(norm)) types.push('procurement');
  if (exploratorySignals) types.push('exploratory');

  // Remove duplicates
  const uniqueTypes = [...new Set(types)];

  if (uniqueTypes.length === 0) uniqueTypes.push('exploratory');

  // KEY FIX: If no concrete product items were found AND exploratory signals exist,
  // force exploratory as primary even if other types are present
  const isExploratoryEmail = items.length === 0 && (exploratorySignals || hasFondHandicap);

  if (isExploratoryEmail) {
    const secondary = uniqueTypes.filter(t => t !== 'exploratory');
    return { primary: 'exploratory', secondary };
  }

  // If multiple distinct types detected → mixed
  const primary: RequestType = uniqueTypes.length > 1 ? 'mixed_request' : uniqueTypes[0];
  const secondary = uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes.filter(t => t !== primary);

  return { primary, secondary };
}

// ═══════════ DOCUMENT REQUEST DETECTION ═══════════

function detectRequestedDocuments(norm: string): RequestedDocument[] {
  const docs: RequestedDocument[] = [];
  if (/autorizatie\s*(up|unitate\s*protejata)|autorizatia|statut\s*(de\s*)?unitate/.test(norm)) docs.push('up_authorization');
  if (/dovada\s*(implicar|persoan|dizabilit)|certificat\s*dizabilit|angajati\s+cu\s+dizabilit/.test(norm)) docs.push('disability_involvement_proof');
  if (/documente\s*(justificative|legale|suport)|documentatie\s+(legala|necesara)|acte\s+legale/.test(norm)) docs.push('legal_support_docs');
  if (/eligibilit|documente\s+eligibil|dovada\s+eligibil/.test(norm)) docs.push('eligibility_docs');
  return docs;
}

// ═══════════ RESPONSE PREPARATION ═══════════

const OFFICE_ITEMS_FOR_CONVERSION = ['hartie copiator', 'hartie xerox', 'hartie imprimanta', 'hartie a4', 'hartie office', 'dosare', 'bibliorafturi', 'biblioraft', 'pixuri', 'pix', 'markere', 'marker', 'papetarie', 'articole de papetarie', 'materiale papetarie'];

function suggestPresentationType(primary: RequestType, items: string[]): SuggestedPresentationType {
  const normItems = items.map(normalize);
  const hasOfficeItems = normItems.some(i => OFFICE_ITEMS_FOR_CONVERSION.map(normalize).some(oi => i.includes(oi)));
  if (hasOfficeItems) return 'office_supplies_conversion';
  if (primary === 'procurement') return 'procurement_focused';
  if (normItems.some(i => /tricouri|agende|cani|onboarding|welcome/.test(i))) return 'onboarding_alternatives';
  return 'general_exploratory';
}

function suggestEmailResponseType(primary: RequestType, docs: RequestedDocument[], flags: ReturnType<typeof detectFlags>): SuggestedEmailResponseType {
  if (docs.length > 0 && (primary === 'documents_request' || primary === 'mixed_request')) return 'docs_plus_presentation_response';
  if (flags.asks_for_price || primary === 'pricing_request') return 'pricing_followup_response';
  if (primary === 'procurement') return 'procurement_response';
  return 'intro_response';
}

function buildSummary(contact: ReturnType<typeof extractContact>, items: string[], nonProduct: string[], primary: RequestType, secondary: RequestType[]): string {
  const companyPart = contact.company_name ? `de la ${contact.company_name}` : '';
  const itemsPart = items.length > 0 ? `Produse: ${items.slice(0, 5).join(', ')}${items.length > 5 ? ` (+${items.length - 5})` : ''}. ` : '';
  const nonProdPart = nonProduct.length > 0 ? `Solicită și: ${nonProduct.join(', ')}. ` : '';
  const typePart: Record<RequestType, string> = {
    exploratory: 'Email exploratoriu',
    procurement: 'Cerere de achiziție',
    pricing_request: 'Cerere ofertă de preț',
    presentation_request: 'Cerere de prezentare',
    documents_request: 'Cerere documente',
    mixed_request: 'Cerere mixtă',
  };
  const secondaryLabels = secondary.length > 0 ? ` (${secondary.map(t => typePart[t]).join(' + ')})` : '';
  return `${typePart[primary]}${secondaryLabels} ${companyPart}. ${itemsPart}${nonProdPart}`.trim();
}

// ═══════════ MAIN API ═══════════

export function parseEmailBrief(rawEmail: string): ParsedEmailBrief {
  const { body, signature } = splitSignature(rawEmail);
  const norm = normalize(body);
  const contact = extractContact(rawEmail, signature);
  const { items, nonProduct, categories } = extractItems(body, norm);
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
    suggested_email_response_type: suggestEmailResponseType(primary, docs, flags),
    short_response_summary: buildSummary(contact, items, nonProduct, primary, secondary),
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
