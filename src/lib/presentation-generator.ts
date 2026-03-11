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

type Department = 'HR' | 'Achiziții' | 'Marketing' | 'Management' | string;

function getDeptKey(dept: string): 'hr' | 'procurement' | 'marketing' | 'management' {
  const d = dept.toLowerCase();
  if (d.includes('hr') || d.includes('resurse') || d.includes('people')) return 'hr';
  if (d.includes('achiziț') || d.includes('procurement') || d.includes('supply')) return 'procurement';
  if (d.includes('marketing') || d.includes('comunicare') || d.includes('brand')) return 'marketing';
  return 'management';
}

const coverSubtitles: Record<ReturnType<typeof getDeptKey>, (name: string) => string> = {
  hr: (n) => `Soluții de onboarding și employer branding pentru ${n}`,
  procurement: (n) => `Alternativă eligibilă și eficientă pentru ${n}`,
  marketing: (n) => `Materiale de branding și campanii pentru ${n}`,
  management: (n) => `Oportunitate financiară inteligentă pentru ${n}`,
};

const contextByDept: Record<ReturnType<typeof getDeptKey>, (name: string, signals: string[]) => string> = {
  hr: (n, s) => [
    ...s,
    '',
    `${n} are potențial de a oferi angajaților materiale de calitate — de la onboarding la employer branding — folosind bugetul disponibil prin unitatea protejată.`,
  ].join('\n'),
  procurement: (n, s) => [
    ...s,
    '',
    `${n} poate redirecționa o obligație legală către produse utile, cu un furnizor autorizat și organizat. Fără costuri suplimentare.`,
  ].join('\n'),
  marketing: (n, s) => [
    ...s,
    '',
    `${n} poate susține campanii de vizibilitate și branding cu materiale produse intern, eligibile prin mecanismul unității protejate.`,
  ].join('\n'),
  management: (n, s) => [
    ...s,
    '',
    `${n} are oportunitatea de a transforma o obligație legală în buget real — utilizat inteligent pentru produse relevante și componentă CSR.`,
  ].join('\n'),
};

const mechanismByDept: Record<ReturnType<typeof getDeptKey>, string> = {
  hr: 'Companiile cu peste 50 de angajați au obligația legală de a integra persoane cu dizabilități (4%).\n\nAlternativ, pot achiziționa de la o unitate protejată autorizată. Acest buget poate finanța direct materiale de onboarding, welcome kits și articole de employer branding.\n\nLike Media Group este unitate protejată autorizată.',
  procurement: 'Conform legii, firmele cu peste 50 de angajați fie angajează persoane cu dizabilități (4%), fie plătesc o taxă lunară. O a treia opțiune: achiziționarea de produse de la o unitate protejată autorizată.\n\nAceastă opțiune transformă taxa într-un buget real pentru produse utile, fără cost suplimentar.\n\nLike Media Group este unitate protejată autorizată.',
  marketing: 'Legislația oferă companiilor posibilitatea de a redirecționa obligația privind persoanele cu dizabilități către achiziții de la unități protejate.\n\nRezultat: buget real pentru materiale promoționale, print, branding — toate produse intern.\n\nLike Media Group este unitate protejată autorizată.',
  management: 'Companiile cu peste 50 de angajați au o obligație legală de 4% privind angajarea persoanelor cu dizabilități.\n\nPrin achiziții de la o unitate protejată, această obligație devine un buget util — fără cost suplimentar, cu impact CSR real.\n\nLike Media Group este unitate protejată autorizată.',
};

const benefitsByDept: Record<ReturnType<typeof getDeptKey>, string> = {
  hr: '✓ Materiale de onboarding profesionale, gata de utilizat\n✓ Welcome kits personalizate cu identitatea companiei\n✓ Flexibilitate la volum și conținut\n✓ Componentă CSR autentică în pachetul de angajare\n✓ Partener de încredere, cu livrare la termen',
  procurement: '✓ Buget redirecționat, fără cost suplimentar\n✓ Furnizor autorizat, cu documentație conformă\n✓ Proces simplu: comandă — producție — livrare — factură\n✓ Produse utile, nu doar obligație bifată\n✓ Alternative eligibile pentru orice cerere',
  marketing: '✓ Materiale de branding produse intern, personalizate\n✓ Suport pentru campanii, evenimente și conferințe\n✓ Print de calitate — broșuri, bannere, roll-up-uri\n✓ Kit-uri complete pentru orice tip de activare\n✓ Componentă CSR integrată în comunicare',
  management: '✓ Obligație legală transformată în investiție utilă\n✓ Impact financiar clar — buget recuperat, nu pierdut\n✓ Componentă CSR reală, vizibilă în rapoarte\n✓ Furnizor organizat, cu proces transparent\n✓ Zero costuri suplimentare față de taxa obligatorie',
};

