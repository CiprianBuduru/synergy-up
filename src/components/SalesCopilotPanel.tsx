// ─── Sales Copilot Panel ─────────────────────────────────────────────
// Full sales intelligence panel for CompanyPage with insights, pitch, email, timeline.

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Mail, MessageSquare, Clock, ChevronDown, ChevronUp,
  Copy, Check, Zap, Target, BarChart3, Send,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { analyzeCompanySignals, type CompanySignals } from '@/services/companySignalsService';
import { detectIntent, type DetectedIntent } from '@/services/intentDetectionService';
import { generateOpportunityInsights, type OpportunityInsights } from '@/services/opportunityInsightsService';
import { generateQuickPitch, type QuickPitch } from '@/services/quickPitchService';
import { generateSalesEmail, type SalesEmail } from '@/services/salesEmailService';
import { generatePitchStrategy, type PitchStrategy } from '@/services/pitchStrategyService';
import { rankProducts, rankKits } from '@/services/solutionRankingService';
import {
  fetchFollowUp, upsertFollowUp, fetchTimelineEvents, addTimelineEvent,
  type CompanyFollowUp, type TimelineEvent, type FollowUpStatus,
  FOLLOW_UP_STATUS_CONFIG,
} from '@/services/followUpService';
import type { Company, CompanyEnrichment } from '@/types';
import { toast } from '@/hooks/use-toast';

interface Props {
  company: Company;
  enrichment: CompanyEnrichment | null;
}

