import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Package, ShoppingBag, Lightbulb, BarChart3, Target } from 'lucide-react';
import { generateKnowledgeInsights, type KnowledgeInsights } from '@/services/knowledgeInsightsService';
import { detectPatterns, type DetectedPattern } from '@/services/clientPatternService';

export default function KnowledgePage() {
  const [insights, setInsights] = useState<KnowledgeInsights | null>(null);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([generateKnowledgeInsights(), detectPatterns()])
      .then(([ins, pats]) => { setInsights(ins); setPatterns(pats); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-accent" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Knowledge Insights</h1>
            <p className="text-sm text-muted-foreground">Analiză bazată pe interacțiunile comerciale anterioare</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-0 shadow-sm animate-pulse"><CardContent className="p-6"><div className="h-16 bg-muted/50 rounded-lg" /></CardContent></Card>
            ))}
          </div>
        ) : !insights ? (
          <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center text-muted-foreground">Nu s-au putut încărca datele.</CardContent></Card>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: BarChart3, label: 'Total interacțiuni', value: insights.total_interactions, color: 'text-primary' },
                { icon: Target, label: 'Câștigate', value: insights.total_won, color: 'text-emerald-600' },
                { icon: TrendingUp, label: 'Pierdute', value: insights.total_lost, color: 'text-red-500' },
                { icon: Lightbulb, label: 'Rată conversie', value: `${insights.overall_conversion}%`, color: 'text-accent' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                        <s.icon className={`h-5 w-5 ${s.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                        <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top Industries */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" /> Industrii performante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.top_industries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nu sunt suficiente date. Marchează oportunități ca Won/Lost pentru a genera insights.</p>
                  ) : (
                    <div className="space-y-3">
                      {insights.top_industries.map(ind => (
                        <div key={ind.industry} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-accent" />
                            <span className="text-sm font-medium text-foreground">{ind.industry}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-accent" style={{ width: `${ind.interest_rate}%` }} />
                            </div>
                            <Badge variant="outline" className="text-xs">{ind.interest_rate}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Kits */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-accent" /> Kituri performante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.top_kits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nu sunt suficiente date. Înregistrează interacțiuni cu kituri recomandate.</p>
                  ) : (
                    <div className="space-y-3">
                      {insights.top_kits.map(kit => (
                        <div key={kit.kit_name} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{kit.kit_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{kit.times_recommended} rec.</span>
                            <Badge variant="outline" className="text-xs">{kit.success_rate}% succes</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-accent" /> Produse performante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.top_products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nu sunt suficiente date.</p>
                  ) : (
                    <div className="space-y-3">
                      {insights.top_products.map(prod => (
                        <div key={prod.product_name} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{prod.product_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{prod.times_recommended} rec.</span>
                            <Badge variant="outline" className="text-xs">{prod.success_rate}% succes</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Pitch Strategies */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-accent" /> Strategii de pitch performante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.top_pitches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nu sunt suficiente date.</p>
                  ) : (
                    <div className="space-y-3">
                      {insights.top_pitches.map(p => (
                        <div key={p.strategy} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{p.strategy}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{p.times_used}×</span>
                            <Badge variant="outline" className="text-xs">{p.conversion_rate}% conv.</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detected Patterns */}
            {patterns.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-accent" /> Tipare detectate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patterns.map(p => (
                      <div key={p.pattern_id} className="rounded-lg border border-accent/10 bg-accent/5 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium text-foreground">{p.description}</p>
                          <Badge variant="outline" className="text-xs shrink-0 ml-2">{Math.round(p.confidence * 100)}% confidence</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.recommended_kits.map(k => (
                            <span key={k} className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent-foreground">{k}</span>
                          ))}
                          {p.recommended_products.map(pr => (
                            <span key={pr} className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">{pr}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
