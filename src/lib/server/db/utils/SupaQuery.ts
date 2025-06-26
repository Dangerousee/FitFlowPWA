/** ======================
 *  모듈로 만든게 장점이 있는가?에 대한 대답으로 공통 로직 추가나 캐시 작업 같은 공통 작업에 이점이 있다.
 *  그러나 완벽한 자유는 뺏겼고, 사용성도 supabase 라이브러리와 별반 다르지 않다.
 * =======================
 */
import { supabase } from '@lib/shared';
import { PostgrestFilterBuilder, PostgrestQueryBuilder, PostgrestSingleResponse } from '@supabase/postgrest-js';
import { buildSelectFields } from '@lib/server/db/utils/queryBuilder';

// 쿼리 작업의 타입을 정의. 확장성을 위해 문자열 리터럴 유니언 사용
type FilterMethod = 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'ilike' | 'in';
type ModifierMethod = 'orderBy' | 'limit' | 'range';

// 각 쿼리 단계를 저장하기 위한 타입 (SELECT 쿼리용)
type QueryStep = {
  method: FilterMethod | ModifierMethod;
  args: any[];
};

export enum FetchMode {
  SINGLE = 'SINGLE',
  MAYBE_SINGLE = 'MAYBE_SINGLE',
  LIST = 'LIST',
}

interface SelectOptions {
  fields?: string[];
  joinFields?: string;
}

/**
 * Supabase 쿼리를 더 쉽게 작성하기 위한 확장 가능한 빌더 클래스.
 * SELECT, INSERT, UPDATE, DELETE 작업을 모두 지원합니다.
 *
 * @example
 * // SELECT 예시
 * const { data: user } = await new SupaQuery<UserDTO>('users')
 *   .eq('email', 'jwon@example.com')
 *   .fetch(FetchMode.SINGLE);
 *
 * @example
 * // INSERT 예시
 * const { data: newUser } = await new SupaQuery<UserDTO>('users').insert({
 *   email: 'new@example.com',
 *   password: 'hashed_password',
 * });
 *
 * @example
 * // UPDATE 예시
 * const { data: updatedUser } = await new SupaQuery<UserDTO>('users').update(
 *   { nickname: 'Updated Nick' },
 *   { id: 'user-id-123' }
 * );
 *
 * @example
 * // DELETE 예시
 * const { data: deletedUser } = await new SupaQuery<UserDTO>('users').delete({
 *   id: 'user-id-456'
 * });
 */
export class SupaQuery<T extends Record<string, unknown>> {
  private selectedFields: string[] = [];
  private joinString?: string;
  private base: PostgrestQueryBuilder<any, any>;

  // SELECT 쿼리 빌딩을 위한 쿼리 단계 저장
  private querySteps: QueryStep[] = [];

  constructor(table: string) {
    this.base = supabase.from(table);
  }

  // --- SELECT 쿼리 빌딩 메소드 ---

  // 필터링 메소드
  eq(column: string, value: any) {
    this.querySteps.push({ method: 'eq', args: [column, value] });
    return this;
  }

  gt(column: string, value: any) {
    this.querySteps.push({ method: 'gt', args: [column, value] });
    return this;
  }

  lt(column: string, value: any) {
    this.querySteps.push({ method: 'lt', args: [column, value] });
    return this;
  }

  gte(column: string, value: any) {
    this.querySteps.push({ method: 'gte', args: [column, value] });
    return this;
  }

  lte(column: string, value: any) {
    this.querySteps.push({ method: 'lte', args: [column, value] });
    return this;
  }

  like(column: string, pattern: string) {
    this.querySteps.push({ method: 'like', args: [column, pattern] });
    return this;
  }

  in(column: string, values: any[]) {
    this.querySteps.push({ method: 'in', args: [column, values] });
    return this;
  }

  // 기존 eqs는 여러 eq 조건을 한 번에 추가하는 편의 메소드로 유지
  eqs(conditions: Partial<Record<string, any>>) {
    for (const key in conditions) {
      if (Object.prototype.hasOwnProperty.call(conditions, key)) {
        this.eq(key, conditions[key]);
      }
    }
    return this;
  }

  // 결과 수정자(Modifier) 메소드
  orderBy(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.querySteps.push({ method: 'orderBy', args: [column, options] });
    return this;
  }

  limit(count: number) {
    this.querySteps.push({ method: 'limit', args: [count] });
    return this;
  }

  // 필드 및 조인 설정 메소드 (기존과 동일)
  fields(fields: string[]) {
    this.selectedFields = fields;
    return this;
  }

  joins(join: string) {
    this.joinString = join;
    return this;
  }

