import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UserProfile, UserRole } from '../types/index.js';

export interface ManagedUser extends UserProfile {
  createdAt: string;
  updatedAt: string;
}

interface StoredDevelopmentUser extends ManagedUser {
  passwordHash: string;
}

export const allowedRoles: UserRole[] = ['OWNER', 'ADMIN', 'USER'];

function normalizeRole(role: string): UserRole {
  if (role === 'OWNER' || role === 'ADMIN' || role === 'USER') return role;
  return 'USER';
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHash] = passwordHash.split(':');
  if (!salt || !storedHash) return false;
  const storedBuffer = Buffer.from(storedHash, 'hex');
  if (storedBuffer.length === 0) return false;
  const suppliedBuffer = scryptSync(password, salt, storedBuffer.length);
  return timingSafeEqual(storedBuffer, suppliedBuffer);
}

let developmentUsers: StoredDevelopmentUser[] = [];
const developmentDataPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../data/development-users.json');

function saveDevelopmentUsers() {
  mkdirSync(dirname(developmentDataPath), { recursive: true });
  writeFileSync(developmentDataPath, JSON.stringify(developmentUsers, null, 2), 'utf8');
}

function ensureDevelopmentUsers() {
  if (developmentUsers.length > 0) return;
  if (existsSync(developmentDataPath)) {
    try {
      const stored = JSON.parse(readFileSync(developmentDataPath, 'utf8')) as StoredDevelopmentUser[];
      if (Array.isArray(stored) && stored.length > 0) {
        developmentUsers = stored.map(user => ({ ...user, role: normalizeRole(String(user.role)) }));
        saveDevelopmentUsers();
        return;
      }
    } catch (error) {
      console.warn('Development user store could not be read; recreating defaults.', error);
    }
  }
  const password = process.env.DEMO_USER_PASSWORD || 'TernakDemo2026!';
  const now = new Date().toISOString();
  const accounts: Array<[string, string, UserRole]> = [
    [process.env.DEMO_USER_EMAIL || 'owner@ternak.local', process.env.DEMO_USER_NAME || 'Owner Sapi Papi Farm', 'OWNER'],
    ['admin@ternak.local', 'Administrator Farm', 'ADMIN'],
    ['user@ternak.local', 'Pengguna Katalog', 'USER'],
  ];
  developmentUsers = accounts.map(([email, displayName, role], index) => ({
    uid: index === 0 ? 'dev-owner' : `dev-${role.toLowerCase()}`,
    displayName, email, role, locationIds: [], status: 'Aktif', createdAt: now, updatedAt: now,
    passwordHash: hashPassword(password),
  }));
  saveDevelopmentUsers();
}

export function isDevelopmentAuthEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.DEMO_AUTH_ENABLED === 'true';
}

function withoutPassword(user: StoredDevelopmentUser): ManagedUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export function authenticateDevelopmentUser(email: string, password: string): ManagedUser | null {
  if (!isDevelopmentAuthEnabled()) return null;
  ensureDevelopmentUsers();
  const user = developmentUsers.find(item => item.email.toLowerCase() === email.toLowerCase());
  if (!user || user.status !== 'Aktif' || !verifyPassword(password, user.passwordHash)) return null;
  return withoutPassword(user);
}

export function findDevelopmentUser(uid: string): ManagedUser | null {
  ensureDevelopmentUsers();
  const user = developmentUsers.find(item => item.uid === uid);
  return user ? withoutPassword(user) : null;
}

export function listDevelopmentUsers(): ManagedUser[] {
  ensureDevelopmentUsers();
  return developmentUsers.map(withoutPassword);
}

export function createDevelopmentUser(input: Omit<UserProfile, 'uid'> & { password: string }): ManagedUser {
  ensureDevelopmentUsers();
  if (developmentUsers.some(user => user.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error('EMAIL_EXISTS');
  }
  const timestamp = new Date().toISOString();
  const user: StoredDevelopmentUser = {
    ...input,
    uid: randomUUID(),
    passwordHash: hashPassword(input.password),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  developmentUsers = [user, ...developmentUsers];
  saveDevelopmentUsers();
  return withoutPassword(user);
}

export function updateDevelopmentUser(uid: string, updates: Partial<Pick<UserProfile, 'displayName' | 'role' | 'phone' | 'status' | 'locationIds'>>): ManagedUser | null {
  ensureDevelopmentUsers();
  const index = developmentUsers.findIndex(user => user.uid === uid);
  if (index === -1) return null;
  developmentUsers[index] = { ...developmentUsers[index], ...updates, updatedAt: new Date().toISOString() };
  saveDevelopmentUsers();
  return withoutPassword(developmentUsers[index]);
}

export function resetDevelopmentPassword(uid: string, password: string): boolean {
  ensureDevelopmentUsers();
  const user = developmentUsers.find(item => item.uid === uid);
  if (!user) return false;
  user.passwordHash = hashPassword(password);
  user.updatedAt = new Date().toISOString();
  saveDevelopmentUsers();
  return true;
}
