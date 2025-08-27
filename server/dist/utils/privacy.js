export const anonymiserAide = (aide) => {
    const { lienFormulaire, ...rest } = aide;
    return {
        ...rest,
        lienFormulaire: lienFormulaire ? '[Lien sécurisé]' : undefined,
    };
};
//# sourceMappingURL=privacy.js.map