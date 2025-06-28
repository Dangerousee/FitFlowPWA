import { LoginRequestDTO, RefreshSession, UserDTO } from '@types';
import { AccountStatus, LoginType, ProviderType } from '@enums';
import { DB_TABLES, ERROR_CODES } from '@/constants';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import camelcaseKeys from 'camelcase-keys';
import { isEmpty } from '@firebase/util';
import { NextApiRequest } from 'next';
import { hashToken } from '@lib/shared/jwt';
import { FetchMode, SupaQuery, buildInsertQuery, buildUpdateQuery } from '@lib/server/db';

export async function authUser(body: LoginRequestDTO): Promise<UserDTO> {
  switch (body.loginType) {
    case LoginType.NATIVE:
      return authNativeUser(body.email, body.password);

    case LoginType.SOCIAL:
      return authSocialUser(body.providerType, body.providerId);

    default:
      throw {
        statusCode: StatusCodes.BAD_REQUEST,
        message: '지원하지 않는 로그인 타입입니다.',
        code: ERROR_CODES.AUTH.UNKNOWN_LOGIN_TYPE,
      };
  }
}

/** Supabase 사용자 인증 처리 */
export async function authNativeUser(email: string, plainPassword: string): Promise<UserDTO> {

  if (!plainPassword || !email) {
    throw {
      statusCode: StatusCodes.BAD_REQUEST,
      message: '이메일 또는 비밀번호가 누락되었습니다.',
      code: ERROR_CODES.AUTH.MISSING_CREDENTIAL,
    }
  }

  const { data: userProfile, error: fetchError } = await new SupaQuery<Record<string, any>>(DB_TABLES.USERS)
    .eqs({ login_type: LoginType.NATIVE, email })
    .fetch(FetchMode.SINGLE);

  if (fetchError || !userProfile) {
    // 사용자 존재 여부 노출을 피하기 위해 일반적인 오류 메시지를 사용
    console.warn(`로그인 시도 실패 (이메일: ${email}): 사용자를 찾을 수 없거나 DB 오류 발생.`, fetchError?.message);
    throw {
      statusCode: StatusCodes.UNAUTHORIZED, // Unauthorized
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      code: ERROR_CODES.AUTH.INVALID_CREDENTIALS,
    };
  }

  if (!userProfile.password) {
    console.error(`로그인 실패 (이메일: ${email}): 사용자 레코드는 찾았으나 저장된 비밀번호 해시가 없습니다.`);
    // 이는 서버 측 설정 또는 데이터 무결성 문제
    throw {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: '로그인 처리 중 서버 오류가 발생했습니다. 관리자에게 문의하세요.',
      code: ERROR_CODES.AUTH.USER_DATA_INCOMPLETE,
    };
  }

  // 입력된 비밀번호와 저장된 해시된 비밀번호를 비교
  const passwordsMatch = await bcrypt.compare(plainPassword, userProfile.password);

  if (!passwordsMatch) {
    console.warn(`로그인 시도 실패 (이메일: ${email}): 비밀번호 불일치.`);
    throw {
      statusCode: StatusCodes.UNAUTHORIZED,
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      code: ERROR_CODES.AUTH.INVALID_CREDENTIALS,
    };
  }

  // 반환되는 사용자 객체에서 비밀번호 필드를 제거
  const { password, ...secureUserProfile } = userProfile;
  return camelcaseKeys(secureUserProfile) as UserDTO;
}

export async function authSocialUser(providerType: ProviderType, providerId: string): Promise<UserDTO> {
  const errMessage = `${providerType}: ${providerId}`;

  if (!providerType || !providerId) {
    throw {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Provider type 또는 provide id가 누락되었습니다.',
      code: ERROR_CODES.AUTH.MISSING_CREDENTIAL,
    }
  }

  const { data, error: fetchError } = await new SupaQuery<Record<string, any>>(DB_TABLES.USERS)
    .eqs({ login_type: LoginType.SOCIAL, provider_type: providerType, provider_id: providerId})
    .fetch(FetchMode.MAYBE_SINGLE);

// DB 오류
  if (fetchError) {
    console.error(`DB 오류 (${errMessage}):`, fetchError.message);
    throw {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: '로그인 처리 중 서버 오류가 발생했습니다. 관리자에게 문의하세요.',
      code: ERROR_CODES.DB.GENERIC_DB_ERROR,
    };
  }

  // 사용자 없음
  if (!data) {
    console.warn(`로그인 시도 실패 (${errMessage}): 사용자를 찾을 수 없습니다.`);
    throw {
      statusCode: StatusCodes.UNAUTHORIZED,
      message: '로그인 정보가 올바르지 않습니다.',
      code: ERROR_CODES.AUTH.USER_NOT_FOUND,
    };
  }

  const userProfile = camelcaseKeys(data) as UserDTO;

  if (!userProfile.providerType || !userProfile.providerId) {
    console.error(`로그인 실패 (${errMessage}): 사용자 레코드는 찾았으나 저장된 소셜 정보가 없습니다.`);
    // 이는 서버 측 설정 또는 데이터 무결성 문제
    throw {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: '로그인 처리 중 서버 오류가 발생했습니다. 관리자에게 문의하세요.',
      code: ERROR_CODES.AUTH.USER_DATA_INCOMPLETE,
    };
  }

  const isTypeMatch = providerType === userProfile.providerType;
  const idMatch = providerId === userProfile.providerId;

  if (!isTypeMatch || !idMatch) {
    console.warn(`로그인 시도 실패 (${errMessage}): 로그인 정보 불일치.`);
    throw {
      statusCode: StatusCodes.UNAUTHORIZED,
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      code: ERROR_CODES.AUTH.INVALID_CREDENTIALS,
    };
  }

  return userProfile;
}

