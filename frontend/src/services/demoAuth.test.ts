import { describe, expect, it } from 'vitest';
import { getOneClickDemoSession, getStaticDemoSession, getStaticDemoSessionFromToken, shouldUseStaticDemoFallback } from './demoAuth';

describe('static demo authentication', () => {
  it.each([
    ['owner@dutaagronusantara.farm', 'OWNER'],
    ['manager@dutaagronusantara.farm', 'MANAGER'],
    ['akuntan@dutaagronusantara.farm', 'ACCOUNTANT'],
    ['mitra@dutaagronusantara.farm', 'MITRA'],
  ] as const)('returns the documented %s session', (email, role) => {
    expect(getStaticDemoSession(email, 'Demo123!')).toMatchObject({
      token: `static-demo-${role.toLowerCase()}-session`,
      user: { email, role, status: 'Aktif', uid: `demo-${role.toLowerCase()}-local` },
    });
  });

  it('returns a one-click owner session without exposing credentials to the UI', () => {
    expect(getOneClickDemoSession()).toMatchObject({ user: { role: 'OWNER', email: 'owner@dutaagronusantara.farm' } });
  });

  it('restores a documented demo session from its persisted token', () => {
    expect(getStaticDemoSessionFromToken('static-demo-mitra-session')).toMatchObject({
      token: 'static-demo-mitra-session',
      user: { email: 'mitra@dutaagronusantara.farm', role: 'MITRA' },
    });
    expect(getStaticDemoSessionFromToken('unknown-token')).toBeNull();
  });

  it('rejects invalid credentials instead of bypassing authentication', () => {
    expect(getStaticDemoSession('owner@dutaagronusantara.farm', 'salah')).toBeNull();
    expect(getStaticDemoSession('unknown@dutaagronusantara.farm', 'Demo123!')).toBeNull();
  });

  it('permits fallback only when a static deployment cannot serve API requests', () => {
    expect(shouldUseStaticDemoFallback(undefined)).toBe(true);
    expect(shouldUseStaticDemoFallback(404)).toBe(true);
    expect(shouldUseStaticDemoFallback(405)).toBe(true);
    expect(shouldUseStaticDemoFallback(401)).toBe(false);
    expect(shouldUseStaticDemoFallback(500)).toBe(false);
  });
});
