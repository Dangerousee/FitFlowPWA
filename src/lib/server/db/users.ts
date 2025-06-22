import { supabase } from '@/lib/shared';
import type { UserDTO } from '@/types';
import camelcaseKeys from 'camelcase-keys';

export const getUserById = async (id: string): Promise<UserDTO | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[getUserById]', error);
    return null;
  }

  return camelcaseKeys(data);
};