import type { Company, CompanyEnrichment, CalculationSnapshot, Brief, Slide, PresentationTone } from '@/types';
import { getRecommendedProducts, getRecommendedKits } from './eligibility-engine';

let slideIdCounter = 100;

function makeSlide(presentationId: string, order: number, type: string, title: string, body: string): Slide {
  return {
    id: `gen-${slideIdCounter++}`,
    presentation_id: presentationId,
    slide_order: order,
    slide_type: type,
    title,
    body,
    visible: true,
    metadata_json: {},
  };
}

export function generatePresentation(
  presentationId: string,
  company: Company,
  enrichment: CompanyEnrichment | null,
  calculation: CalculationSnapshot | null,
  brief: Brief | null,
  tone: PresentationTone
): Slide[] {
  const companyName = company.company_name;
  const slides: Slide[] = [];
  let order = 1;

  // 1. Cover
  slides.push(makeSlide(presentationId, order++, 'cover',
    `Soluții Eligibile pentru ${companyName}`,
    'Transformați o obligație legală într-un buget util pentru compania dumneavoastră.'
  ));

  // 2. About prospect
  const aboutBody = enrichment
    ? `${enrichment.public_summary}\n\nIndustrie: ${enrichment.industry_label}\nSediu: ${enrichment.headquarters}\nAngajați estimați: ${enrichment.employee_count_estimate || 'N/A'}`
    : `${company.description}\n\nIndustrie: ${company.industry}\nLocație: ${company.location}`;
  slides.push(makeSlide(presentationId, order++, 'company_overview', `Despre ${companyName}`, aboutBody));

  // 3. Context
  const contextLines: string[] = [];
  if (enrichment?.signals_json) {
    enrichment.signals_json.forEach(s => contextLines.push(`• ${s.label}`));
  }
  contextLines.push(`\nAcestea sunt semne că ${companyName} poate beneficia de o colaborare cu o unitate protejată autorizată.`);
  slides.push(makeSlide(presentationId, order++, 'context', 'Context Relevant pentru Colaborare', contextLines.join('\n')));

  // 4. Mechanism
  slides.push(makeSlide(presentationId, order++, 'mechanism', 'Mecanismul Unității Protejate',
    'Conform legislației în vigoare, companiile cu peste 50 de angajați au obligația de a angaja persoane cu dizabilități în proporție de 4% din total.\n\nAlternativ, pot achiziționa produse și servicii de la unități protejate autorizate, transformând astfel o obligație legală într-un buget real pentru produse utile.\n\nLike Media Group SRL este unitate protejată autorizată.'
  ));

  // 5. Calculation
  if (calculation) {
    slides.push(makeSlide(presentationId, order++, 'calculation', 'Calcul Orientativ',
      `Număr angajați utilizat: ${calculation.employee_count_used}\nPoziții necesare (4%): ${calculation.required_positions_4_percent}\nPoziții neacoperite: ${calculation.uncovered_positions}\nSalariu minim utilizat: ${calculation.min_wage_used} RON\n\nObligație lunară estimată: ${calculation.monthly_obligation_estimated.toLocaleString('ro-RO')} RON\nBuget disponibil prin UP: ${calculation.spendable_half_estimated.toLocaleString('ro-RO')} RON/lună\n\n⚠️ Acesta este un calcul orientativ, nu constituie consultanță juridică sau fiscală.`
    ));
  }

  // 6. Products
  const purpose = brief?.requested_purpose || 'General corporate';
  const products = getRecommendedProducts(purpose, company.contact_department);
  if (products.length > 0) {
    const productLines = products.map(p => `• ${p.name} - ${p.description}`).join('\n');
    slides.push(makeSlide(presentationId, order++, 'products', 'Produse Eligibile Recomandate', productLines));
  }

  // 7. Kits
  const kits = getRecommendedKits(purpose, company.industry);
  if (kits.length > 0) {
    const kitLines = kits.map(k => {
      const components = k.components_json.map(c => c.name).join(', ');
      return `• ${k.name} - ${k.purpose}\n  Componente: ${components}`;
    }).join('\n\n');
    slides.push(makeSlide(presentationId, order++, 'kits', 'Kituri Eligibile Recomandate', kitLines));
  }

  // 8. Alternatives (if brief has non-eligible items)
  if (brief?.eligibility_status === 'not_eligible_but_convertible' || brief?.eligibility_status === 'conditionally_eligible') {
    slides.push(makeSlide(presentationId, order++, 'alternatives', 'Alternative Eligibile',
      `Cererea inițială conține elemente care nu se încadrează direct în operațiunile autorizate.\n\nAm pregătit alternative eligibile care răspund aceleiași nevoi:\n\n• Produse personalizate intern\n• Kituri compuse și ambalate de echipa noastră\n• Materiale realizate sub codurile CAEN autorizate\n\nSoluțiile propuse sunt relevante și utile pentru compania dumneavoastră.`
    ));
  }

  // 9. Benefits
  slides.push(makeSlide(presentationId, order++, 'benefits', 'Beneficiile Colaborării',
    '✓ Transformați o obligație legală într-un buget util\n✓ Produse și servicii personalizate, relevante\n✓ Flexibilitate și adaptare la nevoile companiei\n✓ Impact social pozitiv - componentă CSR reală\n✓ Incluziune și responsabilitate socială\n✓ Partener organizat, de încredere'
  ));

  // 10. About us
  slides.push(makeSlide(presentationId, order++, 'about_us', 'Despre Like Media Group',
    'Like Media Group SRL este unitate protejată autorizată, specializată în:\n\n• Activități ale agențiilor de publicitate (CAEN 7311)\n• Tipărire și materiale print (CAEN 1812)\n• Legătorie și servicii conexe (CAEN 1814)\n• Fabricarea articolelor de papetărie (CAEN 1723)\n\nEchipa noastră include persoane cu dizabilități care participă activ la procesele de producție și personalizare.'
  ));

  // 11. Next steps
  slides.push(makeSlide(presentationId, order++, 'next_steps', 'Pașii Următori',
    '1. Confirmarea nevoilor specifice ale companiei\n2. Selectarea produselor și kiturilor dorite\n3. Personalizare conform identității vizuale\n4. Producție și livrare\n5. Facturare conform legislației\n\nSuntem pregătiți să discutăm detaliile și să adaptăm propunerea.'
  ));

  return slides;
}
