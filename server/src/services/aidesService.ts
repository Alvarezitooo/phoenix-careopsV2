import { supabase } from '../config/supabase.js';
import { AideQuery } from '../validators/aideSchema.js';
import { anonymiserAide, SupabaseAideRow } from '../utils/privacy.js';

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const matchesRegion = (region: string | null | undefined, postalCode: string) => {
  if (!region) return true;
  const normalizedRegion = normalizeText(region);
  if (normalizedRegion.includes('national')) {
    return true;
  }

  const departmentCode = postalCode.slice(0, 2);
  return normalizedRegion.includes(departmentCode);
};

const matchesTypeHandicap = (types: string[], requestedType: string) => {
  if (!requestedType) return true;
  const normalizedRequested = normalizeText(requestedType);
  return types.some((type) => normalizeText(type).includes(normalizedRequested));
};

export const getAides = async (query: AideQuery) => {
  const { data, error } = await supabase.from('aides').select('*');

  if (error) {
    throw new Error(error.message);
  }

  const filtered = (data || []).filter((aide: SupabaseAideRow) => {
    const typeHandicapRaw = aide.type_handicap;
    const typeHandicapArray = Array.isArray(typeHandicapRaw)
      ? typeHandicapRaw
      : typeHandicapRaw
        ? [typeHandicapRaw]
        : [];

    return (
      matchesRegion(aide.region, query.codePostal) &&
      matchesTypeHandicap(typeHandicapArray, query.typeHandicap)
    );
  });

  return filtered.map(anonymiserAide);
};
