import type { Kit, KitComplexity } from '@/types';
import { seedKits } from '@/data/seed';

export interface KitRecommendation {
  kit: Kit;
  score: number;
  reason: string;
  isAlternative: boolean;
}

interface KitGeneratorInput {
  industry: string;
  department: string;
  briefText: string;
  purpose: string;
  complexity?: KitComplexity;
}

const deptCategoryMap: Record<string, string[]> = {
  hr: ['HR', 'Protocol', 'Office'],
  procurement: ['Office', 'Corporate', 'Industry'],
  marketing: ['Marketing', 'Corporate'],
  management: ['Corporate', 'Protocol', 'Industry'],
};

function getDeptKey(dept: string): string {
  const d = dept.toLowerCase();
  if (d.includes('hr') || d.includes('resurse') || d.includes('people')) return 'hr';
  if (d.includes('achiziț') || d.includes('procurement') || d.includes('supply')) return 'procurement';
  if (d.includes('marketing') || d.includes('comunicare') || d.includes('brand')) return 'marketing';
  return 'management';
}

export function recommendKits(input: KitGeneratorInput): KitRecommendation[] {
  const { industry, department, briefText, purpose, complexity } = input;
  const lower = briefText.toLowerCase();
  const deptKey = getDeptKey(department);
  const preferredCategories = deptCategoryMap[deptKey] || ['Corporate'];

  const scored: KitRecommendation[] = seedKits
    .filter(k => k.active)
    .map(kit => {
      let score = 0;
      let reasons: string[] = [];

      // Category match to department
      if (preferredCategories.includes(kit.category)) {
        score += 25;
        reasons.push(`Potrivit pentru ${department}`);
      }

      // Industry match
      const industryMatch = kit.suggested_industries_json.some(i =>
        i.toLowerCase().includes(industry.toLowerCase().slice(0, 4)) ||
        industry.toLowerCase().includes(i.toLowerCase().slice(0, 4)) ||
        i === 'Toate industriile'
      );
      if (industryMatch) {
        score += 20;
        reasons.push(`Relevant pentru ${industry}`);
      }

      // Purpose match
      const purposeLower = purpose.toLowerCase();
      const kitPurposeLower = kit.purpose.toLowerCase();
      if (kitPurposeLower.includes(purposeLower.split(' ')[0]) || purposeLower.includes(kit.category.toLowerCase())) {
        score += 20;
        reasons.push(`Se potrivește scopului: ${purpose}`);
      }

      // Brief keyword matching
      const kitNameLower = kit.name.toLowerCase();
      const kitWords = kitNameLower.split(/\s+/);
      kitWords.forEach(w => {
        if (w.length > 3 && lower.includes(w)) {
          score += 10;
        }
      });
      kit.components_json.forEach(c => {
        if (lower.includes(c.name.toLowerCase().split(' ')[0])) {
          score += 5;
        }
      });

      // Complexity filter
      if (complexity && kit.complexity === complexity) {
        score += 15;
        reasons.push(`Nivel ${complexity}`);
      }

      // Alternative kit bonus when brief has non-eligible keywords
      if (kit.is_alternative) {
        const altMatch = kit.alternative_for.some(kw => lower.includes(kw));
        if (altMatch) {
          score += 30;
          reasons.push('Alternativă eligibilă pentru cererea detectată');
        }
      }

      return {
        kit,
        score,
        reason: reasons.slice(0, 3).join(' • ') || 'Kit general disponibil',
        isAlternative: kit.is_alternative && kit.alternative_for.some(kw => lower.includes(kw)),
      };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5);
}

export function getKitsByComplexity(complexity: KitComplexity): Kit[] {
  return seedKits.filter(k => k.active && k.complexity === complexity);
}

export function getAlternativeKits(briefText: string): Kit[] {
  const lower = briefText.toLowerCase();
  return seedKits.filter(k =>
    k.active && k.is_alternative && k.alternative_for.some(kw => lower.includes(kw))
  );
}
