// src/pages/api/auth/sign-up.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import snakecaseKeys from 'snakecase-keys';
import * as ErrorCodes from '@constants/errorCodes';
import { LoginType } from '@enums';
import { SignUpRequestDTO, SupabaseUserDTO } from '@types';
import { supabase } from '@lib/shared';
import { handleApiError } from '@lib/server';

function validate(payload: SignUpRequestDTO) {
  const { loginType, email, username } = payload;

  if (!username) throw { statusCode: 400, message: 'username은 필수입니다.' };
  if (!email) throw { statusCode: 400, message: 'email은 필수입니다.' };

  if (loginType === LoginType.NATIVE && !payload.password) {
    throw { statusCode: 400, message: 'password는 필수입니다.' };
  }

  if (loginType === LoginType.SOCIAL) {
    if (!payload.providerType || !payload.providerId) {
      throw { statusCode: 400, message: 'provider 정보가 누락되었습니다.' };
    }
  }
}

async function insertUser(param: SignUpRequestDTO): Promise<SupabaseUserDTO> {
  const payload: Record<string, any> = { ...param };

  if (param.loginType === LoginType.NATIVE) {
    payload.password = await bcrypt.hash(param.password, 10);
  }

  const { data, error } = await supabase
    .from('users')
    .insert([snakecaseKeys(payload)])
    .select()
    .single<SupabaseUserDTO>();

  if (error) {
    if (error.code === '23505') {
      throw {
        statusCode: 409,
        message: '이미 사용 중인 이메일 또는 아이디입니다.',
        code: ErrorCodes.USER_ALREADY_EXISTS,
        internalError: error.message,
      };
    }

    throw {
      statusCode: 500,
      message: '사용자 프로필 생성 중 오류가 발생했습니다.',
      internalError: error.message,
    };
  }

  if (!data) {
    throw {
      statusCode: 500,
      message: '프로필 생성 후 데이터를 받아오지 못했습니다.',
    };
  }

  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  try {
    const body = req.body satisfies SignUpRequestDTO;
    validate(body);
    const user = await insertUser(body);

    return res.status(200).json({
      data: user,
      message: '회원가입이 완료되었습니다.',
    });

  } catch (error) {
    const { status, body } = handleApiError(error);
    console.error('회원가입 오류:', body);
    return res.status(status).json(body);
  }
}