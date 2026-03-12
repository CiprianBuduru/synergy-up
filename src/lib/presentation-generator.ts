// ─── Presentation Generator v2 ──────────────────────────────────────
// Uses Dynamic Slide Engine, Intelligence Core, and adaptive tone system.

import type { Company, CompanyEnrichment, CalculationSnapshot, Brief, Slide, PresentationTone, Product, Kit } from '@/types';
import type { CompanySignals } from '@/services/companySignalsService';
import type { DetectedIntent } from '@/services/intentDetectionService';
import { INTENT_LABELS } from '@/services/intentDetectionService';
import type { PitchStrategy } from '@/services/pitchStrategyService';
import type { RankedProduct, RankedKit } from '@/services/solutionRankingService';
import { buildSlideSequence, type SlideDecision, type DynamicSlideInput } from '@/services/dynamicSlideService';
import type { EligibilityResult } from '@/types';

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

// ═══════════ COVER ═══════════

const coverSubtitles: Record<DeptKey, (name: string) => string> = {
  hr: (n) => `Materiale de onboarding și employer branding\npentru echipa ${n}`,
  procurement: (n) => `Soluție conformă și eficientă\npentru ${n}`,
  marketing: (n) => `Materiale de branding și campanii\ndin bugetul existent al ${n}`,
  management: (n) => `Obligație legală → buget util\npentru ${n}`,
};

// ═══════════ COMPANY CONTEXT + PITCH ANGLE ═══════════

function buildCompanyContextSlide(
  company: Company,
  enrichment: CompanyEnrichment | null,
  signals: CompanySignals | null,
  pitchStrategy: PitchStrategy | null,
  dept: DeptKey,
): { title: string; body: string } {
  const name = company.company_name;
  const lines: string[] = [];

  // Company overview — brief
  const summary = enrichment?.public_summary || company.description;
  if (summary) lines.push(summary);

  const parts: string[] = [];
  if (enrichment?.industry_label || company.industry) parts.push(enrichment?.industry_label || company.industry);
  if (enrichment?.headquarters || company.location) parts.push(enrichment?.headquarters || company.location);
  const empCount = enrichment?.employee_count_estimate || enrichment?.employee_count_exact;
  if (empCount) parts.push(`~${empCount.toLocaleString('ro-RO')} angajați`);
  if (parts.length) lines.push(parts.join(' · '));

  lines.push('');

  // Pitch angle
  if (pitchStrategy) {
    lines.push(pitchStrategy.body);
  } else {
    // Fallback tone-based context
    const contextMap: Record<DeptKey, string> = {
      hr: `${name} poate transforma o obligație legală în materiale utile pentru echipă — welcome kits, onboarding packs, employer branding.`,
      procurement: `${name} poate redirecționa o taxă obligatorie către achiziții concrete: materiale de birou, print personalizat, kituri.`,
      marketing: `${name} poate finanța materiale de branding și campanii dintr-un buget legal existent, fără cost suplimentar.`,
      management: `${name} plătește lunar o taxă care poate deveni buget real: materiale utile, impact CSR, employer branding.`,
    };
    lines.push(contextMap[dept]);
  }

  // Signals summary
  if (signals) {
    const signalLines: string[] = [];
    if (signals.recruiting_signal) signalLines.push('Recrutare activă detectată');
    if (signals.multi_location_relevance) signalLines.push('Prezență multi-locație');
    if (signals.hr_relevance === 'high') signalLines.push('Relevanță HR ridicată');
    if (signals.marketing_event_relevance === 'high') signalLines.push('Potențial marketing & evenimente');
    if (signals.corporate_gifting_relevance === 'high') signalLines.push('Oportunitate corporate gifting');
    if (signalLines.length > 0) {
      lines.push('');
      signalLines.forEach(s => lines.push(`• ${s}`));
    }
  }

  return {
    title: `Context și oportunitate pentru ${name}`,
    body: lines.join('\n'),
  };
}

// ═══════════ BRIEF INTERPRETATION ═══════════

