import { FaComment, FaGoogle, FaRegEnvelope } from 'react-icons/fa';
import { ProviderType } from '@enums';
import { useLogin } from '@contexts/AuthContext';
import { useSignUp } from '@hooks/useSignUp';
import { fetchUserData } from '@/services/client/auth-social.service';
import { normalizeSnsUser } from '@types';
import { findUser } from '@/services/client/user.service';
import { auth, googleProvider, signInWithPopup } from '@lib/cleint/config/firebase';
import { useSnsOAuth } from '@hooks/useSnsOauth';
import { useState } from 'react';

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

export default function SnsFormUI() {
  const { isLoggedIn, } = useLogin();
  const { handleSocialSignUp } = useSignUp();
  const { login: openSnsPopup, loading: snsPopupLoading } = useSnsOAuth();
  const [isProcessing, setIsProcessing] = useState(false); // 통합 로딩 상태

  const loading = isProcessing || snsPopupLoading;

  async function trySocialSignUp(data: any) {
    try {
      await handleSocialSignUp(data);
    } catch (error: any) {
      console.error('소셜 회원가입 처리 중 오류:', error.message);
      alert('회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.');
      // 필요 시: throw error; 로 propagate 가능
    }
  }

  const processSnsLoginAndRegister = async ({
    providerType,
    code,
    state,
  }: {
    providerType: ProviderType;
    code: string;
    state?: string;
  }) => {

    setIsProcessing(true);

    try {
      const snsUserRaw = await fetchUserData(providerType, code, state);
      const snsUser = normalizeSnsUser(providerType, snsUserRaw);
      const existingUser = await findUser({ providerType: providerType, providerId: snsUser.providerId});

      if (!existingUser) {
        if (confirm('아직 우리 커뮤니티의 멤버가 아니시네요!\n회원가입을 진행하시겠어요?')) {
          await trySocialSignUp(snsUser);
        }
      } else {
        alert(
          '이미 해당 이메일로 가입된 계정이 있습니다.\n'
          + '- 기존 계정으로 로그인해 주세요 😊\n'
          + '- 로그인 후 SNS 계정을 연결해 주세요 😊',
        );
      }

    } catch (err: any) {
      console.error(`${providerType} 처리 중 오류:`, err);
      alert('알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
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

  const handleSnsLogin = async(provider: ProviderType) => {
    const state = provider === ProviderType.NAVER ? Math.random().toString(36).substring(2) : undefined;
    const loginUrl = getSnsLoginUrl(provider, state);

    const result = await openSnsPopup({ providerType: provider, url: loginUrl });

    if (result.code) {
      // 네이버의 경우 state 검증이 필요하지만, 현재 로직에서는 postMessage로 state를 받지 않으므로 생략
      // 필요하다면 콜백 페이지에서 state를 함께 postMessage로 전달 필요
      await processSnsLoginAndRegister({
        providerType: provider,
        code: result.code,
        state: state,
      });
    } else if (result.error) {
      console.error(`${provider} 로그인 실패:`, result.error);
    }
  };

  // 카카오 로그인
  const handleKakaoLogin = () => handleSnsLogin(ProviderType.KAKAO);

  // 네이버 로그인
  const handleNaverLogin = () => handleSnsLogin(ProviderType.NAVER);

  // 구글 로그인
  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userInfo = result.user;
      console.log('Google 로그인 성공:', userInfo);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Google 로그인 오류:', message);
    } finally {
      setIsProcessing(false);
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
