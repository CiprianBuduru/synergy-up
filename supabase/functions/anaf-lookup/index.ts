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

    // Use Firecrawl to scrape company data from listafirme.ro
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const scrapeUrl = `https://www.listafirme.ro/search.aspx?q=${cuiClean}`;
    console.log('Scraping:', scrapeUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: scrapeUrl,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await response.json();

    if (!response.ok || !scrapeData?.success) {
      console.error('Firecrawl scrape failed:', scrapeData?.error || response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Nu s-au putut obține date pentru acest CUI.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const markdown = scrapeData?.data?.markdown || '';
    const metadata = scrapeData?.data?.metadata || {};
    console.log('Scraped content length:', markdown.length);

    // Parse company data from listafirme.ro markdown
    const result = parseListafirmeData(cuiClean, markdown, metadata);

    if (!result.legal_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'CUI negăsit sau date insuficiente.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('Lookup successful:', result.legal_name);
    return new Response(
      JSON.stringify({ success: true, data: result, source: 'listafirme.ro' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('ANAF lookup error:', error);
    const msg = error instanceof Error ? error.message : 'Lookup failed';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// ─── Parser for listafirme.ro content ──────────────────────

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

function parseListafirmeData(cui: string, markdown: string, metadata: Record<string, string>): CompanyResult {
  const result: CompanyResult = {
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

  // Try to extract from title first
  const title = metadata?.title || '';
  if (title) {
    // listafirme.ro titles are like "FIRMA SRL - CUI 12345 - info"
    const titleMatch = title.match(/^([^-–]+)/);
    if (titleMatch) {
      result.legal_name = titleMatch[1].trim();
    }
  }

  // Extract legal name from markdown
  if (!result.legal_name) {
    const nameMatch = markdown.match(/(?:#{1,3}\s*)?([A-ZĂÎȘȚÂ][A-ZĂÎȘȚÂ\s.&-]{2,}(?:S\.?R\.?L\.?|S\.?A\.?|S\.?N\.?C\.?|S\.?C\.?S\.?|P\.?F\.?A\.?|I\.?I\.?|I\.?F\.?))/);
    if (nameMatch) result.legal_name = nameMatch[1].trim();
  }

  // Extract CUI confirmation
  const cuiMatch = markdown.match(/(?:CUI|cod fiscal|C\.U\.I\.)[:\s]*(?:RO\s*)?(\d{5,12})/i);
  if (cuiMatch) result.cui = cuiMatch[1];

  // Extract registration number
  const regMatch = markdown.match(/(?:Reg\.?\s*Com\.?|Nr\.?\s*înregistrare|J\d{1,2})[:\s]*(J\d{1,2}\/\d+\/\d{4})/i);
  if (regMatch) result.registration_number = regMatch[1];

  // Extract CAEN code
  const caenMatch = markdown.match(/(?:CAEN|cod CAEN)[:\s]*(\d{4})\s*[-–]?\s*([^\n|]{3,80})?/i);
  if (caenMatch) {
    result.caen_code = caenMatch[1];
    if (caenMatch[2]) result.caen_label = caenMatch[2].trim();
  }

  // Extract address
  const addrMatch = markdown.match(/(?:adres[aă]|sediu(?:l)?|localitatea)[:\s]*([^\n]{10,200})/i);
  if (addrMatch) result.address = addrMatch[1].trim();

  // Extract status
  if (/(?:activ[aă]|ACTIV)/i.test(markdown)) {
    result.stare_inregistrare = 'ACTIVA';
  } else if (/(?:inactiv[aă]|INACTIV|radiat[aă]|RADIAT)/i.test(markdown)) {
    result.stare_inregistrare = 'INACTIVA';
    result.status_inactiv = true;
  }

  // TVA status
  if (/plat?itor\s+(?:de\s+)?TVA|TVA:\s*da|înregistrat.*TVA/i.test(markdown)) {
    result.tva_active = true;
  }

  // Phone
  const phoneMatch = markdown.match(/(?:telefon|tel\.?)[:\s]*([\d\s./-]{6,20})/i);
  if (phoneMatch) result.phone = phoneMatch[1].trim();

  return result;
}
