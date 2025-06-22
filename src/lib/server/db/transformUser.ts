import { UserDTO, PublicUserDTO } from '@types';

export const transformUserToPublic = (user: UserDTO): PublicUserDTO => ({
  id: user.id,
  username: user.username,
  email: user.email,
  nickname: user.nickname,
  profileImageUrl: user.profileImageUrl,
  planType: user.planType,
  userRole: user.userRole,
});