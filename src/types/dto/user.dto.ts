import { LoginType, ProviderType, AccountStatus, UserPlanType, UserRole } from '@enums';

export interface UserDTO {
  /** 사용자의 고유 ID */
  id: string;
  /** 사용자 이름 (고유해야 함) */
  username: string;
  /** 사용자 이메일 주소 (로그인 및 알림에 사용) */
  email: string;
  /** 계정 생성 일시 (ISO 8601 형식) */
  createdAt?: string;
  /** 구독 시작일 (ISO 8601 형식), 구독하지 않은 경우 null */
  subscriptionStartDate?: string | null;
  /** 구독 종료일 (ISO 8601 형식), 구독하지 않은 경우 null */
  subscriptionEndDate?: string | null;
  /** 현재 구독이 활성 상태인지 여부 */
  isSubscriptionActive?: boolean;
  /** 사용자 정보 최종 업데이트 일시 (ISO 8601 형식) */
  updatedAt?: string | null;
  /** 사용자의 별명 또는 표시 이름 */
  nickname?: string | null;
  /** 프로필 이미지 URL */
  profileImageUrl?: string | null;
  /** 계정 비활성화 일시 (ISO 8601 형식) */
  deactivatedAt?: string | null;
  /** 계정 탈퇴(철회) 일시 (ISO 8601 형식) */
  withdrawalAt?: string | null;
  /** 마지막 로그인 일시 (ISO 8601 형식) */
  lastLoginAt?: string | null;
  /** 마지막 비밀번호 변경 일시 (ISO 8601 형식) */
  passwordLastChangedAt?: string | null;
  /** Social platform type */
  providerType: ProviderType | null;
  /** Social platform 에서 제공되는 uuid */
  providerId: string | null;
  /** 로그인 유형(native | social) */
  loginType: LoginType | null;
  /** 사용자의 구독 플랜 유형 */
  planType: UserPlanType;
  /** 사용자의 역할 또는 권한 수준 */
  userRole: UserRole;
  /** 사용자의 현재 계정 상태 */
  accountStatus: AccountStatus;
}

// 보안을 이유로 클라이언트에게 내려줄것만 별도 DTO로 정의
export type PublicUserDTO = Pick<
  UserDTO,
  | 'id'
  | 'username'
  | 'email'
  | 'nickname'
  | 'profileImageUrl'
  | 'planType'
  | 'userRole'
  // --- 추천 필드 추가 ---
  | 'accountStatus' // 클라이언트가 계정 상태에 따라 적절히 반응하도록 하기 위함
  | 'isSubscriptionActive' // 구독 기반 기능 제어 로직을 단순화하기 위함
>;

/**
 * 데이터베이스에서 조회한 raw user 객체(snake_case)를
 * 애플리케이션에서 사용하는 UserDTO(camelCase)로 변환합니다.
 * 이 함수는 타입 안전성을 보장하고, 외부 라이브러리 의존성을 제거합니다.
 * @param dbUser - 데이터베이스에서 직접 조회한, 타입이 보장되지 않은 사용자 객체
 * @returns 타입이 보장된 UserDTO 객체
 */
export function mapDbUserToUserDTO(dbUser: Record<string, any>): UserDTO {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    createdAt: dbUser.created_at,
    subscriptionStartDate: dbUser.subscription_start_date ?? null,
    subscriptionEndDate: dbUser.subscription_end_date ?? null,
    isSubscriptionActive: dbUser.is_subscription_active,
    updatedAt: dbUser.updated_at ?? null,
    nickname: dbUser.nickname ?? null,
    profileImageUrl: dbUser.profile_image_url ?? null,
    deactivatedAt: dbUser.deactivated_at ?? null,
    withdrawalAt: dbUser.withdrawal_at ?? null,
    lastLoginAt: dbUser.last_login_at ?? null,
    passwordLastChangedAt: dbUser.password_last_changed_at ?? null,
    providerType: dbUser.provider_type ?? null,
    providerId: dbUser.provider_id ?? null,
    loginType: dbUser.login_type ?? null,
    planType: dbUser.plan_type,
    userRole: dbUser.user_role,
    accountStatus: dbUser.account_status,
  };
}

export function normalizeSnsUser(providerType: ProviderType, raw: any) {
  if (providerType === ProviderType.KAKAO) {
    return {
      email: raw.kakao_account.email,
      username: raw.properties.nickname,
      nickname: raw.properties.nickname,
      profileImageUrl: raw.properties.profile_image,
      providerType: ProviderType.KAKAO,
      providerId: String(raw.id),
    };
  }

  if (providerType === ProviderType.NAVER) {
    return {
      email: raw.email,
      username: raw.name,
      nickname: raw.nickname,
      profileImageUrl: raw.profile_image,
      providerType: ProviderType.NAVER,
      providerId: raw.id,
    };
  }

  throw new Error(`Unsupported provider: ${providerType}`);
}