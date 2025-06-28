import type { LoginType, ProviderType } from '@enums';
import type { PublicUserDTO } from '@types';

export interface NativeLoginRequest {
  loginType: LoginType.NATIVE;
  email: string;
  password: string;
}

export interface SocialLoginRequest {
  loginType: LoginType.SOCIAL;
  providerType: ProviderType;
  providerId: string;
}

export interface NativeSignUpRequest {
  loginType: LoginType.NATIVE;
  email: string;
  password: string;
  username: string;
  nickname?: string | null;
  profileImageUrl?: string | null;
}

export interface SocialSignUpRequest {
  loginType: LoginType.SOCIAL;
  providerType: ProviderType;
  providerId: string;
  email?: string;
  username: string;
  nickname?: string | null;
  profileImageUrl?: string | null;
}

export type LoginRequestDTO = NativeLoginRequest | SocialLoginRequest;
export type SignUpRequestDTO = NativeSignUpRequest | SocialSignUpRequest;

export interface AuthResponseDTO {
  user: PublicUserDTO;
  accessToken: string;
}

// 로그인
export type LoginResponseDTO = AuthResponseDTO;

// 회원가입
export type SignUpResponseDTO = AuthResponseDTO;