function buildBriefInterpretationSlide(brief: Brief, intent: DetectedIntent | null, eligibility: EligibilityResult | null): { title: string; body: string } {
  const lines: string[] = [];
  lines.push('Cererea dumneavoastră a fost analizată automat:');
  lines.push('');

  if (brief.requested_purpose) lines.push(`▸ Scop detectat: ${brief.requested_purpose}`);
  if (brief.department_detected) lines.push(`▸ Departament: ${brief.department_detected}`);
  if (brief.target_audience) lines.push(`▸ Audiență: ${brief.target_audience}`);

  if (intent) {
    lines.push(`▸ Intenție principală: ${INTENT_LABELS[intent.primary_intent] || intent.primary_intent}`);
    if (intent.secondary_intent) {
      lines.push(`▸ Intenție secundară: ${INTENT_LABELS[intent.secondary_intent] || intent.secondary_intent}`);
    }
  }

  lines.push('');

  if (eligibility) {
    const verdictMap: Record<string, string> = {
      eligible: '✓ Cererea este 100% eligibilă',
      conditionally_eligible: '⚠ Cererea este parțial eligibilă — am identificat alternative',
      not_eligible_but_convertible: '⚠ Cererea nu este eligibilă direct — dar avem soluții alternative',
    };
    lines.push(verdictMap[eligibility.verdict] || eligibility.verdict);
    if (eligibility.explanation) {
      lines.push('');
      lines.push(eligibility.explanation.slice(0, 200));
    }
  }

  return { title: 'Interpretarea solicitării', body: lines.join('\n') };
}

// ═══════════ MECHANISM ═══════════

const mechanismByDept: Record<DeptKey, string> = {
  hr: `Mecanismul unităților protejate permite companiilor să transforme o obligație legală într-un buget utilizabil pentru produse și servicii utile.

Companiile cu peste 50 de angajați au obligația de a integra 4% persoane cu dizabilități. Alternativa: achiziții de la o unitate protejată autorizată.

Practic, bugetul pe care îl plătiți deja devine:
• Welcome kits pentru angajați noi
• Materiale de onboarding personalizate
• Articole de employer branding

Like Media Group — unitate protejată autorizată.`,

  procurement: `Mecanismul unităților protejate permite companiilor să transforme o obligație legală într-un buget utilizabil pentru produse și servicii utile.

Obligație legală: 4% din angajați = persoane cu dizabilități.
Alternativa: achiziții de la un furnizor autorizat.

Ce înseamnă pentru achiziții:
• Bugetul taxei devine buget de produse utile
• Furnizor autorizat, factură conformă
• Proces simplu, fără birocrație suplimentară

Like Media Group — unitate protejată autorizată.`,

  marketing: `Mecanismul unităților protejate permite companiilor să transforme o obligație legală într-un buget utilizabil pentru produse și servicii utile.

Legislația permite redirecționarea obligației de 4% către achiziții de la unități protejate.

Ce înseamnă pentru marketing:
• Materiale de branding, print, promoționale
• Kituri pentru evenimente și conferințe
• Toate produse intern, personalizabile

Buget existent → materiale de calitate + componentă CSR.`,

  management: `Mecanismul unităților protejate permite companiilor să transforme o obligație legală într-un buget utilizabil pentru produse și servicii utile.

Companiile cu peste 50 de angajați au obligația legală de 4%.
A treia opțiune: achiziții de la o unitate protejată.

Ce câștigă compania:
• Obligație transformată în produse utile
• Impact CSR real, vizibil în rapoarte
• Zero cost suplimentar față de taxa obligatorie`,
};

// ═══════════ CALCULATION ═══════════

