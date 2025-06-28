import { useState } from 'react';
import { SignUpRequestDTO, UserDTO } from '@types';
import { LoginType, ProviderType } from '@enums';
import { parseApiErrors } from '@lib/cleint/errors/parse-api-errors';
import * as AuthService from '@/services/client/auth.service';

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

      const { data } = await AuthService.registerUser(param as UserDTO);

      console.log('회원가입 성공:', data);
      // 필요하면 여기서 setUser(data.user) 등도 가능
    } catch (err: any) {
      console.error(ERROR_MESSAGES.SIGNUP_NETWORK, err.message);

      const parsed = parseApiErrors(err.response, err.response?.data);
      setError((parsed.message || ''));
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