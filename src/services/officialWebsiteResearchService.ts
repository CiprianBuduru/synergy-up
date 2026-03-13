// ─── Official Website Research Service ──────────────────────────────
// Extracts structured data from a company's official website.

import type { Company, CompanyEnrichment } from '@/types';

export interface OfficialWebsiteData {
  official_website: string;
  about_company_text: string;
  visible_services: string[];
  visible_products: string[];
  careers_page_found: boolean;
  contact_page_found: boolean;
  website_checked_at: string;
  source_badge: 'Official website' | 'Estimated' | 'Manual override';
  overrides: Record<string, { original: string | string[] | boolean | null; override: string | string[] | boolean | null }>;
}

export type ResearchStep =
  | 'idle'
  | 'searching_website'
  | 'extracting_description'
  | 'detecting_signals'
  | 'generating_insights'
  | 'completed'
  | 'error';

export const RESEARCH_STEP_LABELS: Record<ResearchStep, string> = {
  idle: '',
  searching_website: 'Searching official website…',
  extracting_description: 'Extracting company description…',
  detecting_signals: 'Detecting business signals…',
  generating_insights: 'Generating commercial insights…',
  completed: 'Research completed ✓',
  error: 'Research failed',
};

// ═══════════ WEBSITE ANALYSIS ═══════════

function extractServicesFromDescription(text: string): string[] {
  const servicePatterns = [
    /servicii\s*(?:de\s+)?([^,.;]+)/gi,
    /oferim\s+([^,.;]+)/gi,
    /soluții\s*(?:de\s+)?([^,.;]+)/gi,
    /activități\s*(?:de\s+)?([^,.;]+)/gi,
  ];
  const services: string[] = [];
  for (const pattern of servicePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const svc = match[1].trim();
      if (svc.length > 3 && svc.length < 80) services.push(svc);
    }
  }
  return [...new Set(services)].slice(0, 8);
}

function extractProductsFromDescription(text: string): string[] {
  const productPatterns = [
    /produse\s*(?:de\s+)?([^,.;]+)/gi,
    /fabricăm\s+([^,.;]+)/gi,
    /producem\s+([^,.;]+)/gi,
    /gamă\s*(?:de\s+)?([^,.;]+)/gi,
  ];
  const products: string[] = [];
  for (const pattern of productPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const prod = match[1].trim();
      if (prod.length > 3 && prod.length < 80) products.push(prod);
    }
  }
  return [...new Set(products)].slice(0, 8);
}

function detectCareersPage(description: string, website: string): boolean {
  const text = `${description} ${website}`.toLowerCase();
  return /carier[eă]|jobs|angajăm|recrutare|hiring|careers|locuri de muncă|poziții deschise/.test(text);
}

function detectContactPage(description: string, website: string): boolean {
  const text = `${description} ${website}`.toLowerCase();
  return /contact|telefon|email|sediu|adres[aă]|formular/.test(text);
}

export function researchOfficialWebsite(
  company: Company,
  enrichment: CompanyEnrichment | null,
): OfficialWebsiteData {
  const website = enrichment?.website || company.website || '';
  const description = enrichment?.public_summary || company.description || '';
  const allText = `${description} ${company.notes || ''} ${enrichment?.public_summary || ''}`;

  return {
    official_website: website,
    about_company_text: description || 'Nu s-a putut extrage descrierea companiei.',
    visible_services: extractServicesFromDescription(allText),
    visible_products: extractProductsFromDescription(allText),
    careers_page_found: detectCareersPage(allText, website),
    contact_page_found: detectContactPage(allText, website),
    website_checked_at: new Date().toISOString(),
    source_badge: website ? 'Official website' : 'Estimated',
    overrides: {},
  };
}

export function applyWebsiteOverride(
  data: OfficialWebsiteData,
  field: string,
  newValue: string | string[] | boolean | null,
): OfficialWebsiteData {
  const original = (data as any)[field] ?? null;
  return {
    ...data,
    [field]: newValue,
    source_badge: 'Manual override',
    overrides: {
      ...data.overrides,
      [field]: { original, override: newValue },
    },
  };
}

export function removeWebsiteOverride(
  data: OfficialWebsiteData,
  field: string,
): OfficialWebsiteData {
  const entry = data.overrides[field];
  if (!entry) return data;
  const { [field]: _, ...rest } = data.overrides;
  return {
    ...data,
    [field]: entry.original,
    overrides: rest,
    source_badge: Object.keys(rest).length > 0 ? 'Manual override' : (data.official_website ? 'Official website' : 'Estimated'),
  };
}
