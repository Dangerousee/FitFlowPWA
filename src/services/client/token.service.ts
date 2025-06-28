import apiClient from '@lib/shared/network/axios';

export const fetchToken = async (url: string, body: any): Promise<string | null> => {
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