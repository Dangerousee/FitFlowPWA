import { renderHook, act, waitFor } from '@testing-library/react';
import { LOGOUT_MESSAGES, useLogin } from '@hooks/useLogin';

// next/router 모킹
const mockRouterPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    // useAuth 훅에서 사용하는 다른 router 속성/메서드가 있다면 추가
  }),
}));

// localStorage 모킹
let store: { [key: string]: string } = {};
const mockLocalStorage = {
  getItem: (key: string): string | null => store[key] || null,
  setItem: (key: string, value: string): void => {
    store[key] = value.toString();
  },
  removeItem: (key: string): void => {
    delete store[key];
  },
  clear: (): void => {
    store = {};
  },
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// fetch 모킹
global.fetch = jest.fn();

const AUTH_TOKEN_KEY = 'fitflow_auth_token'; // useAuth.ts 내부의 키와 동일하게

describe('useAuth Hook', () => {
  beforeEach(() => {
    // 각 테스트 전에 모킹된 함수들과 localStorage 초기화
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockReset();
  });

  it('초기 상태: authLoading은 false가 되고, localStorage 토큰 유무에 따라 isLoggedIn 상태 설정', async () => { // 테스트 설명 약간 수정
    localStorage.setItem(AUTH_TOKEN_KEY, 'test-token-value');
    const { result } = renderHook(() => useLogin());

    // authLoading의 초기값 true를 직접 확인하는 것은 useEffect의 즉각적인 실행으로 인해 불안정할 수 있음
    // console.log('Initial authLoading from test:', result.current.authLoading); // 디버깅용 로그

    // useEffect가 실행되어 authLoading과 isLoggedIn이 업데이트될 때까지 기다림
    await waitFor(() => {
      expect(result.current.authLoading).toBe(false); // useEffect 실행 후 false가 되어야 함
      expect(result.current.isLoggedIn).toBe(true);
    });
  });

  it('초기 상태: localStorage에 토큰이 없으면 isLoggedIn은 false이고 authLoading은 false', async () => { // 테스트 설명 약간 수정
    const { result } = renderHook(() => useLogin());

    // console.log('Initial authLoading (no token) from test:', result.current.authLoading); // 디버깅용 로그

    await waitFor(() => {
      expect(result.current.authLoading).toBe(false); // useEffect 실행 후 false가 되어야 함
      expect(result.current.isLoggedIn).toBe(false);
    });
  });

  it('handleLogin 성공: isLoggedIn은 true가 되고 토큰 저장', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'new-login-token' }),
    });

    const { result } = renderHook(() => useLogin());
    // 초기 인증 확인 완료 대기
    await waitFor(() => expect(result.current.authLoading).toBe(false));

    await act(async () => {
      await result.current.handleLogin();
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('new-login-token');
    expect(result.current.error).toBeNull();
  });

  it('handleLogin 실패: 에러 메시지 설정 및 isLoggedIn은 false 유지', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: '로그인 정보 오류', code: 'INVALID_CREDENTIALS' }),
    });

    const { result } = renderHook(() => useLogin());
    await waitFor(() => expect(result.current.authLoading).toBe(false));

    await act(async () => {
      await result.current.handleLogin();
    });

    expect(result.current.isLoggedIn).toBe(false);
    // 로그인 실패 시 토큰이 없는지 (또는 제거되었는지) 확인
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(result.current.error).toContain('로그인 정보 오류');
    expect(result.current.error).toContain('INVALID_CREDENTIALS');
  });

  it('handleLogout: isLoggedIn은 false, 토큰 제거, 지정된 URL로 이동', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'existing-token');
    const { result } = renderHook(() => useLogin());

    // 훅이 초기화되고 로그인 상태를 인지할 때까지 대기
    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.authLoading).toBe(false);
    });

    const logoutDestination = '/logged-out';
    act(() => {
      result.current.handleLogout(logoutDestination);
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(result.current.error).toBe(LOGOUT_MESSAGES.MANUAL); // useAuth.ts의 LOGOUT_MESSAGES.MANUAL 값
    expect(mockRouterPush).toHaveBeenCalledWith(logoutDestination);
  });
});