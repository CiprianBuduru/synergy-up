// ─── Pitch Angle Generator Service ──────────────────────────────────
// Generates targeted pitch angles from research data, signals, and website analysis.

import type { BusinessSignalReport } from './businessSignalDetectionService';
import type { OfficialWebsiteData } from './officialWebsiteResearchService';
import type { CompanySignals } from './companySignalsService';
import type { DetectedIntent } from './intentDetectionService';

export interface PitchAngle {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  based_on: string;
}

export interface PitchAngleReport {
  angles: PitchAngle[];
  primary_angle: string;
  summary: string;
}

export function generatePitchAngles(
  websiteData: OfficialWebsiteData,
  signalReport: BusinessSignalReport,
  companySignals: CompanySignals,
  intent: DetectedIntent | null,
): PitchAngleReport {
  const angles: PitchAngle[] = [];

  // HR / Onboarding angle
  if (companySignals.hr_relevance === 'high' || websiteData.careers_page_found) {
    angles.push({
      title: 'Onboarding & Employer Branding',
      description: 'Compania recrutează activ — kituri de welcome și materiale de employer branding sunt relevante.',
      priority: 'high',
      based_on: websiteData.careers_page_found ? 'Pagină de cariere detectată' : 'Relevanță HR ridicată',
    });
  }

  // Events / Marketing angle
  if (companySignals.marketing_event_relevance === 'high') {
    angles.push({
      title: 'Evenimente & Marketing',
      description: 'Compania are activitate de marketing/evenimente — materiale promoționale și vizuale sunt prioritare.',
      priority: 'high',
      based_on: 'Relevanță marketing ridicată',
    });
  }

  // Corporate Gifting angle
  if (companySignals.corporate_gifting_relevance === 'high') {
    angles.push({
      title: 'Corporate Gifting',
      description: 'Industria și dimensiunea companiei indică potențial semnificativ pentru cadouri corporate.',
      priority: 'medium',
      based_on: 'Relevanță gifting ridicată',
    });
  }

  // CSR angle
  if (signalReport.signals.find(s => s.signal_key === 'csr_focus' && s.detected)) {
    angles.push({
      title: 'CSR & Sustenabilitate',
      description: 'Compania are inițiative CSR vizibile — produse eco-friendly și responsabile vor rezona.',
      priority: 'medium',
      based_on: 'Semnal CSR detectat pe website',
    });
  }

  // Multi-location angle
  if (companySignals.multi_location_relevance) {
    angles.push({
      title: 'Branding Multi-Locație',
      description: 'Companie cu mai multe locații — volum scalabil și consistență vizuală pe sucursale.',
      priority: 'medium',
      based_on: 'Semnal multi-locație detectat',
    });
  }

  // Growth angle
  if (signalReport.signals.find(s => s.signal_key === 'growth_signal' && s.detected)) {
    angles.push({
      title: 'Expansiune & Creștere',
      description: 'Semnale de creștere detectate — nevoile de materiale vor crește proporțional.',
      priority: 'high',
      based_on: 'Semnal de creștere detectat',
    });
  }

  // Intent-based angle
  if (intent) {
    const intentLabel = intent.primary_intent.replace(/_/g, ' ');
    if (!angles.some(a => a.title.toLowerCase().includes(intentLabel))) {
      angles.push({
        title: `Intenție detectată: ${intentLabel}`,
        description: `Intenția primară detectată este "${intentLabel}" cu încredere ${Math.round(intent.confidence * 100)}%.`,
        priority: intent.confidence > 0.7 ? 'high' : 'medium',
        based_on: 'Detecție intenție din brief',
      });
    }
  }

  // Fallback
  if (angles.length === 0) {
    angles.push({
      title: 'Abordare consultativă generică',
      description: 'Nu au fost detectate semnale specifice — recomandăm o primă întâlnire de descoperire a nevoilor.',
      priority: 'low',
      based_on: 'Lipsă semnale specifice',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  angles.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    angles,
    primary_angle: angles[0]?.title || 'Consultativ',
    summary: `${angles.length} unghiuri de pitch generate pe baza research-ului. Unghi principal: ${angles[0]?.title || 'Consultativ'}.`,
  };
}
