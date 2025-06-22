// 이메일 및 비밀번호 관련 상태와 setter를 포함하는 공통 필드
import { ProviderType } from '@enums';

// 로그인 관련 훅의 반환 타입
export interface UseLoginResult {
  error: string | null;
  loading: boolean;
  authLoading: boolean;
  isLoggedIn: boolean;
  setLoading: (loading: boolean) => void;
  handleNativeLogin: (email: string, password: string) => void;
  handleSocialLogin: (providerType: ProviderType, providerId: string) => void;
  handleLogout: (destinationUrl?: string | null) => void;
}

// 회원가입 관련 훅의 반환 타입
export interface UseSignUpResult {
  error: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;

  handleNativeSignUp: (params: {
    email: string;
    password: string;
    username?: string;
    nickname?: string | null;
    profileImageUrl?: string | null;
  }) => Promise<any>;

  handleSocialSignUp: (params: {
    email: any;
    username: any;
    nickname: any;
    profileImageUrl: any;
    providerType: ProviderType;
    providerId: any;
  }) => Promise<any>;

  handleSocialSignUpWithNativeLogin: (param: {
    providerType: ProviderType;
    code: string;
    state?: string;
  }) => Promise<any>;
}

// 선택적인 프로필 필드들 (예: 바이오, 아바타 등)
export interface OptionalProfileFields {
  bio?: string;
  setBio?: (bio: string) => void;
  avatarUrl?: string;
  setAvatarUrl?: (url: string) => void;
}

// 프로필 업데이트 관련 훅의 반환 타입
export interface UseUpdateProfileResult extends Partial<OptionalProfileFields> {
  loading: boolean;
  error: string | null;
  handleUpdateProfile: () => Promise<void>;
}