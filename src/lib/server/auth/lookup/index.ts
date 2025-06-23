/**
 * 🔍 Public lookup methods (No accessToken required)
 *
 * - 사용자의 존재 여부를 email 또는 providerId로 조회하는 목적으로 사용됩니다.
 * - 로그인된 사용자 정보 또는 민감한 정보 조회에는 절대 사용하지 마세요!
 */
export * from './getUserByProviderInfo';
export * from './getUserByEmail';