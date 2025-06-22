/**
 * - email 중복: SNS 가입자가 같은 이메일을 쓰는 상황 방지
 * → login_type + email에 대한 복합 unique index 고려
 * - native 사용자만 password 저장
 * → DB에 password 컬럼은 nullable로 두고, SNS 유저는 null 처리
 * - login_type 누락 방지
 * → 회원가입 API나 로그인 라우트에서 login_type 미지정 방지 로직 추가
 */
import { useState } from 'react';
import { UseSignUpResult } from '@types';
import { LoginType, ProviderType } from '@enums';
import { SignUpRequestDTO } from '@types';
import {
  authenticateSocialSupabaseUser,
  ClientError,
  fetchUserData,
  handleApiError,
  normalizeSnsUser,
  parseApiError,
} from '@lib';
import { USER_ALREADY_EXISTS, USER_NOT_FOUND } from '@constants/errorCodes';

export function useSignUp(): UseSignUpResult {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  //
  // 아직 우리 커뮤니티의 멤버가 아니시네요!
  // 회원가입을 진행하시겠어요?

  const ERROR_MESSAGES = {
    SIGNUP_NETWORK: '회원가입 중 네트워크 또는 응답 처리 오류: ',
  };

  // --- Helper Functions ---
  function generateUsername(email: string): string {
    const prefix = email?.split('@')[0] || 'user';
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}_${randomNumber}`;
  }

  const handleNativeSignUp = async (params: {
    email: string;
    password: string;
    username?: string;
    nickname?: string | null;
    profileImageUrl?: string | null;
  }) => {
    const { email, username } = params;

    return await handleSignUp({
      loginType: LoginType.NATIVE,
      email: params.email,
      password: params.password,
      username: username || generateUsername(email),
      nickname: params.nickname,
      profileImageUrl: params.profileImageUrl,
    });
  };

  const handleSocialSignUp = async (params: {
    email: string,
    providerType: ProviderType;
    providerId: string;
    username?: string;
    nickname?: string | null;
    profileImageUrl?: string | null;
  }) => {
    const { username, providerType } = params;

    return await handleSignUp({
      email: params.email,
      loginType: LoginType.SOCIAL,
      providerType,
      providerId: params.providerId,
      username: username || generateUsername(providerType),
      nickname: params.nickname,
      profileImageUrl: params.profileImageUrl
    });
  };

  const handleSignUp = async (param: SignUpRequestDTO) => {
    setError(null);
    setLoading(true);
    try {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(param),
      };

      const response = await fetch('/api/auth/sign-up', options);
      const data = await response.json();

      if (!response.ok) {
        console.error(`${options.method} 회원가입 실패 (서버 응답)::`, data);
        throw parseApiError(response, data);
      }

      console.log('회원가입 성공:', data);
    } catch (err: any) {
      console.error('SignUp processing error:', err);
      setError(ERROR_MESSAGES.SIGNUP_NETWORK + (err.message || ''));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUpWithNativeLogin = async (param: {providerType: ProviderType, code: string, state?: string}): Promise<any> => {
    const { providerType, code, state } = param;
    let snsUserRaw: any | null = null;

    setError(null);
    setLoading(true);
    try {
      snsUserRaw = await fetchUserData(providerType, code, state);

      if (!snsUserRaw) {
        throw new ClientError({
          statusCode: 400,
          message: 'SNS 사용자 정보를 가져오지 못했습니다. 다시 시도해주세요.',
        });
      }

      const snsUser = normalizeSnsUser(providerType, snsUserRaw);

      const resposne = await authenticateSocialSupabaseUser(providerType, snsUser.providerId);

      if (resposne) {
        throw new ClientError({
          statusCode: 200,
          message: '해당 이메일로 가입된 계정이 존재합니다.',
          code: USER_ALREADY_EXISTS,
        });
      }

      return resposne;
    } catch (err: any) {

      // SNS 사용자 정보 요청 단계에서 예외 발생 - 비정상
      if (!snsUserRaw) {
        setError('SNS 사용자 정보를 가져오지 못했습니다. 다시 시도해주세요.');
        throw new ClientError({
          statusCode: 400,
          message: 'SNS 사용자 정보를 가져오지 못했습니다. 다시 시도해주세요.',
          code: err.code,
        });
      }

      // 가입된 유져가 없는 경우- 정상
      if (err.code === USER_NOT_FOUND || err.statusCode === 401) {
        throw new ClientError({
          ...err,
          data: snsUserRaw
        });
      }

      // 이미 해당 이메일로 가입된 계정 존재- 정상
      if (err.code === USER_ALREADY_EXISTS) {
        throw new ClientError({
          ...err,
          data: snsUserRaw
        });
      }

      // 그외 비정상 케이스
      setError('알 수 없는 오류가 발생했습니다. 관리자에게 문의해 주세요.');
      throw new ClientError({
        statusCode: err.statusCode,
        message: '알 수 없는 오류가 발생했습니다. 관리자에게 문의해 주세요.',
        code: err.code,
        data: snsUserRaw
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    loading,
    setLoading,
    handleNativeSignUp,
    handleSocialSignUp,
    handleSocialSignUpWithNativeLogin,
  };
}