function buildCalculationSlide(company: Company, calc: CalculationSnapshot, enrichment: CompanyEnrichment | null): { title: string; body: string } {
  const isEstimate = enrichment?.enrichment_status !== 'verified';
  const isSmall = calc.employee_count_used < 50;
  const lines: string[] = [];

  if (isSmall) {
    lines.push(`${company.company_name} are sub 50 de angajați.`);
    lines.push('Obligația legală se aplică de la 50 de angajați.');
    lines.push('');
    lines.push('Colaborarea cu o unitate protejată rămâne strategică:');
    lines.push('• Acces la produse personalizate de calitate');
    lines.push('• Componentă CSR autentică');
    lines.push('• Pregătire pentru creșterea echipei');
  } else {
    lines.push(`Angajați: ${calc.employee_count_used.toLocaleString('ro-RO')}${isEstimate ? ' (estimare)' : ''}`);
    lines.push(`Obligație 4%: ${calc.required_positions_4_percent} poziții`);
    lines.push(`Neacoperite: ${calc.uncovered_positions} poziții`);
    lines.push('');
    lines.push(`Taxă lunară estimată: ${calc.monthly_obligation_estimated.toLocaleString('ro-RO')} RON`);
    lines.push(`Buget lunar disponibil: ${calc.spendable_half_estimated.toLocaleString('ro-RO')} RON`);
    lines.push(`Buget anual estimat: ~${(calc.spendable_half_estimated * 12).toLocaleString('ro-RO')} RON`);
    lines.push('');
    lines.push(isEstimate
      ? 'Calcul orientativ bazat pe date estimate. Cifrele exacte pot varia.'
      : 'Estimare orientativă — nu constituie consultanță fiscală.');
  }

  return {
    title: isSmall ? `Oportunitate pentru ${company.company_name}` : `Impact financiar estimat`,
    body: lines.join('\n'),
  };
}

// ═══════════ RELEVANT SOLUTIONS ═══════════

function buildSolutionsSlide(rankedProducts: RankedProduct[]): { title: string; body: string } {
  const top = rankedProducts.slice(0, 5);
  const lines = top.map((rp, i) => {
    const p = rp.product;
    const ops = p.internal_operations_json?.slice(0, 2).join(', ') || '';
    const caen = p.supporting_caen_codes_json?.slice(0, 2).join(', ') || '';
    return `${i + 1}. ${p.name}\n   ${p.description?.slice(0, 80) || ''}\n   Operațiuni: ${ops} · CAEN: ${caen}`;
  });

  return {
    title: 'Soluții relevante pentru compania dumneavoastră',
    body: lines.join('\n\n'),
  };
}

// ═══════════ RECOMMENDED KITS ═══════════

function buildKitsSlide(rankedKits: RankedKit[]): { title: string; body: string } {
  const top = rankedKits.slice(0, 3);
  const lines = top.map((rk, i) => {
    const k = rk.kit;
    const comps = k.components_json.map(c => c.name).join(' · ');
    return `${i + 1}. ${k.name}\n   ${comps}\n   ${k.eligibility_explanation?.slice(0, 100) || ''}`;
  });

  return {
    title: 'Kituri recomandate',
    body: lines.join('\n\n'),
  };
}

// ═══════════ ALTERNATIVES ═══════════

function buildAlternativesSlide(eligibility: EligibilityResult | null): { title: string; body: string } {
  const lines: string[] = [];
  lines.push('Am identificat alternative eligibile care răspund aceluiași scop:');
  lines.push('');

  if (eligibility?.alternative_products?.length) {
    lines.push('Produse alternative:');
    eligibility.alternative_products.slice(0, 5).forEach(p => lines.push(`• ${p}`));
    lines.push('');
  }
  if (eligibility?.alternative_kits?.length) {
    lines.push('Kituri alternative:');
    eligibility.alternative_kits.forEach(k => lines.push(`• ${k}`));
    lines.push('');
  }
  if (eligibility?.sales_angle) {
    lines.push(eligibility.sales_angle);
  }

  lines.push('');
  lines.push('Toate alternativele sunt realizate intern, sub codurile CAEN autorizate: 7311 · 1812 · 1814 · 1723.');

  return { title: 'Alternative eligibile', body: lines.join('\n') };
}

// ═══════════ BENEFITS ═══════════

const benefitsByDept: Record<DeptKey, string> = {
  hr: `✓ Materiale de onboarding profesionale, gata de utilizat
✓ Welcome kits personalizate cu identitatea companiei
✓ Flexibilitate la volum, conținut și periodicitate
✓ Impact social pozitiv — componentă CSR autentică
✓ Partener stabil, cu livrare predictibilă`,

  procurement: `✓ Utilizare eficientă a mecanismului UP — buget redirecționat, nu cost suplimentar
✓ Furnizor autorizat cu documentație 100% conformă
✓ Produse utile pentru companie, nu doar o obligație bifată
✓ Flexibilitate în alegerea soluțiilor
✓ Impact social pozitiv — fiecare comandă contează`,

  marketing: `✓ Materiale de branding produse intern, 100% personalizabile
✓ Suport complet pentru campanii, evenimente, conferințe
✓ Print de calitate — broșuri, bannere, roll-up-uri, flyere
✓ Flexibilitate în alegerea soluțiilor creative
✓ Impact social pozitiv integrat natural în comunicare`,

  management: `✓ Utilizare eficientă a mecanismului UP — investiție cu randament real
✓ Buget clar, vizibil, redirecționabil
✓ Impact social pozitiv — CSR relevant în rapoarte
✓ Flexibilitate în alegerea soluțiilor
✓ Zero costuri suplimentare față de ce plătiți deja`,
};

