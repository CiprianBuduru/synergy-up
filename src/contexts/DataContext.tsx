import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Company, CompanyEnrichment, Brief, CalculationSnapshot, Presentation, Slide, Product } from '@/types';
import { seedCompanies, seedEnrichments, seedPresentations, seedSlides, seedBriefs, seedCalculations, seedProducts } from '@/data/seed';

interface DataContextType {
  companies: Company[];
  enrichments: CompanyEnrichment[];
  presentations: Presentation[];
  slides: Slide[];
  briefs: Brief[];
  calculations: CalculationSnapshot[];
  products: Product[];
  addCompany: (c: Company) => void;
  updateCompany: (c: Company) => void;
  addPresentation: (p: Presentation) => void;
  updatePresentation: (p: Presentation) => void;
  setSlides: (slides: Slide[]) => void;
  addBrief: (b: Brief) => void;
  addCalculation: (c: CalculationSnapshot) => void;
  addEnrichment: (e: CompanyEnrichment) => void;
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  getCompany: (id: string) => Company | undefined;
  getEnrichment: (companyId: string) => CompanyEnrichment | undefined;
  getPresentation: (id: string) => Presentation | undefined;
  getPresentationSlides: (presentationId: string) => Slide[];
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(seedCompanies);
  const [enrichments, setEnrichments] = useState<CompanyEnrichment[]>(seedEnrichments);
  const [presentations, setPresentations] = useState<Presentation[]>(seedPresentations);
  const [slides, setSlidesState] = useState<Slide[]>(seedSlides);
  const [briefs, setBriefs] = useState<Brief[]>(seedBriefs);
  const [calculations, setCalculations] = useState<CalculationSnapshot[]>(seedCalculations);
  const [products, setProducts] = useState<Product[]>(seedProducts);

  const addCompany = useCallback((c: Company) => setCompanies(prev => [...prev, c]), []);
  const updateCompany = useCallback((c: Company) => setCompanies(prev => prev.map(x => x.id === c.id ? c : x)), []);
  const addPresentation = useCallback((p: Presentation) => setPresentations(prev => [...prev, p]), []);
  const updatePresentation = useCallback((p: Presentation) => setPresentations(prev => prev.map(x => x.id === p.id ? p : x)), []);
  const setSlides = useCallback((newSlides: Slide[]) => setSlidesState(prev => {
    const presentationId = newSlides[0]?.presentation_id;
    if (!presentationId) return prev;
    const filtered = prev.filter(s => s.presentation_id !== presentationId);
    return [...filtered, ...newSlides];
  }), []);
  const addBrief = useCallback((b: Brief) => setBriefs(prev => [...prev, b]), []);
  const addCalculation = useCallback((c: CalculationSnapshot) => setCalculations(prev => [...prev, c]), []);
  const addEnrichment = useCallback((e: CompanyEnrichment) => setEnrichments(prev => [...prev, e]), []);
  const addProduct = useCallback((p: Product) => setProducts(prev => [...prev, p]), []);
  const updateProduct = useCallback((p: Product) => setProducts(prev => prev.map(x => x.id === p.id ? p : x)), []);

  const getCompany = useCallback((id: string) => companies.find(c => c.id === id), [companies]);
  const getEnrichment = useCallback((companyId: string) => enrichments.find(e => e.company_id === companyId), [enrichments]);
  const getPresentation = useCallback((id: string) => presentations.find(p => p.id === id), [presentations]);
  const getPresentationSlides = useCallback((pid: string) => slides.filter(s => s.presentation_id === pid).sort((a, b) => a.slide_order - b.slide_order), [slides]);

  return (
    <DataContext.Provider value={{
      companies, enrichments, presentations, slides, briefs, calculations, products,
      addCompany, updateCompany, addPresentation, updatePresentation, setSlides,
      addBrief, addCalculation, addEnrichment, addProduct, updateProduct,
      getCompany, getEnrichment, getPresentation, getPresentationSlides,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
