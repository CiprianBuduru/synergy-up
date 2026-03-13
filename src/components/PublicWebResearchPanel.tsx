// ─── Public Web Research Panel ──────────────────────────────
// Displays website research data, completely separate from Official Company Data.

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Globe, Search, CheckCircle2, XCircle, Loader2,
  Briefcase, ShoppingBag, Users2, Phone, ExternalLink, AlertTriangle,
} from 'lucide-react';
import {
  runWebResearch,
  WEB_BADGE_CONFIG,
  type WebResearchResult,
  type WebResearchStatus,
} from '@/services/publicWebResearchService';
import type { Company, CompanyEnrichment } from '@/types';

interface Props {
  company: Company;
  enrichment: CompanyEnrichment | null;
}

export default function PublicWebResearchPanel({ company, enrichment }: Props) {
  const [status, setStatus] = useState<WebResearchStatus>('idle');
  const [result, setResult] = useState<WebResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState(
    company.website || enrichment?.website || ''
  );

  const handleRunResearch = async () => {
    if (!websiteUrl.trim()) return;
    setStatus('researching');
    setError(null);

    const { result: res, error: err } = await runWebResearch(company.id, websiteUrl);

    if (err || !res) {
      setError(err || 'Cercetarea a eșuat.');
      setStatus('error');
    } else {
      setResult(res);
      setStatus('completed');
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Official Website Data
          </CardTitle>
          {result && (
            <Badge variant="outline" className={`text-[10px] gap-1 ${WEB_BADGE_CONFIG[result.badge].color}`}>
              <Globe className="h-3 w-3" />
              {result.badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Date publice culese de pe website-ul companiei. Separate de datele oficiale din registre.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* URL input + trigger */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="https://www.companie.ro"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button
            size="sm"
            onClick={handleRunResearch}
            disabled={!websiteUrl.trim() || status === 'researching'}
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
          >
            {status === 'researching' ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Se cercetează...</>
            ) : (
              <><Search className="h-3.5 w-3.5" /> Run company research</>
            )}
          </Button>
        </div>

        {/* Error state */}
        {status === 'error' && error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Idle state */}
        {status === 'idle' && !result && (
          <div className="rounded-xl border-2 border-dashed border-muted p-6 text-center">
            <Globe className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Introdu URL-ul website-ului și apasă "Run company research" pentru a culege date publice.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Website identity */}
            <div className="space-y-2">
              <SectionLabel icon={<Globe className="h-4 w-4 text-primary" />} label="Identitate website" />
              <div className="grid grid-cols-1 gap-2">
                <FieldRow label="Titlu website" value={result.official_website_title} />
                <FieldRow label="Descriere" value={result.official_website_description} />
                {result.about_company_text && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Despre companie</p>
                    <p className="text-xs text-foreground leading-relaxed bg-muted/30 rounded-lg p-2.5">
                      {result.about_company_text}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Services & Products */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <SectionLabel icon={<Briefcase className="h-4 w-4 text-primary" />} label="Servicii vizibile" />
                {result.visible_services.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {result.visible_services.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Niciun serviciu detectat</p>
                )}
              </div>
              <div className="space-y-2">
                <SectionLabel icon={<ShoppingBag className="h-4 w-4 text-primary" />} label="Produse vizibile" />
                {result.visible_products.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {result.visible_products.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{p}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Niciun produs detectat</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Signals */}
            <div className="space-y-2">
              <SectionLabel icon={<Search className="h-4 w-4 text-primary" />} label="Semnale detectate" />
              <div className="flex gap-4">
                <SignalIndicator
                  label="Pagină cariere"
                  found={result.careers_page_found}
                  icon={<Users2 className="h-3.5 w-3.5" />}
                />
                <SignalIndicator
                  label="Pagină contact"
                  found={result.contact_page_found}
                  icon={<Phone className="h-3.5 w-3.5" />}
                />
              </div>
            </div>

            <Separator />

            {/* Source footer */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                Sursă:
                <a
                  href={result.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-0.5 font-medium"
                >
                  {result.official_website} <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </span>
              <span>
                Verificat: {new Date(result.website_checked_at).toLocaleDateString('ro-RO')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helper Components ──────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${value ? 'text-foreground' : 'text-muted-foreground italic'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function SignalIndicator({ label, found, icon }: { label: string; found: boolean; icon: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${found ? 'text-emerald-700' : 'text-muted-foreground'}`}>
      {found ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5" />}
      {icon}
      <span className={found ? 'font-medium' : ''}>{label}</span>
    </div>
  );
}
