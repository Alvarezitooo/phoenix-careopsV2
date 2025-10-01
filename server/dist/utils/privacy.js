export const anonymiserAide = (aide) => {
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
//# sourceMappingURL=privacy.js.map