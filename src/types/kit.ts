// ─── Kit types ──────────────────────────────────────────────────────

import type { EligibilityStatus } from './eligibility';

export type KitComplexity = 'simplu' | 'standard' | 'premium';

export interface Kit {
  id: string;
  name: string;
  category: string;
  purpose: string;
  audience: string;
  target_departments: string[];
  complexity: KitComplexity;
  suggested_industries_json: string[];
  components_json: KitComponent[];
  internal_operations_json: string[];
  supporting_caen_codes_json: string[];
  eligibility_type: EligibilityStatus;
  eligibility_explanation: string;
  sales_angle: string;
  presentation_use_case: string;
  is_alternative: boolean;
  alternative_for: string[];
  active: boolean;
}

export interface KitComponent {
  name: string;
  customizable: boolean;
}
