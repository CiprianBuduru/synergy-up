import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  ArrowLeft, ArrowRight, Mail, Sparkles, CheckCircle2, Brain,
  FileText, Save, Building2, Loader2, Eye,
} from 'lucide-react';
import { toast } from 'sonner';

import { parseEmailBrief, type ParsedEmailBrief, REQUEST_TYPE_LABELS, DOCUMENT_LABELS, PRESENTATION_TYPE_LABELS, EMAIL_RESPONSE_TYPE_LABELS } from '@/services/emailBriefParserService';
import { analyzeBrief, PURPOSE_LABELS } from '@/services/brief-analyzer';
import { detectIntent, INTENT_LABELS } from '@/services/intentDetectionService';
import { getRecommendedProducts, getRecommendedKits } from '@/services/recommendations';
import EligibilityReasoningPanel from '@/components/EligibilityReasoningPanel';
import BriefRulesPanel from '@/components/BriefRulesPanel';
import EligibilityBadge from '@/components/EligibilityBadge';
import CompanyResearchPanel from '@/components/CompanyResearchPanel';
import type { CompanyResearchResult } from '@/services/companyResearchService';
import { ProductCard, KitCard } from '@/components/ProductKitCards';
import { generatePresentation } from '@/lib/presentation-generator';
import { presentationTemplates } from '@/lib/presentation-templates';
import type { PresentationTone, Company } from '@/types';
import type { BriefAnalysisV2 } from '@/types/eligibility';

// ═══════════════════════════════════════════════════════════════
// EMAIL BRIEF FLOW — Clean 5-step, DB-independent pipeline
// ─────────────────────────────────────────────────────────────
// Step 1: Paste Email
// Step 2: Parse Email → view extracted data
// Step 3: Confirm Brief (editable form)
// Step 4: Analyze Brief (no DB, no company_id needed)
// Step 5: Generate Draft (presentation + email response)
// ═══════════════════════════════════════════════════════════════

type FlowState = 'paste' | 'parsed' | 'confirmed' | 'analyzed' | 'generated';

interface ConfirmedBrief {
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

const STEP_META = [
  { key: 'paste' as FlowState, label: '1. Paste Email', icon: Mail },
  { key: 'parsed' as FlowState, label: '2. Email Parsed', icon: Eye },
  { key: 'confirmed' as FlowState, label: '3. Brief Confirmed', icon: CheckCircle2 },
  { key: 'analyzed' as FlowState, label: '4. Analysis Ready', icon: Brain },
  { key: 'generated' as FlowState, label: '5. Draft Generated', icon: Sparkles },
];

export default function EmailBriefFlowPage() {
  const navigate = useNavigate();
  const data = useData();

  // ── State ──
  const [flowState, setFlowState] = useState<FlowState>('paste');
  const [rawEmail, setRawEmail] = useState('');
  const [parsedEmail, setParsedEmail] = useState<ParsedEmailBrief | null>(null);
  const [confirmedBrief, setConfirmedBrief] = useState<ConfirmedBrief | null>(null);
  const [briefAnalysis, setBriefAnalysis] = useState<BriefAnalysisV2 | null>(null);
  const [tone, setTone] = useState<PresentationTone>('corporate');
  const [selectedTemplate, setSelectedTemplate] = useState('corporate-clean');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPresentationId, setGeneratedPresentationId] = useState<string | null>(null);
  const [companyResearch, setCompanyResearch] = useState<CompanyResearchResult | null>(null);

  // Editable form state (for Step 3)
  const [editForm, setEditForm] = useState<ConfirmedBrief>({
    company_name: '', contact_name: '', contact_role: '', contact_email: '',
    contact_phone: '', industry_hint: '', location_hint: '', request_type: '',
    requested_items: [], requested_documents: [], requested_non_product_requests: [],
    raw_email_body: '',
  });

  const stepIndex = STEP_META.findIndex(s => s.key === flowState);

