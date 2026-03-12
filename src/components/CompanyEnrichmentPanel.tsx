import { useState, useCallback } from 'react';
import type { Company, CompanyEnrichment, EnrichmentSignal, EnrichmentStatus } from '@/types';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Building2, Users, MapPin, Globe, ExternalLink, Shield, ShieldCheck, ShieldAlert,
  AlertTriangle, CheckCircle2, Edit3, RotateCcw, Signal, Briefcase, Megaphone,
  Heart, Gift, TrendingUp, Eye, ChevronDown, ChevronUp, Info, Plus, Save, Loader2
} from 'lucide-react';

// ─── Types & Config ─────────────────────────────────────────

type EnrichmentState = 'not_started' | 'draft_enriched' | 'confirmed';

interface Props {
  company: Company;
  enrichment: CompanyEnrichment | null;
  onUpdateEnrichment?: (enrichment: CompanyEnrichment) => void;
  compact?: boolean;
}

const signalIcons: Record<string, React.ElementType> = {
  hiring: TrendingUp,
  multi_location: MapPin,
  hr_focus: Briefcase,
  marketing_focus: Megaphone,
  csr: Heart,
  corporate_gifting: Gift,
  large_company: Building2,
};

const signalColors: Record<string, string> = {
  hiring: 'bg-info/10 text-info border-info/20',
  multi_location: 'bg-accent/10 text-accent border-accent/20',
  hr_focus: 'bg-success/10 text-success border-success/20',
  marketing_focus: 'bg-warning/10 text-warning border-warning/20',
  csr: 'bg-destructive/10 text-destructive border-destructive/20',
  corporate_gifting: 'bg-accent/10 text-accent border-accent/20',
  large_company: 'bg-primary/10 text-primary border-primary/20',
};

const signalRelevanceLabels: Record<string, string> = {
  hiring: 'Relevanță recrutare',
  multi_location: 'Relevanță multi-locație',
  hr_focus: 'Relevanță HR / Employer Branding',
  marketing_focus: 'Relevanță marketing / evenimente',
  csr: 'Relevanță CSR / branding social',
  corporate_gifting: 'Relevanță cadouri corporate',
  large_company: 'Relevanță dimensiune companie',
};

function getEnrichmentState(enrichment: CompanyEnrichment | null): EnrichmentState {
  if (!enrichment) return 'not_started';
  if (enrichment.enrichment_status === 'verified') return 'confirmed';
  return 'draft_enriched';
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'bg-success';
  if (confidence >= 0.65) return 'bg-warning';
  return 'bg-destructive';
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'Încredere ridicată — date verificate';
  if (confidence >= 0.65) return 'Încredere medie — recomandăm verificare';
  return 'Încredere scăzută — date parțiale';
}

function getStatusBadge(status: EnrichmentStatus | string, hasOverrides: boolean) {
  if (hasOverrides) {
    return { label: 'Manual Override', icon: Edit3, className: 'border-warning/30 text-warning bg-warning/5' };
  }
  switch (status) {
    case 'verified': return { label: 'Verificat', icon: ShieldCheck, className: 'border-success/30 text-success bg-success/5' };
    case 'estimated': return { label: 'Estimat', icon: Eye, className: 'border-warning/30 text-warning bg-warning/5' };
    default: return { label: 'Necesită confirmare', icon: ShieldAlert, className: 'border-destructive/30 text-destructive bg-destructive/5' };
  }
}

// ─── Main Component ─────────────────────────────────────────

