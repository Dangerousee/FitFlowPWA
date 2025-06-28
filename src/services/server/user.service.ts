import { SignUpRequestDTO, UserDTO } from '@types';
import { DB_TABLES, ERROR_CODES } from '@/constants';
import camelcaseKeys from 'camelcase-keys';
import { LoginType } from '@enums';
import bcrypt from 'bcryptjs';
import snakecaseKeys from 'snakecase-keys';
import { HttpStatusCode } from 'axios';
import { FetchMode, SupaQuery } from '@lib/server/db';
import { StatusCodes } from 'http-status-codes';
import { isEmpty } from '@firebase/util';

export const findById = async (id: string): Promise<UserDTO | null> => {
  const { data, error } = await new SupaQuery(DB_TABLES.USERS).eqs({ id }).fetch(FetchMode.MAYBE_SINGLE);

  if (error) {
    console.error('[getUserById]', error);
    throw {
      statusCode: StatusCodes.BAD_REQUEST,
      message: error.message,
    }
  }

  // 💡 추가: data가 null인 경우를 명시적으로 처리
  // Supabase의 single() 쿼리는 일치하는 레코드가 없을 때 data: null, error: null을 반환할 수 있음.
  return data ? (camelcaseKeys(data) as UserDTO) : null;
};

/**
 * 이메일로 사용자를 조회합니다.
 * @param email - 조회할 사용자의 이메일
 * @returns 사용자 정보 또는 null
 */
export const findByEmail = async (email: string, loginType: LoginType): Promise<UserDTO | null> => {
  const { data, error } = await new SupaQuery(DB_TABLES.USERS)
    .eqs({'email': email, loginType: loginType})
    .fetch(FetchMode.MAYBE_SINGLE);

  if (error) {
    console.error('[getUserByEmail]', error);
    throw {
      statusCode: StatusCodes.BAD_REQUEST,
      message: error.message,
    }
  }

  return data ? (camelcaseKeys(data) as UserDTO) : null;
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
    .fetch(FetchMode.MAYBE_SINGLE);

  if (error) {
    console.error('[getUserByProviderInfo]', error);
    throw {
      statusCode: StatusCodes.BAD_REQUEST,
      message: error.message,
    }
  }

  return data ? (camelcaseKeys(data) as UserDTO) : null;
};

export const insertUser = async (dto: SignUpRequestDTO): Promise<UserDTO> => {
  if (dto.loginType === LoginType.NATIVE) {
    dto.password = await bcrypt.hash(dto.password, 10);
  }

  const { data, error } = await new SupaQuery(DB_TABLES.USERS).insert(snakecaseKeys(dto as Record<string, any>));

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

  if (!data || isEmpty(data)) {
    throw {
      statusCode: HttpStatusCode.InternalServerError,
      message: '프로필 생성 후 데이터를 받아오지 못했습니다.',
    };
  }

  return camelcaseKeys(data[0]) as UserDTO;
}