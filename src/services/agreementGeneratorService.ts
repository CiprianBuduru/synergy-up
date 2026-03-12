// ─── Agreement Generator Service ─────────────────────────────────────
// Generates a partnership agreement draft.

import type { Company } from '@/types';

export interface AgreementData {
  title: string;
  date: string;
  sections: { heading: string; content: string }[];
  company_name: string;
  company_address: string;
  contact_name: string;
}

export function generateAgreement(company: Company, serviceCategories: string[]): AgreementData {
  const today = new Date().toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' });
  const serviceCatText = serviceCategories.length > 0
    ? serviceCategories.join(', ')
    : 'tipărire, personalizare, producție materiale publicitare, articole de papetărie';

  return {
    title: 'ACORD CADRU DE PARTENERIAT',
    date: today,
    company_name: company.company_name,
    company_address: company.location || '—',
    contact_name: company.contact_name || '—',
    sections: [
      {
        heading: '1. Părțile contractante',
        content: `Prezentul acord se încheie între:\n\nEqual Up S.R.L., unitate protejată autorizată, cu sediul în București, România,\nși\n${company.company_name}${company.legal_name ? ` (${company.legal_name})` : ''}, cu sediul în ${company.location || '—'},\nreprezentată de ${company.contact_name || '—'}, ${company.contact_role || 'reprezentant legal'}.`,
      },
      {
        heading: '2. Obiectul colaborării',
        content: `Obiectul prezentului acord îl constituie furnizarea de produse și servicii eligibile prin mecanismul unităților protejate autorizate, conform legislației în vigoare.\n\nPrin această colaborare, ${company.company_name} poate transforma obligația legală prevăzută de Legea 448/2006 într-un buget utilizabil pentru produse și servicii corporate utile.`,
      },
      {
        heading: '3. Servicii eligibile',
        content: `Categoriile de servicii acoperite prin prezentul acord includ:\n\n${serviceCatText}\n\nAceste servicii sunt realizate în baza codurilor CAEN autorizate:\n• 7311 – Publicitate\n• 1812 – Alte activități de tipărire\n• 1814 – Legătorie și servicii conexe\n• 1723 – Fabricarea articolelor de papetărie`,
      },
      {
        heading: '4. Modalitatea de colaborare',
        content: `Colaborarea se desfășoară după următorul flux:\n\n1. Identificarea produselor sau kiturilor relevante\n2. Confirmarea eligibilității și a volumului estimat\n3. Transmiterea comenzii și a specificațiilor\n4. Producția și livrarea produselor\n5. Facturarea conform acordului de parteneriat\n\nFacturarea se realizează cu respectarea prevederilor legale privind unitățile protejate autorizate.`,
      },
      {
        heading: '5. Durata acordului',
        content: 'Prezentul acord se încheie pe o perioadă nedeterminată, cu posibilitatea de reziliere de către oricare dintre părți cu un preaviz de 30 de zile calendaristice.',
      },
      {
        heading: '6. Dispoziții finale',
        content: 'Prezentul acord reprezintă un cadru general de colaborare. Detaliile specifice fiecărei comenzi (produse, cantități, termene, prețuri) vor fi stabilite prin comenzi individuale anexate la prezentul acord.\n\nOrice modificare a prezentului acord se face prin act adițional semnat de ambele părți.',
      },
    ],
  };
}

export function agreementToText(data: AgreementData): string {
  let text = `${data.title}\n\nData: ${data.date}\n\n`;
  for (const section of data.sections) {
    text += `${section.heading}\n\n${section.content}\n\n`;
  }
  text += `\n\nEqual Up S.R.L.\t\t\t${data.company_name}\nReprezentant legal\t\t\t${data.contact_name}\n`;
  return text;
}
