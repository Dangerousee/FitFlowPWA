/**
 * API 라우트 경로를 정의하는 상수 객체입니다.
 * `src/pages` 디렉토리 구조를 기반으로 작성되었습니다.
 *
 * @example
 * import { API_ROUTES } from '@/src/routess';
 *
 * // 정적 라우트
 * axios.post(API_ROUTES.AUTH.LOGIN, { ... });
 *
 * // 동적 라우트
 * const postId = '123';
 * axios.get(API_ROUTES.POSTS.DETAIL(postId)); // /posts/123
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    SIGN_UP: '/auth/sign-up',
    ME: '/auth/me',
    DUPLICATE_CHECKER: '/auth/check-duplicate',

    KAKAO_AUTH: '/auth/kakao-auth',
    KAKAO_USER: '/auth/kakao-user',

    NAVER_AUTH: '/auth/naver-auth',
    NAVER_USER: '/auth/naver-user',
  },
  POSTS: {
    LIST: '/posts',
    DETAIL: (postId: string | number) => `/posts/${postId}`,
  },
  USERS: {
    LOOKUP: '/users/lookup',
    PROFILE: (userId: string | number) => `/users/${userId}/profile`,
  },
} as const;
