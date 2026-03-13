import { useParams, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import VerifiedCompanyDataPanel from '@/components/VerifiedCompanyDataPanel';
import CommercialEnrichmentPanel from '@/components/CommercialEnrichmentPanel';
import SalesCopilotPanel from '@/components/SalesCopilotPanel';
import DocumentPackPanel from '@/components/DocumentPackPanel';
import OnboardingChecklistPanel from '@/components/OnboardingChecklistPanel';
import OfficialWebsiteDataPanel from '@/components/OfficialWebsiteDataPanel';
import CommercialResearchInsightsPanel from '@/components/CommercialResearchInsightsPanel';
import CommercialInsightsPanel from '@/components/CommercialInsightsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Search, Loader2, CheckCircle } from 'lucide-react';
import OpportunityCalculator from '@/components/OpportunityCalculator';
import { analyzeCompanySignals } from '@/services/companySignalsService';
import { detectIntent } from '@/services/intentDetectionService';
import { generateOpportunityInsights } from '@/services/opportunityInsightsService';
import { researchOfficialWebsite, type OfficialWebsiteData, type ResearchStep, RESEARCH_STEP_LABELS } from '@/services/officialWebsiteResearchService';
import { detectBusinessSignals, type BusinessSignalReport } from '@/services/businessSignalDetectionService';
import { generateResearchInsights, type CommercialResearchInsights } from '@/services/companyResearchInsightsService';
import { generateCommercialInsights, type CommercialInsights } from '@/services/commercialInsightsService';
import { generatePitchAngles } from '@/services/pitchAngleGeneratorService';

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const { getCompany, getEnrichment, updateCompany, calculations, briefs, products, kits } = data;
  const company = getCompany(id || '');
  const enrichment = getEnrichment(id || '');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(company || {} as any);

  // Research state
  const [researchStep, setResearchStep] = useState<ResearchStep>('idle');
  const [websiteData, setWebsiteData] = useState<OfficialWebsiteData | null>(null);
  const [researchInsights, setResearchInsights] = useState<CommercialResearchInsights | null>(null);
  const [commercialInsights, setCommercialInsights] = useState<CommercialInsights | null>(null);

  const insights = useMemo(() => {
    if (!company) return null;
    const calc = calculations.find(c => c.company_id === company.id) || null;
    const brief = briefs.find(b => b.company_id === company.id) || null;
    const signals = analyzeCompanySignals(company, enrichment, brief?.raw_brief);
    const intent = brief?.raw_brief ? detectIntent(brief.raw_brief) : null;
    const industry = enrichment?.industry_label || company.industry || '';
    return generateOpportunityInsights(enrichment, signals, intent, industry, calc);
  }, [company, enrichment, calculations, briefs]);

  const handleRunResearch = useCallback(async () => {
    if (!company) return;

    // Step 1: Searching official website
    setResearchStep('searching_website');
    await new Promise(r => setTimeout(r, 600));
    const webData = researchOfficialWebsite(company, enrichment);
    setWebsiteData(webData);

    // Step 2: Extracting description
    setResearchStep('extracting_description');
    await new Promise(r => setTimeout(r, 500));

    // Step 3: Detecting signals
    setResearchStep('detecting_signals');
    await new Promise(r => setTimeout(r, 500));
    const companySignals = analyzeCompanySignals(company, enrichment);
    const signalReport: BusinessSignalReport = detectBusinessSignals(company, enrichment, webData, companySignals);

    // Step 4: Generating insights
    setResearchStep('generating_insights');
    await new Promise(r => setTimeout(r, 600));
    const brief = briefs.find(b => b.company_id === company.id);
    const intent = brief?.raw_brief ? detectIntent(brief.raw_brief) : null;
    const resInsights = generateResearchInsights(
      company, enrichment, webData, signalReport, companySignals, intent, products, kits
    );
    setResearchInsights(resInsights);

    // Generate pitch angles (integration point)
    generatePitchAngles(webData, signalReport, companySignals, intent);

    setResearchStep('completed');
  }, [company, enrichment, briefs, products, kits]);

  if (!company) {
    return <AppLayout><p className="text-muted-foreground">Compania nu a fost găsită.</p></AppLayout>;
  }

  const handleSave = () => {
    updateCompany({ ...company, ...form, updated_at: new Date().toISOString() });
    setEditing(false);
  };

  const isResearching = researchStep !== 'idle' && researchStep !== 'completed' && researchStep !== 'error';

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{company.company_name}</h1>
            <p className="text-sm text-muted-foreground">{company.legal_name}</p>
          </div>
          <Button
            onClick={handleRunResearch}
            disabled={isResearching}
            variant={researchStep === 'completed' ? 'outline' : 'default'}
            className="gap-2"
          >
            {isResearching ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {RESEARCH_STEP_LABELS[researchStep]}</>
            ) : researchStep === 'completed' ? (
              <><CheckCircle className="h-4 w-4" /> Research completed</>
            ) : (
              <><Search className="h-4 w-4" /> Run Company Research</>
            )}
          </Button>
          <Link to={`/new?company=${company.id}`}>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Generează prezentare</Button>
          </Link>
        </div>

        {/* Research step indicator */}
        {isResearching && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm font-medium text-primary">{RESEARCH_STEP_LABELS[researchStep]}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Company Info + Enrichment */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Verified Company Data</CardTitle>
                <Button variant="outline" size="sm" onClick={() => editing ? handleSave() : setEditing(true)}>
                  {editing ? 'Salvează' : 'Editează'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { key: 'company_name', label: 'Nume companie' },
                    { key: 'legal_name', label: 'Denumire legală' },
                    { key: 'website', label: 'Website' },
                    { key: 'industry', label: 'Industrie' },
                    { key: 'company_size', label: 'Dimensiune' },
                    { key: 'location', label: 'Localizare' },
                    { key: 'contact_name', label: 'Persoană de contact' },
                    { key: 'contact_role', label: 'Rol contact' },
                    { key: 'contact_department', label: 'Departament' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Telefon' },
                  ].map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{field.label}</Label>
                      {editing ? (
                        <Input
                          value={(form as any)[field.key] || ''}
                          onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-foreground">{(company as any)[field.key] || '—'}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1">
                  <Label className="text-xs text-muted-foreground">Note</Label>
                  {editing ? (
                    <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  ) : (
                    <p className="text-sm text-muted-foreground">{company.notes || 'Fără note'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verified Company Data */}
            <VerifiedCompanyDataPanel company={company} enrichment={enrichment || null} isDemo={data.isDemo} />

            {/* Commercial Enrichment */}
            <CommercialEnrichmentPanel company={company} enrichment={enrichment || null} isDemo={data.isDemo} />

            {/* Official Website Data — shown after research */}
            {websiteData && <OfficialWebsiteDataPanel data={websiteData} />}

            {/* Commercial Research Insights — shown after research */}
            {researchInsights && <CommercialResearchInsightsPanel data={researchInsights} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <OpportunityCalculator companyId={company.id} />
            <OnboardingChecklistPanel companyId={company.id} />
            <DocumentPackPanel company={company} enrichment={enrichment || null} insights={insights} />
            <SalesCopilotPanel company={company} enrichment={enrichment || null} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
