import type { Company, CompanyEnrichment, CalculationSnapshot, Brief, Slide, PresentationTone } from '@/types';
import { getRecommendedProducts, getRecommendedKits } from './eligibility-engine';

let slideIdCounter = 100;

function makeSlide(presentationId: string, order: number, type: string, title: string, body: string, meta: Record<string, unknown> = {}): Slide {
  return {
    id: `gen-${slideIdCounter++}`,
    presentation_id: presentationId,
    slide_order: order,
    slide_type: type,
    title,
    body,
    visible: true,
    metadata_json: meta,
  };
}

type DeptKey = 'hr' | 'procurement' | 'marketing' | 'management';

function getDeptKey(dept: string): DeptKey {
  const d = dept.toLowerCase();
  if (d.includes('hr') || d.includes('resurse') || d.includes('people')) return 'hr';
  if (d.includes('achiziț') || d.includes('procurement') || d.includes('supply')) return 'procurement';
  if (d.includes('marketing') || d.includes('comunicare') || d.includes('brand')) return 'marketing';
  return 'management';
}

// ─── Cover subtitles by persona ──────────────────────────────────────

const coverSubtitles: Record<DeptKey, (name: string) => string> = {
  hr: (n) => `Cum puteți transforma o obligație legală în materiale de onboarding\nși employer branding pentru ${n}`,
  procurement: (n) => `O soluție conformă, eficientă și utilă\npentru ${n}`,
  marketing: (n) => `Materiale de branding și campanii — finanțate\ndintr-un buget pe care ${n} îl are deja`,
  management: (n) => `Transformați o obligație legală într-un buget util\npentru ${n}`,
};

// ─── Company overview — richer ──────────────────────────────────────

function buildCompanyOverview(company: Company, enrichment: CompanyEnrichment | null): string {
  const lines: string[] = [];
  const summary = enrichment?.public_summary || company.description;
  if (summary) lines.push(summary);
  lines.push('');

  const parts: string[] = [];
  if (enrichment?.industry_label || company.industry) parts.push(enrichment?.industry_label || company.industry);
  if (enrichment?.headquarters || company.location) parts.push(enrichment?.headquarters || company.location);

  const empCount = enrichment?.employee_count_estimate || enrichment?.employee_count_exact;
  if (empCount) {
    const confidence = enrichment?.enrichment_status === 'verified' ? '' : ' (estimare)';
    parts.push(`~${empCount.toLocaleString('ro-RO')} angajați${confidence}`);
  } else if (company.company_size) {
    parts.push(company.company_size);
  }
  if (parts.length) lines.push(parts.join(' · '));

  // Add signals as insights
  const signals = enrichment?.signals_json;
  if (signals && signals.length > 0) {
    lines.push('');
    lines.push('Semnale relevante:');
    signals.slice(0, 4).forEach(s => {
      lines.push(`• ${s.label}`);
    });
  }
  return lines.join('\n');
}

// ─── Context slide — persona-adapted ────────────────────────────────

const contextByDept: Record<DeptKey, (name: string, signals: string[]) => string> = {
  hr: (n, s) => [
    ...s,
    '',
    `Companiile cu peste 50 de angajați pot redirecționa o taxă legală obligatorie către materiale utile: welcome kits, onboarding packs, articole de employer branding.`,
    '',
    `Pentru ${n}, asta înseamnă materiale profesionale pentru echipă — fără buget suplimentar.`,
  ].join('\n'),
  procurement: (n, s) => [
    ...s,
    '',
    `${n} are deja o obligație legală pe care o poate transforma în achiziții utile: materiale de birou, kituri, print personalizat.`,
    '',
    `Noi oferim o alternativă conformă, cu documentație completă și proces transparent.`,
  ].join('\n'),
  marketing: (n, s) => [
    ...s,
    '',
    `${n} poate finanța materiale de branding, print și promoționale dintr-un buget legal existent, fără cost suplimentar.`,
    '',
    `Rezultat: campanii mai bine susținute, cu impact CSR autentic.`,
  ].join('\n'),
  management: (n, s) => [
    ...s,
    '',
    `${n} plătește lunar o taxă obligatorie care poate fi transformată în buget real: materiale utile, impact CSR, employer branding.`,
    '',
    `Zero cost suplimentar. Doar redirecționare inteligentă.`,
  ].join('\n'),
};

// ─── Mechanism slide — simpler ──────────────────────────────────────

