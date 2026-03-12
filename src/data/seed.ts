// ─── Seed data hub ──────────────────────────────────────────────────
// Re-exports all seed data from dedicated files for backward compatibility.
// Components import from '@/data/seed' — this file stays as the single entry point.

export { seedCompanies } from './companies.seed';
export { seedEnrichments } from './enrichments.seed';
export { seedOperations, seedAlternatives } from './operations.seed';
export { seedKits } from './kits.seed';
export { productsLibrary as seedProducts } from './products-seed';
export { seedPresentations, seedBriefs, seedCalculations, seedSlides } from './presentations.seed';
