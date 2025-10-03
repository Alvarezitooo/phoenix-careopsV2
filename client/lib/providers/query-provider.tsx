"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * 🚀 React Query Provider for PhoenixCare
 *
 * Configuration optimisée pour le RAG:
 * - Cache long pour réduire les appels API
 * - Retry limité (RAG peut être lent)
 * - Stale time élevé (les infos MDPH changent peu)
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache pendant 5 minutes (les réponses RAG changent rarement)
            staleTime: 5 * 60 * 1000,
            // Garde en cache pendant 30 minutes
            gcTime: 30 * 60 * 1000,
            // Retry max 1 fois (RAG peut être lent, pas besoin de retry multiple)
            retry: 1,
            // Pas de refetch automatique (économise les tokens Gemini)
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
          mutations: {
            // Retry mutations 1 fois
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
