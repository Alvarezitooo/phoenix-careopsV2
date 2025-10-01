import { chatService } from './service.js';
import { memoryService } from '../memory/service.js';
export const chatController = {
    // 💬 Envoyer un message au chat IA
    async sendMessage(req, res) {
        try {
            const { message, userId } = req.body;
            if (!message || !userId) {
                return res.status(400).json({
                    error: 'Message et userId requis'
                });
            }
            // --- Logique de test pour la synergie Chat -> Dashboard ---
            if (message.toLowerCase().includes('dossier')) {
                const mockResponse = {
                    content: `Absolument. J'ai trouvé plusieurs documents dans votre dossier. Vous pouvez les consulter directement sur [votre tableau de bord](/dashboard) pour plus de détails.`,
                    conversationId: `conv-${userId}`,
                };
                await memoryService.saveMessage(userId, message, mockResponse.content);
                return res.json({
                    response: mockResponse.content,
                    conversationId: mockResponse.conversationId,
                    timestamp: new Date().toISOString()
                });
            }
            // --- Fin de la logique de test ---
            // Récupérer la mémoire de conversation
            const conversationMemory = await memoryService.getConversation(userId);
            // Générer réponse IA avec contexte
            const response = await chatService.generateResponse({
                message,
                userId,
                conversationHistory: conversationMemory.messages,
                userContext: conversationMemory.context
            });
            // Sauvegarder la conversation
            await memoryService.saveMessage(userId, message, response.content);
            res.json({
                response: response.content,
                conversationId: response.conversationId,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Erreur chat:', error);
            res.status(500).json({
                error: 'Erreur lors de la génération de la réponse'
            });
        }
    },
    // 📜 Récupérer l'historique de conversation
    async getHistory(req, res) {
        try {
            const { userId } = req.query;
            if (!userId) {
                return res.status(400).json({
                    error: 'userId requis'
                });
            }
            const history = await memoryService.getConversation(userId);
            res.json({
                messages: history.messages,
                context: history.context,
                lastUpdated: history.lastUpdated
            });
        }
        catch (error) {
            console.error('Erreur récupération historique:', error);
            res.status(500).json({
                error: 'Erreur lors de la récupération de l\'historique'
            });
        }
    },
    // 🧠 Sauvegarder un souvenir important
    async saveMemory(req, res) {
        try {
            const { userId, memory, type } = req.body;
            await memoryService.saveMemory(userId, memory, type);
            res.json({
                success: true,
                message: 'Souvenir sauvegardé avec succès'
            });
        }
        catch (error) {
            console.error('Erreur sauvegarde mémoire:', error);
            res.status(500).json({
                error: 'Erreur lors de la sauvegarde du souvenir'
            });
        }
    },
    // 🔄 Reset conversation
    async resetConversation(req, res) {
        try {
            const { userId } = req.body;
            await memoryService.resetConversation(userId);
            res.json({
                success: true,
                message: 'Conversation réinitialisée'
            });
        }
        catch (error) {
            console.error('Erreur reset conversation:', error);
            res.status(500).json({
                error: 'Erreur lors de la réinitialisation'
            });
        }
    },
    // 📄 Analyser un document uploadé
    async analyzeDocument(req, res) {
        try {
            const { document, userId, documentType } = req.body;
            const analysis = await chatService.analyzeDocument({
                document,
                userId,
                documentType
            });
            res.json({
                analysis: analysis.summary,
                extractedData: analysis.data,
                suggestions: analysis.suggestions
            });
        }
        catch (error) {
            console.error('Erreur analyse document:', error);
            res.status(500).json({
                error: 'Erreur lors de l\'analyse du document'
            });
        }
    },
    // 🧠 Récupérer mémoire utilisateur
    async getUserMemory(req, res) {
        try {
            const { userId } = req.params;
            const memory = await memoryService.getUserMemory(userId);
            res.json(memory);
        }
        catch (error) {
            console.error('Erreur récupération mémoire:', error);
            res.status(500).json({
                error: 'Erreur lors de la récupération de la mémoire'
            });
        }
    },
    // ✏️ Mettre à jour mémoire utilisateur
    async updateMemory(req, res) {
        try {
            const { userId } = req.params;
            const { memoryUpdate } = req.body;
            await memoryService.updateUserMemory(userId, memoryUpdate);
            res.json({
                success: true,
                message: 'Mémoire mise à jour avec succès'
            });
        }
        catch (error) {
            console.error('Erreur mise à jour mémoire:', error);
            res.status(500).json({
                error: 'Erreur lors de la mise à jour de la mémoire'
            });
        }
    }
};
//# sourceMappingURL=controller.js.map