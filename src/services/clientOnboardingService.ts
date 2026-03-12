// ─── Client Onboarding Service ───────────────────────────────────────
// Manages the onboarding checklist for interested companies.

import { supabase } from '@/integrations/supabase/client';
import { addTimelineEvent } from '@/services/followUpService';

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: string;
  completed: boolean;
  completed_at?: string;
}

export interface OnboardingChecklist {
  company_id: string;
  steps: OnboardingStep[];
  progress: number; // 0–100
}

const DEFAULT_STEPS: Omit<OnboardingStep, 'completed' | 'completed_at'>[] = [
  { id: 'interest_confirmed', label: 'Confirmare interes', description: 'Clientul și-a exprimat interesul pentru colaborare.', icon: '✅' },
  { id: 'presentation_sent', label: 'Transmitere prezentare', description: 'Prezentarea personalizată a fost trimisă.', icon: '📤' },
  { id: 'documents_sent', label: 'Transmitere documente', description: 'Pachetul de documente a fost transmis.', icon: '📄' },
  { id: 'agreement_signed', label: 'Semnare acord', description: 'Acordul de parteneriat a fost semnat.', icon: '✍️' },
  { id: 'collaboration_active', label: 'Activare colaborare', description: 'Colaborarea este activă, prima comandă poate fi plasată.', icon: '🚀' },
];

// We persist checklist state in company_timeline_events with event_type = 'onboarding_step'
// This avoids creating a new table.

export async function fetchOnboardingChecklist(companyId: string): Promise<OnboardingChecklist> {
  const { data } = await supabase
    .from('company_timeline_events')
    .select('*')
    .eq('company_id', companyId)
    .eq('event_type', 'onboarding_step');

  const completedSteps = new Set((data || []).map(e => {
    const meta = e.metadata_json as Record<string, unknown>;
    return meta?.step_id as string;
  }));

  const steps: OnboardingStep[] = DEFAULT_STEPS.map(s => {
    const event = (data || []).find(e => (e.metadata_json as Record<string, unknown>)?.step_id === s.id);
    return {
      ...s,
      completed: completedSteps.has(s.id),
      completed_at: event?.created_at,
    };
  });

  const completedCount = steps.filter(s => s.completed).length;
  return {
    company_id: companyId,
    steps,
    progress: Math.round((completedCount / steps.length) * 100),
  };
}

export async function completeOnboardingStep(companyId: string, stepId: string): Promise<void> {
  const step = DEFAULT_STEPS.find(s => s.id === stepId);
  if (!step) return;
  await addTimelineEvent(companyId, 'onboarding_step', step.label, { step_id: stepId });
}

export async function resetOnboardingChecklist(companyId: string): Promise<void> {
  await supabase
    .from('company_timeline_events')
    .delete()
    .eq('company_id', companyId)
    .eq('event_type', 'onboarding_step');
}
