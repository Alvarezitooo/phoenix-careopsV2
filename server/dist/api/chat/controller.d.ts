import { Request, Response } from 'express';
export declare const chatController: {
    sendMessage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    saveMemory(req: Request, res: Response): Promise<void>;
    resetConversation(req: Request, res: Response): Promise<void>;
    analyzeDocument(req: Request, res: Response): Promise<void>;
    getUserMemory(req: Request, res: Response): Promise<void>;
    updateMemory(req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=controller.d.ts.map