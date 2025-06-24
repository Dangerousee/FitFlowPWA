import { supabase } from '@/lib/shared';
import type { UserDTO } from '@/types';
import camelcaseKeys from 'camelcase-keys';
import { SupaQuery } from '@lib/server/db/utils/SupaQuery';
import { FetchMode } from '@lib/server/db/utils/queryBuilder';

const DB_TABE = "users";

export const getUserById = async (id: string): Promise<UserDTO | null> => {

  const { data, error } = await new SupaQuery(DB_TABE).eqs({ id }).fetch(FetchMode.SINGLE);
  if (error) {
    console.error('[getUserById]', error);
    return null;
  }

  // const { data, error } = await supabase
  //   .from('users')
  //   .select('*')
  //   .eq('id', id)
  //   .single();
  //
  return camelcaseKeys(data);
};
