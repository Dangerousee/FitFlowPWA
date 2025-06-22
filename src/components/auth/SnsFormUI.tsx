import { FaComment, FaGoogle, FaRegEnvelope } from 'react-icons/fa';
import { useCallback, useEffect, useRef } from 'react';
import { auth, googleProvider, signInWithPopup } from '@lib/cleint';
import { ProviderType } from '@enums';
import { useLogin } from '@contexts/AuthContext';
import { useSignUp } from '@hooks/useSignUp';
import { USER_ALREADY_EXISTS, USER_NOT_FOUND } from '@constants/errorCodes';

const ENV_MAP = {
  'kakao': {
    CLIENT_ID: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
    REDIRECT_URI: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI,
  },
  'naver': {
    CLIENT_ID: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
    REDIRECT_URI: process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI,
  },
};

interface SnsAuthProps {
  providerType: ProviderType;
  url: string;
  state?: string;
  onSuccess?: (code: string, state?: string | undefined) => void;
  onError?: (err: string | undefined) => void;
}

export default function SnsFormUI() {
  // 메시지 핸들러 참조 저장
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  const { isLoggedIn, loading, setLoading } = useLogin();
  const { error, loading: signUpLoading, setLoading: setSignUpLoading, handleSocialSignUp, handleSocialSignUpWithNativeLogin } = useSignUp();

  // 기존 메시지 핸들러 제거 함수
  // - `window.removeEventListener`를 호출하여 이전 핸들러 삭제
  // - `messageHandlerRef.current`를 null로 초기화하여 중복 실행 방지
  const removePreviousMessageHandler = useCallback(() => {
    if (messageHandlerRef.current) {
      window.removeEventListener('message', messageHandlerRef.current);
      messageHandlerRef.current = null;
    }
  }, []);

  // 컴포넌트가 언마운트될 때 메시지 핸들러 제거
  useEffect(() => {
    return () => {
      removePreviousMessageHandler();
    };
  }, [removePreviousMessageHandler]);

  // 로그인 공통 핸들러
  // - provider(kakao, naver)에 따라 로그인 URL을 생성하고 팝업창을 열어 OAuth 인증 수행
  // - `window.addEventListener`를 사용해 로그인 완료 후 메시지를 수신
  // - 네이버의 경우, CSRF 방지를 위해 `state` 검증 수행
  const handleAuth = (snsAuthProps: SnsAuthProps) => {
    const { providerType, url, state, onSuccess, onError } = snsAuthProps;
    removePreviousMessageHandler(); // 중복 방지

    const popup = window.open(url, '_blank', 'width=600,height=800'); // 로그인 팝업 열기

    if (!popup) {
      onError?.(`${providerType} 로그인 창 열기 실패`);
      return;
    }

    // 팝업 닫힘 감지 타이머
    const popupCheckInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupCheckInterval);
        if (!signUpLoading) {
          setLoading(false);
        }
        // message 핸들러도 제거
        if (messageHandlerRef.current) {
          window.removeEventListener('message', messageHandlerRef.current);
          messageHandlerRef.current = null;
        }
      }
    }, 500); // 0.5초마다 팝업 상태 확인

    const newMessageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return; // 보안상 출처 검증
      console.log(`${providerType} 로그인 메시지 수신:`, event.data);

      // 이전 핸들러가 존재하면 제거하여 중복 실행 방지
      if (messageHandlerRef.current) {
        window.removeEventListener('message', messageHandlerRef.current);
        messageHandlerRef.current = null;
      }

      if (event.data.success) {
        console.log(`${providerType} 로그인 성공, 코드:`, event.data.code);
        onSuccess?.(event.data.code, state);
      } else {
        onError?.(`${providerType} 로그인 실패: ${event.data.error}`);
      }
    };

    // 새로운 메시지 핸들러 등록
    messageHandlerRef.current = newMessageHandler;
    window.addEventListener('message', newMessageHandler);
  };

  async function trySocialSignUp(data: any) {
    try {
      await handleSocialSignUp(data);
    } catch (error: any) {
      console.error('소셜 회원가입 처리 중 오류:', error);
      alert('회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.');
      // 필요 시: throw error; 로 propagate 가능
    }
  }

  const processSnsLoginAndRegister = async ({
    provider,
    code,
    state,
    receivedState,
  }: {
    provider: ProviderType;
    code: string;
    state?: string;
    receivedState?: string;
  }) => {
    if (provider === ProviderType.NAVER && state && state !== receivedState) {
      console.error('로그인 실패: state 값이 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      await handleSocialSignUpWithNativeLogin({ providerType: provider, code, state });
    } catch (err: any) {
      const { statusCode, code: errorCode, data } = err;

      console.log({statusCode, errorCode, data});

      if (errorCode === USER_NOT_FOUND || statusCode === 401) {
        const shouldSignUp = confirm(
          '아직 우리 커뮤니티의 멤버가 아니시네요!\n회원가입을 진행하시겠어요?',
        );
        if (shouldSignUp) {
          await trySocialSignUp(data);
        }
        return;
      }

      if (errorCode === USER_ALREADY_EXISTS) {
        alert(
          '이미 해당 이메일로 가입된 계정이 있습니다.\n'
          + '- 기존 계정으로 로그인해 주세요 😊'
          + '- 로그인 후 SNS 계정을 연결해 주세요 😊',
        );
        return;
      }

      alert('알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getSnsLoginUrl = (providerType: ProviderType, state?: string) => {
    const clientId = ENV_MAP[providerType as keyof typeof ENV_MAP].CLIENT_ID;
    const redirectUri = ENV_MAP[providerType as keyof typeof ENV_MAP].REDIRECT_URI;

    if (!clientId || !redirectUri) return '';

    if (providerType === ProviderType.KAKAO) {
      return `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    }

    if (providerType === ProviderType.NAVER) {
      return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
    }

    return '';
  };

  const handleSnsLogin = (provider: ProviderType) => {
    const state = Math.random().toString(36).substring(2);
    const loginUrl = getSnsLoginUrl(provider, state);

    setSignUpLoading(true);
    setLoading(true);

    handleAuth({
      providerType: provider,
      url: loginUrl,
      state,
      onSuccess: (code, state) =>
        processSnsLoginAndRegister({
          provider,
          code: code,
          state: state,
          receivedState: state,
        }),
      onError: err => {
        console.error(`${provider} 로그인 실패:`, err);
      },
    });
  };

  // 카카오 로그인
  const handleKakaoLogin = () => handleSnsLogin(ProviderType.KAKAO);

  // 네이버 로그인
  const handleNaverLogin = () => handleSnsLogin(ProviderType.NAVER);

  // 구글 로그인
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userInfo = result.user;
      console.log('Google 로그인 성공:', userInfo);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Google 로그인 오류:', message);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}
    >
      <button
        onClick={handleGoogleLogin}
        disabled={isLoggedIn || loading}
        className="flex items-center justify-center bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
      >
        <FaGoogle className="mr-2" />
        Google
      </button>
      <button
        onClick={handleKakaoLogin}
        disabled={isLoggedIn || loading}
        className="flex items-center justify-center bg-yellow-400 text-black py-2 px-4 rounded hover:bg-yellow-500 transition"
      >
        <FaComment className="mr-2" />
        카카오
      </button>
      <button
        onClick={handleNaverLogin}
        disabled={isLoggedIn || loading}
        className="flex items-center justify-center bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
      >
        <FaRegEnvelope className="mr-2" />
        네이버
      </button>
    </div>
  );
}
