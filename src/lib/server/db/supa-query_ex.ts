import { SupaQuery, FetchMode } from '@lib/server/db';

enum AccountStatus {
  ACTIVE = 'active',      // 활성 상태
}

// 예시 1: 2024년 이후에 가입하고, 닉네임에 'pro'가 포함된 활성(ACTIVE) 사용자를
// 최신 가입일 순으로 10명 조회
const { data: proUsers, error } = await new SupaQuery<UserDTO>('users')
  .eq('account_status', AccountStatus.ACTIVE)
  .gte('created_at', '2024-01-01T00:00:00Z')
  .like('nickname', '%pro%')
  .orderBy('created_at', { ascending: false })
  .limit(10)
  .fetch(); // 기본값은 FetchMode.LIST

// 예시 2: 특정 ID 목록에 포함된 사용자들의 이메일과 닉네임만 조회
const userIds = ['uuid-1', 'uuid-2', 'uuid-3'];
const { data: specificUsers } = await new SupaQuery<UserDTO>('users')
  .in('id', userIds)
  .fields(['email', 'nickname'])
  .fetch();

// 사용자 DTO (예시)
interface UserDTO extends Record<string, unknown> {
  id: string;
  email: string;
  nickname?: string;
  password?: string; // 실제로는 해시된 비밀번호
  created_at: string;
}

// 1. 데이터 삽입 (INSERT)
async function createUser() {
  const { data, error } = await new SupaQuery<UserDTO>('users').insert({
    id: 'user-id-123',
    email: 'test@example.com',
    nickname: 'TestUser',
    password: 'hashed_password_here',
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error inserting user:', error);
  } else {
    console.log('User created:', data);
  }
}

// 2. 데이터 조회 (SELECT) - 기존과 동일
async function getUser() {
  const { data, error } = await new SupaQuery<UserDTO>('users')
    .eq('email', 'test@example.com')
    .fetch(FetchMode.SINGLE);

  if (error) {
    console.error('Error fetching user:', error);
  } else {
    console.log('Fetched user:', data);
  }
}

// 3. 데이터 업데이트 (UPDATE)
async function updateUser(userId: string) {
  const { data, error } = await new SupaQuery<UserDTO>('users').update(
    { nickname: 'UpdatedTestUser' },
    { id: userId }
  );

  if (error) {
    console.error('Error updating user:', error);
  } else {
    console.log('User updated:', data);
  }
}

// 4. 데이터 삭제 (DELETE)
async function deleteUser(userId: string) {
  const { data, error } = await new SupaQuery<UserDTO>('users').delete({ id: userId });

  if (error) {
    console.error('Error deleting user:', error);
  } else {
    console.log('User deleted:', data);
  }
}

// 사용 예시 호출
// createUser();
// getUser();
// updateUser('some-user-id');
// deleteUser('some-other-user-id');

// 예시 1: fetch 시점에 필드와 조인을 동적으로 지정
const { data: post } = await new SupaQuery('posts')
  .eq('id', 'post-id-123')
  .fetch(FetchMode.SINGLE, {
    fields: ['title', 'created_at'],
    joinFields: 'author:users(id, nickname)',
  });

// 예시 2: 기본 필드는 fields()로 설정하고, 특정 fetch에서만 조인 추가
const query = new SupaQuery('users').fields(['id', 'email']);

// A 컴포넌트에서는 기본 필드만 조회
const { data: userBasic } = await query.eq('id', 'user-id-abc').fetch(FetchMode.SINGLE);

// B 컴포넌트에서는 프로필 정보까지 조인해서 조회
const { data: userWithProfile } = await query.eq('id', 'user-id-abc').fetch(FetchMode.SINGLE, {
  joinFields: 'profile(avatar_url)',
});