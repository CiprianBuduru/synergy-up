import type { Product } from '@/types';

let _id = 0;
function p(
  name: string,
  category: string,
  description: string,
  base: string,
  ops: string[],
  caen: string[],
  logic: string,
  opts: {
    industries?: string[];
    departments?: string[];
    suitable?: string[];
    kits?: boolean;
    notes?: string;
  } = {}
): Product {
  _id++;
  const slug = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '');
  return {
    id: `prod-${_id}`,
    name,
    slug,
    category,
    description,
    base_product_type: base,
    internal_operations_json: ops,
    supporting_caen_codes_json: caen,
    eligible_logic: logic,
    suggested_industries_json: opts.industries ?? ['Corporate', 'IT', 'Retail'],
    suitable_departments_json: opts.departments ?? ['Marketing', 'HR'],
    suitable_for_json: opts.suitable ?? ['onboarding', 'marketing'],
    usable_in_kits: opts.kits ?? true,
    active: true,
    notes: opts.notes ?? '',
  };
}

export const productsLibrary: Product[] = [
  // ══════════ TEXTILE PROMOȚIONALE ══════════
  p('Tricou personalizat bumbac', 'Textile promoționale', 'Tricou 100% bumbac cu print sau broderie logo', 'textile', ['Personalizare textile', 'Branding produse'], ['7311'], 'Tricoul e achiziționat ca materie primă, personalizarea se realizează intern.', { suitable: ['onboarding', 'team building', 'evenimente'], departments: ['HR', 'Marketing'], kits: true }),
  p('Tricou tehnic sport', 'Textile promoționale', 'Tricou dry-fit personalizat pentru evenimente sportive', 'textile', ['Personalizare textile', 'Branding produse'], ['7311'], 'Tricoul sport e achiziționat, personalizarea se realizează intern.', { suitable: ['team building', 'evenimente sportive'], kits: true }),
  p('Polo personalizat', 'Textile promoționale', 'Polo premium cu broderie logo', 'textile', ['Personalizare textile', 'Branding produse'], ['7311'], 'Polo-ul e achiziționat, broderia realizată intern.', { suitable: ['protocol', 'uniformă', 'onboarding'], departments: ['HR', 'Management'] }),
  p('Hanorac personalizat', 'Textile promoționale', 'Hanorac cu glugă și print sau broderie', 'textile', ['Personalizare textile', 'Branding produse'], ['7311'], 'Hanoracul e achiziționat, personalizarea se realizează intern.', { suitable: ['onboarding', 'team building'], kits: true }),
  p('Șapcă brandată', 'Textile promoționale', 'Șapcă cu broderie sau transfer termic', 'textile', ['Personalizare textile', 'Branding produse'], ['7311'], 'Șapca e achiziționată, brandingul aplicat intern.', { suitable: ['evenimente', 'outdoor', 'team building'], kits: true }),
  p('Vestă personalizată', 'Textile promoționale', 'Vestă softshell cu logo brodat', 'textile', ['Personalizare textile', 'Branding produse'], ['7311'], 'Vesta e achiziționată, broderia realizată intern.', { suitable: ['teren', 'echipă'], departments: ['HR', 'Achiziții'], industries: ['Energie', 'Construcții', 'Logistică'] }),
  p('Bandană personalizată', 'Textile promoționale', 'Bandană sublimată full-print cu design custom', 'textile', ['Personalizare textile'], ['7311'], 'Bandana e achiziționată, sublimarea realizată intern.', { suitable: ['evenimente', 'outdoor'], kits: true }),
  p('Șorț personalizat', 'Textile promoționale', 'Șorț de bucătărie/grătar cu logo', 'textile', ['Personalizare textile', 'Branding produse'], ['7311'], 'Șorțul e achiziționat, personalizarea se realizează intern.', { suitable: ['evenimente', 'cadouri', 'team building'], kits: true }),
  p('Sacosă bumbac personalizată', 'Textile promoționale', 'Sacosă ecologică din bumbac cu print', 'textile', ['Personalizare textile', 'Branding produse'], ['7311'], 'Sacosa e achiziționată, printul aplicat intern.', { suitable: ['evenimente', 'retail', 'conferințe'], kits: true }),
  p('Prosop personalizat', 'Textile promoționale', 'Prosop brodat cu logo, ideal pentru cadouri corporate', 'textile', ['Personalizare textile', 'Branding produse'], ['7311'], 'Prosopul e achiziționat, broderia realizată intern.', { suitable: ['cadouri', 'protocol', 'hospitality'], industries: ['Hospitality', 'Corporate'] }),

  // ══════════ PAPETĂRIE CORPORATE ══════════
  p('Agendă premium personalizată', 'Papetărie corporate', 'Agendă A5 cu coperți personalizate și pagini custom', 'papetărie', ['Realizare papetărie', 'Legătorie', 'Branding produse'], ['1723', '1814', '7311'], 'Agenda e realizată intern: tipărire pagini, legătorie și personalizare copertă.', { suitable: ['onboarding', 'cadouri', 'protocol'], departments: ['HR', 'Management'], kits: true }),
  p('Blocnotes A5 brandat', 'Papetărie corporate', 'Blocnotes cu pagini interioare și coperți personalizate', 'papetărie', ['Realizare papetărie', 'Tipărire materiale', 'Legătorie'], ['1723', '1812', '1814'], 'Blocnotes-ul e realizat integral intern.', { suitable: ['onboarding', 'conferințe', 'office'], kits: true }),
  p('Blocnotes A4 personalizat', 'Papetărie corporate', 'Blocnotes format mare cu logo', 'papetărie', ['Realizare papetărie', 'Tipărire materiale'], ['1723', '1812'], 'Blocnotes-ul e tipărit și asamblat intern.', { suitable: ['training', 'office'], kits: true }),
  p('Mapă prezentare', 'Papetărie corporate', 'Mapă de prezentare cu design personalizat', 'papetărie', ['Realizare papetărie', 'Tipărire materiale'], ['1723', '1812'], 'Mapa e produsă intern: tipărire și asamblare.', { suitable: ['conferințe', 'sales', 'onboarding'], kits: true }),
  p('Mapă cu buzunar', 'Papetărie corporate', 'Mapă cu buzunar interior pentru documente', 'papetărie', ['Realizare papetărie', 'Tipărire materiale'], ['1723', '1812'], 'Mapa e produsă și tipărită intern.', { suitable: ['conferințe', 'întâlniri clienți'], kits: true }),
  p('Carnet notițe pocket', 'Papetărie corporate', 'Carnet format mic cu coperți personalizate', 'papetărie', ['Realizare papetărie', 'Legătorie'], ['1723', '1814'], 'Carnetul e realizat și legat intern.', { suitable: ['onboarding', 'conferințe'], kits: true }),
  p('Planificator săptămânal', 'Papetărie corporate', 'Planner săptămânal cu layout personalizat', 'papetărie', ['Realizare papetărie', 'Legătorie', 'Tipărire materiale'], ['1723', '1814', '1812'], 'Planificatorul e tipărit, legat și personalizat intern.', { suitable: ['onboarding', 'office', 'cadouri'], kits: true }),
  p('Set post-it personalizat', 'Papetărie corporate', 'Post-it-uri cu print logo pe copertă', 'papetărie', ['Tipărire materiale', 'Branding produse'], ['1812', '7311'], 'Post-it-urile sunt achiziționate, tipărirea coperții realizată intern.', { suitable: ['office', 'conferințe'], kits: true }),
  p('Clipboard brandat', 'Papetărie corporate', 'Clipboard cu imprimare logo', 'papetărie', ['Branding produse'], ['7311'], 'Clipboard-ul e achiziționat, brandingul aplicat intern.', { suitable: ['office', 'teren'], kits: true }),
  p('Plicuri personalizate', 'Papetărie corporate', 'Plicuri cu design corporate personalizat', 'papetărie', ['Tipărire materiale', 'Realizare papetărie'], ['1812', '1723'], 'Plicurile sunt tipărite și realizate intern.', { suitable: ['corespondență', 'protocol'], departments: ['Management', 'Achiziții'] }),

  // ══════════ INSTRUMENTE DE SCRIS ══════════
  p('Pix plastic personalizat', 'Instrumente de scris', 'Pix cu logo imprimat', 'promoțional', ['Branding produse'], ['7311'], 'Pixul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding', 'conferințe', 'office'], kits: true }),
  p('Pix metalic brandat', 'Instrumente de scris', 'Pix metalic cu gravură laser logo', 'promoțional', ['Branding produse'], ['7311'], 'Pixul metalic e achiziționat, gravura realizată intern.', { suitable: ['protocol', 'cadouri', 'management'], departments: ['Management'], kits: true }),
  p('Set pix + creion mecanic', 'Instrumente de scris', 'Set elegant pix și creion mecanic în cutie brandată', 'promoțional', ['Branding produse', 'Ambalare kituri'], ['7311'], 'Setul e achiziționat, brandat și ambalat intern.', { suitable: ['protocol', 'cadouri corporate'], kits: true }),
  p('Marker whiteboard brandat', 'Instrumente de scris', 'Set markere whiteboard cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Markerele sunt achiziționate, brandingul aplicat intern.', { suitable: ['office', 'training'], kits: true }),
  p('Creion personalizat', 'Instrumente de scris', 'Creion HB cu imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Creionul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding', 'office', 'școli'], kits: true }),
  p('Pix touch-screen', 'Instrumente de scris', 'Pix cu funcție stylus și imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Pixul touch e achiziționat, brandingul aplicat intern.', { suitable: ['conferințe', 'IT', 'office'], kits: true, industries: ['IT', 'Telecom', 'Corporate'] }),
  p('Evidențiator set brandat', 'Instrumente de scris', 'Set 4 evidențiatoare cu branding', 'promoțional', ['Branding produse', 'Ambalare kituri'], ['7311'], 'Evidențiatoarele sunt achiziționate, branduite și ambalate intern.', { suitable: ['office', 'training', 'conferințe'], kits: true }),
  p('Roller premium personalizat', 'Instrumente de scris', 'Roller metalic gravat, în cutie elegantă', 'promoțional', ['Branding produse', 'Ambalare kituri'], ['7311'], 'Rollerul e achiziționat, gravat și ambalat intern.', { suitable: ['protocol', 'VIP', 'management'], departments: ['Management'] }),

  // ══════════ ACCESORII BIROU ══════════
  p('Suport pixuri brandat', 'Accesorii birou', 'Suport de birou pentru pixuri cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Suportul e achiziționat, brandingul aplicat intern.', { suitable: ['office', 'onboarding'], kits: true }),
  p('Mouse pad personalizat', 'Accesorii birou', 'Mouse pad cu print full-color logo', 'promoțional', ['Branding produse'], ['7311'], 'Mouse pad-ul e achiziționat, printul aplicat intern.', { suitable: ['office', 'onboarding', 'IT'], kits: true }),
  p('Suport telefon birou', 'Accesorii birou', 'Suport de telefon cu logo imprimat', 'promoțional', ['Branding produse'], ['7311'], 'Suportul e achiziționat, brandingul aplicat intern.', { suitable: ['office', 'onboarding'], kits: true }),
  p('Organizator birou brandat', 'Accesorii birou', 'Organizator multifuncțional cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Organizatorul e achiziționat, brandingul aplicat intern.', { suitable: ['office', 'onboarding', 'cadouri'], kits: true }),
  p('Covoraș birou personalizat', 'Accesorii birou', 'Desk pad din piele ecologică cu imprimare', 'promoțional', ['Branding produse'], ['7311'], 'Covorașul e achiziționat, personalizarea realizată intern.', { suitable: ['office', 'onboarding', 'management'], kits: true }),
  p('Ceas birou brandat', 'Accesorii birou', 'Ceas de birou cu logo imprimat', 'promoțional', ['Branding produse'], ['7311'], 'Ceasul e achiziționat, brandingul aplicat intern.', { suitable: ['cadouri', 'protocol', 'management'], departments: ['Management'] }),
  p('Ramă foto brandată', 'Accesorii birou', 'Ramă foto de birou cu logo discret', 'promoțional', ['Branding produse'], ['7311'], 'Rama e achiziționată, brandingul aplicat intern.', { suitable: ['onboarding', 'office', 'cadouri'], kits: true }),
  p('Separator cărți brandat', 'Accesorii birou', 'Bookmark metalic cu gravură logo', 'promoțional', ['Branding produse'], ['7311'], 'Bookmark-ul e achiziționat, gravura realizată intern.', { suitable: ['conferințe', 'cadouri', 'onboarding'], kits: true }),
  p('Cutie depozitare brandată', 'Accesorii birou', 'Cutie organizare birou cu imprimare', 'promoțional', ['Branding produse', 'Tipărire materiale'], ['7311', '1812'], 'Cutia e achiziționată, brandingul aplicat intern.', { suitable: ['office', 'onboarding'], kits: true }),

  // ══════════ ACCESORII IT PROMO ══════════
  p('USB stick personalizat', 'Accesorii IT promo', 'USB stick cu logo gravat', 'promoțional', ['Branding produse'], ['7311'], 'USB-ul e achiziționat, gravura realizată intern.', { suitable: ['onboarding', 'conferințe', 'training'], kits: true, industries: ['IT', 'Corporate', 'Telecom'] }),
  p('Powerbank personalizat 5000mAh', 'Accesorii IT promo', 'Powerbank compact cu imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Powerbank-ul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding', 'conferințe', 'cadouri'], kits: true }),
  p('Powerbank personalizat 10000mAh', 'Accesorii IT promo', 'Powerbank mare capacitate cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Powerbank-ul e achiziționat, brandingul aplicat intern.', { suitable: ['cadouri', 'protocol', 'management'], kits: true }),
  p('Powerbank solar brandat', 'Accesorii IT promo', 'Powerbank solar eco cu logo imprimat', 'promoțional', ['Branding produse'], ['7311'], 'Powerbank-ul solar e achiziționat, brandingul aplicat intern.', { suitable: ['outdoor', 'cadouri eco', 'conferințe'], kits: true, industries: ['Energie', 'Corporate', 'IT'] }),
  p('Cablu USB multifuncțional brandat', 'Accesorii IT promo', 'Cablu 3-în-1 cu imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Cablul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding', 'conferințe'], kits: true }),
  p('Suport laptop brandat', 'Accesorii IT promo', 'Suport laptop ergonomic cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Suportul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding', 'office', 'IT'], kits: true }),
  p('Webcam cover personalizat', 'Accesorii IT promo', 'Cover webcam cu imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Cover-ul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding', 'IT', 'conferințe'], kits: true }),
  p('Hub USB brandat', 'Accesorii IT promo', 'Hub USB 4 porturi cu logo imprimat', 'promoțional', ['Branding produse'], ['7311'], 'Hub-ul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding', 'office', 'IT'], kits: true }),
  p('Căști audio brandate', 'Accesorii IT promo', 'Căști in-ear cu cutie personalizată', 'promoțional', ['Branding produse', 'Ambalare kituri'], ['7311'], 'Căștile sunt achiziționate, cutia brandată și ambalarea realizate intern.', { suitable: ['onboarding', 'conferințe', 'cadouri'], kits: true }),
  p('Mouse wireless brandat', 'Accesorii IT promo', 'Mouse wireless cu imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Mouse-ul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding', 'office', 'cadouri IT'], kits: true }),

  // ══════════ PRODUSE CERAMICĂ ȘI STICLĂ ══════════
  p('Cană ceramică personalizată', 'Ceramică și sticlă', 'Cană ceramică clasică cu print full-color', 'promoțional', ['Branding produse'], ['7311'], 'Cana e achiziționată, brandingul aplicat intern.', { suitable: ['onboarding', 'office', 'cadouri'], kits: true }),
  p('Cană termică personalizată', 'Ceramică și sticlă', 'Cană termică de călătorie cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Cana termică e achiziționată, brandingul aplicat intern.', { suitable: ['onboarding', 'cadouri', 'outdoor'], kits: true }),
  p('Cană magic personalizată', 'Ceramică și sticlă', 'Cană care își schimbă culoarea la cald', 'promoțional', ['Branding produse'], ['7311'], 'Cana e achiziționată, personalizarea realizată intern.', { suitable: ['cadouri', 'marketing'], kits: true }),
  p('Sticlă apă personalizată', 'Ceramică și sticlă', 'Sticlă de apă reutilizabilă cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Sticla e achiziționată, brandingul aplicat intern.', { suitable: ['onboarding', 'office', 'eco'], kits: true }),
  p('Termos personalizat', 'Ceramică și sticlă', 'Termos inox cu gravură sau print logo', 'promoțional', ['Branding produse'], ['7311'], 'Termosul e achiziționat, brandingul aplicat intern.', { suitable: ['cadouri', 'protocol', 'outdoor'], kits: true }),
  p('Set ceașcă + farfurioară brandată', 'Ceramică și sticlă', 'Set ceai/cafea cu imprimare discretă', 'promoțional', ['Branding produse', 'Ambalare kituri'], ['7311'], 'Setul e achiziționat, brandat și ambalat intern.', { suitable: ['protocol', 'cadouri', 'hospitality'], kits: true }),
  p('Borcan personalizat', 'Ceramică și sticlă', 'Borcan cu capac metalic și etichetă personalizată', 'promoțional', ['Branding produse', 'Tipărire materiale'], ['7311', '1812'], 'Borcanul e achiziționat, eticheta tipărită intern.', { suitable: ['cadouri', 'evenimente', 'eco'], kits: true }),
  p('Pahar sticlă brandat', 'Ceramică și sticlă', 'Pahar din sticlă cu gravură sau print', 'promoțional', ['Branding produse'], ['7311'], 'Paharul e achiziționat, brandingul aplicat intern.', { suitable: ['protocol', 'cadouri', 'hospitality'], kits: true }),

  // ══════════ PRODUSE ECO ══════════
  p('Pix bambus personalizat', 'Produse eco', 'Pix din bambus cu gravură laser', 'eco', ['Branding produse'], ['7311'], 'Pixul e achiziționat, gravura realizată intern.', { suitable: ['onboarding', 'conferințe', 'eco'], kits: true }),
  p('Blocnotes reciclat', 'Produse eco', 'Blocnotes din hârtie reciclată cu copertă personalizată', 'eco', ['Realizare papetărie', 'Tipărire materiale'], ['1723', '1812'], 'Blocnotes-ul e realizat și tipărit intern din materiale reciclate.', { suitable: ['onboarding', 'eco', 'conferințe'], kits: true }),
  p('Set semințe personalizat', 'Produse eco', 'Kit cu semințe în ambalaj brandat', 'eco', ['Branding produse', 'Ambalare kituri', 'Tipărire materiale'], ['7311', '1812'], 'Ambalajul e tipărit intern, kitul asamblat de echipa noastră.', { suitable: ['CSR', 'evenimente eco', 'cadouri'], kits: true }),
  p('Sacosă bumbac organic', 'Produse eco', 'Sacosă din bumbac organic cu print eco', 'eco', ['Personalizare textile', 'Branding produse'], ['7311'], 'Sacosa e achiziționată, printul aplicat intern.', { suitable: ['evenimente', 'retail', 'eco'], kits: true }),
  p('Caiet hârtie semințe', 'Produse eco', 'Caiet cu copertă care se plantează', 'eco', ['Realizare papetărie', 'Tipărire materiale'], ['1723', '1812'], 'Caietul e realizat intern din materiale speciale.', { suitable: ['CSR', 'onboarding eco'], kits: true }),
  p('Pungă hârtie personalizată', 'Produse eco', 'Pungă din hârtie kraft cu logo', 'eco', ['Tipărire materiale', 'Branding produse'], ['1812', '7311'], 'Punga e achiziționată, tipărirea realizată intern.', { suitable: ['retail', 'evenimente', 'ambalare'], kits: true }),
  p('Sticlă tritan eco brandată', 'Produse eco', 'Sticlă Tritan ecologică cu logo', 'eco', ['Branding produse'], ['7311'], 'Sticla e achiziționată, brandingul aplicat intern.', { suitable: ['onboarding', 'office', 'sport'], kits: true }),
  p('Breloc eco personalizat', 'Produse eco', 'Breloc din materiale reciclate cu logo', 'eco', ['Branding produse'], ['7311'], 'Brelocul e achiziționat, brandingul aplicat intern.', { suitable: ['conferințe', 'cadouri eco'], kits: true }),

  // ══════════ PRODUSE OUTDOOR ══════════
  p('Umbrela personalizată', 'Produse outdoor', 'Umbrelă automată cu imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Umbrela e achiziționată, brandingul aplicat intern.', { suitable: ['cadouri', 'protocol', 'evenimente'], kits: true }),
  p('Lanyard personalizat', 'Produse outdoor', 'Snur pentru ecuson cu imprimare logo', 'promoțional', ['Personalizare textile', 'Branding produse'], ['7311'], 'Lanyard-ul e achiziționat, personalizarea realizată intern.', { suitable: ['conferințe', 'evenimente', 'office'], kits: true }),
  p('Rucsac personalizat', 'Produse outdoor', 'Rucsac practic cu broderie sau print logo', 'promoțional', ['Personalizare textile', 'Branding produse'], ['7311'], 'Rucsacul e achiziționat, personalizarea realizată intern.', { suitable: ['onboarding', 'outdoor', 'team building'], kits: true }),
  p('Geantă conferință brandată', 'Produse outdoor', 'Geantă laptop/conferință cu logo', 'promoțional', ['Personalizare textile', 'Branding produse'], ['7311'], 'Geanta e achiziționată, brandingul aplicat intern.', { suitable: ['conferințe', 'onboarding', 'cadouri'], kits: true }),
  p('Pelerină ploaie brandată', 'Produse outdoor', 'Pelerină de ploaie cu print logo', 'promoțional', ['Branding produse'], ['7311'], 'Pelerina e achiziționată, brandingul aplicat intern.', { suitable: ['evenimente outdoor', 'festivaluri'], kits: true }),
  p('Borseta personalizată', 'Produse outdoor', 'Borsetă cu imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Borseta e achiziționată, brandingul aplicat intern.', { suitable: ['evenimente', 'outdoor', 'festivaluri'], kits: true }),
  p('Cooler bag brandat', 'Produse outdoor', 'Geantă frigorifică cu imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Cooler bag-ul e achiziționat, brandingul aplicat intern.', { suitable: ['team building', 'outdoor', 'cadouri'], kits: true }),
  p('Evantai personalizat', 'Produse outdoor', 'Evantai pliabil cu print logo', 'promoțional', ['Branding produse', 'Tipărire materiale'], ['7311', '1812'], 'Evantaiul e achiziționat, printul aplicat intern.', { suitable: ['evenimente vara', 'festivaluri'], kits: true }),

  // ══════════ PRODUSE EVENIMENTE ══════════
  p('Badge ecuson personalizat', 'Produse evenimente', 'Badge cu print nume și logo', 'print', ['Tipărire materiale', 'Branding produse'], ['1812', '7311'], 'Badge-ul e tipărit și brandat intern.', { suitable: ['conferințe', 'evenimente', 'office'], kits: true }),
  p('Brățară eveniment brandată', 'Produse evenimente', 'Brățară textilă cu logo țesut', 'promoțional', ['Personalizare textile', 'Branding produse'], ['7311'], 'Brățara e achiziționată, personalizarea realizată intern.', { suitable: ['festivaluri', 'team building'], kits: true }),
  p('Diplome personalizate', 'Produse evenimente', 'Diplome și certificate pe hârtie premium', 'print', ['Tipărire materiale', 'Realizare papetărie'], ['1812', '1723'], 'Diplomele sunt tipărite și realizate intern.', { suitable: ['training', 'conferințe', 'recunoaștere'], kits: true }),
  p('Invitații personalizate', 'Produse evenimente', 'Invitații corporate pe hârtie specială', 'print', ['Tipărire materiale', 'Realizare papetărie'], ['1812', '1723'], 'Invitațiile sunt tipărite și realizate intern.', { suitable: ['evenimente', 'protocol', 'lansări'], kits: true }),
  p('Meniu personalizat eveniment', 'Produse evenimente', 'Meniuri tipărite pe carton de calitate', 'print', ['Tipărire materiale'], ['1812'], 'Meniurile sunt tipărite intern.', { suitable: ['gale', 'protocol', 'evenimente corporate'], kits: true }),
  p('Program eveniment tipărit', 'Produse evenimente', 'Program/agenda eveniment în format pliant', 'print', ['Tipărire materiale', 'Legătorie'], ['1812', '1814'], 'Programul e tipărit și finisat intern.', { suitable: ['conferințe', 'gale', 'evenimente'], kits: true }),
  p('Ecusoane magnetice brandate', 'Produse evenimente', 'Ecusoane cu magnet și print personalizat', 'promoțional', ['Tipărire materiale', 'Branding produse'], ['1812', '7311'], 'Ecusoanele sunt tipărite și branduite intern.', { suitable: ['conferințe', 'office', 'evenimente'], kits: true }),
  p('Felicitări corporate personalizate', 'Produse evenimente', 'Felicitări pentru sărbători sau ocazii speciale', 'print', ['Tipărire materiale', 'Realizare papetărie'], ['1812', '1723'], 'Felicitările sunt tipărite și realizate intern.', { suitable: ['sărbători', 'protocol', 'cadouri'], kits: true }),
  p('Numere masă personalizate', 'Produse evenimente', 'Numere de masă cu design corporate', 'print', ['Tipărire materiale'], ['1812'], 'Numerele de masă sunt tipărite intern.', { suitable: ['gale', 'conferințe', 'evenimente'], kits: true }),

  // ══════════ MATERIALE PRINT ══════════
  p('Flyere A5 full-color', 'Materiale print', 'Flyere promoționale full-color, dubla față', 'print', ['Tipărire materiale'], ['1812'], 'Flyerele sunt tipărite integral intern.', { suitable: ['marketing', 'campanii', 'retail'], kits: true }),
  p('Broșuri tri-fold', 'Materiale print', 'Broșuri pliate în 3 părți cu design premium', 'print', ['Tipărire materiale', 'Legătorie'], ['1812', '1814'], 'Broșurile sunt tipărite și finisate intern.', { suitable: ['sales', 'marketing', 'conferințe'], kits: true }),
  p('Catalog produse/servicii', 'Materiale print', 'Catalog complet tipărit și legat', 'print', ['Tipărire materiale', 'Legătorie'], ['1812', '1814'], 'Catalogul e tipărit și legat intern.', { suitable: ['sales', 'conferințe', 'retail'], kits: true }),
  p('Postere A2/A1', 'Materiale print', 'Postere mari format pentru interior', 'print', ['Tipărire materiale'], ['1812'], 'Posterele sunt tipărite intern.', { suitable: ['office', 'marketing', 'branding'], kits: true }),
  p('Calendar birou personalizat', 'Materiale print', 'Calendar de birou cu design corporate', 'print', ['Tipărire materiale', 'Legătorie'], ['1812', '1814'], 'Calendarul e tipărit și legat intern.', { suitable: ['cadouri', 'office', 'marketing'], kits: true }),
  p('Calendar perete personalizat', 'Materiale print', 'Calendar de perete format mare', 'print', ['Tipărire materiale', 'Legătorie'], ['1812', '1814'], 'Calendarul e tipărit și legat intern.', { suitable: ['cadouri', 'office', 'marketing'], kits: true }),
  p('Cărți de vizită premium', 'Materiale print', 'Cărți de vizită pe hârtie premium', 'print', ['Tipărire materiale'], ['1812'], 'Cărțile de vizită sunt tipărite intern.', { suitable: ['sales', 'protocol', 'management'], departments: ['Management', 'Marketing'], kits: true }),
  p('Etichete autoadezive personalizate', 'Materiale print', 'Etichete cu design și print personalizat', 'print', ['Tipărire materiale'], ['1812'], 'Etichetele sunt tipărite integral intern.', { suitable: ['ambalare', 'marketing', 'retail'], kits: true }),
  p('Stickere personalizate', 'Materiale print', 'Stickere decupate cu logo și design', 'print', ['Tipărire materiale'], ['1812'], 'Stickerele sunt tipărite intern.', { suitable: ['marketing', 'evenimente', 'retail'], kits: true }),
  p('Hârtie cu antet brandată', 'Materiale print', 'Hârtie de scrisori cu antet corporate', 'print', ['Tipărire materiale'], ['1812'], 'Hârtia cu antet e tipărită intern.', { suitable: ['corespondență', 'protocol'], departments: ['Management', 'Achiziții'] }),

  // ══════════ MATERIALE EXPOZIȚIONALE ══════════
  p('Roll-up standard', 'Materiale expoziționale', 'Roll-up 85x200cm cu grafică personalizată', 'vizual', ['Tipărire materiale', 'Montaj materiale promo'], ['1812', '7311'], 'Grafica e tipărită și montată intern.', { suitable: ['conferințe', 'showroom', 'evenimente'], kits: true }),
  p('Roll-up premium dublu', 'Materiale expoziționale', 'Roll-up dublu 120x200cm', 'vizual', ['Tipărire materiale', 'Montaj materiale promo'], ['1812', '7311'], 'Grafica e tipărită și montată intern pe structură premium.', { suitable: ['evenimente', 'showroom'], kits: true }),
  p('Banner interior', 'Materiale expoziționale', 'Banner PVC pentru spații interioare', 'vizual', ['Tipărire materiale', 'Montaj materiale promo'], ['1812', '7311'], 'Bannerul e tipărit și montat intern.', { suitable: ['office', 'evenimente', 'marketing'], kits: true }),
  p('Banner exterior', 'Materiale expoziționale', 'Banner mesh rezistent pentru exterior', 'vizual', ['Tipărire materiale', 'Montaj materiale promo'], ['1812', '7311'], 'Bannerul e tipărit și montat intern.', { suitable: ['evenimente outdoor', 'marketing'], kits: true }),
  p('Panou expozițional portabil', 'Materiale expoziționale', 'Panou modular pentru expo și standuri', 'vizual', ['Tipărire materiale', 'Montaj materiale promo'], ['1812', '7311'], 'Grafica e tipărită și montată intern.', { suitable: ['expoziții', 'conferințe'], kits: true }),
  p('Steag publicitar', 'Materiale expoziționale', 'Beach flag cu print personalizat', 'vizual', ['Tipărire materiale', 'Montaj materiale promo'], ['1812', '7311'], 'Steagul e tipărit și montat intern.', { suitable: ['evenimente outdoor', 'retail', 'auto'], kits: true }),
  p('Totem publicitar', 'Materiale expoziționale', 'Totem carton sau PVC cu grafică', 'vizual', ['Tipărire materiale', 'Montaj materiale promo'], ['1812', '7311'], 'Totemul e tipărit și asamblat intern.', { suitable: ['retail', 'evenimente', 'showroom'], kits: true }),
  p('Display de masă', 'Materiale expoziționale', 'Display info de masă cu print personalizat', 'vizual', ['Tipărire materiale', 'Montaj materiale promo'], ['1812', '7311'], 'Display-ul e tipărit și asamblat intern.', { suitable: ['conferințe', 'hospitality', 'retail'], kits: true }),

  // ══════════ CADOURI CORPORATE ══════════
  p('Cutie cadou brandată', 'Cadouri corporate', 'Cutie cadou rigidă cu imprimare logo', 'promoțional', ['Tipărire materiale', 'Branding produse', 'Ambalare kituri'], ['1812', '7311'], 'Cutia e achiziționată, branding și etichetare realizate intern.', { suitable: ['protocol', 'cadouri', 'sărbători'], kits: true }),
  p('Set cadou executive', 'Cadouri corporate', 'Set agendă + pix + cană în cutie elegantă', 'kit', ['Realizare papetărie', 'Legătorie', 'Branding produse', 'Ambalare kituri'], ['1723', '1814', '7311'], 'Agenda e realizată intern, totul brandat și ambalat.', { suitable: ['protocol', 'management', 'VIP'], kits: true }),
  p('Set cadou eco', 'Cadouri corporate', 'Set eco: pix bambus + blocnotes reciclat + sacosă', 'kit', ['Realizare papetărie', 'Branding produse', 'Ambalare kituri'], ['1723', '7311'], 'Blocnotes-ul e realizat intern, kitul asamblat intern.', { suitable: ['CSR', 'cadouri eco', 'protocol'], kits: true }),
  p('Breloc metalic brandat', 'Cadouri corporate', 'Breloc metalic cu gravură logo', 'promoțional', ['Branding produse'], ['7311'], 'Brelocul e achiziționat, gravura realizată intern.', { suitable: ['conferințe', 'cadouri', 'onboarding'], kits: true }),
  p('Port-card personalizat', 'Cadouri corporate', 'Port-card din piele ecologică cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Port-cardul e achiziționat, brandingul aplicat intern.', { suitable: ['cadouri', 'protocol', 'onboarding'], kits: true }),
  p('Port-vizit metalic', 'Cadouri corporate', 'Port-cărți de vizită metalic cu gravură', 'promoțional', ['Branding produse'], ['7311'], 'Port-vizitul e achiziționat, gravura realizată intern.', { suitable: ['protocol', 'sales', 'management'], departments: ['Management'] }),
  p('Portofel călătorie brandat', 'Cadouri corporate', 'Portofel de călătorie cu logo imprimat', 'promoțional', ['Branding produse'], ['7311'], 'Portofelul e achiziționat, brandingul aplicat intern.', { suitable: ['cadouri', 'protocol', 'management'], kits: true }),
  p('Set birou premium', 'Cadouri corporate', 'Set organizator + suport pixuri + agendă brandată', 'kit', ['Realizare papetărie', 'Branding produse', 'Ambalare kituri'], ['1723', '7311'], 'Agenda e realizată intern, setul brandat și ambalat intern.', { suitable: ['cadouri', 'protocol', 'onboarding management'], kits: true }),

  // ══════════ PRODUSE LIFESTYLE ══════════
  p('Magnet frigider personalizat', 'Produse lifestyle', 'Magnet cu design și logo personalizat', 'promoțional', ['Branding produse', 'Tipărire materiale'], ['7311', '1812'], 'Magnetul e achiziționat, printul aplicat intern.', { suitable: ['marketing', 'cadouri', 'evenimente'], kits: true }),
  p('Puzzle personalizat', 'Produse lifestyle', 'Puzzle cu imagine corporate sau design custom', 'promoțional', ['Tipărire materiale', 'Branding produse'], ['1812', '7311'], 'Puzzle-ul e achiziționat, printul aplicat intern.', { suitable: ['cadouri', 'team building', 'CSR'], kits: true }),
  p('Oglindă de poșetă brandată', 'Produse lifestyle', 'Oglindă compactă cu logo pe capac', 'promoțional', ['Branding produse'], ['7311'], 'Oglinda e achiziționată, brandingul aplicat intern.', { suitable: ['cadouri', 'marketing', 'evenimente femei'], kits: true }),
  p('Casetă Bluetooth brandată', 'Produse lifestyle', 'Boxă Bluetooth portabilă cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Boxa e achiziționată, brandingul aplicat intern.', { suitable: ['cadouri premium', 'management', 'conferințe'], kits: true }),
  p('Brățară fitness brandată', 'Produse lifestyle', 'Brățară de activitate cu logo pe cataramă', 'promoțional', ['Branding produse'], ['7311'], 'Brățara e achiziționată, brandingul aplicat intern.', { suitable: ['cadouri', 'wellness', 'onboarding'], kits: true }),
  p('Ochelari soare personalizați', 'Produse lifestyle', 'Ochelari de soare cu logo pe brat', 'promoțional', ['Branding produse'], ['7311'], 'Ochelarii sunt achiziționați, brandingul aplicat intern.', { suitable: ['evenimente vara', 'festivaluri', 'outdoor'], kits: true }),
  p('Ceas sport brandat', 'Produse lifestyle', 'Ceas sport cu logo pe cadran', 'promoțional', ['Branding produse'], ['7311'], 'Ceasul e achiziționat, brandingul aplicat intern.', { suitable: ['cadouri premium', 'protocol', 'management'], kits: false }),
  p('Suport auto telefon brandat', 'Produse lifestyle', 'Suport auto cu logo imprimat', 'promoțional', ['Branding produse'], ['7311'], 'Suportul e achiziționat, brandingul aplicat intern.', { suitable: ['cadouri', 'auto', 'logistică'], kits: true, industries: ['Automotive', 'Logistică'] }),

  // ══════════ PRODUSE PROTOCOL ══════════
  p('Set protocol VIP', 'Produse protocol', 'Set premium: agendă piele + roller + mapă + cană', 'kit', ['Realizare papetărie', 'Legătorie', 'Branding produse', 'Ambalare kituri'], ['1723', '1814', '7311'], 'Agenda și mapa realizate intern, totul brandat și ambalat premium.', { suitable: ['protocol', 'management VIP'], departments: ['Management'], kits: true }),
  p('Trofeu plexiglas personalizat', 'Produse protocol', 'Trofeu/premiu din plexiglas cu gravură', 'promoțional', ['Branding produse'], ['7311'], 'Trofeul e achiziționat, gravura realizată intern.', { suitable: ['premiere', 'gale', 'recunoaștere'], kits: false }),
  p('Plachetă recunoaștere', 'Produse protocol', 'Plachetă metalică sau lemn cu gravură', 'promoțional', ['Branding produse'], ['7311'], 'Placheta e achiziționată, gravura realizată intern.', { suitable: ['premiere', 'pensionare', 'aniversări'], kits: false }),
  p('Medalion personalizat', 'Produse protocol', 'Medalion metalic cu design custom', 'promoțional', ['Branding produse'], ['7311'], 'Medalionul e achiziționat, personalizarea realizată intern.', { suitable: ['premiere', 'competiții', 'recunoaștere'], kits: false }),
  p('Insignă metalică brandată', 'Produse protocol', 'Insignă/pin metalic cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Insigna e achiziționată, brandingul aplicat intern.', { suitable: ['protocol', 'uniformă', 'conferințe'], kits: true }),
  p('Fond de scenă brandat', 'Produse protocol', 'Backdrop/fond scenă cu grafică personalizată', 'vizual', ['Tipărire materiale', 'Montaj materiale promo'], ['1812', '7311'], 'Fundalul e tipărit și montat intern.', { suitable: ['gale', 'conferințe', 'evenimente'], kits: false }),

  // ══════════ PRODUSE PENTRU KITURI ══════════
  p('Welcome card personalizat', 'Produse pentru kituri', 'Card de bun venit personalizat', 'print', ['Tipărire materiale', 'Realizare papetărie'], ['1812', '1723'], 'Cardul e tipărit și realizat intern.', { suitable: ['onboarding', 'welcome kit'], departments: ['HR'], kits: true }),
  p('Ghid angajat tipărit', 'Produse pentru kituri', 'Ghid de onboarding pentru angajați noi', 'print', ['Tipărire materiale', 'Legătorie'], ['1812', '1814'], 'Ghidul e tipărit și legat intern.', { suitable: ['onboarding', 'HR'], departments: ['HR'], kits: true }),
  p('Card beneficii personalizat', 'Produse pentru kituri', 'Card cu beneficiile angajatului', 'print', ['Tipărire materiale'], ['1812'], 'Cardul e tipărit intern.', { suitable: ['onboarding', 'HR'], departments: ['HR'], kits: true }),
  p('Etichetă kit personalizată', 'Produse pentru kituri', 'Etichetă pentru cutia de kit', 'print', ['Tipărire materiale'], ['1812'], 'Eticheta e tipărită intern.', { suitable: ['kituri', 'ambalare'], kits: true }),
  p('Cutie kit personalizată', 'Produse pentru kituri', 'Cutie de carton cu imprimare pentru kituri', 'ambalaj', ['Tipărire materiale', 'Branding produse'], ['1812', '7311'], 'Cutia e achiziționată, brandingul aplicat intern.', { suitable: ['kituri', 'ambalare'], kits: true }),
  p('Insert carton kit', 'Produse pentru kituri', 'Insert organizator din carton pentru kit', 'ambalaj', ['Tipărire materiale'], ['1812'], 'Insert-ul e produs și tipărit intern.', { suitable: ['kituri', 'ambalare'], kits: true }),
  p('Tissue paper brandat', 'Produse pentru kituri', 'Hârtie tissue cu logo pentru ambalare', 'ambalaj', ['Tipărire materiale', 'Branding produse'], ['1812', '7311'], 'Hârtia tissue e achiziționată, brandingul aplicat intern.', { suitable: ['kituri', 'ambalare premium'], kits: true }),
  p('Panglică satinată brandată', 'Produse pentru kituri', 'Panglică cu logo imprimat', 'ambalaj', ['Branding produse'], ['7311'], 'Panglica e achiziționată, brandingul aplicat intern.', { suitable: ['kituri premium', 'cadouri', 'protocol'], kits: true }),

  // ══════════ PRODUSE PROMO DIVERSE ══════════
  p('Bricheta personalizată', 'Produse promo diverse', 'Brichetă cu imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Bricheta e achiziționată, brandingul aplicat intern.', { suitable: ['evenimente', 'marketing'], kits: true }),
  p('Deschizător sticle brandat', 'Produse promo diverse', 'Deschizător metalic cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Deschizătorul e achiziționat, brandingul aplicat intern.', { suitable: ['evenimente', 'cadouri', 'hospitality'], kits: true }),
  p('Joc cărți personalizat', 'Produse promo diverse', 'Pachet cărți de joc cu design personalizat', 'promoțional', ['Tipărire materiale', 'Branding produse'], ['1812', '7311'], 'Cărțile sunt tipărite intern.', { suitable: ['team building', 'cadouri', 'evenimente'], kits: true }),
  p('Frisbee personalizat', 'Produse promo diverse', 'Frisbee cu imprimare logo full-color', 'promoțional', ['Branding produse'], ['7311'], 'Frisbee-ul e achiziționat, brandingul aplicat intern.', { suitable: ['team building', 'outdoor', 'familii'], kits: true }),
  p('Minge antistres brandată', 'Produse promo diverse', 'Minge antistres cu logo imprimat', 'promoțional', ['Branding produse'], ['7311'], 'Mingea e achiziționată, brandingul aplicat intern.', { suitable: ['office', 'onboarding', 'conferințe'], kits: true }),
  p('Periuță dinți brandată', 'Produse promo diverse', 'Periuță cu logo pe mâner, pentru kituri hotel', 'promoțional', ['Branding produse'], ['7311'], 'Periuța e achiziționată, brandingul aplicat intern.', { suitable: ['hospitality', 'kituri hotel'], kits: true, industries: ['Hospitality'] }),
  p('Kit prim-ajutor brandat', 'Produse promo diverse', 'Kit compact de prim-ajutor cu logo', 'promoțional', ['Branding produse', 'Ambalare kituri'], ['7311'], 'Kitul e achiziționat, brandat și ambalat intern.', { suitable: ['teren', 'auto', 'outdoor'], kits: true }),
  p('Bicicletă reflectorizant brandat', 'Produse promo diverse', 'Reflectorizant personalizat pentru bicicletă', 'promoțional', ['Branding produse'], ['7311'], 'Reflectorizantul e achiziționat, brandingul aplicat intern.', { suitable: ['CSR', 'eco', 'siguranță rutieră'], kits: true }),

  // ══════════ PRODUSE PENTRU HR / ONBOARDING ══════════
  p('Kit HR Welcome Simplu', 'Produse pentru HR / onboarding', 'Pachet minimal: welcome card + pix + blocnotes', 'kit', ['Tipărire materiale', 'Realizare papetărie', 'Branding produse', 'Ambalare kituri'], ['1812', '1723', '7311'], 'Componentele sunt realizate intern, kitul asamblat de echipa noastră.', { suitable: ['onboarding'], departments: ['HR'], kits: true }),
  p('Ecuson personalizat angajat', 'Produse pentru HR / onboarding', 'Ecuson cu foto și date angajat', 'print', ['Tipărire materiale'], ['1812'], 'Ecusonul e tipărit intern.', { suitable: ['onboarding', 'office'], departments: ['HR'], kits: true }),
  p('Mapă onboarding', 'Produse pentru HR / onboarding', 'Mapă cu toate documentele de bun venit', 'papetărie', ['Realizare papetărie', 'Tipărire materiale'], ['1723', '1812'], 'Mapa e realizată și tipărită intern.', { suitable: ['onboarding'], departments: ['HR'], kits: true }),
  p('Checklist onboarding tipărit', 'Produse pentru HR / onboarding', 'Checklist de integrare pe hârtie brandată', 'print', ['Tipărire materiale'], ['1812'], 'Checklist-ul e tipărit intern.', { suitable: ['onboarding'], departments: ['HR'], kits: true }),
  p('Poster valori companie', 'Produse pentru HR / onboarding', 'Poster A2 cu valorile și cultura companiei', 'print', ['Tipărire materiale'], ['1812'], 'Posterul e tipărit intern.', { suitable: ['onboarding', 'office', 'employer branding'], departments: ['HR', 'Marketing'], kits: true }),
  p('Sticker laptop de bun venit', 'Produse pentru HR / onboarding', 'Sticker brandat de aplicat pe laptop', 'print', ['Tipărire materiale'], ['1812'], 'Stickerul e tipărit intern.', { suitable: ['onboarding', 'IT'], departments: ['HR'], kits: true }),
  p('Card acces personalizat', 'Produse pentru HR / onboarding', 'Card access cu design corporate', 'print', ['Tipărire materiale'], ['1812'], 'Cardul e tipărit intern.', { suitable: ['onboarding', 'office'], departments: ['HR'], kits: true }),
  p('Plic welcome kit brandat', 'Produse pentru HR / onboarding', 'Plic special pentru kit de bun venit', 'ambalaj', ['Tipărire materiale', 'Branding produse'], ['1812', '7311'], 'Plicul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding'], departments: ['HR'], kits: true }),

  // ══════════ PRODUSE PENTRU MARKETING ══════════
  p('Broșură servicii A4', 'Produse pentru marketing', 'Broșură detaliată cu serviciile companiei', 'print', ['Tipărire materiale', 'Legătorie'], ['1812', '1814'], 'Broșura e tipărită și legată intern.', { suitable: ['sales', 'marketing', 'conferințe'], departments: ['Marketing'], kits: true }),
  p('Pliant promoțional DL', 'Produse pentru marketing', 'Pliant format DL, ideal pentru rack-uri', 'print', ['Tipărire materiale'], ['1812'], 'Pliantul e tipărit intern.', { suitable: ['marketing', 'retail', 'hospitality'], departments: ['Marketing'], kits: true }),
  p('Afiș campanie A3', 'Produse pentru marketing', 'Afiș promoțional format A3', 'print', ['Tipărire materiale'], ['1812'], 'Afișul e tipărit intern.', { suitable: ['campanii', 'retail', 'marketing'], departments: ['Marketing'], kits: true }),
  p('Insert promoțional', 'Produse pentru marketing', 'Insert în ambalaj sau colet cu oferte', 'print', ['Tipărire materiale'], ['1812'], 'Insert-ul e tipărit intern.', { suitable: ['retail', 'e-commerce', 'marketing'], departments: ['Marketing'], kits: true }),
  p('Voucher tipărit brandat', 'Produse pentru marketing', 'Voucher cadou pe carton premium', 'print', ['Tipărire materiale', 'Realizare papetărie'], ['1812', '1723'], 'Voucherul e tipărit și realizat intern.', { suitable: ['campanii', 'cadouri', 'retail'], departments: ['Marketing'], kits: true }),
  p('Bandă adezivă brandată', 'Produse pentru marketing', 'Bandă de ambalare cu logo imprimat', 'promoțional', ['Branding produse'], ['7311'], 'Banda e achiziționată, brandingul aplicat intern.', { suitable: ['ambalare', 'logistică', 'retail'], departments: ['Marketing', 'Achiziții'], kits: true }),
  p('Packaging personalizat', 'Produse pentru marketing', 'Ambalaj de prezentare cu design custom', 'ambalaj', ['Tipărire materiale', 'Branding produse'], ['1812', '7311'], 'Ambalajul e tipărit și brandat intern.', { suitable: ['retail', 'e-commerce', 'cadouri'], departments: ['Marketing'], kits: true }),
  p('QR code card personalizat', 'Produse pentru marketing', 'Card cu QR code pentru campanii digitale', 'print', ['Tipărire materiale'], ['1812'], 'Cardul e tipărit intern.', { suitable: ['marketing digital', 'campanii', 'retail'], departments: ['Marketing'], kits: true }),
  p('Flyer digital print', 'Produse pentru marketing', 'Flyer high-quality digital print pe hârtie lucioasă', 'print', ['Tipărire materiale'], ['1812'], 'Flyerul e tipărit intern pe echipament digital.', { suitable: ['marketing', 'campanii premium'], departments: ['Marketing'], kits: true }),

  // ══════════ PRODUSE PENTRU CONFERINȚE ══════════
  p('Badge holder personalizat', 'Produse pentru conferințe', 'Suport badge cu lanyard și print', 'promoțional', ['Personalizare textile', 'Tipărire materiale', 'Branding produse'], ['7311', '1812'], 'Lanyard-ul e personalizat intern, badge-ul tipărit intern.', { suitable: ['conferințe', 'evenimente'], departments: ['Marketing', 'HR'], kits: true }),
  p('Semnalistică eveniment', 'Produse pentru conferințe', 'Panouri indicatoare personalizate', 'vizual', ['Tipărire materiale', 'Montaj materiale promo'], ['1812', '7311'], 'Panourile sunt tipărite și montate intern.', { suitable: ['conferințe', 'evenimente'], departments: ['Marketing'], kits: true }),
  p('Kit speaker conferință', 'Produse pentru conferințe', 'Set materiale pentru speakeri: mapă + agendă + pix', 'kit', ['Realizare papetărie', 'Legătorie', 'Branding produse', 'Ambalare kituri'], ['1723', '1814', '7311'], 'Materialele sunt realizate intern, kitul asamblat de echipa noastră.', { suitable: ['conferințe'], departments: ['Marketing'], kits: true }),
  p('Certificat participare', 'Produse pentru conferințe', 'Certificat/diplomă pe hârtie premium', 'print', ['Tipărire materiale', 'Realizare papetărie'], ['1812', '1723'], 'Certificatul e tipărit și realizat intern.', { suitable: ['conferințe', 'training'], kits: true }),
  p('Agendă conferință', 'Produse pentru conferințe', 'Agendă de eveniment cu program inclus', 'papetărie', ['Realizare papetărie', 'Tipărire materiale', 'Legătorie'], ['1723', '1812', '1814'], 'Agenda e realizată integral intern.', { suitable: ['conferințe'], departments: ['Marketing'], kits: true }),
  p('Folder conferință', 'Produse pentru conferințe', 'Folder cu buzunare pentru materiale conferință', 'papetărie', ['Realizare papetărie', 'Tipărire materiale'], ['1723', '1812'], 'Folderul e realizat și tipărit intern.', { suitable: ['conferințe', 'evenimente'], kits: true }),
  p('Table tent personalizat', 'Produse pentru conferințe', 'Pliant de masă cu informații eveniment', 'print', ['Tipărire materiale'], ['1812'], 'Table tent-ul e tipărit intern.', { suitable: ['conferințe', 'hospitality'], kits: true }),

  // ══════════ PRODUSE TECH CORPORATE ══════════
  p('Webcam cover set brandat', 'Produse tech corporate', 'Set 3 webcam covers cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Cover-urile sunt achiziționate, brandingul aplicat intern.', { suitable: ['onboarding IT', 'securitate'], departments: ['HR', 'IT'], kits: true, industries: ['IT', 'Corporate', 'Financiar'] }),
  p('Suport cabluri brandat', 'Produse tech corporate', 'Organizator cabluri cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Suportul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding', 'office IT'], departments: ['HR'], kits: true, industries: ['IT', 'Corporate'] }),
  p('Port USB-C hub brandat', 'Produse tech corporate', 'Hub USB-C multiport cu imprimare logo', 'promoțional', ['Branding produse'], ['7311'], 'Hub-ul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding IT', 'cadouri tech'], kits: true, industries: ['IT', 'Telecom'] }),
  p('Încărcător wireless brandat', 'Produse tech corporate', 'Pad încărcare wireless cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Încărcătorul e achiziționat, brandingul aplicat intern.', { suitable: ['cadouri', 'onboarding', 'conferințe'], kits: true, industries: ['IT', 'Corporate', 'Telecom'] }),
  p('Tastatură cleanup kit brandat', 'Produse tech corporate', 'Kit curățare tastatură cu logo', 'promoțional', ['Branding produse', 'Ambalare kituri'], ['7311'], 'Kitul e achiziționat, brandat și ambalat intern.', { suitable: ['onboarding IT', 'office'], kits: true, industries: ['IT', 'Corporate'] }),
  p('Stick USB-C brandat', 'Produse tech corporate', 'USB-C stick cu gravură logo', 'promoțional', ['Branding produse'], ['7311'], 'Stick-ul e achiziționat, gravura realizată intern.', { suitable: ['conferințe IT', 'onboarding'], kits: true, industries: ['IT', 'Telecom', 'Corporate'] }),
  p('Cablu multi-connector brandat', 'Produse tech corporate', 'Cablu de încărcare 3-in-1 cu logo', 'promoțional', ['Branding produse'], ['7311'], 'Cablul e achiziționat, brandingul aplicat intern.', { suitable: ['onboarding', 'conferințe', 'cadouri tech'], kits: true, industries: ['IT', 'Corporate', 'Telecom'] }),
  p('Adaptor călătorie brandat', 'Produse tech corporate', 'Adaptor universal cu logo imprimat', 'promoțional', ['Branding produse'], ['7311'], 'Adaptorul e achiziționat, brandingul aplicat intern.', { suitable: ['cadouri', 'călătorii de afaceri'], kits: true, industries: ['Corporate', 'IT'] }),
];
