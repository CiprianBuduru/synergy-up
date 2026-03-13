// ─── Commercial Insights Panel ──────────────────────────────────────

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CommercialInsights, CommercialInsightBadge, SignalStrength } from '@/services/commercialInsightsService';
import {
  Lightbulb, Target, Package, Layers, FileText, Edit3, Sparkles,
  Users, MapPin, Calendar, Palette, Gift, Shield, Building2,
} from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  data: CommercialInsights;
}

// ─── Badge ──────────────────────────────────────────────────

function SourceBadge({ badge }: { badge: CommercialInsightBadge }) {
  if (badge === 'Research insight') {
    return <Badge className="gap-1 bg-violet-500/15 text-violet-700 border-violet-500/30"><Sparkles className="h-3 w-3" />Research insight</Badge>;
  }
  if (badge === 'Manual override') {
    return <Badge className="gap-1 bg-amber-500/15 text-amber-700 border-amber-500/30"><Edit3 className="h-3 w-3" />Manual override</Badge>;
  }
  return <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" />Estimated</Badge>;
}

// ─── Signal Indicator ───────────────────────────────────────

const SIGNAL_COLORS: Record<SignalStrength, string> = {
  none: 'bg-muted text-muted-foreground',
  weak: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  moderate: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  strong: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
};

const SIGNAL_LABELS: Record<SignalStrength, string> = {
  none: 'Nedetectat',
  weak: 'Slab',
  moderate: 'Moderat',
  strong: 'Puternic',
};

function SignalBadge({ strength, label, icon: Icon }: { strength: SignalStrength; label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-foreground">{label}</span>
      </div>
      <Badge variant="outline" className={`text-[10px] ${SIGNAL_COLORS[strength]}`}>
        {SIGNAL_LABELS[strength]}
      </Badge>
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────

export default function CommercialInsightsPanel({ data }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <CardTitle className="text-base">Commercial Research Insights</CardTitle>
        </div>
        <SourceBadge badge={data.source_badge} />
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Confidence Level */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Nivel de încredere</p>
            <span className="text-xs font-semibold text-foreground">{data.confidence_level}%</span>
          </div>
          <Progress value={data.confidence_level} className="h-1.5" />
        </div>

        {/* Business Model */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Model de business</p>
          <p className="text-sm text-foreground leading-relaxed">{data.business_model_summary}</p>
        </div>

        {/* Departments to Target */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Departamente țintă</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.likely_departments_to_target.map((dep, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{dep}</Badge>
            ))}
          </div>
        </div>

        {/* Signals */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Semnale comerciale</p>
          <div className="rounded-md border border-border p-2 space-y-0.5">
            <SignalBadge strength={data.recruiting_signal} label="Recrutare activă" icon={Users} />
            <SignalBadge strength={data.multi_location_signal} label="Multi-locație" icon={MapPin} />
            <SignalBadge strength={data.event_signal} label="Evenimente / Marketing" icon={Calendar} />
            <SignalBadge strength={data.internal_branding_signal} label="Branding intern" icon={Palette} />
            <SignalBadge strength={data.gifting_signal} label="Corporate gifting" icon={Gift} />
          </div>
        </div>

        {/* Likely Needs */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Nevoi probabile</p>
          </div>
          <ul className="space-y-1 ml-5">
            {data.likely_needs.map((need, i) => (
              <li key={i} className="text-sm text-foreground list-disc">{need}</li>
            ))}
          </ul>
        </div>

        {/* Use Cases */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Cazuri de utilizare UP</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.likely_use_cases_for_UP.map((uc, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{uc}</Badge>
            ))}
          </div>
        </div>

        {/* Pitch Angles */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Unghiuri de pitch recomandate</p>
          </div>
          <ul className="space-y-1 ml-5">
            {data.recommended_pitch_angles.map((angle, i) => (
              <li key={i} className="text-sm text-foreground list-disc">{angle}</li>
            ))}
          </ul>
        </div>

        {/* Recommended Products & Kits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Produse recomandate</p>
            </div>
            {data.recommended_products_by_research.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {data.recommended_products_by_research.map((p, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">—</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Kituri recomandate</p>
            </div>
            {data.recommended_kits_by_research.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {data.recommended_kits_by_research.map((k, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{k}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {/* Research Notes */}
        {data.research_notes && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Note research</p>
            </div>
            <p className="text-sm text-muted-foreground">{data.research_notes}</p>
          </div>
        )}

        {/* Generated at */}
        <p className="text-[10px] text-muted-foreground">
          Generat la: {format(new Date(data.research_generated_at), 'dd.MM.yyyy HH:mm')}
        </p>

        {/* Overrides */}
        {Object.keys(data.overrides).length > 0 && (
          <div className="rounded-md bg-amber-500/10 p-2">
            <p className="text-xs text-amber-700">
              ⚠ {Object.keys(data.overrides).length} câmpuri cu Manual override
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
