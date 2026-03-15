// ─── Company Resolution Panel ──────────────────────────────
// UI for verifying / confirming a company from parsed email data.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, Search, AlertTriangle, HelpCircle, CheckCircle2,
  Building2, ChevronRight, RefreshCw, MapPin, Globe, Loader2,
} from 'lucide-react';
import { resolveCompany, RESOLUTION_STATUS_CONFIG, type ResolutionResult, type ResolutionStatus } from '@/services/companyResolutionService';
import { runCompanyResearch, type CompanyResearchResult } from '@/services/companyResearchService';
import type { Company } from '@/types';

interface Props {
  parsedCompanyName: string;
  companies: Company[];
  selectedCompanyId: string;
  onConfirm: (companyId: string) => void;
  onSkip: () => void;
  /** Optional: email address to extract domain for verification */
  contactEmail?: string;
  /** Callback when web research enriches data */
  onWebResearchComplete?: (result: CompanyResearchResult) => void;
}

const STATUS_ICONS: Record<ResolutionStatus, React.ReactNode> = {
  confirmed: <ShieldCheck className="h-5 w-5" />,
  likely_match: <Search className="h-5 w-5" />,
  unverified: <AlertTriangle className="h-5 w-5" />,
  manual_review: <HelpCircle className="h-5 w-5" />,
  verified_web: <Globe className="h-5 w-5" />,
};

// ─── Domain matching helper ─────────────────────────────────

function extractDomain(email: string): string {
  const match = email.match(/@([a-zA-Z0-9.-]+)/);
  return match ? match[1].toLowerCase() : '';
}

function domainsMatch(websiteUrl: string, emailDomain: string): boolean {
  if (!websiteUrl || !emailDomain) return false;
  try {
    const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const cleanEmail = emailDomain.replace(/^www\./, '');
    return hostname === cleanEmail || hostname.endsWith(`.${cleanEmail}`) || cleanEmail.endsWith(`.${hostname}`);
  } catch {
    return websiteUrl.toLowerCase().includes(emailDomain);
  }
}

