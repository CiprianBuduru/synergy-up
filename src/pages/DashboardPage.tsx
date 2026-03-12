import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Plus, Search, Building2, FileText, TrendingUp, Zap, ArrowUpRight, Users, MessageSquare, Mail, Send, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { fetchSalesStats } from '@/services/followUpService';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Ciornă', className: 'bg-muted text-muted-foreground' },
  research_done: { label: 'Research', className: 'bg-info/10 text-info border border-info/20' },
  presentation_generated: { label: 'Generată', className: 'bg-accent/10 text-accent-foreground border border-accent/20' },
  sent: { label: 'Trimisă', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  follow_up: { label: 'Follow-up', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
};

export default function DashboardPage() {
  const { companies, presentations, calculations } = useData();
  const [search, setSearch] = useState('');

  const filtered = companies.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalObligation = calculations.reduce((s, c) => s + c.spendable_half_estimated, 0);
  const sentCount = presentations.filter(p => p.status === 'sent').length;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Building2, label: 'Companii active', value: companies.length, suffix: '', color: 'from-primary/10 to-primary/5', iconColor: 'text-primary' },
            { icon: FileText, label: 'Prezentări', value: presentations.length, suffix: '', color: 'from-accent/10 to-accent/5', iconColor: 'text-accent' },
            { icon: TrendingUp, label: 'Oportunitate lunară', value: `${(totalObligation / 1000).toFixed(0)}k`, suffix: ' RON', color: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-600' },
            { icon: Zap, label: 'Trimise', value: sentCount, suffix: ` / ${presentations.length}`, color: 'from-info/10 to-info/5', iconColor: 'text-info' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className={`h-0.5 bg-gradient-to-r ${stat.color}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                      <p className="mt-2 font-display text-2xl font-bold text-foreground">
                        {stat.value}<span className="text-base font-normal text-muted-foreground">{stat.suffix}</span>
                      </p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Actions bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Caută companie sau contact..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-card border-border/50"
            />
          </div>
          <Link to="/new">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20">
              <Plus className="mr-2 h-4 w-4" />
              Prezentare nouă
            </Button>
          </Link>
        </div>

        {/* Company list */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40">
                  {['Companie', 'Contact', 'Departament', 'Status', 'Oportunitate UP', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((company, i) => {
                  const pres = presentations.find(p => p.company_id === company.id);
                  const calc = calculations.find(c => c.company_id === company.id);
                  const statusCfg = pres ? statusConfig[pres.status] : null;
                  return (
                    <motion.tr
                      key={company.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group transition-colors hover:bg-muted/20"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5 font-display text-xs font-bold text-primary">
                            {company.company_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{company.company_name}</p>
                            <p className="text-xs text-muted-foreground">{company.industry} • {company.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-foreground">{company.contact_name}</p>
                        <p className="text-xs text-muted-foreground">{company.contact_role}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {company.contact_department}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {statusCfg ? (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Nou</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {calc ? (
                          <span className="font-display text-sm font-semibold text-foreground">
                            {calc.spendable_half_estimated.toLocaleString('ro-RO')} <span className="text-xs font-normal text-muted-foreground">RON/lună</span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Link to={`/company/${company.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs">Detalii</Button>
                          </Link>
                          <Link to={`/new?company=${company.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs gap-1">
                              Prezentare <ArrowUpRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
