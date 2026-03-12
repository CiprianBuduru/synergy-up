import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Company, CompanyEnrichment, Brief, CalculationSnapshot, Presentation, Slide, Product, Kit } from '@/types';
import { seedCompanies, seedEnrichments, seedPresentations, seedSlides, seedBriefs, seedCalculations, seedProducts, seedKits } from '@/data/seed';
import * as db from '@/services/supabase-data';
import { toast } from '@/hooks/use-toast';

type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

interface DataContextType {
  // Data
  companies: Company[];
  enrichments: CompanyEnrichment[];
  presentations: Presentation[];
  slides: Slide[];
  briefs: Brief[];
  calculations: CalculationSnapshot[];
  products: Product[];
  kits: Kit[];

  // Status
  status: SyncStatus;
  isLoading: boolean;
  isDemo: boolean;

  // Company CRUD
  addCompany: (c: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => Promise<Company | null>;
  updateCompany: (c: Company) => Promise<void>;

  // Presentation CRUD
  addPresentation: (p: Omit<Presentation, 'id' | 'created_at' | 'updated_at'>) => Promise<Presentation | null>;
  updatePresentation: (p: Presentation) => Promise<void>;
  setSlides: (slides: Slide[]) => Promise<void>;

  // Other inserts
  addBrief: (b: Omit<Brief, 'id' | 'created_at'>) => Promise<Brief | null>;
  addCalculation: (c: Omit<CalculationSnapshot, 'id' | 'created_at'>) => Promise<CalculationSnapshot | null>;
  addEnrichment: (e: Omit<CompanyEnrichment, 'id' | 'created_at'>) => Promise<CompanyEnrichment | null>;
  updateEnrichment: (e: CompanyEnrichment) => Promise<void>;
  addProduct: (p: Omit<Product, 'id'>) => Promise<Product | null>;
  updateProduct: (p: Product) => Promise<void>;

  // Lookups
  getCompany: (id: string) => Company | undefined;
  getEnrichment: (companyId: string) => CompanyEnrichment | undefined;
  getPresentation: (id: string) => Presentation | undefined;
  getPresentationSlides: (presentationId: string) => Slide[];

  // Refresh
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [enrichments, setEnrichments] = useState<CompanyEnrichment[]>([]);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [slides, setSlidesState] = useState<Slide[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [calculations, setCalculations] = useState<CalculationSnapshot[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const [isDemo, setIsDemo] = useState(false);
  const initialized = useRef(false);

  // ─── Initial data load ─────────────────────────────────────
  const loadData = useCallback(async () => {
    setStatus('loading');
    try {
      const [cRes, eRes, pRes, sRes, bRes, calcRes, prodRes, kitRes] = await Promise.all([
        db.fetchCompanies(),
        db.fetchEnrichments(),
        db.fetchPresentations(),
        db.fetchSlides(),
        db.fetchBriefs(),
        db.fetchCalculations(),
        db.fetchProducts(),
        db.fetchKits(),
      ]);

      // Check if any fetch failed — if so, fall back to seed
      const hasError = [cRes, eRes, pRes, sRes, bRes, calcRes, prodRes, kitRes].some(r => r.error);

      if (hasError) {
        console.warn('Supabase fetch failed, falling back to demo mode', { errors: [cRes.error, eRes.error] });
        setCompanies(seedCompanies);
        setEnrichments(seedEnrichments);
        setPresentations(seedPresentations);
        setSlidesState(seedSlides);
        setBriefs(seedBriefs);
        setCalculations(seedCalculations);
        setProducts(seedProducts);
        setKits(seedKits);
        setIsDemo(true);
        setStatus('idle');
        return;
      }

      // If DB is empty, seed it
      const dbEmpty = cRes.data.length === 0 && prodRes.data.length === 0;
      if (dbEmpty) {
        console.log('Database empty, seeding initial data...');
        await seedDatabase();
        // Re-fetch after seeding
        const [c2, e2, p2, s2, b2, calc2, prod2, kit2] = await Promise.all([
          db.fetchCompanies(), db.fetchEnrichments(), db.fetchPresentations(),
          db.fetchSlides(), db.fetchBriefs(), db.fetchCalculations(),
          db.fetchProducts(), db.fetchKits(),
        ]);
        setCompanies(c2.data);
        setEnrichments(e2.data);
        setPresentations(p2.data);
        setSlidesState(s2.data);
        setBriefs(b2.data);
        setCalculations(calc2.data);
        setProducts(prod2.data);
        setKits(kit2.data);
      } else {
        setCompanies(cRes.data);
        setEnrichments(eRes.data);
        setPresentations(pRes.data);
        setSlidesState(sRes.data);
        setBriefs(bRes.data);
        setCalculations(calcRes.data);
        setProducts(prodRes.data);
        setKits(kitRes.data);
      }
      setIsDemo(false);
      setStatus('idle');
    } catch (err) {
      console.error('Data load failed:', err);
      setCompanies(seedCompanies);
      setEnrichments(seedEnrichments);
      setPresentations(seedPresentations);
      setSlidesState(seedSlides);
      setBriefs(seedBriefs);
      setCalculations(seedCalculations);
      setProducts(seedProducts);
      setKits(seedKits);
      setIsDemo(true);
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadData();
    }
  }, [loadData]);

  // ─── Seed database with initial data ───────────────────────
  async function seedDatabase() {
    try {
      // Insert companies first (need IDs for foreign keys)
      for (const c of seedCompanies) {
        await db.insertCompany(c);
      }
      // Insert enrichments
      for (const e of seedEnrichments) {
        await db.insertEnrichment(e);
      }
      // Insert products
      for (const p of seedProducts) {
        await db.insertProduct(p);
      }
      // Insert kits
      for (const k of seedKits) {
        await db.insertKit(k);
      }
      // Insert calculations
      for (const c of seedCalculations) {
        await db.insertCalculation(c);
      }
      // Insert briefs
      for (const b of seedBriefs) {
        await db.insertBrief(b);
      }
      // Insert presentations and slides
      for (const p of seedPresentations) {
        await db.insertPresentation(p);
      }
      const slideGroups = seedSlides;
      if (slideGroups.length > 0) {
        await db.upsertSlides(slideGroups);
      }
      console.log('Database seeded successfully');
    } catch (err) {
      console.error('Seed failed:', err);
    }
  }

  // ─── Status feedback helper ────────────────────────────────
  const withSaving = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setStatus('saving');
    try {
      const result = await fn();
      setStatus('saved');
      setTimeout(() => setStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
      return result;
    } catch (err) {
      setStatus('error');
      toast({ title: 'Eroare', description: 'Nu am putut salva datele. Încearcă din nou.', variant: 'destructive' });
      setTimeout(() => setStatus(prev => prev === 'error' ? 'idle' : prev), 3000);
      throw err;
    }
  }, []);

  // ─── Company CRUD ─────────────────────────────────────────
  const addCompany = useCallback(async (c: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    if (isDemo) {
      const newC = { ...c, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Company;
      setCompanies(prev => [...prev, newC]);
      return newC;
    }
    return withSaving(async () => {
      const { data, error } = await db.insertCompany(c);
      if (error || !data) throw error;
      setCompanies(prev => [...prev, data]);
      return data;
    });
  }, [isDemo, withSaving]);

  const updateCompany = useCallback(async (c: Company) => {
    if (isDemo) {
      setCompanies(prev => prev.map(x => x.id === c.id ? c : x));
      return;
    }
    return withSaving(async () => {
      const { error } = await db.updateCompany(c.id, c);
      if (error) throw error;
      setCompanies(prev => prev.map(x => x.id === c.id ? c : x));
    });
  }, [isDemo, withSaving]);

  // ─── Presentation CRUD ───────────────────────────────────
  const addPresentation = useCallback(async (p: Omit<Presentation, 'id' | 'created_at' | 'updated_at'>) => {
    if (isDemo) {
      const newP = { ...p, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Presentation;
      setPresentations(prev => [...prev, newP]);
      return newP;
    }
    return withSaving(async () => {
      const { data, error } = await db.insertPresentation(p);
      if (error || !data) throw error;
      setPresentations(prev => [...prev, data]);
      return data;
    });
  }, [isDemo, withSaving]);

  const updatePresentation = useCallback(async (p: Presentation) => {
    if (isDemo) {
      setPresentations(prev => prev.map(x => x.id === p.id ? p : x));
      return;
    }
    return withSaving(async () => {
      const { error } = await db.updatePresentation(p.id, p);
      if (error) throw error;
      setPresentations(prev => prev.map(x => x.id === p.id ? p : x));
    });
  }, [isDemo, withSaving]);

  const setSlides = useCallback(async (newSlides: Slide[]) => {
    const presentationId = newSlides[0]?.presentation_id;
    if (!presentationId) return;

    if (isDemo) {
      setSlidesState(prev => {
        const filtered = prev.filter(s => s.presentation_id !== presentationId);
        return [...filtered, ...newSlides];
      });
      return;
    }

    return withSaving(async () => {
      await db.deleteSlidesByPresentation(presentationId);
      const { error } = await db.upsertSlides(newSlides);
      if (error) throw error;
      setSlidesState(prev => {
        const filtered = prev.filter(s => s.presentation_id !== presentationId);
        return [...filtered, ...newSlides];
      });
    });
  }, [isDemo, withSaving]);

  // ─── Other inserts ────────────────────────────────────────
  const addBrief = useCallback(async (b: Omit<Brief, 'id' | 'created_at'>) => {
    if (isDemo) {
      const newB = { ...b, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Brief;
      setBriefs(prev => [...prev, newB]);
      return newB;
    }
    return withSaving(async () => {
      const { data, error } = await db.insertBrief(b);
      if (error || !data) throw error;
      setBriefs(prev => [...prev, data]);
      return data;
    });
  }, [isDemo, withSaving]);

  const addCalculation = useCallback(async (c: Omit<CalculationSnapshot, 'id' | 'created_at'>) => {
    if (isDemo) {
      const newC = { ...c, id: crypto.randomUUID(), created_at: new Date().toISOString() } as CalculationSnapshot;
      setCalculations(prev => [...prev, newC]);
      return newC;
    }
    return withSaving(async () => {
      const { data, error } = await db.insertCalculation(c);
      if (error || !data) throw error;
      setCalculations(prev => [...prev, data]);
      return data;
    });
  }, [isDemo, withSaving]);

  const addEnrichment = useCallback(async (e: Omit<CompanyEnrichment, 'id' | 'created_at'>) => {
    if (isDemo) {
      const newE = { ...e, id: crypto.randomUUID(), created_at: new Date().toISOString() } as CompanyEnrichment;
      setEnrichments(prev => [...prev, newE]);
      return newE;
    }
    return withSaving(async () => {
      const { data, error } = await db.insertEnrichment(e);
      if (error || !data) throw error;
      setEnrichments(prev => [...prev, data]);
      return data;
    });
  }, [isDemo, withSaving]);

  const updateEnrichment = useCallback(async (e: CompanyEnrichment) => {
    if (isDemo) {
      setEnrichments(prev => prev.map(x => x.id === e.id ? e : x));
      return;
    }
    return withSaving(async () => {
      const { error } = await db.updateEnrichment(e.id, e);
      if (error) throw error;
      setEnrichments(prev => prev.map(x => x.id === e.id ? e : x));
    });
  }, [isDemo, withSaving]);

  const addProduct = useCallback(async (p: Omit<Product, 'id'>) => {
    if (isDemo) {
      const newP = { ...p, id: crypto.randomUUID() } as Product;
      setProducts(prev => [...prev, newP]);
      return newP;
    }
    return withSaving(async () => {
      const { data, error } = await db.insertProduct(p);
      if (error || !data) throw error;
      setProducts(prev => [...prev, data]);
      return data;
    });
  }, [isDemo, withSaving]);

  const updateProduct = useCallback(async (p: Product) => {
    if (isDemo) {
      setProducts(prev => prev.map(x => x.id === p.id ? p : x));
      return;
    }
    return withSaving(async () => {
      const { error } = await db.updateProduct(p.id, p);
      if (error) throw error;
      setProducts(prev => prev.map(x => x.id === p.id ? p : x));
    });
  }, [isDemo, withSaving]);

  // ─── Lookups ──────────────────────────────────────────────
  const getCompany = useCallback((id: string) => companies.find(c => c.id === id), [companies]);
  const getEnrichment = useCallback((companyId: string) => enrichments.find(e => e.company_id === companyId), [enrichments]);
  const getPresentation = useCallback((id: string) => presentations.find(p => p.id === id), [presentations]);
  const getPresentationSlides = useCallback((pid: string) => slides.filter(s => s.presentation_id === pid).sort((a, b) => a.slide_order - b.slide_order), [slides]);

  return (
    <DataContext.Provider value={{
      companies, enrichments, presentations, slides, briefs, calculations, products, kits,
      status, isLoading: status === 'loading', isDemo,
      addCompany, updateCompany,
      addPresentation, updatePresentation, setSlides,
      addBrief, addCalculation, addEnrichment, addProduct, updateProduct,
      getCompany, getEnrichment, getPresentation, getPresentationSlides,
      refresh: loadData,
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
