export interface RegisterRequestBody {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

// 이메일 및 비밀번호 관련 상태와 setter를 포함하는 공통 필드
export interface AuthFields {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
}

// 선택적인 프로필 필드들 (예: 바이오, 아바타 등)
export interface OptionalProfileFields {
  bio?: string;
  setBio?: (bio: string) => void;
  avatarUrl?: string;
  setAvatarUrl?: (url: string) => void;
}

// 로그인 관련 훅의 반환 타입
export interface UseLoginResult extends AuthFields {
  error: string | null;
  loading: boolean;
  authLoading: boolean;
  isLoggedIn: boolean;
  handleLogin: () => Promise<void>;
  handleLogout: (destinationUrl?: string | null) => void;
}

// 회원가입 관련 훅의 반환 타입
export interface UseRegisterResult extends AuthFields {
  username: string;
  setUsername: (username: string) => void;
  error: string | null;
  loading: boolean;
  handleRegister: () => Promise<void>;
}

// 프로필 업데이트 관련 훅의 반환 타입
export interface UseUpdateProfileResult extends Partial<AuthFields>, Partial<OptionalProfileFields> {
  loading: boolean;
  error: string | null;
  handleUpdateProfile: () => Promise<void>;
}