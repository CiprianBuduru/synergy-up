// ─── Sales Email Service ─────────────────────────────────────────────
// Generates the presentation sending email.

import type { PitchStrategy } from './pitchStrategyService';
import type { OpportunityInsights } from './opportunityInsightsService';
import type { RankedKit, RankedProduct } from './solutionRankingService';

export interface SalesEmail {
  subject: string;
  body: string;
  greeting: string;
  main_paragraph: string;
  solutions_paragraph: string;
  closing: string;
  signature_placeholder: string;
}

export function generateSalesEmail(
  companyName: string,
  contactName: string,
  pitchStrategy: PitchStrategy,
  insights: OpportunityInsights,
  topProducts: RankedProduct[],
  topKits: RankedKit[],
): SalesEmail {
  const budget = insights.estimated_monthly_budget;
  const budgetStr = budget > 0 ? `${budget.toLocaleString('ro-RO')} RON` : 'un buget semnificativ';

  const subject = `Propunere de colaborare – utilizarea mecanismului unităților protejate | ${companyName}`;

  const greeting = contactName
    ? `Bună ziua, ${contactName},`
    : 'Bună ziua,';

  const main_paragraph = budget > 0
    ? `Pe baza dimensiunii companiei ${companyName}, mecanismul unităților protejate poate genera un buget estimat de aproximativ ${budgetStr} lunar care poate fi utilizat pentru produse și servicii corporate utile.`
    : `Mecanismul unităților protejate oferă companiei ${companyName} posibilitatea de a transforma o obligație legală într-un buget real pentru produse și servicii corporate utile.`;

  // Solutions mention
  const kitMentions = topKits.slice(0, 3).map(k => k.kit.name);
  const productMentions = topProducts.slice(0, 3).map(p => p.product.name);
  const allMentions = [...kitMentions, ...productMentions].slice(0, 4);

  let solutions_paragraph = 'Am pregătit o scurtă prezentare cu câteva exemple de soluții relevante pentru compania dumneavoastră.';
  if (allMentions.length > 0) {
    solutions_paragraph = `Am pregătit o scurtă prezentare cu soluții precum ${allMentions.join(', ')} — adaptate nevoilor companiei dumneavoastră.`;
  }

  const closing = 'Vă stau la dispoziție pentru orice detalii suplimentare și pentru a programa o discuție.';
  const signature_placeholder = '[Nume, Titlu]\nLike Media Group – Unitate Protejată\n[Telefon] | [Email]';

  const body = `${greeting}\n\n${main_paragraph}\n\n${solutions_paragraph}\n\n${closing}\n\nCu stimă,\n${signature_placeholder}`;

  return {
    subject,
    body,
    greeting,
    main_paragraph,
    solutions_paragraph,
    closing,
    signature_placeholder,
  };
}
