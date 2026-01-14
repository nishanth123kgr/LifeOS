import { cn, getProgressColor } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  size = 'md',
  showLabel = true,
  className 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', getProgressColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-gray-600 mt-1">{Math.round(percentage)}%</p>
      )}
    </div>
  );
}
