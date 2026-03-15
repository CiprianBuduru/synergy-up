// ─── Company Research Service ───────────────────────────────
// Lightweight research based on company_name only.
// Uses Firecrawl search to find public info. No DB dependency.

import { supabase } from '@/integrations/supabase/client';

export interface CompanyResearchResult {
  company_name: string;
  detected_website: string;
  detected_industry: string;
  detected_location: string;
  short_company_summary: string;
  possible_linkedin: string;
  research_sources: string[];
  researched_at: string;
}

export type CompanyResearchStatus = 'idle' | 'researching' | 'completed' | 'error';

// ─── Main research function ─────────────────────────────────

export async function runCompanyResearch(
  companyName: string,
): Promise<{ result: CompanyResearchResult | null; error: string | null }> {
  if (!companyName.trim()) {
    return { result: null, error: 'Company name is required.' };
  }

  const name = companyName.trim();

  try {
    // Search for the company using Firecrawl search edge function
    const { data, error } = await supabase.functions.invoke('firecrawl-search', {
      body: {
        query: `"${name}" company official website`,
        options: { limit: 5, scrapeOptions: { formats: ['markdown'] } },
      },
    });

    if (error) {
      console.error('[CompanyResearch] Search error:', error);
      return { result: null, error: error.message };
    }

    const results = data?.data || data?.results || [];
    if (!results || results.length === 0) {
      // Return a minimal result even if search fails
      return {
        result: buildMinimalResult(name),
        error: null,
      };
    }

    // Extract insights from search results
    const sources: string[] = [];
    let detectedWebsite = '';
    let detectedIndustry = '';
    let detectedLocation = '';
    let summary = '';
    let linkedin = '';

    // Collect all candidate URLs first, then pick the best website
    const candidateUrls: string[] = [];

    for (const item of results) {
      const url = item.url || item.link || '';
      const title = item.title || '';
      const description = item.description || '';
      const markdown = item.markdown || '';

      if (url) sources.push(url);

      // Detect LinkedIn
      if (!linkedin && url.includes('linkedin.com')) {
        linkedin = url;
        continue;
      }

      // Collect non-social URLs as website candidates
      if (url && !isSocialOrDirectory(url)) {
        candidateUrls.push(url);
      }

      // Only use root-level pages for industry detection (avoid subpage noise)
      const isRootLevel = isRootOrNearRoot(url);

      if (!detectedIndustry && isRootLevel) {
        const fullText = `${title} ${description} ${markdown}`.toLowerCase();
        detectedIndustry = extractIndustry(fullText);
      }

      // Try to extract location from any result
      if (!detectedLocation) {
        const fullText = `${title} ${description} ${markdown}`.toLowerCase();
        detectedLocation = extractLocation(fullText);
      }

      // Build summary from first meaningful root-level result, fallback to any
      if (!summary && (description || markdown)) {
        const text = (description || markdown.slice(0, 300)).trim();
        if (isRootLevel || !summary) {
          summary = text.length > 300 ? text.slice(0, 297) + '...' : text;
        }
      }
    }

    // Pick best website: prefer root domain over deep subpages
    detectedWebsite = pickBestWebsite(candidateUrls);

    const result: CompanyResearchResult = {
      company_name: name,
      detected_website: detectedWebsite,
      detected_industry: detectedIndustry,
      detected_location: detectedLocation,
      short_company_summary: summary,
      possible_linkedin: linkedin,
      research_sources: sources.slice(0, 5),
      researched_at: new Date().toISOString(),
    };

    return { result, error: null };
  } catch (err) {
    console.error('[CompanyResearch] Error:', err);
    return {
      result: buildMinimalResult(name),
      error: err instanceof Error ? err.message : 'Research failed',
    };
  }
}

// ─── Helpers ────────────────────────────────────────────────

function buildMinimalResult(name: string): CompanyResearchResult {
  return {
    company_name: name,
    detected_website: '',
    detected_industry: '',
    detected_location: '',
    short_company_summary: '',
    possible_linkedin: '',
    research_sources: [],
    researched_at: new Date().toISOString(),
  };
}

function isSocialOrDirectory(url: string): boolean {
  const skip = ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'youtube.com', 'linkedin.com', 'wikipedia.org', 'listafirme.ro', 'risco.ro', 'termene.ro', 'infocui.ro'];
  return skip.some(d => url.includes(d));
}

/** Extract root domain URL from any URL (e.g. https://lidas.ro/en/page → https://lidas.ro) */
function toRootDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

/** Check if a URL is the root page or near-root (max 1 path segment) */
function isRootOrNearRoot(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments.length <= 1;
  } catch {
    return false;
  }
}

/** Pick the best website from candidates: prefer root domains over deep subpages */
function pickBestWebsite(urls: string[]): string {
  if (urls.length === 0) return '';

  // Group by root domain and prefer root/near-root URLs
  const domainMap = new Map<string, string[]>();
  for (const url of urls) {
    const root = toRootDomain(url);
    if (!domainMap.has(root)) domainMap.set(root, []);
    domainMap.get(root)!.push(url);
  }

  // Pick the first domain encountered (highest search relevance), return its root
  const firstRoot = toRootDomain(urls[0]);
  return firstRoot;
}

function extractIndustry(text: string): string {
  const patterns: [RegExp, string][] = [
    [/\b(it|software|tech|technology|digital)\b/i, 'IT & Software'],
    [/\b(construct|building|arhitect)/i, 'Construcții'],
    [/\b(transport|logistic|curier)/i, 'Transport & Logistică'],
    [/\b(retail|magazine|shop|comerț)/i, 'Retail'],
    [/\b(food|aliment|hrană|restaur)/i, 'Food & Beverage'],
    [/\b(energy|energi|electri|gaz|petrol)/i, 'Energie'],
    [/\b(health|sănăt|medical|farma|clinic)/i, 'Sănătate'],
    [/\b(financ|bank|bancă|asigur|insurance)/i, 'Financiar & Banking'],
    [/\b(agri|farm|agricol)/i, 'Agricultură'],
    [/\b(auto|car|vehic|mașin)/i, 'Automotive'],
    [/\b(manufactur|producț|factory|fabrică)/i, 'Manufacturing'],
    [/\b(consult|advisory|strateg)/i, 'Consultanță'],
    [/\b(educat|school|universit|învăț)/i, 'Educație'],
    [/\b(telecom|comunicat)/i, 'Telecomunicații'],
  ];
  for (const [regex, label] of patterns) {
    if (regex.test(text)) return label;
  }
  return '';
}

function extractLocation(text: string): string {
  const cities = ['București', 'Bucharest', 'Cluj', 'Timișoara', 'Iași', 'Constanța', 'Brașov', 'Craiova', 'Sibiu', 'Oradea', 'Galați', 'Ploiești', 'Arad', 'Pitești', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Suceava'];
  for (const city of cities) {
    if (text.toLowerCase().includes(city.toLowerCase())) return city;
  }
  if (/\bromania\b|\bromânia\b/i.test(text)) return 'România';
  return '';
}
