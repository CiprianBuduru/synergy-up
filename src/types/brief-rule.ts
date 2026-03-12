// ─── Brief Rule Types ────────────────────────────────────────────────

export type EligibilityType = 'direct' | 'via_operation' | 'convertible';

export interface BriefRule {
  id: string;
  requested_item: string;
  requested_category: string;
  direct_eligible: boolean;
  eligibility_type: EligibilityType;
  eligible_via_operation: string[];
  supporting_caen_codes: string[];
  eligible_result: string[];
  recommended_products: string[];
  recommended_kits: string[];
  primary_intent: string;
  secondary_intent: string;
  pitch_line: string;
  notes: string;
  /** Keywords used to match this rule against brief text */
  match_keywords: string[];
}

export interface BriefRuleMatch {
  rule: BriefRule;
  matched_keyword: string;
  confidence: number;
}
