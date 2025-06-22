
// 사용자별 refreshToken 세션 정보
export interface RefreshSession {
  // 고유 식별자 (UUID)
  id: string;

  // 연결된 사용자 ID (users 테이블 참조)
  userId: string;

  // 저장된 refreshToken (가능하면 해시된 값)
  refreshToken: string;

  // 로그인에 사용된 기기 정보 (예: Chrome on macOS)
  deviceInfo?: string;

  // 로그인 당시 IP 주소
  ipAddress?: string;

  // 토큰 발급 시점
  issuedAt: string; // ISO string

  // 토큰 만료 시각
  expiresAt: string; // ISO string

  // 로그아웃 또는 강제 만료 여부
  revoked: boolean;

  // 세션 생성 시각 (기록용)
  createdAt: string;

  // 마지막 업데이트 시각
  updatedAt: string;
}