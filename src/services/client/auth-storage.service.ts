const TOKEN_KEY = 'fitflow_auth_token';
const USER_KEY = 'fitflow_user_info';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const setAccessToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const removeAccessToken = () => localStorage.removeItem(TOKEN_KEY);

export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: object) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = () => localStorage.removeItem(USER_KEY);

export const isLoggedIn = () => {
  const token = getAccessToken();
  const user = getStoredUser();

  return Boolean(token && user);
};

export const setItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('설정 실패:', error);
  }
};
