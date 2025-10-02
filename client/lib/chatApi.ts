// 🤖 API Client pour Phoenix Care Chat
import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  timestamp: string;
}

export interface DocumentAnalysis {
  analysis: string;
  extractedData: Record<string, any>;
  suggestions: string[];
}

export interface UserMemory {
  userId: string;
  longTermMemory: any[];
  personalityTraits: string[];
  preferences: any;
  importantEvents: any[];
  lastInteraction: string;
}

class ChatApi {
  private baseUrl = '/api/chat';

  // 🔐 Récupérer le token d'authentification
  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
    }

    return session.access_token;
  }

  // 🔐 Headers avec authentification
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // 💬 Envoyer un message
  async sendMessage(message: string, userId: string): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/message`, {
      method: 'POST',
      headers: await this.getAuthHeaders(), // 🔐 Token ajouté
      body: JSON.stringify({ message, userId }),
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 📜 Récupérer l'historique
  async getChatHistory(userId: string): Promise<{ messages: ChatMessage[]; context: any }> {
    const response = await fetch(`${this.baseUrl}/history?userId=${userId}`, {
      headers: await this.getAuthHeaders(), // 🔐 Token ajouté
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 🧠 Sauvegarder une mémoire
  async saveMemory(userId: string, memory: string, type: string = 'general'): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/memory`, {
      method: 'POST',
      headers: await this.getAuthHeaders(), // 🔐 Token ajouté
      body: JSON.stringify({ userId, memory, type }),
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 🔄 Reset conversation
  async resetConversation(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/reset`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(), // 🔐 Token ajouté
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 📄 Analyser un document
  async analyzeDocument(
    document: string,
    userId: string,
    documentType: 'medical' | 'administrative' | 'mdph' | 'other' = 'other'
  ): Promise<DocumentAnalysis> {
    const response = await fetch(`${this.baseUrl}/analyze-document`, {
      method: 'POST',
      headers: await this.getAuthHeaders(), // 🔐 Token ajouté
      body: JSON.stringify({ document, userId, documentType }),
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 🧠 Récupérer mémoire utilisateur
  async getUserMemory(userId: string): Promise<UserMemory> {
    const response = await fetch(`${this.baseUrl}/memory/${userId}`, {
      headers: await this.getAuthHeaders(), // 🔐 Token ajouté
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // ✏️ Mettre à jour mémoire utilisateur
  async updateUserMemory(userId: string, memoryUpdate: any): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/memory/${userId}`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(), // 🔐 Token ajouté
      body: JSON.stringify({ memoryUpdate }),
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 🏥 Health check (pas besoin d'auth)
  async healthCheck(): Promise<{ status: string; services: Record<string, string> }> {
    const response = await fetch('/api/health');

    if (!response.ok) {
      throw new Error(`Service indisponible: ${response.status}`);
    }

    return response.json();
  }
}

// Instance singleton
export const chatApi = new ChatApi();

// Utilitaires
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const isRecentMessage = (timestamp: string): boolean => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs < 300000; // 5 minutes
};

// Types d'erreurs pour gestion UI
export class ChatApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ChatApiError';
  }
}

// Wrapper avec gestion d'erreurs
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error('Erreur API Chat:', error);

    if (fallback !== undefined) {
      return fallback;
    }

    throw new ChatApiError(
      error instanceof Error ? error.message : 'Erreur inconnue',
      error instanceof Response ? error.status : undefined
    );
  }
};
