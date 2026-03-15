// ─── Start from Company – Prospecting Entry Flow ───────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Search, Globe, MapPin, Factory, Linkedin, ExternalLink, ArrowRight, Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';
import { resolveCompany, type ResolutionResult } from '@/services/companyResolutionService';
import { runCompanyResearch, type CompanyResearchResult } from '@/services/companyResearchService';

type FlowStatus = 'idle' | 'resolving' | 'researching' | 'completed' | 'error';

export default function CompanyProspectPage() {
  const navigate = useNavigate();
  const { companies } = useData();

  const [companyName, setCompanyName] = useState('');
  const [cui, setCui] = useState('');
  const [status, setStatus] = useState<FlowStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const [resolution, setResolution] = useState<ResolutionResult | null>(null);
  const [research, setResearch] = useState<CompanyResearchResult | null>(null);

  const canStart = companyName.trim().length >= 2 || cui.trim().length >= 4;

  // ─── Run research pipeline ───────────────────────────────
  const handleResearch = async () => {
    const name = companyName.trim();
    const cuiVal = cui.trim();

    if (!name && !cuiVal) return;

    setError(null);
    setResolution(null);
    setResearch(null);

    // Step 1: Resolve against local DB if we have a name
    if (name && companies.length > 0) {
      setStatus('resolving');
      const res = resolveCompany(name, companies);
      setResolution(res);
    }

    // Step 2: Run web research
    setStatus('researching');
    const searchName = name || `CUI ${cuiVal}`;
    const { result, error: researchError } = await runCompanyResearch(
      cuiVal ? `${searchName} CUI ${cuiVal}` : searchName,
    );

    if (researchError && !result) {
      setError(researchError);
      setStatus('error');
      return;
    }

    setResearch(result);
    setStatus('completed');
  };

  // ─── Continue to prospect analysis ───────────────────────
  const handleContinue = () => {
    // Navigate to new presentation with pre-filled data
    const params = new URLSearchParams();
    if (research?.company_name) params.set('company', research.company_name);
    if (research?.detected_website) params.set('website', research.detected_website);
    if (research?.detected_industry) params.set('industry', research.detected_industry);
    if (research?.detected_location) params.set('location', research.detected_location);
    if (cui.trim()) params.set('cui', cui.trim());
    navigate(`/new?${params.toString()}`);
  };

  const isLoading = status === 'resolving' || status === 'researching';
  const hasResults = status === 'completed' && research;
  const isPartial = hasResults && (!research.detected_website && !research.detected_industry);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Start from Company</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Începe prospectarea de la numele companiei sau CUI.
          </p>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Company Identification
            </CardTitle>
            <CardDescription>
              Introdu numele companiei, codul fiscal (CUI), sau ambele.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nume companie</label>
              <Input
                placeholder="ex: Lidas SRL"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cod fiscal (CUI)</label>
              <Input
                placeholder="ex: 12345678"
                value={cui}
                onChange={e => setCui(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                maxLength={12}
              />
            </div>
            <Button
              onClick={handleResearch}
              disabled={!canStart || isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {status === 'resolving' ? 'Se verifică baza de date…' : 'Se cercetează compania…'}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Research Company
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error */}
        {status === 'error' && error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Cercetarea a eșuat</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleResearch}>
                  Încearcă din nou
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resolution Badge */}
        <AnimatePresence>
          {resolution && status !== 'idle' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-muted">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Database Resolution</span>
                  </div>
                  <p className="text-sm text-foreground">{resolution.message}</p>
                  {resolution.bestMatch && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {resolution.bestMatch.matchDetail}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Research Results */}
        <AnimatePresence>
          {hasResults && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Company Research
                    </CardTitle>
                    <Badge variant={isPartial ? 'outline' : 'default'} className="text-xs">
                      {isPartial ? (
                        <><AlertTriangle className="h-3 w-3 mr-1" /> Partial research only</>
                      ) : (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Research completed</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FieldRow icon={Building2} label="Companie" value={research.company_name} />
                  {cui.trim() && <FieldRow icon={Building2} label="CUI" value={cui.trim()} />}
                  <FieldRow icon={Globe} label="Website" value={research.detected_website} isLink />
                  <FieldRow icon={Factory} label="Industrie" value={research.detected_industry} />
                  <FieldRow icon={MapPin} label="Locație" value={research.detected_location} />
                  <FieldRow icon={Linkedin} label="LinkedIn" value={research.possible_linkedin} isLink />

                  {research.short_company_summary && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Descriere</span>
                        <p className="text-sm text-foreground mt-1 leading-relaxed">
                          {research.short_company_summary}
                        </p>
                      </div>
                    </>
                  )}

                  {research.research_sources.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Surse ({research.research_sources.length})</span>
                        <div className="mt-1 space-y-1">
                          {research.research_sources.map((src, i) => (
                            <a
                              key={i}
                              href={src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              {src}
                            </a>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <Button onClick={handleContinue} className="w-full gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Continue to Prospect Analysis
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Allow continue even on error */}
        {status === 'error' && (
          <Button variant="outline" onClick={handleContinue} className="w-full gap-2">
            <ArrowRight className="h-4 w-4" />
            Continue without research
          </Button>
        )}
      </div>
    </AppLayout>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function FieldRow({ icon: Icon, label, value, isLink }: {
  icon: React.ElementType;
  label: string;
  value: string;
  isLink?: boolean;
}) {
  if (!value) {
    return (
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground/60 italic ml-auto">—</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
      {isLink ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-primary hover:underline truncate max-w-[280px]"
        >
          {value}
        </a>
      ) : (
        <span className="ml-auto text-sm text-foreground truncate max-w-[280px]">{label === 'CUI' ? value : value}</span>
      )}
    </div>
  );
}
