import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@lib/supabase';
import * as ErrorCodes from '@constants/errorCodes';
import { SignUpRequestDTO } from '@types';

/**
 * 이메일 또는 사용자명 중복 여부를 개별적으로 확인하는 API
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  // const { email, username } = req.body as { email?: string; username?: string };
  const body = req.body satisfies SignUpRequestDTO;
  const { email, username, providerType, providerId } = body;

  if (!body) {
    return res.status(400).json({
      message: '데이터를 제공해야 합니다.',
      code: ErrorCodes.MISSING_FIELD,
    });
  }

  try {
    // 결과 상태 변수 초기화
    let isEmailDuplicate = false;
    let isUsernameDuplicate = false;

    // 이메일 중복 확인
    if (email) {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('email', email);

      if (error) throw error;
      isEmailDuplicate = !!count && count > 0;
    }

    // 사용자명 중복 확인
    if (username) {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('username', username);

      if (error) throw error;
      isUsernameDuplicate = !!count && count > 0;
    }

    // SNS 사용자 중복 확인
    if (username) {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('provider_type', providerType)
        .eq('provider_id', providerId);

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
      code: ErrorCodes.SUPABASE_DB_ERROR,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}