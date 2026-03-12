// ─── Core entity types ──────────────────────────────────────────────

export interface Company {
  id: string;
  company_name: string;
  legal_name: string;
  website: string;
  industry: string;
  company_size: string;
  location: string;
  description: string;
  contact_name: string;
  contact_role: string;
  contact_department: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyEnrichment {
  id: string;
  company_id: string;
  legal_name: string;
  website: string;
  linkedin_url: string;
  industry_label: string;
  caen_code: string;
  caen_label: string;
  employee_count_exact: number | null;
  employee_count_min: number | null;
  employee_count_max: number | null;
  employee_count_estimate: number | null;
  employee_count_confidence: number;
  headquarters: string;
  public_summary: string;
  enrichment_status: EnrichmentStatus;
  sources_json: string[];
  signals_json: EnrichmentSignal[];
  last_enriched_at: string;
  created_at: string;
}

export type EnrichmentStatus = 'verified' | 'estimated' | 'needs_confirmation';

export interface EnrichmentSignal {
  type: string;
  label: string;
  confidence: number;
}
