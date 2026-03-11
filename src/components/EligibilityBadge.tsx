import { CheckCircle2, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import type { EligibilityStatus } from '@/types';

interface EligibilityBadgeProps {
  status: EligibilityStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const config = {
  eligible: {
    icon: CheckCircle2,
    label: 'Eligibil',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    iconColor: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  conditionally_eligible: {
    icon: AlertTriangle,
    label: 'Eligibil condiționat',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    iconColor: 'text-amber-500',
    dot: 'bg-amber-500',
  },
  not_eligible_but_convertible: {
    icon: ArrowRightLeft,
    label: 'Neeligibil — convertibil',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    iconColor: 'text-rose-500',
    dot: 'bg-rose-500',
  },
};

export default function EligibilityBadge({ status, size = 'md', showLabel = true }: EligibilityBadgeProps) {
  const c = config[status];
  const Icon = c.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={`inline-flex items-center rounded-full border font-medium ${c.bg} ${c.border} ${c.text} ${sizeClasses[size]}`}>
      <Icon className={`${iconSizes[size]} ${c.iconColor}`} />
      {showLabel && <span>{c.label}</span>}
    </div>
  );
}
