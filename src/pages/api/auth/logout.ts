// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, hashToken } from '@/lib/shared';
import { applyCors } from '@lib/server';
import * as cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) return; // OPTIONS면 여기서 끝

  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  const rawToken = cookie.parse(req.headers.cookie || '').refreshToken;

  if (typeof rawToken !== 'string') {
    return res.status(400).json({ message: 'refreshToken이 없습니다.' });
  }

  const hashedToken = hashToken(rawToken);

  // ✅ DB에서 세션 무효화
  const { error } = await supabase
    .from('refresh_sessions')
    .update({ revoked: true })
    .eq('refresh_token', hashedToken);

  if (error) {
    console.error('[logout] 세션 업데이트 실패:', error);
    return res.status(500).json({ message: '로그아웃 처리 중 오류가 발생했습니다.' });
  }

  // ✅ 쿠키 삭제
  res.setHeader('Set-Cookie', [
    'refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
  ]);

  return res.status(200).json({ message: '성공적으로 로그아웃되었습니다.' });
}