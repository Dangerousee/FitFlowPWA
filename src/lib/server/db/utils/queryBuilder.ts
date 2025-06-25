import type { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@lib';

export const FetchMode = {
  SINGLE: 'single',
  MAYBE_SINGLE: 'maybeSingle',
  LIST: 'list',
} as const;

export type FetchMode = (typeof FetchMode)[keyof typeof FetchMode];
/**
 * 사용 예시:
 *
 * import { supabase } from '@lib/shared';
 * import { applyEqConditions, buildSelectFields } from './queryBuilder';
 *
 * export async function findUserByEmail(email: string, fields?: string[]) {
 *   const base = supabase.from('users');
 *   const query = applyEqConditions(base, { email });
 *   const select = buildSelectFields(fields);
 *   return query.select(select).maybeSingle();
 * }
 *
 * 호출부:
 * await findUserByEmail('user@example.com', ['id', 'nickname', 'account_status']);
 */

/**
 * 조건 객체를 기반으로 `.eq()`를 동적으로 체이닝합니다.
 * - undefined 또는 null 값은 무시됩니다.
 */
export function applyEqConditions<T>(
  query: any,
  conditions: Partial<Record<keyof T, any>>
) {
  let q = query;
  for (const [key, value] of Object.entries(conditions)) {
    if (value !== undefined && value !== null) {
      q = q.eq(key as string, value);
    }
  }
  return q;
}

/**
 * 필드 배열을 컴마로 조합하여 select 문자열로 변환합니다.
 * - 예: ['id', 'email'] → 'id, email'
 */
export function buildSelectFields(fields?: string[]): string {
  return fields?.length ? fields.join(', ') : '*';
}

/**
 * 📌 전체 리스트 예시:
 * const { data, error } = await buildSelectQuery<UserDTO>(
 *   'users',
 *   {}, // 조건 없음 = 전체 조회
 *   ['id', 'email', 'nickname']
 * );
 *
 * 📌 단건 조회 예시 (id 기준):
 * const { data, error } = await buildSelectQuery<UserDTO>(
 *   'users',
 *   { id: 'user_1234' },
 *   ['id', 'email', 'nickname'],
 *   undefined,
 *   FetchMode.SINGLE
 * );
 *
 * 📌 조인 예시 (profile 및 posts 테이블):
 * const { data, error } = await buildSelectQuery<UserDTO>(
 *   'users',
 *   { id: 'user_1234' },
 *   ['id', 'email'],
 *   'profile(nickname), posts(id, title)',
 *   FetchMode.MAYBE_SINGLE
 * );
 */
export async function buildSelectQuery<T>(
  table: string,
  conditions: Partial<Record<keyof T, any>>,
  fields?: string[],
  joinFields?: string,
  mode: FetchMode = FetchMode.LIST
) {
  const base = supabase.from(table);
  const filtered = applyEqConditions<T>(base, conditions);
  const selectExpr = [buildSelectFields(fields), joinFields].filter(Boolean).join(', ');
  const query = filtered.select(selectExpr);

  if (mode === FetchMode.SINGLE) {
    return query.single() as PostgrestSingleResponse<T>;
  }

  if (mode === FetchMode.MAYBE_SINGLE) {
    return query.maybeSingle() as PostgrestSingleResponse<T | null>;
  }

  return query;
}

/**
 * 📌 INSERT 단건 예시:
 * await buildInsertQuery<RefreshSession>('posts', {
 *   title: 'New Post',
 *   content: 'Hello world!',
 * });
 *
 * 📌 INSERT 여러건 예시:
 * await buildInsertQuery('posts', [
 *   { title: 'Post 1', content: 'A' },
 *   { title: 'Post 2', content: 'B' },
 * ]);
 *
 * 📌 INSERT 예시 (다건 & 빠르게 처리):
 * await buildInsertQuery('posts', [ ... ], true);
 *
 * payload에 T를 붙이면 카멜케이스인 DTO와 맞지않는다. 전부 만들어주는거보다는 any로하고
 * buildInsertQuery<RefreshSession>처럼 타입을 붙여 명시적인 추론이 가능하도록 한다.
 */
export function buildInsertQuery<T>(
  table: string,
  payload: any | any[],
  minimal: boolean = false
) {
  const base = supabase.from(table).insert(payload);
  return minimal ? base : base.select();
}


/**
 * 📌 UPSERT 단건 예시:
 * await buildUpsertQuery('user_providers', {
 *   provider_type: 'kakao',
 *   provider_id: 'abc123',
 *   user_id: 'user1',
 * });
 *
 * 📌 UPSERT 여러건 예시:
 * await buildUpsertQuery('user_providers', [
 *   { provider_type: 'kakao', provider_id: 'abc123', user_id: 'user1' },
 *   { provider_type: 'naver', provider_id: 'xyz456', user_id: 'user2' },
 * ]);
 *
 * 📌 UPSERT 예시 (성능 최적화):
 * await buildUpsertQuery('users', [ ... ], true);
 */
export function buildUpsertQuery<T>(
  table: string,
  payload: any | any[],
  minimal: boolean = false
) {
  const base = supabase.from(table).upsert(payload);
  return minimal ? base : base.select();
}


/**
 * 📌 UPDATE 단건 예시:
 * await buildUpdateQuery('users', { nickname: '종원킹' }, { id: userId });
 *
 * 📌 UPDATE 여러건 예시 (같은 조건에 해당하는 유저들 nickname 변경):
 * await buildUpdateQuery('users', { nickname: '게스트종원' }, { role: 'guest' });
 *
 * * 📌 UPDATE 예시 (데이터 반환 X → 성능 ↑):
 *  * await buildUpdateQuery('users', { last_login_at: new Date() }, { id: userId }, true);
 */
export function buildUpdateQuery<T>(
  table: string,
  payload: Partial<any>,
  conditions: Partial<Record<keyof any, any>>,
  minimal: boolean = false
) {
  const base = supabase.from(table).update(payload);
  const query = applyEqConditions<any>(base, conditions);
  return minimal ? query : query.select(); // select 생략 → returning: 'minimal'
}

/**
 * 📌 DELETE 단건 예시:
 * await buildDeleteQuery('comments', { post_id: postId, user_id: userId });
 *
 * 📌 DELETE 예시 (빠르게 여러 건 삭제):
 * await buildDeleteQuery('comments', { user_type: 'guest' }, true);
 */
export function buildDeleteQuery<T>(
  table: string,
  conditions: Partial<Record<keyof any, any>>,
  minimal: boolean = false
) {
  const base = supabase.from(table).delete();
  const query = applyEqConditions<any>(base, conditions);
  return minimal ? query : query.select();
}



