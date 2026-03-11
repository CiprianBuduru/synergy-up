import { useParams, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Download, Printer } from 'lucide-react';

const slideTypeColors: Record<string, string> = {
  cover: 'from-primary to-primary/80',
  mechanism: 'from-primary/90 to-primary/70',
  calculation: 'from-accent/90 to-accent/70',
  benefits: 'from-success/80 to-success/60',
  about_us: 'from-primary/80 to-primary/60',
  next_steps: 'from-accent to-accent/80',
};

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const presentation = data.getPresentation(id || '');
  const slides = data.getPresentationSlides(id || '').filter(s => s.visible);
  const company = presentation ? data.getCompany(presentation.company_id) : null;

  if (!presentation) {
    return <AppLayout><p className="text-muted-foreground">Prezentarea nu a fost găsită.</p></AppLayout>;
  }

  const handlePrint = () => window.print();

  return (
    <AppLayout>
      <div className="space-y-4 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/editor/${id}`}>
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <h1 className="font-display text-xl font-bold text-foreground">{presentation.title}</h1>
          </div>
          <div className="flex gap-2">
            <Link to={`/editor/${id}`}>
              <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Editează</Button>
            </Link>
            <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Printer className="mr-2 h-4 w-4" /> Printează / PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-4xl space-y-0">
        {slides.map((slide, i) => {
          const isCover = slide.slide_type === 'cover';
          const isDark = ['cover', 'mechanism', 'about_us', 'next_steps'].includes(slide.slide_type);
          const gradient = slideTypeColors[slide.slide_type];

          return (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="slide-page"
            >
              <div
                className={`relative min-h-[60vh] rounded-none border-b p-12 ${
                  isDark && gradient
                    ? `bg-gradient-to-br ${gradient} text-primary-foreground`
                    : 'bg-card text-card-foreground'
                } ${isCover ? 'flex min-h-[70vh] flex-col items-center justify-center text-center' : ''}`}
              >
                {isCover && (
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                    <span className="text-2xl font-bold text-accent-foreground">LM</span>
                  </div>
                )}
                <h2 className={`font-display ${isCover ? 'text-4xl' : 'text-2xl'} mb-4 font-bold`}>
                  {slide.title}
                </h2>
                <div className={`whitespace-pre-line ${isCover ? 'text-lg opacity-80' : 'text-base leading-relaxed opacity-90'} max-w-2xl ${isCover ? 'mx-auto' : ''}`}>
                  {slide.body}
                </div>
                {isCover && company && (
                  <p className="mt-8 text-sm opacity-60">
                    Pregătit pentru {company.company_name} • Like Media Group SRL
                  </p>
                )}
                {!isCover && (
                  <div className="absolute bottom-4 right-6 text-xs opacity-40">
                    {i + 1} / {slides.length}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </AppLayout>
  );
}
