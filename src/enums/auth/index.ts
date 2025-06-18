/** 사용자 계정 상태 열거형 */
export enum UserAccountStatus {
  ACTIVE = 'active',      // 활성 상태
  INACTIVE = 'inactive',  // 비활성 상태 (일정 기간 미사용 또는 (관리자에 의한)계정 비활성화 상태)
  BANNED = 'banned',      // 이용 제한 상태
  DORMANT = 'dormant',    // 휴면 상태 (장기 미접속으로 일시적인 비활성 상태)
  WITHDRAWN = 'withdrawn',// 탈퇴 상태
}

export enum SnsProviderType {
  KAKAO = 'kakao',
  NAVER = 'naver',
  GOOGLE = 'google',
}