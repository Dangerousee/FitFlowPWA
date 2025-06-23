/**
 * auth 모듈의 유틸리티들을 외부로 노출합니다.
 *
 * - getUserById     👉 인증된 사용자 조회 용도
 * - lookup 하위 모듈 👉 인증 없이 사용 가능한 사용자 존재 확인 용도
 */
export * from './authenticate';

// 인증 없이 사용 가능 (email/provider 기반 조회)
export * from './lookup';
