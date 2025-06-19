import { useState, useCallback, useEffect } from 'react';
import { useAutoLogout } from './useAutoLogout';
import { useRouter } from 'next/router';
import {UseLoginResult} from "@models/auth.model";
// import { useRouter } from 'next/router';

const AUTH_TOKEN_KEY = 'fitflow_auth_token';

const LOGOUT_MESSAGES = {
  AUTO: '세션이 만료되어 자동으로 로그아웃되었습니다.',
  MANUAL: '수동으로 로그아웃되었습니다.',
};

const ERROR_MESSAGES = {
  LOGIN_NETWORK: '로그인 중 네트워크 또는 응답 처리 오류: ',
};

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
  // const [email, setEmail] = useState<string>('');
  // const [password, setPassword] = useState<string>('');
  // const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('vocal2th@gmail.com');
  const [password, setPassword] = useState<string>('1234qwer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      setIsLoggedIn(true);
      // 필요하다면 여기서 토큰 유효성 검사 API 호출
    }
    setAuthLoading(false); // 상태 확인 완료
  }, []);

  const performActualLogout = useCallback(
    (logoutMessage: string, destinationUrl?: string | null) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      setError(logoutMessage); // 에러 상태에 로그아웃 메시지 설정
      setIsLoggedIn(false);
      console.log(logoutMessage); // 로그아웃 사유 로깅
      if (destinationUrl) router.push(destinationUrl);
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
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      };

      const response = await fetch('/api/auth/login', options);
      const data = await response.json();

      if (!response.ok) {
        console.error(`${options.method} 로그인 실패 (서버 응답)::`, data);
        const errorMessage = data.message || `로그인 중 오류 (HTTP ${response.status})`;
        const errorCode = data.code ? ` (Code: ${data.code})` : '';
        throw new Error(`${errorMessage}${errorCode}`);
      }

      // TODO 성공 처리
      console.log('로그인 성공:', data);

      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token || 'dummy_token');
      }
      setIsLoggedIn(true); // 로그인 성공 시 상태 업데이트
      setError(null); // 이전 에러 메시지 클리어
    } catch (err: any) {
      console.error('Login processing error:', err);
      clearAuthErrorAndState(); // 토큰 제거 및 에러 상태 초기화
      setIsLoggedIn(false); // 명시적으로 로그아웃 상태로 변경
      setError(ERROR_MESSAGES.LOGIN_NETWORK + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (destinationUrl?: string | null) => {
    performActualLogout(LOGOUT_MESSAGES.MANUAL, destinationUrl);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    isLoggedIn,
    authLoading,
    handleLogin,
    handleLogout,
  };
}