import { supabase } from '../../config/supabase.js';
export const memoryService = {
    // 💬 Récupérer la conversation d'un utilisateur
    async getConversation(userId) {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            if (!data) {
                // Créer nouvelle conversation
                return {
                    userId,
                    messages: [],
                    context: {},
                    lastUpdated: new Date().toISOString()
                };
            }
            return {
                userId,
                messages: data.messages || [],
                context: data.context || {},
                lastUpdated: data.updated_at
            };
        }
        catch (error) {
            console.error('Erreur récupération conversation:', error);
            // Fallback en cas d'erreur DB
            return {
                userId,
                messages: [],
                context: {},
                lastUpdated: new Date().toISOString()
            };
        }
    },
    // 💾 Sauvegarder un message dans la conversation
    async saveMessage(userId, userMessage, assistantResponse) {
        try {
            // Récupérer conversation existante
            const conversation = await this.getConversation(userId);
            // Ajouter nouveaux messages
            const newMessages = [
                ...conversation.messages,
                {
                    role: 'user',
                    content: userMessage,
                    timestamp: new Date().toISOString()
                },
                {
                    role: 'assistant',
                    content: assistantResponse,
                    timestamp: new Date().toISOString()
                }
            ];
            // Garder seulement les 50 derniers messages (limiter la taille)
            const limitedMessages = newMessages.slice(-50);
            // Sauvegarder en DB
            const { error } = await supabase
                .from('conversations')
                .upsert({
                user_id: userId,
                messages: limitedMessages,
                context: conversation.context,
                updated_at: new Date().toISOString()
            });
            if (error) {
                throw error;
            }
            // Analyser et mettre à jour le contexte utilisateur
            await this.updateContextFromConversation(userId, userMessage, assistantResponse);
        }
        catch (error) {
            console.error('Erreur sauvegarde message:', error);
            // Continue l'exécution même en cas d'erreur DB
        }
    },
    // 🧠 Sauvegarder un souvenir important
    async saveMemory(userId, memory, type) {
        try {
            const { error } = await supabase
                .from('user_memories')
                .insert({
                user_id: userId,
                memory_content: memory,
                memory_type: type,
                created_at: new Date().toISOString()
            });
            if (error) {
                throw error;
            }
        }
        catch (error) {
            console.error('Erreur sauvegarde mémoire:', error);
            throw error;
        }
    },
    // 🔄 Reset conversation
    async resetConversation(userId) {
        try {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('user_id', userId);
            if (error) {
                throw error;
            }
        }
        catch (error) {
            console.error('Erreur reset conversation:', error);
            throw error;
        }
    },
    // 🧠 Récupérer la mémoire complète d'un utilisateur
    async getUserMemory(userId) {
        try {
            // Récupérer mémoires stockées
            const { data: memories, error: memoriesError } = await supabase
                .from('user_memories')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (memoriesError) {
                throw memoriesError;
            }
            // Récupérer contexte de conversation
            const conversation = await this.getConversation(userId);
            return {
                userId,
                longTermMemory: memories || [],
                personalityTraits: this.extractPersonalityTraits(conversation.messages),
                preferences: conversation.context.familyInfo || {},
                importantEvents: memories?.filter(m => m.memory_type === 'important_event') || [],
                lastInteraction: conversation.lastUpdated
            };
        }
        catch (error) {
            console.error('Erreur récupération mémoire utilisateur:', error);
            return {
                userId,
                longTermMemory: [],
                personalityTraits: [],
                preferences: {},
                importantEvents: [],
                lastInteraction: new Date().toISOString()
            };
        }
    },
    // ✏️ Mettre à jour la mémoire utilisateur
    async updateUserMemory(userId, memoryUpdate) {
        try {
            const conversation = await this.getConversation(userId);
            const updatedContext = {
                ...conversation.context,
                ...memoryUpdate
            };
            const { error } = await supabase
                .from('conversations')
                .upsert({
                user_id: userId,
                messages: conversation.messages,
                context: updatedContext,
                updated_at: new Date().toISOString()
            });
            if (error) {
                throw error;
            }
        }
        catch (error) {
            console.error('Erreur mise à jour mémoire:', error);
            throw error;
        }
    },
    // 🔍 Mettre à jour le contexte depuis la conversation
    async updateContextFromConversation(userId, userMessage, assistantResponse) {
        try {
            const conversation = await this.getConversation(userId);
            // Analyse simple du message pour extraire le contexte
            const contextUpdate = {};
            // Détecter mentions d'âge
            const ageMatch = userMessage.match(/(\d+)\s*ans?/);
            if (ageMatch) {
                contextUpdate.childInfo = {
                    ...conversation.context.childInfo,
                    age: parseInt(ageMatch[1])
                };
            }
            // Détecter mentions de conditions
            const conditions = ['autisme', 'trisomie', 'paralysie', 'myopathie', 'épilepsie'];
            const mentionedCondition = conditions.find(condition => userMessage.toLowerCase().includes(condition));
            if (mentionedCondition) {
                contextUpdate.childInfo = {
                    ...conversation.context.childInfo,
                    condition: mentionedCondition
                };
            }
            // Détecter état émotionnel
            const stressWords = ['épuisé', 'fatigué', 'désespéré', 'perdu', 'difficile'];
            const stressLevel = stressWords.filter(word => userMessage.toLowerCase().includes(word)).length;
            if (stressLevel > 0) {
                contextUpdate.emotionalState = {
                    ...conversation.context.emotionalState,
                    stressLevel: Math.min(stressLevel * 2, 10),
                    currentMood: stressLevel > 2 ? 'stressed' : 'concerned'
                };
            }
            // Sauvegarder contexte mis à jour si changements détectés
            if (Object.keys(contextUpdate).length > 0) {
                await this.updateUserMemory(userId, contextUpdate);
            }
        }
        catch (error) {
            console.error('Erreur mise à jour contexte:', error);
            // Ne pas faire échouer la conversation pour une erreur de contexte
        }
    },
    // 🎭 Extraire traits de personnalité depuis les messages
    extractPersonalityTraits(messages) {
        const traits = [];
        const userMessages = messages
            .filter(m => m.role === 'user')
            .map(m => m.content.toLowerCase())
            .join(' ');
        // Analyse simple des traits
        if (userMessages.includes('merci') || userMessages.includes('reconnaissance')) {
            traits.push('reconnaissant');
        }
        if (userMessages.includes('urgent') || userMessages.includes('vite')) {
            traits.push('anxieux');
        }
        if (userMessages.includes('détail') || userMessages.includes('précis')) {
            traits.push('méticuleux');
        }
        return traits;
    }
};
//# sourceMappingURL=service.js.map