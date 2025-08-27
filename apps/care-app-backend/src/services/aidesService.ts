
import { supabase } from '../config/supabase';
import { AideQuery } from '../validators/aideSchema';
import { anonymiserAide } from '../utils/privacy';

export const getAides = async (query: AideQuery) => {
  const { data, error } = await supabase
    .from('aides')
    .select('*')
    .ilike('region', `%${query.codePostal.slice(0, 2)}%`)
    .ilike('typeHandicap', `%${query.typeHandicap}%`);

  if (error) throw new Error(error.message);
  return data?.map(anonymiserAide) || [];
};
