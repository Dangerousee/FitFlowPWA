// pages/api/me.ts
import type { NextApiResponse } from 'next';
import { withAuth } from '@lib/server/middleware/with-auth';
import { NextApiRequestWithUser } from '@/types';
import { findById } from '@/services/server/user.service';
import { transformUserToPublic } from '@lib/server/db/transform-user';

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const { user } = req;

  if (!user?.userId) {
    return res.status(400).json({ message: 'userId가 누락되었습니다.' });
  }

  try {
    const dbUser = await findById(user.userId);

    if (!dbUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }


    const publicUser = transformUserToPublic(dbUser);
    return res.status(200).json(publicUser);
  } catch (err) {
    console.error('getUserById 실패:', err);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export default withAuth(handler);