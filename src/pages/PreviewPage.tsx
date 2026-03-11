import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Printer } from 'lucide-react';
import { getTemplate } from '@/lib/presentation-templates';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template') || 'corporate-clean';
  const template = getTemplate(templateId);

  const data = useData();
  const presentation = data.getPresentation(id || '');
  const slides = data.getPresentationSlides(id || '').filter(s => s.visible);
  const company = presentation ? data.getCompany(presentation.company_id) : null;

  if (!presentation) {
    return <AppLayout><p className="text-muted-foreground">Prezentarea nu a fost găsită.</p></AppLayout>;
  }

  const handlePrint = () => window.print();

  const getSlideStyle = (type: string) => {
    const dark = ['cover', 'mechanism', 'about_us', 'next_steps'];
    const accent = ['calculation', 'benefits'];
    if (dark.includes(type)) return { bg: type === 'cover' ? template.coverBg : template.darkSlideBg, text: type === 'cover' ? template.coverText : template.darkSlideText };
    if (accent.includes(type)) return { bg: template.accentSlideBg, text: template.accentSlideText };
    return { bg: template.lightSlideBg, text: template.lightSlideText };
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
                <p className="text-xs text-muted-foreground">{slides.length} slide-uri • Template: {template.name}</p>
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
      <div className="mx-auto max-w-[900px] py-8 px-4 space-y-6 print:space-y-0 print:p-0 print:max-w-none">
        {slides.map((slide, i) => {
          const isCover = slide.slide_type === 'cover';
          const { bg, text } = getSlideStyle(slide.slide_type);

          return (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="slide-page"
            >
              <div
                className={`relative overflow-hidden rounded-xl shadow-lg print:rounded-none print:shadow-none ${bg} ${text}`}
                style={{ aspectRatio: '16/9' }}
              >
                {/* Decorative elements */}
                {isCover && (
                  <>
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[hsl(38,92%,50%)]/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[hsl(38,92%,50%)] via-[hsl(38,92%,50%)]/50 to-transparent" />
                  </>
                )}
                {!isCover && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-[hsl(38,92%,50%)]/30" />
                )}

                <div className={`relative flex h-full flex-col ${isCover ? 'items-center justify-center p-16 text-center' : 'justify-center p-12 pl-14'}`}>
                  {isCover && (
                    <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(38,92%,50%)]">
                      <span className="font-display text-xl font-bold text-[hsl(222,47%,11%)]">LM</span>
                    </div>
                  )}

                  <h2 className={`${template.fontStyle} ${isCover ? 'text-4xl leading-tight' : 'text-2xl'} font-bold tracking-tight`}>
                    {slide.title}
                  </h2>

                  <div className={`mt-4 whitespace-pre-line leading-relaxed ${isCover ? 'text-lg opacity-75 max-w-lg mx-auto' : 'text-[15px] opacity-85 max-w-2xl'}`}>
                    {slide.body}
                  </div>

                  {isCover && company && (
                    <div className="mt-10 space-y-1 opacity-50">
                      <p className="text-sm">Pregătit pentru {company.company_name}</p>
                      <p className="text-xs">Like Media Group SRL — Unitate Protejată Autorizată</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="absolute bottom-4 left-14 right-8 flex items-center justify-between">
                    {!isCover && (
                      <>
                        <span className="text-[10px] opacity-30 font-medium">Like Media Group</span>
                        <span className="text-[10px] opacity-30 font-mono">{i + 1} / {slides.length}</span>
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
