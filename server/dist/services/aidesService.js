import { supabase } from '../config/supabase';
import { anonymiserAide } from '../utils/privacy';
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