// ═══════════ ABOUT US ═══════════

const aboutUsBody = `Like Media Group — Unitate Protejată Autorizată

Producem intern materiale personalizate de calitate: print, branding, kituri, papetărie și ambalaje.

Coduri CAEN autorizate:
• 7311 — Activități ale agențiilor de publicitate
• 1812 — Alte activități de tipărire
• 1814 — Legătorie și servicii conexe
• 1723 — Fabricarea articolelor de papetărie

Echipa noastră include persoane cu dizabilități — fiecare proiect contribuie la un impact social real.`;

// ═══════════ NEXT STEPS ═══════════

const nextStepsByDept: Record<DeptKey, string> = {
  hr: `1. Identificarea produselor sau kiturilor relevante pentru echipă
2. Confirmarea eligibilității și a specificațiilor
3. Stabilirea volumului estimat
4. Transmiterea acordului de parteneriat

Programați o discuție de 15 minute pentru a personaliza oferta.`,

  procurement: `1. Identificarea produselor sau kiturilor relevante
2. Confirmarea eligibilității și a specificațiilor
3. Stabilirea volumului estimat și a termenelor
4. Transmiterea acordului de parteneriat

Trimitem oferta detaliată în 24h de la confirmare.`,

  marketing: `1. Identificarea materialelor relevante pentru campanie
2. Confirmarea eligibilității și a brand guidelines
3. Stabilirea volumului estimat
4. Transmiterea acordului de parteneriat

Programați un call și pregătim propunerea vizuală.`,

  management: `1. Identificarea produselor sau kiturilor relevante
2. Confirmarea eligibilității
3. Stabilirea volumului estimat
4. Transmiterea acordului de parteneriat

Următorul pas: un call de 15 minute cu echipa noastră.`,
};

// ═══════════ MAIN GENERATOR v2 ═══════════

export interface GeneratorContext {
  signals?: CompanySignals | null;
  intent?: DetectedIntent | null;
  pitchStrategy?: PitchStrategy | null;
  eligibility?: EligibilityResult | null;
  rankedProducts?: RankedProduct[];
  rankedKits?: RankedKit[];
}

export function generatePresentation(
  presentationId: string,
  company: Company,
  enrichment: CompanyEnrichment | null,
  calculation: CalculationSnapshot | null,
  brief: Brief | null,
  tone: PresentationTone,
  context?: GeneratorContext,
): Slide[] {
  const name = company.company_name;
  const dept = getDeptKey(company.contact_department);
  const slides: Slide[] = [];
  let order = 1;

  const signals = context?.signals || null;
  const intent = context?.intent || null;
  const pitchStrategy = context?.pitchStrategy || null;
  const eligibility = context?.eligibility || null;
  const rankedProducts = context?.rankedProducts || [];
  const rankedKits = context?.rankedKits || [];

  // Build dynamic slide sequence
  const slideInput: DynamicSlideInput = {
    enrichment, signals: signals || { hr_relevance: 'low', marketing_event_relevance: 'low', corporate_gifting_relevance: 'low', csr_relevance: 'low', multi_location_relevance: false, recruiting_signal: false, internal_branding_relevance: 'low' },
    intent, industry: company.industry, calculation, eligibility, brief, rankedProducts, rankedKits, pitchStrategy,
  };
  const sequence = buildSlideSequence(slideInput);

  // Generate slide content for each decision
  for (const decision of sequence) {
    const slide = generateSlideContent(presentationId, order, decision, {
      company, enrichment, calculation, brief, dept, name, signals, intent, pitchStrategy, eligibility, rankedProducts, rankedKits,
    });
    if (slide) {
      slides.push(slide);
      order++;
    }
  }

  return slides;
}

