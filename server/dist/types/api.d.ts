export interface ApiResponse<T = any> {
    data?: T;
    error?: ApiError;
    meta?: ResponseMeta;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    field?: string;
}
export interface ResponseMeta {
    timestamp: string;
    requestId?: string;
    pagination?: PaginationMeta;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface User {
    id: string;
    userId: string;
    email: string;
    name: string;
    avatar?: string;
    created_at: string;
    updated_at: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    user: User;
    token: string;
    expiresAt: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}
export interface Document {
    id: string;
    name: string;
    file_path: string;
    mime_type: string;
    size: number;
    user_id: string;
    created_at: string;
    updated_at: string;
}
export interface DocumentResponse {
    id: string;
    name: string;
    createdAt: string;
    size: string;
    mimeType: string;
    filePath: string;
}
export interface DocumentsListResponse {
    documents: DocumentResponse[];
}
export interface DocumentUploadRequest {
    name: string;
    file: File;
}
export type ProcedureStatus = 'pending' | 'in_progress' | 'action_required' | 'completed' | 'rejected';
export interface Procedure {
    id: string;
    name: string;
    status: ProcedureStatus;
    description?: string;
    details?: string;
    due_date?: string;
    completed_date?: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}
export interface ProcedureResponse {
    id: string;
    name: string;
    status: string;
    details?: string;
    dueDate?: string;
    completedDate?: string;
}
export interface ProceduresListResponse {
    procedures: ProcedureResponse[];
}
export interface ProcedureCreateRequest {
    name: string;
    status: ProcedureStatus;
    description?: string;
    details?: string;
    due_date?: string;
}
export interface ProcedureUpdateRequest {
    name?: string;
    status?: ProcedureStatus;
    description?: string;
    details?: string;
    due_date?: string;
}
export interface ProcedureStats {
    total: number;
    completed: number;
    pending: number;
    actionRequired: number;
}
export interface Aide {
    id: string;
    title: string;
    description: string;
    category: string;
    eligibility: string[];
    amount?: string;
    duration?: string;
    contact: {
        name: string;
        phone?: string;
        email?: string;
        website?: string;
    };
    created_at: string;
    updated_at: string;
}
export interface AidesListResponse {
    aides: Aide[];
}
export interface AideSearchRequest {
    query?: string;
    category?: string;
    location?: string;
    limit?: number;
    offset?: number;
}
export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    metadata?: Record<string, any>;
}
export interface ChatConversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    user_id: string;
    created_at: string;
    updated_at: string;
}
export interface ChatSendMessageRequest {
    content: string;
    conversationId?: string;
}
export interface ChatSendMessageResponse {
    message: ChatMessage;
    conversationId: string;
}
export interface ChatConversationsResponse {
    conversations: ChatConversation[];
}
export interface DashboardStats {
    documents: {
        total: number;
        totalSize: number;
    };
    procedures: ProcedureStats;
}
export interface DashboardStatsResponse {
    stats: DashboardStats;
}
export declare const API_ERROR_CODES: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly INVALID_FORMAT: "INVALID_FORMAT";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly ALREADY_EXISTS: "ALREADY_EXISTS";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly INVALID_FILE_TYPE: "INVALID_FILE_TYPE";
    readonly UPLOAD_FAILED: "UPLOAD_FAILED";
};
export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];
export interface PaginatedRequest {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    meta: ResponseMeta & {
        pagination: PaginationMeta;
    };
}
export interface DateRangeFilter {
    from?: string;
    to?: string;
}
export interface SearchFilters {
    query?: string;
    category?: string;
    status?: string;
    dateRange?: DateRangeFilter;
}
export interface HealthCheckResponse {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
    memory: {
        used: number;
        total: number;
        free: number;
    };
    version: string;
    environment: string;
}
export declare function createSuccessResponse<T>(data: T, meta?: Partial<ResponseMeta>): ApiResponse<T>;
export declare function createErrorResponse(code: ApiErrorCode, message: string, details?: Record<string, any>): ApiResponse;
export declare function createValidationError(field: string, message: string): ApiResponse;
//# sourceMappingURL=api.d.ts.map