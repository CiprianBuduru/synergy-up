// ─── Verified Company Data Service ──────────────────────────
// Manages official/verified company information from authoritative sources

import type { Company, CompanyEnrichment } from '@/types';
import type { VerifiedCompanyData, SourceBadgeType, DEFAULT_EMPLOYEES_METRIC_LABEL } from '@/types/verified-company';

export const EMPLOYEES_METRIC_LABEL = 'Număr mediu salariați din bilanț';

/**
 * Build VerifiedCompanyData from existing company + enrichment records.
 * In a production system this would call an external verification API.
 */
export function buildVerifiedCompanyData(
  company: Company,
  enrichment: CompanyEnrichment | null,
  isDemo: boolean = false
): VerifiedCompanyData {
  const empCount = enrichment?.employee_count_exact ?? enrichment?.employee_count_estimate ?? null;
  const sourceType = isDemo ? 'manual' as const : enrichment?.enrichment_status === 'verified' ? 'verified' as const : 'manual' as const;

  return {
    id: crypto.randomUUID(),
    company_id: company.id,
    legal_name: company.legal_name || company.company_name,
    cui: enrichment?.caen_code || '',
    vat_status: enrichment?.enrichment_status === 'verified' ? 'Activ' : '—',
    registration_status: enrichment?.enrichment_status === 'verified' ? 'Înregistrat' : 'Neconfirmat',
    county: company.location || enrichment?.headquarters || '',
    official_address: enrichment?.headquarters || company.location || '',
    official_caen_code: enrichment?.caen_code || '',
    official_caen_label: enrichment?.caen_label || '',
    official_financial_year: new Date().getFullYear().toString(),
    turnover: null,
    profit: null,
    number_of_employees_official: empCount,
    employees_metric_label: EMPLOYEES_METRIC_LABEL,
    source_name: isDemo ? 'Demo / Seed Data' : 'Registrul Comerțului',
    source_url: '',
    source_type: sourceType,
    verified_at: enrichment?.last_enriched_at || new Date().toISOString(),
    overrides: {},
  };
}

/**
 * Apply a manual override to a field, preserving the original value.
 */
export function applyOverride(
  data: VerifiedCompanyData,
  field: string,
  newValue: string | number | null
): VerifiedCompanyData {
  const original = (data as any)[field] ?? null;
  return {
    ...data,
    [field]: newValue,
    overrides: {
      ...data.overrides,
      [field]: { original, override: newValue },
    },
  };
}

/**
 * Remove a manual override, restoring the original value.
 */
export function removeOverride(
  data: VerifiedCompanyData,
  field: string
): VerifiedCompanyData {
  const entry = data.overrides[field];
  if (!entry) return data;
  const { [field]: _, ...remainingOverrides } = data.overrides;
  return {
    ...data,
    [field]: entry.original,
    overrides: remainingOverrides,
  };
}

/**
 * Check if a field has been manually overridden.
 */
export function isFieldOverridden(data: VerifiedCompanyData, field: string): boolean {
  return field in data.overrides;
}

/**
 * Get the appropriate source badge for verified data.
 */
export function getVerifiedBadgeType(data: VerifiedCompanyData): SourceBadgeType {
  if (Object.keys(data.overrides).length > 0) return 'Manual override';
  if (data.source_type === 'manual' && data.source_name.toLowerCase().includes('demo')) return 'Demo data';
  if (data.source_type === 'verified') return 'Verified source';
  if (data.source_type === 'official') return 'Official';
  return 'Needs confirmation';
}
