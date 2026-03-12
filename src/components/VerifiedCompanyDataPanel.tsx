import { useState, useMemo } from 'react';
import type { Company, CompanyEnrichment } from '@/types';
import type { VerifiedCompanyData, SourceBadgeType } from '@/types/verified-company';
import { buildVerifiedCompanyData, applyOverride, removeOverride, isFieldOverridden, getVerifiedBadgeType, EMPLOYEES_METRIC_LABEL } from '@/services/verifiedCompanyDataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, ShieldAlert, AlertTriangle, Edit3, RotateCcw, Building2, CloudOff, Eye, CheckCircle2 } from 'lucide-react';

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

const FIELDS: { key: keyof VerifiedCompanyData; label: string; editable?: boolean }[] = [
  { key: 'legal_name', label: 'Denumire legală', editable: true },
  { key: 'cui', label: 'CUI', editable: true },
  { key: 'vat_status', label: 'Status TVA' },
  { key: 'registration_status', label: 'Status înregistrare' },
  { key: 'county', label: 'Județ', editable: true },
  { key: 'official_address', label: 'Adresă oficială', editable: true },
  { key: 'official_caen_code', label: 'Cod CAEN oficial' },
  { key: 'official_caen_label', label: 'Descriere CAEN' },
  { key: 'official_financial_year', label: 'An financiar' },
  { key: 'turnover', label: 'Cifră de afaceri (RON)', editable: true },
  { key: 'profit', label: 'Profit (RON)', editable: true },
  { key: 'number_of_employees_official', label: 'Număr mediu salariați din bilanț', editable: true },
];

export default function VerifiedCompanyDataPanel({ company, enrichment, isDemo = false }: Props) {
  const [verifiedData, setVerifiedData] = useState<VerifiedCompanyData>(() =>
    buildVerifiedCompanyData(company, enrichment, isDemo)
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const badgeType = useMemo(() => getVerifiedBadgeType(verifiedData), [verifiedData]);
  const badgeConfig = BADGE_CONFIG[badgeType];
  const BadgeIcon = badgeConfig.icon;
  const hasOverrides = Object.keys(verifiedData.overrides).length > 0;

  const handleStartEdit = (field: string, currentValue: string | number | null) => {
    setEditingField(field);
    setEditValue(currentValue?.toString() || '');
  };

  const handleSaveEdit = (field: string) => {
    const numericFields = ['turnover', 'profit', 'number_of_employees_official'];
    const value = numericFields.includes(field) ? (parseInt(editValue) || null) : editValue;
    setVerifiedData(prev => applyOverride(prev, field, value));
    setEditingField(null);
  };

  const handleResetOverride = (field: string) => {
    setVerifiedData(prev => removeOverride(prev, field));
  };

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="font-display text-base truncate">Verified Company Data</CardTitle>
            <Badge variant="outline" className={`gap-1 text-[10px] shrink-0 ${badgeConfig.className}`}>
              <BadgeIcon className="h-3 w-3" />
              {badgeType}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Date oficiale din surse verificate • {verifiedData.source_name}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Source info */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Sursă: {verifiedData.source_name}</span>
          {verifiedData.verified_at && (
            <span>• Verificat: {new Date(verifiedData.verified_at).toLocaleDateString('ro-RO')}</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FIELDS.map(({ key, label, editable }) => {
            const value = (verifiedData as any)[key];
            const overridden = isFieldOverridden(verifiedData, key);
            const displayValue = value?.toString() || '—';
            const isEditing = editingField === key;

            return (
              <div key={key} className={`rounded-lg border p-2.5 space-y-1 ${overridden ? 'border-accent/30 bg-accent/5' : 'border-border'}`}>
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
                          Original: {verifiedData.overrides[key]?.original?.toString() || '—'}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {overridden && (
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleResetOverride(key)}>
                        <RotateCcw className="h-2.5 w-2.5" />
                      </Button>
                    )}
                    {editable && !isEditing && (
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleStartEdit(key, value)}>
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
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit(key)}
                      autoFocus
                    />
                    <Button size="sm" className="h-7 px-2" onClick={() => handleSaveEdit(key)}>
                      <CheckCircle2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-foreground">{displayValue}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Override count */}
        {hasOverrides && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 p-2">
            <Edit3 className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs text-accent">
              {Object.keys(verifiedData.overrides).length} câmp(uri) modificate manual
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
