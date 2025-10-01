import { supabase } from '../config/supabase.js';
import { anonymiserAide } from '../utils/privacy.js';
const normalizeText = (value) => value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
const matchesRegion = (region, postalCode) => {
    if (!region)
        return true;
    const normalizedRegion = normalizeText(region);
    if (normalizedRegion.includes('national')) {
        return true;
    }
    const departmentCode = postalCode.slice(0, 2);
    return normalizedRegion.includes(departmentCode);
};
const matchesTypeHandicap = (types, requestedType) => {
    if (!requestedType)
        return true;
    const normalizedRequested = normalizeText(requestedType);
    return types.some((type) => normalizeText(type).includes(normalizedRequested));
};
export const getAides = async (query) => {
    const { data, error } = await supabase.from('aides').select('*');
    if (error) {
        throw new Error(error.message);
    }
    const filtered = (data || []).filter((aide) => {
        const typeHandicapRaw = aide.type_handicap;
        const typeHandicapArray = Array.isArray(typeHandicapRaw)
            ? typeHandicapRaw
            : typeHandicapRaw
                ? [typeHandicapRaw]
                : [];
        return (matchesRegion(aide.region, query.codePostal) &&
            matchesTypeHandicap(typeHandicapArray, query.typeHandicap));
    });
    return filtered.map(anonymiserAide);
};
//# sourceMappingURL=aidesService.js.map