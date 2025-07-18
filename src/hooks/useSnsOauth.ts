import { useCallback, useEffect, useRef, useState } from 'react';
import { ProviderType } from '@enums';

interface SnsAuthProps {
  providerType: ProviderType;
  url: string;
}

interface SnsOAuthResult {
  code: string | null;
  error: string | null;
}

export function useSnsOAuth() {
  const [loading, setLoading] = useState(false);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const popupRef = useRef<Window | null>(null);

  const removeMessageHandler = useCallback(() => {
    if (messageHandlerRef.current) {
      window.removeEventListener('message', messageHandlerRef.current);
      messageHandlerRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      popupRef.current = null;
    }
  }, []);

  useEffect(() => {
    // 컴포넌트 언마운트 시 리스너와 팝업 정리
    return () => {
      removeMessageHandler();
    };
  }, [removeMessageHandler]);

  // 로그인 공통 핸들러
  // - provider(kakao, naver)에 따라 로그인 URL을 생성하고 팝업창을 열어 OAuth 인증 수행
  // - `window.addEventListener`를 사용해 로그인 완료 후 메시지를 수신
  // - 네이버의 경우, CSRF 방지를 위해 `state` 검증 수행
  const login = useCallback(
    ({ providerType, url }: SnsAuthProps): Promise<SnsOAuthResult> => {
      return new Promise((resolve) => {
        setLoading(true);
        removeMessageHandler(); // 이전 핸들러와 팝업 정리

        popupRef.current = window.open(url, '_blank', 'width=600,height=800');

        if (!popupRef.current) {
          setLoading(false);
          resolve({ code: null, error: `${providerType} 로그인 창을 여는데 실패했습니다.` });
          return;
        }

        // 팝업 닫힘 감지 타이머
        const popupCheckInterval = setInterval(() => {
          if (popupRef.current?.closed) {
            clearInterval(popupCheckInterval);
            setLoading(false);
            // 사용자가 직접 팝업을 닫은 경우, 에러는 아니지만 성공도 아님
            // 필요하다면 여기서 reject 또는 특정 상태로 resolve 가능
            removeMessageHandler();
          }
        }, 500); // 0.5초마다 팝업 상태 확인

        const newMessageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          clearInterval(popupCheckInterval);
          setLoading(false);
          removeMessageHandler();

          if (event.data.success) {
            resolve({ code: event.data.code, error: null });
          } else {
            resolve({ code: null, error: `${providerType} 로그인 실패: ${event.data.error}` });
          }
        };

        messageHandlerRef.current = newMessageHandler;
        window.addEventListener('message', newMessageHandler);
      });
    },
    [removeMessageHandler]
  );

  return { login, loading };
}