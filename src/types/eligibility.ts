// ─── Eligibility types ──────────────────────────────────────────────

export type EligibilityStatus = 'eligible' | 'conditionally_eligible' | 'not_eligible_but_convertible';

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
}
