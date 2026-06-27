/**
 * api-client.ts
 * Cliente HTTP que reemplaza @supabase/supabase-js en el catálogo.
 * Se comunica directamente con PostgreSQL via el api-service interno.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const PG_URL  = process.env.NEXT_PUBLIC_API_URL ?? ''; // mismo origen para queries

// ─── Token storage ────────────────────────────────────────────
// En browser usa localStorage, en SSR no aplica (el catálogo es client-side)
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem('auth_token', token);
}

export function clearToken(): void {
  if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
}

// ─── Headers base ─────────────────────────────────────────────
function headers(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ─── Fetch con manejo de errores ─────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers(), ...(options.headers as Record<string, string> ?? {}) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.error ?? `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message ?? 'Error de red' };
  }
}

// ─── Auth ─────────────────────────────────────────────────────
export const auth = {
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await apiFetch<{ token: string; user: AdminUser }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
    if (data?.token) setToken(data.token);
    return { data, error };
  },

  async getUser(): Promise<{ data: { user: AdminUser } | null; error: string | null }> {
    return apiFetch<{ user: AdminUser }>('/auth/me');
  },

  async signOut() {
    clearToken();
    return { error: null };
  },

  async createUser(email: string, password: string) {
    return apiFetch<{ user: { id: string; email: string } }>(
      '/auth/create-user',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
  },

  async deleteUser(userId: string) {
    return apiFetch<{ success: boolean }>(
      `/auth/delete-user/${userId}`,
      { method: 'DELETE' },
    );
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiFetch<{ success: boolean }>(
      '/auth/change-password',
      { method: 'PUT', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) },
    );
  },

  onAuthStateChange(callback: (event: string, user: AdminUser | null) => void) {
    // Simula el comportamiento de Supabase onAuthStateChange
    // Se llama una vez al montar con el estado actual
    const token = getToken();
    if (token) {
      apiFetch<{ user: AdminUser }>('/auth/me').then(({ data }) => {
        callback('SIGNED_IN', data?.user ?? null);
      });
    } else {
      callback('SIGNED_OUT', null);
    }
    // Devuelve objeto compatible con Supabase para que el código existente no rompa
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  },
};

// ─── Tipos ────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  nombre: string | null;
  es_super_admin: boolean;
}

// ─── Query builder mínimo compatible con la API de Supabase ──
// Permite migrar el código existente con cambios mínimos.
// Solo implementa los métodos que realmente se usan en el catálogo.

interface QueryBuilder<T> {
  select(cols?: string): QueryBuilder<T>;
  insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T>;
  update(data: Partial<T>): QueryBuilder<T>;
  upsert(data: Partial<T> | Partial<T>[], opts?: { onConflict?: string }): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  eq(col: string, val: unknown): QueryBuilder<T>;
  neq(col: string, val: unknown): QueryBuilder<T>;
  in(col: string, vals: unknown[]): QueryBuilder<T>;
  not(col: string, op: string, val: unknown): QueryBuilder<T>;
  gte(col: string, val: unknown): QueryBuilder<T>;
  lte(col: string, val: unknown): QueryBuilder<T>;
  order(col: string, opts?: { ascending?: boolean }): QueryBuilder<T>;
  limit(n: number): QueryBuilder<T>;
  offset(n: number): QueryBuilder<T>;
  range(from: number, to: number): QueryBuilder<T>;
  single(): Promise<{ data: T | null; error: string | null; count?: number }>;
  then(resolve: (result: { data: T[] | null; error: string | null; count?: number | null }) => void): void;
}

function buildQuery<T>(table: string): QueryBuilder<T> {
  const state: {
    operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete';
    columns: string;
    filters: Array<{ col: string; op: string; val: unknown }>;
    orderBy: Array<{ col: string; ascending: boolean }>;
    limitN: number | null;
    offsetN: number | null;
    body: Partial<T> | Partial<T>[] | null;
    onConflict: string | null;
    headOnly: boolean;
    count: boolean;
  } = {
    operation: 'select',
    columns: '*',
    filters: [],
    orderBy: [],
    limitN: null,
    offsetN: null,
    body: null,
    onConflict: null,
    headOnly: false,
    count: false,
  };

  const execute = async (): Promise<{ data: T[] | null; error: string | null; count?: number | null }> => {
    const payload = {
      table,
      operation: state.operation,
      columns: state.columns,
      filters: state.filters,
      orderBy: state.orderBy,
      limit: state.limitN,
      offset: state.offsetN,
      body: state.body,
      onConflict: state.onConflict,
      headOnly: state.headOnly,
      count: state.count,
    };

    const { data, error } = await apiFetch<{ rows: T[]; count?: number }>(
      '/db/query',
      { method: 'POST', body: JSON.stringify(payload) },
    );

    if (error) return { data: null, error, count: null };
    return { data: data?.rows ?? null, error: null, count: data?.count ?? null };
  };

  const builder: QueryBuilder<T> = {
    select(cols = '*') {
      // Detectar si hay { count: 'exact', head: true } en el argumento
      state.columns = cols;
      return builder;
    },
    insert(data) { state.operation = 'insert'; state.body = data; return builder; },
    update(data) { state.operation = 'update'; state.body = data; return builder; },
    upsert(data, opts) {
      state.operation = 'upsert';
      state.body = data;
      state.onConflict = opts?.onConflict ?? null;
      return builder;
    },
    delete() { state.operation = 'delete'; return builder; },
    eq(col, val) { state.filters.push({ col, op: 'eq', val }); return builder; },
    neq(col, val) { state.filters.push({ col, op: 'neq', val }); return builder; },
    in(col, vals) { state.filters.push({ col, op: 'in', val: vals }); return builder; },
    not(col, op, val) { state.filters.push({ col, op: `not.${op}`, val }); return builder; },
    gte(col, val) { state.filters.push({ col, op: 'gte', val }); return builder; },
    lte(col, val) { state.filters.push({ col, op: 'lte', val }); return builder; },
    order(col, opts) {
      state.orderBy.push({ col, ascending: opts?.ascending ?? true });
      return builder;
    },
    limit(n) { state.limitN = n; return builder; },
    offset(n) { state.offsetN = n; return builder; },
    range(from, to) { state.offsetN = from; state.limitN = to - from + 1; return builder; },
    async single() {
      state.limitN = 1;
      const result = await execute();
      return { data: result.data?.[0] ?? null, error: result.error };
    },
    then(resolve) {
      execute().then(resolve);
    },
  };

  return builder;
}

// ─── Cliente principal (reemplaza supabase.from()) ────────────
export const db = {
  from<T = any>(table: string) {
    return buildQuery<T>(table);
  },
};
