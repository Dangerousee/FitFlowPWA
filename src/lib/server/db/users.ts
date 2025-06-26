import { supabase } from '@/lib/shared';
import type { PublicUserDTO, UserDTO } from '@/types';
import camelcaseKeys from 'camelcase-keys';
import { SupaQuery } from '@lib/server/db/utils/SupaQuery';
import { FetchMode } from '@lib/server/db/utils/SupaQuery';
import { DB_USERS } from '@/lib';

export const getUserById = async (id: string): Promise<UserDTO | null> => {

  const { data, error } = await new SupaQuery<UserDTO>(DB_USERS).eqs({ id }).fetch(FetchMode.SINGLE);

  if (error) {
    console.error('[getUserById]', error);
    return null;
  }

  // 💡 추가: data가 null인 경우를 명시적으로 처리
  // Supabase의 single() 쿼리는 일치하는 레코드가 없을 때 data: null, error: null을 반환할 수 있음.
  if (data === null) {
    return null;
  }

  return camelcaseKeys(data);
};