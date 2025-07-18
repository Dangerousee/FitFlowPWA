// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useRouter } from 'next/router';
import { useAutoLogout } from '@hooks/useAutoLogout';
import { LoginRequestDTO, UserDTO } from '@types'; // User 타입도 관리하면 좋습니다.
import { LoginType, ProviderType } from '@enums';
import apiClient from '@lib/shared/network/axios';
import { API_ROUTES } from '@routes/apis';
import * as AuthStorageService from '@/services/client/auth-storage.service';
import { parseApiErrors } from '@lib/cleint/errors/parse-api-errors';

// 메시지 상수는 Context 파일 내에서 관리
const LOGOUT_MESSAGES = {
  AUTO: '세션이 만료되어 자동으로 로그아웃되었습니다.',
  MANUAL: '성공적으로 로그아웃되었습니다.',
};

const ERROR_MESSAGES = {
  LOGIN_NETWORK: '로그인 중 오류가 발생했습니다: ',
};

// Context가 제공할 값들의 타입
export interface AuthContextType {
  user: UserDTO | null; // 로그인한 사용자 정보
  isLoggedIn: boolean;
  loading: boolean; // 로그인/로그아웃 진행 상태
  authLoading: boolean; // 최초 인증 상태 확인 중인지 여부
  error: string | null;
  handleNativeLogin: (email: string, password: string) => Promise<void>;
  handleSocialLogin: (providerType: ProviderType, providerId: string) => Promise<void>;
  handleLogout: (destinationUrl?: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider가 모든 인증 로직과 상태를 소유
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  // authLoading의 초기값을 true로 하여, 최초 확인 전까지는 로딩 상태로 간주
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const router = useRouter();

  // 앱 시작 시, 저장된 정보로 "서버에" 로그인 상태 확인
  useEffect(() => {
    const verifyAuthStatus = async () => {
      const token = AuthStorageService.getAccessToken();
      if (token) {
        try {
          // 서버에 토큰 유효성 검사 및 최신 유저 정보 요청
          // 이 API는 토큰을 헤더에 담아 보내고, 유효하면 유저 정보를 반환해야 합니다.
          const { data } = await apiClient.get('/api/auth/me');

          // 서버 응답으로 상태 업데이트
          setUser(data.user);
          setIsLoggedIn(true);
          AuthStorageService.setStoredUser(data.user); // 로컬 유저 정보 최신화
        } catch (err) {
          // 토큰이 유효하지 않은 경우 (401 등)
          console.error("Token verification failed", err);
          AuthStorageService.clearAuthData(); // 만료되거나 잘못된 정보 제거
          setUser(null);
          setIsLoggedIn(false);
        }
      }
      // 토큰이 없거나, 검증이 끝났으면 로딩 상태 해제
      setAuthLoading(false);
    };

    verifyAuthStatus();
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
        AuthStorageService.clearAuthData();
        setUser(null);
        setIsLoggedIn(false);
        setError(logoutMessage);
        console.log(logoutMessage);

        router.push(destinationUrl || '/login');
      }
    },
    [router]
  );

  // 자동 로그아웃 훅
  useAutoLogout({
    isLoggedIn,
    onTimeout: () => performActualLogout(LOGOUT_MESSAGES.AUTO),
  });

  const handleLogin = async (param: LoginRequestDTO) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.post(API_ROUTES.AUTH.LOGIN, param);

      AuthStorageService.setAccessToken(data.accessToken);
      AuthStorageService.setStoredUser(data.user);

      setUser(data.user);
      setIsLoggedIn(true);
      setError(null);
    } catch (err: any) {
      console.error('Login processing error:', err);
      const parsedError = parseApiErrors(err.response, err.response?.data);
      AuthStorageService.clearAuthData();
      setUser(null);
      setIsLoggedIn(false);
      setError(ERROR_MESSAGES.LOGIN_NETWORK + parsedError.message);

      // 호출한 쪽에서 실패 처리를 할 수 있도록 에러를 다시 던져줍니다.
      throw parsedError;
    } finally {
      setLoading(false);
    }
  };

  const handleNativeLogin = (email: string, password: string) => {
    return handleLogin({ email, password, loginType: LoginType.NATIVE });
  };

  const handleSocialLogin = (providerType: ProviderType, providerId: string) => {
    return handleLogin({ providerType, providerId, loginType: LoginType.SOCIAL });
  };

  const handleLogout = (destinationUrl?: string | null) => {
    performActualLogout(LOGOUT_MESSAGES.MANUAL, destinationUrl);
  };

  // 외부에 노출할 값들을 명시적으로 제어 (setLoading 등은 제외)
  const value: AuthContextType = {
    user,
    error,
    loading,
    isLoggedIn,
    authLoading,
    handleNativeLogin,
    handleSocialLogin,
    handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};