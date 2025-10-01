export interface SupabaseAideRow {
    id: string;
    nom: string;
    description?: string | null;
    region?: string | null;
    type_handicap?: string[] | string | null;
    montant_min?: number | null;
    montant_max?: number | null;
    url_info?: string | null;
}
export declare const anonymiserAide: (aide: SupabaseAideRow) => {
    id: string;
    nom: string;
    description: string;
    region: string;
    typeHandicap: string[];
    montantEstime: number | undefined;
    lienFormulaire: string | undefined;
};
//# sourceMappingURL=privacy.d.ts.map