// ─── Start from Company – Prospecting Entry Flow ───────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Search, Globe, MapPin, Factory, Linkedin, ExternalLink, ArrowRight, Loader2, AlertTriangle, CheckCircle2, Info, FileText, Hash, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';
import { resolveCompany, type ResolutionResult } from '@/services/companyResolutionService';
import { runCompanyResearch, type CompanyResearchResult } from '@/services/companyResearchService';
import { lookupCui, type AnafCompanyData } from '@/services/anafLookupService';

type FlowStatus = 'idle' | 'anaf_lookup' | 'resolving' | 'researching' | 'completed' | 'error';

export default function CompanyProspectPage() {
  const navigate = useNavigate();
  const { companies } = useData();

  const [companyName, setCompanyName] = useState('');
  const [cui, setCui] = useState('');
  const [status, setStatus] = useState<FlowStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const [anafData, setAnafData] = useState<AnafCompanyData | null>(null);
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
    setAnafData(null);

    let resolvedName = name;

    // Step 0: ANAF lookup if CUI provided
    if (cuiVal) {
      setStatus('anaf_lookup');
      const { data: anaf, error: anafError } = await lookupCui(cuiVal);
      if (anaf) {
        setAnafData(anaf);
        // Use ANAF legal name if user didn't provide a name
        if (!resolvedName && anaf.legal_name) {
          resolvedName = anaf.legal_name;
          setCompanyName(anaf.legal_name);
        }
      } else if (anafError) {
        console.warn('[Prospect] ANAF lookup failed:', anafError);
        // Non-blocking — continue with web research
      }
    }

    // Step 1: Resolve against local DB
    if (resolvedName && companies.length > 0) {
      setStatus('resolving');
      const res = resolveCompany(resolvedName, companies);
      setResolution(res);
    }

    // Step 2: Run web research
    setStatus('researching');
    const searchName = resolvedName || `CUI ${cuiVal}`;
    const { result, error: researchError } = await runCompanyResearch(
      cuiVal ? `${searchName} CUI ${cuiVal}` : searchName,
    );

    if (researchError && !result) {
      setError(researchError);
      // If we have ANAF data, still mark as completed
      if (anafData) {
        setStatus('completed');
      } else {
        setStatus('error');
      }
      return;
    }

    setResearch(result);
    setStatus('completed');
  };

  // ─── Continue to prospect analysis ───────────────────────
  const handleContinue = () => {
    const params = new URLSearchParams();
    const finalName = anafData?.legal_name || research?.company_name || companyName.trim();
    if (finalName) params.set('company', finalName);
    if (research?.detected_website) params.set('website', research.detected_website);
    if (anafData?.caen_code) params.set('caen', anafData.caen_code);
    if (research?.detected_industry || anafData?.caen_label) {
      params.set('industry', research?.detected_industry || anafData?.caen_label || '');
    }
    if (research?.detected_location || anafData?.address) {
      params.set('location', research?.detected_location || anafData?.address || '');
    }
    if (cui.trim()) params.set('cui', cui.trim());
    navigate(`/new?${params.toString()}`);
  };

  const isLoading = status === 'anaf_lookup' || status === 'resolving' || status === 'researching';
  const hasResults = status === 'completed' && (research || anafData);
  const isPartial = hasResults && !research?.detected_website && !research?.detected_industry && !anafData;

  const statusLabel = {
    anaf_lookup: 'Se verifică la ANAF…',
    resolving: 'Se verifică baza de date…',
    researching: 'Se cercetează compania…',
  }[status] || '';

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
                  {statusLabel}
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

        {/* ANAF Official Data */}
        <AnimatePresence>
          {anafData && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Date oficiale ANAF
                    </CardTitle>
                    <Badge className="text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verified ANAF
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <FieldRow icon={Building2} label="Denumire oficială" value={anafData.legal_name} />
                  <FieldRow icon={Hash} label="CUI" value={anafData.cui} />
                  <FieldRow icon={FileText} label="Nr. Reg. Comerț" value={anafData.registration_number} />
                  <FieldRow icon={Factory} label="CAEN" value={anafData.caen_code ? `${anafData.caen_code}${anafData.caen_label ? ` — ${anafData.caen_label}` : ''}` : ''} />
                  <FieldRow icon={MapPin} label="Sediu" value={anafData.address} />
                  <FieldRow icon={ShieldCheck} label="Stare" value={anafData.stare_inregistrare} />
                  <div className="flex items-center gap-3 flex-wrap pt-1">
                    <Badge variant={anafData.tva_active ? 'default' : 'outline'} className="text-xs">
                      TVA: {anafData.tva_active ? 'Activ' : 'Inactiv'}
                    </Badge>
                    {anafData.status_inactiv && (
                      <Badge variant="destructive" className="text-xs">
                        Contribuabil inactiv
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Web Research Results */}
        <AnimatePresence>
          {hasResults && research && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Web Research
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
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Button */}
        {hasResults && (
          <Button onClick={handleContinue} className="w-full gap-2" size="lg">
            <ArrowRight className="h-4 w-4" />
            Continue to Prospect Analysis
          </Button>
        )}

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
        <span className="ml-auto text-sm text-foreground truncate max-w-[280px]">{value}</span>
      )}
    </div>
  );
}
