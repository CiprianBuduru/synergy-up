import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Mail, Sparkles, CheckCircle2, Brain,
  FileText, Save, Building2, Loader2, Eye,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  parseEmailBrief,
  type ParsedEmailBrief,
  REQUEST_TYPE_LABELS,
  PRESENTATION_TYPE_LABELS,
  EMAIL_RESPONSE_TYPE_LABELS,
} from '@/services/emailBriefParserService';
import { analyzeBrief, PURPOSE_LABELS } from '@/services/brief-analyzer';
import { detectIntent, INTENT_LABELS } from '@/services/intentDetectionService';
import EligibilityReasoningPanel from '@/components/EligibilityReasoningPanel';
import BriefRulesPanel from '@/components/BriefRulesPanel';
import EligibilityBadge from '@/components/EligibilityBadge';
import CompanyResearchPanel from '@/components/CompanyResearchPanel';
import type { CompanyResearchResult } from '@/services/companyResearchService';
import { generatePresentation } from '@/lib/presentation-generator';
import { presentationTemplates } from '@/lib/presentation-templates';
import type { PresentationTone, Company } from '@/types';
import type { BriefAnalysisV2 } from '@/types/eligibility';

import InboundEditableFields from '@/components/inbound/InboundEditableFields';

// ═══════════════════════════════════════════════════════════════
// INBOUND BRIEF WORKSPACE — Clean 5-step, DB-free pipeline
// ═══════════════════════════════════════════════════════════════

type FlowStep = 'paste' | 'extracted' | 'review' | 'analyze' | 'draft';

export interface InboundBrief {
  company_name: string;
  contact_name: string;
  contact_role: string;
  contact_email: string;
  contact_phone: string;
  industry_hint: string;
  location_hint: string;
  request_type: string;
  requested_items: string[];
  requested_documents: string[];
  requested_non_product_requests: string[];
  raw_email_body: string;
}

const STEPS: { key: FlowStep; label: string; icon: typeof Mail }[] = [
  { key: 'paste', label: '1. Paste Email', icon: Mail },
  { key: 'extracted', label: '2. Extract Fields', icon: Eye },
  { key: 'review', label: '3. Review & Edit', icon: FileText },
  { key: 'analyze', label: '4. Analyze', icon: Brain },
  { key: 'draft', label: '5. Generate Draft', icon: Sparkles },
];

