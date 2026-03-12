import { useData } from '@/contexts/DataContext';
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SyncStatusIndicator() {
  const { status, isDemo } = useData();

  if (isDemo) {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] border-warning/30 text-warning bg-warning/5">
        <CloudOff className="h-3 w-3" />
        Demo
      </Badge>
    );
  }

  if (status === 'saving') {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] border-accent/30 text-accent bg-accent/5 animate-pulse">
        <Loader2 className="h-3 w-3 animate-spin" />
        Salvare...
      </Badge>
    );
  }

  if (status === 'saved') {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] border-success/30 text-success bg-success/5">
        <Check className="h-3 w-3" />
        Salvat
      </Badge>
    );
  }

  if (status === 'error') {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] border-destructive/30 text-destructive bg-destructive/5">
        <AlertCircle className="h-3 w-3" />
        Eroare
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-[10px] border-success/30 text-success/60 bg-success/5">
      <Cloud className="h-3 w-3" />
      Cloud
    </Badge>
  );
}
