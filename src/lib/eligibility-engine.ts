// ─── Eligibility Engine — Facade ────────────────────────────────────
// This file re-exports from the new services for backward compatibility.
// All business logic now lives in src/services/.

export { checkEligibility, checkProductEligibility, AUTHORIZED_CAEN, OPERATIONS_CAEN } from '@/services/eligibility';
export { analyzeBrief, PURPOSE_LABELS, detectPurpose, detectIntents } from '@/services/brief-analyzer';
export { calculateOpportunity } from '@/services/opportunity';
export { getRecommendedProducts, getRecommendedKits } from '@/services/recommendations';
export { analyzeBriefWithRules, matchBriefRules, getAllBriefRules } from '@/services/briefRulesEngine';
