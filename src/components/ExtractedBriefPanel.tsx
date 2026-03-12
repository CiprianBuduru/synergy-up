import { Building2, User, Mail, Phone, MapPin, Tag, FileText, AlertCircle, CheckCircle2, XCircle, Package, Layers, Lightbulb, MessageSquare, ArrowRight, Target, Crosshair, Search, ArrowRightLeft, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ParsedEmailBrief } from '@/services/emailBriefParserService';
import {
  REQUEST_TYPE_LABELS,
  DOCUMENT_LABELS,
  PRESENTATION_TYPE_LABELS,
  EMAIL_RESPONSE_TYPE_LABELS,
} from '@/services/emailBriefParserService';
import type { RuleMatchType } from '@/types/brief-rule';

interface Props {
  parsed: ParsedEmailBrief;
  onUseBrief: () => void;
}

const MATCH_TYPE_CONFIG: Record<RuleMatchType, { label: string; icon: typeof Target; className: string }> = {
  exact_match: { label: 'Exact', icon: Target, className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  synonym_match: { label: 'Sinonim', icon: Crosshair, className: 'bg-blue-100 text-blue-700 border-blue-300' },
  fallback_match: { label: 'Fallback', icon: Search, className: 'bg-orange-100 text-orange-700 border-orange-300' },
};

const ELIGIBILITY_BADGE: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  direct: { label: 'Eligibil direct', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  via_operation: { label: 'Eligibil prin operațiune', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: ArrowRightLeft },
  convertible: { label: 'Convertibil', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
};

function FlagBadge({ active, label }: { active: boolean; label: string }) {
  if (!active) return null;
  return (
    <Badge variant="outline" className="text-[10px] gap-1 border-emerald-300 bg-emerald-50 text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> {label}
    </Badge>
  );
}

export default function ExtractedBriefPanel({ parsed, onUseBrief }: Props) {
  const hasRulesMatches = parsed.brief_rules_matches.length > 0;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Sumar email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">{parsed.short_response_summary}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge className="text-xs">{REQUEST_TYPE_LABELS[parsed.primary_request_type]}</Badge>
            {parsed.secondary_request_types.map(t => (
              <Badge key={t} variant="secondary" className="text-xs">{REQUEST_TYPE_LABELS[t]}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Company */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Companie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            <InfoRow label="Nume" value={parsed.company_name} />
            <InfoRow label="Industrie" value={parsed.industry_hint} />
            <InfoRow label="Locație" value={parsed.location_hint} icon={<MapPin className="h-3 w-3" />} />
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            <InfoRow label="Nume" value={parsed.contact_name} />
            <InfoRow label="Funcție" value={parsed.contact_role} />
            <InfoRow label="Email" value={parsed.contact_email} icon={<Mail className="h-3 w-3" />} />
            <InfoRow label="Telefon" value={parsed.contact_phone} icon={<Phone className="h-3 w-3" />} />
          </CardContent>
        </Card>
      </div>

      {/* Requested Items — clear section */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Cerere detectată
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {parsed.requested_items.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Produse detectate ({parsed.requested_items.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.requested_items.map(item => (
                  <Badge key={item} variant="outline" className="text-xs font-medium">{item}</Badge>
                ))}
              </div>
            </div>
          )}
          {parsed.requested_non_product_requests.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Cereri non-produs</p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.requested_non_product_requests.map(item => (
                  <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>
                ))}
              </div>
            </div>
          )}
          {parsed.requested_documents.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Documente solicitate</p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.requested_documents.map(doc => (
                  <Badge key={doc} className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    <FileText className="h-3 w-3 mr-1" /> {DOCUMENT_LABELS[doc]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {parsed.requested_items.length === 0 && parsed.requested_non_product_requests.length === 0 && parsed.requested_documents.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Niciun produs sau cerere specifică detectată</p>
          )}
        </CardContent>
      </Card>

      {/* Brief Rules Engine matches — detailed verdicts */}
      {hasRulesMatches && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Analiză eligibilitate ({parsed.brief_rules_matches.length} reguli)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {parsed.brief_rules_matches.map((m, i) => {
              const eligCfg = ELIGIBILITY_BADGE[m.rule.eligibility_type] || ELIGIBILITY_BADGE.via_operation;
              const EligIcon = eligCfg.icon;
              const matchCfg = MATCH_TYPE_CONFIG[m.rule_type] || MATCH_TYPE_CONFIG.fallback_match;
              const MatchIcon = matchCfg.icon;

              return (
                <div key={i} className={`rounded-lg border p-3 space-y-2 ${eligCfg.className}`}>
                  {/* Row 1: Item + verdict */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <EligIcon className="h-4 w-4 shrink-0" />
                    <span className="font-semibold text-sm text-foreground">{m.rule.requested_item}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${eligCfg.className}`}>{eligCfg.label}</Badge>
                  </div>

                  {/* Row 2: Match metadata */}
                  <div className="pl-6 flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${matchCfg.className}`}>
                      <MatchIcon className="h-3 w-3" />
                      {matchCfg.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      Confidence: <strong className="text-foreground">{Math.round(m.confidence * 100)}%</strong>
                    </span>
                    {m.matched_keyword && (
                      <span className="text-[10px] text-muted-foreground">
                        Matched: <code className="bg-background/50 px-1 rounded text-foreground">{m.matched_keyword}</code>
                      </span>
                    )}
                  </div>

                  {/* Row 3: Eligible result */}
                  {!m.rule.direct_eligible && (
                    <div className="pl-6 space-y-1">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Operațiuni: </span>
                        <span className="font-medium text-foreground">{m.rule.eligible_via_operation.join(', ')}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Produs eligibil rezultat: </span>
                        <span className="font-medium text-foreground">{m.rule.eligible_result.join(', ')}</span>
                      </div>
                    </div>
                  )}
                  {m.rule.direct_eligible && m.rule.eligible_result.length > 0 && (
                    <div className="pl-6 text-xs">
                      <span className="text-muted-foreground">Rezultat: </span>
                      <span className="font-medium text-foreground">{m.rule.eligible_result.join(', ')}</span>
                    </div>
                  )}

                  {/* Row 4: Recommended products & kits */}
                  {m.rule.recommended_products.length > 0 && (
                    <div className="pl-6 text-xs">
                      <span className="text-muted-foreground">Produse recomandate: </span>
                      <span className="text-foreground">{m.rule.recommended_products.join(', ')}</span>
                    </div>
                  )}
                  {m.rule.recommended_kits.length > 0 && (
                    <div className="pl-6 flex items-center gap-1.5 text-xs flex-wrap">
                      <span className="text-muted-foreground shrink-0">Kituri:</span>
                      {m.rule.recommended_kits.map(k => (
                        <Badge key={k} className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">{k}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Row 5: CAEN */}
                  {m.rule.supporting_caen_codes.length > 0 && (
                    <div className="pl-6 text-[10px] text-muted-foreground">
                      CAEN: {m.rule.supporting_caen_codes.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Aggregated recommendations */}
      {(parsed.recommended_products.length > 0 || parsed.recommended_kits.length > 0) && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" /> Recomandări agregate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {parsed.recommended_products.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Produse recomandate</p>
                <p className="text-xs text-foreground">{parsed.recommended_products.join(', ')}</p>
              </div>
            )}
            {parsed.recommended_kits.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Kituri recomandate</p>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.recommended_kits.map(k => (
                    <Badge key={k} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">{k}</Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-1.5">
                  Din perspectiva eligibilității, kiturile reprezintă una dintre cele mai avantajoase forme de achiziție.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Flags */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" /> Flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            <FlagBadge active={parsed.asks_for_price} label="Cere preț" />
            <FlagBadge active={parsed.asks_for_presentation} label="Cere prezentare" />
            <FlagBadge active={parsed.asks_for_product_list} label="Cere listă produse" />
            <FlagBadge active={parsed.asks_for_delivery_terms} label="Cere termen livrare" />
            <FlagBadge active={parsed.asks_for_minimum_order} label="Cere comandă minimă" />
            <FlagBadge active={parsed.mentions_unitate_protejata} label="Menționează UP" />
            <FlagBadge active={parsed.mentions_fond_handicap} label="Menționează fond handicap" />
            {!parsed.asks_for_price && !parsed.asks_for_presentation && !parsed.asks_for_product_list && !parsed.asks_for_delivery_terms && !parsed.asks_for_minimum_order && !parsed.mentions_unitate_protejata && !parsed.mentions_fond_handicap && (
              <span className="text-xs text-muted-foreground italic">Niciun flag specific detectat</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Response suggestions */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" /> Sugestii răspuns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tip prezentare sugerată</span>
            <Badge variant="outline" className="text-xs">{PRESENTATION_TYPE_LABELS[parsed.suggested_presentation_type]}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tip email răspuns</span>
            <Badge variant="outline" className="text-xs">{EMAIL_RESPONSE_TYPE_LABELS[parsed.suggested_email_response_type]}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Button onClick={onUseBrief} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-md shadow-accent/20" size="lg">
        <FileText className="mr-2 h-4 w-4" /> Folosește ca Brief → Analiză completă
      </Button>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-1">{icon}{label}</span>
      {value ? (
        <span className="font-medium text-foreground">{value}</span>
      ) : (
        <span className="text-muted-foreground/50 italic">nedetectat</span>
      )}
    </div>
  );
}
