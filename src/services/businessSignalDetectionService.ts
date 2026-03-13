// ─── Business Signal Detection Service ──────────────────────────────
// Detects commercial signals from website research and enrichment data.

import type { Company, CompanyEnrichment } from '@/types';
import type { OfficialWebsiteData } from './officialWebsiteResearchService';
import type { CompanySignals } from './companySignalsService';

export interface DetectedBusinessSignal {
  signal_key: string;
  label: string;
  detected: boolean;
  confidence: number;
  source: string;
}

export interface BusinessSignalReport {
  signals: DetectedBusinessSignal[];
  summary: string;
  overall_opportunity_level: 'low' | 'medium' | 'high';
}

const SIGNAL_DEFINITIONS: { key: string; label: string; patterns: RegExp; source_label: string }[] = [
  { key: 'active_recruiting', label: 'Recrutare activă', patterns: /carier[eă]|hiring|recrutare|angajăm|joburi|poziții deschise|candidat/i, source_label: 'Website / Enrichment' },
  { key: 'multi_location', label: 'Companie multi-locație', patterns: /filial[eă]|sucursal[eă]|sediu|locați[ie]|branch|office|birouri/i, source_label: 'Website / Enrichment' },
  { key: 'csr_focus', label: 'Activitate CSR vizibilă', patterns: /csr|responsabilitate social[ăa]|sustenabil|eco|mediu|voluntariat|impact social/i, source_label: 'Website' },
  { key: 'events_marketing', label: 'Evenimente / Marketing activ', patterns: /eveniment|conferinț[ăa]|summit|campanie|lansare|târg|expoziți[ei]|sponsoriz/i, source_label: 'Website' },
  { key: 'growth_signal', label: 'Semnal de creștere', patterns: /creștere|expansiune|noi piețe|investiți[ei]|dezvoltare|extindere|deschidere/i, source_label: 'Website' },
  { key: 'ecommerce', label: 'Canal e-commerce', patterns: /magazin online|e-commerce|shop|comandă online|livrare|coș de cumpărături/i, source_label: 'Website' },
  { key: 'international', label: 'Prezență internațională', patterns: /internațional|global|export|import|piețe externe|subsidiară|multinațional/i, source_label: 'Website / Enrichment' },
  { key: 'employer_branding', label: 'Employer branding activ', patterns: /employer brand|cultură organizațional[ăa]|echipă|valorile noastre|great place/i, source_label: 'Website' },
];

export function detectBusinessSignals(
  company: Company,
  enrichment: CompanyEnrichment | null,
  websiteData: OfficialWebsiteData,
  existingSignals: CompanySignals,
): BusinessSignalReport {
  const allText = [
    websiteData.about_company_text,
    websiteData.visible_services.join(' '),
    websiteData.visible_products.join(' '),
    company.description,
    company.notes,
    enrichment?.public_summary,
  ].filter(Boolean).join(' ');

  const signals: DetectedBusinessSignal[] = SIGNAL_DEFINITIONS.map(def => {
    const detected = def.patterns.test(allText);
    return {
      signal_key: def.key,
      label: def.label,
      detected,
      confidence: detected ? 0.8 : 0.1,
      source: def.source_label,
    };
  });

  // Boost from existing company signals
  if (existingSignals.recruiting_signal) {
    const s = signals.find(s => s.signal_key === 'active_recruiting');
    if (s) { s.detected = true; s.confidence = 0.95; }
  }
  if (existingSignals.multi_location_relevance) {
    const s = signals.find(s => s.signal_key === 'multi_location');
    if (s) { s.detected = true; s.confidence = 0.9; }
  }

  const detectedCount = signals.filter(s => s.detected).length;
  const overall_opportunity_level: 'low' | 'medium' | 'high' =
    detectedCount >= 4 ? 'high' : detectedCount >= 2 ? 'medium' : 'low';

  const detectedLabels = signals.filter(s => s.detected).map(s => s.label);
  const summary = detectedLabels.length > 0
    ? `Semnale detectate: ${detectedLabels.join(', ')}.`
    : 'Nu au fost detectate semnale comerciale semnificative.';

  return { signals, summary, overall_opportunity_level };
}
