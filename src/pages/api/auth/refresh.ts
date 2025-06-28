import { getCookie } from 'cookies-next';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';
import { DB_TABLES } from '@/constants';
import { hashToken, issueAccessTokenFromPayload } from '@lib/shared/jwt';
import { FetchMode, SupaQuery } from '@lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rawToken = getCookie('refreshToken', { req, res });

  if (!rawToken || typeof rawToken !== 'string') {
    return res.status(401).json({ message: 'refreshToken이 없습니다.' });
  }

  // ✅ 1. 해시해서 DB 조회
  const hashedToken = hashToken(rawToken);
  const { data: session } = await new SupaQuery(DB_TABLES.USERS)
    .eq('refresh_token', hashedToken)
    .eq('revoked', false)
    .gte('expires_at', new Date().toISOString())
    .fetch(FetchMode.SINGLE);


  if (!session) {
    return res.status(401).json({ message: '세션이 만료되었거나 존재하지 않습니다.' });
  }

  // ✅ 2. JWT 시그니처 검증 (내용 변조 방지)
  try {
    const payload = jwt.verify(rawToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;

    // ✅ 3. 새 accessToken 발급
    const newAccessToken = issueAccessTokenFromPayload(payload);

    return res.status(200).json({ accessToken: newAccessToken });
  } catch {
    return res.status(401).json({ message: 'refreshToken이 유효하지 않아요.' });
  }
}