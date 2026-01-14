'use client';

import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  description = 'We encountered an unexpected error while loading this content.',
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 max-w-sm">{description}</p>
      {process.env.NODE_ENV === 'development' && error && (
        <p className="text-xs text-red-500 mb-4 font-mono">{error.message}</p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
        {resetError && (
          <Button onClick={resetError}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

export function LoadingFallback({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      {Icon && (
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
