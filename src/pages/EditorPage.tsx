import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, GripVertical, Save, Palette } from 'lucide-react';
import { presentationTemplates } from '@/lib/presentation-templates';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Slide, PresentationTone } from '@/types';
import type { DragEndEvent } from '@dnd-kit/core';

function SortableSlide({ slide, index, total, onUpdate }: {
  slide: Slide;
  index: number;
  total: number;
  onUpdate: (id: string, updates: Partial<Slide>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : slide.visible ? 1 : 0.4,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`overflow-hidden transition-shadow ${isDragging ? 'shadow-xl ring-2 ring-accent/30' : 'shadow-sm'}`}>
        <CardContent className="p-0">
          <div className="flex">
            {/* Drag handle + number */}
            <div className="flex w-12 shrink-0 flex-col items-center justify-start gap-1 border-r bg-muted/30 py-3" {...attributes} {...listeners}>
              <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
              <span className="font-mono text-[10px] font-bold text-muted-foreground">{index + 1}</span>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0 text-[10px] uppercase tracking-wider">{slide.slide_type.replace('_', ' ')}</Badge>
                <Input
                  value={slide.title}
                  onChange={e => onUpdate(slide.id, { title: e.target.value })}
                  className="flex-1 border-0 bg-transparent px-0 font-display font-semibold text-foreground shadow-none focus-visible:ring-0"
                  placeholder="Titlu slide..."
                />
              </div>
              <Textarea
                value={slide.body}
                onChange={e => onUpdate(slide.id, { body: e.target.value })}
                rows={3}
                className="border-0 bg-transparent px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0 resize-none"
                placeholder="Conținut slide..."
              />
            </div>

            {/* Visibility toggle */}
            <div className="flex w-11 shrink-0 items-start justify-center border-l bg-muted/20 pt-3">
              <button
                onClick={() => onUpdate(slide.id, { visible: !slide.visible })}
                className="rounded-md p-1.5 transition-colors hover:bg-muted"
              >
                {slide.visible ? (
                  <Eye className="h-4 w-4 text-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useData();
  const presentation = data.getPresentation(id || '');
  const slides = data.getPresentationSlides(id || '');
  const company = presentation ? data.getCompany(presentation.company_id) : null;

  const [editingSlides, setEditingSlides] = useState<Slide[]>(slides);
  const [tone, setTone] = useState<PresentationTone>(presentation?.tone || 'corporate');
  const [template, setTemplate] = useState('corporate-clean');
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!presentation) {
    return <AppLayout><p className="text-muted-foreground">Prezentarea nu a fost găsită.</p></AppLayout>;
  }

  const updateSlide = useCallback((slideId: string, updates: Partial<Slide>) => {
    setEditingSlides(prev => prev.map(s => s.id === slideId ? { ...s, ...updates } : s));
    setSaved(false);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEditingSlides(prev => {
      const oldIndex = prev.findIndex(s => s.id === active.id);
      const newIndex = prev.findIndex(s => s.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      reordered.forEach((s, i) => { s.slide_order = i + 1; });
      return reordered;
    });
    setSaved(false);
  };

  const handleSave = () => {
    data.setSlides(editingSlides);
    data.updatePresentation({ ...presentation, tone, updated_at: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const visibleCount = editingSlides.filter(s => s.visible).length;

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold text-foreground truncate">{presentation.title}</h1>
              <p className="text-xs text-muted-foreground">{company?.company_name} • {visibleCount} / {editingSlides.length} slide-uri vizibile</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Select value={tone} onValueChange={v => setTone(v as PresentationTone)}>
              <SelectTrigger className="w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="friendly">Prietenos</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="technical">Tehnic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="w-44 text-xs">
                <div className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /><SelectValue /></div>
              </SelectTrigger>
              <SelectContent>
                {presentationTemplates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saved ? 'Salvat ✓' : 'Salvează'}
            </Button>
            <Link to={`/preview/${id}?template=${template}`}>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/20 gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>
            </Link>
          </div>
        </div>

        {/* Drag hint */}
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <GripVertical className="h-3.5 w-3.5" />
          Trage slide-urile pentru a le reordona • Click pe 👁 pentru a ascunde/arăta
        </div>

        {/* Slides */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={editingSlides.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {editingSlides.map((slide, i) => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  index={i}
                  total={editingSlides.length}
                  onUpdate={updateSlide}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </AppLayout>
  );
}
