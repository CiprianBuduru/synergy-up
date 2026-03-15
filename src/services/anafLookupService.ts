// ─── ANAF CUI Lookup Service ────────────────────────────────
// Fetches official company data from Romania's ANAF registry via edge function.

import { supabase } from '@/integrations/supabase/client';

export interface AnafCompanyData {
  cui: string;
  legal_name: string;
  address: string;
  registration_number: string;
  phone: string;
  fax: string;
  postal_code: string;
  stare_inregistrare: string;
  registration_date: string;
  caen_code: string;
  caen_label: string;
  tva_active: boolean;
  tva_registration_date: string;
  tva_end_date: string;
  split_tva: boolean;
  status_inactiv: boolean;
  status_split_tva: string;
}

export type AnafLookupStatus = 'idle' | 'loading' | 'completed' | 'error';

export async function lookupCui(
  cui: string,
): Promise<{ data: AnafCompanyData | null; error: string | null }> {
  const clean = cui.trim().replace(/^RO/i, '');

  if (!clean || !/^\d{1,12}$/.test(clean)) {
    return { data: null, error: 'CUI invalid. Trebuie să conțină doar cifre (1-12).' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('anaf-lookup', {
      body: { cui: clean },
    });

    if (error) {
      console.error('[ANAF] Edge function error:', error);
      return { data: null, error: error.message };
    }

    if (!data?.success) {
      return { data: null, error: data?.error || 'CUI negăsit în baza ANAF.' };
    }

    return { data: data.data as AnafCompanyData, error: null };
  } catch (err) {
    console.error('[ANAF] Lookup failed:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Lookup failed' };
  }
}
