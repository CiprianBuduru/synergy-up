// ─── Company Research Insights Service ──────────────────────────────
// Generates commercial research insights from website data, signals, and enrichment.

import type { Company, CompanyEnrichment } from '@/types';
import type { Product, Kit } from '@/types';
import type { OfficialWebsiteData } from './officialWebsiteResearchService';
import type { BusinessSignalReport } from './businessSignalDetectionService';
import type { CompanySignals } from './companySignalsService';
import type { DetectedIntent } from './intentDetectionService';
import { rankProducts, type RankedProduct } from './solutionRankingService';
import { rankKits, type RankedKit } from './solutionRankingService';

export interface CommercialResearchInsights {
  business_model_summary: string;
  likely_needs: string[];
  likely_use_cases_for_UP: string[];
  recommended_pitch_angles: string[];
  recommended_kits_by_research: string[];
  recommended_products_by_research: string[];
  research_notes: string;
  research_generated_at: string;
  source_badge: 'Research insight' | 'Estimated' | 'Manual override';
  overrides: Record<string, { original: any; override: any }>;
}

// ═══════════ BUSINESS MODEL INFERENCE ═══════════

function inferBusinessModel(
  company: Company,
  enrichment: CompanyEnrichment | null,
  websiteData: OfficialWebsiteData,
): string {
  const industry = enrichment?.industry_label || company.industry || 'Nespecificat';
  const services = websiteData.visible_services;
  const products = websiteData.visible_products;

  const parts: string[] = [`Companie activă în ${industry}.`];
  if (services.length > 0) parts.push(`Servicii vizibile: ${services.slice(0, 3).join(', ')}.`);
  if (products.length > 0) parts.push(`Produse vizibile: ${products.slice(0, 3).join(', ')}.`);

  const empCount = enrichment?.employee_count_estimate || enrichment?.employee_count_exact;
  if (empCount) {
    if (empCount >= 500) parts.push('Companie de dimensiuni mari.');
    else if (empCount >= 100) parts.push('Companie de dimensiuni medii.');
    else parts.push('Companie de dimensiuni mici.');
  }

  return parts.join(' ');
}

// ═══════════ NEEDS INFERENCE ═══════════

function inferLikelyNeeds(
  signalReport: BusinessSignalReport,
  websiteData: OfficialWebsiteData,
  signals: CompanySignals,
): string[] {
  const needs: string[] = [];

  if (signals.hr_relevance === 'high' || websiteData.careers_page_found) {
    needs.push('Kituri de onboarding pentru angajați noi');
    needs.push('Materiale de employer branding');
  }
  if (signals.marketing_event_relevance === 'high') {
    needs.push('Materiale de marketing și promoționale');
    needs.push('Suport vizual pentru evenimente');
  }
  if (signals.corporate_gifting_relevance === 'high') {
    needs.push('Pachete de corporate gifting');
  }
  if (signals.csr_relevance === 'high' || signalReport.signals.find(s => s.signal_key === 'csr_focus')?.detected) {
    needs.push('Produse eco-friendly pentru inițiative CSR');
  }
  if (signals.multi_location_relevance || signalReport.signals.find(s => s.signal_key === 'multi_location')?.detected) {
    needs.push('Materiale de branding pentru sucursale multiple');
  }
  if (signalReport.signals.find(s => s.signal_key === 'growth_signal')?.detected) {
    needs.push('Materiale de comunicare internă pentru perioadă de expansiune');
  }
  if (needs.length === 0) {
    needs.push('Materiale de birou branduite', 'Pachete promoționale standard');
  }
  return [...new Set(needs)].slice(0, 6);
}

// ═══════════ USE CASES ═══════════

function inferUseCases(needs: string[], signals: CompanySignals): string[] {
  const useCases: string[] = [];
  if (signals.hr_relevance !== 'low') useCases.push('Welcome kits pentru angajați noi');
  if (signals.marketing_event_relevance !== 'low') useCases.push('Kit conferință și materiale expo');
  if (signals.corporate_gifting_relevance !== 'low') useCases.push('Pachete protocol și cadouri corporate');
  if (signals.internal_branding_relevance !== 'low') useCases.push('Materiale de identitate vizuală internă');
  if (useCases.length === 0) useCases.push('Papetărie brandată și materiale standard');
  return useCases.slice(0, 5);
}

// ═══════════ MAIN GENERATOR ═══════════

export function generateResearchInsights(
  company: Company,
  enrichment: CompanyEnrichment | null,
  websiteData: OfficialWebsiteData,
  signalReport: BusinessSignalReport,
  companySignals: CompanySignals,
  intent: DetectedIntent | null,
  products: Product[],
  kits: Kit[],
): CommercialResearchInsights {
  const industry = enrichment?.industry_label || company.industry || '';
  const department = company.contact_department || 'General';

  const businessModel = inferBusinessModel(company, enrichment, websiteData);
  const needs = inferLikelyNeeds(signalReport, websiteData, companySignals);
  const useCases = inferUseCases(needs, companySignals);

  // Rank products and kits using existing ranking engine
  let recProducts: string[] = [];
  let recKits: string[] = [];

  if (intent) {
    const ranked = rankProducts(products, industry, department, intent, companySignals);
    recProducts = ranked.slice(0, 5).map(r => r.product.name);

    const rankedK = rankKits(kits, industry, department, intent, companySignals);
    recKits = rankedK.slice(0, 4).map(r => r.kit.name);
  }

  // Pitch angles from signal report
  const pitchAngles: string[] = [];
  if (signalReport.overall_opportunity_level === 'high') {
    pitchAngles.push('Potențial comercial ridicat — abordare consultativă');
  }
  const activeSignals = signalReport.signals.filter(s => s.detected);
  for (const s of activeSignals.slice(0, 3)) {
    pitchAngles.push(`Exploatează semnal: ${s.label}`);
  }
  if (pitchAngles.length === 0) pitchAngles.push('Abordare generică — identifică nevoi specifice în follow-up');

  // Research notes
  const notes: string[] = [];
  if (websiteData.careers_page_found) notes.push('Pagină de cariere identificată — recrutare activă.');
  if (websiteData.visible_services.length > 0) notes.push(`${websiteData.visible_services.length} servicii vizibile pe website.`);
  if (signalReport.overall_opportunity_level === 'high') notes.push('Nivel ridicat de oportunitate pe baza semnalelor detectate.');

  return {
    business_model_summary: businessModel,
    likely_needs: needs,
    likely_use_cases_for_UP: useCases,
    recommended_pitch_angles: pitchAngles,
    recommended_kits_by_research: recKits,
    recommended_products_by_research: recProducts,
    research_notes: notes.join(' '),
    research_generated_at: new Date().toISOString(),
    source_badge: 'Research insight',
    overrides: {},
  };
}

export function applyResearchOverride(
  data: CommercialResearchInsights,
  field: string,
  newValue: any,
): CommercialResearchInsights {
  const original = (data as any)[field] ?? null;
  return {
    ...data,
    [field]: newValue,
    source_badge: 'Manual override',
    overrides: { ...data.overrides, [field]: { original, override: newValue } },
  };
}