  // ── Step 1 → 2: Parse ──
  const handleParse = useCallback(() => {
    if (!rawEmail.trim()) return;
    const result = parseEmailBrief(rawEmail);
    setParsedEmail(result);

    // Pre-fill edit form
    setEditForm({
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

    setFlowState('parsed');
    toast.success('Email parsed successfully');
  }, [rawEmail]);

  // ── Step 2 → 3: Move to editable confirmation ──
  const handleMoveToConfirm = () => setFlowState('confirmed');

  // ── Step 3: Confirm brief (save to local state only) ──
  const handleConfirmBrief = useCallback(() => {
    setConfirmedBrief({ ...editForm });
    setFlowState('confirmed');
    toast.success('Brief confirmed — run company research or proceed to analysis');
  }, [editForm]);

  // Handler for research completion — enrich editForm with findings
  const handleResearchComplete = useCallback((res: CompanyResearchResult) => {
    setCompanyResearch(res);
    // Auto-fill empty fields from research
    setEditForm(prev => ({
      ...prev,
      industry_hint: prev.industry_hint || res.detected_industry,
      location_hint: prev.location_hint || res.detected_location,
    }));
    // Also update confirmedBrief if already confirmed
    setConfirmedBrief(prev => prev ? {
      ...prev,
      industry_hint: prev.industry_hint || res.detected_industry,
      location_hint: prev.location_hint || res.detected_location,
    } : prev);
  }, []);

  // ── Step 4: Analyze (no DB, no company_id) ──
  const handleAnalyze = useCallback(() => {
    const brief = confirmedBrief;
    if (!brief) return;

    const fullText = [
      brief.raw_email_body,
      brief.requested_items.join(', '),
      brief.requested_non_product_requests.join(', '),
      brief.industry_hint,
    ].filter(Boolean).join('\n');

    const analysis = analyzeBrief(fullText);
    setBriefAnalysis(analysis);
    setTone(analysis.tone as PresentationTone);
    toast.success('Brief analyzed — recommendations ready');
  }, [confirmedBrief]);

  // ── Step 5: Generate draft (presentation + optional DB persist) ──
  const handleGenerateDraft = useCallback(async () => {
    if (!briefAnalysis || !confirmedBrief) return;
    setIsGenerating(true);

    try {
      // Create a temporary in-memory company object (no DB write)
      const tempCompany: Company = {
        id: crypto.randomUUID(),
        company_name: confirmedBrief.company_name || 'Draft Company',
        legal_name: confirmedBrief.company_name || 'Draft Company',
        website: '',
        industry: confirmedBrief.industry_hint || '',
        company_size: '',
        location: confirmedBrief.location_hint || '',
        description: '',
        contact_name: confirmedBrief.contact_name || '',
        contact_role: confirmedBrief.contact_role || '',
        contact_department: briefAnalysis.department || 'General',
        email: confirmedBrief.contact_email || '',
        phone: confirmedBrief.contact_phone || '',
        notes: 'Draft — not saved to DB',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const tempId = crypto.randomUUID();
      const intent = detectIntent(confirmedBrief.raw_email_body);

      const slides = generatePresentation(tempId, tempCompany, null, null, null, tone, {
        signals: null,
        intent,
        pitchStrategy: null,
        eligibility: briefAnalysis.eligibility,
        rankedProducts: [],
        rankedKits: [],
      });

      // Store slides in memory for now — we'll persist only on explicit save
      setGeneratedPresentationId(tempId);
      setFlowState('generated');

      // Store generated data for optional later save
      (window as any).__draftPresentation = {
        tempCompany,
        slides,
        briefAnalysis,
        confirmedBrief,
        tone,
        template: selectedTemplate,
      };

      toast.success(`Draft generated — ${slides.length} slides`);
    } catch (err) {
      console.error('Draft generation error:', err);
      toast.error('Error generating draft. Try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [briefAnalysis, confirmedBrief, tone, selectedTemplate]);

  // ── Optional: Save to DB ──
  const handleSaveCompany = async () => {
    if (!confirmedBrief) return;
    const newCompany = await data.addCompany({
      company_name: confirmedBrief.company_name || 'Unknown',
      legal_name: confirmedBrief.company_name || 'Unknown',
      website: '',
      industry: confirmedBrief.industry_hint || '',
      company_size: '',
      location: confirmedBrief.location_hint || '',
      description: '',
      contact_name: confirmedBrief.contact_name || '',
      contact_role: confirmedBrief.contact_role || '',
      contact_department: briefAnalysis?.department || 'General',
      email: confirmedBrief.contact_email || '',
      phone: confirmedBrief.contact_phone || '',
      notes: 'Created from Email Brief Flow',
    });
    if (newCompany) toast.success(`Company saved: ${newCompany.company_name}`);
    return newCompany;
  };

  const handleSaveAll = async () => {
    const company = await handleSaveCompany();
    if (!company || !briefAnalysis || !confirmedBrief) return;

    const brief = await data.addBrief({
      company_id: company.id,
      raw_brief: confirmedBrief.raw_email_body,
      requested_products_json: briefAnalysis.products,
      requested_purpose: briefAnalysis.purpose,
      target_audience: briefAnalysis.audience,
      department_detected: briefAnalysis.department,
      tone_recommended: briefAnalysis.tone,
      eligibility_status: briefAnalysis.eligibility.verdict,
    });

    const draft = (window as any).__draftPresentation;
    if (draft?.slides) {
      const pres = await data.addPresentation({
        company_id: company.id,
        brief_id: brief?.id || null,
        title: `Prezentare ${company.company_name}`,
        objective: `Prezentare comercială`,
        tone,
        status: 'presentation_generated',
        generated_summary: `${draft.slides.length} slides generated.`,
      });
      if (pres) {
        const remapped = draft.slides.map((s: any) => ({ ...s, presentation_id: pres.id }));
        await data.setSlides(remapped);
        toast.success('Company + Brief + Presentation saved!');
        navigate(`/editor/${pres.id}`);
        return;
      }
    }
    toast.success('Company + Brief saved!');
  };

  // ── Derived analysis data for display ──
  const detectedIntentResult = confirmedBrief ? detectIntent(confirmedBrief.raw_email_body) : null;

  const updateEditField = (field: keyof ConfirmedBrief, value: any) =>
    setEditForm(prev => ({ ...prev, [field]: value }));

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ── Progress bar ── */}
        <div className="flex items-center justify-between px-2">
          {STEP_META.map(({ key, label, icon: Icon }, i) => (
            <div key={key} className="relative z-10 flex flex-col items-center gap-1">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 ${
                flowState === key
                  ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/30 scale-110'
                  : i <= stepIndex
                    ? 'bg-emerald-500 text-emerald-50'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] font-medium ${i <= stepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
          ))}
          <div className="absolute left-[60px] right-[60px] top-[18px] -z-0 h-0.5 bg-border" />
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════════ STEP 1: PASTE EMAIL ═══════════ */}
          {flowState === 'paste' && (
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
                    placeholder={"Bună ziua,\n\nVă scriu de la Maidan SRL...\n\nCu stimă,\nIon Popescu"}
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

          {/* ═══════════ STEP 2: PARSED RESULT ═══════════ */}
          {flowState === 'parsed' && parsedEmail && (
            <motion.div key="parsed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Email Parsed
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{parsedEmail.short_response_summary}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick overview */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniInfo label="Company" value={parsedEmail.company_name || '—'} />
                    <MiniInfo label="Contact" value={parsedEmail.contact_name || '—'} />
                    <MiniInfo label="Request type" value={REQUEST_TYPE_LABELS[parsedEmail.primary_request_type]} />
                    <MiniInfo label="Industry" value={parsedEmail.industry_hint || '—'} />
                  </div>

                  {/* Items detected */}
                  {parsedEmail.requested_items.length > 0 && (
                    <div className="rounded-xl border bg-card p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Requested Items</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedEmail.requested_items.map((item, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Flags */}
                  <div className="flex flex-wrap gap-2">
                    {parsedEmail.asks_for_price && <Badge variant="outline" className="text-xs">💰 Asks for price</Badge>}
                    {parsedEmail.asks_for_presentation && <Badge variant="outline" className="text-xs">📊 Asks for presentation</Badge>}
                    {parsedEmail.mentions_unitate_protejata && <Badge variant="outline" className="text-xs">🏭 Mentions UP</Badge>}
                    {parsedEmail.mentions_fond_handicap && <Badge variant="outline" className="text-xs">📋 Mentions Fond Handicap</Badge>}
                    {parsedEmail.asks_for_product_list && <Badge variant="outline" className="text-xs">📝 Asks for product list</Badge>}
                    {parsedEmail.asks_for_delivery_terms && <Badge variant="outline" className="text-xs">🚚 Delivery terms</Badge>}
                  </div>

                  {/* Rules matches */}
                  {parsedEmail.brief_rules_matches.length > 0 && (
                    <div className="rounded-xl border bg-card p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Rules Engine Matches ({parsedEmail.brief_rules_matches.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedEmail.brief_rules_matches.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {m.matched_keyword} → {m.rule.requested_item} ({Math.round(m.confidence * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  <div className="grid grid-cols-2 gap-3">
                    <MiniInfo label="Suggested presentation" value={PRESENTATION_TYPE_LABELS[parsedEmail.suggested_presentation_type]} />
                    <MiniInfo label="Suggested email response" value={EMAIL_RESPONSE_TYPE_LABELS[parsedEmail.suggested_email_response_type]} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setFlowState('paste')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to email
                </Button>
                <Button onClick={handleMoveToConfirm} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Edit & Confirm Brief <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══════════ STEP 3: CONFIRM BRIEF (editable) ═══════════ */}
          {(flowState === 'confirmed' || flowState === 'analyzed' || flowState === 'generated') && !confirmedBrief && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Confirm Brief
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Editează datele extrase și confirmă brief-ul. Nu se salvează nimic în DB.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Company Name</Label>
                      <Input value={editForm.company_name} onChange={e => updateEditField('company_name', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Contact Name</Label>
                      <Input value={editForm.contact_name} onChange={e => updateEditField('contact_name', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Contact Role</Label>
                      <Input value={editForm.contact_role} onChange={e => updateEditField('contact_role', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Contact Email</Label>
                      <Input value={editForm.contact_email} onChange={e => updateEditField('contact_email', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Contact Phone</Label>
                      <Input value={editForm.contact_phone} onChange={e => updateEditField('contact_phone', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Industry Hint</Label>
                      <Input value={editForm.industry_hint} onChange={e => updateEditField('industry_hint', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Location Hint</Label>
                      <Input value={editForm.location_hint} onChange={e => updateEditField('location_hint', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Request Type</Label>
                      <Input value={editForm.request_type} onChange={e => updateEditField('request_type', e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Requested Items (comma-separated)</Label>
                    <Textarea
                      value={editForm.requested_items.join(', ')}
                      onChange={e => updateEditField('requested_items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Non-product Requests (comma-separated)</Label>
                    <Textarea
                      value={editForm.requested_non_product_requests.join(', ')}
                      onChange={e => updateEditField('requested_non_product_requests', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Email Body (cleaned)</Label>
                    <Textarea
                      value={editForm.raw_email_body}
                      onChange={e => updateEditField('raw_email_body', e.target.value)}
                      rows={4}
                      className="resize-none text-sm"
                    />
                  </div>

                  <Button onClick={handleConfirmBrief} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Brief
                  </Button>
                </CardContent>
              </Card>

              <Button variant="outline" onClick={() => setFlowState('parsed')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to parsed view
              </Button>
            </motion.div>
          )}

          {/* ═══════════ STEP 3.5: COMPANY RESEARCH + CONTINUE TO ANALYSIS ═══════════ */}
          {confirmedBrief && !briefAnalysis && (
            <motion.div key="research" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              {/* Brief confirmed summary */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Brief confirmed</p>
                      <p className="text-xs text-muted-foreground">
                        Company: {confirmedBrief.company_name || 'Unknown'} · {confirmedBrief.requested_items.length} items · {confirmedBrief.request_type}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Research Panel — optional, non-blocking */}
              {confirmedBrief.company_name && (
                <CompanyResearchPanel
                  companyName={confirmedBrief.company_name}
                  onResearchComplete={handleResearchComplete}
                />
              )}

              {/* Continue to analysis — always available */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => { setConfirmedBrief(null); setFlowState('confirmed'); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Edit Brief
                </Button>
                <Button onClick={() => { handleAnalyze(); setFlowState('analyzed'); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Brain className="mr-2 h-4 w-4" /> Continue to Analysis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}




          {/* ═══════════ STEP 4 RESULTS + STEP 5 ═══════════ */}
          {briefAnalysis && confirmedBrief && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">

              {/* Analysis Results */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-xl flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" /> Analysis Results
                    </CardTitle>
                    <EligibilityBadge status={briefAnalysis.eligibility.verdict} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border bg-card p-4">
                    <MiniInfo label="Purpose" value={PURPOSE_LABELS[briefAnalysis.purpose] || briefAnalysis.purpose} />
                    <MiniInfo label="Department" value={briefAnalysis.department} />
                    <MiniInfo label="Audience" value={briefAnalysis.audience} />
                    <MiniInfo label="Tone" value={briefAnalysis.tone} />
                  </div>

                  {/* Detected intent */}
                  {detectedIntentResult && (
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Detected Intent</p>
                      <div className="flex items-center gap-3">
                        <Badge className="text-xs">{INTENT_LABELS[detectedIntentResult.primary_intent]}</Badge>
                        {detectedIntentResult.secondary_intent && (
                          <Badge variant="secondary" className="text-xs">{INTENT_LABELS[detectedIntentResult.secondary_intent]}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">Confidence: {Math.round(detectedIntentResult.confidence * 100)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Intents */}
                  {briefAnalysis.detected_intents.length > 0 && (
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Detected Intents</p>
                      <div className="flex flex-wrap gap-1.5">
                        {briefAnalysis.detected_intents.map((intent, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{intent}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products detected */}
                  {briefAnalysis.products.length > 0 && (
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Products Detected</p>
                      <div className="flex flex-wrap gap-1.5">
                        {briefAnalysis.products.map((p, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eligibility */}
                  <EligibilityReasoningPanel result={briefAnalysis.eligibility} title="Eligibility Reasoning" />

                  {/* Rules */}
                  {briefAnalysis.brief_rules_matches && briefAnalysis.brief_rules_matches.length > 0 && (
                    <BriefRulesPanel
                      matches={briefAnalysis.brief_rules_matches}
                      pitchLines={briefAnalysis.pitch_lines_from_rules}
                      recommendedKits={briefAnalysis.recommended_kits_from_rules}
                    />
                  )}

                  {/* Recommended products from parser */}
                  {parsedEmail && parsedEmail.recommended_products.length > 0 && (
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recommended Products</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedEmail.recommended_products.map((p, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-accent/5">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended kits */}
                  {parsedEmail && parsedEmail.recommended_kits.length > 0 && (
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recommended Kits</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedEmail.recommended_kits.map((k, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-primary/5">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pitch lines */}
                  {parsedEmail && parsedEmail.pitch_lines.length > 0 && (
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Pitch Lines</p>
                      <ul className="space-y-1">
                        {parsedEmail.pitch_lines.map((line, i) => (
                          <li key={i} className="text-sm text-foreground">• {line}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested types */}
                  {parsedEmail && (
                    <div className="grid grid-cols-2 gap-3">
                      <MiniInfo label="Suggested Presentation" value={PRESENTATION_TYPE_LABELS[parsedEmail.suggested_presentation_type]} />
                      <MiniInfo label="Suggested Email Response" value={EMAIL_RESPONSE_TYPE_LABELS[parsedEmail.suggested_email_response_type]} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Generate Draft ── */}
              {!generatedPresentationId && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-accent" /> Generate Draft
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Generate presentation draft without saving to DB.</p>
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
                      onClick={handleGenerateDraft}
                      disabled={isGenerating}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
                    >
                      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isGenerating ? 'Generating...' : 'Generate Draft Presentation'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* ── Draft Generated — optional persistence ── */}
              {generatedPresentationId && (
                <Card className="border-0 shadow-md border-accent/30">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                      <CheckCircle2 className="h-6 w-6 text-accent" />
                      <div>
                        <p className="font-medium text-foreground">Draft generated successfully!</p>
                        <p className="text-xs text-muted-foreground">Nothing saved to DB yet. Use the actions below to persist.</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-3">Optional: Save to Database</p>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" size="sm" onClick={handleSaveCompany}>
                          <Building2 className="mr-1.5 h-3.5 w-3.5" /> Save Company
                        </Button>
                        <Button size="sm" onClick={handleSaveAll} className="bg-accent text-accent-foreground hover:bg-accent/90">
                          <Save className="mr-1.5 h-3.5 w-3.5" /> Save All (Company + Brief + Presentation)
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Back button */}
              {!generatedPresentationId && (
                <Button variant="outline" onClick={() => { setBriefAnalysis(null); setFlowState('confirmed'); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to edit brief
                </Button>
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
