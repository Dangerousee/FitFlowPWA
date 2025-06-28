import { NextApiRequest, NextApiResponse } from 'next';
import { findByEmail, findByProviderInfo } from '@/services/server/user.service';
import { transformUserToPublic } from '@lib/server/db/utils/transform-user';
import { HttpStatusCode } from 'axios';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  const { email, providerType, providerId } = req.query;

  try {
    let user = null;

    // ✅ SNS 사용자 탐색
    if (providerType && providerId) {
      user = await findByProviderInfo({
        providerType: String(providerType),
        providerId: String(providerId),
      });
    }

    // ✅ 자체 회원 탐색
    else if (email) {
      user = await findByEmail(String(email));
    }

    // ❌ 조건 미충족
    else {
      return res.status(HttpStatusCode.BadRequest).json({ message: 'email 또는 provider 정보를 입력해 주세요.' });
    }

    if (!user) {
      console.error('사용자를 찾을 수 없습니다.');
    }

    return res.status(HttpStatusCode.Ok).json(user ? transformUserToPublic(user) : null);
  } catch (err) {
    console.error('[lookup.ts] 사용자 조회 실패:', err);
    return res.status(HttpStatusCode.InternalServerError).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export default handler;