import { NextApiRequest } from 'next';
import { SupabaseUserDTO, LoginRequestDTO, RefreshSession, SignUpRequestDTO } from '@types';
import { AccountStatus, LoginType, ProviderType } from '@enums';
import { hashToken, supabase } from '@/lib';
import * as ErrorCodes from '@constants/errorCodes';
import bcrypt from 'bcryptjs';
import camelcaseKeys from 'camelcase-keys';
import { USER_NOT_FOUND } from '@constants/errorCodes';

export async function authenticateSupabaseUser(body: LoginRequestDTO): Promise<SupabaseUserDTO> {
  switch (body.loginType) {
    case LoginType.NATIVE:
      return authenticateNativeSupabaseUser(body.email, body.password);

    case LoginType.SOCIAL:
      return authenticateSocialSupabaseUser(body.providerType, body.providerId);

    default:
      throw {
        statusCode: 400,
        message: '지원하지 않는 로그인 타입입니다.',
        code: ErrorCodes.UNKNOWN_LOGIN_TYPE,
      };
  }
}

/** Supabase 사용자 인증 처리 */
export async function authenticateNativeSupabaseUser(email: string, plainPassword: string): Promise<SupabaseUserDTO> {
  type UserWithPassword = SupabaseUserDTO & { password?: string };

  if (!plainPassword || !email) {
    throw {
      statusCode: 400,
      message: '이메일 또는 비밀번호가 누락되었습니다.',
      code: ErrorCodes.MISSING_CREDENTIAL,
    }
  }

  const { data: userProfile, error: fetchError } = await supabase
    .from('users')
    .select('*') // 비밀번호 필드를 포함하여 모든 필드를 선택
    .eq('login_type', LoginType.NATIVE)
    .eq('email', email)
    .single<UserWithPassword>();

  if (fetchError || !userProfile) {
    // 사용자 존재 여부 노출을 피하기 위해 일반적인 오류 메시지를 사용
    console.warn(`로그인 시도 실패 (이메일: ${email}): 사용자를 찾을 수 없거나 DB 오류 발생.`, fetchError?.message);
    throw {
      statusCode: 401, // Unauthorized
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      code: ErrorCodes.INVALID_CREDENTIALS,
    };
  }

  if (!userProfile.password) {
    console.error(`로그인 실패 (이메일: ${email}): 사용자 레코드는 찾았으나 저장된 비밀번호 해시가 없습니다.`);
    // 이는 서버 측 설정 또는 데이터 무결성 문제
    throw {
      statusCode: 500,
      message: '로그인 처리 중 서버 오류가 발생했습니다. 관리자에게 문의하세요.',
      code: ErrorCodes.USER_DATA_INCOMPLETE,
    };
  }

  // 입력된 비밀번호와 저장된 해시된 비밀번호를 비교
  const passwordsMatch = await bcrypt.compare(plainPassword, userProfile.password);

  if (!passwordsMatch) {
    console.warn(`로그인 시도 실패 (이메일: ${email}): 비밀번호 불일치.`);
    throw {
      statusCode: 401,
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      code: ErrorCodes.INVALID_CREDENTIALS,
    };
  }

  // 반환되는 사용자 객체에서 비밀번호 필드를 제거
  const { password, ...secureUserProfile } = userProfile;
  return camelcaseKeys(secureUserProfile, { deep: true }) as SupabaseUserDTO;
}

