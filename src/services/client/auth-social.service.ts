import { ProviderType } from '@enums';
import { UserDTO } from '@types';
import { API_ROUTES } from '@routes';
import { fetchToken } from '@/services/client/token.service';
import { fetchUserInfo, registerUser } from '@/services/client/auth.service';

/**
 * SNS 인증 코드로부터 액세스 토큰을 발급받고 사용자 정보를 가져옵니다.
 */
export const fetchUserData = async (
  providerType: ProviderType,
  code: string,
  state?: string
): Promise<UserDTO | null> => {
  // 1️⃣ SNS별 인증 토큰 URL 및 바디 구성
  const tokenUrl = providerType === ProviderType.KAKAO ? API_ROUTES.AUTH.KAKAO_AUTH : API_ROUTES.AUTH.NAVER_AUTH;
  const tokenBody = providerType === ProviderType.KAKAO ? { code } : { code, state };

  // 2️⃣ 액세스 토큰 발급
  const accessToken = await fetchToken(tokenUrl, tokenBody);
  if (!accessToken) {
    console.error('SNS accessToken 가져오기 실패');
    return null;
  }

  // 3️⃣ 사용자 정보 API URL 구성
  const userUrl = providerType === ProviderType.KAKAO ? API_ROUTES.AUTH.KAKAO_USER : API_ROUTES.AUTH.NAVER_USER;

  // 4️⃣ 사용자 정보 가져오기
  return await fetchUserInfo(userUrl, accessToken, providerType);
};

// 로그인 → 회원 정보 조회 → 회원 가입 진행
const handleRegister = async (providerType: ProviderType, code: string, state?: string) => {
  const userData = await fetchUserData(providerType, code, state);
  if (!userData) {
    console.error('사용자 정보 가져오기 실패');
    return;
  }

  const registerResponse = await registerUser(userData);
  if (registerResponse) {
    console.log('회원 가입 성공:', registerResponse);
  } else {
    console.error('회원 가입 실패');
  }
  return registerResponse;
};

// ✅ 회원가입 시 호출
export const handleNaverSignup = async (code: string, state: string) => handleRegister(ProviderType.NAVER, code, state);
export const handleKakaoSignup = async (code: string) => handleRegister(ProviderType.KAKAO, code);