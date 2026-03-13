// ─── Official Website Data Panel ────────────────────────────────────

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OfficialWebsiteData } from '@/services/officialWebsiteResearchService';
import { Globe, CheckCircle, XCircle, ExternalLink, Edit3, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  data: OfficialWebsiteData;
}

function SourceBadge({ badge }: { badge: OfficialWebsiteData['source_badge'] }) {
  if (badge === 'Official website') {
    return <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-500/30"><Shield className="h-3 w-3" />Official website</Badge>;
  }
  if (badge === 'Manual override') {
    return <Badge className="gap-1 bg-amber-500/15 text-amber-700 border-amber-500/30"><Edit3 className="h-3 w-3" />Manual override</Badge>;
  }
  return <Badge variant="outline" className="gap-1">Estimated</Badge>;
}

export default function OfficialWebsiteDataPanel({ data }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Official Website Data</CardTitle>
        </div>
        <SourceBadge badge={data.source_badge} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Website URL */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Website oficial</p>
          {data.official_website ? (
            <a href={data.official_website.startsWith('http') ? data.official_website : `https://${data.official_website}`}
               target="_blank" rel="noopener noreferrer"
               className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              {data.official_website} <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>

        {/* About */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Descriere companie</p>
          <p className="text-sm text-foreground leading-relaxed">{data.about_company_text}</p>
        </div>

        {/* Services & Products */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Servicii vizibile</p>
            {data.visible_services.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {data.visible_services.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Niciun serviciu detectat</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Produse vizibile</p>
            {data.visible_products.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {data.visible_products.map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Niciun produs detectat</p>
            )}
          </div>
        </div>

        {/* Page detection */}
        <div className="flex gap-6">
          <div className="flex items-center gap-1.5">
            {data.careers_page_found
              ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="text-xs text-foreground">Pagină cariere</span>
          </div>
          <div className="flex items-center gap-1.5">
            {data.contact_page_found
              ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="text-xs text-foreground">Pagină contact</span>
          </div>
        </div>

        {/* Checked at */}
        <p className="text-[10px] text-muted-foreground">
          Verificat la: {format(new Date(data.website_checked_at), 'dd.MM.yyyy HH:mm')}
        </p>

        {/* Overrides indicator */}
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
