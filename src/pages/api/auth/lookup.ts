import { NextApiRequest, NextApiResponse } from 'next';
import { getUserByProviderInfo, getUserByEmail } from '@lib/server';
import { transformUserToPublic } from '@lib/server/db';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  const { email, providerType, providerId } = req.query;

  try {
    let user = null;

    // ✅ SNS 사용자 탐색
    if (providerType && providerId) {
      user = await getUserByProviderInfo({
        providerType: String(providerType),
        providerId: String(providerId),
      });
    }

    // ✅ 자체 회원 탐색
    else if (email) {
      user = await getUserByEmail(String(email));
    }

    // ❌ 조건 미충족
    else {
      return res.status(400).json({ message: 'email 또는 provider 정보를 입력해 주세요.' });
    }

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const publicUser = transformUserToPublic(user);
    return res.status(200).json(publicUser);
  } catch (err) {
    console.error('[lookup.ts] 사용자 조회 실패:', err);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export default handler;