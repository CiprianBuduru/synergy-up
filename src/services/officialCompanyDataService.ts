// ─── Official Company Data Service ─────────────────────────
// Builds an official company profile from existing DB records.
// Separated from commercial/enrichment data.

import type { Company, CompanyEnrichment } from '@/types';

// ─── Types ──────────────────────────────────────────────────

export type OfficialSourceType = 'official' | 'verified' | 'estimated' | 'demo';

export interface OfficialCompanyProfile {
  company_id: string;
  legal_name: string;
  cui: string;
  county: string;
  official_address: string;
  official_caen_code: string;
  official_caen_label: string;
  official_financial_year: string;
  turnover: number | null;
  profit: number | null;
  number_of_employees_official: number | null;
  employees_metric_label: string;
  source_name: string;
  source_type: OfficialSourceType;
  source_url: string;
  verified_at: string;
}

export const EMPLOYEES_METRIC_LABEL = 'Număr mediu salariați din bilanț';

export type OfficialBadgeType = 'Official' | 'Verified source' | 'Estimated' | 'Demo data';

// ─── Builder ────────────────────────────────────────────────

/**
 * Build an OfficialCompanyProfile from existing company + enrichment records.
 * In production this would call an external verification API (e.g. ONRC / MF).
 */
export function buildOfficialProfile(
  company: Company,
  enrichment: CompanyEnrichment | null,
): OfficialCompanyProfile {
  const empCount =
    enrichment?.employee_count_exact ??
    enrichment?.employee_count_estimate ??
    null;

  // Determine source type from enrichment status
  let sourceType: OfficialSourceType = 'estimated';
  let sourceName = 'Date estimative';
  if (enrichment?.enrichment_status === 'verified') {
    sourceType = 'verified';
    sourceName = 'Registrul Comerțului';
  } else if (enrichment?.sources_json?.some(s =>
    typeof s === 'string' && (s.toLowerCase().includes('demo') || s.toLowerCase().includes('seed'))
  )) {
    sourceType = 'demo';
    sourceName = 'Demo / Seed Data';
  }

  return {
    company_id: company.id,
    legal_name: company.legal_name || company.company_name,
    cui: enrichment?.caen_code || '',
    county: company.location || enrichment?.headquarters || '',
    official_address: enrichment?.headquarters || company.location || '',
    official_caen_code: enrichment?.caen_code || '',
    official_caen_label: enrichment?.caen_label || '',
    official_financial_year: new Date().getFullYear().toString(),
    turnover: null,
    profit: null,
    number_of_employees_official: empCount,
    employees_metric_label: EMPLOYEES_METRIC_LABEL,
    source_name: sourceName,
    source_type: sourceType,
    source_url: '',
    verified_at: enrichment?.last_enriched_at || new Date().toISOString(),
  };
}

// ─── Badge Logic ────────────────────────────────────────────

export function getOfficialBadge(profile: OfficialCompanyProfile): OfficialBadgeType {
  switch (profile.source_type) {
    case 'official': return 'Official';
    case 'verified': return 'Verified source';
    case 'demo': return 'Demo data';
    default: return 'Estimated';
  }
}

export const BADGE_CONFIG: Record<OfficialBadgeType, { color: string; icon: string }> = {
  'Official': { color: 'border-emerald-300 text-emerald-700 bg-emerald-50', icon: 'shield-check' },
  'Verified source': { color: 'border-blue-300 text-blue-700 bg-blue-50', icon: 'shield-check' },
  'Estimated': { color: 'border-amber-300 text-amber-700 bg-amber-50', icon: 'eye' },
  'Demo data': { color: 'border-muted-foreground/30 text-muted-foreground bg-muted/30', icon: 'cloud-off' },
};

// ─── Field Definitions ──────────────────────────────────────

export const OFFICIAL_FIELDS: {
  key: keyof OfficialCompanyProfile;
  label: string;
  group: 'identity' | 'classification' | 'financial' | 'employees';
}[] = [
  { key: 'legal_name', label: 'Denumire legală', group: 'identity' },
  { key: 'cui', label: 'CUI / Cod Fiscal', group: 'identity' },
  { key: 'county', label: 'Județ', group: 'identity' },
  { key: 'official_address', label: 'Sediu social', group: 'identity' },
  { key: 'official_caen_code', label: 'Cod CAEN principal', group: 'classification' },
  { key: 'official_caen_label', label: 'Activitate CAEN', group: 'classification' },
  { key: 'official_financial_year', label: 'An fiscal referință', group: 'financial' },
  { key: 'turnover', label: 'Cifră de afaceri', group: 'financial' },
  { key: 'profit', label: 'Profit net', group: 'financial' },
  { key: 'number_of_employees_official', label: 'Număr mediu salariați din bilanț', group: 'employees' },
];
