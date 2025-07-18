import apiClient from '@lib/shared/network/axios';
import { UserDTO } from '@types';
import { API_ROUTES } from '@routes';
import * as AuthStorageService from '@/services/client/auth-storage.service';

export const fetchUserInfo = async (
  url: string,
  accessToken: string,
  providerType: string
): Promise<any | null> => {
  try {
    const { data } = await apiClient.post(url, { accessToken });

    // TODO 저장할 필요가 있나?
    // AuthStorageService.setItem(`${providerType}_token`, accessToken);
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

// 회원 가입 (SNS 사용자 데이터를 내부 회원 데이터로 변환)
export const registerUser = async (userData: UserDTO): Promise<any | null> => {
  try {
    return await apiClient.post(API_ROUTES.AUTH.SIGN_UP, userData);
  } catch (error) {
    console.error('회원 등록 실패:', error);
    throw error;
  }
};

