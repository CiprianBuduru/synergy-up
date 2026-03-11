import { useState } from 'react';
import type { Company, CompanyEnrichment, EnrichmentSignal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Building2, Users, MapPin, Globe, ExternalLink, Shield, ShieldCheck, ShieldAlert,
  AlertTriangle, CheckCircle2, Edit3, RotateCcw, Signal, Briefcase, Megaphone,
  Heart, Gift, TrendingUp, Eye, ChevronDown, ChevronUp, Info
} from 'lucide-react';

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
  hiring: 'bg-blue-500/10 text-blue-700 border-blue-200',
  multi_location: 'bg-purple-500/10 text-purple-700 border-purple-200',
  hr_focus: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  marketing_focus: 'bg-orange-500/10 text-orange-700 border-orange-200',
  csr: 'bg-pink-500/10 text-pink-700 border-pink-200',
  corporate_gifting: 'bg-amber-500/10 text-amber-700 border-amber-200',
  large_company: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
};

function getEnrichmentState(enrichment: CompanyEnrichment | null): EnrichmentState {
  if (!enrichment) return 'not_started';
  if (enrichment.enrichment_status === 'verified') return 'confirmed';
  return 'draft_enriched';
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'bg-emerald-500';
  if (confidence >= 0.65) return 'bg-amber-500';
  return 'bg-orange-500';
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'Încredere ridicată';
  if (confidence >= 0.65) return 'Încredere medie';
  return 'Încredere scăzută';
}

