import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import CompanyEnrichmentPanel from '@/components/CompanyEnrichmentPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, FileText, Sparkles, CheckCircle2, Search, MapPin, User, Plus, Users } from 'lucide-react';
import { analyzeBrief, getRecommendedProducts, getRecommendedKits } from '@/lib/eligibility-engine';
import { generatePresentation } from '@/lib/presentation-generator';
import { presentationTemplates } from '@/lib/presentation-templates';
import { ProductCard, KitCard } from '@/components/ProductKitCards';
import EligibilityBadge from '@/components/EligibilityBadge';
import type { PresentationTone, Brief, Company } from '@/types';

export default function NewPresentationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const data = useData();
  const preselectedCompanyId = searchParams.get('company');

  const [step, setStep] = useState(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState(preselectedCompanyId || '');
  const [companySearch, setCompanySearch] = useState('');
  const [briefText, setBriefText] = useState('');
  const [briefAnalysis, setBriefAnalysis] = useState<ReturnType<typeof analyzeBrief> | null>(null);
  const [tone, setTone] = useState<PresentationTone>('corporate');
  const [selectedTemplate, setSelectedTemplate] = useState('corporate-clean');
  const [generatedPresentationId, setGeneratedPresentationId] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualForm, setManualForm] = useState({ company_name: '', industry: '', company_size: '', location: '', contact_name: '', contact_role: '', contact_department: 'HR', email: '' });

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

  const handleAnalyzeBrief = () => {
    if (!briefText.trim()) { setStep(3); return; }
    const analysis = analyzeBrief(briefText);
    setBriefAnalysis(analysis);
    const brief: Brief = {
      id: `brief-${Date.now()}`,
      company_id: selectedCompanyId,
      raw_brief: briefText,
      requested_products_json: analysis.products,
      requested_purpose: analysis.purpose,
      target_audience: analysis.audience,
      department_detected: analysis.department,
      tone_recommended: analysis.tone,
      eligibility_status: analysis.eligibility.verdict,
      created_at: new Date().toISOString(),
    };
    data.addBrief(brief);
    setTone(analysis.tone as PresentationTone);
    setStep(3);
  };

  const handleGenerate = () => {
    if (!company) return;
    const presId = `pres-${Date.now()}`;
    const calc = data.calculations.find(c => c.company_id === company.id);
    const brief = data.briefs.find(b => b.company_id === company.id);
    const slides = generatePresentation(presId, company, enrichment || null, calc || null, brief || null, tone);
    data.addPresentation({
      id: presId, company_id: company.id, brief_id: brief?.id || null,
      title: `Prezentare ${company.company_name}`,
      objective: `Prezentare comercială pentru ${company.company_name}`,
      tone, status: 'presentation_generated',
      generated_summary: `Prezentare cu ${slides.length} slide-uri generată automat.`,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    data.setSlides(slides);
    setGeneratedPresentationId(presId);
  };

  const handleCreateManualCompany = () => {
    const newId = `manual-${Date.now()}`;
    const newCompany: Company = {
      id: newId,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.addCompany(newCompany);
    setSelectedCompanyId(newId);
    setShowManualEntry(false);
  };

  const purpose = briefAnalysis?.purpose || 'General corporate';
  const industry = company?.industry || '';
  const recommendedProducts = getRecommendedProducts(purpose, company?.contact_department || '');
  const recommendedKits = getRecommendedKits(purpose, industry);

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Wizard header */}
        <div className="relative flex items-center justify-between px-4">
          {[
            { n: 1, label: 'Companie', icon: Building2 },
            { n: 2, label: 'Brief & Analiză', icon: FileText },
            { n: 3, label: 'Generare', icon: Sparkles },
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

        <AnimatePresence mode="wait">
          {/* Step 1: Company */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
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
                        <Input
                          placeholder="Caută după nume, industrie, locație..."
                          value={companySearch}
                          onChange={e => setCompanySearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {companySearch && (
                        <p className="text-xs text-muted-foreground">
                          {filteredCompanies.length} rezultat{filteredCompanies.length !== 1 ? 'e' : ''} găsite
                        </p>
                      )}
                      <div className="max-h-[400px] space-y-1 overflow-y-auto pr-1">
                        {filteredCompanies.map(c => {
                          const cEnrichment = data.getEnrichment(c.id);
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCompanyId(c.id)}
                              className={`cursor-pointer rounded-xl border p-3 transition-all ${
                                selectedCompanyId === c.id
                                  ? 'border-accent bg-accent/5 shadow-sm shadow-accent/10'
                                  : 'border-transparent hover:bg-muted/50 hover:border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 font-display text-[10px] font-bold text-primary">
                                  {c.company_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{c.company_name}</p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <span>{c.industry}</span>
                                    <span>•</span>
                                    <span>{c.location}</span>
                                    {cEnrichment && (
                                      <>
                                        <span>•</span>
                                        <Users className="h-2.5 w-2.5" />
                                        <span>{cEnrichment.employee_count_estimate || '?'}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {selectedCompanyId === c.id && <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Manual entry form */}
                      {showManualEntry && (
                        <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-4 space-y-3">
                          <p className="text-xs font-semibold text-accent-foreground">Creare companie rapidă</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <Input placeholder="Nume companie *" value={manualForm.company_name} onChange={e => setManualForm(p => ({ ...p, company_name: e.target.value }))} className="h-8 text-sm" />
                            </div>
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

                      <div className="flex justify-end pt-2">
                        <Button onClick={() => setStep(2)} disabled={!selectedCompanyId} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20">
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

          {/* Step 2: Brief */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-xl">Brief & Analiză</CardTitle>
                  <p className="text-sm text-muted-foreground">Introdu brief-ul primit de la client. Sistemul analizează automat eligibilitatea.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Ex: Avem nevoie de materiale de onboarding pentru 50 de angajați noi. Vrem tricouri, agende, welcome cards și un pachet cadou pentru manageri..."
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
                  
                  {briefAnalysis && (
                    <div className="space-y-4 rounded-xl border bg-card p-4">
                      <div className="flex items-center gap-3">
                        <EligibilityBadge status={briefAnalysis.eligibility.verdict} size="lg" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <MiniInfo label="Scop detectat" value={briefAnalysis.purpose} />
                        <MiniInfo label="Departament" value={briefAnalysis.department} />
                        <MiniInfo label="Audiență" value={briefAnalysis.audience} />
                        <MiniInfo label="Ton recomandat" value={briefAnalysis.tone} />
                      </div>
                      {briefAnalysis.products.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Produse detectate</p>
                          <div className="flex flex-wrap gap-1">
                            {briefAnalysis.products.map((p, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                            ))}
                          </div>
                        </div>
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

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi
                    </Button>
                    <Button onClick={handleAnalyzeBrief} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20">
                      {briefText.trim() ? 'Analizează & Continuă' : 'Continuă fără brief'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Generate */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-6">
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
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 font-display text-sm font-bold text-primary">
                            {company.company_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-display font-semibold text-foreground">{company.company_name}</p>
                            <p className="text-xs text-muted-foreground">{company.contact_name} • {company.contact_department} • Ton: {tone}</p>
                          </div>
                        </div>
                        {briefAnalysis && <EligibilityBadge status={briefAnalysis.eligibility.verdict} />}
                      </div>
                      {enrichment && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{enrichment.industry_label}</span>
                          <span>•</span>
                          <span>{enrichment.employee_count_estimate || '?'} angajați</span>
                          <span>•</span>
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
                      <Button onClick={handleGenerate} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25">
                        <Sparkles className="mr-2 h-4 w-4" /> Generează prezentarea
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
                        <Button variant="outline" onClick={() => navigate(`/editor/${generatedPresentationId}`)}>
                          Editează prezentarea
                        </Button>
                        <Button onClick={() => navigate(`/preview/${generatedPresentationId}`)} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20">
                          Preview & Export
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommended products & kits */}
              {!generatedPresentationId && (
                <>
                  {recommendedProducts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-display text-base font-semibold text-foreground">Produse eligibile recomandate</h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {recommendedProducts.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
                      </div>
                    </div>
                  )}
                  {recommendedKits.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-display text-base font-semibold text-foreground">Kituri eligibile recomandate</h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {recommendedKits.slice(0, 4).map(k => <KitCard key={k.id} kit={k} />)}
                      </div>
                    </div>
                  )}
                </>
              )}
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
