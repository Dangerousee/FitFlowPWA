import { useEffect } from 'react';
import { getAccessToken, setStoredUser, removeAccessToken, removeStoredUser } from '@lib/cleint';
import { getMyProfile } from '@lib/cleint/api';

export const useAuthEffect = () => {
  useEffect(() => {
    const validate = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const user = await getMyProfile();
        setStoredUser(user); // 유저 정보를 저장
      } catch (err) {
        // 토큰 유효하지 않음 → 로그아웃 처리
        removeAccessToken();
        removeStoredUser();
      }
    };

    validate();
  }, []);
};