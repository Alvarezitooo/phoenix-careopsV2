
export const anonymiserAide = (aide: any) => {
  const { lienFormulaire, ...rest } = aide;
  return {
    ...rest,
    lienFormulaire: lienFormulaire ? '[Lien sécurisé]' : undefined,
  };
};
