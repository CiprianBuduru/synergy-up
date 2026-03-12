// ─── Supabase Data Access Layer ──────────────────────────────
// All CRUD operations for Supabase tables.
// Each function returns { data, error } for consistent error handling.

import { supabase } from '@/integrations/supabase/client';
import type { Company, CompanyEnrichment, Brief, CalculationSnapshot, Presentation, Slide, Product, Kit, Operation, Alternative, EnrichmentSignal, EnrichmentStatus, KitComponent, KitComplexity, EligibilityStatus, PresentationTone, PresentationStatus } from '@/types';

// ─── Type mappers (DB row → App type) ───────────────────────
// Supabase stores JSONB as Json type, we need to cast to our app types

function mapCompany(row: any): Company {
  return { ...row } as Company;
}

function mapEnrichment(row: any): CompanyEnrichment {
  return {
    ...row,
    sources_json: (row.sources_json ?? []) as string[],
    signals_json: (row.signals_json ?? []) as EnrichmentSignal[],
    enrichment_status: row.enrichment_status as EnrichmentStatus,
  };
}

function mapBrief(row: any): Brief {
  return {
    ...row,
    requested_products_json: (row.requested_products_json ?? []) as string[],
    eligibility_status: row.eligibility_status as EligibilityStatus,
  };
}

function mapCalculation(row: any): CalculationSnapshot {
  return { ...row } as CalculationSnapshot;
}

function mapPresentation(row: any): Presentation {
  return {
    ...row,
    tone: row.tone as PresentationTone,
    status: row.status as PresentationStatus,
  };
}

function mapSlide(row: any): Slide {
  return {
    ...row,
    metadata_json: (row.metadata_json ?? {}) as Record<string, unknown>,
  };
}

function mapProduct(row: any): Product {
  return {
    ...row,
    internal_operations_json: (row.internal_operations_json ?? []) as string[],
    supporting_caen_codes_json: (row.supporting_caen_codes_json ?? []) as string[],
    suggested_industries_json: (row.suggested_industries_json ?? []) as string[],
    suitable_departments_json: (row.suitable_departments_json ?? []) as string[],
    suitable_for_json: (row.suitable_for_json ?? []) as string[],
  };
}

function mapKit(row: any): Kit {
  return {
    ...row,
    target_departments: (row.target_departments ?? []) as string[],
    complexity: row.complexity as KitComplexity,
    suggested_industries_json: (row.suggested_industries_json ?? []) as string[],
    components_json: (row.components_json ?? []) as KitComponent[],
    internal_operations_json: (row.internal_operations_json ?? []) as string[],
    supporting_caen_codes_json: (row.supporting_caen_codes_json ?? []) as string[],
    eligibility_type: row.eligibility_type as EligibilityStatus,
    alternative_for: (row.alternative_for ?? []) as string[],
  };
}

function mapOperation(row: any): Operation {
  return { ...row } as Operation;
}

function mapAlternative(row: any): Alternative {
  return {
    ...row,
    relevance_tags_json: (row.relevance_tags_json ?? []) as string[],
  };
}

// ─── Companies ──────────────────────────────────────────────
export async function fetchCompanies() {
  const { data, error } = await supabase.from('companies').select('*').order('company_name');
  return { data: data?.map(mapCompany) ?? [], error };
}

export async function insertCompany(company: Omit<Company, 'id' | 'created_at' | 'updated_at'> & { id?: string }) {
  const { data, error } = await supabase.from('companies').insert(company).select().single();
  return { data: data ? mapCompany(data) : null, error };
}

export async function updateCompany(id: string, updates: Partial<Company>) {
  const { id: _, created_at, updated_at, ...rest } = updates as any;
  const { data, error } = await supabase.from('companies').update(rest).eq('id', id).select().single();
  return { data: data ? mapCompany(data) : null, error };
}

// ─── Enrichments ────────────────────────────────────────────
export async function fetchEnrichments() {
  const { data, error } = await supabase.from('company_enrichments').select('*');
  return { data: data?.map(mapEnrichment) ?? [], error };
}

export async function insertEnrichment(enrichment: Omit<CompanyEnrichment, 'id' | 'created_at'> & { id?: string }) {
  const payload = {
    ...enrichment,
    sources_json: enrichment.sources_json as any,
    signals_json: enrichment.signals_json as any,
  };
  const { data, error } = await supabase.from('company_enrichments').insert(payload).select().single();
  return { data: data ? mapEnrichment(data) : null, error };
}

export async function updateEnrichment(id: string, updates: Partial<CompanyEnrichment>) {
  const { id: _, created_at, ...rest } = updates as any;
  if (rest.sources_json) rest.sources_json = rest.sources_json as any;
  if (rest.signals_json) rest.signals_json = rest.signals_json as any;
  const { data, error } = await supabase.from('company_enrichments').update(rest).eq('id', id).select().single();
  return { data: data ? mapEnrichment(data) : null, error };
}

// ─── Calculations ───────────────────────────────────────────
export async function fetchCalculations() {
  const { data, error } = await supabase.from('calculations').select('*');
  return { data: data?.map(mapCalculation) ?? [], error };
}

