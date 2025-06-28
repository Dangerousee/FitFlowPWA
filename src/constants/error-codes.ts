/**
 * @file 애플리케이션 전반에서 사용되는 커스텀 에러 코드를 정의합니다.
 * 클라이언트와 서버 양쪽에서 일관된 에러 처리를 위해 사용됩니다.
 * 에러는 도메인별로 그룹화하여 관리합니다.
 */
export const ERROR_CODES = {
  /**
   * 계정 상태와 관련된 에러
   */
  ACCOUNT: {
    /** 계정이 비활성화 상태입니다. 재활성화 절차가 필요합니다. */
    INACTIVE: 'ACCOUNT_INACTIVE',
    /** 계정이 정책 위반으로 인해 영구적으로 정지되었습니다. */
    BANNED: 'ACCOUNT_BANNED',
    /** 장기간 미사용으로 인해 휴면 처리된 계정입니다. */
    DORMANT: 'ACCOUNT_DORMANT',
    /** 사용자가 직접 탈퇴한 계정입니다. */
    WITHDRAWN: 'ACCOUNT_WITHDRAWN',
    /** 알 수 없거나 정의되지 않은 계정 상태입니다. */
    UNKNOWN_STATUS: 'UNKNOWN_ACCOUNT_STATUS',
  },

  /**
   * 인증(로그인, 회원가입, 권한)과 관련된 에러
   */
  AUTH: {
    /** 비밀번호 유효 기간이 만료되었습니다. */
    PASSWORD_EXPIRED: 'PASSWORD_EXPIRED',
    /** 이미 동일한 정보(이메일 등)로 가입된 계정이 존재합니다. */
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    /** 인증에 필요한 정보(토큰, 이메일, 비밀번호 등)가 누락되었습니다. */
    MISSING_CREDENTIAL: 'MISSING_CREDENTIAL',
    /** 이메일 또는 비밀번호가 일치하지 않습니다. */
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    /** 소셜 로그인 후 추가 정보(닉네임 등) 입력이 완료되지 않았습니다. */
    USER_DATA_INCOMPLETE: 'USER_DATA_INCOMPLETE',
    /** 지원하지 않는 로그인 방식입니다. */
    UNKNOWN_LOGIN_TYPE: 'UNKNOWN_LOGIN_TYPE',
    /** 해당 리소스에 접근할 권한이 없습니다. */
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    /** 요청한 사용자를 찾을 수 없습니다. */
    USER_NOT_FOUND: "USER_NOT_FOUND",
  },

  /**
   * 데이터베이스 및 외부 서비스(Supabase)와 관련된 에러
   */
  DB: {
    /** Supabase에서 사용자의 마지막 로그인 시간 업데이트에 실패했습니다. */
    SUPABASE_LOGIN_UPDATE_FAILED: 'SUPABASE_LOGIN_UPDATE_FAILED',
    /** Supabase 데이터베이스 작업 중 특정되지 않은 오류가 발생했습니다. */
    SUPABASE_DB_ERROR: "SUPABASE_DB_ERROR",
    /** 일반적인 데이터베이스 작업 실패 에러입니다. */
    GENERIC_DB_ERROR: "DB_ERROR",
  },

  /**
   * 입력값 유효성 검사와 관련된 에러
   */
  VALIDATION: {
    /** API 요청 등에서 필수 필드가 누락되었습니다. */
    MISSING_FIELD: "MISSING_FIELD",
    /** 입력값의 형식이 올바르지 않습니다. (e.g., 잘못된 이메일 형식) */
    INVALID_INPUT: 'INVALID_INPUT',
  },

  /**
   * 일반적인 서버 및 기타 에러
   */
  GENERAL: {
    /** 예측하지 못한 서버 내부 오류가 발생했습니다. */
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  },
} as const;