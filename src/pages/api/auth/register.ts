// src/pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@lib/supabase';
import * as ErrorCodes from '@constants/errorCodes';
import bcrypt from 'bcryptjs';
import { SupabaseUserModel } from '@models/user.model';
import { RegisterRequestBody } from '@models/auth.model';

// ---
// --- Helper Functions ---
// ---
/**
 * Supabase 사용자 프로필 생성
 */
async function createSupabaseUserProfile(
  email: string,
  password: string,
  username: string,
): Promise<SupabaseUserModel> {

  const hashedPassword = await bcrypt.hash(password, 10);
  const { data: userProfile, error } = await supabase
    .from('users')
    .insert(
      [{
        email: email,
        password: hashedPassword,
        username: username
      }]
    )
    .select()
    .single<SupabaseUserModel>();

  if (error) {
    console.error('Supabase 사용자 프로필 insert 오류:', error);
    // id (firebaseUid) 또는 email, username 등의 UNIQUE 제약 조건 위반 시 이 코드가 반환됩니다.
    // Supabase/PostgreSQL의 unique_violation 에러 코드 '23505'
    if (error.code === '23505') {
      throw {
        statusCode: 409, // Conflict
        message: '이미 사용 중인 아이디 또는 이메일입니다.',
        internalError: error.message,
        code: ErrorCodes.USER_ALREADY_EXISTS,
      };
    }
    throw {
      statusCode: 500,
      message: '데이터베이스와 사용자 프로필 생성에 실패했습니다.',
      internalError: error.message,
    };
  }
  if (!userProfile) {
    console.error(
      'Supabase 사용자 프로필 생성 후 데이터를 반환하지 않았습니다.'
    );
    throw {
      statusCode: 500,
      message: '프로필 동기화 후 사용자 데이터를 가져오는데 실패했습니다.',
    };
  }
  return userProfile;
}

// ---
// --- Main Handler ---
// ---
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  const { email, password, username } = req.body as RegisterRequestBody;

  if (!email || !password || !username) {
    return res
      .status(400)
      .json({ message: '필수값이 누락되었습니다.' });
  }

  try {
    // Supabase 사용자 프로필 생성
    const userProfile = await createSupabaseUserProfile(
      email,
      password,
      username
    );

    // 성공 응답
    res.status(200).json({
      data: userProfile,
      message: '사용자 등록이 성공적으로 완료되었습니다!',
    });
  } catch (error: any) {
    console.error('회원가입 API 오류:', error);
    const statusCode = error.statusCode || 500;
    const responseBody: { message: string; code?: string; error?: string } = {
      message: error.message || '내부 서버 오류가 발생했습니다.',
    };
    if (error.code) {
      responseBody.code = error.code;
    }
    if (process.env.NODE_ENV === 'development' && error.internalError) {
      responseBody.error = error.internalError;
    }
    res.status(statusCode).json(responseBody);
  }
}