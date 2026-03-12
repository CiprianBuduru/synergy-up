// ─── Commercial Enrichment Service ──────────────────────────
// Manages estimated/commercial data distinct from verified official data

import type { Company, CompanyEnrichment, EnrichmentSignal } from '@/types';
import type { CommercialEnrichmentData, DataStatus, SourceBadgeType } from '@/types/verified-company';

/**
 * Build CommercialEnrichmentData from existing enrichment records.
 */
export function buildCommercialEnrichment(
  company: Company,
  enrichment: CompanyEnrichment | null,
  isDemo: boolean = false
): CommercialEnrichmentData {
  const signals = enrichment?.signals_json || [];
  const hasSignal = (type: string) => signals.some((s: EnrichmentSignal) => s.type === type);
  const getSignalConfidence = (type: string) => {
    const signal = signals.find((s: EnrichmentSignal) => s.type === type);
    return signal?.confidence ?? 0;
  };

  const dataStatus: DataStatus = isDemo
    ? 'demo'
    : enrichment?.enrichment_status === 'verified'
      ? 'verified'
      : enrichment?.enrichment_status === 'estimated'
        ? 'estimated'
        : 'needs_confirmation';

  return {
    id: crypto.randomUUID(),
    company_id: company.id,
    website: enrichment?.website || company.website || '',
    company_description: enrichment?.public_summary || company.description || '',
    industry_commercial: enrichment?.industry_label || company.industry || '',
    linkedin_url: enrichment?.linkedin_url || '',
    recruiting_signal: hasSignal('hiring'),
    multi_location_signal: hasSignal('multi_location'),
    hr_relevance: getSignalConfidence('hr_focus') * 100,
    marketing_relevance: getSignalConfidence('marketing_focus') * 100,
    gifting_relevance: getSignalConfidence('corporate_gifting') * 100,
    csr_relevance: getSignalConfidence('csr') * 100,
    internal_branding_relevance: getSignalConfidence('hr_focus') * 50 + getSignalConfidence('marketing_focus') * 50,
    notes: company.notes || '',
    source_name: isDemo ? 'Demo / Seed Data' : 'Enrichment automat',
    source_url: enrichment?.linkedin_url || '',
    confidence_level: enrichment?.employee_count_confidence || 0,
    data_status: dataStatus,
    overrides: {},
  };
}

/**
 * Apply a manual override to a commercial enrichment field.
 */
export function applyCommercialOverride(
  data: CommercialEnrichmentData,
  field: string,
  newValue: string | number | boolean | null
): CommercialEnrichmentData {
  const original = (data as any)[field] ?? null;
  return {
    ...data,
    [field]: newValue,
    data_status: 'manual_override',
    overrides: {
      ...data.overrides,
      [field]: { original, override: newValue },
    },
  };
}

/**
 * Remove a manual override from commercial enrichment.
 */
export function removeCommercialOverride(
  data: CommercialEnrichmentData,
  field: string
): CommercialEnrichmentData {
  const entry = data.overrides[field];
  if (!entry) return data;
  const { [field]: _, ...remainingOverrides } = data.overrides;
  const hasOtherOverrides = Object.keys(remainingOverrides).length > 0;
  return {
    ...data,
    [field]: entry.original,
    overrides: remainingOverrides,
    data_status: hasOtherOverrides ? 'manual_override' : 'estimated',
  };
}

/**
 * Get the appropriate badge for commercial enrichment data.
 */
export function getCommercialBadgeType(data: CommercialEnrichmentData): SourceBadgeType {
  if (Object.keys(data.overrides).length > 0) return 'Manual override';
  switch (data.data_status) {
    case 'demo': return 'Demo data';
    case 'verified': return 'Verified source';
    case 'official': return 'Official';
    case 'estimated': return 'Estimated';
    case 'needs_confirmation': return 'Needs confirmation';
    default: return 'Estimated';
  }
}
