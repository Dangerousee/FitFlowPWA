import type { NextApiRequest, NextApiResponse } from 'next';
import { LoginRequestDTO, LoginResponseDTO } from '@types';
import { handleApiErrors } from '@lib/server/errors/handle-api-errors';
import * as AuthService from '@/services/server/auth.service';
import { issueAccessToken, issueRefreshToken } from '@lib/shared/jwt';
import { transformUserToPublic } from '@lib/server/db/transform-user';

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
    const user = await AuthService.authUser(body);

    // 2. 계정 상태 / 보안 정책 확인
    await AuthService.checkUserAccountStatus(user);
    await AuthService.checkPasswordPolicy(user);

    // 3. 로그인 기록 업데이트
    const updatedUser = await AuthService.updateUserLoginDetails(user.id, operationTimestamp);

    // 4. 토큰 발급
    const accessToken = issueAccessToken(updatedUser);
    const refreshToken = issueRefreshToken(updatedUser);

    // 5. refresh 세션 저장
    await AuthService.createRefreshSession(updatedUser, refreshToken, req);

    // 6. HttpOnly 쿠키 설정
    res.setHeader('Set-Cookie', [
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`,
    ]);

    // 7. 응답 반환
    return res.status(200).json({
      user: transformUserToPublic(updatedUser),
      accessToken,
    } satisfies LoginResponseDTO);
  } catch (error) {
    const { status, body } = handleApiErrors(error);
    console.error('로그인 API 오류:', body);
    return res.status(status).json(body);
  }
}