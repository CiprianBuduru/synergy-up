import { CheckCircle2, XCircle, AlertTriangle, ArrowRightLeft, ShieldCheck, Factory, Lightbulb, TrendingUp, Package, Layers, Workflow, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import EligibilityBadge from '@/components/EligibilityBadge';
import type { EligibilityResult, ReasoningStep } from '@/types';
import { AUTHORIZED_CAEN } from '@/services/eligibility';

interface Props {
  result: EligibilityResult;
  title?: string;
}

export default function EligibilityReasoningPanel({ result, title }: Props) {
  const confidencePct = Math.round(result.confidence_score * 100);
  const steps = result.reasoning_steps || [];

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-display">
            {title || 'Analiză eligibilitate'}
          </CardTitle>
          <EligibilityBadge status={result.verdict} size="md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Confidence */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Nivel de încredere</span>
            <span className="font-semibold text-foreground">{confidencePct}%</span>
          </div>
          <Progress value={confidencePct} className="h-2" />
        </div>

        {/* Explanation */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm text-foreground leading-relaxed whitespace-pre-line">
          {result.explanation}
        </div>

        {/* Reasoning Steps */}
        {steps.length > 0 && (
          <Section icon={Workflow} label="Raționament detaliat">
            <div className="space-y-2">
              {steps.map((step, i) => (
                <ReasoningStepCard key={i} step={step} />
              ))}
            </div>
          </Section>
        )}

        {/* Internal operations */}
        {result.internal_operation_used.length > 0 && (
          <Section icon={Factory} label="Operațiuni interne realizate">
            <div className="flex flex-wrap gap-1.5">
              {result.internal_operation_used.map(op => (
                <Badge key={op} variant="secondary" className="text-xs font-medium">
                  {op}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* CAEN codes */}
        {result.supporting_caen_codes.length > 0 && (
          <Section icon={ShieldCheck} label="Coduri CAEN suport">
            <div className="space-y-1">
              {result.supporting_caen_codes.map(code => (
                <div key={code} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="font-mono text-[11px] px-1.5 py-0">
                    {code}
                  </Badge>
                  <span className="text-muted-foreground">
                    {AUTHORIZED_CAEN[code] || code}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Converted intent */}
        {result.converted_intent && (
          <Section icon={Lightbulb} label="Intenție detectată">
            <p className="text-sm text-foreground">{result.converted_intent}</p>
          </Section>
        )}

        {/* Alternative products */}
        {result.alternative_products.length > 0 && (
          <Section icon={Package} label="Produse alternative eligibile">
            <div className="flex flex-wrap gap-1.5">
              {result.alternative_products.map(p => (
                <Badge key={p} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                  {p}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Alternative kits */}
        {result.alternative_kits.length > 0 && (
          <Section icon={Layers} label="Kituri alternative eligibile">
            <div className="flex flex-wrap gap-1.5">
              {result.alternative_kits.map(k => (
                <Badge key={k} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  {k}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Sales angle */}
        {result.sales_angle && (
          <Section icon={TrendingUp} label="Unghi comercial recomandat">
            <p className="text-sm text-foreground italic leading-relaxed">
              „{result.sales_angle}"
            </p>
          </Section>
        )}
      </CardContent>
    </Card>
  );
}

function ReasoningStepCard({ step }: { step: ReasoningStep }) {
  return (
    <div className={`rounded-lg border p-3 text-xs space-y-2 ${
      step.eligible 
        ? 'border-emerald-200/60 bg-emerald-50/30' 
        : 'border-rose-200/60 bg-rose-50/30'
    }`}>
      <div className="flex items-center gap-2">
        {step.eligible 
          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          : <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
        }
        <span className="font-semibold text-foreground">{step.item}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">{step.deliverableType}</span>
      </div>
      {step.eligible && step.operations.length > 0 && (
        <div className="flex items-center gap-1.5 pl-5">
          <span className="text-muted-foreground">Operațiuni:</span>
          {step.operations.map(op => (
            <Badge key={op} variant="secondary" className="text-[10px] px-1.5 py-0">{op}</Badge>
          ))}
        </div>
      )}
      {step.eligible && step.caen.length > 0 && (
        <div className="flex items-center gap-1.5 pl-5">
          <span className="text-muted-foreground">CAEN:</span>
          {step.caen.map(c => (
            <Badge key={c} variant="outline" className="font-mono text-[10px] px-1.5 py-0">{c}</Badge>
          ))}
        </div>
      )}
      <p className="text-muted-foreground pl-5">{step.explanation}</p>
    </div>
  );
}

function Section({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {children}
    </div>
  );
}
