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
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Sparkles, ShieldCheck, Wrench, FileCode, AlertTriangle, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { recommendKits, type KitRecommendation } from '@/lib/kit-generator';
import { seedKits } from '@/data/seed';
import type { Kit, KitComplexity } from '@/types';

const complexityLabels: Record<KitComplexity, { label: string; color: string }> = {
  simplu: { label: 'Simplu', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  standard: { label: 'Standard', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  premium: { label: 'Premium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export default function KitGeneratorPage() {
  const data = useData();
  const navigate = useNavigate();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [briefText, setBriefText] = useState('');
  const [complexity, setComplexity] = useState<KitComplexity | ''>('');
  const [recommendations, setRecommendations] = useState<KitRecommendation[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  const company = data.getCompany(selectedCompanyId);

  const handleGenerate = () => {
    if (!company) return;
    const results = recommendKits({
      industry: company.industry,
      department: company.contact_department,
      briefText,
      purpose: briefText || 'General corporate',
      complexity: complexity || undefined,
    });
    setRecommendations(results);
    setHasGenerated(true);
  };

  const filteredCatalog = useMemo(() => {
    return seedKits.filter(k => {
      if (!k.active) return false;
      if (catalogFilter !== 'all' && k.complexity !== catalogFilter && k.category !== catalogFilter) return false;
      if (catalogSearch) {
        const s = catalogSearch.toLowerCase();
        return k.name.toLowerCase().includes(s) || k.purpose.toLowerCase().includes(s) || k.category.toLowerCase().includes(s);
      }
      return true;
    });
  }, [catalogFilter, catalogSearch]);

  const categories = [...new Set(seedKits.map(k => k.category))];

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Kit Generator</h1>
            <p className="text-sm text-muted-foreground">Recomandă kituri eligibile pe baza companiei, brief-ului și complexității dorite</p>
          </div>
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
            <Package className="h-4 w-4" /> {seedKits.length} kituri disponibile
          </Badge>
        </div>

        <Tabs defaultValue="generator" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="generator" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Generator</TabsTrigger>
            <TabsTrigger value="catalog" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Catalog complet</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            {/* Input form */}
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
                          <SelectItem key={c.id} value={c.id}>{c.company_name} — {c.contact_department}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nivel complexitate</Label>
                    <Select value={complexity} onValueChange={v => setComplexity(v as KitComplexity | '')}>
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 font-display text-xs font-bold text-primary">
                      {company.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{company.company_name}</span>
                      <span className="mx-1.5 text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{company.industry}</span>
                      <span className="mx-1.5 text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{company.contact_department}</span>
                    </div>
                  </div>
                )}
                <Button onClick={handleGenerate} disabled={!selectedCompanyId} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20">
                  <Sparkles className="mr-2 h-4 w-4" /> Recomandă kituri
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <AnimatePresence>
              {hasGenerated && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {recommendations.length} kituri recomandate
                    </h3>
                    {recommendations.some(r => r.isAlternative) && (
                      <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-200">
                        <AlertTriangle className="h-3 w-3" /> Include alternative eligibile
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {recommendations.map((rec, i) => (
                      <KitRecommendationCard key={rec.kit.id} rec={rec} rank={i + 1} onNavigate={() => navigate(`/new?company=${selectedCompanyId}`)} />
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
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
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
            </div>
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

function KitRecommendationCard({ rec, rank, onNavigate }: { rec: KitRecommendation; rank: number; onNavigate: () => void }) {
  const { kit, score, reason, isAlternative } = rec;
  const cx = complexityLabels[kit.complexity];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.08 }}>
      <Card className={`card-elevated overflow-hidden ${isAlternative ? 'ring-1 ring-amber-300' : ''}`}>
        <div className={`h-1 ${isAlternative ? 'bg-gradient-to-r from-amber-400 to-amber-300' : 'bg-gradient-to-r from-accent to-accent/50'}`} />
        <CardContent className="p-4 space-y-3">
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
                <Badge className="gap-1 bg-amber-50 text-amber-600 border-amber-200 text-[10px]">
                  <AlertTriangle className="h-2.5 w-2.5" /> Alternativă
                </Badge>
              )}
              <Badge className={`border text-[10px] ${cx.color}`}>{cx.label}</Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{kit.purpose}</p>
          <p className="text-xs text-accent-foreground/80 italic">{reason}</p>

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

          <div className="space-y-2 pt-1 border-t">
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
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{kit.eligibility_explanation}</p>
              </div>
            </div>
          </div>

          <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={onNavigate}>
            Include în prezentare <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CatalogKitCard({ kit }: { kit: Kit }) {
  const cx = complexityLabels[kit.complexity];

  return (
    <Card className="card-elevated overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-accent to-accent/50" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-display font-semibold text-foreground text-sm">{kit.name}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">{kit.category} • {kit.audience}</p>
          </div>
          <div className="flex items-center gap-1">
            {kit.is_alternative && (
              <Badge className="gap-1 bg-amber-50 text-amber-600 border-amber-200 text-[10px]">
                <AlertTriangle className="h-2.5 w-2.5" /> Alt
              </Badge>
            )}
            <Badge className={`border text-[10px] ${cx.color}`}>{cx.label}</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{kit.purpose}</p>
        <div className="flex flex-wrap gap-1">
          {kit.components_json.slice(0, 5).map((c, i) => (
            <span key={i} className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{c.name}</span>
          ))}
          {kit.components_json.length > 5 && (
            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">+{kit.components_json.length - 5}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 pt-1 border-t">
          {kit.supporting_caen_codes_json.map((code, i) => (
            <span key={i} className="inline-block rounded bg-info/10 px-1.5 py-0.5 text-[10px] font-mono text-info">{code}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
