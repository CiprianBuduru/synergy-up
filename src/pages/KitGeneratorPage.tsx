import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Sparkles, ShieldCheck, Wrench, FileCode, AlertTriangle, CheckCircle2, Search, ArrowRight, Target, Building2, Users, ChevronDown, Zap, TrendingUp, Layers } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { recommendKits, kitTemplates, type KitRecommendation } from '@/lib/kit-generator';
import { analyzeBrief } from '@/lib/eligibility-engine';
import type { Kit, KitComplexity } from '@/types';

const complexityConfig: Record<KitComplexity, { label: string; color: string; icon: React.ReactNode }> = {
  simplu: { label: 'Simplu', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <Zap className="h-3 w-3" /> },
  standard: { label: 'Standard', color: 'bg-primary/10 text-primary border-primary/20', icon: <Layers className="h-3 w-3" /> },
  premium: { label: 'Premium', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <TrendingUp className="h-3 w-3" /> },
};

export default function KitGeneratorPage() {
  const data = useData();
  const navigate = useNavigate();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [briefText, setBriefText] = useState('');
  const [complexity, setComplexity] = useState<string>('');
  const [recommendations, setRecommendations] = useState<KitRecommendation[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogDeptFilter, setCatalogDeptFilter] = useState('all');
  const [catalogIndustryFilter, setCatalogIndustryFilter] = useState('all');

  const company = data.getCompany(selectedCompanyId);
  const enrichment = company ? data.getEnrichment(company.id) : undefined;

  const handleGenerate = () => {
    if (!company) return;
    const analysis = briefText ? analyzeBrief(briefText) : undefined;
    const results = recommendKits({
      industry: company.industry,
      department: company.contact_department,
      briefText,
      purpose: analysis?.purpose || 'office_use',
      detectedPurpose: analysis?.purpose,
      complexity: (complexity && complexity !== 'all' ? complexity : undefined) as KitComplexity | undefined,
      eligibilityVerdict: analysis?.eligibility.verdict,
      companyName: company.company_name,
    }, data.kits);
    setRecommendations(results);
    setHasGenerated(true);
  };

  const allDepartments = useMemo(() => {
    const deps = new Set<string>();
    data.kits.forEach(k => k.target_departments.forEach(d => deps.add(d)));
    return [...deps].sort();
  }, [data.kits]);

  const allIndustries = useMemo(() => {
    const inds = new Set<string>();
    data.kits.forEach(k => k.suggested_industries_json.forEach(i => inds.add(i)));
    return [...inds].sort();
  }, [data.kits]);

  const filteredCatalog = useMemo(() => {
    return data.kits.filter(k => {
      if (!k.active) return false;
      if (catalogFilter !== 'all' && k.complexity !== catalogFilter && k.category !== catalogFilter) return false;
      if (catalogDeptFilter !== 'all' && !k.target_departments.includes(catalogDeptFilter)) return false;
      if (catalogIndustryFilter !== 'all' && !k.suggested_industries_json.includes(catalogIndustryFilter)) return false;
      if (catalogSearch) {
        const s = catalogSearch.toLowerCase();
        return k.name.toLowerCase().includes(s) || k.purpose.toLowerCase().includes(s) || k.category.toLowerCase().includes(s);
      }
      return true;
    });
  }, [data.kits, catalogFilter, catalogSearch, catalogDeptFilter, catalogIndustryFilter]);

  const categories = [...new Set(data.kits.map(k => k.category))];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Kit Generator</h1>
            <p className="text-sm text-muted-foreground">Recomandă kituri eligibile pe baza companiei, brief-ului și complexității dorite</p>
          </div>
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
            <Package className="h-4 w-4" /> {data.kits.length} kituri disponibile
          </Badge>
        </div>

        {/* Kit Templates Overview */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.entries(kitTemplates) as [KitComplexity, typeof kitTemplates.simplu][]).map(([key, tmpl]) => {
            const cfg = complexityConfig[key];
            return (
              <Card key={key} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`gap-1 border ${cfg.color}`}>{cfg.icon} {cfg.label}</Badge>
                    <span className="text-xs font-mono text-muted-foreground">{tmpl.priceRange}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tmpl.description}</p>
                  <p className="mt-1.5 text-xs font-medium text-foreground">{tmpl.componentCount}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="generator" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="generator" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Generator</TabsTrigger>
            <TabsTrigger value="catalog" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Catalog ({data.kits.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg">Configurare recomandare</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Companie</Label>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger><SelectValue placeholder="Selectează compania" /></SelectTrigger>
                      <SelectContent>
                        {data.companies.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.company_name} — {c.industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nivel complexitate</Label>
                    <Select value={complexity} onValueChange={v => setComplexity(v)}>
                      <SelectTrigger><SelectValue placeholder="Toate nivelurile" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate nivelurile</SelectItem>
                        <SelectItem value="simplu">Simplu</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Brief / descriere nevoie</Label>
                  <Textarea
                    placeholder="Ex: Avem nevoie de materiale de onboarding pentru angajați noi, inclusiv tricouri și agende..."
                    value={briefText}
                    onChange={e => setBriefText(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                {company && (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-display text-xs font-bold text-primary">
                      {company.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-foreground">{company.company_name}</span>
                      <span className="mx-1.5 text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{company.industry}</span>
                      <span className="mx-1.5 text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{company.contact_department}</span>
                    </div>
                    {enrichment && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{enrichment.employee_count_estimate || '?'} angajați</span>
                      </div>
                    )}
                  </div>
                )}
                <Button onClick={handleGenerate} disabled={!selectedCompanyId} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20">
                  <Sparkles className="mr-2 h-4 w-4" /> Recomandă kituri
                </Button>
              </CardContent>
            </Card>

            <AnimatePresence>
              {hasGenerated && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {recommendations.length} kituri recomandate
                      {company && <span className="ml-2 text-sm font-normal text-muted-foreground">pentru {company.company_name}</span>}
                    </h3>
                    {recommendations.some(r => r.isAlternative) && (
                      <Badge className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <AlertTriangle className="h-3 w-3" /> Include alternative eligibile
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {recommendations.map((rec, i) => (
                      <KitRecommendationCard key={rec.kit.id} rec={rec} rank={i + 1} companyName={company?.company_name} onNavigate={() => navigate(`/new?company=${selectedCompanyId}`)} />
                    ))}
                  </div>
                  {recommendations.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Nu s-au găsit kituri potrivite. Încearcă cu alt brief sau altă companie.</p>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="catalog" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Caută kit..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={catalogFilter} onValueChange={setCatalogFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="simplu">Simplu</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={catalogDeptFilter} onValueChange={setCatalogDeptFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Departament" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate dept.</SelectItem>
                  {allDepartments.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={catalogIndustryFilter} onValueChange={setCatalogIndustryFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Industrie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate ind.</SelectItem>
                  {allIndustries.map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{filteredCatalog.length} kituri afișate</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCatalog.map(kit => (
                <CatalogKitCard key={kit.id} kit={kit} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function KitRecommendationCard({ rec, rank, companyName, onNavigate }: { rec: KitRecommendation; rank: number; companyName?: string; onNavigate: () => void }) {
  const { kit, score, reasons, matchDetails, isAlternative } = rec;
  const cx = complexityConfig[kit.complexity];
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.08 }}>
      <Card className={`overflow-hidden transition-shadow hover:shadow-lg ${isAlternative ? 'ring-1 ring-amber-500/30' : ''}`}>
        <div className={`h-1 ${isAlternative ? 'bg-gradient-to-r from-amber-400 to-amber-300' : 'bg-gradient-to-r from-accent to-accent/50'}`} />
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-display text-xs font-bold text-accent">
                #{rank}
              </div>
              <div>
                <h4 className="font-display font-semibold text-foreground">{kit.name}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">{kit.category} • {kit.audience}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {isAlternative && (
                <Badge className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                  <AlertTriangle className="h-2.5 w-2.5" /> Alternativă
                </Badge>
              )}
              <Badge className={`border text-[10px] gap-1 ${cx.color}`}>{cx.icon} {cx.label}</Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{kit.purpose}</p>

          {/* Match reasons */}
          <div className="flex flex-wrap gap-1.5">
            {matchDetails.industryMatch && <Badge variant="secondary" className="text-[10px] gap-1"><Building2 className="h-2.5 w-2.5" /> Industrie</Badge>}
            {matchDetails.departmentMatch && <Badge variant="secondary" className="text-[10px] gap-1"><Users className="h-2.5 w-2.5" /> Departament</Badge>}
            {matchDetails.purposeMatch && <Badge variant="secondary" className="text-[10px] gap-1"><Target className="h-2.5 w-2.5" /> Scop</Badge>}
            {matchDetails.complexityMatch && <Badge variant="secondary" className="text-[10px] gap-1"><Layers className="h-2.5 w-2.5" /> Complexitate</Badge>}
          </div>

          {/* Reasons text */}
          <div className="space-y-1">
            {reasons.map((r, i) => (
              <p key={i} className="text-xs text-accent-foreground/80 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-accent" /> {r}
              </p>
            ))}
          </div>

          {/* Sales angle */}
          {kit.sales_angle && (
            <div className="rounded-md bg-accent/5 border border-accent/10 px-3 py-2">
              <p className="text-xs font-medium text-accent-foreground/90 italic">💡 {kit.sales_angle}</p>
            </div>
          )}

          {/* Components */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground">Componente</p>
            <div className="flex flex-wrap gap-1">
              {kit.components_json.map((comp, i) => (
                <span key={i} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${comp.customizable ? 'bg-accent/10 text-accent-foreground border border-accent/20' : 'bg-muted text-muted-foreground'}`}>
                  {comp.name}{comp.customizable && <span className="ml-1 text-accent">✦</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Expandable details */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
                {detailsOpen ? 'Ascunde detalii' : 'Operațiuni, CAEN & eligibilitate'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-1 border-t mt-2">
              <div className="flex items-start gap-2">
                <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <div>
                  <p className="text-xs font-medium text-foreground">Operațiuni interne</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {kit.internal_operations_json.map((op, i) => (
                      <span key={i} className="inline-block rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent-foreground">{op}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileCode className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
                <div>
                  <p className="text-xs font-medium text-foreground">Coduri CAEN suport</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {kit.supporting_caen_codes_json.map((code, i) => (
                      <span key={i} className="inline-block rounded bg-info/10 px-1.5 py-0.5 text-xs font-mono text-info">{code}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <div>
                  <p className="text-xs font-medium text-foreground">Eligibilitate</p>
                  <div className="mt-1 mb-1">
                    <EligibilityBadge status={kit.eligibility_type} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{kit.eligibility_explanation}</p>
                </div>
              </div>
              {kit.target_departments.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Departamente țintă</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {kit.target_departments.map((d, i) => (
                        <span key={i} className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {kit.presentation_use_case && (
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">📊 <span className="font-medium">În prezentare:</span> {kit.presentation_use_case}</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={onNavigate}>
            Include în prezentare <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CatalogKitCard({ kit }: { kit: Kit }) {
  const cx = complexityConfig[kit.complexity];
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-1 bg-gradient-to-r from-accent to-accent/50" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-display font-semibold text-foreground text-sm">{kit.name}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">{kit.category} • {kit.audience}</p>
          </div>
          <div className="flex items-center gap-1">
            {kit.is_alternative && (
              <Badge className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                Alt
              </Badge>
            )}
            <Badge className={`border text-[10px] gap-1 ${cx.color}`}>{cx.icon} {cx.label}</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{kit.purpose}</p>

        <div className="flex flex-wrap gap-1">
          {kit.components_json.slice(0, 4).map((c, i) => (
            <span key={i} className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{c.name}</span>
          ))}
          {kit.components_json.length > 4 && (
            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">+{kit.components_json.length - 4}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1 border-t">
          <EligibilityBadge status={kit.eligibility_type} />
          <div className="flex flex-wrap gap-1 ml-auto">
            {kit.supporting_caen_codes_json.map((code, i) => (
              <span key={i} className="inline-block rounded bg-info/10 px-1.5 py-0.5 text-[10px] font-mono text-info">{code}</span>
            ))}
          </div>
        </div>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs gap-1">
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
              Detalii
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2 border-t">
            <div>
              <p className="text-[10px] font-medium text-foreground mb-1">Operațiuni interne</p>
              <div className="flex flex-wrap gap-1">
                {kit.internal_operations_json.map((op, i) => (
                  <span key={i} className="inline-block rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent-foreground">{op}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-foreground mb-1">Departamente</p>
              <div className="flex flex-wrap gap-1">
                {kit.target_departments.map((d, i) => (
                  <span key={i} className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{d}</span>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{kit.eligibility_explanation}</p>
            {kit.sales_angle && (
              <p className="text-[10px] text-accent-foreground/80 italic">💡 {kit.sales_angle}</p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
