'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

import { uiCopy } from '@/lib/uiCopy';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
  processing_time?: number;
  suggestions?: string[];
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

interface UseChatOptions {
  userId?: string;
  autoLoadHistory?: boolean;
  userContext?: any;
}

// Helper pour gérer les erreurs de l'API
async function getApiErrorMessage(error: any): Promise<string> {
  if (error.response) {
    try {
      const data = await error.response.json();
      const errorCode = data.error?.code as keyof typeof uiCopy.errors;
      if (errorCode && uiCopy.errors[errorCode]) {
        return uiCopy.errors[errorCode];
      }
    } catch (e) {
      // Le corps de la réponse n'est pas un JSON valide
      return uiCopy.errors.UNKNOWN_ERROR;
    }
  }
  if (error.message && error.message.includes('Failed to fetch')) {
    return uiCopy.errors.network;
  }
  return uiCopy.errors.UNKNOWN_ERROR;
}

export function useChat(options: UseChatOptions = {}) {
  const { userId, autoLoadHistory = true, userContext } = options;

  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    connectionStatus: 'disconnected'
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // 📜 Charger l'historique au montage
  useEffect(() => {
    if (autoLoadHistory && userId) {
      loadChatHistory();
    }
  }, [userId, autoLoadHistory]);

  // 📜 Charger historique conversation
  const loadChatHistory = useCallback(async () => {
    if (!userId) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        connectionStatus: 'disconnected',
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, connectionStatus: 'connecting' }));

      const response = await fetch(`/api/chat/history?userId=${userId}`);

      if (!response.ok) {
        throw { response }; // Lancer l'objet réponse pour analyse
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        messages: data.messages || [],
        isLoading: false,
        connectionStatus: 'connected',
        error: null
      }));

    } catch (error) {
      console.error('Erreur chargement historique:', error);
      const errorMessage = await getApiErrorMessage(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        connectionStatus: 'disconnected',
        error: errorMessage
      }));
    }
  }, [userId]);

  // 💬 Envoyer un message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading || !userId) {
      return;
    }

    // Annuler requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Message utilisateur immédiat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null
    }));

    try {
      // 🔐 Récupérer le token Supabase depuis les cookies
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Session expirée');
      }

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔐 Ajouter le token
        },
        body: JSON.stringify({
          message: content.trim(),
          userId,
          context: userContext // Envoyer le contexte utilisateur
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw { response }; // Lancer l'objet réponse pour analyse
      }

      const data = await response.json();

      // Message assistant avec données RAG
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.answer,
        timestamp: data.timestamp,
        sources: data.sources || [],
        processing_time: data.processing_time || 0,
        suggestions: data.suggestions || []
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        connectionStatus: 'connected'
      }));

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Requête annulée volontairement
      }

      console.error('Erreur envoi message:', error);
      const errorMessage = await getApiErrorMessage(error);

      setState(prev => ({
        ...prev,
        isLoading: false,
        connectionStatus: 'disconnected',
        error: errorMessage
      }));
    }
  }, [userId, state.isLoading]);

  // 🔄 Reset conversation
  const resetConversation = useCallback(async () => {
    if (!userId) {
      return;
    }
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch('/api/chat/reset', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la réinitialisation');
      }

      setState(prev => ({
        ...prev,
        messages: [],
        isLoading: false,
        error: null
      }));

    } catch (error: any) {
      console.error('Erreur reset:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  }, [userId]);

  // 🧠 Sauvegarder un souvenir important
  const saveMemory = useCallback(async (memory: string, type: string = 'important') => {
    if (!userId) {
      return false;
    }
    try {
      const response = await fetch('/api/chat/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          memory,
          type
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur sauvegarde mémoire');
      }

      return true;
    } catch (error) {
      console.error('Erreur sauvegarde mémoire:', error);
      return false;
    }
  }, [userId]);

  // 📄 Analyser un document
  const analyzeDocument = useCallback(async (document: string, documentType: string) => {
    if (!userId) {
      return null;
    }
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch('/api/chat/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document,
          userId,
          documentType
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur analyse document');
      }

      const data = await response.json();

      // Ajouter résultat d'analyse comme message
      const analysisMessage: Message = {
        id: `analysis-${Date.now()}`,
        role: 'assistant',
        content: `📄 **Analyse de votre document :**\n\n${data.analysis}\n\n**Suggestions :**\n${data.suggestions.map((s: string) => `• ${s}`).join('\n')}`,
        timestamp: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, analysisMessage],
        isLoading: false
      }));

      return data;

    } catch (error: any) {
      console.error('Erreur analyse document:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      return null;
    }
  }, [userId]);

  // 🔄 Retry dernière action en cas d'erreur
  const retry = useCallback(() => {
    if (state.messages.length > 0) {
      const lastUserMessage = [...state.messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        // Supprimer les messages d'erreur et relancer
        setState(prev => ({
          ...prev,
          messages: prev.messages.filter(m => !m.id.startsWith('error-')),
          error: null
        }));
        sendMessage(lastUserMessage.content);
      }
    }
  }, [state.messages, sendMessage]);

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    connectionStatus: state.connectionStatus,

    // Actions
    sendMessage,
    resetConversation,
    saveMemory,
    analyzeDocument,
    loadChatHistory,
    retry,

    // Utils
    isEmpty: state.messages.length === 0,
    lastMessage: state.messages[state.messages.length - 1] || null
  };
}
