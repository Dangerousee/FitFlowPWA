import { ProviderType } from '@enums';

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