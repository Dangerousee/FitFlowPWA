import { UserAccountStatus } from '@enums/auth';

export interface SupabaseUserModel {
  /** 사용자의 고유 ID */
  id: string;
  /** 사용자 이름 (고유해야 함) */
  username: string;
  /** 사용자 이메일 주소 (로그인 및 알림에 사용) */
  email: string;
  /** 계정 생성 일시 (ISO 8601 형식) */
  created_at?: string;
  /** 사용자의 구독 플랜 유형 */
  plan_type: 'free' | 'premium' | 'pro';
  /** 사용자의 역할 또는 권한 수준 */
  role: 'user' | 'admin' | 'moderator';
  /** 구독 시작일 (ISO 8601 형식), 구독하지 않은 경우 null */
  subscription_start_date?: string | null;
  /** 구독 종료일 (ISO 8601 형식), 구독하지 않은 경우 null */
  subscription_end_date?: string | null;
  /** 현재 구독이 활성 상태인지 여부 */
  is_subscription_active?: boolean;
  /** 사용자 정보 최종 업데이트 일시 (ISO 8601 형식) */
  update_at?: string | null;
  /** 사용자의 별명 또는 표시 이름 */
  nickname?: string | null;
  /** 프로필 이미지 URL */
  profile_image_url?: string | null;
  /** 사용자의 현재 계정 상태 */
  status: UserAccountStatus;
  /** 계정 비활성화 일시 (ISO 8601 형식) */
  deactivated_at?: string | null;
  /** 계정 탈퇴(철회) 일시 (ISO 8601 형식) */
  withdrawal_at?: string | null;
  /** 마지막 로그인 일시 (ISO 8601 형식) */
  last_login_at?: string | null;
  /** 마지막 비밀번호 변경 일시 (ISO 8601 형식) */
  password_last_changed_at?: string | null;
};



