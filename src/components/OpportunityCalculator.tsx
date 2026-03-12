import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { calculateOpportunity } from '@/lib/eligibility-engine';

export default function OpportunityCalculator({ companyId }: { companyId: string }) {
  const { calculations, addCalculation, getEnrichment } = useData();
  const enrichment = getEnrichment(companyId);
  const existing = calculations.find(c => c.company_id === companyId);

  const [employeeCount, setEmployeeCount] = useState(existing?.employee_count_used || enrichment?.employee_count_estimate || 100);
  const [disabledEmployees, setDisabledEmployees] = useState(existing?.disabled_employees_declared || 0);
  const [minWage, setMinWage] = useState(existing?.min_wage_used || 3700);
  const [result, setResult] = useState(existing ? {
    required_positions_4_percent: existing.required_positions_4_percent,
    uncovered_positions: existing.uncovered_positions,
    monthly_obligation_estimated: existing.monthly_obligation_estimated,
    spendable_half_estimated: existing.spendable_half_estimated,
    below_threshold: existing.employee_count_used < 50,
  } : null);

  const handleCalculate = () => {
    const calc = calculateOpportunity(employeeCount, disabledEmployees, minWage);
    setResult(calc);
    addCalculation({
      company_id: companyId,
      employee_count_used: employeeCount,
      disabled_employees_declared: disabledEmployees,
      required_positions_4_percent: calc.required_positions_4_percent,
      uncovered_positions: calc.uncovered_positions,
      min_wage_used: minWage,
      monthly_obligation_estimated: calc.monthly_obligation_estimated,
      spendable_half_estimated: calc.spendable_half_estimated,
      notes: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-accent" />
          <CardTitle className="text-base">Calculator Oportunitate</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">Estimare comercială internă • Nu constituie consultanță juridică</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Număr mediu salariați din bilanț</Label>
          <Input type="number" value={employeeCount} onChange={e => setEmployeeCount(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Persoane cu dizabilități angajate</Label>
          <Input type="number" value={disabledEmployees} onChange={e => setDisabledEmployees(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Salariu minim brut (RON)</Label>
          <Input type="number" value={minWage} onChange={e => setMinWage(Number(e.target.value))} />
        </div>
        <Button onClick={handleCalculate} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          Calculează
        </Button>

        {result && (
          <div className="space-y-3 rounded-lg bg-muted p-4">
            {result.below_threshold && (
              <div className="rounded-md bg-warning/10 p-2 text-center">
                <p className="text-xs font-medium text-warning">⚠️ Sub pragul de 50 angajați — oportunitate neconfirmată</p>
              </div>
            )}
            <ResultRow label="Poziții necesare (4%)" value={result.required_positions_4_percent.toString()} />
            <ResultRow label="Poziții neacoperite" value={result.uncovered_positions.toString()} />
            <ResultRow label="Obligație lunară estimată" value={`${result.monthly_obligation_estimated.toLocaleString('ro-RO')} RON`} />
            <div className="border-t pt-2">
              <ResultRow
                label="Buget disponibil prin UP"
                value={`${result.spendable_half_estimated.toLocaleString('ro-RO')} RON/lună`}
                highlight
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-accent' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}
