// ─── Barrel export for all types ─────────────────────────────────────
// Import from '@/types' remains unchanged across the app.

export type { Company, CompanyEnrichment, EnrichmentStatus, EnrichmentSignal } from './company';
export type { Product, Operation, Alternative } from './product';
export type { Kit, KitComponent, KitComplexity } from './kit';
export type { EligibilityStatus, EligibilityResult, DetectedPurpose, BriefAnalysisV2, ReasoningStep } from './eligibility';
export type {
  Presentation, PresentationTone, PresentationStatus,
  Slide, Brief, CalculationSnapshot, DashboardStatus,
} from './presentation';
