import { supabase } from '@lib/shared';
import { UserDTO } from '@types';
import camelcaseKeys from 'camelcase-keys';

export const getUserByProviderInfo = async ({
  providerType,
  providerId,
}: {
  providerType: string;
  providerId: string;
}): Promise<UserDTO | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('provider_type', providerType)
    .eq('provider_id', providerId)
    .single();

  if (error) {
    console.error('[getUserByProviderInfo]', error);
    return null;
  }

  return camelcaseKeys(data);
};
