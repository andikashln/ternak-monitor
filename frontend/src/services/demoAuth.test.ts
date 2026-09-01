import { describe, expect, it } from 'vitest';
import { getOneClickDemoSession, getStaticDemoSession, shouldUseStaticDemoFallback } from './demoAuth';

describe('static demo authentication', () => {
  it.each([
    ['owner@sapipapi.farm', 'OWNER'],
    ['manager@sapipapi.farm', 'MANAGER'],
    ['akuntan@sapipapi.farm', 'ACCOUNTANT'],
    ['mitra@sapipapi.farm', 'MITRA'],
  ] as const)('returns the documented %s session', (email, role) => {
    expect(getStaticDemoSession(email, 'Demo123!')).toMatchObject({
      token: `static-demo-${role.toLowerCase()}-session`,
      user: { email, role, status: 'Aktif', uid: `demo-${role.toLowerCase()}-local` },
    });
  });

  it('returns a one-click owner session without exposing credentials to the UI', () => {
    expect(getOneClickDemoSession()).toMatchObject({ user: { role: 'OWNER', email: 'owner@sapipapi.farm' } });
  });

  it('rejects invalid credentials instead of bypassing authentication', () => {
    expect(getStaticDemoSession('owner@sapipapi.farm', 'salah')).toBeNull();
    expect(getStaticDemoSession('unknown@sapipapi.farm', 'Demo123!')).toBeNull();
  });

  it('permits fallback only when a static deployment cannot serve API requests', () => {
    expect(shouldUseStaticDemoFallback(undefined)).toBe(true);
    expect(shouldUseStaticDemoFallback(404)).toBe(true);
    expect(shouldUseStaticDemoFallback(405)).toBe(true);
    expect(shouldUseStaticDemoFallback(401)).toBe(false);
    expect(shouldUseStaticDemoFallback(500)).toBe(false);
  });
});
