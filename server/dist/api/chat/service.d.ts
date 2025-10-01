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
export declare const chatService: {
    generateResponse(request: ChatRequest): Promise<{
        content: any;
        conversationId: any;
        tokens: any;
        model: string;
        sources: any;
        processing_time: any;
    }>;
    analyzeDocument(request: DocumentAnalysisRequest): Promise<{
        summary: string;
        data: any;
        suggestions: string[];
        fullAnalysis: any;
        sources: any;
    }>;
    extractSummary(analysis: string): string;
    extractStructuredData(analysis: string): any;
    extractSuggestions(analysis: string): string[];
};
export {};
//# sourceMappingURL=service.d.ts.map