import { FaGoogle, FaRegEnvelope, FaComment } from 'react-icons/fa';
import { auth, googleProvider, signInWithPopup } from '@lib/firebase';
import { useEffect, useRef, useCallback } from 'react';
import { ProviderType } from '@enums/auth';
import { SupabaseUserModel } from '@models/user.model';

interface SnsAuthProps {
  provider: ProviderType,
  url: string,
  state?: string,
  onSuccess?: (code: string, state?: string | undefined) => void,
  onError?: (err: string | undefined) => void
}

interface AuthResponse {
  accessToken: string;
}

export default function SnsFormUI() {
  // 메시지 핸들러 참조 저장
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // 1️⃣ 인증 단계 (SNS 로그인 후 액세스 토큰 받기)
  const authenticateUser = async (provider: ProviderType, code: string, state?: string): Promise<AuthResponse | null> => {
    const tokenUrl = provider === ProviderType.KAKAO ? "/api/auth/kakao-auth" : "/api/auth/naver-auth";
    const tokenBody = provider === ProviderType.KAKAO ? { code } : { code, state };

    const accessToken = await fetchToken(tokenUrl, tokenBody);
    return accessToken ? { accessToken } : null;
  };

// 2️⃣ 사용자 정보 가져오기 (SNS API 이용)
  const fetchUserData = async (provider: ProviderType, accessToken: string): Promise<SupabaseUserModel | null> => {
    const userUrl = provider === ProviderType.KAKAO ? "/api/auth/kakao-user" : "/api/auth/naver-user";
    return await fetchUserInfo(userUrl, accessToken, provider);
  };

// 3️⃣ 회원 가입 (SNS 사용자 데이터를 내부 회원 데이터로 변환)
  const registerUser = async (userData: SupabaseUserModel) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const result = await response.json();
    return response.ok ? result : null;
  };

// 4️⃣ 로그인 → 회원 정보 조회 → 회원 가입 진행
  const handleLogin = async (provider: ProviderType, code: string, state?: string) => {
    const authResponse = await authenticateUser(provider, code, state);
    if (!authResponse) {
      console.error("SNS 인증 실패");
      return;
    }

    const userData = await fetchUserData(provider, authResponse.accessToken);
    if (!userData) {
      console.error("사용자 정보 가져오기 실패");
      return;
    }

    const registerResponse = await registerUser(userData);
    if (registerResponse) {
      console.log("회원 가입 성공:", registerResponse);
    } else {
      console.error("회원 가입 실패");
    }
  };

// ✅ 회원가입 시 호출
  const handleNaverSignup = (code: string, state: string) => handleLogin(ProviderType.NAVER, code, state);
  const handleKakaoSignup = (code: string) => handleLogin(ProviderType.KAKAO, code);


  // 기존 메시지 핸들러 제거 함수
  // - `window.removeEventListener`를 호출하여 이전 핸들러 삭제
  // - `messageHandlerRef.current`를 null로 초기화하여 중복 실행 방지
  const removePreviousMessageHandler = useCallback(() => {
    if (messageHandlerRef.current) {
      window.removeEventListener("message", messageHandlerRef.current);
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
    const { provider, url, state, onSuccess, onError } = snsAuthProps;
    removePreviousMessageHandler(); // 중복 방지

    window.open(url, "_blank", "width=600,height=800"); // 로그인 팝업 열기

    const newMessageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return; // 보안상 출처 검증
      console.log(`${provider} 로그인 메시지 수신:`, event.data);

      // 이전 핸들러가 존재하면 제거하여 중복 실행 방지
      if (messageHandlerRef.current) {
        window.removeEventListener("message", messageHandlerRef.current);
        messageHandlerRef.current = null;
      }

      // 로그인 실패 시 리턴 처리
      if (!event.data.success) {
        onError?.(`${provider} 로그인 실패: ${event.data.error}`);
        return;
      }
      // 로그인 성공 시 인증 코드 처리
      if (provider === ProviderType.NAVER) {
        const { code, state: receivedState } = event.data;
        if (state && state !== receivedState) { // CSRF 공격 방지 검증
          onError?.("네이버 로그인 실패: state 값이 일치하지 않습니다.");
          return;
        }
        console.log("네이버 로그인 성공, 코드:", code);
        onSuccess?.(code, receivedState); // 네이버 사용자 정보 요청
      } else {
        console.log("카카오 로그인 성공, 코드:", event.data.code);
        onSuccess?.(event.data.code); // 카카오 사용자 정보 요청
      }
    };

    // 새로운 메시지 핸들러 등록
    messageHandlerRef.current = newMessageHandler;
    window.addEventListener("message", newMessageHandler);
  };

  // 카카오 로그인
  const handleKakaoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    handleAuth({
      provider: ProviderType.KAKAO,
      url: kakaoLoginUrl,
      onSuccess: (code: string) => {
        getKakaoUser(code);
      },
      onError: (err: string | undefined) => {
        console.error("카카오 로그인 실패:", err);
      }
    });
  };

  // 네이버 로그인
  const handleNaverLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const callbackUrl = process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;
    const state = Math.random().toString(36).substring(2);
    const naverLoginUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${callbackUrl}&state=${state}`;
    handleAuth({
      provider: ProviderType.NAVER,
      url: naverLoginUrl,
      state: state,
      onSuccess: (code: string) => {
        getNaverUser(code, state);
      },
      onError: (err: string | undefined) => {
        console.error("네이버 로그인 실패:", err);
      }
    });
  };

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

  const fetchToken = async (url: string, body: object) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!data.access_token) {
        console.error("토큰 요청 실패:", data);
        return null;
      }
      return data.access_token;
    } catch (error) {
      console.error("토큰 요청 오류:", error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  const fetchUserInfo = async (url: string, accessToken: string, provider: string) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(`${provider} 사용자 정보 요청 실패:`, data);
        return null;
      }

      localStorage.setItem(`${provider}_token`, accessToken);
      console.log(`${provider} 사용자 정보:`, data);
      return data;
    } catch (error) {
      console.error(`${provider} API 요청 오류:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  const getUser = async (provider: ProviderType, code: string, state?: string) => {
    if (!code || (provider === ProviderType.NAVER && !state)) return;

    const tokenUrl = provider === ProviderType.KAKAO ? "/api/auth/kakao-auth" : "/api/auth/naver-auth";
    const userUrl = provider === ProviderType.KAKAO ? "/api/auth/kakao-user" : "/api/auth/naver-user";
    const tokenBody = provider === ProviderType.KAKAO ? { code } : { code, state };

    const accessToken = await fetchToken(tokenUrl, tokenBody);
    if (!accessToken) return;

    await fetchUserInfo(userUrl, accessToken, provider);
  };

  const getKakaoUser = async (code: string) => getUser(ProviderType.KAKAO, code);
  const getNaverUser = async (code: string, state: string) => getUser(ProviderType.NAVER, code, state);

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
                className="flex items-center justify-center bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
            >
                <FaGoogle className="mr-2" />
                Google
            </button>
            <button
                onClick={handleKakaoLogin}
                className="flex items-center justify-center bg-yellow-400 text-black py-2 px-4 rounded hover:bg-yellow-500 transition"
            >
                <FaComment className="mr-2" />
                카카오
            </button>
            <button
                onClick={handleNaverLogin}
                className="flex items-center justify-center bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
            >
                <FaRegEnvelope className="mr-2" />
                네이버
            </button>
        </div>
    );
}