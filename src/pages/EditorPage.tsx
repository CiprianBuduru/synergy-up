import { useState } from 'react';
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
import { ArrowLeft, Eye, EyeOff, GripVertical, ArrowUp, ArrowDown, Download } from 'lucide-react';
import type { Slide, PresentationTone } from '@/types';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useData();
  const presentation = data.getPresentation(id || '');
  const slides = data.getPresentationSlides(id || '');
  const company = presentation ? data.getCompany(presentation.company_id) : null;

  const [editingSlides, setEditingSlides] = useState<Slide[]>(slides);
  const [tone, setTone] = useState<PresentationTone>(presentation?.tone || 'corporate');

  if (!presentation) {
    return <AppLayout><p className="text-muted-foreground">Prezentarea nu a fost găsită.</p></AppLayout>;
  }

  const updateSlide = (slideId: string, updates: Partial<Slide>) => {
    setEditingSlides(prev => prev.map(s => s.id === slideId ? { ...s, ...updates } : s));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...editingSlides];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newSlides.length) return;
    [newSlides[index], newSlides[target]] = [newSlides[target], newSlides[index]];
    newSlides.forEach((s, i) => s.slide_order = i + 1);
    setEditingSlides(newSlides);
  };

  const handleSave = () => {
    data.setSlides(editingSlides);
    data.updatePresentation({ ...presentation, tone, updated_at: new Date().toISOString() });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">{presentation.title}</h1>
              <p className="text-xs text-muted-foreground">{company?.company_name} • {editingSlides.length} slide-uri</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={tone} onValueChange={v => setTone(v as PresentationTone)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="friendly">Prietenos</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="technical">Tehnic</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleSave}>Salvează</Button>
            <Link to={`/preview/${id}`}>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {editingSlides.map((slide, i) => (
            <motion.div
              key={slide.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`${!slide.visible ? 'opacity-50' : ''}`}
            >
              <Card className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveSlide(i, 'up')} disabled={i === 0}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveSlide(i, 'down')} disabled={i === editingSlides.length - 1}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{slide.slide_type}</Badge>
                        <Input
                          value={slide.title}
                          onChange={e => updateSlide(slide.id, { title: e.target.value })}
                          className="flex-1 font-medium"
                        />
                      </div>
                      <Textarea
                        value={slide.body}
                        onChange={e => updateSlide(slide.id, { body: e.target.value })}
                        rows={4}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateSlide(slide.id, { visible: !slide.visible })}
                    >
                      {slide.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
