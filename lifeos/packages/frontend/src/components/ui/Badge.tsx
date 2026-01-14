import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'primary' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'primary', children, className }: BadgeProps) {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    primary: 'badge-primary',
    secondary: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={cn(variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    ON_TRACK: { label: 'On Track', variant: 'success' },
    NEEDS_FOCUS: { label: 'Needs Focus', variant: 'warning' },
    BEHIND: { label: 'Behind', variant: 'danger' },
    COMPLETED: { label: 'Completed', variant: 'success' },
    PAUSED: { label: 'Paused', variant: 'secondary' },
    ARCHIVED: { label: 'Archived', variant: 'secondary' },
  };

  const config = statusConfig[status] || { label: status, variant: 'secondary' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
