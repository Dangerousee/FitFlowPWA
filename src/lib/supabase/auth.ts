import { supabase } from '@lib/supabase';
import type { SupabaseUserModel } from '@models/user.model';
import { AccountStatus } from '@enums/auth';
import * as ErrorCodes from '@constants/errorCodes';
import bcrypt from 'bcryptjs';
import camelcaseKeys from 'camelcase-keys';


/** Supabase 사용자 인증 처리 */
export async function authenticateSupabaseUser(
  email: string,
  plainPassword: string
): Promise<SupabaseUserModel> {

  type UserWithPassword = SupabaseUserModel & { password?: string };

  const { data: userProfile, error: fetchError } = await supabase
    .from('users')
    .select('*') // 비밀번호 필드를 포함하여 모든 필드를 선택
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...secureUserProfile } = userProfile;
  return camelcaseKeys(secureUserProfile, { deep: true }) as SupabaseUserModel;
}

/**
 * 사용자 계정 상태를 확인합니다 (휴면, 탈퇴 등).
 */
export async function checkUserAccountStatus(user: SupabaseUserModel): Promise<void> {
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
export async function checkPasswordPolicy(user: SupabaseUserModel): Promise<void> {
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
export async function updateUserLoginDetails(
  userId: string,
  timestamp: string
): Promise<SupabaseUserModel> {
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      last_ogin_at: timestamp,
      account_status: AccountStatus.ACTIVE, // 로그인 성공 시 'active'로 명시적 설정
      updated_at: timestamp,
    })
    .eq('id', userId)
    .select()
    .single<SupabaseUserModel>();

  if (error || !updatedUser) {
    console.error(
      `Supabase last_login_at 업데이트 오류 (사용자 ID: ${userId}):`,
      error?.message
    );
    throw {
      statusCode: 500,
      message: '로그인 정보 업데이트에 실패했습니다.',
      internalError: error?.message,
      code: ErrorCodes.SUPABASE_LOGIN_UPDATE_FAILED,
    };
  }
  return updatedUser;
}