export default function CompanyEnrichmentPanel({ company, enrichment, onUpdateEnrichment, compact = false }: Props) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showSignals, setShowSignals] = useState(!compact);
  const [showDetails, setShowDetails] = useState(!compact);

  const state = getEnrichmentState(enrichment);
  const confidence = enrichment?.employee_count_confidence || 0;

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

  const stateConfig = {
    not_started: { icon: AlertTriangle, label: 'Enrichment nepornit', color: 'bg-muted text-muted-foreground border-border', desc: 'Nu există date detectate pentru această companie' },
    draft_enriched: { icon: Eye, label: 'Date detectate — necesită confirmare', color: 'bg-amber-500/10 text-amber-700 border-amber-200', desc: 'Datele au fost colectate automat și necesită verificare' },
    confirmed: { icon: ShieldCheck, label: 'Date verificate', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', desc: 'Datele companiei au fost verificate și confirmate' },
  };

  const currentState = stateConfig[state];
  const StateIcon = currentState.icon;

  // Not started state
  if (state === 'not_started') {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground">Date companie insuficiente</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nu au fost detectate informații suplimentare pentru {company.company_name}.
            </p>
          </div>
          <div className="mt-2 rounded-xl border bg-muted/30 p-4 text-left w-full max-w-md space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Informații disponibile din formular:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Industrie:</span> <span className="text-foreground font-medium">{company.industry}</span></div>
              <div><span className="text-muted-foreground">Dimensiune:</span> <span className="text-foreground font-medium">{company.company_size}</span></div>
              <div><span className="text-muted-foreground">Locație:</span> <span className="text-foreground font-medium">{company.location}</span></div>
              <div><span className="text-muted-foreground">Contact:</span> <span className="text-foreground font-medium">{company.contact_department}</span></div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Poți continua cu datele minime sau adăuga manual informații suplimentare.</p>
        </CardContent>
      </Card>
    );
  }

  const empExact = enrichment?.employee_count_exact;
  const empMin = enrichment?.employee_count_min;
  const empMax = enrichment?.employee_count_max;
  const empEstimate = enrichment?.employee_count_estimate;

  return (
    <Card className="overflow-hidden border shadow-sm">
      {/* Header with state indicator */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-base">Date detectate</CardTitle>
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${currentState.color}`}>
            <StateIcon className="h-3.5 w-3.5" />
            {currentState.label}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{currentState.desc}</p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Confidence Score */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Scor de încredere date</span>
            </div>
            <span className={`text-sm font-bold ${confidence >= 0.85 ? 'text-emerald-600' : confidence >= 0.65 ? 'text-amber-600' : 'text-orange-600'}`}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getConfidenceColor(confidence)}`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{getConfidenceLabel(confidence)}</p>
        </div>

        {/* Main data fields */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <EnrichmentField
              icon={Building2}
              label="Denumire legală"
              value={getDisplayValue('legal_name', enrichment?.legal_name || null)}
              isOverridden={isOverridden('legal_name')}
              isEditing={editingField === 'legal_name'}
              status={enrichment?.enrichment_status || 'needs_confirmation'}
              onEdit={() => setEditingField('legal_name')}
              onSave={(v) => handleOverride('legal_name', v)}
              onReset={() => handleResetOverride('legal_name')}
              onCancel={() => setEditingField(null)}
            />
            <EnrichmentField
              icon={Globe}
              label="Website"
              value={getDisplayValue('website', enrichment?.website || null)}
              isOverridden={isOverridden('website')}
              isEditing={editingField === 'website'}
              status={enrichment?.enrichment_status || 'needs_confirmation'}
              onEdit={() => setEditingField('website')}
              onSave={(v) => handleOverride('website', v)}
              onReset={() => handleResetOverride('website')}
              onCancel={() => setEditingField(null)}
              isLink
            />
            <EnrichmentField
              icon={Briefcase}
              label="Industrie"
              value={getDisplayValue('industry_label', enrichment?.industry_label || null)}
              isOverridden={isOverridden('industry_label')}
              isEditing={editingField === 'industry_label'}
              status={enrichment?.enrichment_status || 'needs_confirmation'}
              onEdit={() => setEditingField('industry_label')}
              onSave={(v) => handleOverride('industry_label', v)}
              onReset={() => handleResetOverride('industry_label')}
              onCancel={() => setEditingField(null)}
            />
            <EnrichmentField
              icon={MapPin}
              label="Sediu central"
              value={getDisplayValue('headquarters', enrichment?.headquarters || null)}
              isOverridden={isOverridden('headquarters')}
              isEditing={editingField === 'headquarters'}
              status={enrichment?.enrichment_status || 'needs_confirmation'}
              onEdit={() => setEditingField('headquarters')}
              onSave={(v) => handleOverride('headquarters', v)}
              onReset={() => handleResetOverride('headquarters')}
              onCancel={() => setEditingField(null)}
            />
          </div>

          {/* Employee count section */}
          <button
            onClick={() => setShowDetails(prev => !prev)}
            className="flex w-full items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Angajați</span>
              <span className="text-sm font-bold text-foreground">{empEstimate || '—'}</span>
              {empExact ? (
                <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">exact</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">estimat</Badge>
              )}
            </div>
            {showDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showDetails && (
            <div className="ml-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniStat label="Exact" value={empExact?.toString() || '—'} muted={!empExact} />
              <MiniStat label="Minim" value={empMin?.toString() || '—'} muted={!empMin} />
              <MiniStat label="Maxim" value={empMax?.toString() || '—'} muted={!empMax} />
              <MiniStat label="Estimare" value={empEstimate?.toString() || '—'} highlight />
            </div>
          )}

          {/* Public Summary */}
          {enrichment?.public_summary && (
            <div className="rounded-lg border bg-muted/10 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Descriere publică</p>
              <p className="text-sm text-foreground leading-relaxed">{enrichment.public_summary}</p>
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

        {/* Signals */}
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {enrichment.signals_json.map((signal, i) => {
                  const SigIcon = signalIcons[signal.type] || Signal;
                  const colors = signalColors[signal.type] || 'bg-muted text-foreground border-border';
                  return (
                    <div key={i} className={`flex items-center gap-2.5 rounded-lg border p-2.5 ${colors}`}>
                      <SigIcon className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{signal.label}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-background/50 text-[10px] font-bold">
                            {Math.round(signal.confidence * 100)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
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

        {/* Sources */}
        {enrichment?.sources_json && enrichment.sources_json.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Surse:</span>
            {enrichment.sources_json.map((src, i) => (
              <Badge key={i} variant="outline" className="text-[10px] gap-1">
                <ExternalLink className="h-2.5 w-2.5" />
                {src}
              </Badge>
            ))}
          </div>
        )}

        {/* Override summary */}
        {Object.keys(overrides).length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
            <Edit3 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-800">{Object.keys(overrides).length} câmp(uri) modificate manual</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Aceste valori vor suprascrie datele detectate automat.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Sub-components

interface EnrichmentFieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  isOverridden: boolean;
  isEditing: boolean;
  status: 'verified' | 'estimated' | 'needs_confirmation';
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
        <Label className="text-[10px] text-accent-foreground">{label}</Label>
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
    <div className={`group relative rounded-lg border p-2 transition-colors hover:bg-muted/30 ${isOverridden ? 'border-amber-200 bg-amber-50/50' : 'border-transparent'}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {isOverridden && (
          <Tooltip>
            <TooltipTrigger>
              <Badge className="h-4 text-[8px] px-1 bg-amber-500 text-white border-0">manual</Badge>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Valoare modificată manual</TooltipContent>
          </Tooltip>
        )}
        {!isOverridden && status === 'estimated' && (
          <div className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Estimat" />
        )}
        {!isOverridden && status === 'verified' && (
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Verificat" />
        )}
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
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
