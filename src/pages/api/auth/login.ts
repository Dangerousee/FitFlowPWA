// src/pages/api/auth/login_bak.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@lib/supabase';
import type { SupabaseUserModel } from '@models/user.model';
import * as ErrorCodes from '@constants/errorCodes';
import bcrypt from 'bcryptjs';
import { LoginRequestBody } from '@models/auth.model';
import { UserAccountStatus } from '@enums/auth';

// ---
// --- Helper Functions ---
// ---
/**
 * Supabase 사용자 정보를 가져오거나 업데이트합니다.
 */
async function authenticateSupabaseUser(
  email: string,
  plainPassword: string
): Promise<SupabaseUserModel> {

  type UserWithPassword = SupabaseUserModel & { password?: string };

  const { data: userProfile, error: fetchError } = await supabase
    .from('users')
    .select('*') // 비밀번호 필드를 포함하여 모든 필드를 선택합니다.
    .eq('email', email)
    .single<UserWithPassword>();

  if (fetchError || !userProfile) {
    // 사용자 존재 여부 노출을 피하기 위해 일반적인 오류 메시지를 사용합니다.
    console.warn(`로그인 시도 실패 (이메일: ${email}): 사용자를 찾을 수 없거나 DB 오류 발생.`, fetchError?.message);
    throw {
      statusCode: 401, // Unauthorized
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      code: ErrorCodes.INVALID_CREDENTIALS,
    };
  }

  if (!userProfile.password) {
    console.error(`로그인 실패 (이메일: ${email}): 사용자 레코드는 찾았으나 저장된 비밀번호 해시가 없습니다.`);
    // 이는 서버 측 설정 또는 데이터 무결성 문제입니다.
    throw {
      statusCode: 500,
      message: '로그인 처리 중 서버 오류가 발생했습니다. 관리자에게 문의하세요.',
      code: ErrorCodes.USER_DATA_INCOMPLETE,
    };
  }

  // 입력된 비밀번호와 저장된 해시된 비밀번호를 비교합니다.
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
  return secureUserProfile as SupabaseUserModel;
}

/**
 * 사용자 계정 상태를 확인합니다 (휴면, 탈퇴 등).
 */
async function checkUserAccountStatus(user: SupabaseUserModel): Promise<void> {
  switch (user.status) {
    case UserAccountStatus.ACTIVE:
      break;
    case UserAccountStatus.INACTIVE:
      throw {
        statusCode: 403, // Forbidden
        message: '비활성화된 계정입니다. 관리자에게 문의하세요.',
        code: ErrorCodes.ACCOUNT_INACTIVE, // 적절한 에러 코드 정의 필요
      };
    case UserAccountStatus.BANNED:
      throw {
        statusCode: 403, // Forbidden
        message: '이용이 제한된 계정입니다. 관리자에게 문의하세요.',
        code: ErrorCodes.ACCOUNT_BANNED, // 적절한 에러 코드 정의 필요
      };
    case UserAccountStatus.DORMANT:
      throw {
        statusCode: 403, // Forbidden
        message: '휴면 계정입니다. 계정 활성화가 필요합니다.',
        code: ErrorCodes.ACCOUNT_DORMANT,
      };
    case UserAccountStatus.WITHDRAWN:
      throw {
        statusCode: 403, // Forbidden
        message: '탈퇴한 계정입니다.',
        code: ErrorCodes.ACCOUNT_WITHDRAWN,
      };
    default:
      // 예기치 않은 상태 값에 대한 처리 (선택 사항)
      console.warn(`알 수 없는 사용자 상태입니다: ${user.status}`);
      throw {
        statusCode: 500,
        message: '알 수 없는 사용자 계정 상태입니다.',
        code: ErrorCodes.UNKNOWN_ACCOUNT_STATUS,
      };
  }
}

/**
 * 비밀번호 정책(예: 만료일)을 확인합니다.
 */
async function checkPasswordPolicy(user: SupabaseUserModel): Promise<void> {
  const passwordPolicyDays = 90; // 예시: 90일
  if (user.password_last_changed_at) {
    const lastChanged = new Date(user.password_last_changed_at);
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
 * Supabase 사용자의 최종 로그인 시간 및 상태를 업데이트합니다.
 */
async function updateUserLoginDetails(
  userId: string,
  timestamp: string
): Promise<SupabaseUserModel> {
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      last_login_at: timestamp,
      status: 'active', // 로그인 성공 시 'active'로 명시적 설정
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
      code: ErrorCodes.SUPABASE_LOGIN_UPDATE_FAILED, // 적절한 에러 코드 사용
    };
  }
  return updatedUser;
}

// ---
// --- Main Handler ---
// ---
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  const { email, password } = req.body as LoginRequestBody;

  if (!password || !email) {
    return res
      .status(400)
      .json({ message: '이메일 또는 비밀번호가 누락되었습니다.', code: ErrorCodes.MISSING_CREDENTIAL });
  }

  const operationTimestamp = new Date().toISOString();

  try {
    // 1. 이메일과 비밀번호로 사용자 인증 (Supabase)
    const userProfile = await authenticateSupabaseUser(email, password);

    const userId = userProfile.id;

    // 2. 계정 상태 확인 (예: 휴면, 탈퇴)
    await checkUserAccountStatus(userProfile);

    // 3. 비밀번호 정책 확인 (예: 만료일)
    await checkPasswordPolicy(userProfile);

    // 4. Supabase에 최종 로그인 시간 및 상태 업데이트
    const updatedUserProfile = await updateUserLoginDetails(userId, operationTimestamp);

    // 성공 응답
    res.status(200).json({
      data: updatedUserProfile, // 클라이언트에는 업데이트된 프로필 또는 초기 프로필 정보를 반환
      message: '로그인에 성공했습니다.',
    });
  } catch (error: any) {
    console.error('로그인 API 오류:', error);
    const statusCode = error.statusCode || 500;
    const responseBody: { message: string; code?: string; error?: string } = {
      message: error.message || '내부 서버 오류가 발생했습니다.',
    };
    if (error.code) {
      responseBody.code = error.code;
    }
    // 개발 환경에서는 디버깅을 위해 internalError를 포함할 수 있습니다.
    if (process.env.NODE_ENV === 'development' && error.internalError) {
      responseBody.error = error.internalError;
    }
    res.status(statusCode).json(responseBody);
  }
}
