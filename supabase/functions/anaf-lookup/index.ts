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
    const today = new Date().toISOString().split('T')[0];

    console.log('Looking up CUI:', cuiClean);

    // ANAF v8 API — public, no API key needed
    const anafBody = JSON.stringify([{ cui: parseInt(cuiClean, 10), data: today }]);
    console.log('ANAF request body:', anafBody);

    const response = await fetch('https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      body: anafBody,
    });

    const responseText = await response.text();
    console.log('ANAF response status:', response.status, 'body:', responseText.slice(0, 500));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `ANAF API a returnat eroarea ${response.status}`, debug: responseText.slice(0, 200) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Răspuns invalid de la ANAF', debug: responseText.slice(0, 200) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const found = data?.found || data?.cod === 200 ? data?.found : null;

    // ANAF returns { cod: 200, message: "SUCCESS", found: [...] }
    const items = found || [];
    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'CUI negăsit în baza de date ANAF.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const item = items[0];
    const generalData = item.date_generale || item;
    const tvaData = item.inregistrare_scop_Tva || {};
    const splitTvaData = item.inregistrare_RTVAI || {};

    // Build structured response
    const result = {
      cui: cuiClean,
      legal_name: generalData.denumire || '',
      address: generalData.adresa || '',
      registration_number: generalData.nrRegCom || '',
      phone: generalData.telefon || '',
      fax: generalData.fax || '',
      postal_code: generalData.codPostal || '',
      stare_inregistrare: generalData.stare_inregistrare || '',
      registration_date: generalData.data_inregistrare || '',
      // CAEN
      caen_code: generalData.cod_CAEN ? String(generalData.cod_CAEN) : '',
      caen_label: generalData.aut || '',
      // TVA status
      tva_active: generalData.scpTVA || false,
      tva_registration_date: tvaData.data_inceput_ScpTVA || '',
      tva_end_date: tvaData.data_sfarsit_ScpTVA || '',
      // Split TVA
      split_tva: generalData.statusRO_e_Factura || false,
      // Status
      status_inactiv: generalData.statusInactivi || false,
      status_split_tva: splitTvaData.dataInceputSplitTVA || '',
    };

    console.log('ANAF lookup successful:', result.legal_name);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('ANAF lookup error:', error);
    const msg = error instanceof Error ? error.message : 'ANAF lookup failed';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
