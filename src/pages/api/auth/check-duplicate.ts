import type { NextApiRequest, NextApiResponse } from 'next';
import { SignUpRequestDTO } from '@types';
import { DB_TABLES, ERROR_CODES } from '@/constants';
import { SupaQuery } from '@lib/server/db';

/**
 * 이메일 또는 사용자명 중복 여부를 개별적으로 확인하는 API
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  const body = req.body satisfies SignUpRequestDTO;
  const { email, username, providerType, providerId } = body;

  if (!body) {
    return res.status(400).json({
      message: '데이터를 제공해야 합니다.',
      code: ERROR_CODES.VALIDATION.MISSING_FIELD,
    });
  }

  try {
    // 결과 상태 변수 초기화
    let isEmailDuplicate = false;
    let isUsernameDuplicate = false;

    const query = new SupaQuery(DB_TABLES.USERS);

    // 이메일 중복 확인
    if (email) {
      const { count, error } = await query.eq('email', email).count();

      if (error) throw error;
      isEmailDuplicate = !!count && count > 0;
    }

    // 사용자명 중복 확인
    if (username) {
      const { count, error } = await query.eq('username', username).count();

      if (error) throw error;
      isUsernameDuplicate = !!count && count > 0;
    }

    // SNS 사용자 중복 확인
    if (username) {
      const { count, error } = await query.eqs({'provider_type': providerType, 'provider_id': providerId}).count();

      if (error) throw error;
      isUsernameDuplicate = !!count && count > 0;
    }

    const isDuplicate = isEmailDuplicate || isUsernameDuplicate;

    res.status(200).json({
      isDuplicate,
      duplicateFields: {
        email: isEmailDuplicate,
        username: isUsernameDuplicate,
      },
      message: isDuplicate
        ? '이미 등록된 항목이 있습니다.'
        : '사용 가능한 정보입니다.',
    });
  } catch (error: any) {
    console.error('중복 확인 실패:', error);
    res.status(500).json({
      message: '중복 확인 중 서버 오류가 발생했습니다.',
      code: ERROR_CODES.DB.SUPABASE_DB_ERROR,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}