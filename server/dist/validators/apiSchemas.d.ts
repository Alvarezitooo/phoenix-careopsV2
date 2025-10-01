import { z } from 'zod';
export declare const baseSchemas: {
    uuid: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    isoDate: z.ZodString;
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        order: "asc" | "desc";
        sort?: string | undefined;
    }, {
        sort?: string | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        order?: "asc" | "desc" | undefined;
    }>;
};
export declare const authSchemas: {
    login: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
    register: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
        name: string;
    }, {
        email: string;
        password: string;
        name: string;
    }>;
    forgotPassword: z.ZodObject<{
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
    }, {
        email: string;
    }>;
    resetPassword: z.ZodObject<{
        token: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password: string;
        token: string;
    }, {
        password: string;
        token: string;
    }>;
    changePassword: z.ZodObject<{
        currentPassword: z.ZodString;
        newPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        currentPassword: string;
        newPassword: string;
    }, {
        currentPassword: string;
        newPassword: string;
    }>;
};
export declare const documentSchemas: {
    create: z.ZodObject<{
        name: z.ZodString;
        file_path: z.ZodString;
        mime_type: z.ZodString;
        size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        file_path: string;
        mime_type: string;
        size: number;
    }, {
        name: string;
        file_path: string;
        mime_type: string;
        size: number;
    }>;
    update: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
    }, {
        name?: string | undefined;
    }>;
    search: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
        q: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        order: "asc" | "desc";
        type?: string | undefined;
        sort?: string | undefined;
        q?: string | undefined;
        category?: string | undefined;
    }, {
        type?: string | undefined;
        sort?: string | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        order?: "asc" | "desc" | undefined;
        q?: string | undefined;
        category?: string | undefined;
    }>;
};
export declare const procedureSchemas: {
    create: z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<["pending", "in_progress", "action_required", "completed", "rejected"]>;
        description: z.ZodOptional<z.ZodString>;
        details: z.ZodOptional<z.ZodString>;
        due_date: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "in_progress" | "action_required" | "completed" | "rejected";
        name: string;
        details?: string | undefined;
        description?: string | undefined;
        due_date?: string | undefined;
    }, {
        status: "pending" | "in_progress" | "action_required" | "completed" | "rejected";
        name: string;
        details?: string | undefined;
        description?: string | undefined;
        due_date?: string | undefined;
    }>;
    update: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "action_required", "completed", "rejected"]>>;
        description: z.ZodOptional<z.ZodString>;
        details: z.ZodOptional<z.ZodString>;
        due_date: z.ZodOptional<z.ZodString>;
        completed_date: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status?: "pending" | "in_progress" | "action_required" | "completed" | "rejected" | undefined;
        details?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        due_date?: string | undefined;
        completed_date?: string | undefined;
    }, {
        status?: "pending" | "in_progress" | "action_required" | "completed" | "rejected" | undefined;
        details?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        due_date?: string | undefined;
        completed_date?: string | undefined;
    }>;
    search: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
        q: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "action_required", "completed", "rejected"]>>;
        category: z.ZodOptional<z.ZodString>;
        due_date_from: z.ZodOptional<z.ZodString>;
        due_date_to: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        order: "asc" | "desc";
        sort?: string | undefined;
        status?: "pending" | "in_progress" | "action_required" | "completed" | "rejected" | undefined;
        q?: string | undefined;
        category?: string | undefined;
        due_date_from?: string | undefined;
        due_date_to?: string | undefined;
    }, {
        sort?: string | undefined;
        status?: "pending" | "in_progress" | "action_required" | "completed" | "rejected" | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        order?: "asc" | "desc" | undefined;
        q?: string | undefined;
        category?: string | undefined;
        due_date_from?: string | undefined;
        due_date_to?: string | undefined;
    }>;
};
export declare const aideSchemas: {
    search: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
        q: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        eligibility: z.ZodOptional<z.ZodString>;
        amount_min: z.ZodOptional<z.ZodNumber>;
        amount_max: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        order: "asc" | "desc";
        sort?: string | undefined;
        location?: string | undefined;
        q?: string | undefined;
        category?: string | undefined;
        eligibility?: string | undefined;
        amount_min?: number | undefined;
        amount_max?: number | undefined;
    }, {
        sort?: string | undefined;
        location?: string | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        order?: "asc" | "desc" | undefined;
        q?: string | undefined;
        category?: string | undefined;
        eligibility?: string | undefined;
        amount_min?: number | undefined;
        amount_max?: number | undefined;
    }>;
    create: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        category: z.ZodString;
        eligibility: z.ZodArray<z.ZodString, "many">;
        amount: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        contact: z.ZodObject<{
            name: z.ZodString;
            phone: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            email?: string | undefined;
            phone?: string | undefined;
            website?: string | undefined;
        }, {
            name: string;
            email?: string | undefined;
            phone?: string | undefined;
            website?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        category: string;
        eligibility: string[];
        title: string;
        contact: {
            name: string;
            email?: string | undefined;
            phone?: string | undefined;
            website?: string | undefined;
        };
        duration?: string | undefined;
        amount?: string | undefined;
    }, {
        description: string;
        category: string;
        eligibility: string[];
        title: string;
        contact: {
            name: string;
            email?: string | undefined;
            phone?: string | undefined;
            website?: string | undefined;
        };
        duration?: string | undefined;
        amount?: string | undefined;
    }>;
    update: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        eligibility: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        amount: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        contact: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            phone: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            email?: string | undefined;
            phone?: string | undefined;
            website?: string | undefined;
        }, {
            name: string;
            email?: string | undefined;
            phone?: string | undefined;
            website?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        duration?: string | undefined;
        description?: string | undefined;
        category?: string | undefined;
        eligibility?: string[] | undefined;
        title?: string | undefined;
        amount?: string | undefined;
        contact?: {
            name: string;
            email?: string | undefined;
            phone?: string | undefined;
            website?: string | undefined;
        } | undefined;
    }, {
        duration?: string | undefined;
        description?: string | undefined;
        category?: string | undefined;
        eligibility?: string[] | undefined;
        title?: string | undefined;
        amount?: string | undefined;
        contact?: {
            name: string;
            email?: string | undefined;
            phone?: string | undefined;
            website?: string | undefined;
        } | undefined;
    }>;
};
export declare const chatSchemas: {
    sendMessage: z.ZodObject<{
        content: z.ZodString;
        conversationId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        conversationId?: string | undefined;
    }, {
        content: string;
        conversationId?: string | undefined;
    }>;
    createConversation: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        initialMessage: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        initialMessage: string;
        title?: string | undefined;
    }, {
        initialMessage: string;
        title?: string | undefined;
    }>;
    updateConversation: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title?: string | undefined;
    }, {
        title?: string | undefined;
    }>;
    searchConversations: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
        q: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        order: "asc" | "desc";
        sort?: string | undefined;
        q?: string | undefined;
    }, {
        sort?: string | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        order?: "asc" | "desc" | undefined;
        q?: string | undefined;
    }>;
};
export declare const userSchemas: {
    updateProfile: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        name?: string | undefined;
        phone?: string | undefined;
        avatar?: string | undefined;
    }, {
        email?: string | undefined;
        name?: string | undefined;
        phone?: string | undefined;
        avatar?: string | undefined;
    }>;
    updatePreferences: z.ZodObject<{
        language: z.ZodDefault<z.ZodEnum<["fr", "en"]>>;
        theme: z.ZodDefault<z.ZodEnum<["light", "dark", "system"]>>;
        notifications: z.ZodDefault<z.ZodObject<{
            email: z.ZodDefault<z.ZodBoolean>;
            push: z.ZodDefault<z.ZodBoolean>;
            sms: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            push: boolean;
            email: boolean;
            sms: boolean;
        }, {
            push?: boolean | undefined;
            email?: boolean | undefined;
            sms?: boolean | undefined;
        }>>;
        accessibility: z.ZodDefault<z.ZodObject<{
            fontSize: z.ZodDefault<z.ZodEnum<["small", "medium", "large"]>>;
            highContrast: z.ZodDefault<z.ZodBoolean>;
            reduceMotion: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            fontSize: "small" | "medium" | "large";
            highContrast: boolean;
            reduceMotion: boolean;
        }, {
            fontSize?: "small" | "medium" | "large" | undefined;
            highContrast?: boolean | undefined;
            reduceMotion?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        language: "fr" | "en";
        theme: "system" | "light" | "dark";
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large";
            highContrast: boolean;
            reduceMotion: boolean;
        };
    }, {
        language?: "fr" | "en" | undefined;
        theme?: "system" | "light" | "dark" | undefined;
        notifications?: {
            push?: boolean | undefined;
            email?: boolean | undefined;
            sms?: boolean | undefined;
        } | undefined;
        accessibility?: {
            fontSize?: "small" | "medium" | "large" | undefined;
            highContrast?: boolean | undefined;
            reduceMotion?: boolean | undefined;
        } | undefined;
    }>;
};
export declare const fileSchemas: {
    upload: z.ZodObject<{
        name: z.ZodString;
        size: z.ZodNumber;
        type: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        size: number;
    }, {
        type: string;
        name: string;
        size: number;
    }>;
};
export declare const querySchemas: {
    idParam: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    search: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
        q: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        order: "asc" | "desc";
        sort?: string | undefined;
        q?: string | undefined;
    }, {
        sort?: string | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        order?: "asc" | "desc" | undefined;
        q?: string | undefined;
    }>;
    dateRange: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
        from: z.ZodOptional<z.ZodString>;
        to: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        order: "asc" | "desc";
        sort?: string | undefined;
        from?: string | undefined;
        to?: string | undefined;
    }, {
        sort?: string | undefined;
        from?: string | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        order?: "asc" | "desc" | undefined;
        to?: string | undefined;
    }>;
};
export declare const schemas: {
    base: {
        uuid: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        isoDate: z.ZodString;
        pagination: z.ZodObject<{
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
            sort: z.ZodOptional<z.ZodString>;
            order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            order: "asc" | "desc";
            sort?: string | undefined;
        }, {
            sort?: string | undefined;
            page?: number | undefined;
            limit?: number | undefined;
            order?: "asc" | "desc" | undefined;
        }>;
    };
    auth: {
        login: z.ZodObject<{
            email: z.ZodString;
            password: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email: string;
            password: string;
        }, {
            email: string;
            password: string;
        }>;
        register: z.ZodObject<{
            email: z.ZodString;
            password: z.ZodString;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email: string;
            password: string;
            name: string;
        }, {
            email: string;
            password: string;
            name: string;
        }>;
        forgotPassword: z.ZodObject<{
            email: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email: string;
        }, {
            email: string;
        }>;
        resetPassword: z.ZodObject<{
            token: z.ZodString;
            password: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            password: string;
            token: string;
        }, {
            password: string;
            token: string;
        }>;
        changePassword: z.ZodObject<{
            currentPassword: z.ZodString;
            newPassword: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            currentPassword: string;
            newPassword: string;
        }, {
            currentPassword: string;
            newPassword: string;
        }>;
    };
    documents: {
        create: z.ZodObject<{
            name: z.ZodString;
            file_path: z.ZodString;
            mime_type: z.ZodString;
            size: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            name: string;
            file_path: string;
            mime_type: string;
            size: number;
        }, {
            name: string;
            file_path: string;
            mime_type: string;
            size: number;
        }>;
        update: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
        }, {
            name?: string | undefined;
        }>;
        search: z.ZodObject<{
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
            sort: z.ZodOptional<z.ZodString>;
            order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
            q: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            order: "asc" | "desc";
            type?: string | undefined;
            sort?: string | undefined;
            q?: string | undefined;
            category?: string | undefined;
        }, {
            type?: string | undefined;
            sort?: string | undefined;
            page?: number | undefined;
            limit?: number | undefined;
            order?: "asc" | "desc" | undefined;
            q?: string | undefined;
            category?: string | undefined;
        }>;
    };
    procedures: {
        create: z.ZodObject<{
            name: z.ZodString;
            status: z.ZodEnum<["pending", "in_progress", "action_required", "completed", "rejected"]>;
            description: z.ZodOptional<z.ZodString>;
            details: z.ZodOptional<z.ZodString>;
            due_date: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status: "pending" | "in_progress" | "action_required" | "completed" | "rejected";
            name: string;
            details?: string | undefined;
            description?: string | undefined;
            due_date?: string | undefined;
        }, {
            status: "pending" | "in_progress" | "action_required" | "completed" | "rejected";
            name: string;
            details?: string | undefined;
            description?: string | undefined;
            due_date?: string | undefined;
        }>;
        update: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "action_required", "completed", "rejected"]>>;
            description: z.ZodOptional<z.ZodString>;
            details: z.ZodOptional<z.ZodString>;
            due_date: z.ZodOptional<z.ZodString>;
            completed_date: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status?: "pending" | "in_progress" | "action_required" | "completed" | "rejected" | undefined;
            details?: string | undefined;
            name?: string | undefined;
            description?: string | undefined;
            due_date?: string | undefined;
            completed_date?: string | undefined;
        }, {
            status?: "pending" | "in_progress" | "action_required" | "completed" | "rejected" | undefined;
            details?: string | undefined;
            name?: string | undefined;
            description?: string | undefined;
            due_date?: string | undefined;
            completed_date?: string | undefined;
        }>;
        search: z.ZodObject<{
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
            sort: z.ZodOptional<z.ZodString>;
            order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
            q: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "action_required", "completed", "rejected"]>>;
            category: z.ZodOptional<z.ZodString>;
            due_date_from: z.ZodOptional<z.ZodString>;
            due_date_to: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            order: "asc" | "desc";
            sort?: string | undefined;
            status?: "pending" | "in_progress" | "action_required" | "completed" | "rejected" | undefined;
            q?: string | undefined;
            category?: string | undefined;
            due_date_from?: string | undefined;
            due_date_to?: string | undefined;
        }, {
            sort?: string | undefined;
            status?: "pending" | "in_progress" | "action_required" | "completed" | "rejected" | undefined;
            page?: number | undefined;
            limit?: number | undefined;
            order?: "asc" | "desc" | undefined;
            q?: string | undefined;
            category?: string | undefined;
            due_date_from?: string | undefined;
            due_date_to?: string | undefined;
        }>;
    };
    aides: {
        search: z.ZodObject<{
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
            sort: z.ZodOptional<z.ZodString>;
            order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
            q: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
            location: z.ZodOptional<z.ZodString>;
            eligibility: z.ZodOptional<z.ZodString>;
            amount_min: z.ZodOptional<z.ZodNumber>;
            amount_max: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            order: "asc" | "desc";
            sort?: string | undefined;
            location?: string | undefined;
            q?: string | undefined;
            category?: string | undefined;
            eligibility?: string | undefined;
            amount_min?: number | undefined;
            amount_max?: number | undefined;
        }, {
            sort?: string | undefined;
            location?: string | undefined;
            page?: number | undefined;
            limit?: number | undefined;
            order?: "asc" | "desc" | undefined;
            q?: string | undefined;
            category?: string | undefined;
            eligibility?: string | undefined;
            amount_min?: number | undefined;
            amount_max?: number | undefined;
        }>;
        create: z.ZodObject<{
            title: z.ZodString;
            description: z.ZodString;
            category: z.ZodString;
            eligibility: z.ZodArray<z.ZodString, "many">;
            amount: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodString>;
            contact: z.ZodObject<{
                name: z.ZodString;
                phone: z.ZodOptional<z.ZodString>;
                email: z.ZodOptional<z.ZodString>;
                website: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                email?: string | undefined;
                phone?: string | undefined;
                website?: string | undefined;
            }, {
                name: string;
                email?: string | undefined;
                phone?: string | undefined;
                website?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            category: string;
            eligibility: string[];
            title: string;
            contact: {
                name: string;
                email?: string | undefined;
                phone?: string | undefined;
                website?: string | undefined;
            };
            duration?: string | undefined;
            amount?: string | undefined;
        }, {
            description: string;
            category: string;
            eligibility: string[];
            title: string;
            contact: {
                name: string;
                email?: string | undefined;
                phone?: string | undefined;
                website?: string | undefined;
            };
            duration?: string | undefined;
            amount?: string | undefined;
        }>;
        update: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
            eligibility: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            amount: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodString>;
            contact: z.ZodOptional<z.ZodObject<{
                name: z.ZodString;
                phone: z.ZodOptional<z.ZodString>;
                email: z.ZodOptional<z.ZodString>;
                website: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                email?: string | undefined;
                phone?: string | undefined;
                website?: string | undefined;
            }, {
                name: string;
                email?: string | undefined;
                phone?: string | undefined;
                website?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            duration?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            eligibility?: string[] | undefined;
            title?: string | undefined;
            amount?: string | undefined;
            contact?: {
                name: string;
                email?: string | undefined;
                phone?: string | undefined;
                website?: string | undefined;
            } | undefined;
        }, {
            duration?: string | undefined;
            description?: string | undefined;
            category?: string | undefined;
            eligibility?: string[] | undefined;
            title?: string | undefined;
            amount?: string | undefined;
            contact?: {
                name: string;
                email?: string | undefined;
                phone?: string | undefined;
                website?: string | undefined;
            } | undefined;
        }>;
    };
    chat: {
        sendMessage: z.ZodObject<{
            content: z.ZodString;
            conversationId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            content: string;
            conversationId?: string | undefined;
        }, {
            content: string;
            conversationId?: string | undefined;
        }>;
        createConversation: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            initialMessage: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            initialMessage: string;
            title?: string | undefined;
        }, {
            initialMessage: string;
            title?: string | undefined;
        }>;
        updateConversation: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title?: string | undefined;
        }, {
            title?: string | undefined;
        }>;
        searchConversations: z.ZodObject<{
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
            sort: z.ZodOptional<z.ZodString>;
            order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
            q: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            order: "asc" | "desc";
            sort?: string | undefined;
            q?: string | undefined;
        }, {
            sort?: string | undefined;
            page?: number | undefined;
            limit?: number | undefined;
            order?: "asc" | "desc" | undefined;
            q?: string | undefined;
        }>;
    };
    user: {
        updateProfile: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            avatar: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            email?: string | undefined;
            name?: string | undefined;
            phone?: string | undefined;
            avatar?: string | undefined;
        }, {
            email?: string | undefined;
            name?: string | undefined;
            phone?: string | undefined;
            avatar?: string | undefined;
        }>;
        updatePreferences: z.ZodObject<{
            language: z.ZodDefault<z.ZodEnum<["fr", "en"]>>;
            theme: z.ZodDefault<z.ZodEnum<["light", "dark", "system"]>>;
            notifications: z.ZodDefault<z.ZodObject<{
                email: z.ZodDefault<z.ZodBoolean>;
                push: z.ZodDefault<z.ZodBoolean>;
                sms: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                push: boolean;
                email: boolean;
                sms: boolean;
            }, {
                push?: boolean | undefined;
                email?: boolean | undefined;
                sms?: boolean | undefined;
            }>>;
            accessibility: z.ZodDefault<z.ZodObject<{
                fontSize: z.ZodDefault<z.ZodEnum<["small", "medium", "large"]>>;
                highContrast: z.ZodDefault<z.ZodBoolean>;
                reduceMotion: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                fontSize: "small" | "medium" | "large";
                highContrast: boolean;
                reduceMotion: boolean;
            }, {
                fontSize?: "small" | "medium" | "large" | undefined;
                highContrast?: boolean | undefined;
                reduceMotion?: boolean | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            language: "fr" | "en";
            theme: "system" | "light" | "dark";
            notifications: {
                push: boolean;
                email: boolean;
                sms: boolean;
            };
            accessibility: {
                fontSize: "small" | "medium" | "large";
                highContrast: boolean;
                reduceMotion: boolean;
            };
        }, {
            language?: "fr" | "en" | undefined;
            theme?: "system" | "light" | "dark" | undefined;
            notifications?: {
                push?: boolean | undefined;
                email?: boolean | undefined;
                sms?: boolean | undefined;
            } | undefined;
            accessibility?: {
                fontSize?: "small" | "medium" | "large" | undefined;
                highContrast?: boolean | undefined;
                reduceMotion?: boolean | undefined;
            } | undefined;
        }>;
    };
    file: {
        upload: z.ZodObject<{
            name: z.ZodString;
            size: z.ZodNumber;
            type: z.ZodEffects<z.ZodString, string, string>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            size: number;
        }, {
            type: string;
            name: string;
            size: number;
        }>;
    };
    query: {
        idParam: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        search: z.ZodObject<{
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
            sort: z.ZodOptional<z.ZodString>;
            order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
            q: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            order: "asc" | "desc";
            sort?: string | undefined;
            q?: string | undefined;
        }, {
            sort?: string | undefined;
            page?: number | undefined;
            limit?: number | undefined;
            order?: "asc" | "desc" | undefined;
            q?: string | undefined;
        }>;
        dateRange: z.ZodObject<{
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
            sort: z.ZodOptional<z.ZodString>;
            order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
            from: z.ZodOptional<z.ZodString>;
            to: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            order: "asc" | "desc";
            sort?: string | undefined;
            from?: string | undefined;
            to?: string | undefined;
        }, {
            sort?: string | undefined;
            from?: string | undefined;
            page?: number | undefined;
            limit?: number | undefined;
            order?: "asc" | "desc" | undefined;
            to?: string | undefined;
        }>;
    };
};
//# sourceMappingURL=apiSchemas.d.ts.map