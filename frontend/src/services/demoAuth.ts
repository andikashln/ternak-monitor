import type { UserProfile } from '../types';

const DEMO_EMAIL = 'owner@ternak.local';
const DEMO_PASSWORD = 'TernakDemo2026!';

const DEMO_OWNER: UserProfile = {
  uid: 'demo-owner-local',
  displayName: 'Owner Demo Sapi Papi',
  email: DEMO_EMAIL,
  role: 'OWNER',
  locationIds: [],
  status: 'Aktif',
};

export interface StaticDemoSession {
  token: string;
  user: UserProfile;
}

/**
 * Enables the documented local account only when the static demo has no API.
 * This is intentionally not a general authentication bypass.
 */
export function shouldUseStaticDemoFallback(httpStatus?: number): boolean {
  return httpStatus === undefined || httpStatus === 405;
}

export function getStaticDemoSession(email: string, password: string): StaticDemoSession | null {
  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) return null;

  return {
    token: 'static-demo-owner-session',
    user: DEMO_OWNER,
  };
}
