import { useParams, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { ArrowLeft, ExternalLink, Users, MapPin, Building2, Signal } from 'lucide-react';
import OpportunityCalculator from '@/components/OpportunityCalculator';

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const { getCompany, getEnrichment, updateCompany } = useData();
  const company = getCompany(id || '');
  const enrichment = getEnrichment(id || '');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(company || {} as any);

  if (!company) {
    return <AppLayout><p className="text-muted-foreground">Compania nu a fost găsită.</p></AppLayout>;
  }

  const handleSave = () => {
    updateCompany({ ...company, ...form, updated_at: new Date().toISOString() });
    setEditing(false);
  };

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
          <Link to={`/new?company=${company.id}`}>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Generează prezentare</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Informații companie</CardTitle>
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

            {/* Enrichment */}
            {enrichment && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Research & Enrichment</CardTitle>
                    <Badge variant={enrichment.enrichment_status === 'verified' ? 'default' : 'secondary'}>
                      {enrichment.enrichment_status === 'verified' ? '✓ Verificat' :
                        enrichment.enrichment_status === 'estimated' ? '~ Estimat' : '? Necesită confirmare'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{enrichment.public_summary}</p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <InfoItem icon={Building2} label="CAEN" value={`${enrichment.caen_code} - ${enrichment.caen_label}`} />
                    <InfoItem icon={Users} label="Angajați (estimat)" value={`${enrichment.employee_count_estimate || 'N/A'}`} />
                    <InfoItem icon={MapPin} label="Sediu" value={enrichment.headquarters} />
                  </div>
                  {enrichment.employee_count_confidence > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Confidence Score angajați</Label>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${enrichment.employee_count_confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground">{Math.round(enrichment.employee_count_confidence * 100)}%</span>
                      </div>
                    </div>
                  )}
                  {enrichment.signals_json.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Semnale detectate</Label>
                      <div className="flex flex-wrap gap-2">
                        {enrichment.signals_json.map((signal, i) => (
                          <div key={i} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                            <Signal className="h-3 w-3 text-accent" />
                            <span className="text-xs text-foreground">{signal.label}</span>
                            <span className="text-xs text-muted-foreground">({Math.round(signal.confidence * 100)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {enrichment.sources_json.map((src, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{src}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <OpportunityCalculator companyId={company.id} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
