import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import CompanyEnrichmentPanel from '@/components/CompanyEnrichmentPanel';
import CompanyInsightsPanel from '@/components/CompanyInsightsPanel';
import CommercialInsightsPanel from '@/components/CommercialInsightsPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, FileText, Sparkles, CheckCircle2, Search, Plus, Users, Brain, Mail, ShieldCheck, CloudOff, Eye, AlertTriangle, Loader2, HelpCircle, Globe, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeBrief } from '@/lib/eligibility-engine';
import { searchCompanies, getCompanySearchResult } from '@/services/companySearchService';
import { resolveCompany } from '@/services/companyResolutionService';
import { detectIntent, INTENT_LABELS } from '@/services/intentDetectionService';
import { analyzeCompanySignals } from '@/services/companySignalsService';
import { getIndustryProfile } from '@/services/industryIntelligenceService';
import { rankProducts, rankKits } from '@/services/solutionRankingService';
import { generatePitchStrategy } from '@/services/pitchStrategyService';
import { generateCommercialInsights, type CommercialInsights } from '@/services/commercialInsightsService';
import { detectBusinessSignals } from '@/services/businessSignalDetectionService';
import EligibilityReasoningPanel from '@/components/EligibilityReasoningPanel';
import BriefRulesPanel from '@/components/BriefRulesPanel';
import ExtractedBriefPanel from '@/components/ExtractedBriefPanel';
import CompanyResolutionPanel from '@/components/CompanyResolutionPanel';
import OfficialCompanyDataPanel from '@/components/OfficialCompanyDataPanel';
import PublicWebResearchPanel from '@/components/PublicWebResearchPanel';
import { generatePresentation } from '@/lib/presentation-generator';
import { presentationTemplates } from '@/lib/presentation-templates';
import { ProductCard, KitCard } from '@/components/ProductKitCards';
import EligibilityBadge from '@/components/EligibilityBadge';
import { parseEmailBrief, type ParsedEmailBrief } from '@/services/emailBriefParserService';
import * as dbAccess from '@/services/supabase-data';
import type { PresentationTone, Company } from '@/types';
import type { WebResearchResult } from '@/services/publicWebResearchService';

// ═══════════════════════════════════════════════════════════════
// WIZARD FLOW (9-step modular architecture):
// ─────────────────────────────────────────────────────────────
// Step 1 — INPUT:    Parse email / Select company + Confirm brief text
// Step 2 — DATA:     Verify company → Official Data → Web Research → Commercial Insights
// Step 3 — ANALYSIS: Analyze brief (using all gathered data) → Recommend → Generate
// ═══════════════════════════════════════════════════════════════

