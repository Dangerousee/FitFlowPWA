/**
 * - email 중복: SNS 가입자가 같은 이메일을 쓰는 상황 방지
 * → login_type + email에 대한 복합 unique index 고려
 * - native 사용자만 password 저장
 * → DB에 password 컬럼은 nullable로 두고, SNS 유저는 null 처리
 * - login_type 누락 방지
 * → 회원가입 API나 로그인 라우트에서 login_type 미지정 방지 로직 추가
 */
import { useState } from 'react';
import { SignUpRequestDTO } from '@types';
import { LoginType, ProviderType } from '@enums';
import { parseApiError, } from '@lib';
import apiClient from '@lib/shared/axios';
import { API_ROUTES } from '@routes/apis';

// 회원가입 관련 훅의 반환 타입
export interface UseSignUpResult {
  error: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;

  handleNativeSignUp: (params: {
    email: string;
    password: string;
    username?: string;
    nickname?: string | null;
    profileImageUrl?: string | null;
  }) => Promise<any>;

  handleSocialSignUp: (params: {
    email: any;
    username: any;
    nickname: any;
    profileImageUrl: any;
    providerType: ProviderType;
    providerId: any;
  }) => Promise<any>;
}

export function useSignUp(): UseSignUpResult {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
    email?: string | undefined,
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
      const { data } = await apiClient.post(API_ROUTES.AUTH.SIGN_UP, param);

      console.log('회원가입 성공:', data);
      // 필요하면 여기서 setUser(data.user) 등도 가능
    } catch (err: any) {
      console.error('SignUp processing error:', err.message);

      const parsed = parseApiError(err.response, err.response?.data);
      setError(ERROR_MESSAGES.SIGNUP_NETWORK + (parsed.message || ''));
      throw parsed;
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
  };
}