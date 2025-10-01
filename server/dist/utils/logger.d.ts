import winston from 'winston';
export declare const logger: winston.Logger;
export interface LogContext {
    userId?: string;
    requestId?: string;
    userAgent?: string;
    ip?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    responseTime?: number;
    [key: string]: any;
}
export declare const loggers: {
    request: (message: string, context: LogContext) => void;
    error: (message: string, error?: Error, context?: LogContext) => void;
    security: (message: string, context: LogContext) => void;
    business: (message: string, context: LogContext) => void;
    performance: (message: string, context: LogContext & {
        duration: number;
    }) => void;
    system: (message: string, context?: LogContext) => void;
};
export declare const requestLogger: (req: any, res: any, next: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map