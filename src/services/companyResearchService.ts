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

    for (const item of results) {
      const url = item.url || item.link || '';
      const title = item.title || '';
      const description = item.description || '';
      const markdown = item.markdown || '';
      const fullText = `${title} ${description} ${markdown}`.toLowerCase();

      if (url) sources.push(url);

      // Detect LinkedIn
      if (!linkedin && url.includes('linkedin.com')) {
        linkedin = url;
        continue;
      }

      // Detect official website (skip social media and directories)
      if (!detectedWebsite && url && !isSocialOrDirectory(url)) {
        detectedWebsite = url;
      }

      // Try to extract industry from content
      if (!detectedIndustry) {
        detectedIndustry = extractIndustry(fullText);
      }

      // Try to extract location
      if (!detectedLocation) {
        detectedLocation = extractLocation(fullText);
      }

      // Build summary from first meaningful result
      if (!summary && (description || markdown)) {
        summary = (description || markdown.slice(0, 300)).trim();
        if (summary.length > 300) summary = summary.slice(0, 297) + '...';
      }
    }

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
