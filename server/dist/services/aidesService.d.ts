import { AideQuery } from '../validators/aideSchema.js';
export declare const getAides: (query: AideQuery) => Promise<{
    id: string;
    nom: string;
    description: string;
    region: string;
    typeHandicap: string[];
    montantEstime: number | undefined;
    lienFormulaire: string | undefined;
}[]>;
//# sourceMappingURL=aidesService.d.ts.map