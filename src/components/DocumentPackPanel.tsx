// ─── Document Pack Panel ─────────────────────────────────────────────
// UI for generating and managing document packs on CompanyPage.

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Copy, Check, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { generateDocumentPack, type DocumentPack, type DocumentItem } from '@/services/documentPackService';
import { generateAgreement, agreementToText } from '@/services/agreementGeneratorService';
import { getStandardDocuments, type LibraryDocument } from '@/services/documentLibraryService';
import { addTimelineEvent } from '@/services/followUpService';
import type { Company, CompanyEnrichment } from '@/types';
import type { OpportunityInsights } from '@/services/opportunityInsightsService';
import { toast } from '@/hooks/use-toast';

interface Props {
  company: Company;
  enrichment: CompanyEnrichment | null;
  insights: OpportunityInsights | null;
}

export default function DocumentPackPanel({ company, enrichment, insights }: Props) {
  const [pack, setPack] = useState<DocumentPack | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [agreementPreview, setAgreementPreview] = useState<string | null>(null);
  const libraryDocs = getStandardDocuments();

  const handleGenerate = () => {
    const p = generateDocumentPack(company, enrichment, insights);
    setPack(p);
    setSelectedDocs(new Set(p.documents.map(d => d.id)));
    setExpanded(true);
    addTimelineEvent(company.id, 'documents_generated', 'Pachet documente generat');
    toast({ title: 'Pachet generat', description: `${p.documents.length} documente pregătite.` });
  };

  const handlePreviewAgreement = () => {
    const agreement = generateAgreement(company, []);
    const text = agreementToText(agreement);
    setAgreementPreview(text);
  };

  const handleCopyAgreement = () => {
    if (agreementPreview) {
      navigator.clipboard.writeText(agreementPreview);
      setCopied('agreement');
      setTimeout(() => setCopied(null), 2000);
      toast({ title: 'Copiat', description: 'Acordul a fost copiat în clipboard.' });
    }
  };

  const toggleDoc = (id: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm">Document Pack</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {pack && <Badge variant="outline" className="text-xs">{pack.documents.length} docs</Badge>}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              {!pack ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Generează pachetul de documente pentru colaborare.</p>
                  <Button onClick={handleGenerate} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <FileText className="h-4 w-4 mr-2" /> Generează Document Pack
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {pack.documents.map(doc => (
                      <label key={doc.id} className="flex items-start gap-3 rounded-lg p-2.5 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                        <Checkbox
                          checked={selectedDocs.has(doc.id)}
                          onCheckedChange={() => toggleDoc(doc.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span>{doc.icon}</span>
                            <p className="text-sm font-medium text-foreground">{doc.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs flex-1" onClick={handlePreviewAgreement}>
                      <FileText className="h-3.5 w-3.5 mr-1" /> Preview Acord
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs flex-1" onClick={handleGenerate}>
                      <Package className="h-3.5 w-3.5 mr-1" /> Regenerează
                    </Button>
                  </div>

                  {agreementPreview && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acord Parteneriat</p>
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleCopyAgreement}>
                          {copied === 'agreement' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <div className="rounded-lg bg-muted/20 p-3 text-xs text-foreground whitespace-pre-line max-h-60 overflow-y-auto font-mono leading-relaxed">
                        {agreementPreview}
                      </div>
                    </div>
                  )}

                  {/* Library documents */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Documente standard disponibile</p>
                    <div className="space-y-1">
                      {libraryDocs.map(doc => (
                        <div key={doc.id} className="flex items-center gap-2 rounded-md p-2 bg-muted/10">
                          <span className="text-sm">{doc.icon}</span>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">{doc.title}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{doc.category}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
