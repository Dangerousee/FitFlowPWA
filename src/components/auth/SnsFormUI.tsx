import { FaGoogle, FaRegEnvelope, FaComment } from 'react-icons/fa';
import { auth, googleProvider, signInWithPopup } from '@lib/firebase';
import { useEffect, useRef, useCallback } from 'react';

export default function SnsFormUI() {
    const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

    const removePreviousMessageHandler = useCallback(() => {
        if (messageHandlerRef.current) {
            window.removeEventListener('message', messageHandlerRef.current);
            messageHandlerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            removePreviousMessageHandler();
        };
    }, [removePreviousMessageHandler]);

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

    const getKakaoUser = async (code: string) => {
        if (!code) return;
        try {
            // 1. 액세스 토큰 요청
            const tokenResponse = await fetch('/api/auth/kakao-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const tokenData = await tokenResponse.json();
            console.log("카카오 토큰 응답:", { tokenData });

            if (tokenData.access_token) {
                localStorage.setItem('kakao_token', tokenData.access_token);

                // 2. 액세스 토큰으로 사용자 정보 요청
                const userResponse = await fetch('/api/auth/kakao-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken: tokenData.access_token }),
                });
                const userData = await userResponse.json();

                if (userResponse.ok) {
                    console.log('카카오 사용자 정보:', userData);
                    // TODO: 로그인 성공 후 리디렉션 또는 UI 업데이트 (userData 사용)
                } else {
                    console.error('카카오 사용자 정보 요청 실패:', userData);
                }
            } else {
                console.error('카카오 토큰 요청 실패:', tokenData);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('카카오 API 요청 오류:', message);
        }
    };

    const getNaverUser = async (code: string, state: string) => {
        if (!code || !state) return;
        try {
            // 1. 액세스 토큰 요청
            const tokenResponse = await fetch('/api/auth/naver-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, state }),
            });
            const tokenData = await tokenResponse.json();
            console.log("네이버 토큰 응답:", { tokenData });

            if (tokenData.access_token) {
                localStorage.setItem('naver_token', tokenData.access_token);

                // 2. 액세스 토큰으로 사용자 정보 요청
                const userResponse = await fetch('/api/auth/naver-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken: tokenData.access_token }),
                });
                const userData = await userResponse.json();

                if (userResponse.ok) {
                    console.log('네이버 사용자 정보:', userData);
                    // TODO: 로그인 성공 후 리디렉션 또는 UI 업데이트 (userData 사용)
                } else {
                    console.error('네이버 사용자 정보 요청 실패:', userData);
                }
            } else {
                console.error('네이버 토큰 요청 실패:', tokenData);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('네이버 API 요청 오류:', message);
        }
    };

    const handleKakaoLogin = async () => {
        removePreviousMessageHandler();

        const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
        const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;

        window.open(kakaoLoginUrl, '_blank', 'width=600,height=800');

        const newMessageHandler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) {
                return;
            }
            console.log('카카오 로그인 메시지 수신:', event.data);

            window.removeEventListener('message', newMessageHandler);
            if (messageHandlerRef.current === newMessageHandler) {
                messageHandlerRef.current = null;
            }

            if (event.data.success) {
                console.log('카카오 로그인 성공 (postMessage), 코드:', event.data.code);
                getKakaoUser(event.data.code);
            } else {
                console.error('카카오 로그인 실패 (postMessage):', event.data.error);
            }
        };

        messageHandlerRef.current = newMessageHandler;
        window.addEventListener('message', newMessageHandler);
    };

    const handleNaverLogin = () => {
        removePreviousMessageHandler();

        const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
        const callbackUrl = process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;
        // CSRF 방지를 위해 state 값은 매번 랜덤하게 생성하는 것이 좋습니다.
        const state = Math.random().toString(36).substring(2);
        const naverLoginUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${callbackUrl}&state=${state}`;

        window.open(naverLoginUrl, '_blank', 'width=600,height=800');

        const newMessageHandler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) {
                return;
            }
            console.log('네이버 로그인 메시지 수신:', event.data);

            window.removeEventListener('message', newMessageHandler);
            if (messageHandlerRef.current === newMessageHandler) {
                messageHandlerRef.current = null;
            }

            if (event.data.success) {
                const { code, state: receivedState } = event.data;
                // CSRF 공격 방지를 위해 요청 시 사용한 state와 콜백으로 받은 state가 일치하는지 확인
                if (state !== receivedState) {
                    console.error('네이버 로그인 실패: state 값이 일치하지 않습니다.');
                    return;
                }
                console.log('네이버 로그인 성공 (postMessage), 코드:', code, '상태:', receivedState);
                getNaverUser(code, receivedState);
            } else {
                console.error('네이버 로그인 실패 (postMessage):', event.data.error);
            }
        };

        messageHandlerRef.current = newMessageHandler;
        window.addEventListener('message', newMessageHandler);
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