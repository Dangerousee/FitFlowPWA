// src/services/client/auth-storage.service.ts

import { PublicUserDTO, UserDTO } from '@types'; // User 타입을 명시적으로 사용

const TOKEN_KEY = 'fitflow_auth_token';
const USER_KEY = 'fitflow_user_info';

// SSR 환경을 고려하여 각 함수 내부에 window 체크 추가
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeAccessToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
};

// 반환 타입을 명확하게 지정
export const getStoredUser = (): PublicUserDTO | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error("Failed to parse stored user", e);
    removeStoredUser(); // 파싱 실패 시 잘못된 데이터 제거
    return null;
  }
};

// 받는 인자의 타입을 명확하게 지정
export const setStoredUser = (user: PublicUserDTO): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
};

export const setItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('설정 실패:', error);
  }
};

/**
 * 클라이언트 저장소에 인증 데이터가 있는지 확인하는 유틸리티 함수.
 * 토큰의 유효성을 보장하지는 않음.
 * 
 * 현재 함수는 사용자 경험(UX)을 향상시키는 옵티마이저(Optimizer) 로서의 가치는 여전히 충분하니 필요에 따라 서버를 거치지 않는 인증상태 검사에 사용
 * •역할: "서버가 확인해 주기 전에, 클라이언트가 낙관적으로 추정하는 로그인 상태"
 * •장점: 즉각적인 UI 반응성, 깜빡임 방지, 불필요한 대기 시간 감소
 *
 * 코드 예시)
 *   // 1. AuthStorageService를 사용해 초기 로그인 상태를 "추정"합니다.
 *   //    이렇게 하면 서버 응답을 기다리기 전에 UI가 올바르게 보입니다.
 *   const [isClientLoggedIn, setIsClientLoggedIn] = useState(
 *     AuthStorageService.hasAuthDataInStorage()
 *   );
 *
 *   // 2. authLoading이 끝나면, useAuth의 "진짜" 로그인 상태로 동기화합니다.
 *   useEffect(() => {
 *     if (!authLoading) {
 *       setIsClientLoggedIn(isLoggedIn);
 *     }
 *   }, [isLoggedIn, authLoading]);
 *
 *   // 3. authLoading 중에는 추정된 상태를 기반으로 UI를 보여줍니다.
 *   if (authLoading) {
 *     // 로딩 중에도 추정된 상태에 따라 UI를 다르게 보여줄 수 있습니다.
 *     return (
 *       <header>
 *         <nav>
 *           {isClientLoggedIn ? (
 *             <>
 *               <span>스켈레톤 UI</span>
 *               </>
 *           ) : (
 *             <Link href="/login">로그인</Link>
 *           )}
 *         </nav>
 *       </header>
 *     );
 *   }
 *
 *   // 로딩이 끝난 후에는 확정된 상태로 UI를 렌더링합니다.
 *   return (
 *     <header>
 *       <nav>
 *         {isClientLoggedIn ? (
 *           <>
 *             <Link href="/profile">내 프로필</Link>
 *             <button onClick={() => handleLogout()}>로그아웃</button>
 *           </>
 *         ) : (
 *           <Link href="/login">로그인</Link>
 *         )}
 *       </nav>
 *     </header>
 *   );
 */
export const hasAuthDataInStorage = (): boolean => {
  const token = getAccessToken();
  const user = getStoredUser();
  return Boolean(token && user);
};

export const clearAuthData = (): void => {
  removeAccessToken();
  removeStoredUser();
};