const mechanismByDept: Record<DeptKey, string> = {
  hr: `Companiile cu peste 50 de angajați au obligația de a integra 4% persoane cu dizabilități.

Alternativa: achiziționarea de produse de la o unitate protejată autorizată.

Practic, bugetul pe care îl plătiți deja devine:
• Welcome kits pentru angajați noi
• Materiale de onboarding personalizate
• Articole de employer branding

Like Media Group este unitate protejată autorizată.`,

  procurement: `Obligație legală: 4% din angajați = persoane cu dizabilități.
Dacă nu sunt angajate → taxă lunară obligatorie.

A treia opțiune: achiziții de la o unitate protejată autorizată.

Ce înseamnă pentru achiziții:
• Bugetul taxei devine buget de produse
• Furnizor autorizat, factură conformă
• Proces simplu, fără birocrație suplimentară

Like Media Group este unitate protejată autorizată.`,

  marketing: `Legislația permite companiilor să redirecționeze obligația de 4% către achiziții de la unități protejate.

Ce înseamnă pentru marketing:
• Materiale de branding, print, promoționale
• Kituri pentru evenimente și conferințe
• Toate produse intern, personalizabile

Buget existent → materiale de calitate + componentă CSR.

Like Media Group este unitate protejată autorizată.`,

  management: `Companiile cu peste 50 de angajați au obligația legală de 4%.

Două opțiuni clasice: angajare sau taxă.
A treia opțiune: achiziții de la o unitate protejată.

Ce câștigă compania:
• Obligație transformată în produse utile
• Impact CSR real, vizibil în rapoarte
• Zero cost suplimentar față de taxa obligatorie

Like Media Group este unitate protejată autorizată.`,
};

// ─── Calculation — with prudent messaging for small companies ───────

function buildCalculationSlide(company: Company, calc: CalculationSnapshot, enrichment: CompanyEnrichment | null): { title: string; body: string } {
  const isEstimate = enrichment?.enrichment_status !== 'verified';
  const isSmall = calc.employee_count_used < 50;

  const lines: string[] = [];

  if (isSmall) {
    lines.push(`${company.company_name} are sub 50 de angajați declarați.`);
    lines.push('Obligația legală se aplică de la 50 de angajați.');
    lines.push('');
    lines.push('Cu toate acestea, colaborarea cu o unitate protejată rămâne o opțiune strategică:');
    lines.push('• Acces la produse personalizate de calitate');
    lines.push('• Componentă CSR autentică');
    lines.push('• Pregătire pentru viitoarea creștere a echipei');
  } else {
    lines.push(`Angajați: ${calc.employee_count_used.toLocaleString('ro-RO')}${isEstimate ? ' (estimare)' : ''}`);
    lines.push(`Obligație 4%: ${calc.required_positions_4_percent} poziții`);
    lines.push(`Neacoperite: ${calc.uncovered_positions} poziții`);
    lines.push('');
    lines.push(`Taxă lunară estimată: ${calc.monthly_obligation_estimated.toLocaleString('ro-RO')} RON`);
    lines.push(`Buget lunar disponibil: ${calc.spendable_half_estimated.toLocaleString('ro-RO')} RON`);
    lines.push(`Buget anual estimat: ${(calc.spendable_half_estimated * 12).toLocaleString('ro-RO')} RON`);
    lines.push('');
    if (isEstimate) {
      lines.push('⚠️ Calcul orientativ bazat pe date estimate. Cifrele exacte pot varia.');
    } else {
      lines.push('⚠️ Estimare orientativă — nu constituie consultanță fiscală.');
    }
  }

  return {
    title: isSmall ? `Oportunitate pentru ${company.company_name}` : `Potențialul financiar al ${company.company_name}`,
    body: lines.join('\n'),
  };
}

// ─── Benefits — persona-adapted ─────────────────────────────────────

const benefitsByDept: Record<DeptKey, string> = {
  hr: `✓ Materiale de onboarding profesionale, gata de utilizat
✓ Welcome kits personalizate cu identitatea companiei
✓ Flexibilitate la volum, conținut și periodicitate
✓ Componentă CSR autentică în pachetul de angajare
✓ Partener stabil, cu livrare predictibilă`,

  procurement: `✓ Buget redirecționat, nu cost suplimentar
✓ Furnizor autorizat cu documentație 100% conformă
✓ Proces clar: cerere → ofertă → producție → livrare → factură
✓ Produse utile, nu doar o obligație bifată
✓ Alternativă eligibilă pentru orice cerere internă`,

  marketing: `✓ Materiale de branding produse intern, 100% personalizabile
✓ Suport complet pentru campanii, evenimente, conferințe
✓ Print de calitate — broșuri, bannere, roll-up-uri, flyere
✓ Kituri complete pentru orice tip de activare
✓ Mesaj CSR autentic, integrat natural în comunicare`,

  management: `✓ Obligație legală → investiție cu randament real
✓ Buget estimat clar, vizibil, redirecționabil
✓ Componentă CSR care contează în rapoarte
✓ Furnizor organizat, cu SLA și proces transparent
✓ Zero costuri suplimentare față de ce plătiți deja`,
};

// ─── Next steps — more commercial ───────────────────────────────────

