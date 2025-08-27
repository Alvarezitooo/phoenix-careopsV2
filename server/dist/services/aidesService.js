import { supabase } from '../config/supabase.js';
import { anonymiserAide } from '../utils/privacy.js';
export const getAides = async (query) => {
    const { data, error } = await supabase
        .from('aides')
        .select('*')
        .ilike('region', `%${query.codePostal.slice(0, 2)}%`)
        .ilike('typeHandicap', `%${query.typeHandicap}%`);
    if (error)
        throw new Error(error.message);
    return data?.map(anonymiserAide) || [];
};
//# sourceMappingURL=aidesService.js.map