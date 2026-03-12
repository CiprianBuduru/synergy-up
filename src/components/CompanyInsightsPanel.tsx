// ─── Company Insights Panel ─────────────────────────────────────────
// Intelligence Core UI — shows signals, intent, industry insights, pitch strategy.

import type { Company, CompanyEnrichment } from '@/types';
import type { CompanySignals, SignalLevel } from '@/services/companySignalsService';
import type { DetectedIntent } from '@/services/intentDetectionService';
import type { PitchStrategy } from '@/services/pitchStrategyService';
import { INTENT_LABELS } from '@/services/intentDetectionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Target, Lightbulb, TrendingUp, Users, MapPin, Megaphone,
  Gift, Heart, Building2, Briefcase, Zap, ArrowUpRight,
} from 'lucide-react';

interface Props {
  signals: CompanySignals;
  intent: DetectedIntent | null;
  pitchStrategy: PitchStrategy | null;
  industryFocus: string;
  opportunityEstimate?: number;
}

const SIGNAL_CONFIG: Record<string, { label: string; icon: typeof Users }> = {
  hr_relevance: { label: 'HR Relevance', icon: Users },
  marketing_event_relevance: { label: 'Marketing & Events', icon: Megaphone },
  corporate_gifting_relevance: { label: 'Corporate Gifting', icon: Gift },
  csr_relevance: { label: 'CSR & Employer Branding', icon: Heart },
  internal_branding_relevance: { label: 'Internal Branding', icon: Building2 },
};

function SignalBadge({ level }: { level: SignalLevel }) {
  const config = {
    high: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-500/10 text-amber-700 border-amber-200',
    low: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config[level]}`}>
      {level}
    </span>
  );
}

export default function CompanyInsightsPanel({ signals, intent, pitchStrategy, industryFocus, opportunityEstimate }: Props) {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Company Insights</CardTitle>
            <p className="text-[11px] text-muted-foreground">Intelligence Core — analiză automată</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {/* ── Signals ── */}
        <section className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> Company Signals
          </h4>
          <div className="space-y-1.5">
            {Object.entries(SIGNAL_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const level = signals[key as keyof CompanySignals] as SignalLevel;
              return (
                <div key={key} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{cfg.label}</span>
                  </div>
                  <SignalBadge level={level} />
                </div>
              );
            })}
            {/* Boolean signals */}
            <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Multi-location</span>
              </div>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                signals.multi_location_relevance
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                  : 'bg-muted text-muted-foreground border-border'
              }`}>
                {signals.multi_location_relevance ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Recruiting signal</span>
              </div>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                signals.recruiting_signal
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                  : 'bg-muted text-muted-foreground border-border'
              }`}>
                {signals.recruiting_signal ? 'DETECTED' : 'NONE'}
              </span>
            </div>
          </div>
        </section>

        {/* ── Detected Intent ── */}
        {intent && (
          <section className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5" /> Detected Intent
            </h4>
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Primary</span>
                  <p className="text-sm font-semibold text-foreground">{INTENT_LABELS[intent.primary_intent]}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground">Confidence</span>
                  <p className="text-sm font-bold text-foreground">{Math.round(intent.confidence * 100)}%</p>
                </div>
              </div>
              <Progress value={intent.confidence * 100} className="h-1.5" />
              {intent.secondary_intent && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-muted-foreground">Secondary:</span>
                  <Badge variant="secondary" className="text-[10px]">{INTENT_LABELS[intent.secondary_intent]}</Badge>
                </div>
              )}
              {intent.all_intents.length > 2 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {intent.all_intents.slice(2).map(({ intent: i, score }) => (
                    <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground">
                      {INTENT_LABELS[i]} ({Math.round(score * 100)}%)
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Industry Focus ── */}
        {industryFocus && (
          <section className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> Industry Insight
            </h4>
            <p className="rounded-xl border bg-card p-3 text-xs leading-relaxed text-foreground">{industryFocus}</p>
          </section>
        )}

        {/* ── Opportunity Estimate ── */}
        {opportunityEstimate !== undefined && opportunityEstimate > 0 && (
          <section className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5" /> Opportunity Estimate
            </h4>
            <div className="rounded-xl border bg-accent/5 p-3">
              <p className="text-lg font-bold text-foreground">
                ~{opportunityEstimate.toLocaleString('ro-RO')} <span className="text-xs font-normal text-muted-foreground">lei/lună</span>
              </p>
            </div>
          </section>
        )}

        {/* ── Pitch Strategy ── */}
        {pitchStrategy && (
          <section className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Zap className="h-3.5 w-3.5" /> Pitch Strategy
            </h4>
            <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{pitchStrategy.headline}</p>
                <Badge variant={pitchStrategy.urgency_level === 'high' ? 'destructive' : pitchStrategy.urgency_level === 'medium' ? 'secondary' : 'outline'} className="text-[10px]">
                  {pitchStrategy.urgency_level === 'high' ? '🔥 Urgent' : pitchStrategy.urgency_level === 'medium' ? '⏱ Medium' : '📋 Normal'}
                </Badge>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{pitchStrategy.body}</p>
              {pitchStrategy.key_angles.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {pitchStrategy.key_angles.slice(0, 3).map((angle, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{angle.slice(0, 60)}{angle.length > 60 ? '…' : ''}</Badge>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
