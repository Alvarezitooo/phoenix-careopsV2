import { Aide } from "@/types";

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} -> ${res.status}`);
  return res.json();
}

export async function fetchAides(codePostal: string, typeHandicap: string): Promise<Aide[]> {
  try {
    const data = await apiGet<{ aides: Aide[] }>(`/api/aides?${new URLSearchParams({ codePostal, typeHandicap })}`);
    return data.aides || [];
  } catch (error) {
    console.error('Erreur fetchAides:', error);
    throw new Error("Failed to fetch data from backend");
  }
}
