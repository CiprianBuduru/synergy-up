// ─── Kit Generator — Facade ─────────────────────────────────────────
// Re-exports from services. Core logic is in src/services/.

import type { Kit, KitComplexity, EligibilityStatus, DetectedPurpose } from '@/types';

export interface KitRecommendation {
  kit: Kit;
  score: number;
  reasons: string[];
  matchDetails: {
    industryMatch: boolean;
    departmentMatch: boolean;
    purposeMatch: boolean;
    complexityMatch: boolean;
    alternativeMatch: boolean;
  };
  isAlternative: boolean;
}

export interface KitGeneratorInput {
  industry: string;
  department: string;
  briefText: string;
  purpose: string;
  detectedPurpose?: DetectedPurpose;
  complexity?: KitComplexity;
  eligibilityVerdict?: EligibilityStatus;
  companyName?: string;
}

export const kitTemplates: Record<KitComplexity, { label: string; description: string; priceRange: string; componentCount: string }> = {
  simplu: { label: 'Simplu', description: 'Kit esențial cu 3-4 componente de bază, ideal pentru volume mari sau buget limitat.', priceRange: '15–35 lei/kit', componentCount: '3–4 componente' },
  standard: { label: 'Standard', description: 'Kit echilibrat cu 5-6 componente, cel mai popular — acoperă nevoile uzuale cu impact vizual bun.', priceRange: '40–80 lei/kit', componentCount: '5–6 componente' },
  premium: { label: 'Premium', description: 'Kit complet cu 6-8 componente premium, finisaje superioare și ambalaj elegant — pentru impresie maximă.', priceRange: '85–150+ lei/kit', componentCount: '6–8 componente' },
};

const purposeKitCategories: Record<string, string[]> = {
  onboarding: ['HR', 'Office'],
  hr_welcome: ['HR'],
  recruitment: ['HR', 'Marketing'],
  eveniment: ['Marketing', 'Corporate'],
  conferinta: ['Marketing'],
  office_use: ['Office', 'Corporate'],
  protocol: ['Protocol'],
  corporate_gifting: ['Protocol', 'Corporate'],
  marketing_campaign: ['Marketing'],
  internal_communication: ['Corporate'],
};

function normalizeDepartment(dept: string): string[] {
  const d = dept.toLowerCase();
  if (d.includes('hr') || d.includes('resurse') || d.includes('people')) return ['HR', 'People & Culture'];
  if (d.includes('achizi') || d.includes('procurement') || d.includes('supply')) return ['Achiziții', 'Administrativ'];
  if (d.includes('marketing') || d.includes('comunicare') || d.includes('brand')) return ['Marketing', 'Comunicare'];
  if (d.includes('vânzări') || d.includes('sales') || d.includes('comercial')) return ['Vânzări', 'Marketing'];
  if (d.includes('it') || d.includes('tech')) return ['IT', 'HR'];
  if (d.includes('csr') || d.includes('responsabilitate')) return ['CSR', 'Marketing'];
  if (d.includes('operațion') || d.includes('logistic')) return ['Operațional', 'Achiziții'];
  return ['Management', 'HR'];
}

/** Recommend kits from a provided kit catalog */
export function recommendKits(input: KitGeneratorInput, allKits: Kit[]): KitRecommendation[] {
  const { industry, department, briefText, purpose, detectedPurpose, complexity, eligibilityVerdict } = input;
  const lower = briefText.toLowerCase();
  const normalizedDepts = normalizeDepartment(department);
  const preferredCategories = detectedPurpose ? (purposeKitCategories[detectedPurpose] || ['Corporate']) : ['Corporate', 'HR'];

  const scored: KitRecommendation[] = allKits
    .filter(k => k.active)
    .map(kit => {
      let score = 0;
      const reasons: string[] = [];
      const matchDetails = { industryMatch: false, departmentMatch: false, purposeMatch: false, complexityMatch: false, alternativeMatch: false };

      if (preferredCategories.includes(kit.category)) { score += 25; reasons.push(`Potrivit pentru scopul: ${purpose || detectedPurpose || 'general'}`); matchDetails.purposeMatch = true; }
      const deptMatch = kit.target_departments.some(td => normalizedDepts.some(nd => td.toLowerCase().includes(nd.toLowerCase()) || nd.toLowerCase().includes(td.toLowerCase())));
      if (deptMatch) { score += 20; reasons.push(`Recomandat pentru departamentul ${department}`); matchDetails.departmentMatch = true; }
      const industryMatch = kit.suggested_industries_json.some(i => i === 'Toate industriile' || i.toLowerCase().includes(industry.toLowerCase().slice(0, 5)) || industry.toLowerCase().includes(i.toLowerCase().slice(0, 5)));
      if (industryMatch) { score += 20; reasons.push(`Relevant pentru industria ${industry}`); matchDetails.industryMatch = true; }
      if (complexity && kit.complexity === complexity) { score += 15; reasons.push(`Nivel ${kitTemplates[complexity].label}`); matchDetails.complexityMatch = true; }

      let keywordScore = 0;
      kit.name.toLowerCase().split(/\s+/).forEach(w => { if (w.length > 3 && lower.includes(w)) keywordScore += 8; });
      kit.components_json.forEach(c => { c.name.toLowerCase().split(/\s+/).forEach(w => { if (w.length > 3 && lower.includes(w)) keywordScore += 4; }); });
      kit.purpose.toLowerCase().split(/\s+/).forEach(w => { if (w.length > 4 && lower.includes(w)) keywordScore += 3; });
      score += Math.min(keywordScore, 25);

      if (kit.is_alternative) {
        const altMatch = kit.alternative_for.some(kw => lower.includes(kw));
        if (altMatch) { score += 35; reasons.push('Alternativă eligibilă pentru cererea detectată'); matchDetails.alternativeMatch = true; }
      }

      if (eligibilityVerdict === 'not_eligible_but_convertible' && kit.is_alternative) score += 10;
      if (eligibilityVerdict === 'eligible' && kit.eligibility_type === 'eligible') score += 5;

      return { kit, score, reasons: reasons.length ? reasons : ['Kit general disponibil'], matchDetails, isAlternative: kit.is_alternative && kit.alternative_for.some(kw => lower.includes(kw)) };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5);
}

export function getKitsByComplexity(allKits: Kit[], complexity: KitComplexity): Kit[] {
  return allKits.filter(k => k.active && k.complexity === complexity);
}

export function getAlternativeKits(allKits: Kit[], briefText: string): Kit[] {
  const lower = briefText.toLowerCase();
  return allKits.filter(k => k.active && k.is_alternative && k.alternative_for.some(kw => lower.includes(kw)));
}

export function getKitsByDepartment(allKits: Kit[], department: string): Kit[] {
  const normalized = normalizeDepartment(department);
  return allKits.filter(k => k.active && k.target_departments.some(td => normalized.some(nd => td.toLowerCase().includes(nd.toLowerCase()))));
}

export function getKitsByIndustry(allKits: Kit[], industry: string): Kit[] {
  return allKits.filter(k => k.active && k.suggested_industries_json.some(i => i === 'Toate industriile' || i.toLowerCase().includes(industry.toLowerCase().slice(0, 5)) || industry.toLowerCase().includes(i.toLowerCase().slice(0, 5))));
}
