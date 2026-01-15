import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency: string = 'INR'): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  
  const symbol = symbols[currency] || currency;
  const safeAmount = amount ?? 0;
  return `${symbol}${safeAmount.toLocaleString()}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ON_TRACK':
    case 'COMPLETED':
      return 'success';
    case 'NEEDS_FOCUS':
      return 'warning';
    case 'BEHIND':
      return 'danger';
    default:
      return 'primary';
  }
}

export function getProgressColor(progress: number): string {
  if (progress >= 75) return 'bg-success-500';
  if (progress >= 40) return 'bg-warning-500';
  return 'bg-danger-500';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
