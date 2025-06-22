import { PublicUserDTO } from '@types';
import { getAccessToken } from '@lib';
import { API_ROUTES } from '@routes/apis';
import apiClient from '@lib/shared/axios';

export const getMyProfile = async (): Promise<PublicUserDTO> => {
  const { data } = await apiClient.get(API_ROUTES.AUTH.ME, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  return data;
};