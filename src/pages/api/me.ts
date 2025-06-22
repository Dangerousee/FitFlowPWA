// pages/api/me.ts
import { withAuth } from '@lib';
import type { NextApiResponse } from 'next';
import { NextApiRequestWithUser } from '@types';

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.user?.sub;
  // 사용자 정보 조회 등 처리
  res.status(200).json({ userId });
};

export default withAuth(handler);