/** 사용자 계정 상태 열거형 */
export enum AccountStatus {
  ACTIVE = 'active',      // 활성 상태
  INACTIVE = 'inactive',  // 비활성 상태 (일정 기간 미사용 또는 (관리자에 의한)계정 비활성화 상태)
  BANNED = 'banned',      // 이용 제한 상태
  DORMANT = 'dormant',    // 휴면 상태 (장기 미접속으로 일시적인 비활성 상태)
  WITHDRAWN = 'withdrawn',// 탈퇴 상태
}

export enum LoginType {
  NATIVE = "native",
  SOCIAL = "social"
}

export enum ProviderType {
  KAKAO = 'kakao',
  NAVER = 'naver',
  GOOGLE = 'google',
}

/** 사용자의 구독 플랜 유형 */
export enum UserPlanType {
  FREE = 'free',
  PREMIUM = 'premium',
  PRO = 'pro',
}

/** 사용자의 역할 또는 권한 수준 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}