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

export const anonymiserAide = (aide: SupabaseAideRow) => {
  const typeHandicapRaw = aide.type_handicap;
  const typeHandicapArray = Array.isArray(typeHandicapRaw)
    ? typeHandicapRaw
    : typeHandicapRaw
      ? [typeHandicapRaw]
      : [];

  const montantEstime = aide.montant_max ?? aide.montant_min ?? undefined;

  return {
    id: aide.id,
    nom: aide.nom,
    description: aide.description ?? '',
    region: aide.region ?? 'National',
    typeHandicap: typeHandicapArray,
    montantEstime,
    lienFormulaire: aide.url_info ? '[Lien sécurisé]' : undefined,
  };
};
