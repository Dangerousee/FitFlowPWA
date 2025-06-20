// src/pages/api/auth/login_bak.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import * as ErrorCodes from '@constants/errorCodes';
import { NativeLoginRequestBody } from '@models/auth.model';

import { authenticateSupabaseUser, checkPasswordPolicy, checkUserAccountStatus, updateUserLoginDetails } from '@lib/supabase/auth';
import { LoginType } from '@enums/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  const { email, password } = req.body as NativeLoginRequestBody;

  if (!password || !email) {
    return res
      .status(400)
      .json({ message: '이메일 또는 비밀번호가 누락되었습니다.', code: ErrorCodes.MISSING_CREDENTIAL });
  }

  const operationTimestamp = new Date().toISOString();

  try {
    // 1. 이메일과 비밀번호로 사용자 인증 (Supabase)
    const userProfile = await authenticateSupabaseUser({
      loginType: LoginType.NATIVE,
      email,
      password,
    });

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
