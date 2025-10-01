import { env } from '../../config/env.js';
import { CircuitBreakerFactory } from '../../utils/circuitBreaker.js';
import { retryWithBackoff, RetryPredicates } from '../../utils/retry.js';

// Configuration pour Python AI Service
const FASTAPI_BASE_URL = env.PYTHON_API_URL;

// Circuit breaker pour AI Service (protection contre défaillances)
const aiCircuit = CircuitBreakerFactory.get('ai-service', {
  failureThreshold: 5,      // Ouvrir après 5 échecs
  successThreshold: 2,      // Fermer après 2 succès
  timeout: 60000,           // 60s avant retry
  name: 'ai-service'
});

// Types pour le service
interface ChatRequest {
  message: string;
  userId: string;
  conversationHistory: any[];
  userContext: any;
}

interface DocumentAnalysisRequest {
  document: string;
  userId: string;
  documentType: 'medical' | 'administrative' | 'mdph' | 'other';
}

export const chatService = {
  // 🤖 Génération de réponse IA empathique avec RAG
  async generateResponse(request: ChatRequest) {
    const { message, userId, conversationHistory, userContext } = request;

    // Préparation du contexte pour le système RAG
    const ragRequest = {
      message: message,
      user_id: userId,
      conversation_history: conversationHistory,
      user_context: userContext || {}
    };

    console.log(`🤖 Envoi requête RAG vers ${FASTAPI_BASE_URL}/api/chat/send`);

    // Circuit breaker + retry avec backoff exponentiel
    return aiCircuit.execute(
      async () => {
        // Retry avec backoff sur erreurs réseau/serveur
        return retryWithBackoff(
          async () => {
            const response = await fetch(`${FASTAPI_BASE_URL}/api/chat/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(ragRequest),
              signal: AbortSignal.timeout(30000), // 30 secondes
            });

            if (!response.ok) {
              throw new Error(`RAG API Error: ${response.status} ${response.statusText}`);
            }

            const ragResponse: any = await response.json();

            return {
              content: ragResponse.answer || ragResponse.response,
              conversationId: ragResponse.conversation_id || `conv_${userId}_${Date.now()}`,
              tokens: ragResponse.processing_time || 0,
              model: "gemini-2.5-flash-rag",
              sources: ragResponse.sources || [],
              processing_time: ragResponse.processing_time
            };
          },
          {
            maxAttempts: 3,
            initialDelay: 1000,      // 1s
            maxDelay: 10000,         // 10s max
            backoffFactor: 2,        // 1s → 2s → 4s
            shouldRetry: RetryPredicates.standard  // Network + server errors
          }
        );
      },
      // Fallback gracieux si circuit OPEN ou échec définitif
      async () => {
        console.warn('⚠️ Fallback activé - AI Service indisponible');
        return {
          content: `Je rencontre une difficulté technique en ce moment. Mon système d'intelligence artificielle est temporairement indisponible. Je suis là pour vous aider - pouvez-vous reformuler votre question ? En attendant, n'hésitez pas à consulter nos ressources d'aide d'urgence.`,
          conversationId: `conv_fallback_${userId}_${Date.now()}`,
          tokens: 0,
          model: "fallback",
          sources: [],
          processing_time: undefined
        };
      }
    );
  },

  // 📄 Analyse de documents via RAG
  async analyzeDocument(request: DocumentAnalysisRequest) {
    const { document, userId, documentType } = request;

    console.log(`📄 Analyse document via RAG: type=${documentType}`);

    // Appel au système RAG pour l'analyse de documents
    const analysisRequest = {
      message: `Analyse ce document de type ${documentType} et extrait les informations importantes:\n\n${document}`,
      user_id: userId,
      conversation_history: [],
      user_context: { document_type: documentType }
    };

    // Circuit breaker + retry pour analyse documents
    return aiCircuit.execute(
      async () => {
        return retryWithBackoff(
          async () => {
            const response = await fetch(`${FASTAPI_BASE_URL}/api/chat/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(analysisRequest),
              signal: AbortSignal.timeout(30000),
            });

            if (!response.ok) {
              throw new Error(`RAG Analysis Error: ${response.status}`);
            }

            const ragResponse: any = await response.json();
            const analysis = ragResponse.answer || ragResponse.response;

            // Parse la réponse pour structurer les données
            return {
              summary: this.extractSummary(analysis),
              data: this.extractStructuredData(analysis),
              suggestions: this.extractSuggestions(analysis),
              fullAnalysis: analysis,
              sources: ragResponse.sources || []
            };
          },
          {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            backoffFactor: 2,
            shouldRetry: RetryPredicates.standard
          }
        );
      },
      // Fallback pour analyse de documents
      async () => {
        console.warn('⚠️ Fallback activé pour analyse document');
        return {
          summary: "Service d'analyse temporairement indisponible",
          data: {},
          suggestions: [
            "Vérifiez le format du document",
            "Réessayez dans quelques instants",
            "Contactez le support si le problème persiste"
          ],
          fullAnalysis: "L'analyse IA est temporairement indisponible. Veuillez réessayer ultérieurement.",
          sources: []
        };
      }
    );
  },

  // 📝 Extraction du résumé
  extractSummary(analysis: string): string {
    const lines = analysis.split('\n').filter(line => line.trim().length > 0);
    // Prendre les 2-3 premières phrases ou la première section
    const summary = lines.slice(0, 3).join(' ').trim();
    return summary || analysis.substring(0, 200) + '...';
  },

  // 🔍 Extraction de données structurées
  extractStructuredData(analysis: string) {
    // Simple extraction - à améliorer avec regex plus sophistiquées
    const data: any = {};

    // Dates
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})/g;
    const dates = analysis.match(dateRegex);
    if (dates) data.dates = dates;

    // Montants
    const amountRegex = /(\d+[,.]?\d*)\s*€/g;
    const amounts = analysis.match(amountRegex);
    if (amounts) data.montants = amounts;

    // Références
    const refRegex = /(?:n°|ref|référence)\s*:?\s*([A-Z0-9-]+)/gi;
    const references = analysis.match(refRegex);
    if (references) data.references = references;

    return data;
  },

  // 💡 Extraction de suggestions
  extractSuggestions(analysis: string) {
    const lines = analysis.split('\n');
    const suggestions = lines
      .filter(line =>
        line.includes('suggestion') ||
        line.includes('action') ||
        line.includes('recommand') ||
        line.startsWith('- ')
      )
      .map(line => line.replace(/^- /, '').trim())
      .filter(line => line.length > 0);

    return suggestions.length > 0 ? suggestions : [
      "Vérifiez les dates d'échéance",
      "Préparez les documents complémentaires",
      "Contactez les services concernés si besoin"
    ];
  }
};