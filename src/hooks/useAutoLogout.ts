import { useEffect, useCallback, useRef } from 'react';

interface UseAutoLogoutOptions {
  isLoggedIn: boolean;
  onTimeout: () => void; // 타임아웃 시 실행될 콜백 함수
  timeoutDuration?: number; // ms 단위, 기본값은 내부에서 설정
}

const DEFAULT_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 기본 30분

export function useAutoLogout({
  isLoggedIn,
  onTimeout,
  timeoutDuration = DEFAULT_INACTIVITY_TIMEOUT_MS,
}: UseAutoLogoutOptions) {
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      onTimeout(); // 제공된 onTimeout 콜백 실행
    }, timeoutDuration);
  }, [onTimeout, timeoutDuration]);

  useEffect(() => {
    if (isLoggedIn) {
      const activityEvents: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      const eventListener = () => resetTimer();

      activityEvents.forEach(event => {
        window.addEventListener(event, eventListener);
      });
      resetTimer(); // 로그인 상태가 되면 타이머 시작

      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, eventListener);
        });
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    } else {
      // 로그아웃 상태이면 타이머 정리
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }
  }, [isLoggedIn, resetTimer]); // isLoggedIn 또는 resetTimer 함수가 변경될 때마다 실행
}