/**
 * 사용자 계정 상태를 확인합니다 (휴면, 탈퇴 등).
 */
export async function checkUserAccountStatus(user: UserDTO): Promise<void> {
  switch (user.accountStatus) {
    case AccountStatus.ACTIVE:
      break;
    case AccountStatus.INACTIVE:
      throw {
        statusCode: StatusCodes.FORBIDDEN,
        message: '비활성화된 계정입니다. 관리자에게 문의하세요.',
        code: ERROR_CODES.ACCOUNT.INACTIVE,
      };
    case AccountStatus.BANNED:
      throw {
        statusCode: StatusCodes.FORBIDDEN,
        message: '이용이 제한된 계정입니다. 관리자에게 문의하세요.',
        code: ERROR_CODES.ACCOUNT.BANNED,
      };
    case AccountStatus.DORMANT:
      throw {
        statusCode: StatusCodes.FORBIDDEN,
        message: '휴면 계정입니다. 계정 활성화가 필요합니다.',
        code: ERROR_CODES.ACCOUNT.DORMANT,
      };
    case AccountStatus.WITHDRAWN:
      throw {
        statusCode: StatusCodes.FORBIDDEN,
        message: '탈퇴한 계정입니다.',
        code: ERROR_CODES.ACCOUNT.WITHDRAWN,
      };
    default:
      // 예기치 않은 상태 값에 대한 처리 (선택 사항)
      console.warn(`알 수 없는 사용자 상태입니다: ${user.accountStatus}`);
      throw {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: '알 수 없는 사용자 계정 상태입니다.',
        code: ERROR_CODES.ACCOUNT.UNKNOWN_STATUS,
      };
  }
}

/**
 * 비밀번호 만료일 확인
 */
export async function checkPasswordPolicy(user: UserDTO): Promise<void> {
  const passwordPolicyDays = 90;
  if (user.passwordLastChangedAt) {
    const lastChanged = new Date(user.passwordLastChangedAt);
    const expiryDate = new Date(lastChanged.setDate(lastChanged.getDate() + passwordPolicyDays));
    if (new Date() > expiryDate) {
      throw {
        statusCode: StatusCodes.FORBIDDEN,
        message: '비밀번호 변경 기간이 만료되었습니다. 비밀번호를 변경해주세요.',
        code: ERROR_CODES.AUTH.PASSWORD_EXPIRED,
      };
    }
  }
}


/**
 * Supabase 사용자의 최종 로그인 시간 및 상태를 업데이트
 */
export async function updateUserLoginDetails(userId: string, timestamp: string): Promise<UserDTO[]> {
  const { data: updatedUser, error } = await buildUpdateQuery<UserDTO>(
    DB_TABLES.USERS,
    { last_login_at: timestamp,
      account_status: AccountStatus.ACTIVE, // 로그인 성공 시 'active'로 명시적 설정
      updated_at: timestamp,
    },
    { id: userId });

  if (error || isEmpty(updatedUser ?? [])) {
    console.error(`Supabase last_login_at 업데이트 오류 (사용자 ID: ${userId}):`, error?.message);
    throw {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: '로그인 정보 업데이트에 실패했습니다.',
      internalError: error?.message,
      code: ERROR_CODES.DB.SUPABASE_LOGIN_UPDATE_FAILED,
    };
  }
  return updatedUser || [];
}

export async function createRefreshSession(
  user: UserDTO,
  refreshToken: string,
  req: NextApiRequest
): Promise<RefreshSession[]> {
  const deviceInfo = req.headers['user-agent'] || 'unknown';
  const ipAddress = req.socket?.remoteAddress || null;
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후
  const hashedRefreshToken = hashToken(refreshToken);

  const { data, error } = await buildInsertQuery<RefreshSession>(
    DB_TABLES.REFRESH_SESSIONS,
    [
      {
        user_id: user.id,
        refresh_token: hashedRefreshToken,
        device_info: deviceInfo,
        ip_address: ipAddress,
        issued_at: now.toISOString(),
        expires_at: expires.toISOString(),
      },
    ],
  );

  if (error || isEmpty(data ?? [])) {
    console.error('refresh 세션 저장 실패:', error?.message);
    throw {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: '세션 저장 중 오류가 발생했습니다.',
      internalError: error?.message,
    };
  }

  return data ?? [];
}