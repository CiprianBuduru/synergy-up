import { BookOpen, ArrowRight, ArrowDown, CheckCircle2, XCircle, ArrowRightLeft, Lightbulb, Layers, Target, Crosshair, Search, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BriefRuleMatch, RuleMatchType } from '@/types/brief-rule';
import { AUTHORIZED_CAEN } from '@/services/eligibility';

interface Props {
  matches: BriefRuleMatch[];
  pitchLines?: string[];
  recommendedKits?: string[];
}

const VERDICT_CONFIG: Record<string, { label: string; description: string; color: string; icon: typeof CheckCircle2 }> = {
  direct: {
    label: 'Eligibil direct',
    description: 'Poate fi achiziționat direct prin unitatea protejată.',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    icon: CheckCircle2,
  },
  via_operation: {
    label: 'Neeligibil direct, dar eligibil prin operațiune',
    description: 'Devine eligibil prin aplicarea unei operațiuni interne autorizate.',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    icon: ArrowRightLeft,
  },
  convertible: {
    label: 'Neeligibil direct, dar convertibil în soluție eligibilă',
    description: 'Poate fi înlocuit cu o alternativă eligibilă.',
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    icon: XCircle,
  },
};

const MATCH_TYPE_CONFIG: Record<RuleMatchType, { label: string; icon: typeof Target; className: string }> = {
  exact_match: { label: 'Exact Match', icon: Target, className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  synonym_match: { label: 'Synonym Match', icon: Crosshair, className: 'bg-blue-100 text-blue-700 border-blue-300' },
  fallback_match: { label: 'Fallback Match', icon: Search, className: 'bg-orange-100 text-orange-700 border-orange-300' },
};

export default function BriefRulesPanel({ matches, pitchLines, recommendedKits }: Props) {
  if (!matches.length) return null;

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Brief Rules Engine
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {matches.length} {matches.length === 1 ? 'cerere detectată' : 'cereri detectate'} · Analiză detaliată pe baza regulilor de eligibilitate
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {matches.map((m, i) => {
          const cfg = VERDICT_CONFIG[m.rule.eligibility_type] || VERDICT_CONFIG.via_operation;
          const Icon = cfg.icon;
          const matchCfg = MATCH_TYPE_CONFIG[m.rule_type] || MATCH_TYPE_CONFIG.fallback_match;
          const MatchIcon = matchCfg.icon;

          return (
            <div key={i} className={`rounded-lg border p-4 space-y-3 ${cfg.color}`}>
              {/* Verdict banner */}
              <div className="flex items-start gap-2">
                <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{cfg.label}</p>
                  <p className="text-[10px] text-muted-foreground">{cfg.description}</p>
                </div>
              </div>

              {/* Labeled fields */}
              <div className="space-y-1.5 pl-6">
                <LabeledRow label="Requested Item" value={m.rule.requested_item} bold />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-32 shrink-0">Rule Type</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${matchCfg.className}`}>
                    <MatchIcon className="h-3 w-3" />
                    {matchCfg.label}
                  </Badge>
                </div>
                <LabeledRow label="Confidence" value={`${Math.round(m.confidence * 100)}%`} />
                {m.matched_keyword && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-32 shrink-0">Matched Keyword</span>
                    <code className="bg-background/50 px-1.5 py-0.5 rounded text-[10px] text-foreground">{m.matched_keyword}</code>
                  </div>
                )}
              </div>

              {/* Transformation flow */}
              {!m.rule.direct_eligible && (
                <div className="pl-6 rounded-md border border-border/40 bg-background/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Requested Item:</span>
                    <span className="font-medium text-foreground">{m.rule.requested_item}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-5">
                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground shrink-0">Eligible via Operation:</span>
                    <div className="flex flex-wrap gap-1">
                      {m.rule.eligible_via_operation.map(op => (
                        <Badge key={op} variant="secondary" className="text-[10px] px-1.5 py-0">{op}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-5">
                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground shrink-0">Eligible Result:</span>
                    <span className="font-medium text-foreground">{m.rule.eligible_result.join(', ')}</span>
                  </div>
                </div>
              )}

              {/* Supporting CAEN */}
              {m.rule.supporting_caen_codes.length > 0 && (
                <div className="pl-6 flex items-start gap-2 text-xs flex-wrap">
                  <span className="text-[10px] text-muted-foreground w-32 shrink-0">Supporting CAEN</span>
                  <div className="flex flex-wrap gap-1">
                    {m.rule.supporting_caen_codes.map(c => (
                      <Badge key={c} variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                        {c} — {AUTHORIZED_CAEN[c] || c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended products */}
              {m.rule.recommended_products.length > 0 && (
                <div className="pl-6">
                  <LabeledRow label="Recommended Products" value={m.rule.recommended_products.join(', ')} />
                </div>
              )}

              {/* Recommended kits */}
              {m.rule.recommended_kits.length > 0 && (
                <div className="pl-6 flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-[10px] text-muted-foreground w-32 shrink-0">Recommended Kits</span>
                  {m.rule.recommended_kits.map(k => (
                    <Badge key={k} className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">{k}</Badge>
                  ))}
                </div>
              )}

              {/* Pitch line */}
              <div className="pl-6">
                <span className="text-[10px] text-muted-foreground">Pitch Line</span>
                <p className="text-xs text-foreground italic mt-0.5">{m.rule.pitch_line}</p>
              </div>
            </div>
          );
        })}

        {/* Recommended kits from rules */}
        {recommendedKits && recommendedKits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5" />
              Kituri recomandate (din reguli)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recommendedKits.map(k => (
                <Badge key={k} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">{k}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">
              Din perspectiva eligibilității, kiturile reprezintă una dintre cele mai avantajoase forme de achiziție.
            </p>
          </div>
        )}

        {/* Summary pitch */}
        {pitchLines && pitchLines.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Lightbulb className="h-3.5 w-3.5" />
              Linii de pitch generate
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5">
              {pitchLines.map((line, i) => (
                <p key={i} className="text-xs text-foreground leading-relaxed">• {line}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LabeledRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[10px] text-muted-foreground w-32 shrink-0">{label}</span>
      <span className={`text-foreground ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}
