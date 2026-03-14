import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import type { InboundBrief } from '@/pages/InboundBriefWorkspace';

interface Props {
  form: InboundBrief;
  updateField: (field: keyof InboundBrief, value: any) => void;
}

export default function InboundEditableFields({ form, updateField }: Props) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Review & Edit Brief
        </CardTitle>
        <p className="text-sm text-muted-foreground">Editează câmpurile extrase. Nu se salvează nimic în DB.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Company Name" value={form.company_name} onChange={v => updateField('company_name', v)} />
          <Field label="Contact Name" value={form.contact_name} onChange={v => updateField('contact_name', v)} />
          <Field label="Contact Role" value={form.contact_role} onChange={v => updateField('contact_role', v)} />
          <Field label="Contact Email" value={form.contact_email} onChange={v => updateField('contact_email', v)} />
          <Field label="Contact Phone" value={form.contact_phone} onChange={v => updateField('contact_phone', v)} />
          <Field label="Industry Hint" value={form.industry_hint} onChange={v => updateField('industry_hint', v)} />
          <Field label="Location Hint" value={form.location_hint} onChange={v => updateField('location_hint', v)} />
          <Field label="Request Type" value={form.request_type} onChange={v => updateField('request_type', v)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Requested Items (comma-separated)</Label>
          <Textarea
            value={form.requested_items.join(', ')}
            onChange={e => updateField('requested_items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            rows={2}
            className="resize-none text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Requested Documents (comma-separated)</Label>
          <Textarea
            value={form.requested_documents.join(', ')}
            onChange={e => updateField('requested_documents', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            rows={2}
            className="resize-none text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Non-product Requests (comma-separated)</Label>
          <Textarea
            value={form.requested_non_product_requests.join(', ')}
            onChange={e => updateField('requested_non_product_requests', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            rows={2}
            className="resize-none text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Email Body (cleaned)</Label>
          <Textarea
            value={form.raw_email_body}
            onChange={e => updateField('raw_email_body', e.target.value)}
            rows={4}
            className="resize-none text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
