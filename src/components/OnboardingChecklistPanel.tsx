// ─── Onboarding Checklist Panel ──────────────────────────────────────
// Visual checklist for client onboarding steps.

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ClipboardList, RotateCcw } from 'lucide-react';
import {
  fetchOnboardingChecklist, completeOnboardingStep, resetOnboardingChecklist,
  type OnboardingChecklist,
} from '@/services/clientOnboardingService';
import { toast } from '@/hooks/use-toast';

interface Props {
  companyId: string;
}

export default function OnboardingChecklistPanel({ companyId }: Props) {
  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => fetchOnboardingChecklist(companyId).then(setChecklist);

  useEffect(() => { load(); }, [companyId]);

  const handleToggle = async (stepId: string, completed: boolean) => {
    if (completed) return; // can't un-complete
    setLoading(true);
    await completeOnboardingStep(companyId, stepId);
    await load();
    setLoading(false);
    toast({ title: 'Pas completat' });
  };

  const handleReset = async () => {
    setLoading(true);
    await resetOnboardingChecklist(companyId);
    await load();
    setLoading(false);
    toast({ title: 'Checklist resetat' });
  };

  if (!checklist) return null;

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm">Onboarding Checklist</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{checklist.progress}%</Badge>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              <Progress value={checklist.progress} className="h-1.5" />
              <div className="space-y-1.5">
                {checklist.steps.map((step, i) => (
                  <label
                    key={step.id}
                    className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors cursor-pointer ${
                      step.completed ? 'bg-emerald-50/50' : 'bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <Checkbox
                      checked={step.completed}
                      onCheckedChange={() => handleToggle(step.id, step.completed)}
                      disabled={step.completed || loading}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{step.icon}</span>
                        <p className={`text-sm font-medium ${step.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {step.label}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      {step.completed_at && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          ✓ {new Date(step.completed_at).toLocaleString('ro-RO')}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleReset}>
                <RotateCcw className="h-3 w-3 mr-1" /> Resetează
              </Button>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
