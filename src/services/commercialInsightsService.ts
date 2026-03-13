// ─── Commercial Insights Service ────────────────────────────────────
// Transforms public web research data into a commercial profile for pitch.
// Completely separate from Official Company Data and Official Website Data.

import type { Company, CompanyEnrichment } from '@/types';
import type { Product, Kit } from '@/types';
import type { OfficialWebsiteData } from './officialWebsiteResearchService';
import type { WebResearchResult } from './publicWebResearchService';
import type { BusinessSignalReport } from './businessSignalDetectionService';
import type { CompanySignals } from './companySignalsService';
import type { DetectedIntent } from './intentDetectionService';
import { rankProducts } from './solutionRankingService';
import { rankKits } from './solutionRankingService';

// ─── Types ──────────────────────────────────────────────────

export type CommercialInsightBadge = 'Research insight' | 'Estimated' | 'Manual override';

export type SignalStrength = 'none' | 'weak' | 'moderate' | 'strong';

export interface CommercialInsights {
  business_model_summary: string;
  likely_departments_to_target: string[];
  likely_needs: string[];
  likely_use_cases_for_UP: string[];
  recommended_pitch_angles: string[];
  recommended_kits_by_research: string[];
  recommended_products_by_research: string[];
  recruiting_signal: SignalStrength;
  multi_location_signal: SignalStrength;
  event_signal: SignalStrength;
  internal_branding_signal: SignalStrength;
  gifting_signal: SignalStrength;
  confidence_level: number; // 0–100
  research_notes: string;
  research_generated_at: string;
  source_badge: CommercialInsightBadge;
  overrides: Record<string, { original: unknown; override: unknown }>;
}

// ─── Signal Helpers ─────────────────────────────────────────

function relevanceToStrength(level: 'low' | 'medium' | 'high'): SignalStrength {
  if (level === 'high') return 'strong';
  if (level === 'medium') return 'moderate';
  return 'weak';
}

function countDetected(report: BusinessSignalReport): number {
  return report.signals.filter(s => s.detected).length;
}

// ─── Business Model ─────────────────────────────────────────

function inferBusinessModel(
  company: Company,
  enrichment: CompanyEnrichment | null,
  webData: OfficialWebsiteData | null,
  webResearch: WebResearchResult | null,
): string {
  const industry = enrichment?.industry_label || company.industry || 'Nespecificat';
  const parts: string[] = [`Companie activă în ${industry}.`];

  const services = webData?.visible_services || webResearch?.visible_services || [];
  const products = webData?.visible_products || webResearch?.visible_products || [];

  if (services.length > 0) parts.push(`Servicii: ${services.slice(0, 4).join(', ')}.`);
  if (products.length > 0) parts.push(`Produse: ${products.slice(0, 4).join(', ')}.`);

  const empCount = enrichment?.employee_count_estimate || enrichment?.employee_count_exact;
  if (empCount) {
    if (empCount >= 500) parts.push('Enterprise.');
    else if (empCount >= 100) parts.push('Mid-market.');
    else parts.push('SMB.');
  }

  return parts.join(' ');
}

// ─── Department Targeting ───────────────────────────────────

function inferDepartments(
  signals: CompanySignals,
  webData: OfficialWebsiteData | null,
): string[] {
  const deps: string[] = [];
  if (signals.hr_relevance !== 'low') deps.push('HR / People');
  if (signals.marketing_event_relevance !== 'low') deps.push('Marketing');
  if (signals.corporate_gifting_relevance !== 'low') deps.push('Achiziții / Procurement');
  if (signals.internal_branding_relevance !== 'low') deps.push('Internal Communications');
  if (signals.csr_relevance !== 'low') deps.push('CSR / Sustenabilitate');
  if (webData?.careers_page_found) deps.push('Talent Acquisition');
  if (deps.length === 0) deps.push('General Management');
  return [...new Set(deps)];
}

// ─── Needs ──────────────────────────────────────────────────

function inferNeeds(
  signals: CompanySignals,
  signalReport: BusinessSignalReport,
  webData: OfficialWebsiteData | null,
): string[] {
  const needs: string[] = [];
  if (signals.hr_relevance === 'high' || webData?.careers_page_found) {
    needs.push('Kituri de onboarding pentru angajați noi');
    needs.push('Materiale de employer branding');
  }
  if (signals.marketing_event_relevance === 'high') {
    needs.push('Materiale promoționale pentru evenimente');
    needs.push('Suport vizual pentru standuri și conferințe');
  }
  if (signals.corporate_gifting_relevance === 'high') {
    needs.push('Pachete de corporate gifting');
  }
  if (signals.csr_relevance === 'high' || signalReport.signals.find(s => s.signal_key === 'csr_focus')?.detected) {
    needs.push('Produse eco-friendly pentru inițiative CSR');
  }
  if (signals.multi_location_relevance) {
    needs.push('Materiale de branding pentru sucursale multiple');
  }
  if (signalReport.signals.find(s => s.signal_key === 'growth_signal')?.detected) {
    needs.push('Materiale de comunicare internă — perioadă de expansiune');
  }
  if (needs.length === 0) {
    needs.push('Materiale de birou branduite', 'Pachete promoționale standard');
  }
  return [...new Set(needs)].slice(0, 8);
}

// ─── Use Cases ──────────────────────────────────────────────