export async function authenticateSocialSupabaseUser(providerType: ProviderType, providerId: string): Promise<SupabaseUserDTO> {
  const errMessage = `${providerType}: ${providerId}`;

  if (!providerType || !providerId) {
    throw {
      statusCode: 400,
      message: 'Provider type 또는 provide id가 누락되었습니다.',
      code: ErrorCodes.MISSING_CREDENTIAL,
    }
  }

  const { data, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('login_type', LoginType.SOCIAL)
    .eq('provider_type', providerType)
    .eq('provider_id', providerId)
    .maybeSingle();

// DB 오류
  if (fetchError) {
    console.error(`DB 오류 (${errMessage}):`, fetchError.message);
    throw {
      statusCode: 500,
      message: '로그인 처리 중 서버 오류가 발생했습니다. 관리자에게 문의하세요.',
      code: ErrorCodes.DB_ERROR,
    };
  }

  // 사용자 없음
  if (!data) {
    console.warn(`로그인 시도 실패 (${errMessage}): 사용자를 찾을 수 없습니다.`);
    throw {
      statusCode: 401,
      message: '로그인 정보가 올바르지 않습니다.',
      code: ErrorCodes.USER_NOT_FOUND,
    };
  }

  const userProfile = camelcaseKeys(data, { deep: true }) as SupabaseUserDTO;

  if (!userProfile.providerType || !userProfile.providerId) {
    console.error(`로그인 실패 (${errMessage}): 사용자 레코드는 찾았으나 저장된 소셜 정보가 없습니다.`);
    // 이는 서버 측 설정 또는 데이터 무결성 문제
    throw {
      statusCode: 500,
      message: '로그인 처리 중 서버 오류가 발생했습니다. 관리자에게 문의하세요.',
      code: ErrorCodes.USER_DATA_INCOMPLETE,
    };
  }

  const isTypeMatch = providerType === userProfile.providerType;
  const idMatch = providerId === userProfile.providerId;

  if (!isTypeMatch || !idMatch) {
    console.warn(`로그인 시도 실패 (${errMessage}): 로그인 정보 불일치.`);
    throw {
      statusCode: 401,
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      code: ErrorCodes.INVALID_CREDENTIALS,
    };
  }

  return userProfile;
}

/**
 * 사용자 계정 상태를 확인합니다 (휴면, 탈퇴 등).
 */
export async function checkUserAccountStatus(user: SupabaseUserDTO): Promise<void> {
  switch (user.accountStatus) {
    case AccountStatus.ACTIVE:
      break;
    case AccountStatus.INACTIVE:
      throw {
        statusCode: 403, // Forbidden
        message: '비활성화된 계정입니다. 관리자에게 문의하세요.',
        code: ErrorCodes.ACCOUNT_INACTIVE,
      };
    case AccountStatus.BANNED:
      throw {
        statusCode: 403, // Forbidden
        message: '이용이 제한된 계정입니다. 관리자에게 문의하세요.',
        code: ErrorCodes.ACCOUNT_BANNED,
      };
    case AccountStatus.DORMANT:
      throw {
        statusCode: 403, // Forbidden
        message: '휴면 계정입니다. 계정 활성화가 필요합니다.',
        code: ErrorCodes.ACCOUNT_DORMANT,
      };
    case AccountStatus.WITHDRAWN:
      throw {
        statusCode: 403, // Forbidden
        message: '탈퇴한 계정입니다.',
        code: ErrorCodes.ACCOUNT_WITHDRAWN,
      };
    default:
      // 예기치 않은 상태 값에 대한 처리 (선택 사항)
      console.warn(`알 수 없는 사용자 상태입니다: ${user.accountStatus}`);
      throw {
        statusCode: 500,
        message: '알 수 없는 사용자 계정 상태입니다.',
        code: ErrorCodes.UNKNOWN_ACCOUNT_STATUS,
      };
  }
}

/**
 * 비밀번호 만료일 확인
 */
export async function checkPasswordPolicy(user: SupabaseUserDTO): Promise<void> {
  const passwordPolicyDays = 90;
  if (user.passwordLastChangedAt) {
    const lastChanged = new Date(user.passwordLastChangedAt);
    const expiryDate = new Date(lastChanged.setDate(lastChanged.getDate() + passwordPolicyDays));
    if (new Date() > expiryDate) {
      throw {
        statusCode: 403,
        message: '비밀번호 변경 기간이 만료되었습니다. 비밀번호를 변경해주세요.',
        code: ErrorCodes.PASSWORD_EXPIRED,
      };
    }
  }
}


/**
 * Supabase 사용자의 최종 로그인 시간 및 상태를 업데이트
 */
export async function updateUserLoginDetails(userId: string, timestamp: string): Promise<SupabaseUserDTO> {
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      last_login_at: timestamp,
      account_status: AccountStatus.ACTIVE, // 로그인 성공 시 'active'로 명시적 설정
      updated_at: timestamp,
    })
    .eq('id', userId)
    .select()
    .single<SupabaseUserDTO>();

  if (error || !updatedUser) {
    console.error(`Supabase last_login_at 업데이트 오류 (사용자 ID: ${userId}):`, error?.message);
    throw {
      statusCode: 500,
      message: '로그인 정보 업데이트에 실패했습니다.',
      internalError: error?.message,
      code: ErrorCodes.SUPABASE_LOGIN_UPDATE_FAILED,
    };
  }
  return updatedUser;
}

export async function createRefreshSession(
  user: SupabaseUserDTO,
  refreshToken: string,
  req: NextApiRequest
): Promise<RefreshSession> {
  const deviceInfo = req.headers['user-agent'] || 'unknown';
  const ipAddress = req.socket?.remoteAddress || null;
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후
  const hashedRefreshToken = hashToken(refreshToken);

  const { data, error } = await supabase
    .from('refresh_sessions')
    .insert([
      {
        user_id: user.id,
        refresh_token: hashedRefreshToken,
        device_info: deviceInfo,
        ip_address: ipAddress,
        issued_at: now.toISOString(),
        expires_at: expires.toISOString(),
      },
    ])
    .select()
    .single<RefreshSession>();

  if (error || !data) {
    console.error('refresh 세션 저장 실패:', error?.message);
    throw {
      statusCode: 500,
      message: '세션 저장 중 오류가 발생했습니다.',
      internalError: error?.message,
    };
  }

  return data;
}

export async function checkDuplicate(param: SignUpRequestDTO): Promise<boolean> {

  try {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(param),
    };

    const response = await fetch('/api/auth/check-duplicate', options);
    const data = await response.json();

    if (!response.ok) {
      console.error(`${options.body} 유져 중복 체크 에러 (서버 응답)::`, data);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('SignUp processing error:', err);
    return false;
  }
}