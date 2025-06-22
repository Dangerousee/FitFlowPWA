import { ProviderType } from '@enums';

export function normalizeSnsUser(provider: ProviderType, raw: any) {
  if (provider === ProviderType.KAKAO) {
    return {
      email: raw.kakao_account.email,
      username: raw.properties.nickname,
      nickname: raw.properties.nickname,
      profileImageUrl: raw.properties.profile_image,
      providerId: String(raw.id),
    };
  }

  if (provider === ProviderType.NAVER) {
    return {
      email: raw.email,
      username: raw.name,
      nickname: raw.nickname,
      profileImageUrl: raw.profile_image,
      providerId: raw.id,
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}