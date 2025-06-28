import type { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { supabase } from '@/services/shared/supabase';
import { FetchMode } from '@lib/server/db/utils/supa-query'; // PostgrestFilterBuilder 임포트 확인

/**
 * 조건 객체를 기반으로 `.eq()`를 동적으로 체이닝합니다.
 * - undefined 또는 null 값은 무시됩니다.
 */
export function applyEqConditions<
    Builder extends PostgrestFilterBuilder<any, any, any>
>(
    builder: Builder,
    conditions: Partial<Record<string, any>> // keyof any 대신 string 사용
): Builder {
  let query = builder;
  for (const key in conditions) {
    if (Object.prototype.hasOwnProperty.call(conditions, key)) {
      // .eq()는 빌더 자신을 반환하므로 타입 유지를 위해 캐스팅이 필요할 수 있음
      query = query.eq(key, conditions[key]) as Builder;
    }
  }
  return query;
}

/**
 * 필드 배열을 컴마로 조합하여 select 문자열로 변환합니다.
 * - 예: ['id', 'email'] → 'id, email'
 */
export function buildSelectFields(fields?: string[]): string {
  return fields?.length ? fields.join(', ') : '*';
}

// --- 💡 buildSelectQuery 함수 시그니처 리팩토링 ---

// 선택적 파라미터를 위한 인터페이스 정의
interface SelectOptions {
  fields?: string[];
  joinFields?: string;
}

/**
 * 단일 행(row)을 조회. 행이 없으면 에러 발생.
 */
export async function buildSelectQuery<T>(
    table: string,
    conditions: Partial<Record<keyof T, any>>,
    mode: FetchMode.SINGLE,
    options?: SelectOptions
): Promise<PostgrestSingleResponse<T>>;

/**
 * 단일 행(row)을 조회. 행이 없으면 null 반환.
 */
export async function buildSelectQuery<T>(
    table: string,
    conditions: Partial<Record<keyof T, any>>,
    mode: FetchMode.MAYBE_SINGLE,
    options?: SelectOptions
): Promise<PostgrestSingleResponse<T | null>>;

/**
 * 여러 행(row)을 배열로 조회. (기본값)
 */
export async function buildSelectQuery<T>(
    table: string,
    conditions: Partial<Record<keyof T, any>>,
    mode?: FetchMode.LIST,
    options?: SelectOptions
): Promise<PostgrestSingleResponse<T[]>>;

/**
 * Supabase에서 SELECT 쿼리를 빌드하고 실행합니다. (구현부)
 */
export async function buildSelectQuery<T extends Record<string, unknown>>(
    table: string,
    conditions: Partial<Record<keyof T, any>>,
    mode: FetchMode = FetchMode.LIST,
    options: SelectOptions = {} // options 객체로 변경하고 기본값 할당
): Promise<PostgrestSingleResponse<T | (T | null) | T[]>> {
  // options 객체에서 fields와 joinFields를 추출
  const { fields, joinFields } = options;

  const baseQuery = supabase.from(table);

  const selectExpr = [buildSelectFields(fields), joinFields].filter(Boolean).join(', ');

  // 💡 타입 단언을 추가하여 TypeScript가 빌더의 타입을 정확히 추론하도록 합니다.
  // Row 타입을 T로, 기본 Result 타입을 T[]로 명시합니다.
  const filterBuilder = baseQuery.select(selectExpr) as PostgrestFilterBuilder<any, T, T[]>;

  const queryWithConditions = applyEqConditions(filterBuilder, conditions as Partial<Record<string, any>>);

  if (mode === FetchMode.SINGLE) {
    return queryWithConditions.single();
  }

  if (mode === FetchMode.MAYBE_SINGLE) {
    return queryWithConditions.maybeSingle();
  }

  return queryWithConditions;
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
  // applyEqConditions는 PostgrestTransformBuilder에도 적용 가능 (PostgrestFilterBuilder를 상속)
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
  // applyEqConditions는 PostgrestTransformBuilder에도 적용 가능 (PostgrestFilterBuilder를 상속)
  const query = applyEqConditions<any>(base, conditions);
  return minimal ? query : query.select();
}