interface SlideContext {
  company: Company;
  enrichment: CompanyEnrichment | null;
  calculation: CalculationSnapshot | null;
  brief: Brief | null;
  dept: DeptKey;
  name: string;
  signals: CompanySignals | null;
  intent: DetectedIntent | null;
  pitchStrategy: PitchStrategy | null;
  eligibility: EligibilityResult | null;
  rankedProducts: RankedProduct[];
  rankedKits: RankedKit[];
}

function generateSlideContent(presentationId: string, order: number, decision: SlideDecision, ctx: SlideContext): Slide | null {
  switch (decision.type) {
    case 'cover':
      return makeSlide(presentationId, order, 'cover',
        `Propunere pentru ${ctx.name}`,
        coverSubtitles[ctx.dept](ctx.name),
        { emphasisLevel: decision.emphasisLevel }
      );

    case 'company_context': {
      const cc = buildCompanyContextSlide(ctx.company, ctx.enrichment, ctx.signals, ctx.pitchStrategy, ctx.dept);
      return makeSlide(presentationId, order, 'company_context', cc.title, cc.body, { emphasisLevel: decision.emphasisLevel });
    }

    case 'brief_interpretation': {
      if (!ctx.brief) return null;
      const bi = buildBriefInterpretationSlide(ctx.brief, ctx.intent, ctx.eligibility);
      return makeSlide(presentationId, order, 'brief_interpretation', bi.title, bi.body, { emphasisLevel: decision.emphasisLevel });
    }

    case 'opportunity_mechanism':
      return makeSlide(presentationId, order, 'mechanism',
        'Cum funcționează mecanismul', mechanismByDept[ctx.dept],
        { emphasisLevel: decision.emphasisLevel }
      );

    case 'opportunity_estimate': {
      if (!ctx.calculation) return null;
      const cs = buildCalculationSlide(ctx.company, ctx.calculation, ctx.enrichment);
      return makeSlide(presentationId, order, 'calculation', cs.title, cs.body, { emphasisLevel: decision.emphasisLevel });
    }

    case 'relevant_solutions': {
      if (ctx.rankedProducts.length === 0) return null;
      const ss = buildSolutionsSlide(ctx.rankedProducts);
      return makeSlide(presentationId, order, 'products', ss.title, ss.body, {
        emphasisLevel: decision.emphasisLevel,
        product_count: Math.min(ctx.rankedProducts.length, 5),
        products: ctx.rankedProducts.slice(0, 5).map(rp => ({
          name: rp.product.name,
          description: rp.product.description?.slice(0, 80),
          operations: rp.product.internal_operations_json?.slice(0, 2),
          caen: rp.product.supporting_caen_codes_json?.slice(0, 2),
          score: rp.score,
          category: rp.product.category,
        })),
      });
    }

    case 'recommended_kits': {
      if (ctx.rankedKits.length === 0) return null;
      const ks = buildKitsSlide(ctx.rankedKits);
      return makeSlide(presentationId, order, 'kits', ks.title, ks.body, {
        emphasisLevel: decision.emphasisLevel,
        kits: ctx.rankedKits.slice(0, 3).map(rk => ({
          name: rk.kit.name,
          components: rk.kit.components_json.map(c => c.name),
          score: rk.score,
          category: rk.kit.category,
          complexity: rk.kit.complexity,
        })),
      });
    }

    case 'alternative_solutions': {
      const as = buildAlternativesSlide(ctx.eligibility);
      return makeSlide(presentationId, order, 'alternatives', as.title, as.body, { emphasisLevel: decision.emphasisLevel });
    }

    case 'benefits':
      return makeSlide(presentationId, order, 'benefits', 'Beneficiile colaborării', benefitsByDept[ctx.dept], { emphasisLevel: decision.emphasisLevel });

    case 'about_equal_up':
      return makeSlide(presentationId, order, 'about_us', 'Despre noi', aboutUsBody, { emphasisLevel: decision.emphasisLevel });

    case 'next_steps':
      return makeSlide(presentationId, order, 'next_steps', 'Pașii următori', nextStepsByDept[ctx.dept], { emphasisLevel: decision.emphasisLevel });

    default:
      return null;
  }
}
