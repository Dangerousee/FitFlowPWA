import { ProviderType } from '@enums';
import { UserDTO } from '@types';
import apiClient from '@lib/shared/axios';
import { API_ROUTES } from '@routes';

interface AuthResponse {
  accessToken: string;
}

const fetchToken = async (url: string, body: any): Promise<string | null> => {
  try {
    const { data } = await apiClient.post(url, body);

    if (!data?.access_token) {
      console.error('토큰 요청 실패:', data);
      return null;
    }

    return data.access_token;
  } catch (error: any) {
    console.error(
      '토큰 요청 오류:',
      error.response?.data?.message || error.message || String(error)
    );
    return null;
  }
};

const fetchUserInfo = async (
  url: string,
  accessToken: string,
  providerType: string
): Promise<any | null> => {
  try {
    const { data } = await apiClient.post(url, { accessToken });

    localStorage.setItem(`${providerType}_token`, accessToken);
    console.log(`${providerType} 사용자 정보:`, data);

    return data;
  } catch (error: any) {
    const errMsg =
      error.response?.data?.message ||
      (error instanceof Error ? error.message : String(error));

    console.error(`${providerType} API 요청 실패:`, errMsg);
    return null;
  }
};


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

// 회원 가입 (SNS 사용자 데이터를 내부 회원 데이터로 변환)
const registerUser = async (userData: UserDTO): Promise<any | null> => {
  try {
    const { data } = await apiClient.post(API_ROUTES.AUTH.SIGN_UP, userData);
    return data;
  } catch (error) {
    console.error('회원 등록 실패:', error);
    return null;
  }
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