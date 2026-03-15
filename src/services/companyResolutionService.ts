// ─── Company Resolution Engine ─────────────────────────────
// Confirms whether a company exists in the local DB without auto-creating.
// Returns a ranked list of candidates with resolution status.

import type { Company } from '@/types';

// ─── Types ──────────────────────────────────────────────────

export type ResolutionStatus =
  | 'confirmed'           // Exact match found in DB
  | 'likely_match'        // Fuzzy match — high confidence but not exact
  | 'unverified'          // No match found — company name from parser only
  | 'manual_review';      // Ambiguous — multiple candidates or low confidence

export interface ResolutionCandidate {
  company: Company;
  matchType: 'exact' | 'fuzzy_name' | 'fuzzy_legal' | 'partial';
  confidence: number;     // 0–1
  matchDetail: string;    // Human-readable explanation
}

export interface ResolutionResult {
  status: ResolutionStatus;
  inputName: string;
  candidates: ResolutionCandidate[];
  bestMatch: ResolutionCandidate | null;
  message: string;
}

// ─── Helpers ────────────────────────────────────────────────

function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?'"()[\]{}]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');  // strip diacritics
}

/** Legal suffixes to strip for normalized comparison */
const LEGAL_SUFFIXES = ['s\\.?r\\.?l\\.?', 's\\.?a\\.?', 'srl', 'sa', 'snc', 'scs', 'pfa', 's r l', 's a'];
// Short forms (II, IF) only as standalone words at end to avoid false positives
const SHORT_LEGAL_SUFFIXES = ['ii', 'if'];

/** Remove common legal suffixes for comparison */
function stripLegalSuffix(name: string): string {
  let result = normalize(name);
  // Strip longer suffixes first
  const longPattern = new RegExp(`\\b(${LEGAL_SUFFIXES.join('|')})\\b`, 'gi');
  result = result.replace(longPattern, '');
  // Strip short suffixes only at end of string
  const shortPattern = new RegExp(`\\b(${SHORT_LEGAL_SUFFIXES.join('|')})\\s*$`, 'gi');
  result = result.replace(shortPattern, '');
  return result.trim();
}

function levenshteinSimilarity(a: string, b: string): number {
  const an = normalize(a);
  const bn = normalize(b);
  if (an === bn) return 1;
  const maxLen = Math.max(an.length, bn.length);
  if (maxLen === 0) return 1;

  // Simple Levenshtein
  const matrix: number[][] = [];
  for (let i = 0; i <= an.length; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= bn.length; j++) {
      if (i === 0) { matrix[i][j] = j; continue; }
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (an[i - 1] === bn[j - 1] ? 0 : 1),
      );
    }
  }
  const distance = matrix[an.length][bn.length];
  return 1 - distance / maxLen;
}

// ─── Core Resolution Logic ─────────────────────────────────

