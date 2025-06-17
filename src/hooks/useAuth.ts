import { useState, useCallback, useEffect } from 'react';
import { useAutoLogout } from './useAutoLogout';
import { useRouter } from 'next/router';
// import { useRouter } from 'next/router';

export interface UseAuthResult {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  username: string;
  setUsername: (username: string) => void;
  error: string | null;
  loading: boolean;
  isLoggedIn: boolean;
  authLoading: boolean;
  handleLogin: () => Promise<void>;
  handleRegister: () => Promise<void>;
  handleLogout: (destinationUrl?: string | null) => void;
}

const AUTH_TOKEN_KEY = 'fitflow_auth_token';

// --- Helper Functions ---
function generateUsername(email: string): string {
  const prefix = email.split('@')[0];
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}_${randomNumber}`;
}

// API 호출 및 에러 처리를 위한 헬퍼
async function apiCall(url: string, options: RequestInit, successMessage: string) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error(`${options.method} 로그인 실패 (서버 응답)::`, data);
    const errorMessage = data.message || `로그인 중 오류 (HTTP ${response.status})`;
    const errorCode = data.code ? ` (Code: ${data.code})` : '';
    throw new Error(`${errorMessage}${errorCode}`);
  }

  console.log(successMessage, data);
  return data;
}

export const LOGOUT_MESSAGES = {
  AUTO: '세션이 만료되어 자동으로 로그아웃되었습니다.',
  MANUAL: '수동으로 로그아웃되었습니다.',
};

export const ERROR_MESSAGES = {
  LOGIN_NETWORK: '로그인 중 네트워크 또는 응답 처리 오류: ',
  REGISTER_NETWORK: '회원가입 중 네트워크 또는 응답 처리 오류: ',
};


export function useAuth(): UseAuthResult {
  // const [email, setEmail] = useState<string>('');
  // const [password, setPassword] = useState<string>('');
  // const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('vocal2th@gmail.com');
  const [password, setPassword] = useState<string>('1234qwer');
  const [username, setUsername] = useState<string>('이종원');
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
      const data = await apiCall(
        '/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
        '로그인 성공:'
      );
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

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      await apiCall(
        '/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            username: username || generateUsername(email),
          }),
        },
        '회원 가입 성공:'
      );
      // Optionally, you might want to auto-login or redirect here
    } catch (err: any) {
      console.error('Register processing error:', err);
      setError(ERROR_MESSAGES.REGISTER_NETWORK + err.message);
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
    username,
    setUsername,
    error,
    loading,
    isLoggedIn,
    authLoading,
    handleLogin,
    handleRegister,
    handleLogout,
  };
}