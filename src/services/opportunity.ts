// ─── Opportunity Calculator Service ─────────────────────────────────
// Pure business logic — no UI, no seed data dependency.

export interface OpportunityResult {
  required_positions_4_percent: number;
  uncovered_positions: number;
  monthly_obligation_estimated: number;
  spendable_half_estimated: number;
  annual_budget_estimated: number;
  below_threshold: boolean;
}

export function calculateOpportunity(
  employeeCount: number,
  disabledEmployees: number,
  minWage: number
): OpportunityResult {
  const required = Math.ceil(employeeCount * 0.04);
  const uncovered = Math.max(0, required - disabledEmployees);
  const monthly = uncovered * minWage;
  const half = Math.round(monthly / 2);
  return {
    required_positions_4_percent: required,
    uncovered_positions: uncovered,
    monthly_obligation_estimated: monthly,
    spendable_half_estimated: half,
    annual_budget_estimated: half * 12,
    below_threshold: employeeCount < 50,
  };
}
