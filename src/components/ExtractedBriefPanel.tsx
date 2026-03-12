import { useState } from 'react';
import {
  Building2, User, Mail, Phone, MapPin, FileText, AlertCircle, CheckCircle2,
  XCircle, Package, Layers, Lightbulb, MessageSquare, ArrowRight, Target,
  Crosshair, Search, ArrowRightLeft, ShoppingBag, ArrowDown, RefreshCw,
  Pencil, Globe, Tag, Receipt, Truck, ShoppingCart, Shield, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  onReparse?: () => void;
}

const MATCH_TYPE_CONFIG: Record<RuleMatchType, { label: string; icon: typeof Target; className: string }> = {
  exact_match: { label: 'Exact Match', icon: Target, className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  synonym_match: { label: 'Synonym Match', icon: Crosshair, className: 'bg-blue-100 text-blue-700 border-blue-300' },
  fallback_match: { label: 'Fallback Match', icon: Search, className: 'bg-orange-100 text-orange-700 border-orange-300' },
};

const VERDICT_LABELS: Record<string, { label: string; description: string; className: string; icon: typeof CheckCircle2 }> = {
  direct: {
    label: 'Eligibil direct',
    description: 'Produsul poate fi achiziționat direct prin unitatea protejată.',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  via_operation: {
    label: 'Neeligibil direct, dar eligibil prin operațiune',
    description: 'Produsul devine eligibil prin aplicarea unei operațiuni interne autorizate.',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ArrowRightLeft,
  },
  convertible: {
    label: 'Neeligibil direct, dar convertibil în soluție eligibilă',
    description: 'Produsul nu este eligibil, dar poate fi înlocuit cu o alternativă eligibilă.',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
};

function FlagItem({ active, label, icon: Icon }: { active: boolean; label: string; icon: typeof CheckCircle2 }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {active ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
      )}
      <span className={active ? 'text-foreground font-medium' : 'text-muted-foreground/50'}>{label}</span>
    </div>
  );
}

export default function ExtractedBriefPanel({ parsed, onUseBrief, onReparse }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const hasRulesMatches = parsed.brief_rules_matches.length > 0;

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Extracted Brief
        </h3>
        <div className="flex items-center gap-1.5">
          {onReparse && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={onReparse}>
              <RefreshCw className="h-3 w-3" /> Re-parse
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => setIsEditing(!isEditing)}>
            <Pencil className="h-3 w-3" /> {isEditing ? 'Închide editare' : 'Editează'}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card className="border-border/60">
        <CardContent className="pt-4 pb-3">
          <p className="text-sm text-foreground leading-relaxed">{parsed.short_response_summary}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge className="text-xs">{REQUEST_TYPE_LABELS[parsed.primary_request_type]}</Badge>
            {parsed.secondary_request_types.map(t => (
              <Badge key={t} variant="secondary" className="text-xs">{REQUEST_TYPE_LABELS[t]}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company & Contact — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Company */}
        <Card className="border-border/60">
          <CardHeader className="pb-1.5 pt-3 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Companie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-4 pb-3 text-xs">
            <InfoRow label="Nume companie" value={parsed.company_name} editable={isEditing} />
            <InfoRow label="Industrie" value={parsed.industry_hint} icon={<Tag className="h-3 w-3" />} editable={isEditing} />
            <InfoRow label="Locație" value={parsed.location_hint} icon={<MapPin className="h-3 w-3" />} editable={isEditing} />
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-border/60">
          <CardHeader className="pb-1.5 pt-3 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-4 pb-3 text-xs">
            <InfoRow label="Nume contact" value={parsed.contact_name} editable={isEditing} />
            <InfoRow label="Funcție" value={parsed.contact_role} editable={isEditing} />
            <InfoRow label="Email" value={parsed.contact_email} icon={<Mail className="h-3 w-3" />} editable={isEditing} />
            <InfoRow label="Telefon" value={parsed.contact_phone} icon={<Phone className="h-3 w-3" />} editable={isEditing} />
          </CardContent>
        </Card>
      </div>

      {/* REQUEST section — 3 clear sub-sections */}
      <Card className="border-border/60">
        <CardHeader className="pb-1.5 pt-3 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" /> Cerere detectată
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          {/* Requested Items (products) */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" /> Requested Items — Produse ({parsed.requested_items.length})
            </p>
            {parsed.requested_items.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {parsed.requested_items.map(item => (
                  <Badge key={item} variant="outline" className="text-xs font-medium">{item}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">Niciun produs detectat</p>
            )}
          </div>

          {/* Non-product requests */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold flex items-center gap-1">
              <FileText className="h-3 w-3" /> Non-product Requests ({parsed.requested_non_product_requests.length})
            </p>
            {parsed.requested_non_product_requests.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {parsed.requested_non_product_requests.map(item => (
                  <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">Niciuna</p>
            )}
          </div>

          {/* Requested documents */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold flex items-center gap-1">
              <Shield className="h-3 w-3" /> Requested Documents ({parsed.requested_documents.length})
            </p>
            {parsed.requested_documents.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {parsed.requested_documents.map(doc => (
                  <Badge key={doc} className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    <FileText className="h-3 w-3 mr-1" /> {DOCUMENT_LABELS[doc]}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">Niciun document solicitat</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commercial Asks */}
      <Card className="border-border/60">
        <CardHeader className="pb-1.5 pt-3 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5" /> Commercial Asks
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-y-1.5">
            <FlagItem active={parsed.asks_for_price} label="Cere preț / ofertă" icon={Receipt} />
            <FlagItem active={parsed.asks_for_presentation} label="Cere prezentare" icon={FileText} />
            <FlagItem active={parsed.asks_for_product_list} label="Cere listă produse" icon={Package} />
            <FlagItem active={parsed.asks_for_delivery_terms} label="Cere termen livrare" icon={Truck} />
            <FlagItem active={parsed.asks_for_minimum_order} label="Cere comandă minimă" icon={ShoppingCart} />
          </div>
        </CardContent>
      </Card>

      {/* Legal / UP Flags */}
      <Card className="border-border/60">
        <CardHeader className="pb-1.5 pt-3 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Legal / UP Flags
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-y-1.5">
            <FlagItem active={parsed.mentions_unitate_protejata} label="Menționează Unitate Protejată" icon={Shield} />
            <FlagItem active={parsed.mentions_fond_handicap} label="Menționează Fond Handicap" icon={Heart} />
          </div>
        </CardContent>
      </Card>

      {/* Brief Rules Engine matches — detailed verdicts */}
      {hasRulesMatches && (
        <Card className="border-border/60">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Analiză eligibilitate — {parsed.brief_rules_matches.length} {parsed.brief_rules_matches.length === 1 ? 'regulă' : 'reguli'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            {parsed.brief_rules_matches.map((m, i) => {
              const verdictCfg = VERDICT_LABELS[m.rule.eligibility_type] || VERDICT_LABELS.via_operation;
              const VerdictIcon = verdictCfg.icon;
              const matchCfg = MATCH_TYPE_CONFIG[m.rule_type] || MATCH_TYPE_CONFIG.fallback_match;
              const MatchIcon = matchCfg.icon;

              return (
                <div key={i} className={`rounded-lg border p-3 space-y-2.5 ${verdictCfg.className}`}>
                  {/* Verdict banner */}
                  <div className="flex items-start gap-2">
                    <VerdictIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{verdictCfg.label}</p>
                      <p className="text-[10px] text-muted-foreground">{verdictCfg.description}</p>
                    </div>
                  </div>

                  {/* Labeled fields */}
                  <div className="space-y-1.5 pl-6">
                    <LabeledField label="Requested Item" value={m.rule.requested_item} bold />
                    <LabeledField label="Matched Rule" value={m.rule.requested_item} />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground w-24 shrink-0">Rule Type</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${matchCfg.className}`}>
                        <MatchIcon className="h-3 w-3" />
                        {matchCfg.label}
                      </Badge>
                    </div>
                    <LabeledField label="Confidence" value={`${Math.round(m.confidence * 100)}%`} />
                    {m.matched_keyword && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-24 shrink-0">Matched Keyword</span>
                        <code className="bg-background/50 px-1.5 py-0.5 rounded text-[10px] text-foreground">{m.matched_keyword}</code>
                      </div>
                    )}
                  </div>

                  {/* Transformation flow: Requested → Operation → Result */}
                  {!m.rule.direct_eligible && (
                    <div className="pl-6 rounded-md border border-border/40 bg-background/30 p-2.5 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Requested:</span>
                        <span className="font-medium text-foreground">{m.rule.requested_item}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-5">
                        <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground shrink-0">Eligible via Operation:</span>
                        <div className="flex flex-wrap gap-1">
                          {m.rule.eligible_via_operation.map(op => (
                            <Badge key={op} variant="secondary" className="text-[10px] px-1.5 py-0">{op}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-5">
                        <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground shrink-0">Eligible Result:</span>
                        <span className="font-medium text-foreground">{m.rule.eligible_result.join(', ')}</span>
                      </div>
                    </div>
                  )}
                  {m.rule.direct_eligible && m.rule.eligible_result.length > 0 && (
                    <div className="pl-6 text-xs">
                      <LabeledField label="Eligible Result" value={m.rule.eligible_result.join(', ')} />
                    </div>
                  )}

                  {/* Recommended products & kits */}
                  {m.rule.recommended_products.length > 0 && (
                    <div className="pl-6">
                      <LabeledField label="Recommended Products" value={m.rule.recommended_products.join(', ')} />
                    </div>
                  )}
                  {m.rule.recommended_kits.length > 0 && (
                    <div className="pl-6 flex items-center gap-2 text-xs flex-wrap">
                      <span className="text-[10px] text-muted-foreground w-24 shrink-0">Recommended Kits</span>
                      {m.rule.recommended_kits.map(k => (
                        <Badge key={k} className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">{k}</Badge>
                      ))}
                    </div>
                  )}

                  {/* CAEN */}
                  {m.rule.supporting_caen_codes.length > 0 && (
                    <div className="pl-6">
                      <LabeledField label="Supporting CAEN" value={m.rule.supporting_caen_codes.join(', ')} />
                    </div>
                  )}

                  {/* Pitch line */}
                  <div className="pl-6">
                    <span className="text-[10px] text-muted-foreground">Pitch Line</span>
                    <p className="text-xs text-foreground italic mt-0.5">{m.rule.pitch_line}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Aggregated recommendations */}
      {(parsed.recommended_products.length > 0 || parsed.recommended_kits.length > 0) && (
        <Card className="border-border/60">
          <CardHeader className="pb-1.5 pt-3 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" /> Recomandări agregate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 px-4 pb-4">
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Response suggestions */}
      <Card className="border-border/60">
        <CardHeader className="pb-1.5 pt-3 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> Sugestii răspuns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs px-4 pb-3">
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

      {/* CTA — Use this as Brief */}
      <Button onClick={onUseBrief} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-md shadow-accent/20" size="lg">
        <FileText className="mr-2 h-4 w-4" /> Use this as Brief → Analiză completă
      </Button>
    </div>
  );
}

function InfoRow({ label, value, icon, editable }: { label: string; value: string | null; icon?: React.ReactNode; editable?: boolean }) {
  if (editable) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground flex items-center gap-1 w-24 shrink-0">{icon}{label}</span>
        <Input defaultValue={value || ''} className="h-6 text-xs px-2" />
      </div>
    );
  }
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

function LabeledField({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[10px] text-muted-foreground w-24 shrink-0">{label}</span>
      <span className={`text-foreground ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}