export async function insertCalculation(calc: Omit<CalculationSnapshot, 'id' | 'created_at'> & { id?: string }) {
  const { data, error } = await supabase.from('calculations').insert(calc).select().single();
  return { data: data ? mapCalculation(data) : null, error };
}

// ─── Briefs ─────────────────────────────────────────────────
export async function fetchBriefs() {
  const { data, error } = await supabase.from('briefs').select('*');
  return { data: data?.map(mapBrief) ?? [], error };
}

export async function insertBrief(brief: Omit<Brief, 'id' | 'created_at'> & { id?: string }) {
  const payload = {
    ...brief,
    requested_products_json: brief.requested_products_json as any,
  };
  const { data, error } = await supabase.from('briefs').insert(payload).select().single();
  return { data: data ? mapBrief(data) : null, error };
}

// ─── Products ───────────────────────────────────────────────
export async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*').order('name');
  return { data: data?.map(mapProduct) ?? [], error };
}

export async function insertProduct(product: Omit<Product, 'id'> & { id?: string }) {
  const payload = {
    ...product,
    internal_operations_json: product.internal_operations_json as any,
    supporting_caen_codes_json: product.supporting_caen_codes_json as any,
    suggested_industries_json: product.suggested_industries_json as any,
    suitable_departments_json: product.suitable_departments_json as any,
    suitable_for_json: product.suitable_for_json as any,
  };
  const { data, error } = await supabase.from('products').insert(payload).select().single();
  return { data: data ? mapProduct(data) : null, error };
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const { id: _, ...rest } = updates as any;
  if (rest.internal_operations_json) rest.internal_operations_json = rest.internal_operations_json as any;
  if (rest.supporting_caen_codes_json) rest.supporting_caen_codes_json = rest.supporting_caen_codes_json as any;
  if (rest.suggested_industries_json) rest.suggested_industries_json = rest.suggested_industries_json as any;
  if (rest.suitable_departments_json) rest.suitable_departments_json = rest.suitable_departments_json as any;
  if (rest.suitable_for_json) rest.suitable_for_json = rest.suitable_for_json as any;
  const { data, error } = await supabase.from('products').update(rest).eq('id', id).select().single();
  return { data: data ? mapProduct(data) : null, error };
}

// ─── Kits ───────────────────────────────────────────────────
export async function fetchKits() {
  const { data, error } = await supabase.from('kits').select('*').order('name');
  return { data: data?.map(mapKit) ?? [], error };
}

export async function insertKit(kit: Omit<Kit, 'id'> & { id?: string }) {
  const payload = {
    ...kit,
    target_departments: kit.target_departments as any,
    suggested_industries_json: kit.suggested_industries_json as any,
    components_json: kit.components_json as any,
    internal_operations_json: kit.internal_operations_json as any,
    supporting_caen_codes_json: kit.supporting_caen_codes_json as any,
    alternative_for: kit.alternative_for as any,
  };
  const { data, error } = await supabase.from('kits').insert(payload).select().single();
  return { data: data ? mapKit(data) : null, error };
}

export async function updateKit(id: string, updates: Partial<Kit>) {
  const { id: _, ...rest } = updates as any;
  const { data, error } = await supabase.from('kits').update(rest).eq('id', id).select().single();
  return { data: data ? mapKit(data) : null, error };
}

// ─── Presentations ──────────────────────────────────────────
export async function fetchPresentations() {
  const { data, error } = await supabase.from('presentations').select('*').order('created_at', { ascending: false });
  return { data: data?.map(mapPresentation) ?? [], error };
}

export async function insertPresentation(p: Omit<Presentation, 'id' | 'created_at' | 'updated_at'> & { id?: string }) {
  const { data, error } = await supabase.from('presentations').insert(p).select().single();
  return { data: data ? mapPresentation(data) : null, error };
}

export async function updatePresentation(id: string, updates: Partial<Presentation>) {
  const { id: _, created_at, updated_at, ...rest } = updates as any;
  const { data, error } = await supabase.from('presentations').update(rest).eq('id', id).select().single();
  return { data: data ? mapPresentation(data) : null, error };
}

// ─── Slides ─────────────────────────────────────────────────
export async function fetchSlides() {
  const { data, error } = await supabase.from('slides').select('*').order('slide_order');
  return { data: data?.map(mapSlide) ?? [], error };
}

export async function upsertSlides(slides: Slide[]) {
  const payload = slides.map(s => ({
    ...s,
    metadata_json: s.metadata_json as any,
  }));
  const { data, error } = await supabase.from('slides').upsert(payload).select();
  return { data: data?.map(mapSlide) ?? [], error };
}

export async function deleteSlidesByPresentation(presentationId: string) {
  const { error } = await supabase.from('slides').delete().eq('presentation_id', presentationId);
  return { error };
}

// ─── Operations ─────────────────────────────────────────────
export async function fetchOperations() {
  const { data, error } = await supabase.from('operations').select('*').order('name');
  return { data: data?.map(mapOperation) ?? [], error };
}

// ─── Alternatives ───────────────────────────────────────────
export async function fetchAlternatives() {
  const { data, error } = await supabase.from('alternatives').select('*');
  return { data: data?.map(mapAlternative) ?? [], error };
}
