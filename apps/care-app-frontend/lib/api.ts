import { Aide } from "@/types";

export async function fetchAides(codePostal: string, typeHandicap: string): Promise<Aide[]> {
  // En utilisant une URL relative, l'appel se fera sur le même domaine que le site.
  // Ex: https://mon-site.vercel.app/api/aides
  const url = `/api/aides?${new URLSearchParams({ codePostal, typeHandicap })}`;

  const res = await fetch(url);

  if (!res.ok) {
    // On pourrait améliorer la gestion d'erreur ici
    throw new Error("Failed to fetch data from backend");
  }

  const data = await res.json();
  return data.aides || [];
}
