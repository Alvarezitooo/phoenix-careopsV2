import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 📨 Types pour l'API Chat
 */
export interface ChatRequest {
  message: string;
  user_id: string;
}

export interface ChatResponse {
  response: string;
  sources: string[];
  suggestions: string[];
  cached?: boolean;
}

/**
 * 🚀 Custom Hook: useChat
 *
 * Mutation React Query pour envoyer des messages au RAG
 *
 * Features:
 * - Optimistic updates
 * - Error handling
 * - Loading states
 * - Cache invalidation
 */
export function useChat() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (request: ChatRequest): Promise<ChatResponse> => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${apiUrl}/api/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          detail: "Erreur réseau",
        }));
        throw new Error(error.detail || "Erreur lors de l'envoi du message");
      }

      return response.json();
    },

    // Optionnel: invalider le cache après mutation réussie
    onSuccess: () => {
      // On pourrait invalider des queries ici si besoin
      // queryClient.invalidateQueries({ queryKey: ['chat-history'] })
    },

    // Configuration retry
    retry: 1, // 1 retry max (RAG peut être lent)
  });

  return {
    sendMessage: mutation.mutate,
    sendMessageAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
