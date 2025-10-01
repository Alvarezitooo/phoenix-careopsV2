interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}
interface ConversationMemory {
    userId: string;
    messages: Message[];
    context: UserContext;
    lastUpdated: string;
}
interface UserContext {
    childInfo?: {
        age?: number;
        condition?: string;
        severity?: string;
    };
    familyInfo?: {
        situation?: string;
        location?: string;
        preferences?: string[];
    };
    adminProgress?: {
        mdphStatus?: string;
        aidesObtained?: string[];
        nextSteps?: string[];
    };
    emotionalState?: {
        currentMood?: string;
        stressLevel?: number;
        supportNeeds?: string[];
    };
}
interface UserMemory {
    userId: string;
    longTermMemory: any;
    personalityTraits: string[];
    preferences: any;
    importantEvents: any[];
    lastInteraction: string;
}
export declare const memoryService: {
    getConversation(userId: string): Promise<ConversationMemory>;
    saveMessage(userId: string, userMessage: string, assistantResponse: string): Promise<void>;
    saveMemory(userId: string, memory: string, type: string): Promise<void>;
    resetConversation(userId: string): Promise<void>;
    getUserMemory(userId: string): Promise<UserMemory>;
    updateUserMemory(userId: string, memoryUpdate: any): Promise<void>;
    updateContextFromConversation(userId: string, userMessage: string, assistantResponse: string): Promise<void>;
    extractPersonalityTraits(messages: Message[]): string[];
};
export {};
//# sourceMappingURL=service.d.ts.map