const nextStepsByDept: Record<DeptKey, string> = {
  hr: `1. Confirmați nevoile de onboarding / employer branding
2. Stabilim împreună kitul potrivit echipei
3. Personalizăm cu identitatea vizuală a companiei
4. Livrăm la termen — gata de utilizat

📩 Putem programa o discuție de 15 minute pentru a personaliza oferta.`,

  procurement: `1. Validăm cererea și identificăm alternativele eligibile
2. Confirmăm specificațiile, volumele și termenele
3. Emitem oferta — producție — livrare
4. Factură conformă, documentație completă

📩 Trimitem oferta detaliată în 24h de la confirmare.`,

  marketing: `1. Discutăm obiectivele campaniei sau evenimentului
2. Propunem materialele și kitul cel mai potrivit
3. Personalizăm conform brand guidelines
4. Producție și livrare la termen

📩 Programați un call scurt și pregătim propunerea vizuală.`,

  management: `1. Confirmăm datele financiare și oportunitatea
2. Selectăm produsele relevante pentru companie
3. Personalizare, producție, livrare
4. Facturare conformă, raportare transparentă

📩 Următorul pas: un call de 15 minute cu echipa noastră.`,
};

// ─── About us — tighter ─────────────────────────────────────────────

const aboutUsBody = `Like Media Group — Unitate Protejată Autorizată

Producem intern materiale personalizate de calitate: print, branding, kituri, papetărie și ambalaje.

Coduri CAEN autorizate:
• 7311 — Activități ale agențiilor de publicitate
• 1812 — Alte activități de tipărire
• 1814 — Legătorie și servicii conexe
• 1723 — Fabricarea articolelor de papetărie

Echipa noastră include persoane cu dizabilități — fiecare proiect contribuie la un impact social real.`;

// ─── Main generator ─────────────────────────────────────────────────

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

  // 1. Cover
  slides.push(makeSlide(presentationId, order++, 'cover',
    `Propunere pentru ${name}`,
    coverSubtitles[dept](name)
  ));

  // 2. Company overview — richer
  slides.push(makeSlide(presentationId, order++, 'company_overview', name, buildCompanyOverview(company, enrichment)));

  // 3. Context — persona-adapted
  const signals = enrichment?.signals_json?.map(s => `• ${s.label}`) || [];
  const contextTitle =
    dept === 'hr' ? 'De ce este relevant pentru echipa de HR' :
    dept === 'procurement' ? 'De ce este relevant pentru departamentul de Achiziții' :
    dept === 'marketing' ? 'De ce este relevant pentru Marketing' :
    'De ce este relevant pentru companie';
  slides.push(makeSlide(presentationId, order++, 'context', contextTitle, contextByDept[dept](name, signals)));

  // 4. Mechanism — simplified
  slides.push(makeSlide(presentationId, order++, 'mechanism', 'Cum funcționează', mechanismByDept[dept]));

  // 5. Calculation — with smart messaging
  if (calculation) {
    const calcSlide = buildCalculationSlide(company, calculation, enrichment);
    slides.push(makeSlide(presentationId, order++, 'calculation', calcSlide.title, calcSlide.body));
  }

  // 6. Products — top 4
  const purpose = brief?.requested_purpose || 'General corporate';
  const products = getRecommendedProducts(purpose, company.contact_department);
  if (products.length > 0) {
    const top = products.slice(0, 4);
    const productLines = top.map(p => `▸ ${p.name}\n  ${p.eligible_logic}`).join('\n\n');
    slides.push(makeSlide(presentationId, order++, 'products', 'Produse recomandate', productLines, { product_count: top.length }));
  }

  // 7. Kits — top 2
  const kits = getRecommendedKits(purpose, company.industry);
  if (kits.length > 0) {
    const top = kits.slice(0, 2);
    const kitLines = top.map(k => {
      const comps = k.components_json.map(c => c.name).join(' · ');
      return `▸ ${k.name}\n  ${comps}\n  ${k.eligibility_explanation}`;
    }).join('\n\n');
    slides.push(makeSlide(presentationId, order++, 'kits', 'Kituri recomandate', kitLines));
  }

  // 8. Alternatives — only if needed
  if (brief?.eligibility_status === 'not_eligible_but_convertible' || brief?.eligibility_status === 'conditionally_eligible') {
    slides.push(makeSlide(presentationId, order++, 'alternatives', 'Alternative eligibile',
      `Unele produse din cerere nu se încadrează direct în codurile CAEN autorizate.\n\nAm identificat alternative eligibile care răspund aceluiași scop:\n\n• Produse personalizate intern (tipărire, branding)\n• Kituri compuse din componente eligibile\n• Toate sub codurile CAEN autorizate: 7311 · 1812 · 1814 · 1723\n\nScopul original al cererii este păstrat — doar forma livrabilului se adaptează.`
    ));
  }

  // 9. Benefits — by department
  slides.push(makeSlide(presentationId, order++, 'benefits', 'De ce să colaborăm', benefitsByDept[dept]));

  // 10. About us
  slides.push(makeSlide(presentationId, order++, 'about_us', 'Despre noi', aboutUsBody));

  // 11. Next steps — commercial
  slides.push(makeSlide(presentationId, order++, 'next_steps', 'Pașii următori', nextStepsByDept[dept]));

  return slides;
}
