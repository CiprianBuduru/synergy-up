import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Plus, Search, Building2, FileText, TrendingUp, LogOut } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';

const statusLabels: Record<string, string> = {
  draft: 'Ciornă',
  research_done: 'Research finalizat',
  presentation_generated: 'Prezentare generată',
  sent: 'Trimisă',
  follow_up: 'Follow-up',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  research_done: 'outline',
  presentation_generated: 'default',
  sent: 'default',
  follow_up: 'outline',
};

export default function DashboardPage() {
  const { companies, presentations, calculations } = useData();
  const [search, setSearch] = useState('');

  const filtered = companies.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalObligation = calculations.reduce((s, c) => s + c.spendable_half_estimated, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Building2} label="Companii" value={companies.length} />
          <StatCard icon={FileText} label="Prezentări" value={presentations.length} />
          <StatCard icon={TrendingUp} label="Oportunitate totală" value={`${(totalObligation / 1000).toFixed(0)}k RON/lună`} />
          <StatCard icon={FileText} label="Trimise" value={presentations.filter(p => p.status === 'sent').length} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Caută companie..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Link to="/new">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Prezentare nouă
            </Button>
          </Link>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Companie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Departament</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Oportunitate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((company, i) => {
                    const pres = presentations.find(p => p.company_id === company.id);
                    const calc = calculations.find(c => c.company_id === company.id);
                    return (
                      <motion.tr
                        key={company.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{company.company_name}</p>
                            <p className="text-xs text-muted-foreground">{company.industry}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{company.contact_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{company.contact_department}</td>
                        <td className="px-4 py-3">
                          {pres ? (
                            <Badge variant={statusVariant[pres.status]}>{statusLabels[pres.status]}</Badge>
                          ) : (
                            <Badge variant="secondary">Nou</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {calc ? `${calc.spendable_half_estimated.toLocaleString('ro-RO')} RON/lună` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link to={`/company/${company.id}`}>
                              <Button variant="ghost" size="sm">Detalii</Button>
                            </Link>
                            <Link to={`/new?company=${company.id}`}>
                              <Button variant="outline" size="sm">Prezentare</Button>
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <Card className="card-elevated">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
