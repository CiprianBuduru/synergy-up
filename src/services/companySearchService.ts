// ─── Company Search Service ─────────────────────────────────
// Provides search functionality across companies with verified data display

import type { Company, CompanyEnrichment } from '@/types';
import type { CompanySearchResult, SourceBadgeType } from '@/types/verified-company';

function getSourceBadge(enrichment: CompanyEnrichment | null, isDemo: boolean): SourceBadgeType {
  if (isDemo) return 'Demo data';
  if (!enrichment) return 'Needs confirmation';
  if (enrichment.enrichment_status === 'verified') return 'Verified source';
  if (enrichment.enrichment_status === 'estimated') return 'Estimated';
  return 'Needs confirmation';
}

function isDemoEnrichment(enrichment: CompanyEnrichment | null): boolean {
  if (!enrichment) return false;
  return (
    enrichment.sources_json?.includes('Introducere manuală') ||
    enrichment.sources_json?.includes('demo') ||
    enrichment.sources_json?.some(s => s.toLowerCase().includes('seed')) ||
    false
  );
}

export function searchCompanies(
  query: string,
  companies: Company[],
  enrichments: CompanyEnrichment[]
): CompanySearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return companies.map(c => mapToResult(c, enrichments));

  return companies
    .filter(c =>
      c.company_name.toLowerCase().includes(q) ||
      c.legal_name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      enrichments.find(e => e.company_id === c.id)?.caen_code?.includes(q)
    )
    .map(c => mapToResult(c, enrichments));
}

function mapToResult(company: Company, enrichments: CompanyEnrichment[]): CompanySearchResult {
  const enrichment = enrichments.find(e => e.company_id === company.id) || null;
  const isDemo = isDemoEnrichment(enrichment);
  return {
    company_id: company.id,
    legal_name: company.legal_name || company.company_name,
    cui: enrichment?.caen_code || '—',
    county: company.location || enrichment?.headquarters || '—',
    status: enrichment?.enrichment_status || 'needs_confirmation',
    source_badge: getSourceBadge(enrichment, isDemo),
  };
}

export function getCompanySearchResult(
  company: Company,
  enrichment: CompanyEnrichment | null
): CompanySearchResult {
  const isDemo = isDemoEnrichment(enrichment);
  return {
    company_id: company.id,
    legal_name: company.legal_name || company.company_name,
    cui: enrichment?.caen_code || '—',
    county: company.location || enrichment?.headquarters || '—',
    status: enrichment?.enrichment_status || 'needs_confirmation',
    source_badge: getSourceBadge(enrichment, isDemo),
  };
}
