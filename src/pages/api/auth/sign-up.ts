import type { NextApiRequest, NextApiResponse } from 'next';
import { LoginType } from '@enums';
import { SignUpRequestDTO, UserDTO } from '@types';
import { HttpStatusCode } from 'axios';
import { insertUser } from '@/services/server/user.service';
import { handleApiErrors } from '@lib/server/errors/handle-api-errors';

function validate(payload: SignUpRequestDTO) {
  const { loginType, email, username } = payload;

  if (!username) throw { statusCode: HttpStatusCode.BadRequest, message: 'username은 필수입니다.' };
  if (loginType === LoginType.NATIVE && !email) {
    throw { statusCode: HttpStatusCode.BadRequest, message: 'email은 필수입니다.' };
  }

  if (loginType === LoginType.NATIVE && !payload.password) {
    throw { statusCode: HttpStatusCode.BadRequest, message: 'password는 필수입니다.' };
  }

  if (loginType === LoginType.SOCIAL) {
    if (!payload.providerType || !payload.providerId) {
      throw { statusCode: HttpStatusCode.BadRequest, message: 'provider 정보가 누락되었습니다.' };
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(HttpStatusCode.MethodNotAllowed).json({ message: '허용되지 않는 메소드입니다.' });
  }

  try {
    const body = req.body satisfies SignUpRequestDTO;
    validate(body);
    const user = await insertUser(body);

    return res.status(HttpStatusCode.Ok).json({
      data: user,
      message: '회원가입이 완료되었습니다.',
    });

  } catch (error) {
    const { status, body } = handleApiErrors(error);
    console.error('회원가입 오류:', body);
    return res.status(status).json(body);
  }
}