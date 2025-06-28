import { useEffect } from 'react';
import * as AuthStorageService from '@/services/client/auth-storage.service';
import { getMe } from '@/services/client/user.service';

export const useInitializeAuth = () => {
  useEffect(() => {
    const validate = async () => {
      const token = AuthStorageService.getAccessToken();
      if (!token) return;

      try {
        const user = await getMe();
        AuthStorageService.setStoredUser(user); // 유저 정보를 저장
      } catch (err) {
        // 토큰 유효하지 않음 → 로그아웃 처리
        AuthStorageService.removeAccessToken();
        AuthStorageService.removeStoredUser();
      }
    };

    validate();
  }, []);
};