import { supabase } from '@lib/shared';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { applyEqConditions, buildSelectFields, FetchMode } from '@lib/server/db/utils/queryBuilder';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * const query = new SupaQuery('users')
 *   .eqs({ id: '1234', email: 'jwon@example.com' })
 *   .fields(['id', 'nickname'])
 *   .joins('profile(nickname), posts(id)')
 *   .fetch(FetchMode.LIST);
 *
 * const user = await new SupaQuery<UserDTO>('users')
 *   .eqs({ email: 'jwon@example.com' })
 *   .fields(['id', 'nickname', 'account_status'])
 *   .fetch(FetchMode.MAYBE_SINGLE);
 */
export class SupaQuery<T> {
  private conditions: Partial<Record<keyof T, any>> = {};
  private selectedFields: string[] = [];
  private joinString?: string;
  private table: string;

  constructor(table: string) {
    this.table = table;
  }

  eqs(conditions: Partial<Record<keyof T, any>>) {
    this.conditions = { ...this.conditions, ...conditions };
    return this;
  }

  fields(fields: string[]) {
    this.selectedFields = fields;
    return this;
  }

  joins(join: string) {
    this.joinString = join;
    return this;
  }

  async fetch(mode: FetchMode = FetchMode.LIST): Promise<any> {
    const base = supabase.from(this.table);
    const filtered = applyEqConditions<T>(base, this.conditions);

    const baseFields = this.selectedFields.length > 0 ? buildSelectFields(this.selectedFields) : '*';
    const selectExpr = [baseFields, this.joinString].filter(Boolean).join(', ');
    const query = filtered.select(selectExpr);

    if (mode === FetchMode.SINGLE) return query.single() as PostgrestSingleResponse<any>;
    if (mode === FetchMode.MAYBE_SINGLE) return query.maybeSingle() as PostgrestSingleResponse<any | null>;

    return query;
  }
}