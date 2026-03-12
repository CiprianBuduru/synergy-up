// ─── Presentation types ─────────────────────────────────────────────

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

import type { EligibilityStatus } from './eligibility';

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

export type DashboardStatus = 'draft' | 'research_done' | 'presentation_generated' | 'sent' | 'follow_up';
