// ─── Official Company Data Panel ───────────────────────────
// Displays official/verified company data, clearly separated from commercial data.

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, CloudOff, Eye, Building, Landmark, Users, BarChart3 } from 'lucide-react';
import {
  buildOfficialProfile,
  getOfficialBadge,
  BADGE_CONFIG,
  OFFICIAL_FIELDS,
  EMPLOYEES_METRIC_LABEL,
  type OfficialCompanyProfile,
  type OfficialBadgeType,
} from '@/services/officialCompanyDataService';
import type { Company, CompanyEnrichment } from '@/types';

interface Props {
  company: Company;
  enrichment: CompanyEnrichment | null;
}

const BADGE_ICONS: Record<OfficialBadgeType, React.ReactNode> = {
  'Official': <ShieldCheck className="h-3 w-3" />,
  'Verified source': <ShieldCheck className="h-3 w-3" />,
  'Estimated': <Eye className="h-3 w-3" />,
  'Demo data': <CloudOff className="h-3 w-3" />,
};

const GROUP_CONFIG = {
  identity: { label: 'Identitate juridică', icon: <Building className="h-4 w-4 text-primary" /> },
  classification: { label: 'Clasificare CAEN', icon: <Landmark className="h-4 w-4 text-primary" /> },
  financial: { label: 'Date financiare', icon: <BarChart3 className="h-4 w-4 text-primary" /> },
  employees: { label: 'Angajați', icon: <Users className="h-4 w-4 text-primary" /> },
} as const;

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    if (key === 'turnover' || key === 'profit') {
      return `${value.toLocaleString('ro-RO')} RON`;
    }
    return value.toLocaleString('ro-RO');
  }
  return String(value);
}

export default function OfficialCompanyDataPanel({ company, enrichment }: Props) {
  const profile = useMemo(
    () => buildOfficialProfile(company, enrichment),
    [company, enrichment],
  );

  const badgeType = getOfficialBadge(profile);
  const badgeCfg = BADGE_CONFIG[badgeType];

  const groups = ['identity', 'classification', 'financial', 'employees'] as const;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Official Company Data
          </CardTitle>
          <Badge variant="outline" className={`text-[10px] gap-1 ${badgeCfg.color}`}>
            {BADGE_ICONS[badgeType]}
            {badgeType}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Date oficiale din surse publice. Separate de datele comerciale și estimările interne.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {groups.map((group, gi) => {
          const groupFields = OFFICIAL_FIELDS.filter(f => f.group === group);
          const cfg = GROUP_CONFIG[group];
          return (
            <div key={group}>
              {gi > 0 && <Separator className="mb-4" />}
              <div className="flex items-center gap-2 mb-3">
                {cfg.icon}
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cfg.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {groupFields.map(field => {
                  const val = profile[field.key];
                  return (
                    <div key={field.key} className="space-y-0.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{field.label}</p>
                      <p className={`text-sm font-medium ${val === null || val === '' ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                        {formatValue(field.key, val)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Source footer */}
        <Separator />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            Sursă: <span className="font-medium">{profile.source_name}</span>
            {profile.source_url && (
              <> • <a href={profile.source_url} target="_blank" rel="noopener noreferrer" className="underline">link</a></>
            )}
          </span>
          <span>
            Verificat: {new Date(profile.verified_at).toLocaleDateString('ro-RO')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
