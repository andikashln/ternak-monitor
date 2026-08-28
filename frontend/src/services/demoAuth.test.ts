import { describe, expect, it } from 'vitest';
import { getStaticDemoSession, shouldUseStaticDemoFallback } from './demoAuth';

describe('static demo authentication', () => {
  it('returns an owner session only for the documented demo credentials', () => {
    expect(getStaticDemoSession('owner@ternak.local', 'TernakDemo2026!')).toMatchObject({
      token: 'static-demo-owner-session',
      user: {
        uid: 'demo-owner-local',
        email: 'owner@ternak.local',
        role: 'OWNER',
        status: 'Aktif',
      },
    });
  });

  it('rejects invalid credentials instead of bypassing authentication', () => {
    expect(getStaticDemoSession('owner@ternak.local', 'wrong-password')).toBeNull();
    expect(getStaticDemoSession('other@example.com', 'TernakDemo2026!')).toBeNull();
  });

  it('permits fallback only when a static deployment cannot serve API requests', () => {
    expect(shouldUseStaticDemoFallback(undefined)).toBe(true);
    expect(shouldUseStaticDemoFallback(405)).toBe(true);
    expect(shouldUseStaticDemoFallback(401)).toBe(false);
    expect(shouldUseStaticDemoFallback(403)).toBe(false);
    expect(shouldUseStaticDemoFallback(500)).toBe(false);
  });
});
