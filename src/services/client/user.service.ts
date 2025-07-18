import { PublicUserDTO } from '@types';
import { API_ROUTES } from '@routes';
import apiClient from '@lib/shared/network/axios';
import { getAccessToken, getStoredUser } from '@/services/client/auth-storage.service';

/** 로그인 된 사용자의 유효성 체크시 사용 */
export const getMe = async (): Promise<PublicUserDTO> => {
  const user = getStoredUser();

  if (!user) {
    throw new Error('로그인된 사용자 ID를 찾을 수 없습니다.');
  }

  const endpoint = user.id
    ? `${API_ROUTES.AUTH.ME}?userId=${encodeURIComponent(user.id)}`
    : API_ROUTES.AUTH.ME;

  const { data } = await apiClient.get(endpoint, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  return data;
};

/** 이메일/소셜 정보 기반 사용자 조회용 */
export const findUser = async (
  params?: {
    email?: string;
    providerType?: string;
    providerId?: string;
  }
): Promise<PublicUserDTO | null> => {
  try {
    let endpoint = API_ROUTES.USERS.LOOKUP;

    if (params?.providerType && params?.providerId) {
      endpoint += `?providerType=${params.providerType}&providerId=${params.providerId}`;
    } else if (params?.email) {
      endpoint += `?email=${params.email}`;
    }

    const { data } = await apiClient.get(endpoint);

    return data;
  } catch (error: any) {
    // 조건: 404면 "찾을 수 없음" 처리,
    // if (error.response?.status === 404) {
    //   return null;
    // }

    //  그 외는 로그 찍고 그대로 throw 던지기
    console.error('사용자 조회 실패:', error);
    throw error;
  }
};