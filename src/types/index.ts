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
  enrichment_status: 'verified' | 'estimated' | 'needs_confirmation';
  sources_json: string[];
  signals_json: EnrichmentSignal[];
  last_enriched_at: string;
  created_at: string;
}

export interface EnrichmentSignal {
  type: string;
  label: string;
  confidence: number;
}

export interface CalculationSnapshot {
  id: string;
  company_id: string;
  employee_count_used: number;
  disabled_employees_declared: number;
  required_positions_4_percent: number;
  uncovered_positions: number;
  min_wage_used: number;
  monthly_obligation_estimated: number;
  spendable_half_estimated: number;
  notes: string;
  created_at: string;
}

export interface Brief {
  id: string;
  company_id: string;
  raw_brief: string;
  requested_products_json: string[];
  requested_purpose: string;
  target_audience: string;
  department_detected: string;
  tone_recommended: string;
  eligibility_status: EligibilityStatus;
  created_at: string;
}

export type EligibilityStatus = 'eligible' | 'conditionally_eligible' | 'not_eligible_but_convertible';

export interface Operation {
  id: string;
  name: string;
  description: string;
  caen_code: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  base_product_type: string;
  internal_operations_json: string[];
  supporting_caen_codes_json: string[];
  eligible_logic: string;
  suggested_industries_json: string[];
  suitable_departments_json: string[];
  suitable_for_json: string[];
  usable_in_kits: boolean;
  active: boolean;
  notes: string;
}

export type KitComplexity = 'simplu' | 'standard' | 'premium';

export interface Kit {
  id: string;
  name: string;
  category: string;
  purpose: string;
  audience: string;
  complexity: KitComplexity;
  suggested_industries_json: string[];
  components_json: KitComponent[];
  internal_operations_json: string[];
  supporting_caen_codes_json: string[];
  eligibility_explanation: string;
  is_alternative: boolean;
  alternative_for: string[];
  active: boolean;
}

export interface KitComponent {
  name: string;
  customizable: boolean;
}

export interface Alternative {
  id: string;
  source_request_keyword: string;
  suggested_product_or_kit: string;
  explanation: string;
  relevance_tags_json: string[];
  active: boolean;
}

export interface Presentation {
  id: string;
  company_id: string;
  brief_id: string | null;
  title: string;
  objective: string;
  tone: PresentationTone;
  status: PresentationStatus;
  generated_summary: string;
  created_at: string;
  updated_at: string;
}

export type PresentationTone = 'corporate' | 'friendly' | 'premium' | 'technical';
export type PresentationStatus = 'draft' | 'research_done' | 'presentation_generated' | 'sent' | 'follow_up';

export interface Slide {
  id: string;
  presentation_id: string;
  slide_order: number;
  slide_type: string;
  title: string;
  body: string;
  visible: boolean;
  metadata_json: Record<string, unknown>;
}

export interface EligibilityResult {
  verdict: EligibilityStatus;
  explanation: string;
  internal_operation: string;
  supporting_caen: string;
  alternative_suggestions: string[];
}

export type DashboardStatus = 'draft' | 'research_done' | 'presentation_generated' | 'sent' | 'follow_up';