export function resolveCompany(
  inputName: string,
  companies: Company[],
): ResolutionResult {
  const trimmed = inputName.trim();
  if (!trimmed) {
    return {
      status: 'manual_review',
      inputName: trimmed,
      candidates: [],
      bestMatch: null,
      message: 'Nu a fost furnizat un nume de companie.',
    };
  }

  const normalizedInput = normalize(trimmed);
  const strippedInput = stripLegalSuffix(trimmed);
  const candidates: ResolutionCandidate[] = [];

  console.log('[ResolutionEngine] resolving:', trimmed);

  for (const company of companies) {
    const normName = normalize(company.company_name || '');
    const normLegal = normalize(company.legal_name || '');
    const strippedName = stripLegalSuffix(company.company_name || '');
    const strippedLegal = stripLegalSuffix(company.legal_name || '');

    // 1. Exact match on company_name or legal_name
    if (normName === normalizedInput || normLegal === normalizedInput) {
      candidates.push({
        company,
        matchType: 'exact',
        confidence: 1.0,
        matchDetail: `Potrivire exactă: "${company.company_name}"`,
      });
      continue;
    }

    // 2. Exact match after stripping legal suffixes
    if (strippedName === strippedInput || strippedLegal === strippedInput) {
      candidates.push({
        company,
        matchType: 'exact',
        confidence: 0.95,
        matchDetail: `Verified (normalized match): "${company.company_name}"`,
      });
      continue;
    }

    // 3. Contains match (one includes the other)
    if (normName.includes(normalizedInput) || normalizedInput.includes(normName)) {
      const shorter = Math.min(normName.length, normalizedInput.length);
      const longer = Math.max(normName.length, normalizedInput.length);
      const ratio = shorter / longer;
      if (ratio > 0.5) {
        candidates.push({
          company,
          matchType: 'fuzzy_name',
          confidence: 0.7 + ratio * 0.2,
          matchDetail: `Nume parțial inclus: "${company.company_name}"`,
        });
        continue;
      }
    }

    if (normLegal && (normLegal.includes(normalizedInput) || normalizedInput.includes(normLegal))) {
      const shorter = Math.min(normLegal.length, normalizedInput.length);
      const longer = Math.max(normLegal.length, normalizedInput.length);
      const ratio = shorter / longer;
      if (ratio > 0.5) {
        candidates.push({
          company,
          matchType: 'fuzzy_legal',
          confidence: 0.65 + ratio * 0.2,
          matchDetail: `Denumire legală parțial inclusă: "${company.legal_name}"`,
        });
        continue;
      }
    }

    // 4. Levenshtein similarity
    const simName = levenshteinSimilarity(strippedInput, strippedName);
    const simLegal = normLegal ? levenshteinSimilarity(strippedInput, strippedLegal) : 0;
    const bestSim = Math.max(simName, simLegal);

    if (bestSim >= 0.7) {
      candidates.push({
        company,
        matchType: 'partial',
        confidence: bestSim * 0.85,
        matchDetail: `Similaritate ${Math.round(bestSim * 100)}% cu "${simName >= simLegal ? company.company_name : company.legal_name}"`,
      });
    }
  }

  // Sort by confidence desc
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Determine status
  const bestMatch = candidates[0] || null;

  let status: ResolutionStatus;
  let message: string;

  if (!bestMatch) {
    status = 'unverified';
    message = `Compania "${trimmed}" nu a fost găsită în baza de date. Necesită verificare manuală.`;
    console.log('[ResolutionEngine] status: unverified — no candidates');
  } else if (bestMatch.confidence >= 0.95) {
    status = 'confirmed';
    message = `Compania "${bestMatch.company.company_name}" confirmată ca entitate existentă.`;
    console.log('[ResolutionEngine] status: confirmed —', bestMatch.company.id, bestMatch.matchDetail);
  } else if (bestMatch.confidence >= 0.7) {
    // Check if multiple close candidates → manual review
    const closeOthers = candidates.filter((c, i) => i > 0 && c.confidence >= bestMatch.confidence - 0.15);
    if (closeOthers.length > 0) {
      status = 'manual_review';
      message = `Mai multe potriviri posibile pentru "${trimmed}". Selectează manual compania corectă.`;
      console.log('[ResolutionEngine] status: manual_review — multiple close candidates');
    } else {
      status = 'likely_match';
      message = `Potrivire probabilă: "${bestMatch.company.company_name}" (${Math.round(bestMatch.confidence * 100)}% încredere).`;
      console.log('[ResolutionEngine] status: likely_match —', bestMatch.company.id, bestMatch.matchDetail);
    }
  } else {
    status = 'unverified';
    message = `Nicio potrivire suficient de bună pentru "${trimmed}". Companie neverificată.`;
    console.log('[ResolutionEngine] status: unverified — low confidence:', bestMatch.confidence);
  }

  return {
    status,
    inputName: trimmed,
    candidates: candidates.slice(0, 5), // Top 5
    bestMatch,
    message,
  };
}

// ─── Status Labels & Config ─────────────────────────────────

export const RESOLUTION_STATUS_CONFIG: Record<ResolutionStatus, {
  label: string;
  description: string;
  color: string;
  icon: string;
}> = {
  confirmed: {
    label: 'Confirmed official entity',
    description: 'Compania a fost găsită și confirmată în baza de date.',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: 'shield-check',
  },
  likely_match: {
    label: 'Likely match found',
    description: 'Am găsit o potrivire probabilă. Confirmă manual dacă este corectă.',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: 'search',
  },
  unverified: {
    label: 'Unverified company',
    description: 'Compania nu a fost găsită. Poți continua cu brief draft sau adaugă manual.',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: 'alert-triangle',
  },
  manual_review: {
    label: 'Manual review needed',
    description: 'Mai multe potriviri posibile. Selectează compania corectă din lista de candidați.',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    icon: 'help-circle',
  },
};
