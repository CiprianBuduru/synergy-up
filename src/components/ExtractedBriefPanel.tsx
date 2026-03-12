import { Building2, User, Mail, Phone, MapPin, Tag, FileText, AlertCircle, CheckCircle2, XCircle, Package, Layers, Lightbulb, MessageSquare } from 'lucide-react';
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

interface Props {
  parsed: ParsedEmailBrief;
  onUseBrief: () => void;
}

function FlagBadge({ active, label }: { active: boolean; label: string }) {
  if (!active) return null;
  return (
    <Badge variant="outline" className="text-[10px] gap-1 border-emerald-300 bg-emerald-50 text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> {label}
    </Badge>
  );
}

export default function ExtractedBriefPanel({ parsed, onUseBrief }: Props) {
  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Request details */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Cerere
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {parsed.requested_items.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Produse detectate</p>
              <div className="flex flex-wrap gap-1">
                {parsed.requested_items.map(item => (
                  <Badge key={item} variant="outline" className="text-xs">{item}</Badge>
                ))}
              </div>
            </div>
          )}
          {parsed.requested_non_product_requests.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Cereri non-produs</p>
              <div className="flex flex-wrap gap-1">
                {parsed.requested_non_product_requests.map(item => (
                  <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>
                ))}
              </div>
            </div>
          )}
          {parsed.requested_documents.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Documente solicitate</p>
              <div className="flex flex-wrap gap-1">
                {parsed.requested_documents.map(doc => (
                  <Badge key={doc} className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    <FileText className="h-3 w-3 mr-1" /> {DOCUMENT_LABELS[doc]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
            {!parsed.asks_for_price && !parsed.asks_for_presentation && !parsed.asks_for_product_list && !parsed.mentions_unitate_protejata && (
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

      {/* Rules engine results */}
      {parsed.recommended_kits.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Recomandări din Brief Rules Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {parsed.recommended_products.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Produse</p>
                <p className="text-xs text-foreground">{parsed.recommended_products.join(', ')}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Kituri</p>
              <div className="flex flex-wrap gap-1">
                {parsed.recommended_kits.map(k => (
                  <Badge key={k} className="text-xs bg-blue-50 text-blue-700 border-blue-200">{k}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
