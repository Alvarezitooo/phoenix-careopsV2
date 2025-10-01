// Configuration pour FastAPI RAG Backend
const FASTAPI_BASE_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

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

    try {
      // Préparation du contexte pour le système RAG
      const ragRequest = {
        message: message,
        user_id: userId,
        conversation_history: conversationHistory,
        user_context: userContext || {}
      };

      console.log(`🤖 Envoi requête RAG vers ${FASTAPI_BASE_URL}/api/chat/send`);

      // Appel au système RAG FastAPI
      const response = await fetch(`${FASTAPI_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ragRequest),
        timeout: 30000, // 30 secondes
      });

      if (!response.ok) {
        throw new Error(`RAG API Error: ${response.status} ${response.statusText}`);
      }

      const ragResponse = await response.json();

      return {
        content: ragResponse.answer || ragResponse.response,
        conversationId: ragResponse.conversation_id || `conv_${userId}_${Date.now()}`,
        tokens: ragResponse.processing_time || 0,
        model: "gemini-2.5-flash-rag",
        sources: ragResponse.sources || [],
        processing_time: ragResponse.processing_time
      };

    } catch (error) {
      console.error('Erreur RAG:', error);

      // Fallback empathique en cas d'erreur
      return {
        content: `Je rencontre une difficulté technique en ce moment (${error instanceof Error ? error.message : 'erreur inconnue'}). Je suis là pour vous aider - pouvez-vous reformuler votre question ? En attendant, n'hésitez pas à consulter nos ressources d'aide d'urgence.`,
        conversationId: `conv_${userId}_${Date.now()}`,
        tokens: 0,
        model: "fallback",
        sources: []
      };
    }
  },

  // 📄 Analyse de documents via RAG
  async analyzeDocument(request: DocumentAnalysisRequest) {
    const { document, userId, documentType } = request;

    try {
      console.log(`📄 Analyse document via RAG: type=${documentType}`);

      // Appel au système RAG pour l'analyse de documents
      const analysisRequest = {
        message: `Analyse ce document de type ${documentType} et extrait les informations importantes:\n\n${document}`,
        user_id: userId,
        conversation_history: [],
        user_context: { document_type: documentType }
      };

      const response = await fetch(`${FASTAPI_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest),
        timeout: 30000,
      });

      if (!response.ok) {
        throw new Error(`RAG Analysis Error: ${response.status}`);
      }

      const ragResponse = await response.json();
      const analysis = ragResponse.answer || ragResponse.response;

      // Parse la réponse pour structurer les données
      return {
        summary: this.extractSummary(analysis),
        data: this.extractStructuredData(analysis),
        suggestions: this.extractSuggestions(analysis),
        fullAnalysis: analysis,
        sources: ragResponse.sources || []
      };

    } catch (error) {
      console.error('Erreur analyse document RAG:', error);

      return {
        summary: "Erreur lors de l'analyse du document",
        data: {},
        suggestions: ["Vérifiez le format du document et réessayez"],
        fullAnalysis: "Analyse indisponible via RAG",
        sources: []
      };
    }
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