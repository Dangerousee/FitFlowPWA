import { ProviderType } from '@enums';
import { SupabaseUserDTO } from '@types';

interface AuthResponse {
  accessToken: string;
}

const fetchToken = async (url: string, body: object) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.access_token) {
      console.error('토큰 요청 실패:', data);
      return null;
    }
    return data.access_token;
  } catch (error) {
    console.error('토큰 요청 오류:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

const fetchUserInfo = async (url: string, accessToken: string, providerType: string) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`${providerType} 사용자 정보 요청 실패:`, data);
      return null;
    }

    localStorage.setItem(`${providerType}_token`, accessToken);
    console.log(`${providerType} 사용자 정보:`, data);
    return data;
  } catch (error) {
    console.error(`${providerType} API 요청 오류:`, error instanceof Error ? error.message : String(error));
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
): Promise<SupabaseUserDTO | null> => {
  // 1️⃣ SNS별 인증 토큰 URL 및 바디 구성
  const tokenUrl = providerType === ProviderType.KAKAO ? '/api/auth/kakao-auth' : '/api/auth/naver-auth';
  const tokenBody = providerType === ProviderType.KAKAO ? { code } : { code, state };

  // 2️⃣ 액세스 토큰 발급
  const accessToken = await fetchToken(tokenUrl, tokenBody);
  if (!accessToken) {
    console.error('SNS accessToken 가져오기 실패');
    return null;
  }

  // 3️⃣ 사용자 정보 API URL 구성
  const userUrl = providerType === ProviderType.KAKAO ? '/api/auth/kakao-user' : '/api/auth/naver-user';

  // 4️⃣ 사용자 정보 가져오기
  return await fetchUserInfo(userUrl, accessToken, providerType);
};

// 회원 가입 (SNS 사용자 데이터를 내부 회원 데이터로 변환)
const registerUser = async (userData: SupabaseUserDTO) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const result = await response.json();
  return response.ok ? result : null;
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