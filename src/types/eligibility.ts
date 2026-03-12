// ─── Eligibility types ──────────────────────────────────────────────

export type EligibilityStatus = 'eligible' | 'conditionally_eligible' | 'not_eligible_but_convertible';

export interface ReasoningStep {
  item: string;
  baseType: string;
  deliverableType: string;
  operations: string[];
  caen: string[];
  eligible: boolean;
  explanation: string;
}

export interface EligibilityResult {
  verdict: EligibilityStatus;
  explanation: string;
  internal_operation_used: string[];
  supporting_caen_codes: string[];
  converted_intent: string;
  alternative_products: string[];
  alternative_kits: string[];
  sales_angle: string;
  confidence_score: number;
  reasoning_steps?: ReasoningStep[];
}

export type DetectedPurpose =
  | 'onboarding'
  | 'hr_welcome'
  | 'eveniment'
  | 'conferinta'
  | 'office_use'
  | 'protocol'
  | 'corporate_gifting'
  | 'marketing_campaign'
  | 'internal_communication'
  | 'recruitment';

export interface BriefAnalysisV2 {
  products: string[];
  purpose: DetectedPurpose;
  audience: string;
  department: string;
  tone: string;
  eligibility: EligibilityResult;
  detected_intents: string[];
  /** Matches from Brief Rules Engine */
  brief_rules_matches?: import('./brief-rule').BriefRuleMatch[];
  /** Kit recommendations from rules */
  recommended_kits_from_rules?: string[];
  /** Pitch lines from matched rules */
  pitch_lines_from_rules?: string[];
}
