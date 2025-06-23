import { supabase } from '@lib/shared';
import camelcaseKeys from 'camelcase-keys';
import { UserDTO } from '@types';

export const getUserByEmail = async (email: string): Promise<UserDTO | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('[getUserByEmail]', error);
    return null;
  }

  return camelcaseKeys(data);
};