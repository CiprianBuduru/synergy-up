import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Printer } from 'lucide-react';
import { getTemplate, type PresentationTemplate } from '@/lib/presentation-templates';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template') || 'corporate-clean';
  const template = getTemplate(templateId);

  const data = useData();
  const presentation = data.getPresentation(id || '');
  const slides = data.getPresentationSlides(id || '').filter(s => s.visible);
  const company = presentation ? data.getCompany(presentation.company_id) : null;
  const enrichment = company ? data.getEnrichment(company.id) : null;

  if (!presentation) {
    return <AppLayout><p className="text-muted-foreground">Prezentarea nu a fost găsită.</p></AppLayout>;
  }

  const handlePrint = () => window.print();

  const getSlideStyle = (type: string): { bg: string; text: string; layout: 'cover' | 'dark' | 'light' | 'accent' } => {
    if (type === 'cover') return { bg: template.coverBg, text: template.coverText, layout: 'cover' };
    const darkTypes = ['mechanism', 'about_us', 'next_steps'];
    const accentTypes = ['calculation', 'benefits'];
    if (darkTypes.includes(type)) return { bg: template.darkSlideBg, text: template.darkSlideText, layout: 'dark' };
    if (accentTypes.includes(type)) return { bg: template.accentSlideBg, text: template.accentSlideText, layout: 'accent' };
    return { bg: template.lightSlideBg, text: template.lightSlideText, layout: 'light' };
  };

  return (
    <>
      {/* Controls */}
      <div className="no-print">
        <AppLayout>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/editor/${id}?template=${templateId}`}>
                <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
              </Link>
              <div>
                <h1 className="font-display text-lg font-bold text-foreground">{presentation.title}</h1>
                <p className="text-xs text-muted-foreground">{slides.length} slide-uri · Template: {template.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/editor/${id}?template=${templateId}`}>
                <Button variant="outline" size="sm"><Edit className="mr-2 h-3.5 w-3.5" /> Editează</Button>
              </Link>
              <Button onClick={handlePrint} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20">
                <Printer className="mr-2 h-3.5 w-3.5" /> Export PDF
              </Button>
            </div>
          </div>
        </AppLayout>
      </div>

      {/* Slides */}
      <div className="mx-auto max-w-[960px] py-8 px-4 space-y-8 print:space-y-0 print:p-0 print:max-w-none">
        {slides.map((slide, i) => {
          const { bg, text, layout } = getSlideStyle(slide.slide_type);
          const isCover = layout === 'cover';

          return (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="slide-page"
            >
              <div
                className={`relative overflow-hidden rounded-2xl shadow-xl print:rounded-none print:shadow-none ${bg} ${text}`}
                style={{ aspectRatio: '16/9' }}
              >
                {/* Decorative elements */}
                {isCover && <CoverDecor />}
                {!isCover && layout === 'dark' && <DarkSlideDecor />}
                {!isCover && layout === 'light' && <LightSlideDecor />}
                {!isCover && layout === 'accent' && <AccentSlideDecor />}

                <div className={`relative flex h-full flex-col ${isCover ? 'items-center justify-center p-16 text-center' : 'justify-center p-12 pl-16'}`}>
                  {/* Cover logo */}
                  {isCover && (
                    <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(38,92%,50%)] shadow-lg shadow-[hsl(38,92%,50%)]/30">
                      <span className="font-display text-xl font-bold text-[hsl(222,47%,11%)]">LM</span>
                    </div>
                  )}

                  {/* Slide type indicator */}
                  {!isCover && (
                    <div className="mb-3">
                      <span className={`inline-block text-[10px] font-semibold uppercase tracking-[0.15em] ${layout === 'light' ? 'text-[hsl(38,92%,50%)]' : 'opacity-50'}`}>
                        {formatSlideType(slide.slide_type)}
                      </span>
                    </div>
                  )}

                  <h2 className={`${template.fontStyle} ${isCover ? 'text-4xl leading-[1.15]' : 'text-[28px] leading-tight'} font-bold tracking-tight`}>
                    {slide.title}
                  </h2>

                  <div className={`mt-5 whitespace-pre-line leading-[1.7] ${isCover ? 'text-lg opacity-70 max-w-xl mx-auto' : 'text-[15px] opacity-80 max-w-2xl'}`}>
                    {renderBody(slide.body, layout)}
                  </div>

                  {/* Cover footer */}
                  {isCover && company && (
                    <div className="mt-12 space-y-1.5 opacity-40">
                      <p className="text-sm font-medium">Pregătit pentru {company.company_name}</p>
                      <p className="text-xs">Like Media Group SRL — Unitate Protejată Autorizată</p>
                      {enrichment && (
                        <p className="text-[10px]">{enrichment.industry_label} · {enrichment.headquarters}</p>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="absolute bottom-5 left-16 right-10 flex items-center justify-between">
                    {!isCover && (
                      <>
                        <span className="text-[10px] opacity-25 font-medium tracking-wide">Like Media Group · Unitate Protejată Autorizată</span>
                        <span className="text-[10px] opacity-25 font-mono tabular-nums">{i + 1} / {slides.length}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

// ─── Decorative sub-components ────────────────────────────────────

function CoverDecor() {
  return (
    <>
      <div className="absolute right-0 top-0 h-full w-2/5 bg-gradient-to-l from-[hsl(38,92%,50%)]/8 to-transparent" />
      <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-[hsl(38,92%,50%)] via-[hsl(38,92%,50%)]/40 to-transparent" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(38,92%,50%)]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
    </>
  );
}

function DarkSlideDecor() {
  return (
    <>
      <div className="absolute left-0 top-0 h-full w-1.5 bg-[hsl(38,92%,50%)]/40" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-[hsl(38,92%,50%)]/5 rounded-full translate-y-1/2 translate-x-1/4" />
    </>
  );
}

function LightSlideDecor() {
  return (
    <>
      <div className="absolute left-0 top-0 h-full w-1.5 bg-[hsl(38,92%,50%)]/30" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(222,47%,14%)]/3 rounded-full -translate-y-1/3 translate-x-1/3" />
    </>
  );
}

function AccentSlideDecor() {
  return (
    <>
      <div className="absolute left-0 top-0 h-full w-1.5 bg-[hsl(0,0%,100%)]/20" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-[hsl(0,0%,100%)]/10 rounded-full translate-y-1/2 -translate-x-1/4" />
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatSlideType(type: string): string {
  const labels: Record<string, string> = {
    company_overview: 'Despre companie',
    context: 'Context',
    mechanism: 'Mecanism',
    calculation: 'Oportunitate',
    products: 'Produse',
    kits: 'Kituri',
    alternatives: 'Alternative',
    benefits: 'Beneficii',
    about_us: 'Despre noi',
    next_steps: 'Pași următori',
  };
  return labels[type] || type.replace(/_/g, ' ');
}

function renderBody(body: string, layout: string) {
  // Highlight checkmarks and arrows in body text
  return body.split('\n').map((line, i) => {
    const isCheckmark = line.startsWith('✓');
    const isArrow = line.startsWith('▸');
    const isBullet = line.startsWith('•');
    const isNumber = /^\d+\./.test(line.trim());
    const isSubLine = line.startsWith('  ');

    if (isCheckmark) {
      return (
        <span key={i} className="block">
          <span className={layout === 'accent' ? 'opacity-100' : 'text-[hsl(142,71%,45%)]'}>✓</span>
          {line.slice(1)}
        </span>
      );
    }
    if (isArrow) {
      return (
        <span key={i} className={`block ${isSubLine ? '' : 'font-semibold'}`}>
          <span className="text-[hsl(38,92%,50%)]">▸</span>
          {line.slice(1)}
        </span>
      );
    }
    if (isSubLine && !isBullet) {
      return <span key={i} className="block text-[13px] opacity-65">{line}</span>;
    }
    if (isNumber) {
      return <span key={i} className="block">{line}</span>;
    }
    return <span key={i} className="block">{line}</span>;
  });
}