function inferUseCases(signals: CompanySignals): string[] {
  const uc: string[] = [];
  if (signals.hr_relevance !== 'low') uc.push('Welcome kits pentru angajați noi');
  if (signals.marketing_event_relevance !== 'low') uc.push('Kit conferință și materiale expo');
  if (signals.corporate_gifting_relevance !== 'low') uc.push('Pachete protocol și cadouri corporate');
  if (signals.internal_branding_relevance !== 'low') uc.push('Identitate vizuală internă');
  if (signals.csr_relevance !== 'low') uc.push('Campanii CSR cu produse personalizate');
  if (uc.length === 0) uc.push('Papetărie brandată și materiale standard');
  return uc.slice(0, 6);
}

// ─── Pitch Angles ───────────────────────────────────────────

function buildPitchAngles(
  signalReport: BusinessSignalReport,
  signals: CompanySignals,
): string[] {
  const angles: string[] = [];
  if (signalReport.overall_opportunity_level === 'high') {
    angles.push('Potențial comercial ridicat — abordare consultativă');
  }
  if (signals.hr_relevance === 'high') angles.push('Onboarding & employer branding — ROI pe retenție');
  if (signals.marketing_event_relevance === 'high') angles.push('Vizibilitate la evenimente — diferențiere competitivă');
  if (signals.corporate_gifting_relevance === 'high') angles.push('Gifting strategic — relații cu stakeholderi');

  const active = signalReport.signals.filter(s => s.detected);
  for (const s of active.slice(0, 2)) {
    angles.push(`Exploatează semnal: ${s.label}`);
  }
  if (angles.length === 0) angles.push('Abordare generică — identifică nevoi în follow-up');
  return [...new Set(angles)].slice(0, 6);
}

// ─── Confidence ─────────────────────────────────────────────

function computeConfidence(
  enrichment: CompanyEnrichment | null,
  webData: OfficialWebsiteData | null,
  webResearch: WebResearchResult | null,
  signalReport: BusinessSignalReport,
): number {
  let score = 20; // baseline
  if (enrichment) score += 20;
  if (webData) score += 20;
  if (webResearch) score += 15;
  const detected = countDetected(signalReport);
  score += Math.min(detected * 5, 25);
  return Math.min(score, 100);
}

// ═══════════ MAIN GENERATOR ═══════════

export function generateCommercialInsights(
  company: Company,
  enrichment: CompanyEnrichment | null,
  webData: OfficialWebsiteData | null,
  webResearch: WebResearchResult | null,
  signalReport: BusinessSignalReport,
  companySignals: CompanySignals,
  intent: DetectedIntent | null,
  allProducts: Product[],
  allKits: Kit[],
): CommercialInsights {
  const industry = enrichment?.industry_label || company.industry || '';
  const department = company.contact_department || 'General';

  const businessModel = inferBusinessModel(company, enrichment, webData, webResearch);
  const departments = inferDepartments(companySignals, webData);
  const needs = inferNeeds(companySignals, signalReport, webData);
  const useCases = inferUseCases(companySignals);
  const pitchAngles = buildPitchAngles(signalReport, companySignals);

  // Rank products & kits
  let recProducts: string[] = [];
  let recKits: string[] = [];
  if (intent) {
    recProducts = rankProducts(allProducts, industry, department, intent, companySignals)
      .slice(0, 5).map(r => r.product.name);
    recKits = rankKits(allKits, industry, department, intent, companySignals)
      .slice(0, 4).map(r => r.kit.name);
  }

  // Research notes
  const notes: string[] = [];
  if (webData?.careers_page_found || webResearch?.careers_page_found) notes.push('Pagină de cariere identificată.');
  const svcCount = (webData?.visible_services || webResearch?.visible_services || []).length;
  if (svcCount > 0) notes.push(`${svcCount} servicii vizibile pe website.`);
  if (signalReport.overall_opportunity_level === 'high') notes.push('Nivel ridicat de oportunitate.');

  const confidence = computeConfidence(enrichment, webData, webResearch, signalReport);

  return {
    business_model_summary: businessModel,
    likely_departments_to_target: departments,
    likely_needs: needs,
    likely_use_cases_for_UP: useCases,
    recommended_pitch_angles: pitchAngles,
    recommended_kits_by_research: recKits,
    recommended_products_by_research: recProducts,
    recruiting_signal: relevanceToStrength(companySignals.hr_relevance),
    multi_location_signal: companySignals.multi_location_relevance ? 'strong' : 'none',
    event_signal: relevanceToStrength(companySignals.marketing_event_relevance),
    internal_branding_signal: relevanceToStrength(companySignals.internal_branding_relevance),
    gifting_signal: relevanceToStrength(companySignals.corporate_gifting_relevance),
    confidence_level: confidence,
    research_notes: notes.join(' '),
    research_generated_at: new Date().toISOString(),
    source_badge: confidence >= 60 ? 'Research insight' : 'Estimated',
    overrides: {},
  };
}

// ─── Manual Override ────────────────────────────────────────

export function applyInsightOverride(
  data: CommercialInsights,
  field: string,
  newValue: unknown,
): CommercialInsights {
  const original = (data as Record<string, unknown>)[field] ?? null;
  return {
    ...data,
    [field]: newValue,
    source_badge: 'Manual override',
    overrides: { ...data.overrides, [field]: { original, override: newValue } },
  };
}

export function removeInsightOverride(
  data: CommercialInsights,
  field: string,
): CommercialInsights {
  const override = data.overrides[field];
  if (!override) return data;
  const { [field]: _, ...rest } = data.overrides;
  return {
    ...data,
    [field]: override.original,
    overrides: rest,
    source_badge: Object.keys(rest).length > 0 ? 'Manual override' : 'Research insight',
  };
}