  // --- SELECT 쿼리 실행 메소드 (함수 오버로딩) ---
  fetch(mode: FetchMode.SINGLE, options?: SelectOptions): Promise<PostgrestSingleResponse<T>>;
  fetch(mode: FetchMode.MAYBE_SINGLE, options?: SelectOptions): Promise<PostgrestSingleResponse<T | null>>;
  fetch(mode: FetchMode.LIST, options?: SelectOptions): Promise<PostgrestSingleResponse<T[]>>;
  fetch(options?: SelectOptions): Promise<PostgrestSingleResponse<T[]>>; // mode 생략 시

  async fetch(
    modeOrOptions?: FetchMode | SelectOptions,
    optionsArg?: SelectOptions
  ): Promise<PostgrestSingleResponse<T | (T | null) | T[]>> {
    let mode: FetchMode = FetchMode.LIST;
    let options: SelectOptions = {};

    // 파라미터 처리: fetch(), fetch(options), fetch(mode), fetch(mode, options)
    if (typeof modeOrOptions === 'string') {
      mode = modeOrOptions;
      options = optionsArg ?? {};
    } else if (typeof modeOrOptions === 'object' && modeOrOptions !== null) {
      options = modeOrOptions;
    }

    // fetch에 전달된 options를 우선 사용하고, 없으면 클래스 속성을 사용합니다.
    const fieldsToUse = options.fields ?? this.selectedFields;
    const joinToUse = options.joinFields ?? this.joinString;

    const baseFields = fieldsToUse.length > 0 ? buildSelectFields(fieldsToUse) : '*';
    const selectExpr = [baseFields, joinToUse].filter(Boolean).join(', ');

    let queryBuilder = this.base.select(selectExpr) as PostgrestFilterBuilder<any, T, T[]>;

    // 저장된 모든 쿼리 단계를 순서대로 적용
    for (const step of this.querySteps) {
      queryBuilder = (queryBuilder as any)[step.method](...step.args);
    }

    // 최종적으로 mode에 따라 결과 반환
    if (mode === FetchMode.SINGLE) {
      return queryBuilder.single<T>();
    }
    if (mode === FetchMode.MAYBE_SINGLE) {
      return queryBuilder.maybeSingle<T>();
    }

    return queryBuilder;
  }

  // --- 💡 데이터 조작(INSERT, UPDATE, DELETE) 메소드 ---

  /**
   * 데이터를 삽입합니다.
   * @param payload 삽입할 데이터 (단일 객체 또는 객체 배열)
   * @param minimal 결과 반환을 최소화할지 여부 (true면 select() 호출 안 함)
   * @returns 삽입된 데이터 또는 null (minimal: true 시 빈 배열)
   */
  async insert(payload: T | T[], minimal: boolean = false): Promise<PostgrestSingleResponse<T[]> | PostgrestSingleResponse<null>> {
    const baseInsert = this.base.insert(payload);
    return minimal ? baseInsert : baseInsert.select();
  }

  /**
   * 데이터를 업데이트합니다.
   * @param payload 업데이트할 데이터 (부분 객체)
   * @param conditions 업데이트할 행을 식별하는 조건
   * @param minimal 결과 반환을 최소화할지 여부 (true면 select() 호출 안 함)
   * @returns 업데이트된 데이터 또는 null (minimal: true 시 빈 배열)
   */
  async update(
    payload: Partial<T>,
    conditions: Partial<Record<string, any>>,
    minimal: boolean = false
  ): Promise<PostgrestSingleResponse<T[] | null> | PostgrestSingleResponse<null>> {
    const baseUpdate = this.base.update(payload);
    // PostgrestTransformBuilder는 PostgrestFilterBuilder를 상속하므로 applyEqConditions 사용 가능
    const queryWithConditions = this.applyConditionsToBuilder(baseUpdate, conditions);
    return minimal ? queryWithConditions : queryWithConditions.select();
  }

  /**
   * 데이터를 삭제합니다.
   * @param conditions 삭제할 행을 식별하는 조건
   * @param minimal 결과 반환을 최소화할지 여부 (true면 select() 호출 안 함)
   * @returns 삭제된 데이터 또는 null (minimal: true 시 빈 배열)
   */
  async delete(
    conditions: Partial<Record<string, any>>,
    minimal: boolean = false
  ): Promise<PostgrestSingleResponse<T[]> | PostgrestSingleResponse<null>> {
    const baseDelete = this.base.delete();
    // PostgrestTransformBuilder는 PostgrestFilterBuilder를 상속하므로 applyEqConditions 사용 가능
    const queryWithConditions = this.applyConditionsToBuilder(baseDelete, conditions);
    return minimal ? queryWithConditions : queryWithConditions.select();
  }

  // 내부 헬퍼 함수: 조건을 빌더에 적용
  private applyConditionsToBuilder<Builder extends PostgrestFilterBuilder<any, any, any>>(
    builder: Builder,
    conditions: Partial<Record<string, any>>
  ): Builder {
    let query = builder;
    for (const key in conditions) {
      if (Object.prototype.hasOwnProperty.call(conditions, key)) {
        query = query.eq(key, conditions[key]) as Builder;
      }
    }
    return query;
  }
}