import type { Product, Kit } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, FileCode, ShieldCheck } from 'lucide-react';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="card-elevated overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-display font-semibold text-foreground">{product.name}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">{product.category}</p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">{product.base_product_type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
        
        <div className="space-y-2 pt-1 border-t">
          <div className="flex items-start gap-2">
            <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <div>
              <p className="text-xs font-medium text-foreground">Operațiuni interne</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {product.internal_operations_json.map((op, i) => (
                  <span key={i} className="inline-block rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent-foreground">{op}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileCode className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
            <div>
              <p className="text-xs font-medium text-foreground">Coduri CAEN suport</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {product.supporting_caen_codes_json.map((code, i) => (
                  <span key={i} className="inline-block rounded bg-info/10 px-1.5 py-0.5 text-xs font-mono text-info">{code}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            <div>
              <p className="text-xs font-medium text-foreground">Eligibilitate</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{product.eligible_logic}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KitCard({ kit }: { kit: Kit }) {
  return (
    <Card className="card-elevated overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-accent to-accent/50" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-display font-semibold text-foreground">{kit.name}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">{kit.category} • {kit.audience}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{kit.purpose}</p>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">Componente</p>
          <div className="flex flex-wrap gap-1">
            {kit.components_json.map((comp, i) => (
              <span key={i} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${comp.customizable ? 'bg-accent/10 text-accent-foreground border border-accent/20' : 'bg-muted text-muted-foreground'}`}>
                {comp.name}
                {comp.customizable && <span className="ml-1 text-accent">✦</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-1 border-t">
          <div className="flex items-start gap-2">
            <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <div>
              <p className="text-xs font-medium text-foreground">Operațiuni interne</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {kit.internal_operations_json.map((op, i) => (
                  <span key={i} className="inline-block rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent-foreground">{op}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileCode className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
            <div>
              <p className="text-xs font-medium text-foreground">Coduri CAEN suport</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {kit.supporting_caen_codes_json.map((code, i) => (
                  <span key={i} className="inline-block rounded bg-info/10 px-1.5 py-0.5 text-xs font-mono text-info">{code}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            <div>
              <p className="text-xs font-medium text-foreground">Eligibilitate</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{kit.eligibility_explanation}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