export default function NewPresentationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const data = useData();
  const preselectedCompanyId = searchParams.get('company');

  // ── Core state ──
  const [step, setStep] = useState(1);
  const [inputMode, setInputMode] = useState<'company' | 'email'>('company');
  const [selectedCompanyId, setSelectedCompanyId] = useState(preselectedCompanyId || '');
  const [companySearch, setCompanySearch] = useState('');
  const [briefText, setBriefText] = useState('');
  const [briefAnalysis, setBriefAnalysis] = useState<ReturnType<typeof analyzeBrief> | null>(null);
  const [tone, setTone] = useState<PresentationTone>('corporate');
  const [selectedTemplate, setSelectedTemplate] = useState('corporate-clean');
  const [generatedPresentationId, setGeneratedPresentationId] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualForm, setManualForm] = useState({ company_name: '', industry: '', company_size: '', location: '', contact_name: '', contact_role: '', contact_department: 'HR', email: '' });

  // Email parser state
  const [rawEmail, setRawEmail] = useState('');
  const [parsedEmail, setParsedEmail] = useState<ParsedEmailBrief | null>(null);
  type FlowStep = 'parsed' | 'brief_confirmed' | 'company_verified' | 'data_loaded' | 'research_done' | 'insights_generated' | 'brief_analyzed' | 'recommendations_ready';
  const [emailFlowStatus, setEmailFlowStatus] = useState<FlowStep[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addFlowStep = (...steps: FlowStep[]) => {
    setEmailFlowStatus(prev => {
      const next = new Set(prev);
      steps.forEach(s => next.add(s));
      return Array.from(next) as FlowStep[];
    });
  };

  // Commercial insights state (generated in Step 2)
  const [commercialInsights, setCommercialInsights] = useState<CommercialInsights | null>(null);
  // Web research result (captured from PublicWebResearchPanel)
  const [webResearchResult, setWebResearchResult] = useState<WebResearchResult | null>(null);

  const company = data.getCompany(selectedCompanyId);
  const enrichment = data.getEnrichment(selectedCompanyId);

  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return data.companies;
    const q = companySearch.toLowerCase();
    return data.companies.filter(c =>
      c.company_name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.legal_name.toLowerCase().includes(q)
    );
  }, [data.companies, companySearch]);

  const normalizeCompanyName = (value: string) =>
    value.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,]/g, '');

  const findExactCompanyMatch = (name: string, companies: Company[]) => {
    const normalizedTarget = normalizeCompanyName(name);
    return companies.find(c => {
      const normalizedCompany = normalizeCompanyName(c.company_name || '');
      const normalizedLegal = normalizeCompanyName(c.legal_name || '');
      return normalizedCompany === normalizedTarget || normalizedLegal === normalizedTarget;
    });
  };

  const findFuzzyCompanyMatch = (name: string, companies: Company[]) => {
    const normalizedTarget = normalizeCompanyName(name);
    if (normalizedTarget.length < 3) return undefined;
    return companies.find(c => {
      const normalizedCompany = normalizeCompanyName(c.company_name || '');
      const normalizedLegal = normalizeCompanyName(c.legal_name || '');
      return (
        normalizedCompany.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedCompany) ||
        (!!normalizedLegal && (normalizedLegal.includes(normalizedTarget) || normalizedTarget.includes(normalizedLegal)))
      );
    });
  };

  // ── Intelligence Core (computed from confirmed company + brief) ──
  const companySignals = useMemo(() => {
    if (!company) return null;
    return analyzeCompanySignals(company, enrichment || null, briefText);
  }, [company, enrichment, briefText]);

  const detectedIntent = useMemo(() => {
    if (!briefText.trim()) return null;
    return detectIntent(briefText);
  }, [briefText]);

  const industryProfile = useMemo(() => {
    if (!company) return null;
    return getIndustryProfile(company.industry || '');
  }, [company]);

  const pitchStrategy = useMemo(() => {
    if (!companySignals || !detectedIntent) return null;
    const calc = data.calculations.find(c => c.company_id === selectedCompanyId);
    return generatePitchStrategy(companySignals, detectedIntent, company?.industry || '', calc?.spendable_half_estimated);
  }, [companySignals, detectedIntent, company, data.calculations, selectedCompanyId]);

  // Ranked products & kits — now computed in Step 3 AFTER brief analysis
  const rankedProducts = useMemo(() => {
    if (!company || !companySignals || !detectedIntent) return [];
    return rankProducts(data.products, company.industry, company.contact_department, detectedIntent, companySignals).slice(0, 6);
  }, [company, companySignals, detectedIntent, data.products]);

  const rankedKits = useMemo(() => {
    if (!company || !companySignals || !detectedIntent) return [];
    return rankKits(data.kits, company.industry, company.contact_department, detectedIntent, companySignals).slice(0, 4);
  }, [company, companySignals, detectedIntent, data.kits]);

  // ── Step 2 → Step 3: Generate commercial insights then move to analysis ──
  const handleProceedToAnalysis = useCallback(() => {
    if (!company || !companySignals) {
      toast.error('Confirmă compania și finalizează research-ul înainte de a continua.');
      return;
    }

    // Generate commercial insights from gathered data
    // Build OfficialWebsiteData from web research for signal detection
    const webDataForSignals = {
      official_website: webResearchResult?.official_website || company.website || '',
      about_company_text: webResearchResult?.about_company_text || '',
      visible_services: webResearchResult?.visible_services || [],
      visible_products: webResearchResult?.visible_products || [],
      careers_page_found: webResearchResult?.careers_page_found || false,
      contact_page_found: webResearchResult?.contact_page_found || false,
      website_checked_at: webResearchResult?.website_checked_at || new Date().toISOString(),
      source_badge: 'Official website' as const,
      overrides: {},
    };
    const signalReport = detectBusinessSignals(company, enrichment || null, webDataForSignals, companySignals);
    const insights = generateCommercialInsights(
      company,
      enrichment || null,
      null, // OfficialWebsiteData (separate module)
      webResearchResult,
      signalReport,
      companySignals,
      detectedIntent,
      data.products,
      data.kits,
    );
    setCommercialInsights(insights);
    addFlowStep('insights_generated');

    setStep(3);
  }, [company, enrichment, companySignals, detectedIntent, webResearchResult, data.products, data.kits]);

  // ── Step 3: Analyze brief using confirmed company + research data ──
  const handleAnalyzeBrief = useCallback(() => {
    if (!briefText.trim()) {
      toast.info('Introdu un brief înainte de analiză.');
      return;
    }

    const analysis = analyzeBrief(briefText);
    setBriefAnalysis(analysis);
    setTone(analysis.tone as PresentationTone);
    addFlowStep('brief_analyzed', 'recommendations_ready');

    // Save brief to DB if company confirmed
    if (selectedCompanyId) {
      data.addBrief({
        company_id: selectedCompanyId,
        raw_brief: briefText,
        requested_products_json: analysis.products,
        requested_purpose: analysis.purpose,
        target_audience: analysis.audience,
        department_detected: analysis.department,
        tone_recommended: analysis.tone,
        eligibility_status: analysis.eligibility.verdict,
      }).catch(err => console.warn('Brief save failed (non-blocking):', err));
    }
  }, [briefText, selectedCompanyId, data]);

  const handleGenerate = async () => {
    const companyId = selectedCompanyId?.trim();
    if (!companyId) {
      toast.error('Selectează o companie înainte de a genera prezentarea.');
      return;
    }
    if (!briefText.trim()) {
      toast.error('Scrie un brief înainte de a genera prezentarea.');
      return;
    }
    if (!briefAnalysis) {
      toast.error('Analizează brief-ul înainte de a genera prezentarea.');
      return;
    }

    setIsGenerating(true);

    try {
      let resolvedCompany = data.getCompany(companyId) || null;
      if (!resolvedCompany) {
        const { data: dbCompanies, error: dbLookupError } = await dbAccess.fetchCompanies();
        if (!dbLookupError) {
          resolvedCompany =
            dbCompanies.find(c => c.id === companyId) ||
            (parsedEmail?.company_name ? (findExactCompanyMatch(parsedEmail.company_name, dbCompanies) || findFuzzyCompanyMatch(parsedEmail.company_name, dbCompanies) || null) : null);
          if (resolvedCompany) {
            if (resolvedCompany.id !== companyId) setSelectedCompanyId(resolvedCompany.id);
            void data.refresh();
          }
        }
      }

      if (!resolvedCompany) {
        toast.error('Nu am putut rezolva compania selectată. Reapasă "Use this as Brief" sau selectează manual compania.');
        return;
      }

      const resolvedEnrichment = data.getEnrichment(resolvedCompany.id) || null;
      const calc = data.calculations.find(c => c.company_id === resolvedCompany.id);
      const brief = data.briefs.find(b => b.company_id === resolvedCompany.id);
      const tempId = crypto.randomUUID();
      const slides = generatePresentation(tempId, resolvedCompany, resolvedEnrichment, calc || null, brief || null, tone, {
        signals: companySignals,
        intent: detectedIntent,
        pitchStrategy,
        eligibility: briefAnalysis?.eligibility || null,
        rankedProducts: rankedProducts.map(rp => rp),
        rankedKits: rankedKits.map(rk => rk),
      });

      const pres = await data.addPresentation({
        company_id: resolvedCompany.id,
        brief_id: brief?.id || null,
        title: `Prezentare ${resolvedCompany.company_name}`,
        objective: `Prezentare comercială pentru ${resolvedCompany.company_name}`,
        tone,
        status: 'presentation_generated',
        generated_summary: `Prezentare cu ${slides.length} slide-uri generată automat.`,
      });

      if (!pres) {
        toast.error('Nu am putut salva prezentarea. Încearcă din nou.');
        return;
      }

      const remappedSlides = slides.map(s => ({ ...s, presentation_id: pres.id }));
      try {
        await data.setSlides(remappedSlides);
      } catch (slideErr) {
        console.error('Slides save failed:', slideErr);
        toast.error('Prezentarea a fost creată dar slide-urile nu au fost salvate.');
      }

      setGeneratedPresentationId(pres.id);
      toast.success('Prezentare generată cu succes!');
    } catch (err) {
      console.error('Generation flow error:', err);
      toast.error('A apărut o eroare la generare. Încearcă din nou.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManualCompany = async () => {
    const newCompany = await data.addCompany({
      company_name: manualForm.company_name,
      legal_name: manualForm.company_name,
      website: '',
      industry: manualForm.industry,
      company_size: manualForm.company_size,
      location: manualForm.location,
      description: '',
      contact_name: manualForm.contact_name,
      contact_role: manualForm.contact_role,
      contact_department: manualForm.contact_department,
      email: manualForm.email,
      phone: '',
      notes: 'Companie creată manual din wizard',
    });
    if (newCompany) {
      setSelectedCompanyId(newCompany.id);
      setShowManualEntry(false);
    }
  };

  const handleParseEmail = () => {
    if (!rawEmail.trim()) return;
    const result = parseEmailBrief(rawEmail);
    setParsedEmail(result);
    setEmailFlowStatus(['parsed']);

    // Auto-match existing company by parsed name
    if (result.company_name && !selectedCompanyId) {
      const nameL = result.company_name.toLowerCase();
      const match = data.companies.find(c =>
        c.company_name.toLowerCase() === nameL ||
        c.legal_name.toLowerCase() === nameL
      );
      if (match) {
        setSelectedCompanyId(match.id);
        toast.success(`Companie detectată: ${match.company_name}`);
      }
    }
  };

  const handleReparse = () => {
    if (!rawEmail.trim()) return;
    const result = parseEmailBrief(rawEmail);
    setParsedEmail(result);
    setEmailFlowStatus(['parsed']);
  };

  // Step 1 → Step 2: Confirm brief text (from email or manual), move to data gathering
  const handleUseEmailAsBrief = () => {
    if (!parsedEmail) return;

    const parsedCompanyName = parsedEmail.company_name?.trim() || '';

    // Use resolution engine for auto-match (no creation, no DB writes)
    if (parsedCompanyName && !selectedCompanyId) {
      const resolution = resolveCompany(parsedCompanyName, data.companies);
      if (resolution.status === 'confirmed' && resolution.bestMatch) {
        setSelectedCompanyId(resolution.bestMatch.company.id);
        toast.success(`Companie confirmată: ${resolution.bestMatch.company.company_name}`);
      } else if (resolution.status === 'likely_match' && resolution.bestMatch) {
        toast.info(`Potrivire probabilă: "${resolution.bestMatch.company.company_name}" — confirmă în panoul de verificare.`);
      } else {
        toast.info(`Companie "${parsedCompanyName}" — necesită verificare manuală.`);
      }
    }

    // Set brief text but DON'T analyze yet — analysis happens in Step 3
    const cleanedText = parsedEmail.cleaned_body;
    setBriefText(cleanedText);
    addFlowStep('brief_confirmed');

    // Move to Step 2: Data Gathering (verify company, research, insights)
    setStep(2);
  };

  // Step 1 (company mode) → Step 2
  const handleCompanyContinue = () => {
    if (!selectedCompanyId) return;
    setStep(2);
  };

  // ── Flow status indicators ──
  const FLOW_STEPS = [
    { key: 'parsed', label: '1. Email parsed' },
    { key: 'brief_confirmed', label: '2. Brief confirmed' },
    { key: 'company_verified', label: '3. Company verified' },
    { key: 'data_loaded', label: '4. Official data' },
    { key: 'research_done', label: '5. Web research' },
    { key: 'insights_generated', label: '6. Commercial insights' },
    { key: 'brief_analyzed', label: '7. Brief analyzed' },
    { key: 'recommendations_ready', label: '8. Recommendations' },
  ] as const;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Wizard header */}
        <div className="relative flex items-center justify-between px-4">
          {[
            { n: 1, label: inputMode === 'email' ? 'Email & Brief' : 'Companie & Brief', icon: inputMode === 'email' ? Mail : Building2 },
            { n: 2, label: 'Verificare & Research', icon: Globe },
            { n: 3, label: 'Analiză & Generare', icon: Brain },
          ].map(({ n, label, icon: Icon }) => (
            <div key={n} className="relative z-10 flex flex-col items-center gap-1.5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 ${
                step === n
                  ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/30 scale-110'
                  : step > n
                    ? 'bg-emerald-500 text-emerald-50'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {step > n ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs font-medium ${step >= n ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
          ))}
          <div className="absolute left-[60px] right-[60px] top-5 h-0.5 bg-border">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          </div>
        </div>

        {/* Flow status bar */}
        {emailFlowStatus.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 flex-wrap">
            {FLOW_STEPS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                {emailFlowStatus.includes(key as any) ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />
                )}
                <span className={emailFlowStatus.includes(key as any) ? 'text-foreground font-medium' : 'text-muted-foreground'}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Input mode tabs */}
        {step === 1 && (
          <div className="flex gap-2 px-4">
            <Button
              variant={inputMode === 'company' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setInputMode('company'); setParsedEmail(null); }}
              className={inputMode === 'company' ? 'bg-accent text-accent-foreground' : ''}
            >
              <Building2 className="mr-1.5 h-3.5 w-3.5" /> Start from Company
            </Button>
            <Button
              variant={inputMode === 'email' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('email')}
              className={inputMode === 'email' ? 'bg-accent text-accent-foreground' : ''}
            >
              <Mail className="mr-1.5 h-3.5 w-3.5" /> Start from Email
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ═══════════ STEP 1: INPUT ═══════════ */}
          {/* Company mode */}
          {step === 1 && inputMode === 'company' && (
            <motion.div key="s1-company" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* Left: Company search */}
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-display text-lg">Selectează compania</CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setShowManualEntry(!showManualEntry)}>
                          <Plus className="h-3 w-3" /> Adaugă manual
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Caută după nume, industrie, locație..." value={companySearch} onChange={e => setCompanySearch(e.target.value)} className="pl-10" />
                      </div>
                      {companySearch && <p className="text-xs text-muted-foreground">{filteredCompanies.length} rezultat{filteredCompanies.length !== 1 ? 'e' : ''} găsite</p>}
                      <div className="max-h-[400px] space-y-1 overflow-y-auto pr-1">
                        {filteredCompanies.map(c => {
                          const cEnrichment = data.getEnrichment(c.id);
                          const isDemo = !cEnrichment || cEnrichment.sources_json?.includes('Introducere manuală') || cEnrichment.sources_json?.includes('demo');
                          const isVerified = cEnrichment?.enrichment_status === 'verified';
                          return (
                            <div key={c.id} onClick={() => setSelectedCompanyId(c.id)} className={`cursor-pointer rounded-xl border p-3 transition-all ${selectedCompanyId === c.id ? 'border-accent bg-accent/5 shadow-sm shadow-accent/10' : 'border-transparent hover:bg-muted/50 hover:border-border'}`}>
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 font-display text-[10px] font-bold text-primary">{c.company_name.slice(0, 2).toUpperCase()}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{c.company_name}</p>
                                  {c.legal_name && c.legal_name !== c.company_name && (
                                    <p className="text-[10px] text-muted-foreground truncate">{c.legal_name}</p>
                                  )}
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap">
                                    {cEnrichment?.caen_code && <span className="font-mono">CUI: {cEnrichment.caen_code}</span>}
                                    {c.location && <><span>•</span><span>{c.location}</span></>}
                                    {cEnrichment && (<><span>•</span><Users className="h-2.5 w-2.5" /><span>{cEnrichment.employee_count_estimate || '?'}</span></>)}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    {isVerified ? (
                                      <Badge variant="outline" className="text-[8px] h-4 px-1 border-success/30 text-success bg-success/5 gap-0.5">
                                        <ShieldCheck className="h-2.5 w-2.5" /> Verified source
                                      </Badge>
                                    ) : isDemo ? (
                                      <Badge variant="outline" className="text-[8px] h-4 px-1 border-warning/30 text-warning bg-warning/5 gap-0.5">
                                        <CloudOff className="h-2.5 w-2.5" /> Demo data
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[8px] h-4 px-1 border-muted-foreground/30 text-muted-foreground gap-0.5">
                                        <Eye className="h-2.5 w-2.5" /> Estimated
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {selectedCompanyId === c.id && <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {showManualEntry && (
                        <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-4 space-y-3">
                          <p className="text-xs font-semibold text-accent-foreground">Creare companie rapidă</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2"><Input placeholder="Nume companie *" value={manualForm.company_name} onChange={e => setManualForm(p => ({ ...p, company_name: e.target.value }))} className="h-8 text-sm" /></div>
                            <Input placeholder="Industrie" value={manualForm.industry} onChange={e => setManualForm(p => ({ ...p, industry: e.target.value }))} className="h-8 text-sm" />
                            <Input placeholder="Locație" value={manualForm.location} onChange={e => setManualForm(p => ({ ...p, location: e.target.value }))} className="h-8 text-sm" />
                            <Input placeholder="Dimensiune (ex: 200-500)" value={manualForm.company_size} onChange={e => setManualForm(p => ({ ...p, company_size: e.target.value }))} className="h-8 text-sm" />
                            <Select value={manualForm.contact_department} onValueChange={v => setManualForm(p => ({ ...p, contact_department: v }))}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HR">HR</SelectItem>
                                <SelectItem value="Achiziții">Achiziții</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Management">Management</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input placeholder="Persoană contact" value={manualForm.contact_name} onChange={e => setManualForm(p => ({ ...p, contact_name: e.target.value }))} className="h-8 text-sm" />
                            <Input placeholder="Email" value={manualForm.email} onChange={e => setManualForm(p => ({ ...p, email: e.target.value }))} className="h-8 text-sm" />
                          </div>
                          <Button size="sm" onClick={handleCreateManualCompany} disabled={!manualForm.company_name.trim()} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                            <Plus className="mr-1 h-3 w-3" /> Creează și selectează
                          </Button>
                        </div>
                      )}

                      {/* Brief text input (company mode) */}
                      <div className="space-y-2 pt-3 border-t border-border">
                        <Label className="text-xs font-medium">Brief de la client (opțional)</Label>
                        <Textarea
                          placeholder="Ex: Avem nevoie de materiale de onboarding pentru 50 de angajați noi..."
                          value={briefText}
                          onChange={e => setBriefText(e.target.value)}
                          rows={4}
                          className="resize-none text-sm"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button onClick={handleCompanyContinue} disabled={!selectedCompanyId} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20">
                          Continuă <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Enrichment Panel */}
                <div className="lg:col-span-3">
                  {company ? (
                    <CompanyEnrichmentPanel company={company} enrichment={enrichment || null} />
                  ) : (
                    <Card className="border-dashed border-2 border-muted flex items-center justify-center min-h-[300px]">
                      <div className="text-center space-y-2 p-8">
                        <Building2 className="h-10 w-10 mx-auto text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Selectează o companie din listă pentru a vedea datele detectate</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Email mode */}
          {step === 1 && inputMode === 'email' && (
            <motion.div key="s1-email" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Left: Email input */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" /> Lipește emailul primit
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Copiază conținutul emailului. Sistemul extrage automat compania, contactul, produsele cerute și tipul de cerere.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder={"Bună ziua,\n\nVă rugăm să ne transmiteți o prezentare și lista cu articolele/serviciile pe care le puteți oferi prin unitatea protejată.\n\nSuntem interesați de:\n- hârtie copiator\n- dosare\n- pixuri\n- materiale de prezentare\n\nCu stimă,\nIon Popescu\nManager Achiziții\nCompania ABC S.R.L.\nion.popescu@abc.ro\n+40 721 123 456"}
                      value={rawEmail}
                      onChange={e => setRawEmail(e.target.value)}
                      rows={14}
                      className="resize-none font-mono text-sm"
                    />
                    <Button
                      onClick={handleParseEmail}
                      disabled={!rawEmail.trim()}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Sparkles className="mr-2 h-4 w-4" /> Parse Email
                    </Button>
                  </CardContent>
                </Card>

                {/* Right: Extracted Brief */}
                <div className="max-h-[700px] overflow-y-auto pr-1">
                  {parsedEmail ? (
                    <ExtractedBriefPanel parsed={parsedEmail} onUseBrief={handleUseEmailAsBrief} onReparse={handleReparse} />
                  ) : (
                    <Card className="border-dashed border-2 border-muted flex items-center justify-center min-h-[400px]">
                      <div className="text-center space-y-2 p-8">
                        <Mail className="h-10 w-10 mx-auto text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Lipește un email și apasă "Parse Email" pentru a vedea brief-ul extras</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════ STEP 2: DATA GATHERING ═══════════ */}
          {/* Verify Company → Official Data → Web Research → Commercial Insights */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">

              {/* Company Resolution Panel */}
              {(parsedEmail?.company_name || inputMode === 'email') && (
                <CompanyResolutionPanel
                  parsedCompanyName={parsedEmail?.company_name || ''}
                  companies={data.companies}
                  selectedCompanyId={selectedCompanyId}
                  onConfirm={(id) => {
                    if (id) {
                      setSelectedCompanyId(id);
                      const matched = data.getCompany(id);
                      toast.success(`Companie confirmată: ${matched?.company_name || id}`);
                      addFlowStep('company_verified');
                    } else {
                      setSelectedCompanyId('');
                    }
                  }}
                  onSkip={() => {
                    toast.info('Continuă fără verificare companie. Brief-ul rămâne în draft.');
                    addFlowStep('company_verified');
                  }}
                />
              )}

              {/* For company mode: show confirmed company info */}
              {inputMode === 'company' && company && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Companie selectată: {company.company_name}</span>
                  {enrichment && (
                    <Badge variant="outline" className="text-[10px]">{enrichment.industry_label} • {enrichment.employee_count_estimate || '?'} angajați</Badge>
                  )}
                </div>
              )}

              {/* Official Company Data + Public Web Research */}
              {company && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <OfficialCompanyDataPanel company={company} enrichment={enrichment || null} />
                    {!emailFlowStatus.includes('data_loaded') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs text-muted-foreground"
                        onClick={() => addFlowStep('data_loaded')}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmă date oficiale
                      </Button>
                    )}
                  </div>
                  <div>
                    <PublicWebResearchPanel
                      company={company}
                      enrichment={enrichment || null}
                      onResearchComplete={(result: WebResearchResult) => {
                        setWebResearchResult(result);
                        addFlowStep('research_done');
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Commercial Insights Panel (if already generated) */}
              {commercialInsights && (
                <CommercialInsightsPanel data={commercialInsights} />
              )}

              {/* Brief text preview (read-only in step 2) */}
              {briefText && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Brief confirmat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{briefText}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">Analiza brief-ului se va face în pasul următor, după finalizarea research-ului.</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi
                </Button>
                <Button
                  onClick={handleProceedToAnalysis}
                  disabled={!company}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20"
                >
                  <BarChart3 className="mr-2 h-4 w-4" /> Continuă la analiză <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══════════ STEP 3: ANALYSIS & GENERATION ═══════════ */}
          {/* Analyze brief → Recommend products/kits → Generate presentation */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* Left: Brief Analysis + Generation */}
                <div className="lg:col-span-3 space-y-6">

                  {/* Brief Analysis Card */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-xl">Analiză Brief</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Analiza folosește: companie confirmată, date oficiale, research insights și textul brief-ului.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Ex: Avem nevoie de materiale de onboarding pentru 50 de angajați noi..."
                        value={briefText}
                        onChange={e => setBriefText(e.target.value)}
                        rows={5}
                        className="resize-none"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Ton prezentare</Label>
                          <Select value={tone} onValueChange={v => setTone(v as PresentationTone)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="corporate">Corporate</SelectItem>
                              <SelectItem value="friendly">Prietenos</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="technical">Tehnic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Template vizual</Label>
                          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {presentationTemplates.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        onClick={handleAnalyzeBrief}
                        disabled={!briefText.trim()}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Brain className="mr-2 h-4 w-4" /> Analizează brief-ul
                      </Button>

                      {briefAnalysis && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border bg-card p-4">
                            <MiniInfo label="Scop detectat" value={briefAnalysis.purpose} />
                            <MiniInfo label="Departament" value={briefAnalysis.department} />
                            <MiniInfo label="Audiență" value={briefAnalysis.audience} />
                            <MiniInfo label="Ton recomandat" value={briefAnalysis.tone} />
                          </div>
                          {briefAnalysis.detected_intents.length > 0 && (
                            <div className="rounded-xl border bg-card p-4">
                              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Intenții detectate</p>
                              <div className="flex flex-wrap gap-1">
                                {briefAnalysis.detected_intents.map((intent, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{intent}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {briefAnalysis.products.length > 0 && (
                            <div className="rounded-xl border bg-card p-4">
                              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Produse detectate</p>
                              <div className="flex flex-wrap gap-1">
                                {briefAnalysis.products.map((p, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <EligibilityReasoningPanel result={briefAnalysis.eligibility} title="Verdict eligibilitate brief" />
                          {briefAnalysis.brief_rules_matches && briefAnalysis.brief_rules_matches.length > 0 && (
                            <BriefRulesPanel
                              matches={briefAnalysis.brief_rules_matches}
                              pitchLines={briefAnalysis.pitch_lines_from_rules}
                              recommendedKits={briefAnalysis.recommended_kits_from_rules}
                            />
                          )}
                        </div>
                      )}

                      {!briefAnalysis && (
                        <div className="rounded-xl border border-dashed bg-muted/30 p-4">
                          <p className="mb-3 text-xs font-medium text-muted-foreground">Rezultate posibile ale analizei:</p>
                          <div className="flex flex-wrap gap-2">
                            <EligibilityBadge status="eligible" size="sm" />
                            <EligibilityBadge status="conditionally_eligible" size="sm" />
                            <EligibilityBadge status="not_eligible_but_convertible" size="sm" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Generation Card — only after brief analysis */}
                  {briefAnalysis && (
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-display text-xl">Generare prezentare</CardTitle>
                        <p className="text-sm text-muted-foreground">Verifică rezumatul și generează prezentarea comercială.</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {company && (
                          <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 font-display text-sm font-bold text-primary">{company.company_name.slice(0, 2).toUpperCase()}</div>
                                <div>
                                  <p className="font-display font-semibold text-foreground">{company.company_name}</p>
                                  <p className="text-xs text-muted-foreground">{company.contact_name} • {company.contact_department} • Ton: {tone}</p>
                                </div>
                              </div>
                              <EligibilityBadge status={briefAnalysis.eligibility.verdict} />
                            </div>
                            {enrichment && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{enrichment.industry_label}</span><span>•</span>
                                <span>{enrichment.employee_count_estimate || '?'} angajați</span><span>•</span>
                                <Badge variant={enrichment.enrichment_status === 'verified' ? 'default' : 'secondary'} className="text-[10px]">
                                  {enrichment.enrichment_status === 'verified' ? '✓ Verificat' : '~ Estimat'}
                                </Badge>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Template: <span className="font-medium text-foreground">{presentationTemplates.find(t => t.id === selectedTemplate)?.name}</span>
                            </div>
                          </div>
                        )}

                        {!generatedPresentationId ? (
                          <div className="flex justify-between pt-2">
                            <Button variant="outline" onClick={() => setStep(2)}>
                              <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi
                            </Button>
                            <Button onClick={handleGenerate} disabled={isGenerating} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25">
                              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                              {isGenerating ? 'Se generează...' : 'Generează prezentarea'}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                              <div>
                                <p className="font-medium text-emerald-800">Prezentare generată cu succes!</p>
                                <p className="text-xs text-emerald-600">Poți edita sau vizualiza preview-ul.</p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <Button variant="outline" onClick={() => navigate(`/editor/${generatedPresentationId}`)}>Editează prezentarea</Button>
                              <Button onClick={() => navigate(`/preview/${generatedPresentationId}`)} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20">Preview & Export</Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Ranked Products & Kits */}
                  {briefAnalysis && !generatedPresentationId && (
                    <>
                      {rankedProducts.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-display text-base font-semibold text-foreground">
                            Top produse recomandate
                            <span className="ml-2 text-xs font-normal text-muted-foreground">Intelligence-ranked</span>
                          </h3>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {rankedProducts.map((rp, i) => (
                              <div key={rp.product.id} className="relative">
                                <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">#{i + 1}</div>
                                <ProductCard product={rp.product} />
                                <div className="mt-1 flex items-center gap-1.5 px-1">
                                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${rp.score * 100}%` }} />
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground">{Math.round(rp.score * 100)}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {rankedKits.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-display text-base font-semibold text-foreground">
                            Top kituri recomandate
                            <span className="ml-2 text-xs font-normal text-muted-foreground">Intelligence-ranked</span>
                          </h3>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {rankedKits.map((rk, i) => (
                              <div key={rk.kit.id} className="relative">
                                <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">#{i + 1}</div>
                                <KitCard kit={rk.kit} />
                                <div className="mt-1 flex items-center gap-1.5 px-1">
                                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${rk.score * 100}%` }} />
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground">{Math.round(rk.score * 100)}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Right sidebar: Intelligence panels */}
                <div className="lg:col-span-2 space-y-4">
                  {!briefAnalysis && (
                    <div className="flex justify-start">
                      <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi la research
                      </Button>
                    </div>
                  )}

                  {detectedIntent && briefText.trim() && (
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-display text-sm flex items-center gap-1.5">
                          <Brain className="h-4 w-4 text-primary" /> Intent Detection (live)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Primary</span>
                          <Badge className="text-xs">{INTENT_LABELS[detectedIntent.primary_intent]}</Badge>
                        </div>
                        {detectedIntent.secondary_intent && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Secondary</span>
                            <Badge variant="secondary" className="text-xs">{INTENT_LABELS[detectedIntent.secondary_intent]}</Badge>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Confidence</span>
                          <span className="text-xs font-semibold text-foreground">{Math.round(detectedIntent.confidence * 100)}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {companySignals && company && (
                    <CompanyInsightsPanel
                      signals={companySignals}
                      intent={detectedIntent}
                      pitchStrategy={pitchStrategy}
                      industryFocus={industryProfile?.pitch_focus || ''}
                      opportunityEstimate={data.calculations.find(c => c.company_id === selectedCompanyId)?.spendable_half_estimated}
                    />
                  )}

                  {/* Commercial Insights summary in sidebar */}
                  {commercialInsights && (
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-display text-sm flex items-center gap-1.5">
                          <BarChart3 className="h-4 w-4 text-accent" /> Commercial Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-xs text-muted-foreground">{commercialInsights.business_model_summary}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Confidence</span>
                          <span className="text-xs font-semibold text-foreground">{commercialInsights.confidence_level}%</span>
                        </div>
                        {commercialInsights.recommended_pitch_angles.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {commercialInsights.recommended_pitch_angles.slice(0, 3).map((angle, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{angle}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
