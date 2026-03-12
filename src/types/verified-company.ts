// ─── Verified Company Data (from official sources) ──────────

export interface VerifiedCompanyData {
  id: string;
  company_id: string;
  legal_name: string;
  cui: string;
  vat_status: string;
  registration_status: string;
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
  source_url: string;
  source_type: 'official' | 'verified' | 'manual';
  verified_at: string;
  overrides: Record<string, { original: string | number | null; override: string | number | null }>;
}

export const DEFAULT_EMPLOYEES_METRIC_LABEL = 'Număr mediu salariați din bilanț';

// ─── Commercial Enrichment (estimated/commercial data) ──────

export interface CommercialEnrichmentData {
  id: string;
  company_id: string;
  website: string;
  company_description: string;
  industry_commercial: string;
  linkedin_url: string;
  recruiting_signal: boolean;
  multi_location_signal: boolean;
  hr_relevance: number;
  marketing_relevance: number;
  gifting_relevance: number;
  csr_relevance: number;
  internal_branding_relevance: number;
  notes: string;
  source_name: string;
  source_url: string;
  confidence_level: number;
  data_status: DataStatus;
  overrides: Record<string, { original: string | number | boolean | null; override: string | number | boolean | null }>;
}

export type DataStatus = 'official' | 'verified' | 'estimated' | 'needs_confirmation' | 'manual_override' | 'demo';

export type SourceBadgeType = 'Official' | 'Verified' | 'Estimated' | 'Needs confirmation' | 'Manual override' | 'Demo data' | 'Verified source';

export interface CompanySearchResult {
  company_id: string;
  legal_name: string;
  cui: string;
  county: string;
  status: string;
  source_badge: SourceBadgeType;
}
