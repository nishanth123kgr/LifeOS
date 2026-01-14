'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ThemeProvider } from './theme/ThemeProvider';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && error.message.includes('4')) {
                return false;
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
