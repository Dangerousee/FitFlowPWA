// src/pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  authenticateSupabaseUser,
  checkPasswordPolicy,
  checkUserAccountStatus,
  createRefreshSession,
  updateUserLoginDetails,
  handleApiError,
} from '@lib/server';
import { issueAccessToken, issueRefreshToken } from '@lib/shared';
import { LoginRequestDTO, LoginResponseDTO } from '@types';

function isBaseLoginRequest(value: any): boolean {
  return value && typeof value === 'object' && 'loginType' in value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  if (!isBaseLoginRequest(req.body)) {
    return res.status(400).json({ message: '요청 바디가 유효하지 않습니다.' });
  }

  const body = req.body as LoginRequestDTO;
  const operationTimestamp = new Date().toISOString();

  try {
    // 1. 사용자 인증
    const user = await authenticateSupabaseUser(body);

    // 2. 계정 상태 / 보안 정책 확인
    await checkUserAccountStatus(user);
    await checkPasswordPolicy(user);

    // 3. 로그인 기록 업데이트
    const updatedUser = await updateUserLoginDetails(user.id, operationTimestamp);

    // 4. 토큰 발급
    const accessToken = issueAccessToken(updatedUser);
    const refreshToken = issueRefreshToken(updatedUser);

    // 5. refresh 세션 저장
    await createRefreshSession(updatedUser, refreshToken, req);

    // 6. HttpOnly 쿠키 설정
    res.setHeader('Set-Cookie', [
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`,
    ]);

    // 7. 응답 반환
    return res.status(200).json({
      user: updatedUser,
      accessToken,
    } satisfies LoginResponseDTO);
  } catch (error) {
    const { status, body } = handleApiError(error);
    console.error('로그인 API 오류:', body);
    return res.status(status).json(body);
  }
}