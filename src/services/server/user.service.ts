import { SignUpRequestDTO, UserDTO } from '@types';
import { DB_TABLES, ERROR_CODES } from '@/constants';
import camelcaseKeys from 'camelcase-keys';
import { LoginType } from '@enums';
import bcrypt from 'bcryptjs';
import snakecaseKeys from 'snakecase-keys';
import { HttpStatusCode } from 'axios';
import { FetchMode, SupaQuery } from '@lib/server/db';

/**
 * 🔍 Public lookup methods (No accessToken required)
 *
 * - 사용자의 존재 여부를 email 또는 providerId로 조회하는 목적으로 사용됩니다.
 * - 로그인된 사용자 정보 또는 민감한 정보 조회에는 절대 사용하지 마세요!
 */
export const findById = async (id: string): Promise<UserDTO | null> => {
  const { data, error } = await new SupaQuery(DB_TABLES.USERS).eqs({ id }).fetch(FetchMode.SINGLE);

  if (error) {
    console.error('[getUserById]', error);
    return null;
  }

  // 💡 추가: data가 null인 경우를 명시적으로 처리
  // Supabase의 single() 쿼리는 일치하는 레코드가 없을 때 data: null, error: null을 반환할 수 있음.
  if (data === null) {
    return null;
  }

  return camelcaseKeys(data) as UserDTO;
};

/**
 * 이메일로 사용자를 조회합니다.
 * @param email - 조회할 사용자의 이메일
 * @returns 사용자 정보 또는 null
 */
export const findByEmail = async (email: string): Promise<UserDTO | null> => {
  const { data, error } = await new SupaQuery(DB_TABLES.USERS)
    .eq('email', email)
    .fetch(FetchMode.SINGLE);

  if (error) {
    console.error('[getUserByEmail]', error);
    return null;
  }

  return camelcaseKeys(data) as UserDTO;
};

/**
 * 소셜 로그인 제공사 정보로 사용자를 조회합니다.
 * @param providerType - 소셜 로그인 제공사 (e.g., 'kakao', 'google')
 * @param providerId - 제공사로부터 받은 고유 ID
 * @returns 사용자 정보 또는 null
 */
export const findByProviderInfo = async ({
  providerType,
  providerId,
}: {
  providerType: string;
  providerId: string;
}): Promise<UserDTO | null> => {
  const { data, error } = await new SupaQuery(DB_TABLES.USERS)
    .eqs({ provider_type: providerType, provider_id: providerId })
    .fetch(FetchMode.SINGLE);

  if (error) {
    console.error('[getUserByProviderInfo]', error);
    return null;
  }

  return camelcaseKeys(data) as UserDTO;
};

export const insertUser = async (param: SignUpRequestDTO): Promise<UserDTO> => {
  if (param.loginType === LoginType.NATIVE) {
    param.password = await bcrypt.hash(param.password, 10);
  }

  const { data, error } = await new SupaQuery(DB_TABLES.USERS).insert(snakecaseKeys(param as Record<string, any>));

  if (error) {
    if (error.code === '23505') {
      throw {
        statusCode: HttpStatusCode.Conflict,
        message: '이미 사용 중인 이메일 또는 아이디입니다.',
        code: ERROR_CODES.AUTH.USER_ALREADY_EXISTS,
        internalError: error.message,
      };
    }

    throw {
      statusCode: HttpStatusCode.InternalServerError,
      message: '사용자 프로필 생성 중 오류가 발생했습니다.',
      internalError: error.message,
    };
  }

  if (!data) {
    throw {
      statusCode: HttpStatusCode.InternalServerError,
      message: '프로필 생성 후 데이터를 받아오지 못했습니다.',
    };
  }

  return data as unknown as UserDTO;
}