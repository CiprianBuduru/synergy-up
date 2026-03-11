import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, FileText, Sparkles, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { analyzeBrief, checkEligibility, getRecommendedProducts, getRecommendedKits } from '@/lib/eligibility-engine';
import { generatePresentation } from '@/lib/presentation-generator';
import type { Company, PresentationTone, Brief } from '@/types';

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
  const [generatedPresentationId, setGeneratedPresentationId] = useState<string | null>(null);

  const company = data.getCompany(selectedCompanyId);
  const enrichment = data.getEnrichment(selectedCompanyId);

  const filteredCompanies = data.companies.filter(c =>
    c.company_name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleAnalyzeBrief = () => {
    if (!briefText.trim()) {
      // Skip brief, go to generation
      setStep(3);
      return;
    }
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
      eligibility_status: analysis.eligibility,
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
      id: presId,
      company_id: company.id,
      brief_id: brief?.id || null,
      title: `Prezentare ${company.company_name}`,
      objective: `Prezentare comercială pentru ${company.company_name}`,
      tone,
      status: 'presentation_generated',
      generated_summary: `Prezentare cu ${slides.length} slide-uri generată automat.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    data.setSlides(slides);
    setGeneratedPresentationId(presId);
  };

  const eligibilityIcon = (status: string) => {
    if (status === 'eligible') return <CheckCircle2 className="h-5 w-5 text-success" />;
    if (status === 'conditionally_eligible') return <AlertTriangle className="h-5 w-5 text-warning" />;
    return <XCircle className="h-5 w-5 text-destructive" />;
  };

  const eligibilityLabel = (status: string) => {
    if (status === 'eligible') return 'Eligibil';
    if (status === 'conditionally_eligible') return 'Eligibil condiționat';
    return 'Neeligibil — alternative disponibile';
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Wizard Steps */}
        <div className="flex items-center justify-center gap-2">
          {[
            { n: 1, label: 'Companie', icon: Building2 },
            { n: 2, label: 'Brief & Analiză', icon: FileText },
            { n: 3, label: 'Prezentare', icon: Sparkles },
          ].map(({ n, label, icon: Icon }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                step === n ? 'wizard-step-active' : step > n ? 'wizard-step-done' : 'wizard-step-pending'
              }`}>
                {n}
              </div>
              <span className={`hidden text-sm sm:inline ${step >= n ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
              {n < 3 && <div className="mx-2 h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Company */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selectează compania</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Caută companie..."
                    value={companySearch}
                    onChange={e => setCompanySearch(e.target.value)}
                  />
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {filteredCompanies.map(c => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCompanyId(c.id)}
                        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                          selectedCompanyId === c.id ? 'border-accent bg-accent/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <p className="font-medium text-foreground">{c.company_name}</p>
                        <p className="text-xs text-muted-foreground">{c.industry} • {c.location} • {c.contact_department}</p>
                      </div>
                    ))}
                  </div>
                  {company && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Selectat:</p>
                      <p className="font-medium text-foreground">{company.company_name}</p>
                      <p className="text-xs text-muted-foreground">Contact: {company.contact_name} ({company.contact_role})</p>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={() => setStep(2)} disabled={!selectedCompanyId} className="bg-accent text-accent-foreground hover:bg-accent/90">
                      Continuă <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Brief */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Brief & Analiză</CardTitle>
                  <p className="text-sm text-muted-foreground">Introdu brief-ul primit de la client sau lasă gol pentru generare automată.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Ex: Avem nevoie de materiale de onboarding pentru 50 de angajați noi..."
                    value={briefText}
                    onChange={e => setBriefText(e.target.value)}
                    rows={5}
                  />
                  <div className="space-y-2">
                    <Label className="text-xs">Ton prezentare</Label>
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
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi
                    </Button>
                    <Button onClick={handleAnalyzeBrief} className="bg-accent text-accent-foreground hover:bg-accent/90">
                      {briefText.trim() ? 'Analizează & Continuă' : 'Continuă fără brief'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {briefAnalysis && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {eligibilityIcon(briefAnalysis.eligibility)}
                      {eligibilityLabel(briefAnalysis.eligibility)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Scop detectat</p>
                        <p className="text-sm text-foreground">{briefAnalysis.purpose}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Departament</p>
                        <p className="text-sm text-foreground">{briefAnalysis.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Audiență</p>
                        <p className="text-sm text-foreground">{briefAnalysis.audience}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ton recomandat</p>
                        <p className="text-sm text-foreground">{briefAnalysis.tone}</p>
                      </div>
                    </div>
                    {briefAnalysis.products.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Produse detectate</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {briefAnalysis.products.map((p, i) => (
                            <Badge key={i} variant="outline">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Step 3: Generate */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generare Prezentare</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company && (
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <p className="font-medium text-foreground">{company.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {company.contact_name} • {company.contact_department} • Ton: {tone}
                      </p>
                      {briefAnalysis && (
                        <div className="flex items-center gap-2">
                          {eligibilityIcon(briefAnalysis.eligibility)}
                          <span className="text-sm text-foreground">{eligibilityLabel(briefAnalysis.eligibility)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!generatedPresentationId ? (
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi
                      </Button>
                      <Button onClick={handleGenerate} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        <Sparkles className="mr-2 h-4 w-4" /> Generează prezentarea
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <p className="text-sm font-medium text-foreground">Prezentarea a fost generată cu succes!</p>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => navigate(`/editor/${generatedPresentationId}`)}>
                          Editează prezentarea
                        </Button>
                        <Button
                          onClick={() => navigate(`/preview/${generatedPresentationId}`)}
                          className="bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          Preview & Export
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
