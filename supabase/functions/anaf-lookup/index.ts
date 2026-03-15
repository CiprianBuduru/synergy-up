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

    let data = null;
    let anafSuccess = false;

    // Try ANAF direct API
    try {
      const response = await fetch('https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: anafBody,
      });

      const responseText = await response.text();
      console.log('ANAF direct response:', response.status, responseText.slice(0, 300));

      if (response.ok) {
        data = JSON.parse(responseText);
        anafSuccess = true;
      }
    } catch (e) {
      console.error('ANAF direct failed:', e);
    }

    // Fallback: try openapi.ro (free public mirror)
    if (!anafSuccess) {
      console.log('Trying openapi.ro fallback...');
      try {
        const fallbackUrl = `https://api.openapi.ro/api/companies/${cuiClean}`;
        const fallbackResp = await fetch(fallbackUrl, {
          headers: { 'Accept': 'application/json' },
        });

        if (fallbackResp.ok) {
          const fbData = await fallbackResp.json();
          console.log('openapi.ro response:', JSON.stringify(fbData).slice(0, 300));

          // Map openapi.ro format to our structure
          const result = {
            cui: cuiClean,
            legal_name: fbData.denumire || fbData.name || '',
            address: fbData.adresa || fbData.address || '',
            registration_number: fbData.numar_reg_com || fbData.registration_number || '',
            phone: fbData.telefon || '',
            fax: fbData.fax || '',
            postal_code: fbData.cod_postal || '',
            stare_inregistrare: fbData.stare || fbData.status || '',
            registration_date: '',
            caen_code: fbData.cod_CAEN ? String(fbData.cod_CAEN) : (fbData.caen ? String(fbData.caen) : ''),
            caen_label: fbData.activitate_principala || fbData.caen_description || '',
            tva_active: fbData.tva || fbData.platpictor_tva || false,
            tva_registration_date: '',
            tva_end_date: '',
            split_tva: false,
            status_inactiv: fbData.stare === 'INACTIVA' || false,
            status_split_tva: '',
          };

          console.log('Fallback lookup successful:', result.legal_name);
          return new Response(
            JSON.stringify({ success: true, data: result, source: 'openapi.ro' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        } else {
          const fbText = await fallbackResp.text();
          console.log('openapi.ro failed:', fallbackResp.status, fbText.slice(0, 200));
        }
      } catch (e) {
        console.error('openapi.ro fallback failed:', e);
      }
    }

    // Process ANAF direct response
    if (anafSuccess && data) {
      const found = data?.found || (data?.cod === 200 ? data?.found : null);
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
        caen_code: generalData.cod_CAEN ? String(generalData.cod_CAEN) : '',
        caen_label: generalData.aut || '',
        tva_active: generalData.scpTVA || false,
        tva_registration_date: tvaData.data_inceput_ScpTVA || '',
        tva_end_date: tvaData.data_sfarsit_ScpTVA || '',
        split_tva: generalData.statusRO_e_Factura || false,
        status_inactiv: generalData.statusInactivi || false,
        status_split_tva: splitTvaData.dataInceputSplitTVA || '',
      };

      console.log('ANAF lookup successful:', result.legal_name);
      return new Response(
        JSON.stringify({ success: true, data: result, source: 'anaf' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Both failed
    return new Response(
      JSON.stringify({ success: false, error: 'Nu s-au putut obține date de la ANAF. Serviciul poate fi temporar indisponibil.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
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
