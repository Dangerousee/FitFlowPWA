import { getAccessToken, getStoredUser } from '@lib/cleint';

export const isLoggedIn = () => {
  const token = getAccessToken();
  const user = getStoredUser();

  return Boolean(token && user);
};