export default function CompanyEnrichmentPanel({ company, enrichment, onUpdateEnrichment, compact = false }: Props) {
  const { addEnrichment, updateEnrichment } = useData();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showSignals, setShowSignals] = useState(!compact);
  const [showDetails, setShowDetails] = useState(!compact);
  const [showSources, setShowSources] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Quick-create enrichment form state
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickForm, setQuickForm] = useState({
    legal_name: company.legal_name || '',
    website: company.website || '',
    industry_label: company.industry || '',
    headquarters: company.location || '',
    employee_count_estimate: '',
    public_summary: company.description || '',
  });

  const state = getEnrichmentState(enrichment);
  const confidence = enrichment?.employee_count_confidence || 0;
  const hasOverrides = Object.keys(overrides).length > 0;

  const getDisplayValue = (field: string, originalValue: string | number | null): string => {
    if (overrides[field] !== undefined) return overrides[field];
    return originalValue?.toString() || '—';
  };

  const isOverridden = (field: string) => overrides[field] !== undefined;

  const handleOverride = (field: string, value: string) => {
    setOverrides(prev => ({ ...prev, [field]: value }));
    setEditingField(null);
  };

  const handleResetOverride = (field: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ─── Persist overrides to enrichment ─────────────────────
  const handleSaveOverrides = useCallback(async () => {
    if (!enrichment || Object.keys(overrides).length === 0) return;
    setIsSaving(true);
    try {
      const updated: CompanyEnrichment = { ...enrichment };
      Object.entries(overrides).forEach(([key, value]) => {
        if (key === 'employee_count_estimate') {
          (updated as any)[key] = parseInt(value) || null;
        } else {
          (updated as any)[key] = value;
        }
      });
      await updateEnrichment(updated);
      onUpdateEnrichment?.(updated);
      setOverrides({});
    } finally {
      setIsSaving(false);
    }
  }, [enrichment, overrides, updateEnrichment, onUpdateEnrichment]);

  // ─── Confirm enrichment (set to verified) ────────────────
  const handleConfirm = useCallback(async () => {
    if (!enrichment) return;
    setIsSaving(true);
    try {
      // First save any pending overrides
      const updated: CompanyEnrichment = { ...enrichment, enrichment_status: 'verified' as EnrichmentStatus };
      Object.entries(overrides).forEach(([key, value]) => {
        if (key === 'employee_count_estimate') {
          (updated as any)[key] = parseInt(value) || null;
        } else {
          (updated as any)[key] = value;
        }
      });
      updated.employee_count_confidence = Math.max(updated.employee_count_confidence, 0.9);
      await updateEnrichment(updated);
      onUpdateEnrichment?.(updated);
      setOverrides({});
    } finally {
      setIsSaving(false);
    }
  }, [enrichment, overrides, updateEnrichment, onUpdateEnrichment]);

  // ─── Quick-create enrichment from scratch ────────────────
  const handleQuickCreate = useCallback(async () => {
    setIsSaving(true);
    try {
      const empEst = parseInt(quickForm.employee_count_estimate) || null;
      await addEnrichment({
        company_id: company.id,
        legal_name: quickForm.legal_name,
        website: quickForm.website,
        linkedin_url: '',
        industry_label: quickForm.industry_label,
        caen_code: '',
        caen_label: '',
        employee_count_exact: null,
        employee_count_min: empEst ? Math.round(empEst * 0.85) : null,
        employee_count_max: empEst ? Math.round(empEst * 1.15) : null,
        employee_count_estimate: empEst,
        employee_count_confidence: empEst ? 0.5 : 0,
        headquarters: quickForm.headquarters,
        public_summary: quickForm.public_summary,
        enrichment_status: 'needs_confirmation' as EnrichmentStatus,
        sources_json: ['Introducere manuală'],
        signals_json: [],
        last_enriched_at: new Date().toISOString(),
      });
      setShowQuickForm(false);
    } finally {
      setIsSaving(false);
    }
  }, [company.id, quickForm, addEnrichment]);

  const stateConfig = {
    not_started: { icon: AlertTriangle, label: 'Enrichment nepornit', color: 'text-muted-foreground', desc: 'Nu există date detectate' },
    draft_enriched: { icon: Eye, label: 'Date detectate — necesită confirmare', color: 'text-warning', desc: 'Datele au fost colectate automat și necesită verificare' },
    confirmed: { icon: ShieldCheck, label: 'Date verificate', color: 'text-success', desc: 'Datele companiei sunt confirmate' },
  };
  const currentState = stateConfig[state];
  const StateIcon = currentState.icon;

  // ─── Not Started State ────────────────────────────────────
  if (state === 'not_started') {
    return (
      <Card className="border-dashed border-2 border-muted overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-base">Enrichment companie</CardTitle>
            <Badge variant="outline" className="gap-1 text-[10px] border-muted-foreground/30 text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              Nepornit
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available basic info */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Informații disponibile din formular:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <InfoRow label="Industrie" value={company.industry} />
              <InfoRow label="Dimensiune" value={company.company_size} />
              <InfoRow label="Locație" value={company.location} />
              <InfoRow label="Departament contact" value={company.contact_department} />
            </div>
          </div>

          {!showQuickForm ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-muted-foreground text-center">
                Adaugă date suplimentare pentru o prezentare mai personalizată.
              </p>
              <Button onClick={() => setShowQuickForm(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Adaugă date manual
              </Button>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold text-foreground">Completare rapidă date companie</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Denumire legală</Label>
                  <Input value={quickForm.legal_name} onChange={e => setQuickForm(p => ({ ...p, legal_name: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Website</Label>
                  <Input value={quickForm.website} onChange={e => setQuickForm(p => ({ ...p, website: e.target.value }))} className="h-8 text-sm" placeholder="exemplu.ro" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Industrie</Label>
                  <Input value={quickForm.industry_label} onChange={e => setQuickForm(p => ({ ...p, industry_label: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Sediu</Label>
                  <Input value={quickForm.headquarters} onChange={e => setQuickForm(p => ({ ...p, headquarters: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Nr. angajați (estimat)</Label>
                  <Input type="number" value={quickForm.employee_count_estimate} onChange={e => setQuickForm(p => ({ ...p, employee_count_estimate: e.target.value }))} className="h-8 text-sm" placeholder="250" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Descriere scurtă</Label>
                <Textarea value={quickForm.public_summary} onChange={e => setQuickForm(p => ({ ...p, public_summary: e.target.value }))} className="text-sm resize-none" rows={2} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleQuickCreate} disabled={isSaving} className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Salvează
                </Button>
                <Button variant="ghost" onClick={() => setShowQuickForm(false)}>Anulează</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Enriched State (draft or confirmed) ──────────────────
  const empExact = enrichment?.employee_count_exact;
  const empMin = enrichment?.employee_count_min;
  const empMax = enrichment?.employee_count_max;
  const empEstimate = enrichment?.employee_count_estimate;
  const statusBadge = getStatusBadge(enrichment?.enrichment_status || 'needs_confirmation', hasOverrides);
  const StatusBadgeIcon = statusBadge.icon;

  return (
    <Card className="overflow-hidden border shadow-sm">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="font-display text-base truncate">Date companie</CardTitle>
            <Badge variant="outline" className={`gap-1 text-[10px] shrink-0 ${statusBadge.className}`}>
              <StatusBadgeIcon className="h-3 w-3" />
              {statusBadge.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasOverrides && (
              <Button size="sm" onClick={handleSaveOverrides} disabled={isSaving} className="h-7 text-[10px] gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Salvează modificările
              </Button>
            )}
            {state === 'draft_enriched' && !hasOverrides && (
              <Button size="sm" onClick={handleConfirm} disabled={isSaving} className="h-7 text-[10px] gap-1 bg-success text-success-foreground hover:bg-success/90">
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Confirmă datele
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{currentState.desc}</p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Confidence Score */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Scor de încredere date</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${confidence >= 0.85 ? 'text-success' : confidence >= 0.65 ? 'text-warning' : 'text-destructive'}`}>
                {Math.round(confidence * 100)}%
              </span>
            </div>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${getConfidenceColor(confidence)}`}
              style={{ width: `${confidence * 100}%` }}
            />
            {/* Threshold markers */}
            <div className="absolute top-0 left-[65%] h-full w-px bg-muted-foreground/20" />
            <div className="absolute top-0 left-[85%] h-full w-px bg-muted-foreground/20" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">{getConfidenceLabel(confidence)}</p>
            <div className="flex gap-3 text-[9px] text-muted-foreground">
              <span>65% medie</span>
              <span>85% ridicată</span>
            </div>
          </div>
        </div>

        {/* Main data fields */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date detectate</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <EnrichmentField
              icon={Building2} label="Denumire legală"
              value={getDisplayValue('legal_name', enrichment?.legal_name || null)}
              isOverridden={isOverridden('legal_name')} isEditing={editingField === 'legal_name'}
              status={enrichment?.enrichment_status || 'needs_confirmation'}
              onEdit={() => setEditingField('legal_name')} onSave={(v) => handleOverride('legal_name', v)}
              onReset={() => handleResetOverride('legal_name')} onCancel={() => setEditingField(null)}
            />
            <EnrichmentField
              icon={Globe} label="Website"
              value={getDisplayValue('website', enrichment?.website || null)}
              isOverridden={isOverridden('website')} isEditing={editingField === 'website'}
              status={enrichment?.enrichment_status || 'needs_confirmation'}
              onEdit={() => setEditingField('website')} onSave={(v) => handleOverride('website', v)}
              onReset={() => handleResetOverride('website')} onCancel={() => setEditingField(null)}
              isLink
            />
            <EnrichmentField
              icon={Briefcase} label="Industrie"
              value={getDisplayValue('industry_label', enrichment?.industry_label || null)}
              isOverridden={isOverridden('industry_label')} isEditing={editingField === 'industry_label'}
              status={enrichment?.enrichment_status || 'needs_confirmation'}
              onEdit={() => setEditingField('industry_label')} onSave={(v) => handleOverride('industry_label', v)}
              onReset={() => handleResetOverride('industry_label')} onCancel={() => setEditingField(null)}
            />
            <EnrichmentField
              icon={MapPin} label="Sediu central"
              value={getDisplayValue('headquarters', enrichment?.headquarters || null)}
              isOverridden={isOverridden('headquarters')} isEditing={editingField === 'headquarters'}
              status={enrichment?.enrichment_status || 'needs_confirmation'}
              onEdit={() => setEditingField('headquarters')} onSave={(v) => handleOverride('headquarters', v)}
              onReset={() => handleResetOverride('headquarters')} onCancel={() => setEditingField(null)}
            />
          </div>

          {/* Employee count section */}
          <div className="rounded-lg border bg-muted/10">
            <button
              onClick={() => setShowDetails(prev => !prev)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-muted/20 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Angajați</span>
                <span className="text-sm font-bold text-foreground">
                  {isOverridden('employee_count_estimate')
                    ? overrides['employee_count_estimate']
                    : empEstimate || '—'}
                </span>
                {empExact ? (
                  <Badge variant="outline" className="text-[10px] border-success/30 text-success bg-success/5">exact</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-warning/30 text-warning bg-warning/5">estimat</Badge>
                )}
                {isOverridden('employee_count_estimate') && (
                  <Badge variant="outline" className="text-[10px] border-warning/30 text-warning bg-warning/5 gap-0.5">
                    <Edit3 className="h-2.5 w-2.5" /> manual
                  </Badge>
                )}
              </div>
              {showDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {showDetails && (
              <div className="px-3 pb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MiniStat label="Exact" value={empExact?.toString() || '—'} muted={!empExact} />
                  <MiniStat label="Minim" value={empMin?.toString() || '—'} muted={!empMin} />
                  <MiniStat label="Maxim" value={empMax?.toString() || '—'} muted={!empMax} />
                  <MiniStat label="Estimare" value={
                    isOverridden('employee_count_estimate')
                      ? overrides['employee_count_estimate']
                      : empEstimate?.toString() || '—'
                  } highlight />
                </div>
                {editingField === 'employee_count_estimate' ? (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px]">Nr. angajați estimat</Label>
                      <Input
                        type="number"
                        defaultValue={overrides['employee_count_estimate'] || empEstimate?.toString() || ''}
                        autoFocus
                        className="h-8 text-sm"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleOverride('employee_count_estimate', (e.target as HTMLInputElement).value);
                          if (e.key === 'Escape') setEditingField(null);
                        }}
                      />
                    </div>
                    <Button size="sm" className="h-8 text-xs" onClick={() => {
                      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                      if (input) handleOverride('employee_count_estimate', input.value);
                    }}>OK</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingField(null)}>✕</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setEditingField('employee_count_estimate')}>
                      <Edit3 className="h-3 w-3" /> Editează estimarea
                    </Button>
                    {isOverridden('employee_count_estimate') && (
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => handleResetOverride('employee_count_estimate')}>
                        <RotateCcw className="h-3 w-3" /> Resetează
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Public Summary */}
          {enrichment?.public_summary && (
            <div className="rounded-lg border bg-muted/10 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Descriere publică</p>
                <button onClick={() => setEditingField(editingField === 'public_summary' ? null : 'public_summary')} className="p-1 rounded hover:bg-muted">
                  <Edit3 className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              {editingField === 'public_summary' ? (
                <div className="space-y-2">
                  <Textarea
                    defaultValue={overrides['public_summary'] || enrichment.public_summary}
                    className="text-sm resize-none"
                    rows={3}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Escape') setEditingField(null);
                    }}
                    id="summary-edit"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-6 text-[10px]" onClick={() => {
                      const el = document.getElementById('summary-edit') as HTMLTextAreaElement;
                      if (el) handleOverride('public_summary', el.value);
                    }}>Salvează</Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditingField(null)}>Anulează</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground leading-relaxed">
                  {isOverridden('public_summary') ? overrides['public_summary'] : enrichment.public_summary}
                  {isOverridden('public_summary') && (
                    <Badge className="ml-1 h-4 text-[8px] px-1 bg-warning/20 text-warning border-0 align-middle">manual</Badge>
                  )}
                </p>
              )}
            </div>
          )}

          {/* CAEN */}
          {enrichment?.caen_code && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="font-mono text-xs">{enrichment.caen_code}</Badge>
              <span className="text-muted-foreground">{enrichment.caen_label}</span>
            </div>
          )}
        </div>

        {/* ─── Signals ─────────────────────────────────────── */}
        {enrichment?.signals_json && enrichment.signals_json.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowSignals(prev => !prev)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">Semnale utile pentru prezentare</span>
                <Badge variant="secondary" className="text-[10px]">{enrichment.signals_json.length}</Badge>
              </div>
              {showSignals ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showSignals && (
              <div className="grid grid-cols-1 gap-2">
                {enrichment.signals_json.map((signal, i) => {
                  const SigIcon = signalIcons[signal.type] || Signal;
                  const colors = signalColors[signal.type] || 'bg-muted text-foreground border-border';
                  const relevanceLabel = signalRelevanceLabels[signal.type] || 'Semnal detectat';
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${colors}`}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/50 shrink-0">
                        <SigIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{signal.label}</p>
                        <p className="text-[10px] opacity-70">{relevanceLabel}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                            signal.confidence >= 0.85 ? 'bg-success/20 text-success' :
                            signal.confidence >= 0.65 ? 'bg-warning/20 text-warning' :
                            'bg-destructive/20 text-destructive'
                          }`}>
                            {Math.round(signal.confidence * 100)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                          Încredere semnal: {Math.round(signal.confidence * 100)}%
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Sources ────────────────────────────────────── */}
        {enrichment?.sources_json && enrichment.sources_json.length > 0 && (
          <div className="space-y-1.5">
            <button onClick={() => setShowSources(p => !p)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-3 w-3" />
              <span>{enrichment.sources_json.length} surse de date</span>
              {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showSources && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {enrichment.sources_json.map((src, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] gap-1">
                    <ExternalLink className="h-2.5 w-2.5" />
                    {src}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Override summary ────────────────────────────── */}
        {hasOverrides && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex items-start gap-2">
            <Edit3 className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">{Object.keys(overrides).length} câmp(uri) modificate manual</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Apasă „Salvează modificările" pentru a persista schimbările sau „Confirmă datele" pentru a marca totul ca verificat.
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.keys(overrides).map(key => (
                  <Badge key={key} variant="outline" className="text-[9px] gap-0.5 border-warning/30 text-warning">
                    {key.replace(/_/g, ' ')}
                    <button onClick={() => handleResetOverride(key)} className="ml-0.5 hover:text-destructive">✕</button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Data completeness indicator ────────────────── */}
        {state === 'draft_enriched' && !hasOverrides && (
          <div className="rounded-lg border border-info/20 bg-info/5 p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-info mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Date parțiale — utilizabile</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Poți continua cu aceste date. Confirmă-le pentru un scor de încredere mai mare în prezentare.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sub-components ─────────────────────────────────────────

interface EnrichmentFieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  isOverridden: boolean;
  isEditing: boolean;
  status: 'verified' | 'estimated' | 'needs_confirmation' | string;
  onEdit: () => void;
  onSave: (value: string) => void;
  onReset: () => void;
  onCancel: () => void;
  isLink?: boolean;
}

function EnrichmentField({ icon: Icon, label, value, isOverridden, isEditing, status, onEdit, onSave, onReset, onCancel, isLink }: EnrichmentFieldProps) {
  const [editValue, setEditValue] = useState(value);

  if (isEditing) {
    return (
      <div className="space-y-1 rounded-lg border-2 border-accent/50 bg-accent/5 p-2">
        <Label className="text-[10px] text-muted-foreground">{label}</Label>
        <Input
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          className="h-8 text-sm"
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') onSave(editValue);
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="flex gap-1">
          <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => onSave(editValue)}>Salvează</Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={onCancel}>Anulează</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative rounded-lg border p-2.5 transition-colors hover:bg-muted/30 ${isOverridden ? 'border-warning/30 bg-warning/5' : 'border-transparent'}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {isOverridden && (
          <Badge className="h-4 text-[8px] px-1 bg-warning/20 text-warning border-0">manual</Badge>
        )}
        {!isOverridden && status === 'estimated' && (
          <div className="h-1.5 w-1.5 rounded-full bg-warning" title="Estimat" />
        )}
        {!isOverridden && status === 'verified' && (
          <div className="h-1.5 w-1.5 rounded-full bg-success" title="Verificat" />
        )}
      </div>
      <div className="flex items-center justify-between mt-0.5">
        {isLink && value !== '—' ? (
          <a href={`https://${value}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-info truncate hover:underline">{value}</a>
        ) : (
          <p className="text-sm font-medium text-foreground truncate">{value}</p>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 rounded hover:bg-muted" title="Editează">
            <Edit3 className="h-3 w-3 text-muted-foreground" />
          </button>
          {isOverridden && (
            <button onClick={onReset} className="p-1 rounded hover:bg-muted" title="Resetează la valoarea detectată">
              <RotateCcw className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, muted = false, highlight = false }: { label: string; value: string; muted?: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-2.5 py-1.5 text-center ${highlight ? 'border-accent/30 bg-accent/5' : ''}`}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="text-foreground text-xs font-medium truncate">{value || '—'}</span>
    </div>
  );
}
