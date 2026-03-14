import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, MapPin, Building2, Linkedin, Loader2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { runCompanyResearch, type CompanyResearchResult, type CompanyResearchStatus } from '@/services/companyResearchService';

interface Props {
  companyName: string;
  onResearchComplete?: (result: CompanyResearchResult) => void;
}

export default function CompanyResearchPanel({ companyName, onResearchComplete }: Props) {
  const [status, setStatus] = useState<CompanyResearchStatus>('idle');
  const [result, setResult] = useState<CompanyResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunResearch = async () => {
    setStatus('researching');
    setError(null);

    const { result: res, error: err } = await runCompanyResearch(companyName);

    if (err && !res) {
      setStatus('error');
      setError(err);
      return;
    }

    setResult(res);
    setStatus('completed');
    if (res && onResearchComplete) onResearchComplete(res);
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" /> Company Research
          </CardTitle>
          <Badge variant={status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
            {status === 'idle' && 'Not started'}
            {status === 'researching' && 'Researching...'}
            {status === 'completed' && 'Completed'}
            {status === 'error' && 'Error'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Unverified company: <span className="font-medium text-foreground">{companyName}</span>. Run research to gather context.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Run button */}
        {status === 'idle' && (
          <Button onClick={handleRunResearch} className="w-full" variant="outline">
            <Search className="mr-2 h-4 w-4" /> Run Company Research
          </Button>
        )}

        {/* Loading */}
        {status === 'researching' && (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Searching for "{companyName}"...</span>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error || 'Research failed'}</p>
            </div>
            <Button onClick={handleRunResearch} variant="outline" size="sm">
              <Search className="mr-2 h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        )}

        {/* Results */}
        {status === 'completed' && result && (
          <div className="space-y-3">
            {/* Status indicator */}
            {result.detected_website || result.short_company_summary ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-800 dark:bg-emerald-950/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-emerald-700 dark:text-emerald-400">Company found — data extracted</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-800 dark:bg-amber-950/30">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-amber-700 dark:text-amber-400">Limited data found — you can still continue</span>
              </div>
            )}

            {/* Fields grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldRow icon={Building2} label="Company" value={result.company_name} />
              <FieldRow icon={Globe} label="Website" value={result.detected_website} isLink />
              <FieldRow icon={Building2} label="Industry" value={result.detected_industry} />
              <FieldRow icon={MapPin} label="Location" value={result.detected_location} />
              {result.possible_linkedin && (
                <FieldRow icon={Linkedin} label="LinkedIn" value={result.possible_linkedin} isLink />
              )}
            </div>

            {/* Summary */}
            {result.short_company_summary && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Summary</p>
                <p className="text-sm text-foreground leading-relaxed">{result.short_company_summary}</p>
              </div>
            )}

            {/* Sources */}
            {result.research_sources.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Sources</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.research_sources.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="h-2.5 w-2.5" />
                      {new URL(src).hostname.replace('www.', '')}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Retry */}
            <Button onClick={handleRunResearch} variant="ghost" size="sm" className="text-xs">
              <Search className="mr-1.5 h-3 w-3" /> Re-run research
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FieldRow({ icon: Icon, label, value, isLink }: { icon: any; label: string; value: string; isLink?: boolean }) {
  const display = value || '—';
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {isLink && value ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline truncate block">
            {value.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
          </a>
        ) : (
          <p className="text-sm font-medium text-foreground">{display}</p>
        )}
      </div>
    </div>
  );
}