export default function SalesCopilotPanel({ company, enrichment }: Props) {
  const { calculations, briefs, products, kits } = useData();
  const calc = calculations.find(c => c.company_id === company.id) || null;
  const brief = briefs.find(b => b.company_id === company.id) || null;

  // State
  const [signals, setSignals] = useState<CompanySignals | null>(null);
  const [intent, setIntent] = useState<DetectedIntent | null>(null);
  const [insights, setInsights] = useState<OpportunityInsights | null>(null);
  const [pitch, setPitch] = useState<QuickPitch | null>(null);
  const [email, setEmail] = useState<SalesEmail | null>(null);
  const [followUp, setFollowUp] = useState<CompanyFollowUp | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('insights');
  const [copied, setCopied] = useState<string | null>(null);

  const industry = enrichment?.industry_label || company.industry || '';
  const department = company.contact_department || 'General';

  // Compute intelligence
  useEffect(() => {
    const s = analyzeCompanySignals(company, enrichment, brief?.raw_brief);
    setSignals(s);

    const i = brief?.raw_brief ? detectIntent(brief.raw_brief) : null;
    setIntent(i);

    const ins = generateOpportunityInsights(enrichment, s, i, industry, calc);
    setInsights(ins);

    const defaultIntent: DetectedIntent = i || { primary_intent: 'onboarding', secondary_intent: null, confidence: 0.5, all_intents: [] };
    const strategy = generatePitchStrategy(s, defaultIntent, industry, calc?.spendable_half_estimated);

    const qp = generateQuickPitch(company.company_name, industry, s, i, ins);
    setPitch(qp);

    const rankedP = rankProducts(products, industry, department, defaultIntent, s);
    const rankedK = rankKits(kits, industry, department, defaultIntent, s);
    const se = generateSalesEmail(company.company_name, company.contact_name, strategy, ins, rankedP.slice(0, 5), rankedK.slice(0, 3));
    setEmail(se);
  }, [company, enrichment, brief, calc, products, kits, industry, department]);

  // Load follow-up and timeline
  useEffect(() => {
    fetchFollowUp(company.id).then(setFollowUp);
    fetchTimelineEvents(company.id).then(setTimeline);
  }, [company.id]);

  const handleStatusChange = useCallback(async (status: FollowUpStatus) => {
    const result = await upsertFollowUp(company.id, status);
    if (result) {
      setFollowUp(result);
      fetchTimelineEvents(company.id).then(setTimeline);
      toast({ title: 'Status actualizat', description: FOLLOW_UP_STATUS_CONFIG[status].label });
    }
  }, [company.id]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggle = (section: string) => setExpandedSection(prev => prev === section ? null : section);

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleCopy(text, id)}>
      {copied === id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-accent" />
        <h2 className="font-display text-lg font-bold text-foreground">Sales Copilot</h2>
      </div>

      {/* Follow-up Status */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status oportunitate</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(FOLLOW_UP_STATUS_CONFIG) as [FollowUpStatus, typeof FOLLOW_UP_STATUS_CONFIG[FollowUpStatus]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                  followUp?.status === key ? cfg.color + ' ring-2 ring-offset-1 ring-primary/30' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>{cfg.icon}</span> {cfg.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Opportunity Insights */}
      {insights && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <button className="w-full" onClick={() => toggle('insights')}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <CardTitle className="text-sm">Opportunity Insights</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{insights.opportunity_score}/100</Badge>
                {expandedSection === 'insights' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </button>
          <AnimatePresence>
            {expandedSection === 'insights' && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Scor oportunitate</p>
                      <p className="font-display text-2xl font-bold text-foreground">{insights.opportunity_score}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Buget lunar estimat</p>
                      <p className="font-display text-lg font-bold text-foreground">{insights.estimated_monthly_budget.toLocaleString('ro-RO')} <span className="text-xs font-normal">RON</span></p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nivel încredere</p>
                      <p className="text-sm font-semibold capitalize text-foreground">{insights.confidence_level}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Punct intrare</p>
                      <p className="text-sm font-semibold text-foreground">{insights.best_entry_point_department}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-accent/5 border border-accent/10 p-3">
                    <p className="text-xs font-medium text-accent-foreground">{insights.recommended_pitch_strategy}</p>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Quick Pitch */}
      {pitch && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <button className="w-full" onClick={() => toggle('pitch')}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-accent" />
                <CardTitle className="text-sm">Quick Pitch</CardTitle>
              </div>
              {expandedSection === 'pitch' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardHeader>
          </button>
          <AnimatePresence>
            {expandedSection === 'pitch' && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <CardContent className="px-4 pb-4 pt-0 space-y-2">
                  <div className="flex justify-end">
                    <CopyBtn text={pitch.short_pitch + '\n\n' + pitch.call_to_action} id="pitch" />
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line">{pitch.short_pitch}</p>
                  <p className="text-sm font-medium text-accent-foreground">{pitch.call_to_action}</p>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Email Generator */}
      {email && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <button className="w-full" onClick={() => toggle('email')}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                <CardTitle className="text-sm">Email Generator</CardTitle>
              </div>
              {expandedSection === 'email' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardHeader>
          </button>
          <AnimatePresence>
            {expandedSection === 'email' && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject</p>
                      <CopyBtn text={email.subject} id="subject" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{email.subject}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Body</p>
                      <CopyBtn text={email.body} id="body" />
                    </div>
                    <div className="mt-1 rounded-lg bg-muted/20 p-3 text-sm text-foreground whitespace-pre-line">
                      {email.body}
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Timeline */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <button className="w-full" onClick={() => toggle('timeline')}>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm">Timeline</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{timeline.length}</Badge>
              {expandedSection === 'timeline' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </button>
        <AnimatePresence>
          {expandedSection === 'timeline' && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <CardContent className="px-4 pb-4 pt-0">
                {timeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nicio activitate încă.</p>
                ) : (
                  <div className="space-y-2">
                    {timeline.slice(0, 10).map(ev => (
                      <div key={ev.id} className="flex items-start gap-3">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{ev.event_label}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(ev.created_at).toLocaleString('ro-RO')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Acțiuni rapide</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs justify-start gap-1.5" onClick={() => toggle('pitch')}>
              <MessageSquare className="h-3.5 w-3.5" /> Generează Pitch
            </Button>
            <Button variant="outline" size="sm" className="text-xs justify-start gap-1.5" onClick={() => toggle('email')}>
              <Mail className="h-3.5 w-3.5" /> Generează Email
            </Button>
            <Button variant="outline" size="sm" className="text-xs justify-start gap-1.5"
              onClick={() => handleStatusChange('presentation_sent')}>
              <Send className="h-3.5 w-3.5" /> Marchează Trimis
            </Button>
            <Button variant="outline" size="sm" className="text-xs justify-start gap-1.5"
              onClick={() => handleStatusChange('interested')}>
              <Target className="h-3.5 w-3.5" /> Marchează Interesat
            </Button>
            <Button variant="outline" size="sm" className="text-xs justify-start gap-1.5"
              onClick={() => handleStatusChange('documents_sent')}>
              <Send className="h-3.5 w-3.5" /> Docs Trimise
            </Button>
            <Button variant="outline" size="sm" className="text-xs justify-start gap-1.5"
              onClick={() => handleStatusChange('contract_signed')}>
              <Zap className="h-3.5 w-3.5" /> Contract Semnat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