export default function CompanyResolutionPanel({
  parsedCompanyName,
  companies,
  selectedCompanyId,
  onConfirm,
  onSkip,
  contactEmail,
  onWebResearchComplete,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualSearch, setManualSearch] = useState(false);
  const [researchStatus, setResearchStatus] = useState<'idle' | 'researching' | 'completed' | 'error'>('idle');
  const [researchResult, setResearchResult] = useState<CompanyResearchResult | null>(null);
  const [webVerified, setWebVerified] = useState(false);

  // Run resolution engine
  const resolution: ResolutionResult = useMemo(
    () => resolveCompany(parsedCompanyName, companies),
    [parsedCompanyName, companies],
  );

  // Override status if web-verified
  const effectiveStatus: ResolutionStatus = webVerified ? 'verified_web' : resolution.status;
  const config = RESOLUTION_STATUS_CONFIG[effectiveStatus];

  // Auto-confirm if exact match & nothing selected yet
  useEffect(() => {
    if (resolution.status === 'confirmed' && resolution.bestMatch && !selectedCompanyId) {
      onConfirm(resolution.bestMatch.company.id);
    }
  }, [resolution, selectedCompanyId, onConfirm]);

  // ─── AI Research handler ──────────────────────────────────
  const handleRunResearch = useCallback(async () => {
    if (!parsedCompanyName.trim()) return;
    setResearchStatus('researching');
    try {
      const { result, error } = await runCompanyResearch(parsedCompanyName);
      if (error && !result) {
        setResearchStatus('error');
        return;
      }
      if (result) {
        setResearchResult(result);
        setResearchStatus('completed');
        onWebResearchComplete?.(result);

        // Check domain match
        const emailDomain = contactEmail ? extractDomain(contactEmail) : '';
        if (emailDomain && result.detected_website && domainsMatch(result.detected_website, emailDomain)) {
          setWebVerified(true);
        }
      }
    } catch {
      setResearchStatus('error');
    }
  }, [parsedCompanyName, contactEmail, onWebResearchComplete]);

  // Manual search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return companies
      .filter(c =>
        c.company_name.toLowerCase().includes(q) ||
        c.legal_name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [searchQuery, companies]);

  const confirmedCompany = selectedCompanyId
    ? companies.find(c => c.id === selectedCompanyId)
    : null;

  const showResearchButton = !confirmedCompany && (effectiveStatus === 'unverified' || effectiveStatus === 'manual_review') && researchStatus === 'idle';

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Company Resolution
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Verifică identitatea companiei înainte de a continua analiza comercială.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status banner */}
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${config.color}`}>
          <div className="mt-0.5">{STATUS_ICONS[effectiveStatus]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{config.label}</p>
            <p className="text-xs mt-0.5 opacity-80">
              {webVerified ? 'Compania a fost verificată prin cercetare web — domeniu similar cu emailul detectat.' : resolution.message}
            </p>
          </div>
          {effectiveStatus === 'confirmed' && confirmedCompany && (
            <Badge variant="outline" className="shrink-0 text-emerald-700 border-emerald-300 bg-emerald-100 text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-0.5" /> Confirmed
            </Badge>
          )}
          {effectiveStatus === 'verified_web' && (
            <Badge variant="outline" className="shrink-0 text-teal-700 border-teal-300 bg-teal-100 text-[10px]">
              <Globe className="h-3 w-3 mr-0.5" /> Web Verified
            </Badge>
          )}
        </div>

        {/* Input name display */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Nume detectat</p>
          <p className="text-sm font-medium text-foreground">
            {parsedCompanyName || <span className="italic text-muted-foreground">—</span>}
          </p>
        </div>

        {/* AI Research Button */}
        {showResearchButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunResearch}
            className="w-full text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
          >
            <Globe className="h-3.5 w-3.5" /> Run AI Company Research
          </Button>
        )}

        {/* Research loading */}
        {researchStatus === 'researching' && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Cercetare web în curs pentru "{parsedCompanyName}"...</span>
          </div>
        )}

        {/* Research error */}
        {researchStatus === 'error' && (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <span className="text-xs text-destructive">Cercetarea web a eșuat.</span>
            <Button variant="ghost" size="sm" onClick={handleRunResearch} className="text-xs h-7">
              <RefreshCw className="h-3 w-3 mr-1" /> Reîncearcă
            </Button>
          </div>
        )}

        {/* Research results */}
        {researchStatus === 'completed' && researchResult && (
          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-primary" /> Rezultate cercetare web
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {researchResult.detected_website && (
                <ResearchField label="Website" value={researchResult.detected_website} isLink />
              )}
              {researchResult.detected_industry && (
                <ResearchField label="Industrie" value={researchResult.detected_industry} />
              )}
              {researchResult.detected_location && (
                <ResearchField label="Locație" value={researchResult.detected_location} />
              )}
              {researchResult.possible_linkedin && (
                <ResearchField label="LinkedIn" value={researchResult.possible_linkedin} isLink />
              )}
            </div>
            {researchResult.short_company_summary && (
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-3">{researchResult.short_company_summary}</p>
            )}
          </div>
        )}

        {/* Confirmed company display */}
        {confirmedCompany && (
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 font-display text-xs font-bold text-emerald-700">
                {confirmedCompany.company_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{confirmedCompany.company_name}</p>
                {confirmedCompany.legal_name && confirmedCompany.legal_name !== confirmedCompany.company_name && (
                  <p className="text-[10px] text-muted-foreground">{confirmedCompany.legal_name}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  {confirmedCompany.industry && <span>{confirmedCompany.industry}</span>}
                  {confirmedCompany.location && <><span>•</span><MapPin className="h-2.5 w-2.5" /><span>{confirmedCompany.location}</span></>}
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            </div>
          </div>
        )}

        {/* Candidates list */}
        {!confirmedCompany && resolution.candidates.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Candidați găsiți ({resolution.candidates.length})</p>
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
              {resolution.candidates.map((candidate) => (
                <div
                  key={candidate.company.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => onConfirm(candidate.company.id)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 font-display text-[10px] font-bold text-primary">
                    {candidate.company.company_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{candidate.company.company_name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{candidate.matchDetail}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${
                      candidate.confidence >= 0.95 ? 'border-emerald-300 text-emerald-700' :
                      candidate.confidence >= 0.7 ? 'border-blue-300 text-blue-700' :
                      'border-muted-foreground/30 text-muted-foreground'
                    }`}>
                      {Math.round(candidate.confidence * 100)}%
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual search */}
        {!confirmedCompany && (
          <div className="space-y-2">
            {!manualSearch ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManualSearch(true)}
                className="w-full text-xs gap-1.5"
              >
                <Search className="h-3.5 w-3.5" /> Caută manual în baza de date
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Caută după nume, denumire legală, industrie..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                    autoFocus
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                    {searchResults.map(c => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 rounded-lg border p-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          onConfirm(c.id);
                          setManualSearch(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/5 font-display text-[9px] font-bold text-primary">
                          {c.company_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{c.company_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {[c.industry, c.location].filter(Boolean).join(' • ')}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery.trim() && searchResults.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Niciun rezultat pentru "{searchQuery}"</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          {confirmedCompany ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onConfirm('')}
              className="text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Schimbă compania
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs text-muted-foreground"
            >
              Continuă fără verificare →
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helper component ───────────────────────────────────────

function ResearchField({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      {isLink ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate block">
          {value.replace(/^https?:\/\//, '').slice(0, 40)}
        </a>
      ) : (
        <p className="font-medium text-foreground">{value}</p>
      )}
    </div>
  );
}
