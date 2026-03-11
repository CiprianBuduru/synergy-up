import type { PresentationTone } from '@/types';

export interface PresentationTemplate {
  id: string;
  name: string;
  description: string;
  tone: PresentationTone;
  coverBg: string;
  coverText: string;
  darkSlideBg: string;
  darkSlideText: string;
  lightSlideBg: string;
  lightSlideText: string;
  accentSlideBg: string;
  accentSlideText: string;
  accentColor: string;
  fontStyle: string;
  borderStyle: string;
}

export const presentationTemplates: PresentationTemplate[] = [
  {
    id: 'corporate-clean',
    name: 'Corporate Clean',
    description: 'Design curat și profesional, ideal pentru prezentări formale',
    tone: 'corporate',
    coverBg: 'bg-[hsl(222,47%,14%)]',
    coverText: 'text-[hsl(210,40%,98%)]',
    darkSlideBg: 'bg-[hsl(222,47%,14%)]',
    darkSlideText: 'text-[hsl(210,40%,98%)]',
    lightSlideBg: 'bg-[hsl(0,0%,100%)]',
    lightSlideText: 'text-[hsl(222,47%,11%)]',
    accentSlideBg: 'bg-[hsl(220,14%,96%)]',
    accentSlideText: 'text-[hsl(222,47%,11%)]',
    accentColor: 'text-[hsl(38,92%,50%)]',
    fontStyle: 'font-display',
    borderStyle: 'border-[hsl(220,13%,91%)]',
  },
  {
    id: 'premium-commercial',
    name: 'Premium Commercial',
    description: 'Design premium cu gradient-uri elegante, ideal pentru clienți importanți',
    tone: 'premium',
    coverBg: 'bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,47%,18%)] to-[hsl(240,20%,12%)]',
    coverText: 'text-[hsl(210,40%,98%)]',
    darkSlideBg: 'bg-gradient-to-br from-[hsl(222,47%,14%)] to-[hsl(240,20%,18%)]',
    darkSlideText: 'text-[hsl(210,40%,98%)]',
    lightSlideBg: 'bg-gradient-to-br from-[hsl(0,0%,100%)] to-[hsl(220,20%,97%)]',
    lightSlideText: 'text-[hsl(222,47%,11%)]',
    accentSlideBg: 'bg-gradient-to-br from-[hsl(38,92%,50%)] to-[hsl(28,90%,48%)]',
    accentSlideText: 'text-[hsl(0,0%,100%)]',
    accentColor: 'text-[hsl(38,92%,55%)]',
    fontStyle: 'font-display',
    borderStyle: 'border-[hsl(38,92%,50%)]/20',
  },
  {
    id: 'modern-b2b',
    name: 'Modern B2B',
    description: 'Design modern cu accente bold, ideal pentru tech și startup-uri',
    tone: 'corporate',
    coverBg: 'bg-[hsl(230,25%,8%)]',
    coverText: 'text-[hsl(210,40%,98%)]',
    darkSlideBg: 'bg-[hsl(230,25%,10%)]',
    darkSlideText: 'text-[hsl(210,40%,98%)]',
    lightSlideBg: 'bg-[hsl(0,0%,100%)]',
    lightSlideText: 'text-[hsl(230,25%,10%)]',
    accentSlideBg: 'bg-[hsl(162,72%,45%)]',
    accentSlideText: 'text-[hsl(230,25%,8%)]',
    accentColor: 'text-[hsl(162,72%,45%)]',
    fontStyle: 'font-display',
    borderStyle: 'border-[hsl(162,72%,45%)]/20',
  },
];

export function getTemplate(id: string): PresentationTemplate {
  return presentationTemplates.find(t => t.id === id) || presentationTemplates[0];
}
