import { BookOpen, ArrowRight, CheckCircle2, XCircle, ArrowRightLeft, Lightbulb, Package, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BriefRuleMatch } from '@/types';
import { AUTHORIZED_CAEN } from '@/services/eligibility';

interface Props {
  matches: BriefRuleMatch[];
  pitchLines?: string[];
  recommendedKits?: string[];
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  direct: { label: 'Eligibil direct', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  via_operation: { label: 'Eligibil prin operațiune', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: ArrowRightLeft },
  convertible: { label: 'Convertibil', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: XCircle },
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
        <p className="text-xs text-muted-foreground">Analiză detaliată pe baza regulilor de eligibilitate</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rule matches */}
        {matches.map((m, i) => {
          const cfg = TYPE_CONFIG[m.rule.eligibility_type] || TYPE_CONFIG.via_operation;
          const Icon = cfg.icon;
          return (
            <div key={i} className={`rounded-lg border p-3 space-y-2.5 ${cfg.color}`}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-sm text-foreground">{m.rule.requested_item}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cfg.label}</Badge>
              </div>

              {!m.rule.direct_eligible && (
                <div className="pl-6 space-y-1.5">
                  <div className="flex items-start gap-1.5 text-xs">
                    <span className="text-muted-foreground shrink-0">Operațiuni necesare:</span>
                    <div className="flex flex-wrap gap-1">
                      {m.rule.eligible_via_operation.map(op => (
                        <Badge key={op} variant="secondary" className="text-[10px] px-1.5 py-0">{op}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs">
                    <span className="text-muted-foreground shrink-0">Produs eligibil rezultat:</span>
                    <span className="font-medium text-foreground">{m.rule.eligible_result.join(', ')}</span>
                  </div>
                </div>
              )}

              {m.rule.supporting_caen_codes.length > 0 && (
                <div className="pl-6 flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">CAEN:</span>
                  {m.rule.supporting_caen_codes.map(c => (
                    <Badge key={c} variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                      {c} — {AUTHORIZED_CAEN[c] || c}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="pl-6">
                <p className="text-xs text-muted-foreground italic">{m.rule.pitch_line}</p>
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
