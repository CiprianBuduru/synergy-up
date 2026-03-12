import type { Operation, Alternative } from '@/types';

export const seedOperations: Operation[] = [
  { id: 'op1', name: 'Personalizare textile', description: 'Personalizare tricouri, hanorace, șepci și alte materiale textile prin serigrafie, broderie sau transfer termic', caen_code: '7311', active: true },
  { id: 'op2', name: 'Tipărire materiale', description: 'Tipărire flyere, broșuri, cataloage, postere, bannere și alte materiale de comunicare', caen_code: '1812', active: true },
  { id: 'op3', name: 'Legătorie', description: 'Legătorie cărți, agende, cataloage și alte materiale tipărite', caen_code: '1814', active: true },
  { id: 'op4', name: 'Montaj materiale promo', description: 'Asamblare și montaj roll-up-uri, bannere, display-uri și alte materiale promoționale', caen_code: '7311', active: true },
  { id: 'op5', name: 'Ambalare kituri', description: 'Ambalare și compunere kituri din diverse produse, etichetare și pregătire pentru livrare', caen_code: '1812', active: true },
  { id: 'op6', name: 'Branding produse', description: 'Aplicare identitate vizuală pe produse diverse prin diverse metode de personalizare', caen_code: '7311', active: true },
  { id: 'op7', name: 'Realizare papetărie', description: 'Producție articole de papetărie: agende, blocnotes, mape, plicuri personalizate', caen_code: '1723', active: true },
  { id: 'op8', name: 'Pregătire materiale promo', description: 'Pregătire, sortare și ambalare materiale promoționale pentru campanii și evenimente', caen_code: '7311', active: true },
];

export const seedAlternatives: Alternative[] = [
  { id: 'a1', source_request_keyword: 'laptop', suggested_product_or_kit: 'Office Starter Kit', explanation: 'Laptopurile nu pot fi personalizate intern. Propunem un Office Starter Kit cu accesorii branduite: husă personalizată, mousepad brandat, agendă și papetărie.', relevance_tags_json: ['IT', 'onboarding', 'office'], active: true },
  { id: 'a2', source_request_keyword: 'mobilier', suggested_product_or_kit: 'Office Branding Kit', explanation: 'Mobilierul nu intră sub operațiunile autorizate. Propunem un kit de branding office: signalistică internă, papetărie, materiale print pentru birou.', relevance_tags_json: ['office', 'branding', 'signalistică'], active: true },
  { id: 'a3', source_request_keyword: 'telefon', suggested_product_or_kit: 'Onboarding Kit', explanation: 'Telefoanele nu sunt eligibile. Propunem un Onboarding Kit complet cu materiale personalizate.', relevance_tags_json: ['IT', 'onboarding', 'HR'], active: true },
  { id: 'a4', source_request_keyword: 'software', suggested_product_or_kit: 'Branded Print Kit', explanation: 'Licențele software nu sunt eligibile. Propunem materiale tipărite pentru training și documentație.', relevance_tags_json: ['IT', 'training', 'documentație'], active: true },
  { id: 'a5', source_request_keyword: 'cursuri', suggested_product_or_kit: 'Conference Kit', explanation: 'Cursurile nu intră în operațiuni autorizate. Propunem materiale de conferință pentru participanți.', relevance_tags_json: ['training', 'educație', 'HR'], active: true },
  { id: 'a6', source_request_keyword: 'echipamente', suggested_product_or_kit: 'Office Starter Kit + Branded Print Kit', explanation: 'Echipamentele tehnice nu sunt eligibile. Propunem kituri de birou branduite și materiale print corporate.', relevance_tags_json: ['office', 'branding', 'onboarding'], active: true },
  { id: 'a7', source_request_keyword: 'catering', suggested_product_or_kit: 'Event Kit', explanation: 'Cateringul nu este eligibil. Propunem materiale de eveniment: mape, flyere, badge-uri, bannere.', relevance_tags_json: ['evenimente', 'marketing'], active: true },
  { id: 'a8', source_request_keyword: 'transport', suggested_product_or_kit: 'Branded Print Kit', explanation: 'Serviciile de transport nu sunt eligibile. Propunem materiale tipărite și promoționale branduite.', relevance_tags_json: ['logistică', 'branding'], active: true },
  { id: 'a9', source_request_keyword: 'gadgeturi', suggested_product_or_kit: 'Promo Kit personalizat', explanation: 'Gadgeturile electronice nu sunt de regulă eligibile. Propunem un kit promo cu articole branduite eligibile.', relevance_tags_json: ['promoționale', 'marketing', 'onboarding'], active: true },
  { id: 'a10', source_request_keyword: 'servicii consultanță', suggested_product_or_kit: 'Branded Print Kit + Conference Kit', explanation: 'Serviciile de consultanță nu sunt eligibile. Propunem materiale print și kituri de conferință.', relevance_tags_json: ['consulting', 'corporate'], active: true },
  { id: 'a11', source_request_keyword: 'bilete eveniment', suggested_product_or_kit: 'Event Kit', explanation: 'Biletele la evenimente nu sunt eligibile. Dar materialele de eveniment sunt: badge-uri, mape, bannere.', relevance_tags_json: ['evenimente', 'marketing'], active: true },
  { id: 'a12', source_request_keyword: 'abonamente', suggested_product_or_kit: 'HR Kit', explanation: 'Abonamentele nu sunt eligibile. Propunem materiale HR branduite pentru angajați.', relevance_tags_json: ['HR', 'beneficii'], active: true },
  { id: 'a13', source_request_keyword: 'tabletă', suggested_product_or_kit: 'Onboarding Kit', explanation: 'Tabletele nu sunt eligibile. Propunem un kit de onboarding cu produse personalizate.', relevance_tags_json: ['IT', 'onboarding'], active: true },
  { id: 'a14', source_request_keyword: 'uniforme', suggested_product_or_kit: 'Tricouri și Textile personalizate', explanation: 'Uniformele complete pot fi neeligibile, dar articolele textile personalizate intern sunt eligibile.', relevance_tags_json: ['textile', 'HR', 'branding'], active: true },
  { id: 'a15', source_request_keyword: 'cadouri electronice', suggested_product_or_kit: 'Pachet Cadou Corporate', explanation: 'Electronicele nu sunt eligibile ca atare. Propunem pachete cadou corporate cu produse eligibile personalizate.', relevance_tags_json: ['cadouri', 'protocol', 'corporate'], active: true },
];
