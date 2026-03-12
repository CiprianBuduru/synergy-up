// ─── Document Pack Service ───────────────────────────────────────────
// Generates a document pack for client onboarding.

import type { Company, CompanyEnrichment } from '@/types';
import type { OpportunityInsights } from '@/services/opportunityInsightsService';

export interface DocumentItem {
  id: string;
  title: string;
  type: 'agreement' | 'authorization' | 'eligibility_list' | 'company_presentation' | 'product_examples';
  description: string;
  icon: string;
  generated: boolean;
  content?: string;
}

export interface DocumentPack {
  company_id: string;
  company_name: string;
  generated_at: string;
  documents: DocumentItem[];
}

export function generateDocumentPack(
  company: Company,
  enrichment: CompanyEnrichment | null,
  insights: OpportunityInsights | null,
): DocumentPack {
  const documents: DocumentItem[] = [
    {
      id: 'agreement',
      title: 'Acord de Parteneriat',
      type: 'agreement',
      description: 'Acordul cadru de colaborare prin mecanismul unităților protejate.',
      icon: '📋',
      generated: true,
    },
    {
      id: 'authorization',
      title: 'Autorizație Unitate Protejată',
      type: 'authorization',
      description: 'Documentul care atestă autorizarea Equal Up ca unitate protejată.',
      icon: '🏛️',
      generated: true,
    },
    {
      id: 'eligibility_list',
      title: 'Lista Serviciilor Eligibile',
      type: 'eligibility_list',
      description: 'Lista completă a operațiunilor și produselor eligibile prin codurile CAEN autorizate.',
      icon: '📄',
      generated: true,
    },
    {
      id: 'company_presentation',
      title: 'Prezentare Equal Up',
      type: 'company_presentation',
      description: 'Prezentarea generală a companiei și a mecanismului de colaborare.',
      icon: '📊',
      generated: true,
    },
    {
      id: 'product_examples',
      title: 'Exemple Produse și Servicii',
      type: 'product_examples',
      description: 'Catalog cu exemple de produse și servicii relevante pentru compania dumneavoastră.',
      icon: '🎁',
      generated: true,
    },
  ];

  return {
    company_id: company.id,
    company_name: company.company_name,
    generated_at: new Date().toISOString(),
    documents,
  };
}
