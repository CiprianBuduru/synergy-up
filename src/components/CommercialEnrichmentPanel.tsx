import { useState, useMemo } from 'react';
import type { Company, CompanyEnrichment } from '@/types';
import type { CommercialEnrichmentData, SourceBadgeType } from '@/types/verified-company';
import { buildCommercialEnrichment, applyCommercialOverride, removeCommercialOverride, getCommercialBadgeType } from '@/services/commercialEnrichmentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp, Globe, Briefcase, Megaphone, Heart, Gift, Building2, MapPin,
  ShieldCheck, ShieldAlert, AlertTriangle, Edit3, RotateCcw, Eye, CloudOff, CheckCircle2,
} from 'lucide-react';

const BADGE_CONFIG: Record<SourceBadgeType, { icon: React.ElementType; className: string }> = {
  'Official': { icon: ShieldCheck, className: 'border-primary/30 text-primary bg-primary/5' },
  'Verified': { icon: ShieldCheck, className: 'border-success/30 text-success bg-success/5' },
  'Verified source': { icon: ShieldCheck, className: 'border-success/30 text-success bg-success/5' },
  'Estimated': { icon: Eye, className: 'border-warning/30 text-warning bg-warning/5' },
  'Needs confirmation': { icon: ShieldAlert, className: 'border-destructive/30 text-destructive bg-destructive/5' },
  'Manual override': { icon: Edit3, className: 'border-accent/30 text-accent bg-accent/5' },
  'Demo data': { icon: CloudOff, className: 'border-warning/30 text-warning bg-warning/5' },
};

interface Props {
  company: Company;
  enrichment: CompanyEnrichment | null;
  isDemo?: boolean;
}

const RELEVANCE_FIELDS: { key: keyof CommercialEnrichmentData; label: string; icon: React.ElementType }[] = [
  { key: 'hr_relevance', label: 'HR / Employer Branding', icon: Briefcase },
  { key: 'marketing_relevance', label: 'Marketing / Evenimente', icon: Megaphone },
  { key: 'gifting_relevance', label: 'Cadouri Corporate', icon: Gift },
  { key: 'csr_relevance', label: 'CSR / Social', icon: Heart },
  { key: 'internal_branding_relevance', label: 'Internal Branding', icon: Building2 },
];

export default function CommercialEnrichmentPanel({ company, enrichment, isDemo = false }: Props) {
  const [data, setData] = useState<CommercialEnrichmentData>(() =>
    buildCommercialEnrichment(company, enrichment, isDemo)
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const badgeType = useMemo(() => getCommercialBadgeType(data), [data]);
  const badgeConfig = BADGE_CONFIG[badgeType];
  const BadgeIcon = badgeConfig.icon;
  const hasOverrides = Object.keys(data.overrides).length > 0;

  const handleStartEdit = (field: string, currentValue: string | number | boolean | null) => {
    setEditingField(field);
    setEditValue(currentValue?.toString() || '');
  };

  const handleSaveEdit = (field: string) => {
    setData(prev => applyCommercialOverride(prev, field, editValue));
    setEditingField(null);
  };

  const handleResetOverride = (field: string) => {
    setData(prev => removeCommercialOverride(prev, field));
  };

  const isOverridden = (field: string) => field in data.overrides;

  const EditableField = ({ fieldKey, label, value }: { fieldKey: string; label: string; value: string }) => {
    const overridden = isOverridden(fieldKey);
    const isEditing = editingField === fieldKey;

    return (
      <div className={`rounded-lg border p-2.5 space-y-1 ${overridden ? 'border-accent/30 bg-accent/5' : 'border-border'}`}>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-muted-foreground">{label}</Label>
          <div className="flex items-center gap-1">
            {overridden && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-[8px] h-4 px-1 border-accent/30 text-accent bg-accent/5 gap-0.5">
                    <Edit3 className="h-2.5 w-2.5" />
                    Manual override
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Original: {data.overrides[fieldKey]?.original?.toString() || '—'}
                </TooltipContent>
              </Tooltip>
            )}
            {overridden && (
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleResetOverride(fieldKey)}>
                <RotateCcw className="h-2.5 w-2.5" />
              </Button>
            )}
            {!isEditing && (
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleStartEdit(fieldKey, value)}>
                <Edit3 className="h-2.5 w-2.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
        {isEditing ? (
          <div className="flex gap-1">
            <Input
              className="h-7 text-sm"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveEdit(fieldKey)}
              autoFocus
            />
            <Button size="sm" className="h-7 px-2" onClick={() => handleSaveEdit(fieldKey)}>
              <CheckCircle2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-foreground">{value || '—'}</p>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="h-4 w-4 text-accent" />
            <CardTitle className="font-display text-base truncate">Commercial Enrichment</CardTitle>
            <Badge variant="outline" className={`gap-1 text-[10px] shrink-0 ${badgeConfig.className}`}>
              <BadgeIcon className="h-3 w-3" />
              {badgeType}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Date comerciale și semnale estimate • Încredere: {Math.round(data.confidence_level * 100)}%
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* General fields */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <EditableField fieldKey="website" label="Website" value={data.website} />
          <EditableField fieldKey="linkedin_url" label="LinkedIn" value={data.linkedin_url} />
          <EditableField fieldKey="industry_commercial" label="Industrie comercială" value={data.industry_commercial} />
          <EditableField fieldKey="company_description" label="Descriere" value={data.company_description} />
        </div>

        {/* Signals */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semnale detectate</p>
          <div className="flex flex-wrap gap-2">
            {data.recruiting_signal && (
              <Badge variant="outline" className="gap-1 text-[10px] border-info/30 text-info bg-info/5">
                <TrendingUp className="h-3 w-3" /> Recrutare activă
              </Badge>
            )}
            {data.multi_location_signal && (
              <Badge variant="outline" className="gap-1 text-[10px] border-accent/30 text-accent bg-accent/5">
                <MapPin className="h-3 w-3" /> Multi-locație
              </Badge>
            )}
            {!data.recruiting_signal && !data.multi_location_signal && (
              <span className="text-xs text-muted-foreground">Niciun semnal detectat</span>
            )}
          </div>
        </div>

        {/* Relevance scores */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scoruri de relevanță</p>
          <div className="space-y-2">
            {RELEVANCE_FIELDS.map(({ key, label, icon: Icon }) => {
              const value = (data as any)[key] as number;
              return (
                <div key={key} className="flex items-center gap-3">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
                  <Progress value={value} className="h-2 flex-1" />
                  <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{Math.round(value)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Override count */}
        {hasOverrides && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 p-2">
            <Edit3 className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs text-accent">
              {Object.keys(data.overrides).length} câmp(uri) modificate manual
            </span>
          </div>
        )}

        {/* Source info */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Sursă: {data.source_name}</span>
        </div>
      </CardContent>
    </Card>
  );
}
