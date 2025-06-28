import { useState, useCallback, useEffect } from 'react';
import { useAutoLogout } from './useAutoLogout';
import { useRouter } from 'next/router';
import { LoginRequestDTO } from "@types";
import { LoginType, ProviderType } from '@enums';
import apiClient from '@lib/shared/network/axios';
import { API_ROUTES } from '@routes/apis';
import * as AuthStorageService from '@/services/client/auth-storage.service';
import { parseApiErrors } from '@lib/cleint/errors/parse-api-errors';
// import { useRouter } from 'next/router';

export const LOGOUT_MESSAGES = {
  AUTO: '세션이 만료되어 자동으로 로그아웃되었습니다.',
  MANUAL: '수동으로 로그아웃되었습니다.',
};

const ERROR_MESSAGES = {
  LOGIN_NETWORK: '로그인 중 네트워크 또는 응답 처리 오류: ',
};

// 로그인 관련 훅의 반환 타입
export interface UseLoginResult {
  error: string | null;
  loading: boolean;
  authLoading: boolean;
  isLoggedIn: boolean;
  setLoading: (loading: boolean) => void;
  handleNativeLogin: (email: string, password: string) => void;
  handleSocialLogin: (providerType: ProviderType, providerId: string) => void;
  handleLogout: (destinationUrl?: string | null) => void;
}

/**
 * - provider_id 기준 로그인 처리: SNS는 이메일보다 provider_id가 더 신뢰 가능
 * → 로그인 처리 시 반드시 provider_type + provider_id 조합으로 식별
 *
 * - login_type === 'native'인 경우만 password 체크
 * - SNS 가입자의 경우, password는 존재하지 않거나 무시되어야 함
 * - 로그인 시 반드시 login_type 조건을 함께 검증해야 함:
 * const user = await getUserByEmail(email);
 *
 * if (!user || user.login_type !== 'native') {
 *   // 소셜 로그인 사용자는 이메일/비번 로그인 불가
 *   throw new Error('비밀번호 로그인 대상이 아닙니다.');
 * }
 *
 * // 비밀번호 비교 후 진행
 */
export function useLogin(): UseLoginResult {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    if (AuthStorageService.isLoggedIn()) {
      setIsLoggedIn(true);
      // 필요하다면 여기서 토큰 유효성 검사 API 호출
    }
    setAuthLoading(false); // 상태 확인 완료
  }, []);

  const performActualLogout = useCallback(
    async (logoutMessage: string, destinationUrl?: string | null) => {
      try {
        // 1. 서버 로그아웃 요청 (refreshToken 무효화 + 쿠키 삭제)
        await apiClient.post(API_ROUTES.AUTH.LOGOUT, {}, { withCredentials: true });
      } catch (err) {
        console.error('서버 로그아웃 실패:', err);
        // 실패해도 클라이언트 상태는 정리해야 하므로 계속 진행
      } finally {
        // 2. 클라이언트 상태 초기화
        if (typeof window !== 'undefined') {
          AuthStorageService.removeAccessToken();
        }
        AuthStorageService.removeStoredUser();
        setIsLoggedIn(false);
        setError(logoutMessage);
        console.log(logoutMessage);

        if (destinationUrl) {
          router.push(destinationUrl);
        }
      }
    },
    [/* router */]
  );

  useAutoLogout({
    isLoggedIn,
    onTimeout: () => performActualLogout(LOGOUT_MESSAGES.AUTO),
  });

  const clearAuthErrorAndState = () => {
    setError(null);
    // setIsLoggedIn(false); // 로그인 실패 시에는 authLoading 후 isLoggedIn이 false로 유지됨
    if (typeof window !== 'undefined') {
      AuthStorageService.removeAccessToken();
      AuthStorageService.removeStoredUser();
    }
  };

  const handleNativeLogin = async (email: string, password: string) => {
    return handleLogin({ email, password, loginType: LoginType.NATIVE });
  };
  const handleSocialLogin = async (providerType: ProviderType, providerId: string) => {
    return handleLogin({ providerType, providerId, loginType: LoginType.SOCIAL });
  };

  const handleLogin = async (param: LoginRequestDTO) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.post(API_ROUTES.AUTH.LOGIN, param);

      console.log('로그인 성공:', data);

      if (typeof window !== 'undefined') {
        AuthStorageService.setAccessToken(data.accessToken);
        AuthStorageService.setStoredUser(data.user);
      }

      setIsLoggedIn(true);
      setError(null);
      return data; // 혹은 data.user 등 필요한 값 반환

    } catch (err: any) {
      console.error('Login processing error:', err);
      const parsedError = parseApiErrors(err.response, err.response?.data);

      clearAuthErrorAndState();
      setIsLoggedIn(false);
      setError(ERROR_MESSAGES.LOGIN_NETWORK + parsedError.message); // 상세 메시지 유지
    } finally {
      setLoading(false);
    }

  };

  const handleLogout = (destinationUrl?: string | null) => {
    performActualLogout(LOGOUT_MESSAGES.MANUAL, destinationUrl);
  };

  return {
    error,
    loading,
    setLoading,
    isLoggedIn,
    authLoading,
    handleNativeLogin,
    handleSocialLogin,
    handleLogout,
  };
}