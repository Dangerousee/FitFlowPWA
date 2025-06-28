/**
 * @file 서버 환경에서만 사용되는 상수들을 정의합니다.
 * 이 파일의 값들은 클라이언트 번들에 포함되지 않아야 하므로,
 * 서버 컴포넌트, API Routes, Server Actions에서만 import하여 사용해야 합니다.
 * 민감한 정보(API 키 등)는 .env 파일을 통해 관리하고, 여기서는 일반적인 서버 설정을 다룹니다.
 */

/**
 * 데이터베이스 관련 상수
 */
export const DB_TABLES = {
  /** 사용자 정보 */
  USERS: 'users',
  /** 계정 세션 정보 */
  REFRESH_SESSIONS: 'refresh_sessions',
} as const;

/**
 * 캐시 재검증(revalidation) 시간 (초 단위)
 */
export const REVALIDATE_TIMES = {
  /** 1시간 */
  HOURLY: 3600,
  /** 하루 */
  DAILY: 86400,
} as const;