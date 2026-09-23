import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase client. When env vars are missing (local dev / first deploy),
 * this returns null and the app keeps working with the static demo fallback,
 * so a partial deploy never bricks the login screen.
 */
let client: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = (): SupabaseClient | null => client;
export const hasSupabase = (): boolean => client !== null;

/** Map a Supabase user + app_metadata to the app's UserProfile shape. */
export function profileFromSupabaseUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): UserProfile {
  const meta = { ...(user.user_metadata ?? {}), ...(user.app_metadata ?? {}) };
  const rawRole = String(meta.role ?? 'MITRA').toUpperCase();
  const validRoles: UserRole[] = ['OWNER', 'MANAGER', 'ACCOUNTANT', 'MITRA', 'ADMIN', 'USER', 'DEVELOPER'];
  const role = (validRoles.includes(rawRole as UserRole) ? rawRole : 'MITRA') as UserRole;
  return {
    uid: user.id,
    email: user.email ?? '',
    displayName: String(meta.display_name ?? user.email ?? 'Pengguna'),
    role,
    locationIds: Array.isArray(meta.location_ids) ? (meta.location_ids as string[]) : [],
    status: 'Aktif',
  };
}

export type AuthResult =
  | { ok: true; token: string; user: UserProfile }
  | { ok: false; error: string };

export function isAuthFailure(r: AuthResult): r is { ok: false; error: string } {
  return r.ok === false;
}

/** Sign in with email + password. Returns null when Supabase is not configured. */
export async function supabaseSignIn(email: string, password: string): Promise<AuthResult | null> {
  if (!client) return null;
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }
  const session = data.session;
  const user = data.user;
  if (!session || !user) return { ok: false, error: 'Sesi tidak valid.' };
  return { ok: true, token: session.access_token, user: profileFromSupabaseUser(user) };
}

/** Restore the current Supabase session from a stored token. Returns null if unconfigured or no session. */
export async function supabaseRestore(): Promise<AuthResult | null> {
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.user) return null;
  return {
    ok: true,
    token: data.session.access_token,
    user: profileFromSupabaseUser(data.session.user),
  };
}

/** Sign out. */
export async function supabaseSignOut(): Promise<void> {
  if (client) await client.auth.signOut();
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email atau password salah.';
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Periksa kotak masuk Anda.';
  if (m.includes('rate limit')) return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
  return message;
}

