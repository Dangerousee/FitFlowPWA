// lib/middleware/withAuth.ts
import { verifyAccessToken } from '@lib';
import type { NextApiHandler, NextApiResponse } from 'next';
import { NextApiRequestWithUser } from '@types';

export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    // 사용자 정보 req에 주입 (선택)
    req.user = payload;

    return handler(req, res);
  };
}