export default function InboundBriefWorkspace() {
  const navigate = useNavigate();
  const data = useData();

  const [step, setStep] = useState<FlowStep>('paste');
  const [rawEmail, setRawEmail] = useState('');
  const [parsedEmail, setParsedEmail] = useState<ParsedEmailBrief | null>(null);
  const [brief, setBrief] = useState<InboundBrief | null>(null);
  const [analysis, setAnalysis] = useState<BriefAnalysisV2 | null>(null);
  const [companyResearch, setCompanyResearch] = useState<CompanyResearchResult | null>(null);
  const [tone, setTone] = useState<PresentationTone>('corporate');
  const [selectedTemplate, setSelectedTemplate] = useState('corporate-clean');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Editable form state
  const [form, setForm] = useState<InboundBrief>({
    company_name: '', contact_name: '', contact_role: '', contact_email: '',
    contact_phone: '', industry_hint: '', location_hint: '', request_type: '',
    requested_items: [], requested_documents: [], requested_non_product_requests: [],
    raw_email_body: '',
  });

  const stepIdx = STEPS.findIndex(s => s.key === step);

  // ── Step 1 → 2: Parse ──
  const handleParse = useCallback(() => {
    if (!rawEmail.trim()) return;
    const result = parseEmailBrief(rawEmail);
    setParsedEmail(result);
    setForm({
      company_name: result.company_name || '',
      contact_name: result.contact_name || '',
      contact_role: result.contact_role || '',
      contact_email: result.contact_email || '',
      contact_phone: result.contact_phone || '',
      industry_hint: result.industry_hint || '',
      location_hint: result.location_hint || '',
      request_type: result.primary_request_type,
      requested_items: result.requested_items,
      requested_documents: result.requested_documents,
      requested_non_product_requests: result.requested_non_product_requests,
      raw_email_body: result.cleaned_body,
    });
    setStep('extracted');
    toast.success('Email parsed — fields extracted');
  }, [rawEmail]);

  // ── Step 3: Confirm ──
  const handleConfirm = useCallback(() => {
    setBrief({ ...form });
    setStep('analyze');
    toast.success('Brief confirmed — ready for analysis');
  }, [form]);

  // Research callback
  const handleResearchComplete = useCallback((res: CompanyResearchResult) => {
    setCompanyResearch(res);
    setForm(prev => ({
      ...prev,
      industry_hint: prev.industry_hint || res.detected_industry,
      location_hint: prev.location_hint || res.detected_location,
    }));
  }, []);

  // ── Step 4: Analyze ──
  const handleAnalyze = useCallback(() => {
    const b = brief;
    if (!b) return;
    const fullText = [b.raw_email_body, b.requested_items.join(', '), b.requested_non_product_requests.join(', '), b.industry_hint].filter(Boolean).join('\n');
    const result = analyzeBrief(fullText);
    setAnalysis(result);
    setTone(result.tone as PresentationTone);
    toast.success('Analysis complete');
  }, [brief]);

  // ── Step 5: Generate ──
  const handleGenerate = useCallback(async () => {
    if (!analysis || !brief) return;
    setIsGenerating(true);
    try {
      const tempCompany: Company = {
        id: crypto.randomUUID(),
        company_name: brief.company_name || 'Draft Company',
        legal_name: brief.company_name || 'Draft Company',
        website: companyResearch?.detected_website || '',
        industry: brief.industry_hint || '',
        company_size: '',
        location: brief.location_hint || '',
        description: companyResearch?.short_company_summary || '',
        contact_name: brief.contact_name || '',
        contact_role: brief.contact_role || '',
        contact_department: analysis.department || 'General',
        email: brief.contact_email || '',
        phone: brief.contact_phone || '',
        notes: 'Draft — not saved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const presId = crypto.randomUUID();
      const intent = detectIntent(brief.raw_email_body);
      const slides = generatePresentation(presId, tempCompany, null, null, null, tone, {
        signals: null, intent, pitchStrategy: null,
        eligibility: analysis.eligibility, rankedProducts: [], rankedKits: [],
      });
      setDraftId(presId);
      setStep('draft');
      (window as any).__inboundDraft = { tempCompany, slides, analysis, brief, tone, template: selectedTemplate };
      toast.success(`Draft generated — ${slides.length} slides`);
    } catch (err) {
      console.error('Draft generation error:', err);
      toast.error('Error generating draft');
    } finally {
      setIsGenerating(false);
    }
  }, [analysis, brief, tone, selectedTemplate, companyResearch]);

  // ── Optional DB persistence ──
  const handleSaveAll = async () => {
    if (!brief || !analysis) return;
    const company = await data.addCompany({
      company_name: brief.company_name || 'Unknown',
      legal_name: brief.company_name || 'Unknown',
      website: companyResearch?.detected_website || '',
      industry: brief.industry_hint || '',
      company_size: '',
      location: brief.location_hint || '',
      description: companyResearch?.short_company_summary || '',
      contact_name: brief.contact_name || '',
      contact_role: brief.contact_role || '',
      contact_department: analysis.department || 'General',
      email: brief.contact_email || '',
      phone: brief.contact_phone || '',
      notes: 'Created from Inbound Brief Workspace',
    });
    if (!company) return;
    const savedBrief = await data.addBrief({
      company_id: company.id,
      raw_brief: brief.raw_email_body,
      requested_products_json: analysis.products,
      requested_purpose: analysis.purpose,
      target_audience: analysis.audience,
      department_detected: analysis.department,
      tone_recommended: analysis.tone,
      eligibility_status: analysis.eligibility.verdict,
    });
    const draft = (window as any).__inboundDraft;
    if (draft?.slides) {
      const pres = await data.addPresentation({
        company_id: company.id,
        brief_id: savedBrief?.id || null,
        title: `Prezentare ${company.company_name}`,
        objective: 'Prezentare comercială',
        tone,
        status: 'presentation_generated',
        generated_summary: `${draft.slides.length} slides generated.`,
      });
      if (pres) {
        await data.setSlides(draft.slides.map((s: any) => ({ ...s, presentation_id: pres.id })));
        toast.success('Everything saved!');
        navigate(`/editor/${pres.id}`);
        return;
      }
    }
    toast.success('Company + Brief saved');
  };

  const detectedIntent = brief ? detectIntent(brief.raw_email_body) : null;
  const updateField = (field: keyof InboundBrief, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ── Progress ── */}
        <div className="flex items-center justify-between px-2">
          {STEPS.map(({ key, label, icon: Icon }, i) => (
            <div key={key} className="relative z-10 flex flex-col items-center gap-1">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 ${
                step === key
                  ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/30 scale-110'
                  : i <= stepIdx
                    ? 'bg-emerald-500 text-emerald-50'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i < stepIdx ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] font-medium ${i <= stepIdx ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
          ))}
          <div className="absolute left-[60px] right-[60px] top-[18px] -z-0 h-0.5 bg-border" />
        </div>

        <AnimatePresence mode="wait">
          {/* ═══ STEP 1: PASTE EMAIL ═══ */}
          {step === 'paste' && (
            <motion.div key="paste" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" /> Paste Email
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Copiază emailul primit. Sistemul extrage automat datele relevante.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={"Bună ziua,\n\nVă scriu de la companie...\n\nCu stimă,\nIon Popescu"}
                    value={rawEmail}
                    onChange={e => setRawEmail(e.target.value)}
                    rows={16}
                    className="resize-none font-mono text-sm"
                  />
                  <Button onClick={handleParse} disabled={!rawEmail.trim()} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    <Sparkles className="mr-2 h-4 w-4" /> Parse Email
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══ STEP 2: EXTRACT FIELDS ═══ */}
          {step === 'extracted' && parsedEmail && (
            <motion.div key="extracted" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Extracted Fields
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{parsedEmail.short_response_summary}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniInfo label="Company" value={parsedEmail.company_name || '—'} />
                    <MiniInfo label="Contact" value={parsedEmail.contact_name || '—'} />
                    <MiniInfo label="Role" value={parsedEmail.contact_role || '—'} />
                    <MiniInfo label="Request type" value={REQUEST_TYPE_LABELS[parsedEmail.primary_request_type]} />
                  </div>

                  {parsedEmail.requested_items.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Requested Items</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedEmail.requested_items.map((item, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {parsedEmail.asks_for_price && <Badge variant="outline" className="text-xs">💰 Price</Badge>}
                    {parsedEmail.asks_for_presentation && <Badge variant="outline" className="text-xs">📊 Presentation</Badge>}
                    {parsedEmail.mentions_unitate_protejata && <Badge variant="outline" className="text-xs">🏭 UP</Badge>}
                    {parsedEmail.mentions_fond_handicap && <Badge variant="outline" className="text-xs">📋 Fond Handicap</Badge>}
                    {parsedEmail.asks_for_product_list && <Badge variant="outline" className="text-xs">📝 Product list</Badge>}
                    {parsedEmail.asks_for_delivery_terms && <Badge variant="outline" className="text-xs">🚚 Delivery</Badge>}
                  </div>

                  {parsedEmail.brief_rules_matches.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Rules Engine ({parsedEmail.brief_rules_matches.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedEmail.brief_rules_matches.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {m.matched_keyword} → {m.rule.requested_item} ({Math.round(m.confidence * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <MiniInfo label="Suggested presentation" value={PRESENTATION_TYPE_LABELS[parsedEmail.suggested_presentation_type]} />
                    <MiniInfo label="Suggested email response" value={EMAIL_RESPONSE_TYPE_LABELS[parsedEmail.suggested_email_response_type]} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('paste')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep('review')} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Review & Edit <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: REVIEW & EDIT ═══ */}
          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <InboundEditableFields form={form} updateField={updateField} />

              {/* Company Research — optional */}
              {form.company_name && (
                <CompanyResearchPanel
                  companyName={form.company_name}
                  onResearchComplete={handleResearchComplete}
                />
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('extracted')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleConfirm} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Brief <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 4: ANALYZE ═══ */}
          {step === 'analyze' && brief && (
            <motion.div key="analyze" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              {/* Brief confirmed banner */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Brief confirmed</p>
                      <p className="text-xs text-muted-foreground">
                        {brief.company_name || 'Unknown'} · {brief.requested_items.length} items · {brief.request_type}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!analysis ? (
                <Button onClick={handleAnalyze} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Brain className="mr-2 h-4 w-4" /> Run Analysis
                </Button>
              ) : (
                <>
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-display text-xl flex items-center gap-2">
                          <Brain className="h-5 w-5 text-primary" /> Analysis Results
                        </CardTitle>
                        <EligibilityBadge status={analysis.eligibility.verdict} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-border bg-card p-4">
                        <MiniInfo label="Purpose" value={PURPOSE_LABELS[analysis.purpose] || analysis.purpose} />
                        <MiniInfo label="Department" value={analysis.department} />
                        <MiniInfo label="Audience" value={analysis.audience} />
                        <MiniInfo label="Tone" value={analysis.tone} />
                      </div>

                      {detectedIntent && (
                        <div className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Detected Intent</p>
                          <div className="flex items-center gap-3">
                            <Badge className="text-xs">{INTENT_LABELS[detectedIntent.primary_intent]}</Badge>
                            {detectedIntent.secondary_intent && (
                              <Badge variant="secondary" className="text-xs">{INTENT_LABELS[detectedIntent.secondary_intent]}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">Confidence: {Math.round(detectedIntent.confidence * 100)}%</span>
                          </div>
                        </div>
                      )}

                      {analysis.products.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Products Detected</p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.products.map((p, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <EligibilityReasoningPanel result={analysis.eligibility} title="Eligibility Reasoning" />

                      {analysis.brief_rules_matches && analysis.brief_rules_matches.length > 0 && (
                        <BriefRulesPanel
                          matches={analysis.brief_rules_matches}
                          pitchLines={analysis.pitch_lines_from_rules}
                          recommendedKits={analysis.recommended_kits_from_rules}
                        />
                      )}

                      {parsedEmail && parsedEmail.recommended_products.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Recommended Products</p>
                          <div className="flex flex-wrap gap-1.5">
                            {parsedEmail.recommended_products.map((p, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-accent/5">{p}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedEmail && parsedEmail.recommended_kits.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Recommended Kits</p>
                          <div className="flex flex-wrap gap-1.5">
                            {parsedEmail.recommended_kits.map((k, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-primary/5">{k}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedEmail && parsedEmail.pitch_lines.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Pitch Lines</p>
                          <ul className="space-y-1">
                            {parsedEmail.pitch_lines.map((line, i) => (
                              <li key={i} className="text-sm text-foreground">• {line}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {parsedEmail && (
                        <div className="grid grid-cols-2 gap-3">
                          <MiniInfo label="Suggested Presentation" value={PRESENTATION_TYPE_LABELS[parsedEmail.suggested_presentation_type]} />
                          <MiniInfo label="Suggested Email Response" value={EMAIL_RESPONSE_TYPE_LABELS[parsedEmail.suggested_email_response_type]} />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Generate draft section */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-xl flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" /> Generate Draft
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Tone</Label>
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
                          <Label className="text-xs font-medium">Template</Label>
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
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
                      >
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Generating...' : 'Generate Draft Presentation'}
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              <Button variant="outline" onClick={() => { setAnalysis(null); setStep('review'); }}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to edit
              </Button>
            </motion.div>
          )}

          {/* ═══ STEP 5: DRAFT GENERATED ═══ */}
          {step === 'draft' && draftId && (
            <motion.div key="draft" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                    <CheckCircle2 className="h-6 w-6 text-accent" />
                    <div>
                      <p className="font-medium text-foreground">Draft generated!</p>
                      <p className="text-xs text-muted-foreground">Nothing saved to DB yet. Use actions below to persist.</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Optional: Save to Database</p>
                    <div className="flex flex-wrap gap-3">
                      <Button size="sm" onClick={handleSaveAll} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        <Save className="mr-1.5 h-3.5 w-3.5" /> Save All (Company + Brief + Presentation)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" onClick={() => { setDraftId(null); setStep('analyze'); }}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to analysis
              </Button>
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
