import { z } from 'zod';
export const aideQuerySchema = z.object({
    codePostal: z.string().length(5),
    typeHandicap: z.string().min(2),
});
//# sourceMappingURL=aideSchema.js.map