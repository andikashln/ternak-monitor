import type { UserProfile } from '../types';

const DEMO_PASSWORD = 'Demo123!';

const DEMO_ACCOUNTS: Array<{ email: string; displayName: string; role: UserProfile['role'] }> = [
  { email: 'owner@sapipapi.farm', displayName: 'Owner Sapi Papi', role: 'OWNER' },
  { email: 'manager@sapipapi.farm', displayName: 'Manager Sapi Papi', role: 'MANAGER' },
  { email: 'akuntan@sapipapi.farm', displayName: 'Akuntan Sapi Papi', role: 'ACCOUNTANT' },
  { email: 'mitra@sapipapi.farm', displayName: 'Mitra Sapi Papi', role: 'MITRA' },
];

function sessionFor(account: typeof DEMO_ACCOUNTS[number]): StaticDemoSession {
  return {
    token: `static-demo-${account.role.toLowerCase()}-session`,
    user: { uid: `demo-${account.role.toLowerCase()}-local`, displayName: account.displayName, email: account.email, role: account.role, locationIds: [], status: 'Aktif' },
  };
}

export interface StaticDemoSession {
  token: string;
  user: UserProfile;
}

/**
 * Enables the documented local account only when the static demo has no API.
 * This is intentionally not a general authentication bypass.
 */
export function shouldUseStaticDemoFallback(httpStatus?: number): boolean {
  return httpStatus === undefined || httpStatus === 404 || httpStatus === 405;
}

export function getOneClickDemoSession(): StaticDemoSession {
  return sessionFor(DEMO_ACCOUNTS[0]);
}

export function getStaticDemoSession(email: string, password: string): StaticDemoSession | null {
  const account = DEMO_ACCOUNTS.find(item => item.email === email);
  return account && password === DEMO_PASSWORD ? sessionFor(account) : null;
}

export function getStaticDemoSessionFromToken(token: string): StaticDemoSession | null {
  const account = DEMO_ACCOUNTS.find(item => sessionFor(item).token === token);
  return account ? sessionFor(account) : null;
}
