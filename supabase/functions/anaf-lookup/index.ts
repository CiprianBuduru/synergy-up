const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cui } = await req.json();

    if (!cui || typeof cui !== 'string' || !/^\d{1,12}$/.test(cui.trim())) {
      return new Response(
        JSON.stringify({ success: false, error: 'A valid CUI (numeric, 1-12 digits) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const cuiClean = cui.trim().replace(/^RO/i, '');
    console.log('Looking up CUI:', cuiClean);

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Use Firecrawl search to find company info by CUI
    console.log('Searching for CUI:', cuiClean);
    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${cuiClean}" CUI firma Romania CAEN`,
        limit: 5,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    const searchData = await searchResp.json();
    if (!searchResp.ok) {
      console.error('Search failed:', searchData?.error || searchResp.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Căutarea CUI a eșuat.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const results = searchData?.data || [];
    console.log('Search returned', results.length, 'results');

    if (results.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: `CUI ${cuiClean} negăsit în surse publice.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Aggregate data from all results
    const result = extractCompanyFromResults(cuiClean, results);

    if (!result.legal_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Date insuficiente pentru acest CUI.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('Lookup successful:', result.legal_name, 'CAEN:', result.caen_code);
    return new Response(
      JSON.stringify({ success: true, data: result, source: 'web_search' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('CUI lookup error:', error);
    const msg = error instanceof Error ? error.message : 'Lookup failed';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// ─── Extract company data from search results ─────────────

interface CompanyResult {
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

interface SearchResult {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
}

function extractCompanyFromResults(cui: string, results: SearchResult[]): CompanyResult {
  const r: CompanyResult = {
    cui,
    legal_name: '',
    address: '',
    registration_number: '',
    phone: '',
    fax: '',
    postal_code: '',
    stare_inregistrare: '',
    registration_date: '',
    caen_code: '',
    caen_label: '',
    tva_active: false,
    tva_registration_date: '',
    tva_end_date: '',
    split_tva: false,
    status_inactiv: false,
    status_split_tva: '',
  };

  for (const item of results) {
    const text = `${item.title || ''} ${item.description || ''} ${item.markdown || ''}`;

    // Skip if this result doesn't seem to be about our CUI
    if (!text.includes(cui)) continue;

    // Legal name: look for company names near the CUI
    if (!r.legal_name) {
      // From title: "COMPANY NAME SRL - CUI xxx" or "COMPANY NAME S.R.L. (CUI xxx)"
      const titleNameMatch = (item.title || '').match(/^([A-ZĂÎȘȚÂ][A-ZĂÎȘȚÂ\s.&-]{2,}(?:S\.?R\.?L\.?|S\.?A\.?|S\.?N\.?C\.?|S\.?C\.?S\.?|P\.?F\.?A\.?|I\.?I\.?|I\.?F\.?))/i);
      if (titleNameMatch) {
        r.legal_name = titleNameMatch[1].trim().replace(/\s+/g, ' ');
      }
    }
    if (!r.legal_name) {
      // From markdown: "Denumire: COMPANY NAME" or "## COMPANY NAME"
      const denumireMatch = text.match(/(?:denumire|firma|company)[:\s]*([A-ZĂÎȘȚÂ][^\n]{3,60}(?:S\.?R\.?L\.?|S\.?A\.?|S\.?N\.?C\.?|P\.?F\.?A\.?))/i);
      if (denumireMatch) r.legal_name = denumireMatch[1].trim();
    }
    if (!r.legal_name) {
      // Try heading pattern
      const headingMatch = text.match(/#{1,3}\s*([A-ZĂÎȘȚÂ][A-ZĂÎȘȚÂ\s.&-]{2,}(?:S\.?R\.?L\.?|S\.?A\.?))/);
      if (headingMatch) r.legal_name = headingMatch[1].trim();
    }

    // Registration number
    if (!r.registration_number) {
      const regMatch = text.match(/(J\d{1,2}\/\d+\/\d{4})/i);
      if (regMatch) r.registration_number = regMatch[1];
    }

    // CAEN code
    if (!r.caen_code) {
      const caenMatch = text.match(/(?:CAEN|cod\s+CAEN)[:\s]*(\d{4})\s*[-–]?\s*([^\n|,]{3,80})?/i);
      if (caenMatch) {
        r.caen_code = caenMatch[1];
        if (caenMatch[2]) r.caen_label = caenMatch[2].trim();
      }
    }
    if (!r.caen_code) {
      // Standalone CAEN pattern
      const caenAlt = text.match(/(\d{4})\s*[-–]\s*([A-ZĂÎȘȚÂ][^\n|,]{5,80})/);
      if (caenAlt) {
        r.caen_code = caenAlt[1];
        r.caen_label = caenAlt[2].trim();
      }
    }

    // Address
    if (!r.address) {
      const addrMatch = text.match(/(?:adres[aă]|sediu(?:l)?(?:\s+social)?)[:\s]*([^\n]{10,200})/i);
      if (addrMatch) r.address = addrMatch[1].trim().replace(/\s+/g, ' ');
    }
    if (!r.address) {
      // Try "jud. X, loc. Y" pattern
      const locMatch = text.match(/((?:jud\.?\s+|județ(?:ul)?\s+)[^\n]{5,100})/i);
      if (locMatch) r.address = locMatch[1].trim();
    }

    // Status
    if (!r.stare_inregistrare) {
      if (/(?:stare|status)[:\s]*activ[aă]?\b/i.test(text)) {
        r.stare_inregistrare = 'ACTIVA';
      } else if (/(?:stare|status)[:\s]*(?:inactiv|radiat)/i.test(text)) {
        r.stare_inregistrare = 'INACTIVA';
        r.status_inactiv = true;
      }
    }

    // TVA
    if (!r.tva_active) {
      if (/plat?itor\s+(?:de\s+)?TVA|TVA[:\s]*da|înregistrat.*scopuri.*TVA/i.test(text)) {
        r.tva_active = true;
      }
    }

    // Phone
    if (!r.phone) {
      const phoneMatch = text.match(/(?:telefon|tel\.?|phone)[:\s]*([\d\s.+()-]{6,20})/i);
      if (phoneMatch) r.phone = phoneMatch[1].trim();
    }
  }

  // Clean up markdown artifacts from parsed values
  for (const key of ['address', 'caen_label', 'legal_name'] as const) {
    r[key] = r[key]
      .replace(/\[.*?\]\(.*?\)/g, '')  // remove markdown links
      .replace(/[|*#]/g, '')            // remove table/bold/heading chars
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  return r;
}
