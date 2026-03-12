import type { Presentation, Slide, Brief, CalculationSnapshot } from '@/types';

export const seedPresentations: Presentation[] = [
  { id: 'pr1', company_id: '1', brief_id: null, title: 'Prezentare TechVision - Onboarding Solutions', objective: 'Prezentarea soluțiilor de onboarding eligibile pentru TechVision Solutions', tone: 'corporate', status: 'presentation_generated', generated_summary: 'Prezentare personalizată pentru TechVision cu focus pe onboarding kits și materiale HR.', created_at: '2024-03-01', updated_at: '2024-03-10' },
  { id: 'pr2', company_id: '4', brief_id: null, title: 'Prezentare FinServ - Event & Marketing Materials', objective: 'Prezentarea materialelor de marketing și eveniment eligibile pentru FinServ', tone: 'premium', status: 'sent', generated_summary: 'Prezentare premium pentru FinServ cu focus pe materiale de marketing și kituri de eveniment.', created_at: '2024-03-05', updated_at: '2024-03-12' },
  { id: 'pr3', company_id: '2', brief_id: null, title: 'Prezentare CargoExpress - Welcome Kits', objective: 'Propunere welcome kits pentru noii angajați CargoExpress', tone: 'friendly', status: 'draft', generated_summary: 'Prezentare cu focus pe welcome kits și materiale de onboarding.', created_at: '2024-03-08', updated_at: '2024-03-08' },
];

export const seedBriefs: Brief[] = [
  { id: 'b1', company_id: '1', raw_brief: 'Avem nevoie de materiale pentru onboarding — tricouri, agende, welcome cards.', requested_products_json: ['tricouri', 'agende', 'welcome cards'], requested_purpose: 'Onboarding angajați noi', target_audience: 'Angajați noi', department_detected: 'HR', tone_recommended: 'friendly', eligibility_status: 'eligible', created_at: '2024-03-01' },
];

export const seedCalculations: CalculationSnapshot[] = [
  { id: 'c1', company_id: '1', employee_count_used: 290, disabled_employees_declared: 2, required_positions_4_percent: 12, uncovered_positions: 10, min_wage_used: 3700, monthly_obligation_estimated: 37000, spendable_half_estimated: 18500, notes: 'Estimare pe baza datelor enrichment', created_at: '2024-03-01' },
  { id: 'c2', company_id: '2', employee_count_used: 750, disabled_employees_declared: 5, required_positions_4_percent: 30, uncovered_positions: 25, min_wage_used: 3700, monthly_obligation_estimated: 92500, spendable_half_estimated: 46250, notes: 'Date verificate ONRC', created_at: '2024-03-05' },
  { id: 'c3', company_id: '4', employee_count_used: 1200, disabled_employees_declared: 8, required_positions_4_percent: 48, uncovered_positions: 40, min_wage_used: 3700, monthly_obligation_estimated: 148000, spendable_half_estimated: 74000, notes: 'Date verificate BVB', created_at: '2024-03-08' },
];

export const seedSlides: Slide[] = [
  { id: 's1', presentation_id: 'pr1', slide_order: 1, slide_type: 'cover', title: 'Propunere pentru TechVision Romania', body: 'Soluții de onboarding și employer branding pentru TechVision', visible: true, metadata_json: {} },
  { id: 's2', presentation_id: 'pr1', slide_order: 2, slide_type: 'company_overview', title: 'TechVision Romania', body: 'TechVision Solutions este o companie de dezvoltare software cu focus pe soluții enterprise.\n\nIT & Software • București • 290 angajați', visible: true, metadata_json: {} },
  { id: 's3', presentation_id: 'pr1', slide_order: 3, slide_type: 'mechanism', title: 'Cum funcționează', body: 'Companiile cu peste 50 de angajați au obligația legală de a integra persoane cu dizabilități (4%).\n\nAlternativ, pot achiziționa de la o unitate protejată autorizată.\n\nLike Media Group este unitate protejată autorizată.', visible: true, metadata_json: {} },
  { id: 's4', presentation_id: 'pr1', slide_order: 4, slide_type: 'products', title: 'Produse recomandate', body: '• Tricou personalizat\n  Eligibil prin personalizare textile internă\n\n• Agendă brandată\n  Eligibil prin realizare papetărie internă', visible: true, metadata_json: {} },
];
