import { z } from 'zod';
export declare const aideQuerySchema: z.ZodObject<{
    codePostal: z.ZodString;
    typeHandicap: z.ZodString;
}, "strip", z.ZodTypeAny, {
    codePostal: string;
    typeHandicap: string;
}, {
    codePostal: string;
    typeHandicap: string;
}>;
export type AideQuery = z.infer<typeof aideQuerySchema>;
//# sourceMappingURL=aideSchema.d.ts.map