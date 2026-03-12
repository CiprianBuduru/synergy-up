// ─── Company Signals Engine ─────────────────────────────────────────
// Analyzes company data to generate commercial signals for pitch strategy.

import type { Company, CompanyEnrichment } from '@/types';

export type SignalLevel = 'low' | 'medium' | 'high';

export interface CompanySignals {
  hr_relevance: SignalLevel;
  marketing_event_relevance: SignalLevel;
  corporate_gifting_relevance: SignalLevel;
  csr_relevance: SignalLevel;
  multi_location_relevance: boolean;
  recruiting_signal: boolean;
  internal_branding_relevance: SignalLevel;
}

// ═══════════ SIGNAL COMPUTATION ═══════════

function employeeLevel(count: number | null | undefined): SignalLevel {
  if (!count) return 'low';
  if (count >= 500) return 'high';
  if (count >= 100) return 'medium';
  return 'low';
}

const HR_INDUSTRIES = ['it', 'tech', 'software', 'bancar', 'banking', 'farma', 'energy', 'energie', 'telecom', 'retail', 'fmcg', 'auto'];
const MARKETING_INDUSTRIES = ['retail', 'fmcg', 'horeca', 'turism', 'media', 'entertainment', 'fashion', 'beauty', 'auto'];
const GIFTING_INDUSTRIES = ['bancar', 'banking', 'consultanță', 'consulting', 'avocatură', 'legal', 'farma', 'pharma', 'asigurări', 'insurance', 'imobiliar'];
const CSR_INDUSTRIES = ['energy', 'energie', 'petrol', 'minier', 'mining', 'bancar', 'banking', 'telecom', 'fmcg'];
const BRANDING_INDUSTRIES = ['it', 'tech', 'startup', 'retail', 'fmcg', 'telecom', 'auto'];

function industryMatch(industry: string, list: string[]): boolean {
  const lower = industry.toLowerCase();
  return list.some(i => lower.includes(i));
}

function signalFromIndustryAndSize(industry: string, empCount: number | null | undefined, industryList: string[]): SignalLevel {
  const indMatch = industryMatch(industry, industryList);
  const sizeLevel = employeeLevel(empCount);
  if (indMatch && sizeLevel === 'high') return 'high';
  if (indMatch || sizeLevel === 'high') return 'medium';
  if (sizeLevel === 'medium') return 'medium';
  return 'low';
}

function detectMultiLocation(enrichment: CompanyEnrichment | null, company: Company): boolean {
  if (!enrichment) {
    return /multi|filial|sucursal|sediu|locați|branch|office/i.test(company.location + ' ' + company.description + ' ' + company.notes);
  }
  const signals = enrichment.signals_json || [];
  if (signals.some(s => s.type === 'multi_location' || s.label?.toLowerCase().includes('locați'))) return true;
  return /multi|filial|sucursal|sediu|locați|branch/i.test(
    (enrichment.public_summary || '') + ' ' + (enrichment.headquarters || '')
  );
}

function detectRecruiting(enrichment: CompanyEnrichment | null, company: Company, briefText?: string): boolean {
  const text = [
    enrichment?.public_summary,
    company.description,
    company.notes,
    briefText,
  ].filter(Boolean).join(' ').toLowerCase();
  return /recrutare|recruiting|angajăm|hiring|career|cariere|joburi|poziții deschise|candidat|talent/.test(text);
}

export function analyzeCompanySignals(
  company: Company,
  enrichment: CompanyEnrichment | null,
  briefText?: string,
): CompanySignals {
  const industry = enrichment?.industry_label || company.industry || '';
  const empCount = enrichment?.employee_count_estimate
    || enrichment?.employee_count_exact
    || (enrichment?.employee_count_min && enrichment?.employee_count_max
      ? Math.round((enrichment.employee_count_min + enrichment.employee_count_max) / 2)
      : null);

  return {
    hr_relevance: signalFromIndustryAndSize(industry, empCount, HR_INDUSTRIES),
    marketing_event_relevance: signalFromIndustryAndSize(industry, empCount, MARKETING_INDUSTRIES),
    corporate_gifting_relevance: signalFromIndustryAndSize(industry, empCount, GIFTING_INDUSTRIES),
    csr_relevance: signalFromIndustryAndSize(industry, empCount, CSR_INDUSTRIES),
    multi_location_relevance: detectMultiLocation(enrichment, company),
    recruiting_signal: detectRecruiting(enrichment, company, briefText),
    internal_branding_relevance: signalFromIndustryAndSize(industry, empCount, BRANDING_INDUSTRIES),
  };
}
