// ─── Commercial Research Insights Panel ─────────────────────────────

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CommercialResearchInsights } from '@/services/companyResearchInsightsService';
import { Lightbulb, Target, Package, Layers, FileText, Edit3, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  data: CommercialResearchInsights;
}

function SourceBadge({ badge }: { badge: CommercialResearchInsights['source_badge'] }) {
  if (badge === 'Research insight') {
    return <Badge className="gap-1 bg-violet-500/15 text-violet-700 border-violet-500/30"><Sparkles className="h-3 w-3" />Research insight</Badge>;
  }
  if (badge === 'Manual override') {
    return <Badge className="gap-1 bg-amber-500/15 text-amber-700 border-amber-500/30"><Edit3 className="h-3 w-3" />Manual override</Badge>;
  }
  return <Badge variant="outline" className="gap-1">Estimated</Badge>;
}

export default function CommercialResearchInsightsPanel({ data }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <CardTitle className="text-base">Commercial Research Insights</CardTitle>
        </div>
        <SourceBadge badge={data.source_badge} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Business Model */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Model de business</p>
          <p className="text-sm text-foreground leading-relaxed">{data.business_model_summary}</p>
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