const nextStepsByDept: Record<ReturnType<typeof getDeptKey>, string> = {
  hr: '1. Ne confirmați nevoile de onboarding / employer branding\n2. Stabilim kitul potrivit echipei\n3. Personalizăm cu identitatea vizuală\n4. Livrăm la termen, gata de utilizat',
  procurement: '1. Validăm cererea și alternativele eligibile\n2. Confirmăm specificațiile și volumele\n3. Producem și livrăm conform calendarului\n4. Emitem factura conformă legislației',
  marketing: '1. Discutăm obiectivele campaniei / evenimentului\n2. Propunem materialele și kitul potrivit\n3. Personalizăm conform brand guidelines\n4. Producem și livrăm la termen',
  management: '1. Confirmăm datele de calcul și oportunitatea\n2. Selectăm produsele relevante\n3. Personalizare și producție\n4. Facturare conformă, documentație completă',
};

export function generatePresentation(
  presentationId: string,
  company: Company,
  enrichment: CompanyEnrichment | null,
  calculation: CalculationSnapshot | null,
  brief: Brief | null,
  tone: PresentationTone
): Slide[] {
  const name = company.company_name;
  const dept = getDeptKey(company.contact_department);
  const slides: Slide[] = [];
  let order = 1;

  // 1. Cover — short, role-adapted
  slides.push(makeSlide(presentationId, order++, 'cover',
    `Propunere pentru ${name}`,
    coverSubtitles[dept](name)
  ));

  // 2. Company overview — concise
  const empInfo = enrichment?.employee_count_estimate ? `${enrichment.employee_count_estimate} angajați` : company.company_size;
  const aboutLines = [
    enrichment?.public_summary || company.description,
    '',
    `${enrichment?.industry_label || company.industry} • ${enrichment?.headquarters || company.location} • ${empInfo}`,
  ];
  slides.push(makeSlide(presentationId, order++, 'company_overview', name, aboutLines.join('\n')));

  // 3. Context — personalized by dept
  const signals = enrichment?.signals_json?.map(s => `• ${s.label}`) || [];
  slides.push(makeSlide(presentationId, order++, 'context',
    dept === 'hr' ? 'De ce este relevant pentru HR' :
    dept === 'procurement' ? 'De ce este relevant pentru Achiziții' :
    dept === 'marketing' ? 'De ce este relevant pentru Marketing' :
    'De ce este relevant pentru companie',
    contextByDept[dept](name, signals)
  ));

  // 4. Mechanism — adapted
  slides.push(makeSlide(presentationId, order++, 'mechanism', 'Cum funcționează', mechanismByDept[dept]));

  // 5. Calculation — clean format
  if (calculation) {
    const lines = [
      `Angajați: ${calculation.employee_count_used}`,
      `Obligație 4%: ${calculation.required_positions_4_percent} poziții`,
      `Neacoperite: ${calculation.uncovered_positions}`,
      '',
      `Obligație lunară: ${calculation.monthly_obligation_estimated.toLocaleString('ro-RO')} RON`,
      `Buget disponibil UP: ${calculation.spendable_half_estimated.toLocaleString('ro-RO')} RON / lună`,
      '',
      '⚠️ Estimare orientativă — nu constituie consultanță fiscală.',
    ];
    slides.push(makeSlide(presentationId, order++, 'calculation', `Oportunitatea ${name}`, lines.join('\n')));
  }

  // 6. Products — top 4, concise
  const purpose = brief?.requested_purpose || 'General corporate';
  const products = getRecommendedProducts(purpose, company.contact_department);
  if (products.length > 0) {
    const top = products.slice(0, 4);
    const productLines = top.map(p => `• ${p.name}\n  ${p.eligible_logic}`).join('\n\n');
    slides.push(makeSlide(presentationId, order++, 'products', 'Produse recomandate', productLines));
  }

  // 7. Kits — top 2, focused
  const kits = getRecommendedKits(purpose, company.industry);
  if (kits.length > 0) {
    const top = kits.slice(0, 2);
    const kitLines = top.map(k => {
      const comps = k.components_json.map(c => c.name).join(' • ');
      return `${k.name}\n${comps}\n${k.eligibility_explanation}`;
    }).join('\n\n');
    slides.push(makeSlide(presentationId, order++, 'kits', 'Kituri recomandate', kitLines));
  }

  // 8. Alternatives — only if needed, concise
  if (brief?.eligibility_status === 'not_eligible_but_convertible' || brief?.eligibility_status === 'conditionally_eligible') {
    slides.push(makeSlide(presentationId, order++, 'alternatives', 'Alternative eligibile',
      `Unele produse solicitate nu se încadrează direct. Am identificat alternative eligibile care răspund aceluiași scop:\n\n• Produse personalizate intern\n• Kituri compuse de echipa noastră\n• Toate sub codurile CAEN autorizate`
    ));
  }

  // 9. Benefits — by department
  slides.push(makeSlide(presentationId, order++, 'benefits', 'De ce să colaborăm', benefitsByDept[dept]));

  // 10. About us — shorter
  slides.push(makeSlide(presentationId, order++, 'about_us', 'Like Media Group',
    'Unitate protejată autorizată\n\nCoduri CAEN: 7311 • 1812 • 1814 • 1723\n\nPersonalizăm, tipărim, legăm și ambalăm — toate realizate intern, de o echipă care include persoane cu dizabilități.'
  ));

  // 11. Next steps — by department
  slides.push(makeSlide(presentationId, order++, 'next_steps', 'Pași următori', nextStepsByDept[dept]));

  return slides;
}
