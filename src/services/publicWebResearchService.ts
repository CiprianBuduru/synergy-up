// ─── Public Web Research Service ────────────────────────────
// Scrapes company websites via Firecrawl to gather public data.
// Completely separate from Official Company Data.

import { supabase } from '@/integrations/supabase/client';

// ─── Types ──────────────────────────────────────────────────

export type WebResearchBadge = 'Official website' | 'Needs confirmation';

export type WebResearchStatus = 'idle' | 'researching' | 'completed' | 'error';

export interface WebResearchResult {
  company_id: string;
  official_website: string;
  official_website_title: string;
  official_website_description: string;
  about_company_text: string;
  visible_services: string[];
  visible_products: string[];
  careers_page_found: boolean;
  contact_page_found: boolean;
  website_checked_at: string;
  badge: WebResearchBadge;
  raw_markdown: string;
  source_url: string;
}

// ─── Firecrawl Integration ──────────────────────────────────

async function scrapeWithFirecrawl(url: string): Promise<{
  success: boolean;
  markdown?: string;
  title?: string;
  description?: string;
  links?: string[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options: { formats: ['markdown', 'links'], onlyMainContent: true } },
    });

    if (error) {
      console.error('[WebResearch] Firecrawl edge function error:', error);
      return { success: false, error: error.message };
    }

    // Firecrawl v1 nests content in data.data
    const content = data?.data || data;
    return {
      success: data?.success !== false,
      markdown: content?.markdown || '',
      title: content?.metadata?.title || '',
      description: content?.metadata?.description || '',
      links: content?.links || [],
    };
  } catch (err) {
    console.error('[WebResearch] Scrape failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ─── Text Extraction Helpers ────────────────────────────────

function extractAboutText(markdown: string): string {
  const patterns = [
    /(?:##?\s*(?:despre\s+noi|about\s+us|cine\s+suntem|who\s+we\s+are))\s*\n([\s\S]{20,800}?)(?=\n##|\n---|\n\*\*|$)/i,
    /(?:despre\s+(?:noi|companie)|about\s+(?:us|the\s+company))[:\s]*\n?([\s\S]{20,500}?)(?=\n\n|\n##|$)/i,
  ];
  for (const p of patterns) {
    const m = markdown.match(p);
    if (m?.[1]) return m[1].trim().replace(/\n+/g, ' ').slice(0, 500);
  }
  // Fallback: first substantial paragraph
  const paragraphs = markdown.split(/\n\n+/).filter(p => p.trim().length > 40);
  return paragraphs[0]?.trim().slice(0, 500) || '';
}

function extractListItems(markdown: string, sectionPatterns: RegExp[]): string[] {
  for (const pattern of sectionPatterns) {
    const match = markdown.match(pattern);
    if (match?.[1]) {
      const lines = match[1].split('\n')
        .map(l => l.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
        .filter(l => l.length > 2 && l.length < 120);
      if (lines.length > 0) return lines.slice(0, 15);
    }
  }
  return [];
}

function extractServices(markdown: string): string[] {
  return extractListItems(markdown, [
    /(?:##?\s*(?:servicii|services|ce\s+facem|what\s+we\s+do))\s*\n([\s\S]{10,800}?)(?=\n##|\n---|\n\*\*|$)/i,
  ]);
}

function extractProducts(markdown: string): string[] {
  return extractListItems(markdown, [
    /(?:##?\s*(?:produse|products|portofoliu|catalog))\s*\n([\s\S]{10,800}?)(?=\n##|\n---|\n\*\*|$)/i,
  ]);
}

function checkPageExists(links: string[], patterns: RegExp[]): boolean {
  return links.some(link => patterns.some(p => p.test(link)));
}

// ─── Main Research Function ─────────────────────────────────

export async function runWebResearch(
  companyId: string,
  websiteUrl: string,
): Promise<{ result: WebResearchResult | null; error: string | null }> {
  if (!websiteUrl.trim()) {
    return { result: null, error: 'Nu a fost furnizat un URL de website.' };
  }

  let url = websiteUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  console.log('[WebResearch] Starting research for:', url);

  const scrapeResult = await scrapeWithFirecrawl(url);

  if (!scrapeResult.success || !scrapeResult.markdown) {
    console.error('[WebResearch] Scrape failed:', scrapeResult.error);
    return {
      result: null,
      error: scrapeResult.error || 'Nu am putut accesa website-ul companiei.',
    };
  }

  const markdown = scrapeResult.markdown;
  const links = scrapeResult.links || [];
  const allLinks = links.map(l => l.toLowerCase());

  const result: WebResearchResult = {
    company_id: companyId,
    official_website: url,
    official_website_title: scrapeResult.title || '',
    official_website_description: scrapeResult.description || '',
    about_company_text: extractAboutText(markdown),
    visible_services: extractServices(markdown),
    visible_products: extractProducts(markdown),
    careers_page_found: checkPageExists(allLinks, [/career/i, /cariere/i, /jobs/i, /locuri-de-munca/i, /angaj/i, /recrut/i]),
    contact_page_found: checkPageExists(allLinks, [/contact/i, /contacteaza/i]),
    website_checked_at: new Date().toISOString(),
    badge: 'Official website',
    raw_markdown: markdown.slice(0, 5000),
    source_url: url,
  };

  console.log('[WebResearch] Research completed:', {
    title: result.official_website_title,
    services: result.visible_services.length,
    products: result.visible_products.length,
    careers: result.careers_page_found,
    contact: result.contact_page_found,
  });

  return { result, error: null };
}

// ─── Badge Config ───────────────────────────────────────────

export const WEB_BADGE_CONFIG: Record<WebResearchBadge, { color: string }> = {
  'Official website': { color: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
  'Needs confirmation': { color: 'border-amber-300 text-amber-700 bg-amber-50' },
};
